import { http } from "./http";
import type { AppUser } from "../types/models";

export const authService = {
  signup: (input: { name: string; email: string; password: string }) =>
    http<{ token: string; user: AppUser }>("/auth/signup", { method: "POST", json: input }),
  login: (input: { email: string; password: string }) =>
    http<{ token: string; user: AppUser }>("/auth/login", { method: "POST", json: input }),
  me: () => http<AppUser>("/users/me/profile"),
  changePassword: (input: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    http<{ message: string }>("/auth/change-password", { method: "PATCH", json: input }),
};
