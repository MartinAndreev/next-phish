import { createHash, randomInt } from "node:crypto";
import {
  ScheduleSelectionStrategy,
  type ScheduleSelectionStrategy as ScheduleSelectionStrategyValue,
} from "../execution.enums";

export interface ScheduleSourceCandidate {
  campaignId: string;
  position: number;
}

export function orderScheduleDeck(
  scheduleId: string,
  sources: ScheduleSourceCandidate[],
  shuffle: boolean,
): ScheduleSourceCandidate[] {
  if (!shuffle) return [...sources].sort((a, b) => a.position - b.position);
  return [...sources].sort((left, right) =>
    createHash("sha256")
      .update(`${scheduleId}:${left.campaignId}`)
      .digest("hex")
      .localeCompare(
        createHash("sha256")
          .update(`${scheduleId}:${right.campaignId}`)
          .digest("hex"),
      ),
  );
}

export function selectScheduleSource(input: {
  scheduleId: string;
  strategy: ScheduleSelectionStrategyValue;
  sources: ScheduleSourceCandidate[];
  occurrenceCount: number;
  previousSourceCampaignId?: string | null;
  shuffleDeck: boolean;
  randomIndex?: (length: number) => number;
}): { sourceCampaignId: string | null; deckExhausted: boolean } {
  if (!input.sources.length)
    return { sourceCampaignId: null, deckExhausted: true };
  if (input.strategy === ScheduleSelectionStrategy.DECK) {
    const deck = orderScheduleDeck(
      input.scheduleId,
      input.sources,
      input.shuffleDeck,
    );
    return {
      sourceCampaignId: deck[input.occurrenceCount]?.campaignId ?? null,
      deckExhausted: input.occurrenceCount + 1 >= deck.length,
    };
  }
  const candidates =
    input.sources.length > 1 && input.previousSourceCampaignId
      ? input.sources.filter(
          (source) => source.campaignId !== input.previousSourceCampaignId,
        )
      : input.sources;
  const index = (input.randomIndex ?? randomInt)(candidates.length);
  return {
    sourceCampaignId: candidates[index]?.campaignId ?? null,
    deckExhausted: false,
  };
}
