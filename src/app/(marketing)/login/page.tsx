"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
        err instanceof ApiError && err.status === 401
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <FieldError>{error}</FieldError>
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
        <div className="mt-10">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
