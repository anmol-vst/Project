import type { Request, Response } from "express";
import * as ScoreService from "../services/score.service.js";

export const getScores = async (req: Request, res: Response): Promise<void> => {
  try {
    const scores = await ScoreService.getScores(req.userId!);
    res.status(200).json({ success: true, data: scores });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
};

export const addScore = async (req: Request, res: Response): Promise<void> => {
  try {
    const scores = await ScoreService.addScore(req.userId!, req.body);
    res.status(201).json({ success: true, data: scores });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateScore = async (req: Request, res: Response): Promise<void> => {
  try {
    const scores = await ScoreService.updateScore(req.userId!, req.params.scoreId as string, req.body);
    res.status(200).json({ success: true, data: scores });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteScore = async (req: Request, res: Response): Promise<void> => {
  try {
    await ScoreService.deleteScore(req.userId!, req.params.scoreId as string);
    res.status(200).json({ success: true, message: "Score deleted" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Admin 
export const adminUpdateScore = async (req: Request, res: Response): Promise<void> => {
  try {
    const scores = await ScoreService.updateScore(req.params.userId as string, req.params.scoreId as string, req.body);
    res.status(200).json({ success: true, data: scores });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};