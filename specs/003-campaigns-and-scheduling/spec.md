# Feature 003 — Campaigns and Scheduling

> **Status:** Runtime persistence, authoring APIs, and catalog-preview infrastructure approved. Schedule execution and email delivery remain out of scope.

## Problem, user, and outcome

NextPhish needs campaign documentation that explains how campaigns connect landing
pages, email templates, sending profiles, and target groups. The behavior is inspired
by Gophish, but NextPhish separates reusable campaign definitions from scheduling and
adds reusable templates and recurring schedule strategies.

**User:** Organization members who prepare and schedule phishing simulations.

**Outcome:** Readers can understand Gophish’s campaign workflow, NextPhish’s intended
campaign and scheduling model, the differences between them, and the boundary between
schedule creation and future schedule execution.

## Scope

In scope:

- Research and document the campaign behavior presented in the official Gophish user
  guide.
- Define NextPhish campaign, campaign-template, schedule, and campaign-run concepts.
- Define one-time and recurring schedule configuration.
- Define how campaigns connect pages, email templates, sending profiles, and target
  groups.
- Record lifecycle, timezone, cloning, delivery-configuration, and broken-reference
  behavior agreed during discovery.

Out of scope:

- Executing schedules or delivering email.
- Worker/queue recurrence processing and provider-specific send enforcement.
- Defining provider-specific rate enforcement, retries, sending windows, weekends,
  holidays, or delivery-failure recovery.
- Treating unverified Gophish behavior as a NextPhish requirement.

## Terminology

| Term              | Meaning                                                                                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Campaign template | A reusable, organization-owned campaign definition. It selects campaign assets but does not select a target group or own schedule configuration; schedules may select it as source material.                        |
| Campaign          | A concrete, non-template campaign. It includes a target group and can be scheduled now or later.                                                                                                                    |
| Schedule          | Configuration that determines when and with what delivery pattern one or more source-derived campaigns are created. Its source is a concrete campaign or campaign template. It does not send email in this feature. |
| Campaign run      | The independent, immutable-history campaign created for a scheduled occurrence by cloning a campaign template. Future execution work will operate on this record.                                                   |
| Blast             | A delivery configuration that targets all recipients without intentional pacing.                                                                                                                                    |
| Drip              | A rate-based delivery configuration, expressed as a configurable number of emails per minute.                                                                                                                       |
| Batch             | A chunk-based delivery configuration, expressed as a configurable batch size and interval.                                                                                                                          |
| Deck              | A finite ordered set of campaign templates from which one campaign is used per recurrence.                                                                                                                          |

## Gophish reference behavior

