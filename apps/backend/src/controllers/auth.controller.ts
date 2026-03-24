import type { Request, Response } from "express";
import * as AuthService from "../services/auth.service.js";

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await AuthService.signup(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await AuthService.login(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    res.status(401).json({ success: false, message: err.message });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await AuthService.getMe(req.userId!);
    res.status(200).json({ success: true, data: user });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    await AuthService.changePassword(req.userId!, currentPassword, newPassword);
    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};