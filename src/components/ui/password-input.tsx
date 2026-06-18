"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** Brand-styled password field with a show/hide toggle. */
export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "type">
>(({ className, ...props }, ref) => {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <input
        ref={ref}
        type={show ? "text" : "password"}
        className={cn(
          "h-11 w-full rounded-md border-2 border-brand-ink/15 bg-brand-cream px-3 pr-11 font-body text-brand-ink",
          "placeholder:text-brand-ink/40",
          "focus-visible:border-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-brand-ink/50 hover:text-brand-ink"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  /** Met requirements, for the checklist UI. */
  checks: { label: string; ok: boolean }[];
}

/** Lightweight, dependency-free password strength estimate (length + character classes). */
export function scorePassword(pw: string): PasswordStrength {
  const checks = [
    { label: "At least 8 characters", ok: pw.length >= 8 },
    { label: "Upper & lower case", ok: /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
    { label: "A number", ok: /\d/.test(pw) },
    { label: "A symbol", ok: /[^A-Za-z0-9]/.test(pw) },
  ];
  const met = checks.filter((c) => c.ok).length;
  // Score 0 for empty, otherwise the count of satisfied checks (1–4).
  const score = (pw.length === 0 ? 0 : met) as PasswordStrength["score"];
  const label = ["", "Weak", "Fair", "Good", "Strong"][score];
  return { score, label, checks };
}

const BAR_COLORS = [
  "bg-brand-ink/10",
  "bg-red-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-green-600",
];

/** Visual strength meter + requirement checklist. */
export function PasswordMeter({ password }: { password: string }) {
  const { score, label, checks } = scorePassword(password);
  if (!password) return null;
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex h-1.5 flex-1 gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-full transition-colors",
                i <= score ? BAR_COLORS[score] : "bg-brand-ink/10",
              )}
            />
          ))}
        </div>
        <span className="font-body text-xs text-brand-ink/60">{label}</span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {checks.map((c) => (
          <li
            key={c.label}
            className={cn(
              "font-body text-xs",
              c.ok ? "text-green-700" : "text-brand-ink/45",
            )}
          >
            {c.ok ? "✓" : "○"} {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
