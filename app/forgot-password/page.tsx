"use client";

import { useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

type Message = {
  type: "success" | "error";
  text: string;
};

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  const handleRequestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setDemoCode("");
    setResetCode("");

    try {
      const response = await fetch(`${API_BASE}/api/password-reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to generate a reset code.");
      }

      setDemoCode(String(payload?.demoCode ?? ""));
      setStep(2);
      setMessage({
        type: "success",
        text: "Demo reset code generated. Enter it below with your new password.",
      });
    } catch (error: unknown) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Cannot connect to server.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!/^\d{6}$/.test(resetCode.trim())) {
      setMessage({ type: "error", text: "Enter the 6-digit reset code." });
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    if (passwords.new.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/password-reset/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          code: resetCode.trim(),
          newPassword: passwords.new,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to reset password.");
      }

      setStep(3);
      setMessage(null);
    } catch (error: unknown) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Connection error during update.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-lg border border-slate-200 bg-white px-8 py-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
          Account Recovery
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl dark:text-slate-100">
          {step === 1 && "Request reset code"}
          {step === 2 && "Set new password"}
          {step === 3 && "All set!"}
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          {step === 1 && "Enter your email address to generate a demo reset code."}
          {step === 2 && "Use the demo code and choose a new password."}
          {step === 3 && "Your credentials have been updated successfully."}
        </p>

        <div className="mt-8">
          {step === 3 ? (
            <div className="space-y-6">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-center text-sm font-medium text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                You can now log in with your new password.
              </div>
              <Link
                href="/login"
                className="block w-full rounded-lg bg-slate-900 py-3.5 text-center text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={step === 1 ? handleRequestCode : handleConfirmReset} className="space-y-6">
                <div className="space-y-2">
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Account Email
                  </label>
                  <input
                    type="email"
                    required
                    disabled={step === 2}
                    placeholder="name@company.com"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:ring-blue-500/40"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>

                {step === 2 && (
                  <div className="space-y-5">
                    {demoCode && (
                      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                        <p className="font-semibold">Demo reset code: {demoCode}</p>
                        <p className="mt-1 text-xs">
                          For the class demo, enter this code below. It expires in 10 minutes.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Reset Code
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        required
                        value={resetCode}
                        placeholder="000000"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                        onChange={(event) => setResetCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={passwords.new}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                        onChange={(event) => setPasswords({ ...passwords, new: event.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        required
                        value={passwords.confirm}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                        onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? "Processing..." : step === 1 ? "Generate Reset Code" : "Reset Password"}
                </button>
              </form>

              {message && (
                <div
                  className={`mt-6 rounded-lg border p-4 text-xs font-medium ${
                    message.type === "success"
                      ? "border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="mt-8 text-center">
                <Link
                  href="/login"
                  className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-900 dark:text-slate-500 dark:hover:text-white"
                >
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <aside className="rounded-lg border border-slate-200 bg-slate-50 px-8 py-8 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Demo recovery flow
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          The reset code appears on screen for the class presentation. In a hosted production app,
          this same code would be delivered outside the app.
        </p>
      </aside>
    </div>
  );
}
