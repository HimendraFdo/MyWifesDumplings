"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const passwordChanged = params.get("passwordChanged") === "true";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.login({ email: email.trim(), password });
      login(res);
      const redirect = params.get("redirect");
      if (redirect) router.push(redirect);
      else if (res.roles.includes("Admin")) router.push("/admin");
      else router.push("/account/orders");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429
          ? "Too many login attempts. Please wait a minute and try again."
          : err instanceof ApiError && err.status === 401
          ? "Incorrect email or password."
          : err instanceof ApiError
            ? err.message
            : "Could not log in. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {passwordChanged && (
        <p
          role="status"
          className="rounded-md border border-green-700/20 bg-green-50 p-3 font-body text-sm text-green-800"
        >
          Password changed successfully. Please log in again.
        </p>
      )}
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div role="alert" aria-live="assertive">
        <FieldError>{error}</FieldError>
      </div>
      <Button
        type="submit"
        disabled={submitting}
        className="h-12 w-full bg-brand-red text-base text-brand-cream hover:bg-brand-red-dark"
      >
        {submitting ? "Logging in…" : "Log in"}
      </Button>
      <p className="text-center font-body text-sm text-brand-ink/60">
        No account?{" "}
        <Link href="/register" className="font-semibold text-brand-red hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-md">
        <SectionHeading subheading="Log in to see your order history.">
          Welcome back
        </SectionHeading>
        <div className="mt-10 rounded-2xl border-2 border-brand-ink/10 bg-brand-cream/60 p-6 shadow-sm sm:p-8">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
          <p className="mt-6 flex items-center justify-center gap-1.5 font-body text-xs text-brand-ink/50">
            <Lock className="size-3.5" />
            Secured with encrypted password storage. We never see your password.
          </p>
        </div>
      </div>
    </div>
  );
}
