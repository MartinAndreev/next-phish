# Task for worker

You are a delegated subagent running from a fork of the parent session. Treat the inherited conversation as reference-only context, not a live thread to continue. Do not continue or answer prior messages as if they are waiting for a reply. Your sole job is to execute the task below and return a focused result for that task using your tools.

Task:
Implement runtime Feature 003 end-to-end in /home/marto/Projects/next-phish, while actual schedule execution and email sending remain out of scope. User approved: (1) relational shadow resource copies are materialized transactionally before pending_start, not JSON snapshots; (2) catalog previews are best-effort client-browser screenshots with placeholders; (3) attachments share immutable stored objects rather than duplicating R2 bytes. Follow AGENTS.md and docs architecture/coding/brand. Read relevant Next.js 16 docs under node_modules/next/dist/docs before changing Next code. Update product docs/spec to capture approved decisions.

Required implementation: Prisma schema + checked-in migration for Organization.defaultTimezone, campaigns/schedules/sources, lifecycle/delivery/recurrence enums and fields, ResourceVisibility shadow metadata on EmailTemplate/Page/MailSendingProfile/TargetGroup, canonical normalized shadow recipients, immutable StoredObject abstraction used by File references, preview persistence/status/revision and CATALOG_PREVIEW purpose; preserve existing behavior/data through migration. Implement campaign/schedule backend DDD module with org scoping, validation, commands/queries, transactional materialization that clones complete resources relationally and locks shadows from public CRUD, lifecycle/edit/cancel/duplicate/broken handling as feasible without execution. Add campaigns permissions to shared and BetterAuth roles. Add tRPC router. Implement campaigns and schedules UI replacing placeholder, respecting Formik+Zod, container/presentation, hooks, force-dynamic/loading. Implement email/page catalog previews generated in browser from persisted revision using sanitized sandboxed rendering and a safe canvas library if suitable; dedicated bounded PNG/WebP upload/finalize endpoint or tRPC path; revision compare-and-swap; private/authenticated serving (do not use public R2 URL). Existing catalog rows/pickers/CRUD/MCP must exclude and reject SHADOW resources. Add tests for critical domain behavior and repository visibility. Do not implement workers, queue recurrence execution, or actual sending. Do not run git push or commit. Run formatting as targeted, Prisma validate/generate, tests, typecheck, lint, and react-doctor for React changes; fix failures caused by changes. If the full UI is too large, prioritize a complete persistence/domain/API implementation plus safe preview infrastructure and clearly report any residual UI work rather than stubbing unsafe behavior.

## Acceptance Contract

Acceptance level: reviewed
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:

- criterion-1: Implement the requested change without widening scope
- criterion-2: Return evidence sufficient for an independent acceptance review

Required evidence: changed-files, tests-added, commands-run, validation-output, residual-risks, no-staged-files

Review gate: optional by reviewer.

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
    },
    {
      "id": "criterion-2",
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
