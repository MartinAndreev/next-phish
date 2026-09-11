// Materialize the wire contract from the real router without importing server
// code at runtime or exposing private workspace/Prisma types to npm consumers.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const appRoot = fileURLToPath(
  new URL("../../../apps/next-app/", import.meta.url),
);
process.chdir(appRoot);
const configPath = `${appRoot}tsconfig.json`;
const config = ts.readConfigFile(configPath, ts.sys.readFile);
if (config.error)
  throw new Error(
    ts.flattenDiagnosticMessageText(config.error.messageText, "\n"),
  );
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, appRoot);
const routerPath = `${appRoot}src/server/trpc/router.ts`;
const program = ts.createProgram(
  [routerPath, `${appRoot}node_modules/next/types/global.d.ts`],
  { ...parsed.options, incremental: false },
);
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) {
  throw new Error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (name) => name,
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getNewLine: () => "\n",
    }),
  );
}
const checker = program.getTypeChecker();
const source = program.getSourceFile(routerPath);
const routerSymbol = checker
  .getExportsOfModule(checker.getSymbolAtLocation(source))
  .find((symbol) => symbol.name === "appRouter");
const router = checker.getTypeOfSymbolAtLocation(routerSymbol, source);

function property(type, name) {
  const symbol = type.getProperty(name);
  if (!symbol)
    throw new Error(`Missing ${name} in ${checker.typeToString(type)}`);
  return checker.getTypeOfSymbolAtLocation(symbol, source);
}

const aliases = new Map();
const declarations = [];
function render(type) {
  if (type.flags & ts.TypeFlags.StringLiteral)
    return JSON.stringify(type.value);
  if (type.flags & ts.TypeFlags.NumberLiteral) return String(type.value);
  if (
    type.flags &
    (ts.TypeFlags.Any |
      ts.TypeFlags.Unknown |
      ts.TypeFlags.Never |
      ts.TypeFlags.String |
      ts.TypeFlags.Number |
      ts.TypeFlags.Boolean |
      ts.TypeFlags.BooleanLiteral |
      ts.TypeFlags.Void |
      ts.TypeFlags.Undefined |
      ts.TypeFlags.Null |
      ts.TypeFlags.BigInt |
      ts.TypeFlags.BigIntLiteral)
  ) {
    return checker.typeToString(type);
  }
  if (type.getSymbol()?.name === "Date") return "Date";
  if (aliases.has(type)) return aliases.get(type);
  const name = `Type${aliases.size}`;
  aliases.set(type, name);
  let body;
  if (type.isUnionOrIntersection()) {
    body = type.types.map(render).join(type.isUnion() ? " | " : " & ");
  } else if (checker.isTupleType(type)) {
    // Fail closed if the API adds a tuple requiring optional/rest preservation.
    if (
      type.target.elementFlags.some((flag) => flag !== ts.ElementFlags.Required)
    ) {
      throw new Error(`Unsupported tuple: ${checker.typeToString(type)}`);
    }
    body = `[${checker.getTypeArguments(type).map(render).join(", ")}]`;
  } else if (
    checker.isArrayType(type) ||
    type.getBaseTypes()?.some((base) => checker.isArrayType(base))
  ) {
    body = `Array<${render(type.getNumberIndexType())}>`;
  } else if (type.flags & ts.TypeFlags.Object) {
    if (
      type.getCallSignatures().length ||
      type.getConstructSignatures().length
    ) {
      throw new Error(`Non-data API type: ${checker.typeToString(type)}`);
    }
    const fields = type.getProperties().map((symbol) => {
      const optional = symbol.flags & ts.SymbolFlags.Optional ? "?" : "";
      return `${JSON.stringify(symbol.name)}${optional}: ${render(checker.getTypeOfSymbolAtLocation(symbol, source))};`;
    });
    for (const index of checker.getIndexInfosOfType(type)) {
      fields.push(`[key: ${render(index.keyType)}]: ${render(index.type)};`);
    }
    body = `{ ${fields.join(" ")} }`;
  } else {
    throw new Error(`Unsupported API type: ${checker.typeToString(type)}`);
  }
  declarations.push(`type ${name} = ${body};`);
  return name;
}

// These modules use createPermissionProcedure and check PAT scopes. Session,
// admin, token-management, and subscription APIs are deliberately not exported.
const modules = [
  "organization",
  "emailTemplate",
  "file",
  "page",
  "job",
  "targetGroup",
  "mailSending",
  "campaign",
  "task",
];
const record = modules.map((moduleName) => {
  const module = property(router, moduleName);
  const procedures = module.getProperties().flatMap((symbol) => {
    const procedure = checker.getTypeOfSymbolAtLocation(symbol, source);
    const def = property(procedure, "_def");
    const kind = property(def, "type").value;
    if (kind === "subscription") return [];
    if (kind !== "query" && kind !== "mutation")
      throw new Error(`Unsupported procedure ${symbol.name}`);
    const types = property(def, "$types");
    const input = render(property(types, "input"));
    let output;
    try {
      output = render(property(types, "output"));
    } catch (error) {
      throw new Error(`${moduleName}.${symbol.name}: ${error.message}`, {
        cause: error,
      });
    }
    return [
      `${JSON.stringify(symbol.name)}: ${kind === "query" ? "TRPCQueryProcedure" : "TRPCMutationProcedure"}<{ input: ${input}; output: ${output}; meta: unknown }>;`,
    ];
  });
  return `${JSON.stringify(moduleName)}: { ${procedures.join("\n")} };`;
});

writeFileSync(
  new URL("../src/router.generated.ts", import.meta.url),
  `// Generated by scripts/generate-router.mjs. Do not edit.\nimport type { TRPCBuiltRouter, TRPCDefaultErrorShape, TRPCQueryProcedure, TRPCMutationProcedure } from "@trpc/server";\n${declarations.join("\n")}\nexport type ApiRouter = TRPCBuiltRouter<{ ctx: object; meta: object; errorShape: TRPCDefaultErrorShape; transformer: true }, {\n${record.join("\n")}\n}>;\n`,
);
