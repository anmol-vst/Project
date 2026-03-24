
import jwt from "jsonwebtoken";
import  { User }  from "db/models";
import type { Request, Response, NextFunction } from "express";


declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1] as string;
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

    if (!decoded || typeof decoded !== "object") {
    throw new Error("Invalid token");
    }

    if (!decoded.userId || typeof decoded.userId !== "string") {
      throw new Error("Invalid token payload");
    }

    req.userId = decoded.userId;
    req.userRole = decoded.role;

    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};


export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.userRole !== "admin") {
    res.status(403).json({ success: false, message: "Admin access required" });
    return;
  }
  next();
};

export const requireSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select("subscription");

    if (!user || user.subscription?.status !== "active") {
      res.status(403).json({
        success: false,
        message: "An active subscription is required to access this feature",
      });
      return;
    }

    next();
  } catch {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};