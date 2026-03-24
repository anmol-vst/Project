import mongoose, { Document, Schema } from "mongoose";
import {
  UserRole,
  SubscriptionPlan,
  SubscriptionStatus,
  WinTier,
  PayoutStatus,
  type ObjectId,
} from "./Types.js";

// Interfaces 
export interface IScore {
  _id?: Schema.Types.ObjectId;
  points: number;
  datePlayed: Date;
  addedAt: Date;
}

export interface ISubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelledAt?: Date;
}

export interface ICharityContribution {
  charityId: ObjectId;
  contributionPercent: number;
}

export interface IWinRecord {
  drawId: ObjectId;
  tier: WinTier;
  prizeAmount: number;
  payoutStatus: PayoutStatus;
  proofUrl?: string;
  verifiedAt?: Date;
  paidAt?: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatarUrl?: string;
  subscription: ISubscription;
  scores: IScore[];
  charityContribution?: ICharityContribution;
  drawsEntered: ObjectId[];
  winnings: IWinRecord[];
  createdAt: Date;
  updatedAt: Date;
}

//scoreschemas
const ScoreSchema = new Schema<IScore>(
  {
    points: { type: Number, required: true },
    datePlayed: { type: Date, required: true },
    addedAt: { type: Date, default: () => new Date() },
  },
  { _id: true }
);

const SubscriptionSchema = new Schema<ISubscription>(
  {
    plan: { type: String, enum: Object.values(SubscriptionPlan), required: true, default: SubscriptionPlan.Monthly },
    status: { type: String, enum: Object.values(SubscriptionStatus), default: SubscriptionStatus.Inactive },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { _id: false }
);

const CharityContributionSchema = new Schema<ICharityContribution>(
  {
    charityId: { type: Schema.Types.ObjectId, ref: "Charity", required: true },
    contributionPercent: { type: Number, required: true, default: 10 },
  },
  { _id: false }
);

const WinRecordSchema = new Schema<IWinRecord>(
  {
    drawId: { type: Schema.Types.ObjectId, ref: "Draw", required: true },
    tier: { type: String, enum: Object.values(WinTier), required: true },
    prizeAmount: { type: Number, required: true },
    payoutStatus: { type: String, enum: Object.values(PayoutStatus), default: PayoutStatus.Pending },
    proofUrl: { type: String, default: null },
    verifiedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
  },
  { _id: true }
);

//  main userschema 

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.User },
    avatarUrl: { type: String, default: null },
    subscription: {
      type: SubscriptionSchema,
      default: () => ({ plan: SubscriptionPlan.Monthly, status: SubscriptionStatus.Inactive }),
    },
    scores: { type: [ScoreSchema], default: [] },
    charityContribution: { type: CharityContributionSchema, default: null },
    drawsEntered: { type: [{ type: Schema.Types.ObjectId, ref: "Draw" }], default: [] },
    winnings: { type: [WinRecordSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// indexes 

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ "subscription.status": 1 });
UserSchema.index({ "subscription.stripeCustomerId": 1 });


export const User = mongoose.model<IUser>("User", UserSchema);