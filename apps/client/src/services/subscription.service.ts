import { http } from "./http";
import type { SubscriptionPlan } from "../types/models";

export type StripePlanQuote = {
  plan: SubscriptionPlan;
  priceId: string;
  amountCents: number | null;
  currency: string;
  interval: string | null;
  formatted: string;
  nickname?: string | null;
};

export type PublicPricesPayload = {
  monthly: StripePlanQuote;
  yearly: StripePlanQuote;
  identicalPriceIds: boolean;
};

export const subscriptionService = {
  getPublicPrices: () => http<PublicPricesPayload>("/subscriptions/prices"),
  checkout: (payload: { plan: SubscriptionPlan; charityId?: string; contributionPercent: number }) =>
    http<{ url: string }>("/subscriptions/checkout", { method: "POST", json: payload }),
  cancel: (cancelAt: "immediately" | "period_end") =>
    http<{ message: string }>("/subscriptions/cancel", { method: "POST", json: { cancelAt } }),
};
