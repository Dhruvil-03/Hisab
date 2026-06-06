"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  friendlyAuthError,
  normalizeUsername,
  usernameToEmail,
  validateUsername,
} from "@/lib/auth-username";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const normalized = normalizeUsername(username);
    const validationError = validateUsername(normalized);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: usernameToEmail(normalized),
      password,
      options: {
        data: { display_name: username.trim() },
      },
    });

    setLoading(false);
    if (authError) {
      setError(friendlyAuthError(authError.message));
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[var(--primary)]">Create account</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Each family member picks a unique username
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="field">
          <label className="label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="input"
            type="text"
            required
            autoComplete="username"
            autoCapitalize="off"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. ali (letters, numbers, _)"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            3–24 characters. Sign in with username only — not your real Gmail.
          </p>
        </div>
        <div className="field">
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="input"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Creating..." : "Sign up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[var(--primary)]">
          Sign in
        </Link>
      </p>
    </div>
  );
}
