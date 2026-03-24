import type { Request, Response } from "express";
import * as UserService from "../services/user.service.js";

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await UserService.getProfile(req.userId!);
    res.status(200).json({ success: true, data: user });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await UserService.updateProfile(req.userId!, req.body);
    res.status(200).json({ success: true, data: user });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Admin 

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await UserService.getAllUsers(req.query as any);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await UserService.getUserById(req.params.id as string);
    res.status(200).json({ success: true, data: user });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
};

export const adminUpdateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await UserService.adminUpdateUser(req.params.id as string, req.body);
    res.status(200).json({ success: true, data: user });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const adminUpdateSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await UserService.adminUpdateSubscription(req.params.id as string, req.body);
    res.status(200).json({ success: true, data: user });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};