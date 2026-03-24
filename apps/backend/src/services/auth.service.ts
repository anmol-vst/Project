import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { User } from "db/models";
import type { SignupInput, LoginInput } from "../zodValidation/UserValidation.js";
import type { IUser } from "../../../../packages/db/models/UserSchema.js";

//signup 

export const signup = async (data: SignupInput) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    throw new Error("Email already in use");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await User.create({
    name: data.name,
    email: data.email,
    passwordHash,
  });

  const token = generateToken(user._id.toString(), user.role);

  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

// ─── login 

export const login = async (data: LoginInput) => {
  const user = await User.findOne({ email: data.email }).select("+passwordHash");
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(data.password, user.passwordHash);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user._id.toString(), user.role);

  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

//getMe 

type SafeUser = Omit<IUser, "passwordHash" | "drawsEntered" | "winnings">;

export const getMe = async (userId: string): Promise<SafeUser> => {
  const user = await User.findById(userId)
    .select("-passwordHash -drawsEntered -winnings")
    .lean();

  if (!user) throw new Error("User not found");

  return user as SafeUser;
};

//changePassword 

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) throw new Error("Current password is incorrect");

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
};

//Helpers 

const generateToken = (userId: string, role: string): string => {
  const payload = { userId, role };
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN as any) || "7d",
  };
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.sign(payload, secret, options);
};