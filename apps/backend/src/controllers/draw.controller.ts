import type { Request, Response } from "express";
import * as DrawService from "../services/draw.service.js";

export const createDraw = async (req: Request, res: Response): Promise<void> => {
  try {
    const draw = await DrawService.createDraw(req.body);
    res.status(201).json({ success: true, data: draw });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAllDraws = async (_req: Request, res: Response): Promise<void> => {
  try {
    const draws = await DrawService.getAllDraws();
    res.status(200).json({ success: true, data: draws });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDrawById = async (req: Request, res: Response): Promise<void> => {
  try {
    const draw = await DrawService.getDrawById(req.params.id as string);
    res.status(200).json({ success: true, data: draw });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
};

export const simulateDraw = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await DrawService.simulateDraw(req.params.id as string);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const publishDraw = async (req: Request, res: Response): Promise<void> => {
  try {
    const draw = await DrawService.publishDraw(req.params.id as string, req.userId!);
    res.status(200).json({ success: true, data: draw });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};