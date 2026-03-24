import Stripe from "stripe";
import { User } from "db/models";
import { SubscriptionStatus } from "db/models";
import type {
  CreateCheckoutInput,
  CancelSubscriptionInput,
  VerifyCheckoutInput,
} from "../zodValidation/SubscriptionValidation.js";

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is missing in environment");
  }
  return new Stripe(key);
};

const getPriceId = (plan: "monthly" | "yearly") => {
  const priceId =
    plan === "monthly"
      ? process.env.STRIPE_PRICE_MONTHLY
      : process.env.STRIPE_PRICE_YEARLY;
  if (!priceId) {
    throw new Error(`Stripe price ID is missing for ${plan} plan`);
  }
  return priceId;
};

export type PublicPlanPrice = {
  plan: "monthly" | "yearly";
  priceId: string;
  amountCents: number | null;
  currency: string;
  interval: string | null;
  formatted: string;
  nickname?: string | null;
};

const formatMoney = (amountCents: number | null, currency: string): string => {
  if (amountCents == null) return "—";
  const code = (currency || "usd").toUpperCase();
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: code,
  }).format(amountCents / 100);
};

export const getPublicSubscriptionPrices = async (): Promise<{
  monthly: PublicPlanPrice;
  yearly: PublicPlanPrice;
  identicalPriceIds: boolean;
}> => {
  const stripe = getStripe();
  const monthlyId = getPriceId("monthly");
  const yearlyId = getPriceId("yearly");
  const identicalPriceIds = monthlyId === yearlyId;

  const [monthlyPrice, yearlyPrice] = await Promise.all([
    stripe.prices.retrieve(monthlyId),
    stripe.prices.retrieve(yearlyId),
  ]);

  const toPlan = (
    plan: "monthly" | "yearly",
    p: Stripe.Price,
    priceId: string
  ): PublicPlanPrice => {
    const interval = p.recurring?.interval ?? null;
    const amountCents = typeof p.unit_amount === "number" ? p.unit_amount : null;
    const currency = p.currency || "usd";
    let formatted = formatMoney(amountCents, currency);
    if (interval === "month") formatted += " / month";
    if (interval === "year") formatted += " / year";
    return {
      plan,
      priceId,
      amountCents,
      currency,
      interval,
      formatted,
      nickname: typeof p.nickname === "string" ? p.nickname : null,
    };
  };

  return {
    monthly: toPlan("monthly", monthlyPrice, monthlyId),
    yearly: toPlan("yearly", yearlyPrice, yearlyId),
    identicalPriceIds,
  };
};

const subscriptionIdFromCheckoutSession = (
  session: Stripe.Checkout.Session
): string | null => {
  const sub = session.subscription;
  if (typeof sub === "string" && sub.length > 0) return sub;
  if (
    sub &&
    typeof sub === "object" &&
    "id" in sub &&
    typeof (sub as { id: unknown }).id === "string"
  ) {
    return (sub as Stripe.Subscription).id;
  }
  return null;
};

/** Shared by Stripe webhooks and return-from-checkout verification. */
export const applyPaidSubscriptionFromCheckoutSession = async (
  session: Stripe.Checkout.Session
): Promise<void> => {
  const stripe = getStripe();
  const { userId, charityId, contributionPercent } = session.metadata || {};
  if (!userId) {
    throw new Error("Missing userId in checkout metadata");
  }

  let subId = subscriptionIdFromCheckoutSession(session);
  if (!subId) {
    const full = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["subscription"],
    });
    subId = subscriptionIdFromCheckoutSession(full);
  }
  if (!subId) {
    throw new Error("No subscription on checkout session yet");
  }

  type RetrievedSub = {
    items?: { data?: Array<{ price?: { recurring?: { interval?: string } } }> };
    current_period_start?: number;
    current_period_end?: number;
  };

  const stripeSubscription = (await stripe.subscriptions.retrieve(
    subId
  )) as unknown as RetrievedSub;

  const item = stripeSubscription.items?.data?.[0];
  if (!item) throw new Error("No subscription items found");

  const periodStart = stripeSubscription.current_period_start;
  const periodEnd = stripeSubscription.current_period_end;
  if (typeof periodStart !== "number" || typeof periodEnd !== "number") {
    throw new Error("Invalid subscription period from Stripe");
  }

  const update: Record<string, unknown> = {
    "subscription.stripeCustomerId": session.customer,
    "subscription.stripeSubscriptionId": subId,
    "subscription.status": SubscriptionStatus.Active,
    "subscription.plan":
      item.price?.recurring?.interval === "year" ? "yearly" : "monthly",
    "subscription.currentPeriodStart": new Date(periodStart * 1000),
    "subscription.currentPeriodEnd": new Date(periodEnd * 1000),
  };

  if (charityId && /^[a-f\d]{24}$/i.test(charityId)) {
    update["charityContribution.charityId"] = charityId;
    update["charityContribution.contributionPercent"] =
      Number(contributionPercent) || 10;
  }

  await User.findByIdAndUpdate(userId, { $set: update });
};

