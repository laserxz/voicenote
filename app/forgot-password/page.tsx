"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Request failed");
      setLoading(false);
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white text-center mb-2">VoiceNote</h1>
        <p className="text-zinc-500 text-sm text-center mb-8">
          Reset your password
        </p>
        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-zinc-300 text-sm">
              If that email has an account, a reset link is on its way. Check
              your inbox — the link is valid for 1 hour.
            </p>
            <Link
              href="/login"
              className="inline-block text-zinc-400 hover:text-white text-sm underline underline-offset-2"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-zinc-950 font-semibold py-3 rounded-lg hover:bg-zinc-100 disabled:opacity-50 transition-colors"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
            <p className="text-zinc-500 text-sm text-center mt-6">
              <Link href="/login" className="text-zinc-300 hover:text-white underline underline-offset-2">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
