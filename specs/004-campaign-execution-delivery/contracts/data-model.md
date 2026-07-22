# Data Model Contract

## Schedule occurrence

Required identity and state:

```text
scheduleId + occurrenceAt (unique)
organizationId
sourceCampaignId
campaignId?
scheduleRevision
status
materializationCursor?
leaseOwner?
leaseExpiresAt?
attemptCount
lastErrorCode?
lastErrorMessage?
```

Source selection is immutable after claim. Campaign identity becomes immutable after creation.

## Campaign recipient result

Required identity and snapshot:

```text
campaignId + normalizedEmail (unique)
organizationId
sourceTargetGroupUserId?
email
normalizedEmail
firstName
lastName
position?
approvedMergeData?
trackingRef (unique)
idempotencyKey (unique)
messageId (unique)
providerMessageId?
```

Required scheduling/delivery projection:

```text
scheduledAt
deliveryStatus
attemptCount
nextAttemptAt?
leaseOwner?
leaseExpiresAt?
queuedAt?
firstDispatchAt?
sentAt?
failedAt?
lastDeliveryEventAt?
lastErrorCode?
lastErrorMessage?
```

Required campaign projection:

```text
highestNegativeEvent
highestNegativeEventAt?
reported
reportedAt?
lastCampaignEventAt?
```

## Events and attempts

- `CampaignEvent` and `DeliveryEvent` are different relations and tables.
- Each event has a required unique deduplication key.
- `DeliveryAttempt` is unique by recipient and attempt number.
- Provider IDs are optional but indexed/deduplicated where the provider guarantees uniqueness.
- Event metadata uses bounded sanitized JSON.

## Outbox

Required fields:

```text
type
aggregateId
dedupeKey (unique)
payloadVersion
payload
availableAt
claimedAt?
claimExpiresAt?
publishedAt?
attemptCount
lastError?
```

Payload validation guarantees IDs only and rejects PII/secrets.

## Ignored organization network

Required fields:

```text
organizationId + normalizedNetwork (unique)
description
createdById
createdAt
updatedAt
```

Administrative mutations must be auditable. Exact IP values are canonicalized to network form before uniqueness checks.

## Deletion and retention

- Deleting a campaign follows an explicit audited policy and must not orphan shared stored objects.
- Recipient results and campaign events share the campaign retention period.
- Delivery events and attempts may use a shorter operational retention period after aggregate finalization.
- Outbox records are removed only after publication and a configured replay/debug window.
- Tracking references stop resolving after campaign deletion/expiry and must not be reassigned.
