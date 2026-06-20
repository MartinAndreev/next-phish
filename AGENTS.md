<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

Read `docs/architecture.md` before making architectural decisions. It documents the stack, folder structure, and conventions (tRPC, Prisma, BetterAuth, TypeDI, class-transformer, Atomic Design).

Read `docs/coding-standards.md` for state management patterns, hook conventions, and other coding guidelines.

Read `docs/brand.md` for the color palette, gradient usage, and accessibility rules when styling UI.

**IMPORTANT:** NEVER push to remote unless the user explicitly asks you to. Always wait for confirmation before running `git push`.

Run `npx react-doctor@latest --no-telemetry` as part of your checks before committing React component changes. This catches common React issues like missing key props, unnecessary re-renders, and accessibility problems.
