# Agent 5 — Order Form & Email (React Hook Form + Zod + Resend)

## Your role
You are the forms & email agent. Your job is to build a contact/enquiry form that lets customers send a message or order enquiry directly from the website. The form is validated client-side (Zod + React Hook Form) and sends a transactional email via Resend when submitted.

This supplements the Google Forms order link — customers who prefer email enquiries can use this form.

---

## Why this tech stack adds CV value
- **React Hook Form** — industry standard for performant forms in React NZ (used at Xero, Trade Me, etc.)
- **Zod** — Himendra already knows Zod for backend, but using it for client-side form validation is a different, common pattern
- **Resend** — modern transactional email API, popular with NZ startups and Next.js projects (replaces Sendgrid for many teams)
- **Next.js Server Actions** — used here instead of an API route, demonstrating Next.js App Router patterns

---

## Prerequisites

All packages already installed from Agent 1:
- `react-hook-form`
- `@hookform/resolvers`
- `zod`
- `resend`

You need a **free Resend account** and API key:
1. Sign up at resend.com (free tier: 3,000 emails/month)
2. Create an API key
3. Add to `.env.local`: `RESEND_API_KEY=re_...`
4. Add the verified sender domain (or use `onboarding@resend.dev` for testing)

---

## Step 1 — Zod validation schema

Edit `src/lib/validations.ts`:

```ts
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
    required_error: "Please select a quantity",
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
```

---

## Step 2 — Server Action

Create `src/app/actions/sendEnquiry.ts`:

```ts
"use server";

import { Resend } from "resend";
import { contactSchema, ContactFormData } from "@/lib/validations";

const resend = new Resend(process.env.RESEND_API_KEY);

const FLAVOUR_LABELS: Record<string, string> = {
  pork_chives: "Pork & Chives",
  pork_cabbage: "Pork & Cabbage",
};

const QUANTITY_LABELS: Record<string, string> = {
  "20": "20pcs ($16.00)",
  "60": "60pcs ($45.00)",
  other: "Custom / Ask me",
};

export async function sendEnquiry(data: ContactFormData) {
  const parsed = contactSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid form data." };
  }

  const { name, email, phone, quantity, flavours, message } = parsed.data;

  try {
    await resend.emails.send({
      from: "My Wife's Dumplings <onboarding@resend.dev>",
      // Replace with your real verified email in production:
      to: ["fernandohimendra@gmail.com"],
      replyTo: email,
      subject: `New dumpling enquiry from ${name}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #C0392B; font-style: italic;">New Enquiry — My Wife's Dumplings</h1>
          <hr style="border-color: #C0392B; opacity: 0.3;" />
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr><td style="padding: 8px 0; color: #666; width: 140px;">Name</td><td style="padding: 8px 0;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;">${email}</td></tr>
            ${phone ? `<tr><td style="padding: 8px 0; color: #666;">Phone</td><td style="padding: 8px 0;">${phone}</td></tr>` : ""}
            <tr><td style="padding: 8px 0; color: #666;">Quantity</td><td style="padding: 8px 0;">${QUANTITY_LABELS[quantity]}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Flavours</td><td style="padding: 8px 0;">${flavours.map((f) => FLAVOUR_LABELS[f]).join(", ")}</td></tr>
            ${message ? `<tr><td style="padding: 8px 0; color: #666; vertical-align: top;">Message</td><td style="padding: 8px 0;">${message}</td></tr>` : ""}
          </table>
          <hr style="border-color: #C0392B; opacity: 0.3; margin-top: 24px;" />
          <p style="color: #999; font-size: 12px; font-family: sans-serif;">Sent from the My Wife's Dumplings website enquiry form.</p>
        </div>
      `,
    });

    // Confirmation email to customer
    await resend.emails.send({
      from: "My Wife's Dumplings <onboarding@resend.dev>",
      to: [email],
      subject: "We got your enquiry! 🥟",
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #F5E6D3;">
          <h1 style="color: #C0392B; font-style: italic;">Thanks, ${name}!</h1>
          <p style="font-family: sans-serif; color: #1A0A00cc;">
            We got your enquiry and we'll get back to you soon. Can't wait to share some dumplings with you!
          </p>
          <p style="font-family: sans-serif; color: #1A0A00cc;">
            — My Wife's Dumplings, Auckland NZ 🥟
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (err) {
    console.error("Resend error:", err);
    return { success: false, error: "Failed to send. Please try again." };
  }
}
```

---

## Step 3 — Contact Form component

