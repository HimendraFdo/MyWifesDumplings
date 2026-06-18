"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
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
        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
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
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="mt-1 font-body text-xs text-brand-ink/50">
              At least 8 characters.
            </p>
          </div>
          <FieldError>{error}</FieldError>
          <Button
            type="submit"
            disabled={submitting}
            className="h-12 w-full bg-brand-red text-base text-brand-cream hover:bg-brand-red-dark"
          >
            {submitting ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-center font-body text-sm text-brand-ink/60">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-red hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
