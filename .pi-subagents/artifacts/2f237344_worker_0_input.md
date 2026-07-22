# Task for worker

You are a delegated subagent running from a fork of the parent session. Treat the inherited conversation as reference-only context, not a live thread to continue. Do not continue or answer prior messages as if they are waiting for a reply. Your sole job is to execute the task below and return a focused result for that task using your tools.

Task:
Continue the current uncommitted Feature 003 implementation as the sole writer. Implement the remaining user-facing slice and address foundation defects. Read relevant Next.js 16 docs in node_modules/next/dist/docs before Next edits.

1. Add shared Formik+Zod schemas/types needed by UI. Implement Campaign pages (/campaigns list, /campaigns/new, /campaigns/[id]) and Schedule pages (replace placeholder list, /schedule/new, detail/edit where practical), using existing atomic/PrimeReact patterns, custom tRPC hooks, force-dynamic/loading. Campaign authoring must present email templates and pages as visual catalog cards with stored preview images, plus sending profile and target group selection. Support template/concrete, publish, clone, create schedule, delivery modes and recurrence configuration. Keep actual recurrence execution/send out of scope.
2. Implement best-effort client screenshot producer after successful persisted email-template/page saves and a manual regenerate action. Use a safe established browser canvas package if needed. Render fixed dummy data, sanitize/disable scripts/navigation/forms, fixed viewport, bounded PNG/WebP, upload through existing revision-bound endpoint. Missing/stale/failed preview uses placeholder. Catalog list APIs/types must return preview id/status/url and contentRevision.
3. Add campaign lifecycle write APIs for pause/resume/complete with allowed transitions. Do not expose occurrence materialization publicly unless needed internally.
4. Fix known correctness issues: page shadow cloning must handle redirect cycles/reuse via a clone map; email template update + file links + preview stale marking should be transactional; page update + stale marking transactional; validate IANA timezone input; enforce delivery-mode irrelevant fields and recurrence-required fields; schedule source order/fingerprint semantics; ensure preview upload compare-and-swap rechecks revision inside transaction and does not delete old R2 data before a successful replacement; protect shadow records in every public path touched.
5. Add/update tests for critical new behavior. Update docs if UI behavior clarifies contract.
6. Run targeted formatting, prisma generate/validate, tests, typecheck, lint, and npx react-doctor@latest --no-telemetry. Fix failures caused by changes. Do not commit or push. Keep scope focused and report residual limitations honestly.

## Acceptance Contract

Acceptance level: verified
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:

- criterion-1: Implement the requested change without widening scope

Required evidence: changed-files, tests-added, commands-run, validation-output, residual-risks, no-staged-files

Finish with a fenced JSON block tagged `acceptance-report` in this shape:
Use empty arrays when no items apply; array fields contain strings unless object entries are shown.
`criteriaSatisfied[].status` must be exactly one of: satisfied, not-satisfied, not-applicable.
`commandsRun[].result` must be exactly one of: passed, failed, not-run.
`manualNotes` and `notes` are optional strings; an empty string means no note and does not satisfy `manual-notes` evidence.

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "specific proof"
    }
  ],
  "changedFiles": [
    "src/file.ts"
  ],
  "testsAddedOrUpdated": [
    "test/file.test.ts"
  ],
  "commandsRun": [
    {
      "command": "command",
      "result": "passed",
      "summary": "short result"
    }
  ],
  "validationOutput": [
    "validation output or concise summary"
  ],
  "residualRisks": [
    "none"
  ],
  "noStagedFiles": true,
  "diffSummary": "short description of the diff",
  "reviewFindings": [
    "blocker: file.ts:12 - issue found, or no blockers"
  ],
  "manualNotes": "anything else the parent should know"
}
```
