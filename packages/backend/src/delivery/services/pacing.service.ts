export type DeliveryPacing =
  | { mode: "BLAST" }
  | { mode: "DRIP"; emailsPerMinute: number }
  | { mode: "BATCH"; batchSize: number; batchIntervalMinutes: number };

export function calculateScheduledAt(
  occurrenceAt: Date,
  stableIndex: number,
  pacing: DeliveryPacing,
): Date {
  if (!Number.isInteger(stableIndex) || stableIndex < 0)
    throw new Error("stableIndex must be a non-negative integer");

  let offsetMs = 0;
  if (pacing.mode === "DRIP") {
    if (
      !Number.isInteger(pacing.emailsPerMinute) ||
      pacing.emailsPerMinute <= 0
    )
      throw new Error("emailsPerMinute must be a positive integer");
    offsetMs = Math.floor((stableIndex * 60_000) / pacing.emailsPerMinute);
  } else if (pacing.mode === "BATCH") {
    if (!Number.isInteger(pacing.batchSize) || pacing.batchSize <= 0)
      throw new Error("batchSize must be a positive integer");
    if (
      !Number.isInteger(pacing.batchIntervalMinutes) ||
      pacing.batchIntervalMinutes <= 0
    )
      throw new Error("batchIntervalMinutes must be a positive integer");
    offsetMs =
      Math.floor(stableIndex / pacing.batchSize) *
      pacing.batchIntervalMinutes *
      60_000;
  }
  return new Date(occurrenceAt.getTime() + offsetMs);
}
