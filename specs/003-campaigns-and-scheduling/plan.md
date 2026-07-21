# Documentation plan

## Documentation design

Create `research/campaigns-and-scheduling.md` as the reader-facing product contract
and keep `spec.md` as its requirements and acceptance-criteria source.

The document has three evidence layers:

1. **Verified Gophish behavior** — only behavior stated by the cited official campaign
   guide.
2. **NextPhish behavior** — product decisions confirmed during discovery.
3. **Deferred execution boundary** — provider/worker behavior intentionally reserved
   for the later execution feature.

## Structure

1. Cite the official Gophish Campaigns guide and verification date.
2. Summarize Gophish campaign configuration, scheduling, launch, results, export,
   completion, deletion, and captured-result behavior.
3. Define NextPhish campaign templates, concrete campaigns, schedules, and scheduled
   campaign instances.
4. Document direct scheduling and template-based scheduling flows.
5. Define Blast, Drip, and Batch configuration and the more-than-600-recipient
   recommendation.
6. Define Deck and Random repeater behavior.
7. Define recurrence, timezone, DST policy, campaign lifecycle, repeater end
   conditions, schedule editing/cancellation, completion, immutable shadow snapshots,
   and broken-dependency behavior.
8. Provide a direct Gophish-versus-NextPhish comparison.
9. List unresolved decisions and the schedule-execution boundary.

## Evidence flow

```text
official Gophish guide + confirmed product answers
                        |
                        v
        specs/003.../spec.md requirements
                        |
                        v
       research/campaigns-and-scheduling.md
                        |
                        v
         documentation review/test cases
```

## Risks and controls

| Risk                                                      | Control                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Gophish behavior is presented as a NextPhish requirement  | Separate sections and comparison table.                                              |
| Features absent from the source are attributed to Gophish | Limit claims to the official campaign page and state when the guide is silent.       |
| Sending behavior leaks into this feature                  | Repeatedly state that delivery and execution are deferred.                           |
| UTC persistence is confused with UTC-only user input      | Explain target-timezone entry/display and UTC conversion separately.                 |
| Template cloning is confused with in-place conversion     | Explicitly preserve the source and create a new record.                              |
| Mutable sources alter an existing campaign                | Require hidden immutable snapshots at campaign creation and hide them from listings. |
| Permission behavior diverges from the existing project    | Use Better Auth subject `campaigns` with standard `read`/`write` actions.            |

## Completion condition

Documentation is complete when every acceptance criterion in `spec.md` is represented
without contradiction, all DOC-CAM cases pass by review, and no runtime code has been
changed.
