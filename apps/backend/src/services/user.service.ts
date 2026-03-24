import { User } from "db/models";
import type { UpdateProfileInput } from "../zodValidation/UserValidation.js";
import type { AdminUpdateUserInput, AdminUpdateSubscriptionInput, PaginationInput } from "../zodValidation/AdminValidation.js";

//getProfile

export const getProfile = async (userId: string) => {
  const user = await User.findById(userId)
    .select("-passwordHash")
    .populate("charityContribution.charityId", "name slug logoUrl");
  if (!user) throw new Error("User not found");
  return user;
};

//updateProfile

export const updateProfile = async (userId: string, data: UpdateProfileInput) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: data },
    { new: true, runValidators: false }
  ).select("-passwordHash");
  if (!user) throw new Error("User not found");
  return user;
};

//Admin: getAllUsers

export const getAllUsers = async (pagination: PaginationInput) => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(),
  ]);

  return { users, total, page, limit };
};

//admin:getUserById 

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId)
    .select("-passwordHash")
    .populate("charityContribution.charityId", "name slug logoUrl");
  if (!user) throw new Error("User not found");
  return user;
};

//  Admin: updateUser 

export const adminUpdateUser = async (userId: string, data: AdminUpdateUserInput) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: data },
    { new: true, runValidators: false }
  ).select("-passwordHash");
  if (!user) throw new Error("User not found");
  return user;
};

//Admin: updateSubscription 

export const adminUpdateSubscription = async (
  userId: string,
  data: AdminUpdateSubscriptionInput
) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { subscription: data } },
    { new: true, runValidators: false }
  ).select("subscription");
  if (!user) throw new Error("User not found");
  return user;
};