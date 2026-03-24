import type { Request, Response } from "express";
import * as SubscriptionService from "../services/subscription.service.js";

export const getPublicPrices = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await SubscriptionService.getPublicSubscriptionPrices();
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(503).json({ success: false, message: err.message || "Unable to load prices" });
  }
};

export const createCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await SubscriptionService.createCheckoutSession(req.userId!, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const cancelSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    await SubscriptionService.cancelSubscription(req.userId!, req.body);
    res.status(200).json({ success: true, data: { message: "Subscription cancelled" } });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers["stripe-signature"] as string;
    await SubscriptionService.handleWebhook(req.body, signature);
    res.status(200).json({ received: true });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};