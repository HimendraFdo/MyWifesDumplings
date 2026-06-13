import { z } from "zod";

export const contactSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name is too long"),
  email: z
    .string()
    .email("Please enter a valid email address"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[\d\s\+\-\(\)]{7,20}$/.test(val),
      "Please enter a valid phone number"
    ),
  quantity: z.enum(["20", "60", "other"], {
    message: "Please select a quantity",
  }),
  flavours: z
    .array(z.enum(["pork_chives", "pork_cabbage"]))
    .min(1, "Please select at least one flavour"),
  message: z
    .string()
    .max(500, "Message is too long")
    .optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;
