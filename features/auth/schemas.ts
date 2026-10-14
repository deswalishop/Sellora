import { z } from "zod";

// Pakistani mobile: 03XX-XXXXXXX (with or without leading 0)
const phoneRegex = /^0?3\d{9}$/;

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name"),
  email: z.string().trim().toLowerCase().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a valid mobile number (03XX-XXXXXXX)")
    .optional()
    .or(z.literal("")),
  businessName: z.string().trim().min(2, "Please enter your business name"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email"),
  password: z.string().min(1, "Please enter your password"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
