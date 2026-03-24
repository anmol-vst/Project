import type { Request, Response } from "express";
import * as CharityService from "../services/charity.service.js";

export const getAllCharities = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await CharityService.getAllCharities(req.query as any);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getCharityBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const charity = await CharityService.getCharityBySlug(req.params.slug as string);
    res.status(200).json({ success: true, data: charity });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
};

// ─── Admin
export const createCharity = async (req: Request, res: Response): Promise<void> => {
  try {
    const charity = await CharityService.createCharity(req.body, req.userId!);
    res.status(201).json({ success: true, data: charity });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateCharity = async (req: Request, res: Response): Promise<void> => {
  try {
    const charity = await CharityService.updateCharity(req.params.id as string, req.body);
    res.status(200).json({ success: true, data: charity });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteCharity = async (req: Request, res: Response): Promise<void> => {
  try {
    await CharityService.deleteCharity(req.params.id as string);
    res.status(200).json({ success: true, message: "Charity deactivated" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const addEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await CharityService.addEvent(req.params.id as string, req.body);
    res.status(201).json({ success: true, data: events });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await CharityService.updateEvent(req.params.id as string, req.params.eventId as string, req.body);
    res.status(200).json({ success: true, data: events });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    await CharityService.deleteEvent(req.params.id as string, req.params.eventId as string);
    res.status(200).json({ success: true, message: "Event deleted" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};