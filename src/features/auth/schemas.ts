import { z } from "zod";

export const loginSchema = z.object({
  phone: z.string().trim().min(1),
  pin: z.string().regex(/^\d{4,8}$/),
});

export const changePinSchema = z
  .object({
    currentPin: z.string().regex(/^\d{4,8}$/),
    newPin: z.string().regex(/^\d{4,8}$/),
    confirmPin: z.string().regex(/^\d{4,8}$/),
  })
  .refine((value) => value.newPin === value.confirmPin, {
    path: ["confirmPin"],
    message: "errors.pinMismatch",
  });

export const languageSchema = z.object({ lang: z.enum(["en", "hi"]) });
