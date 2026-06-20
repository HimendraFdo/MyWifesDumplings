"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { contactSchema, ContactFormData } from "@/lib/validations";
import { sendEnquiry } from "@/app/actions/sendEnquiry";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const shakeControls = useAnimationControls();

  // Wobbly shake when the form is submitted with validation errors —
  // playful, like the rest of the hand-drawn brand.
  const onInvalid = () => {
    shakeControls.start({
      x: [0, -8, 8, -6, 6, -3, 0],
      transition: { duration: 0.4, ease: "easeInOut" },
    });
  };

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
    "w-full min-h-[44px] font-body text-sm text-brand-ink bg-[#FBF4EC] border-2 border-brand-red/40 rounded px-3 py-2.5 outline-none focus:border-brand-red transition-colors placeholder:text-brand-ink/30";
  const errorClass = "font-body text-xs text-red-600 mt-1";
  const labelClass = "block font-body text-sm font-medium text-brand-ink/70 mb-1";

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
        className="text-center py-12 space-y-3"
      >
        <motion.p
          initial={{ scale: 1.3, rotate: -6 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.175, 0.885, 0.32, 1.275] }}
          className="font-display text-3xl italic text-brand-ink"
        >
          Thank you! 🥟
        </motion.p>
        <p className="font-body text-brand-ink/70">We&apos;ll be in touch shortly.</p>
        <button
          onClick={() => setStatus("idle")}
          className="inline-flex min-h-[44px] items-center font-body text-sm text-brand-red border-b border-brand-red hover:opacity-70 transition-opacity"
        >
          Send another message
        </button>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      animate={shakeControls}
      className="space-y-5 max-w-lg mx-auto"
    >
      <div>
        <label htmlFor="name" className={labelClass}>Name *</label>
        <input id="name" {...register("name")} placeholder="Your name" className={inputClass} />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>Email *</label>
        <input id="email" type="email" {...register("email")} placeholder="you@example.com" className={inputClass} />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="phone" className={labelClass}>Phone (optional)</label>
        <input id="phone" type="tel" {...register("phone")} placeholder="021 000 0000" className={inputClass} />
        {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
      </div>

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

      <fieldset>
        <legend className={labelClass}>Flavours * (select all that apply)</legend>
        <div className="flex flex-wrap gap-x-6 mt-1">
          <label className="flex min-h-[44px] items-center gap-2 py-2 font-body text-sm text-brand-ink/80 cursor-pointer">
            <input type="checkbox" value="pork_chives" {...register("flavours")}
              className="accent-brand-red w-5 h-5" />
            Pork &amp; Chives
          </label>
          <label className="flex min-h-[44px] items-center gap-2 py-2 font-body text-sm text-brand-ink/80 cursor-pointer">
            <input type="checkbox" value="pork_cabbage" {...register("flavours")}
              className="accent-brand-red w-5 h-5" />
            Pork &amp; Cabbage
          </label>
        </div>
        {errors.flavours && <p className={errorClass}>{errors.flavours.message}</p>}
      </fieldset>

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
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="font-body text-sm text-red-600"
        >
          {errorMsg}
        </motion.p>
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
    </motion.form>
  );
}