Verified on 2026-07-21 against the official
[Gophish Campaigns guide](https://docs.getgophish.com/user-guide/documentation/campaigns):

- Gophish combines campaign definition, recipient-group selection, scheduling, and
  launch in one campaign workflow.
- Required configuration includes name, email template, landing page, phishing-server
  URL, launch date, optional send-by date, sending profile, and one or more groups.
- Launch Date defaults to immediate sending.
- Without Send Emails By, Gophish attempts to send immediately and as quickly as
  possible. With it, Gophish spreads messages evenly between launch and that deadline.
- Launching redirects to campaign results, which include campaign status, per-target
  status, recipient event timelines, and browser/device information.
- Results and raw events can be exported. Campaigns can be manually completed or
  permanently deleted. Captured credentials can be displayed when enabled by the
  landing page.

The cited guide does not describe reusable campaign templates, recurring schedules,
Deck or Random strategies, organization timezones, large-group pacing recommendations,
or automatic completion durations. Those are NextPhish decisions.

## NextPhish product behavior

### Campaign composition

A campaign connects:

- one email template;
- one landing page;
- one sending profile; and
- for a concrete campaign, one target group.

Only resources belonging to the selected organization are eligible.

### Campaign templates and concrete campaigns

- A campaign is explicitly either a template or a concrete campaign.
- A campaign template omits target-group selection and cannot own schedule
  configuration directly; it is selected as reusable source material in the Schedule
  area.
- Campaign templates are listed as selectable source material in the Schedule area.
- A concrete campaign includes a target group and exposes a direct **Schedule now or
  later** flow.
- Converting between a template and a concrete campaign is a clone operation, not an
  in-place type mutation. The source remains unchanged and a new campaign record is
  produced.
- Cloning a concrete campaign into a template omits its target-group association.
  Cloning a template into a concrete campaign requires target-group selection before
  the clone is complete.

### One-time schedules

- A one-time schedule authored in the Schedule area selects exactly one campaign
  template and one target group.
- A one-time schedule launched directly from a concrete campaign uses that campaign as
  its source and retains its selected target group.
- It can be configured for now or a future local date and time.
- At the occurrence, the schedule source is cloned into an independent concrete
  campaign. A template-based schedule applies its selected target group to the clone.
- When the concrete campaign is created, its complete state and referenced resources
  are copied into private, immutable relational shadow copies.
- The persisted instant is UTC. Display and entry use the campaign target timezone.

### Delivery configuration

Schedule authoring offers these selectable modes:

1. **Blast** — all recipients are eligible without intentional pacing.
2. **Drip** — a configurable emails-per-minute target.
3. **Batch** — a configurable number of recipients per configurable interval.

When the selected target group contains more than 600 recipients, the schedule UI
recommends Drip and preselects **60 emails per minute**. This is a default, not a
maximum. The user may select another delivery mode or configure another target rate.
Actual sending and enforcement are not part of this feature.

### Repeating schedules

A repeating schedule selects one or more campaign templates, one target group, a
recurrence rule, and a selection strategy.

#### Deck strategy

- One template is selected from the deck for each recurrence.
- Each template is used at most once by that schedule.
- The schedule stops when the deck is exhausted.
- Optional shuffle randomizes deck order before the first occurrence.

#### Random strategy

- One template is selected randomly for each recurrence.
- The selector should avoid choosing the same template on consecutive occurrences
  when at least two eligible templates exist.
- Random schedules do not end by exhausting templates. End conditions are optional, so
  they may continue until manually cancelled.

#### Repeater end conditions

- A repeating schedule may configure **Maximum campaigns sent**, **End date**, both, or
  neither.
- If both conditions are configured, the first condition reached stops the schedule.
- Deck exhaustion remains an additional stop condition.
- Repeaters are also subject to the general schedule-cancellation behavior below.
- Repeater end conditions remain editable while the schedule is running, including
  while one of its campaigns is active.

#### Schedule editing and rescheduling

- Every schedule field is editable before the schedule starts.
- A one-time schedule locks when its campaign enters `pending_start`.
- A multi-campaign schedule allows all fields to be edited between active campaigns,
  when none of its campaigns is `pending_start`, `active`, or `paused`.
- Saving an edit recalculates and reschedules every affected future campaign.
- Already-started `active` or `paused` campaigns and terminal `completed` or `failed`
  campaigns are never changed by a parent schedule edit.
- Affected campaigns still in `scheduled` are rebuilt with revised timing,
  configuration, and hidden relational shadow copies before entering `pending_start`.
- End-condition editing is the exception and remains available while the repeater is
  running without mutating an active campaign.

#### Schedule duplication and collision warning

- A duplicated schedule is an independent copy of configuration; it does not share
  lifecycle state or history with its source.
- Before saving, NextPhish detects an existing schedule with the same campaign source,
  equivalent scheduling properties, and the same date/time.
- A detected collision produces a clear warning but never blocks saving. The user is
  responsible for reviewing or correcting independent duplicate schedules.

#### Schedule cancellation

- Any schedule can be cancelled at any time.
- Cancellation prevents future occurrences and records the schedule as cancelled.
- Every nonterminal campaign from that schedule in `scheduled`, `pending_start`,
  `active`, or `paused` transitions to `completed`.
- Campaigns already in `completed` or `failed` remain unchanged.
- Campaigns are not directly cancelled; cancellation completes all not-started,
  started, and paused campaigns so none can later begin or resume.

### Recurrence configuration

Recurrence is configured with calendar fields rather than an interval measured from
execution time.

| Frequency   | Configuration                                        |
| ----------- | ---------------------------------------------------- |
| Weekly      | Weekday and local time                               |
| Monthly     | Day of month and local time                          |
| Quarterly   | Month within quarter, day of month, and local time   |
| Half-yearly | Month within half-year, day of month, and local time |
| Yearly      | Month, day of month, and local time                  |

For any recurrence whose requested day does not exist in a selected month, the
occurrence falls on that month’s final calendar day.

### Timezones

- Stored schedule instants use UTC (`UTC+00:00`).
- Each organization exposes a default IANA timezone setting.
- Each concrete campaign and schedule exposes a target timezone initialized from the
  selected organization’s default.
- Calendar fields are interpreted and displayed in the target timezone, then converted
  to UTC for persistence.
- Changing the organization default does not silently change an already-selected
  campaign/schedule target timezone.

#### Daylight-saving policy

Use a deterministic policy equivalent to Temporal’s `compatible` disambiguation:

- Move a nonexistent spring-forward local time forward by the size of the timezone
  gap, preserving its minute offset within the hour.
- Resolve an ambiguous fall-back local time to the earlier instant and create only one
  occurrence.
- Persist the resolved UTC instant together with the timezone and recurrence rule.

This policy preserves one occurrence and prevents duplicate sends.

### Concrete campaign lifecycle

```text
draft -> published -> scheduled
scheduled -> pending_start | completed (schedule cancellation)
pending_start -> active | paused | failed | completed (schedule cancellation)
active -> paused | completed
paused -> active | completed
```

- `draft` may transition to `published`.
- `published` may transition to `scheduled`.
- `scheduled` may transition to `pending_start` or to `completed` when its schedule is
  cancelled.
- `pending_start` may transition to `active`, `paused`, `failed`, or to `completed` when
  its schedule is cancelled.
- `active` may transition to `paused` or `completed`.
- `paused` may transition to `active` or `completed`. Once resumed, normal active
  transitions apply again.
- `completed` and `failed` are terminal.
- Once active, campaign definition and occurrence-level launch fields are not editable.
  Available direct user actions are Pause and Complete. Cancelling the parent schedule
  completes all of its nonterminal campaigns. Other parent schedule edits follow the
  schedule-editing windows and never mutate the active campaign.
- While paused, available user actions are Resume and Complete.
- There is no started-campaign cancel transition.

The state contract does not bring schedule execution into this documentation feature.

### Completion

- A schedule may define an explicit end date, after which it is marked completed and
  produces no further occurrences.
- A repeating schedule may instead or additionally define a maximum-campaign count or
  be cancelled manually.
- Every created campaign also has an automatic completion duration measured from its
  send/start time.
- The automatic duration defaults to **20 days**.
- Automatic completion can be disabled; its persisted value is then `null`.
- The recommended form control is an **Automatically complete campaign** toggle that
  reveals the number-of-days field when enabled.
- A finite deck schedule also completes when its deck is exhausted, even if its
  configured completion date is later or absent.

### Cloning, hidden relational shadow copies, and history

- Every schedule occurrence clones its concrete-campaign or template source into its
  own concrete campaign.
- Before a materialized occurrence enters `pending_start`, NextPhish transactionally creates hidden relational shadow copies of the complete campaign configuration and every required referenced resource, including the email template, landing page, sending profile, target group, and deduplicated target-group membership.
- Shadow copies use the normal resource tables with `SHADOW` visibility. They are private implementation records: they do not appear in normal listings, pickers, or MCP tools, cannot be reused or edited independently, and remain bound to the created campaign.
- Shadow attachment file records share immutable stored objects with their catalog sources. Stored object bytes are deleted only after their final file reference is removed.
- Source edits, archival, or deletion after shadow-copy creation do not change an
  already-created campaign.
- Each resulting campaign has independent identity, immutable relational shadow state, and
  immutable execution/history attribution.
- Rescheduling an affected not-started campaign rebuilds its relational shadow copies. Active,
  paused, completed, and failed campaigns keep their existing relational shadow copies.

### Missing, archived, or unusable references

- Archived or otherwise ineligible templates/assets do not appear in pickers for new
  campaigns or schedules.
- A schedule or not-yet-created campaign is not silently removed when a referenced
  template, page, email template, sending profile, or target group becomes unavailable.
- Its list row is marked **Broken** and provides a tooltip identifying the missing or
  unusable dependency.
- An already-created campaign with complete hidden relational shadow copies continues
  from those copies and is not broken solely because an original source later changes,
  archives, or is deleted.
- Broken schedules cannot create a new occurrence until repaired.
- Repair uses the normal Edit flow and validation. Saving clears **Broken** only after
  every required dependency is valid and reschedules/rebuilds affected future
  campaigns.
- Destructive operations must not silently substitute another resource.

### Authorization

- Use the existing Better Auth organization permission system.
- Add a `campaigns` subject with the project-standard `read` and `write` actions.
- Better Auth `campaigns`/`read` (scope `read:campaigns`) covers
  campaign/template/schedule listing and detail access.
- Better Auth `campaigns`/`write` (scope `write:campaigns`) covers creation, cloning,
  publishing, scheduling, editing,
  repairing, pausing, resuming, completing, cancelling, and duplication.
- Existing organization membership and active-organization scoping remain mandatory;
  no parallel permission mechanism is introduced.

### Recipient uniqueness

- Within one campaign, a canonical email address may be sent to only once.
- Future multi-group targeting deduplicates recipients by normalized email before send
  work is created, including case and surrounding-whitespace differences.
- Provider-specific aliases are not treated as equivalent unless a future requirement
  explicitly adds that behavior.
- The campaign’s hidden shadow target group stores the deduplicated recipient set.

## Authoritative product documentation

The reader-facing behavior and Gophish comparison are documented in
[`research/campaigns-and-scheduling.md`](research/campaigns-and-scheduling.md).

## Current repository baseline

At discovery time:

- Email templates, pages, sending profiles, and target groups already have
  organization-scoped product areas and persistence models.
- The Schedule route exists only as a “coming soon” placeholder.
- The navigation mentions Campaigns, but there is no campaign domain model or campaign
  page implementation in the checked source.
- Organization persistence does not yet expose the required default timezone field.

These observations describe the current repository and are not implementation work in
this feature.

## Acceptance criteria

| ID    | Acceptance criterion                                                                                                                                                                                                                                                                               |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Documentation clearly separates verified Gophish behavior from NextPhish-specific decisions.                                                                                                                                                                                                       |
| AC-02 | Documentation explains how campaign assets and target groups are selected for templates and concrete campaigns.                                                                                                                                                                                    |
| AC-03 | Documentation states that type conversion clones rather than mutates the source.                                                                                                                                                                                                                   |
| AC-04 | One-time schedules created in the Schedule area select exactly one template and one target group; direct concrete-campaign schedules retain their source target group; both support now/future configuration.                                                                                      |
| AC-05 | Blast, Drip, and Batch are presented as selectable delivery configurations; groups over 600 trigger a configurable 60/minute Drip recommendation.                                                                                                                                                  |
| AC-06 | Deck and Random strategy semantics, stopping behavior, shuffle behavior, repeat avoidance, optional maximum-campaign/end-date conditions, manual cancellation, and end-condition editing are explicit.                                                                                             |
| AC-07 | Weekly, monthly, quarterly, half-yearly, and yearly calendar configuration and missing-day fallback are documented.                                                                                                                                                                                |
| AC-08 | UTC persistence, organization default timezone, campaign/schedule target timezone behavior, and the approved DST gap/overlap policy are documented without implying that local calendar fields are stored as UTC text.                                                                             |
| AC-09 | Schedule end date, optional maximum-campaign count, manual cancellation, 20-day default campaign auto-completion, nullable disable behavior, and deck exhaustion are documented.                                                                                                                   |
| AC-10 | Each occurrence produces an independently identifiable concrete campaign with hidden immutable relational copies of its full campaign/resource state at campaign creation.                                                                                                                         |
| AC-11 | Broken-reference visibility and picker exclusion behavior are documented, including the rule that complete relational shadow copies isolate already-created campaigns from later source changes or deletion.                                                                                       |
| AC-12 | Documentation explicitly excludes sending and schedule execution from this feature.                                                                                                                                                                                                                |
| AC-13 | The concrete campaign state machine uses `draft`, `published`, `scheduled`, `pending_start`, `active`, `paused`, `completed`, and `failed`; cancellation additionally permits scheduled/pending campaigns to complete, active can become paused/completed, and paused can become active/completed. |
| AC-14 | Every schedule field is editable before start; a multi-campaign schedule is also fully editable between active campaigns, and saving reschedules every affected future/scheduled campaign without changing started or terminal campaigns.                                                          |
| AC-15 | A schedule can be cancelled at any time; cancellation prevents future occurrences, records the cancellation, and transitions all `scheduled`, `pending_start`, `active`, and `paused` child campaigns to `completed`.                                                                              |
| AC-16 | Duplicated schedules are independent; an equivalent campaign/configuration/date collision produces a non-blocking warning before save.                                                                                                                                                             |
| AC-17 | Broken records are repaired through normal Edit and validation, with affected future campaigns rescheduled/rebuilt after a valid save.                                                                                                                                                             |
| AC-18 | Better Auth exposes a `campaigns` subject with `read` and `write` actions, preserving organization scoping.                                                                                                                                                                                        |
| AC-19 | A campaign deduplicates its shadow recipient set by normalized email so one address receives at most one send per campaign, including future multi-group targeting.                                                                                                                                |

## Catalog previews

- Email-template and page catalogs use best-effort preview images generated in an authenticated user's browser from a persisted content revision and inert dummy data.
- Preview rendering is sandboxed and must not enable scripts, forms, navigation, or popups.
- The browser uploads a bounded PNG or WebP. The backend verifies organization ownership, image type and dimensions, and performs a revision compare-and-swap before marking it ready.
- Preview images are derived caches. Missing, failed, or stale previews display a placeholder and can be regenerated.
- Preview images are served through an authenticated organization-scoped route rather than a public object-storage URL.
- Client-side generation intentionally avoids requiring a headless browser in service workers.

## Deferred execution scope

The original product questions are resolved. Provider/worker implementation of Blast,
Drip, Batch, retries, and actual delivery remains intentionally deferred to the later
schedule-execution feature.
