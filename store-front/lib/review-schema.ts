import { z } from "zod";

export const ReviewFields = {
  rating: z.number().int().min(1, { error: "Pick a rating" }).max(5),
  title: z.string().trim().min(1, { error: "Title is required" }).max(120),
  review: z.string().trim().min(10, { error: "Review must be at least 10 characters" }).max(2000),
};