/**
 * Use after Stripe redirect if webhooks are unreliable locally — reads Checkout Session and updates the user.
 */
export const verifyCheckoutSessionForUser = async (
  userId: string,
  data: VerifyCheckoutInput
): Promise<void> => {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(data.sessionId, {
    expand: ["subscription"],
  });

  if (session.metadata?.userId !== userId) {
    throw new Error("This checkout does not belong to your account");
  }

  if (session.mode !== "subscription") {
    throw new Error("Invalid checkout session mode");
  }

  const paid =
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required";
  if (!paid) {
    throw new Error("Payment not completed yet");
  }

  await applyPaidSubscriptionFromCheckoutSession(session);
};

// ─── createCheckoutSession ────────────────────────────────────────────────────

export const createCheckoutSession = async (
  userId: string,
  data: CreateCheckoutInput
) => {
  const stripe = getStripe();
  const user = await User.findById(userId).select("email subscription");
  if (!user) throw new Error("User not found");

  let customerId = user.subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email });
    customerId = customer.id;
    await User.findByIdAndUpdate(userId, {
      $set: { "subscription.stripeCustomerId": customerId },
    });
  }

  const priceId = getPriceId(data.plan);
  const clientBase = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${clientBase}/dashboard?subscribed=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientBase}/pricing`,
    metadata: {
      userId,
      charityId: data.charityId || "",
      contributionPercent: String(data.contributionPercent),
    },
  });

  return { url: session.url };
};

// ─── cancelSubscription ───────────────────────────────────────────────────────

export const cancelSubscription = async (
  userId: string,
  data: CancelSubscriptionInput
) => {
  const stripe = getStripe();
  const user = await User.findById(userId).select("subscription");
  if (!user) throw new Error("User not found");

  const subId = user.subscription?.stripeSubscriptionId;
  if (!subId) throw new Error("No active Stripe subscription found. If your subscription was activated manually, cancellation must be done by an admin.");

  if (data.cancelAt === "immediately") {
    await stripe.subscriptions.cancel(subId);
  } else {
    await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
  }
};

// ─── handleWebhook ────────────────────────────────────────────────────────────

export const handleWebhook = async (
  rawBody: Buffer,
  signature: string
) => {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is missing in environment");
  }
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    throw new Error("Invalid webhook signature");
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await onCheckoutCompleteEvent(session);
      break;
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      await onPaymentSucceeded(invoice);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await onPaymentFailed(invoice);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await onSubscriptionDeleted(sub);
      break;
    }
  }
};

// ─── Webhook handlers ─────────────────────────────────────────────────────────

const onCheckoutCompleteEvent = async (session: Stripe.Checkout.Session) => {
  const { userId } = session.metadata || {};
  if (!userId) return;
  try {
    await applyPaidSubscriptionFromCheckoutSession(session);
  } catch (err) {
    console.error("[stripe] checkout.session.completed handler failed:", err);
  }
};

const onPaymentSucceeded = async (invoice: Stripe.Invoice) => {
  const stripe = getStripe();
  const customerId = invoice.customer as string;
  //@ts-ignore
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string) as any;

  await User.findOneAndUpdate(
    { "subscription.stripeCustomerId": customerId },
    {
      $set: {
        "subscription.status": SubscriptionStatus.Active,
        "subscription.currentPeriodStart": new Date(subscription.current_period_start * 1000),
        "subscription.currentPeriodEnd": new Date(subscription.current_period_end * 1000),
      },
    }
  );
};

const onPaymentFailed = async (invoice: Stripe.Invoice) => {
  const customerId = invoice.customer as string;

  await User.findOneAndUpdate(
    { "subscription.stripeCustomerId": customerId },
    { $set: { "subscription.status": SubscriptionStatus.Lapsed } }
  );
};

const onSubscriptionDeleted = async (sub: Stripe.Subscription) => {
  const customerId = sub.customer as string;

  await User.findOneAndUpdate(
    { "subscription.stripeCustomerId": customerId },
    {
      $set: {
        "subscription.status": SubscriptionStatus.Cancelled,
        "subscription.cancelledAt": new Date(),
      },
    }
  );
};
