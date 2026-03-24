import { Winner } from "db/models";
import { WinnerVerificationStatus, PayoutStatus } from "db/models";
import type { VerifyWinnerInput } from "../zodValidation/AdminValidation.js";

//getMyWinnings

export const getMyWinnings = async (userId: string) => {
  return Winner.find({ userId })
    .populate("drawId", "title month year drawnNumbers")
    .sort({ createdAt: -1 });
};

//uploadProof 
export const uploadProof = async (
  winnerId: string,
  userId: string,
  proofUrl: string
) => {
  const winner = await Winner.findOne({ _id: winnerId, userId });
  if (!winner) throw new Error("Winner record not found");

  if (winner.verificationStatus !== WinnerVerificationStatus.PendingProof) {
    throw new Error("Proof has already been submitted");
  }

  winner.proofUrl = proofUrl;
  winner.verificationStatus = WinnerVerificationStatus.UnderReview;
  await winner.save();
  return winner;
};

// admin: can getAllWinners 

export const getAllWinners = async () => {
  return Winner.find()
    .populate("userId", "name email")
    .populate("drawId", "title month year")
    .sort({ createdAt: -1 });
};

//amin: verifyWinner 

export const verifyWinner = async (
  winnerId: string,
  adminId: string,
  data: VerifyWinnerInput
) => {
  const winner = await Winner.findById(winnerId);
  if (!winner) throw new Error("Winner not found");

  if (winner.verificationStatus !== WinnerVerificationStatus.UnderReview) {
    throw new Error("Winner is not currently under review");
  }

  winner.verificationStatus = data.verificationStatus as WinnerVerificationStatus;
  winner.reviewedBy = adminId as any;
  winner.reviewedAt = new Date();
  if (data.adminNote) winner.adminNote = data.adminNote;

  await winner.save();
  return winner;
};

// admin: markAsPaid 
export const markAsPaid = async (winnerId: string, adminId: string) => {
  const winner = await Winner.findById(winnerId);
  if (!winner) throw new Error("Winner not found");

  if (winner.verificationStatus !== WinnerVerificationStatus.Approved) {
    throw new Error("Winner must be approved before marking as paid");
  }

  winner.payoutStatus = PayoutStatus.Paid;
  winner.paidAt = new Date();
  winner.paidBy = adminId as any;
  await winner.save();
  return winner;
};