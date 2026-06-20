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
      to: ["fernandohimendra@gmail.com", "mywifesdumplingsofficial@gmail.com"],
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
