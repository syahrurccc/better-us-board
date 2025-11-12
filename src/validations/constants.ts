export const categories = [
  "communication",
  "relationship",
  "household",
  "finance",
  "wellbeing",
  "other",
] as const;

export const priorities = ["low", "medium", "high"] as const;

export const statuses = [
  "open",
  "in_talks",
  "needs_reflection",
  "resolved",
] as const;

export type Category = (typeof categories)[number];
export type Priority = (typeof priorities)[number];
export type Status = (typeof statuses)[number];