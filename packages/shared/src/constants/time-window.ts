export interface TimeWindowOption {
  value: number;
  translationKey: string;
}

export const TIME_WINDOW_OPTIONS: TimeWindowOption[] = [
  { value: 60000, translationKey: "apiKeys.timeWindow1Minute" },
  { value: 600000, translationKey: "apiKeys.timeWindow10Minutes" },
  { value: 3600000, translationKey: "apiKeys.timeWindow1Hour" },
  { value: 86400000, translationKey: "apiKeys.timeWindow1Day" },
];