Create `src/components/sections/ContactForm.tsx`:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { contactSchema, ContactFormData } from "@/lib/validations";
import { sendEnquiry } from "@/app/actions/sendEnquiry";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setStatus("loading");
    const result = await sendEnquiry(data);
    if (result.success) {
      setStatus("success");
      reset();
    } else {
      setStatus("error");
      setErrorMsg(result.error ?? "Something went wrong.");
    }
  };

  const inputClass =
    "w-full font-body text-sm text-brand-ink bg-[#FBF4EC] border-2 border-brand-red/40 rounded px-3 py-2 outline-none focus:border-brand-red transition-colors placeholder:text-brand-ink/30";
  const errorClass = "font-body text-xs text-red-600 mt-1";
  const labelClass = "block font-body text-sm font-medium text-brand-ink/70 mb-1";

  if (status === "success") {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="font-display text-3xl italic text-brand-ink">Thank you! 🥟</p>
        <p className="font-body text-brand-ink/70">We'll be in touch shortly.</p>
        <button
          onClick={() => setStatus("idle")}
          className="font-body text-sm text-brand-red border-b border-brand-red hover:opacity-70 transition-opacity"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg mx-auto">
      {/* Name */}
      <div>
        <label htmlFor="name" className={labelClass}>Name *</label>
        <input id="name" {...register("name")} placeholder="Your name" className={inputClass} />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className={labelClass}>Email *</label>
        <input id="email" type="email" {...register("email")} placeholder="you@example.com" className={inputClass} />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className={labelClass}>Phone (optional)</label>
        <input id="phone" type="tel" {...register("phone")} placeholder="021 000 0000" className={inputClass} />
        {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
      </div>

      {/* Quantity */}
      <div>
        <label htmlFor="quantity" className={labelClass}>Quantity *</label>
        <select id="quantity" {...register("quantity")} className={inputClass}>
          <option value="">Select quantity...</option>
          <option value="20">20pcs — $16.00</option>
          <option value="60">60pcs — $45.00</option>
          <option value="other">Not sure / ask me</option>
        </select>
        {errors.quantity && <p className={errorClass}>{errors.quantity.message}</p>}
      </div>

      {/* Flavours */}
      <fieldset>
        <legend className={labelClass}>Flavours * (select all that apply)</legend>
        <div className="flex gap-6 mt-1">
          <label className="flex items-center gap-2 font-body text-sm text-brand-ink/80 cursor-pointer">
            <input type="checkbox" value="pork_chives" {...register("flavours")}
              className="accent-brand-red w-4 h-4" />
            Pork &amp; Chives
          </label>
          <label className="flex items-center gap-2 font-body text-sm text-brand-ink/80 cursor-pointer">
            <input type="checkbox" value="pork_cabbage" {...register("flavours")}
              className="accent-brand-red w-4 h-4" />
            Pork &amp; Cabbage
          </label>
        </div>
        {errors.flavours && <p className={errorClass}>{errors.flavours.message}</p>}
      </fieldset>

      {/* Message */}
      <div>
        <label htmlFor="message" className={labelClass}>Message (optional)</label>
        <textarea
          id="message"
          {...register("message")}
          rows={3}
          placeholder="Any special requests, preferred pickup time, etc."
          className={inputClass}
        />
        {errors.message && <p className={errorClass}>{errors.message.message}</p>}
      </div>

      {status === "error" && (
        <p className="font-body text-sm text-red-600">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full font-body font-bold tracking-wider uppercase
          px-8 py-4 text-base bg-brand-red text-brand-cream
          border-2 border-brand-red-dark
          [border-radius:3px_8px_4px_7px/7px_4px_8px_3px]
          transition-all duration-150
          hover:bg-brand-red-dark hover:shadow-md active:scale-95
          disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Sending…" : "Send Enquiry"}
      </button>
    </form>
  );
}
```

---

## Step 4 — Wire the form into ContactSection

Update `src/components/sections/ContactSection.tsx` to include both the Google Forms button AND the enquiry form:

```tsx
import { OrderButton } from "@/components/brand/OrderButton";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { RedDivider } from "@/components/brand/RedDivider";
import { ContactForm } from "./ContactForm";

interface ContactSectionProps {
  orderFormUrl?: string;
  instagramUrl?: string;
}

export function ContactSection({ orderFormUrl, instagramUrl }: ContactSectionProps) {
  return (
    <section id="contact" className="py-24 px-4">
      <div className="max-w-2xl mx-auto">
        <SectionHeading subheading="Two ways to reach us — pick your favourite.">
          Get in Touch
        </SectionHeading>

        <RedDivider className="my-10" />

        {/* Quick order CTA */}
        <div className="text-center mb-12 space-y-3">
          <p className="font-body text-brand-ink/70">
            Prefer a quick order? Use our Google Form:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {orderFormUrl && <OrderButton href={orderFormUrl} size="lg" />}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block font-body font-bold tracking-wider uppercase
                  px-8 py-4 text-base text-brand-red
                  border-2 border-brand-red
                  [border-radius:3px_8px_4px_7px/7px_4px_8px_3px]
                  transition-all duration-150 hover:bg-brand-red/10"
              >
                DM on Instagram
              </a>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-brand-red/20" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-brand-cream px-4 font-body text-sm text-brand-ink/40">
              or send us a message
            </span>
          </div>
        </div>

        {/* Enquiry form */}
        <div className="mt-10">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
```

---

## Step 5 — Write a Vitest test for the Zod schema

Create `src/test/validations.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { contactSchema } from "@/lib/validations";

describe("contactSchema", () => {
  it("accepts valid data", () => {
    const result = contactSchema.safeParse({
      name: "Jane Smith",
      email: "jane@example.com",
      quantity: "20",
      flavours: ["pork_chives"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    const result = contactSchema.safeParse({
      name: "Jane",
      quantity: "20",
      flavours: ["pork_cabbage"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty flavours", () => {
    const result = contactSchema.safeParse({
      name: "Jane",
      email: "jane@example.com",
      quantity: "60",
      flavours: [],
    });
    expect(result.success).toBe(false);
  });
});
```

Run: `npx vitest run`

---

## Verify success

1. Run `npm run dev`
2. Navigate to `localhost:3000/#contact`
3. Submit the form with invalid data — red error messages should appear inline
4. Submit with valid data — the form should show a success state
5. Check your email (fernandohimendra@gmail.com) for the enquiry notification
6. The customer should receive a confirmation email too

---

## Output for next agent

Agent 6 (Animations & Polish) receives:
- Fully working form at `#contact`
- All sections rendering real data
- The site is functionally complete — Agent 6 layers on motion and visual polish
