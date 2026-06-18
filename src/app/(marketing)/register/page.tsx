"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";
import {
  PasswordInput,
  PasswordMeter,
  scorePassword,
} from "@/components/ui/password-input";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (scorePassword(password).score < 2) {
      setError("Please choose a stronger password — mix in upper/lower case, a number, or a symbol.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await api.register({ email: email.trim(), password });
      // Convenience: log straight in after a successful signup.
      const auth = await api.login({ email: email.trim(), password });
      login(auth);
      router.push("/account/orders");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? "An account with that email already exists."
          : err instanceof ApiError
            ? err.message
            : "Could not create your account. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-md">
        <SectionHeading subheading="Save your orders and track them anytime.">
          Create an account
        </SectionHeading>
        <div className="mt-10 rounded-2xl border-2 border-brand-ink/10 bg-brand-cream/60 p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordMeter password={password} />
            </div>
            <div>
              <Label htmlFor="confirm">Confirm password</Label>
              <PasswordInput
                id="confirm"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              {confirm.length > 0 && confirm !== password && (
                <FieldError>Passwords do not match.</FieldError>
              )}
            </div>
            <FieldError>{error}</FieldError>
            <Button
              type="submit"
              disabled={submitting}
              className="h-12 w-full bg-brand-red text-base text-brand-cream hover:bg-brand-red-dark"
            >
              {submitting ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 flex items-start gap-2 font-body text-xs text-brand-ink/55">
            <ShieldCheck className="mt-px size-4 shrink-0 text-brand-ink/40" />
            Your password is hashed and stored securely on our server — it&apos;s never
            saved or sent in plain text, and we can never read it.
          </p>
          <p className="mt-4 text-center font-body text-sm text-brand-ink/60">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-red hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
