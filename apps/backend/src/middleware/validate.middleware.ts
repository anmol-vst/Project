import  type { Request, Response, NextFunction } from "express";
import type { ZodType, ZodError } from "zod";


export const validateBody =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      res.status(400).json({ success: false, errors });
      return;
    }

    req.body = result.data;
    next();
  };

export const validateQuery =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      res.status(400).json({ success: false, errors });
      return;
    }

    Object.assign(req.query as Record<string, unknown>, result.data as Record<string, unknown>);
    next();
  };


export const validateParams =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      res.status(400).json({ success: false, errors });
      return;
    }

    Object.assign(req.params as Record<string, unknown>, result.data as Record<string, unknown>);
    next();
  };