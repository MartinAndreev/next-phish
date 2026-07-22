# Tasks

## Research and product decisions

- [x] T001 — Read the official Gophish Campaigns guide and record only directly
      supported campaign behavior.
- [x] T002 — Record the confirmed NextPhish differences and retain unresolved product
      questions without assumptions.
- [x] T003 — Inspect the repository baseline for existing campaign/schedule support and
      related organization-scoped resources.

## Documentation

- [x] T004 — Define campaign template, campaign, schedule, and scheduled campaign
      instance terminology.
- [x] T005 — Document one-time scheduling and direct scheduling from a concrete
      campaign.
- [x] T006 — Document Blast, Drip, Batch, the 600-recipient threshold, and configurable
      60/minute recommendation.
- [x] T007 — Document Deck, Random, recurrence, timezone, completion, cloning, and
      broken-dependency behavior.
- [x] T008 — Add a source-backed Gophish comparison and explicitly exclude sending and
      schedule execution.

## Review

- [x] T009 — Validate `research/campaigns-and-scheduling.md` against all acceptance
      criteria and the official source.
- [x] T010 — Resolve terminology or contradiction findings without adding new product
      behavior.
- [x] T011 — Record the remaining provider/worker execution boundary for the future
      schedule-execution specification.
- [x] T012 — Add the approved daylight-saving policy and the confirmed concrete
      campaign lifecycle without expanding schedule execution scope.
- [x] T013 — Document optional repeater end date and maximum-campaign conditions,
      manual cancellation, and end-condition editing for running repeaters.
- [x] T014 — Document full pre-start and between-campaign schedule editing, including
      mandatory rescheduling of every affected future campaign.
- [x] T015 — Document cancellation at any time, completion of nonterminal child
      campaigns, and hidden immutable resource snapshots created per campaign.
- [x] T016 — Resolve schedule duplication warnings, normal-edit repair, Better Auth
      `campaigns` permissions, and normalized-email recipient deduplication.
