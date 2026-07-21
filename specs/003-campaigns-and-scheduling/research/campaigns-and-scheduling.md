# Campaigns and scheduling

This document describes how campaigns work in Gophish and defines the intended
NextPhish campaign and scheduling model. It is a product contract, not an
implementation guide.

## Source and scope

Gophish behavior was verified against the official
[Gophish Campaigns guide](https://docs.getgophish.com/user-guide/documentation/campaigns)
on 2026-07-21. Statements under **Gophish behavior** summarize that source. Statements
under **NextPhish behavior** are intentional product decisions and may differ from
Gophish.

This feature covers creating campaigns, campaign templates, and schedules. It does
**not** cover schedule execution, email delivery, provider throttling, retries, or
failure recovery.

## Gophish behavior

### Campaign purpose

Gophish centers its workflow on launching a campaign. A campaign sends email to one or
more recipient groups and monitors campaign activity, including:

- email opens;
- link clicks; and
- submitted credentials.

### Required campaign configuration

The Gophish campaign dialog collects:

| Field           | Purpose                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------- |
| Name            | Identifies the campaign.                                                                            |
| Email Template  | Supplies the message sent to recipients.                                                            |
| Landing Page    | Supplies the HTML returned after a recipient follows the phishing link.                             |
| URL             | Populates the `{{.URL}}` template value. It normally points to a reachable Gophish phishing server. |
| Launch Date     | Determines when sending starts; the default is immediately.                                         |
| Send Emails By  | Optionally spreads sends evenly from the launch date through this date.                             |
| Sending Profile | Supplies the SMTP configuration used for sending.                                                   |
| Groups          | Selects one or more recipient groups included in the campaign.                                      |

Gophish combines campaign definition, target selection, and scheduling in the same
launch flow.

### Scheduling and launch

Gophish uses two dates:

1. **Launch Date** — when sending begins. It defaults to immediate launch.
2. **Send Emails By** — an optional deadline by which all campaign messages should be
   sent.

Without a **Send Emails By** date, Gophish attempts to send messages immediately and
as quickly as possible. When the field is set, Gophish spreads sends evenly between
the launch date and the deadline.

After configuration, the operator selects **Launch Campaign** and confirms the action.
Gophish either starts immediately or waits until the configured launch date.

### Results and lifecycle

After launch, Gophish redirects to a results screen with campaign-level status and
per-target results. Each target can expose a timeline of events such as email opens,
link clicks, and submitted data. Gophish may also show browser and operating-system
information parsed from the browser user-agent.

Gophish supports:

- exporting current per-target results as CSV;
- exporting raw campaign events;
- manually marking a campaign complete; and
- permanently deleting a campaign after confirmation.

If a landing page captures credentials, Gophish can display those captured values in
the recipient result details.

## NextPhish behavior

## Core concepts

### Campaign template

A campaign template is a reusable campaign definition. It selects:

- one email template;
- one landing page;
- one sending profile; and
- the campaign URL and other campaign-level settings required by the eventual
  campaign form.

A campaign template does **not** select a target group and cannot own schedule
configuration. It appears in the Schedule area as reusable source material.

### Campaign

A campaign is a concrete phishing simulation definition. It contains everything in a
campaign template plus one target group. A concrete campaign exposes a direct
**Schedule now or later** action.

A campaign is marked either as a template or non-template when created. Changing from
one kind to the other does not mutate the original record:

- **Campaign to template:** clone the campaign and omit its target group.
- **Template to campaign:** clone the template and require a target group for the new
  campaign.

The source remains unchanged in both cases.

### Schedule

A schedule stores timing, recurrence, campaign-selection, target-group, timezone,
delivery-pattern, and completion configuration. Schedule creation does not send
email in this feature.

A schedule created from a concrete campaign uses that campaign as its source and
retains its target group. A one-time schedule created in the Schedule area selects
exactly one campaign template and one target group. A repeating schedule selects one
or more templates and one target group.

### Scheduled campaign instance

Every scheduled occurrence clones its schedule source into an independent,
non-template campaign. For a template-based schedule, the schedule’s target group is
applied to the clone. This gives every occurrence its own identity and campaign
history rather than reusing or overwriting the source.

When the concrete campaign instance is created, NextPhish creates hidden shadow copies
of its complete campaign state and referenced resources. The instance references those relational shadow records rather than the mutable source records.

### Hidden relational shadow resources

The transactionally created shadow graph includes the campaign/template configuration and private relational copies of every referenced resource needed by the campaign, including:

- email-template content and campaign-relevant settings;
- landing-page content and settings;
- sending-profile configuration;
- target-group data and its recipient membership; and
- other referenced campaign resources required by future execution.

Shadow copies are internal implementation records:

- they are not exposed in normal email-template, page, sending-profile, target-group,
  or campaign listing pages or pickers;
- they are not reusable or independently editable;
- the campaign instance keeps stable references to them for its lifetime; and
- later edits, archival, or deletion of the original resources do not change an
  already-created campaign instance.

Each affected future campaign rebuilt by a schedule edit receives rebuilt relational shadow resources when that campaign instance is recreated. Active, paused, and terminal campaigns keep their existing shadow resources.

## Creating and scheduling campaigns

### From a concrete campaign

1. Create a non-template campaign.
2. Select its email template, landing page, sending profile, campaign URL/settings,
   and target group.
3. Select **Schedule now or later**.
4. Configure timing, target timezone, delivery pattern, and completion.
5. Save the schedule with the concrete campaign as its source.
6. At the occurrence, clone that source into an independent campaign instance.

### From a campaign template

1. Open the Schedule area.
2. Select one campaign template for a one-time schedule or one or more templates for a
   repeating schedule.
3. Select one target group.
4. Configure timing or recurrence.
5. Configure campaign selection for a repeater.
6. Configure target timezone, delivery pattern, and completion.
7. Save the schedule.

## One-time template schedules

A one-time schedule authored in the Schedule area selects exactly one campaign
template and one target group. It can be configured for:

- **Now**; or
- a future local date and time.

When the occurrence’s concrete campaign is created, the template is cloned, the
selected target group is attached, and hidden relational shadow resources are created.

## Delivery patterns

The schedule form lets the operator choose among three patterns. These fields describe
future send behavior but do not execute delivery in this feature.

| Pattern | Configuration           | Meaning                                                              |
| ------- | ----------------------- | -------------------------------------------------------------------- |
| Blast   | No pacing value         | Make all recipients eligible without intentional pacing.             |
| Drip    | Emails per minute       | Continuously pace recipient eligibility at the selected target rate. |
| Batch   | Batch size and interval | Make a fixed-size chunk eligible once per selected interval.         |

### Large-group recommendation

When the selected target group contains **more than 600 recipients**:

- recommend **Drip**;
- preselect **60 emails per minute**; and
- explain that paced sending is recommended for the selected group size.

The recommendation is not a restriction. The operator may choose Blast, Batch, or a
different Drip rate. The target rate is configurable and 60/minute is not a maximum.

## Repeating schedules

A repeating schedule selects:

- one or more campaign templates;
- one target group;
- a recurrence rule;
- either Deck or Random selection;
- a target timezone;
- a delivery pattern; and
- optional end conditions.

Each occurrence creates one independent concrete campaign.

### Deck selection

Deck selection creates a finite ordered deck from the selected templates:

- one template is consumed per occurrence;
- each template is used at most once;
- optional shuffle randomizes the deck order; and
- the schedule stops and becomes completed when the deck is exhausted.

The deck does not reset.

### Random selection

Random selection chooses one eligible template on every occurrence. When at least two
templates are eligible, selection should avoid choosing the template used by the
immediately preceding occurrence. This is best-effort non-repetition rather than a
promise of longer-term distribution.

Random selection does not naturally exhaust its templates. Its end conditions are
optional, so a Random schedule may continue until it is manually cancelled.

## Repeater end conditions

A repeating schedule may configure either or both of these optional end conditions:

- **Maximum campaigns sent** — stop after the configured campaign count is reached.
- **End date** — stop when the configured date is reached.

When both are enabled, the first condition reached stops the schedule. A Deck also
stops when exhausted, even if neither configured condition has been reached.

End conditions remain editable while the repeating schedule is running, including
while one of its campaigns is active. Editing other fields follows the schedule-editing
windows below.

## Schedule editing and rescheduling

- Before a schedule starts, every schedule field is editable.
- A one-time schedule becomes locked when its campaign enters `pending_start`.
- For a schedule containing multiple campaigns, every schedule field is also editable
  between active campaigns. This edit window exists only when no campaign created by
  that schedule is in `pending_start`, `active`, or `paused`.
- Saving an edit recalculates and reschedules every affected future campaign. Campaigns
  already in `active`, `paused`, `completed`, or `failed` are not changed.
- Any already-materialized affected campaign that is still `scheduled` is rebuilt with
  the revised timing, configuration, and hidden relational shadow resources before it can enter
  `pending_start`.
- Editing repeater end conditions remains the exception: those fields can be changed
  while the schedule is running without mutating an active campaign.

### Duplicating schedules and collision warnings

A duplicated schedule is an independent schedule. It copies configuration, not runtime
history or lifecycle state. Subsequent edits to either schedule do not update the
other.

Before saving a new or duplicated schedule, NextPhish checks whether the same campaign
source and equivalent scheduling properties are already scheduled for the same date
and time. If so, the UI presents a clear duplicate-schedule warning. The warning is
informational: the user may acknowledge it and save anyway. NextPhish does not merge,
block, or automatically repair independent schedules.

## Schedule cancellation

Any schedule can be cancelled at any time. Cancellation:

- prevents the schedule from creating future campaign occurrences;
- records the schedule as cancelled;
- transitions every nonterminal campaign from that schedule in `scheduled`,
  `pending_start`, `active`, or `paused` to `completed`; and
- leaves campaigns already in `completed` or `failed` unchanged.

Campaigns are not directly cancelled. Not-started campaigns are completed rather than
left pending, and started or paused campaigns are also completed so no campaign from a
cancelled schedule can later resume or begin.

## Recurrence rules

Recurrence uses calendar fields interpreted in the target timezone.

| Frequency   | Operator selects                                    |
| ----------- | --------------------------------------------------- |
| Weekly      | Weekday and time                                    |
| Monthly     | Day of month and time                               |
| Quarterly   | Month within each quarter, day of month, and time   |
| Half-yearly | Month within each half-year, day of month, and time |
| Yearly      | Month, day of month, and time                       |

Examples:

- “Every Monday at 09:00.”
- “Every month on day 15 at 10:30.”
- “In month 2 of every quarter, on day 10 at 08:00.”
- “In month 3 of every half-year, on day 20 at 14:00.”
- “Every year on October 1 at 09:00.”

If the selected day does not exist in an occurrence month, use that month’s last day.
For example, a monthly rule for day 31 runs on February’s final calendar day.

## Timezones

- Persist schedule instants in UTC (`UTC+00:00`).
- Each organization exposes a default IANA timezone, such as `Europe/Sofia`.
- Each concrete campaign and schedule exposes a target timezone initialized from the
  selected organization’s default.
- Operators enter and view calendar fields in the target timezone.
- Convert those local calendar values to UTC for persistence.
- Changing the organization default does not silently rewrite target timezones already
  saved on campaigns or schedules.

### Daylight-saving policy

Use the IANA timezone database and a deterministic policy equivalent to Temporal’s
`compatible` disambiguation:

- **Nonexistent local time (spring-forward gap):** move the occurrence forward by the
  size of the timezone gap. For example, if clocks jump from 02:00 to 03:00, a rule for
  02:30 resolves to 03:30 on that date.
- **Ambiguous local time (fall-back overlap):** choose the earlier of the two possible
  instants and create only one occurrence.
- Persist the resolved UTC instant together with the target timezone and recurrence
  rule so the original scheduling intent remains explainable.

This policy preserves one occurrence, follows a widely used calendar resolution
policy, and avoids double sends.

## Campaign lifecycle

The concrete campaign state machine is:

```text
draft -> published -> scheduled
scheduled -> pending_start | completed (schedule cancellation)
pending_start -> active | paused | failed | completed (schedule cancellation)
active -> paused | completed
paused -> active | completed
```

Allowed transitions and actions:

| Current state   | Allowed next state                        | Meaning                                                                                               |
| --------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `draft`         | `published`                               | Campaign preparation is complete and the campaign can enter scheduling.                               |
| `published`     | `scheduled`                               | A schedule has been assigned.                                                                         |
| `scheduled`     | `pending_start`, `completed`              | Start preparation may begin, or schedule cancellation completes the not-started campaign.             |
| `pending_start` | `active`, `paused`, `failed`, `completed` | Startup may succeed, pause, fail, or be completed by schedule cancellation.                           |
| `active`        | `paused`, `completed`                     | A user may only pause or complete a started campaign.                                                 |
| `paused`        | `active`, `completed`                     | A user may resume or complete a paused campaign. After resume, normal active transitions apply again. |
| `completed`     | none                                      | Terminal successful/manual-completion state.                                                          |
| `failed`        | none                                      | Terminal failure state. Recovery requires a separately defined retry or clone flow.                   |

A started campaign’s definition and occurrence-level launch configuration are no
longer editable. Its only direct user lifecycle actions are **Pause** and **Complete**.
A paused campaign additionally exposes **Resume** and remains eligible for
**Complete**. Campaigns are not cancelled directly; cancelling their parent schedule
completes every nonterminal child campaign. Parent repeater edits follow the
schedule-editing windows above and never mutate a started campaign.

Schedule execution remains out of scope; this section defines only the lifecycle
contract that later execution work must implement.

## Completion

Schedules can define an explicit end date. Once that date is reached, the schedule is
marked completed and cannot produce another occurrence. A repeating schedule may
instead or additionally define a maximum-campaign count, and it can be cancelled
manually. A Deck schedule also completes as soon as its deck is exhausted.

Every scheduled campaign has an automatic-completion period measured from its
send/start time:

- enabled by default;
- defaults to **20 days**; and
- can be disabled, represented by a `null` duration.

The recommended form treatment is an **Automatically complete campaign** toggle. When
enabled, show a configurable **Days after start** value. When disabled, hide or disable
the value and persist no duration.

## Broken dependencies

Resources that are archived, deleted, or otherwise ineligible do not appear in
pickers for new campaigns and schedules.

A schedule or not-yet-created campaign remains visible if a required source dependency
becomes unavailable. Its list row is marked **Broken**, and a tooltip identifies the
missing or unusable campaign template, email template, landing page, sending profile,
or target group.

An already-created campaign with complete hidden relational shadow resources continues from those copies and is not made broken solely because an original source is later changed, archived, or deleted. A broken schedule cannot create a new campaign until repaired. Repair uses the normal
Edit flow: the user replaces or restores invalid dependencies and saves through the
same validation as any other edit. Saving the repair clears **Broken** only when every
required dependency is valid and reschedules/rebuilds affected future campaigns.
NextPhish must not silently substitute another resource.

## Principal differences from Gophish

| Area                      | Gophish                                                   | NextPhish                                                                                              |
| ------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Definition and scheduling | Combined in the campaign launch dialog                    | Separate campaign/template and Schedule areas                                                          |
| Reuse                     | No campaign-template concept described by the cited guide | Campaigns may be reusable templates                                                                    |
| Target selection          | One or more groups selected in the campaign dialog        | Templates omit targets; schedules and concrete campaigns select one target group                       |
| Type conversion           | Not described                                             | Clone between concrete campaign and template; never mutate the source type                             |
| Immediate/future send     | Launch Date in campaign dialog                            | One-time schedule for now or a future time                                                             |
| Pacing                    | Optional Send Emails By deadline spreads messages evenly  | Selectable Blast, Drip rate, or Batch size/interval                                                    |
| Large groups              | No threshold recommendation described                     | More than 600 recipients recommends Drip at a configurable 60/minute default                           |
| Repetition                | No repeating strategy described                           | Deck and Random template-selection strategies                                                          |
| Recurrence                | Immediate or one future launch date described             | Weekly, monthly, quarterly, half-yearly, and yearly rules                                              |
| Timezone                  | Not specified by the cited guide                          | Organization default plus campaign/schedule target timezone; persisted as UTC                          |
| Completion                | Manual Complete action                                    | Schedule completion plus campaign auto-completion, defaulting to 20 days                               |
| Occurrence identity       | Campaign itself is launched                               | Every occurrence clones its concrete-campaign or template source into an independent concrete campaign |

## Authorization

Campaign and schedule operations use the existing Better Auth organization permission
system. Add a `campaigns` permission subject following the project’s current subject
convention, with `read` and `write` actions:

- Better Auth action `read` on subject `campaigns` (scope `read:campaigns`) governs
  campaign/template/schedule listing and detail access.
- Better Auth action `write` on subject `campaigns` (scope `write:campaigns`) governs
  creation, cloning, publishing, scheduling, editing,
  repairing, pausing, resuming, completing, cancelling, and duplication.

Organization membership and active-organization scoping continue to apply. This
feature does not introduce a parallel authorization mechanism.

## Recipient uniqueness

A campaign may send to a canonical email address only once. If future multi-group
selection finds the same recipient in multiple groups, the campaign deduplicates that
recipient by normalized email address before creating send work. Whitespace and email
case differences do not create another recipient; provider-specific alias rewriting is
not implied.

The hidden shadow target group records the deduplicated recipient set used by that campaign, so later group edits cannot add a duplicate to an already-created campaign.

## Persistence and catalog previews

Before an occurrence enters `pending_start`, NextPhish transactionally copies its email template, page and redirect dependencies, sending profile, target group, and normalized recipient membership into their existing resource tables with private `SHADOW` visibility. Catalog queries, pickers, ordinary CRUD, and MCP tools expose only `CATALOG` resources. Shadow attachment file records share immutable stored objects with their catalog sources; object bytes are deleted only after the final file reference is removed.

Email-template and page catalogs may show best-effort cached previews. An authenticated browser renders a persisted revision with inert dummy data in a sandbox, uploads a bounded PNG or WebP, and the backend accepts it only when the organization and source revision still match. Missing, stale, or failed previews use a placeholder. Preview bytes are served through an authenticated organization-scoped route, not a public object URL. This avoids headless-browser dependencies in workers.

## Deferred execution scope

Provider/worker implementation of Blast, Drip, Batch, retries, and actual delivery is
specified by the later schedule-execution feature. There are no remaining product
questions from this document’s original open-decision list.
