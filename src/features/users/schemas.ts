import { z } from "zod";

export const createHawkerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  phone: z.string().trim().min(1),
  pin: z.string().regex(/^\d{4,8}$/),
});

export const updateHawkerSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(60),
  phone: z.string().trim().min(1),
});

export const setHawkerActiveSchema = z.object({
  id: z.string().min(1),
  active: z.boolean(),
});
