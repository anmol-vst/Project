import { Charity } from "db/models";
import type {
  CreateCharityInput,
  UpdateCharityInput,
  AddCharityEventInput,
  UpdateCharityEventInput,
  CharityQueryInput,
} from "../zodValidation/CharityValidation.js";


const toSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

//  getAllCharities 

export const getAllCharities = async (query: CharityQueryInput) => {
  const { search, category, isFeatured, page, limit } = query;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { isActive: true };
  if (category) filter.category = category;
  if (isFeatured !== undefined) filter.isFeatured = isFeatured;
  if (search) filter.$text = { $search: search };

  const [charities, total] = await Promise.all([
    Charity.find(filter)
      .select("name slug shortDescription logoUrl category isFeatured totalSubscriberCount")
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Charity.countDocuments(filter),
  ]);

  return { charities, total, page, limit };
};

//getCharityBySlug

export const getCharityBySlug = async (slug: string) => {
  const charity = await Charity.findOne({ slug, isActive: true });
  if (!charity) throw new Error("Charity not found");
  return charity;
};

// getCharityById 
export const getCharityById = async (id: string) => {
  const charity = await Charity.findById(id);
  if (!charity) throw new Error("Charity not found");
  return charity;
};

// createCharity

export const createCharity = async (
  data: CreateCharityInput,
  adminId: string
) => {
  const slug = data.slug || toSlug(data.name);

  const existing = await Charity.findOne({ slug });
  if (existing) throw new Error("A charity with this slug already exists");

  const rawPayload = {
    ...data,
    slug,
    createdBy: adminId,
  };

  const payload = Object.fromEntries(
    Object.entries(rawPayload).filter(([, v]) => v !== undefined)
  ) as Record<string, unknown>;

  const charity = await Charity.create(payload);
  return charity;
};

// updateCharity

export const updateCharity = async (id: string, data: UpdateCharityInput) => {
  const charity = await Charity.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: false }
  );
  if (!charity) throw new Error("Charity not found");
  return charity;
};

// deleteCharity

export const deleteCharity = async (id: string) => {
  const charity = await Charity.findByIdAndUpdate(
    id,
    { $set: { isActive: false } },
    { new: true }
  );
  if (!charity) throw new Error("Charity not found");
};

//addEvent 

export const addEvent = async (
  charityId: string,
  data: AddCharityEventInput
) => {
  const charity = await Charity.findById(charityId);
  if (!charity) throw new Error("Charity not found");

  const event: any = {
    title: data.title,
    eventDate: new Date(data.eventDate),
  };

  if (data.description !== undefined) event.description = data.description;
  if (data.location !== undefined) event.location = data.location;
  if (data.imageUrl !== undefined) event.imageUrl = data.imageUrl;

  charity.events.push(event);

  await charity.save();
  return charity.toObject().events;
};
//updateEvent

export const updateEvent = async (
  charityId: string,
  eventId: string,
  data: UpdateCharityEventInput
) => {
  const charity = await Charity.findById(charityId);
  if (!charity) throw new Error("Charity not found");

  const event = charity.events.find(
    (e) => e._id?.toString() === eventId
  );
  if (!event) throw new Error("Event not found");

  if (data.title !== undefined) event.title = data.title;
  if (data.eventDate !== undefined) event.eventDate = new Date(data.eventDate);

  await charity.save();
  return charity.events;
};

//deleteEvent

export const deleteEvent = async (charityId: string, eventId: string) => {
  const charity = await Charity.findById(charityId);
  if (!charity) throw new Error("Charity not found");

  const exists = charity.events.some(
    (e) => e._id?.toString() === eventId
  );
  if (!exists) throw new Error("Event not found");

  charity.events = charity.events.filter(
    (e) => e._id?.toString() !== eventId
  ) as typeof charity.events;

  await charity.save();
};