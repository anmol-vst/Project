import mongoose, { Document, Schema } from "mongoose";
import { CharityCategory, type ObjectId } from "./Types.js";


export interface ICharityEvent {
  _id?: Schema.Types.ObjectId;
  title: string;
  description?: string;
  eventDate: Date;
  location?: string;
  imageUrl?: string;
}

export interface ICharity extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  websiteUrl?: string;
  registrationNumber?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  galleryImages: string[];
  category: CharityCategory;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  events: ICharityEvent[];
  totalContributionsReceived: number;
  totalSubscriberCount: number;
  contactName?: string;
  contactEmail?: string;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// sub-schema

const CharityEventSchema = new Schema<ICharityEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    eventDate: { type: Date, required: true },
    location: { type: String, default: null },
    imageUrl: { type: String, default: null },
  },
  { _id: true, timestamps: true }
);

// ─── Main Schema ──────────────────────────────────────────────────────────────

const CharitySchema = new Schema<ICharity>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true },
    shortDescription: { type: String, required: true, trim: true },
    websiteUrl: { type: String, default: null },
    registrationNumber: { type: String, default: null },
    logoUrl: { type: String, default: null },
    coverImageUrl: { type: String, default: null },
    galleryImages: { type: [String], default: [] },
    category: { type: String, enum: Object.values(CharityCategory), required: true },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    events: { type: [CharityEventSchema], default: [] },
    totalContributionsReceived: { type: Number, default: 0 },
    totalSubscriberCount: { type: Number, default: 0 },
    contactName: { type: String, default: null },
    contactEmail: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// indexes 

CharitySchema.index({ slug: 1 }, { unique: true });
CharitySchema.index({ isActive: 1, isFeatured: 1 });
CharitySchema.index({ category: 1, isActive: 1 });
CharitySchema.index({ name: "text", description: "text", tags: "text" });

export const Charity = mongoose.model<ICharity>("Charity", CharitySchema);