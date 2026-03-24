import type { Request, Response } from "express";
import * as WinnerService from "../services/winner.service.js";

export const getMyWinnings = async (req: Request, res: Response): Promise<void> => {
  try {
    const winnings = await WinnerService.getMyWinnings(req.userId!);
    res.status(200).json({ success: true, data: winnings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const uploadProof = async (req: Request, res: Response): Promise<void> => {
  try {
    const proofUrl = req.body.proofUrl;
    if (!proofUrl) {
      res.status(400).json({ success: false, message: "Proof URL is required" });
      return;
    }
    const winner = await WinnerService.uploadProof(req.params.id as string, req.userId!, proofUrl);
    res.status(200).json({ success: true, data: winner });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Admin 
export const getAllWinners = async (_req: Request, res: Response): Promise<void> => {
  try {
    const winners = await WinnerService.getAllWinners();
    res.status(200).json({ success: true, data: winners });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const verifyWinner = async (req: Request, res: Response): Promise<void> => {
  try {
    const winner = await WinnerService.verifyWinner(req.params.id as string, req.userId!, req.body);
    res.status(200).json({ success: true, data: winner });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const markAsPaid = async (req: Request, res: Response): Promise<void> => {
  try {
    const winner = await WinnerService.markAsPaid(req.params.id as string, req.userId!);
    res.status(200).json({ success: true, data: winner });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};