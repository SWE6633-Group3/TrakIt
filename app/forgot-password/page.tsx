"use client";

import { useState } from "react";
import Link from "next/link";

// Using the same base as your LoginForm
const API_BASE = "http://localhost:3001";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: Email, 2: New Password, 3: Success
  const [email, setEmail] = useState("");
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Ensure the '/api' prefix is included to match server.ts
      const res = await fetch(`${API_BASE}/api/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStep(2);
        setMessage(null);
      } else {
        setMessage({ type: "error", text: data.error || "Email not found." });
      }
    } catch (err) {
      console.error('Error verifying email:', err);
      setMessage({ type: "error", text: "Cannot connect to server. Check backend status." });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

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
      const res = await fetch(`${API_BASE}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          newPassword: passwords.new 
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setStep(3);
        setMessage(null);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update password." });
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setMessage({ type: "error", text: "Connection error during update." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
          Account Recovery
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl dark:text-slate-100">
          {step === 1 && "Find your account"}
          {step === 2 && "Set new password"}
          {step === 3 && "All set!"}
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          {step === 1 && "Enter your email address to verify your account identity."}
          {step === 2 && "Create a secure password for your account."}
          {step === 3 && "Your credentials have been updated successfully."}
        </p>

        <div className="mt-8">
          {step === 3 ? (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl text-sm bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 text-center font-medium">
                You can now log in to the project portal with your new password.
              </div>
              <Link
                href="/login"
                className="block w-full text-center rounded-xl bg-slate-900 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white transition-all shadow-md"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={step === 1 ? handleVerifyEmail : handleResetPassword} className="space-y-6">
                {step === 1 ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
                      Account Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:ring-blue-500/40 transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={passwords.new}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white transition-all"
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        required
                        value={passwords.confirm}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white transition-all"
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
                >
                  {loading ? "Processing..." : step === 1 ? "Verify Identity" : "Reset Password"}
                </button>
              </form>

              {message && (
                <div
                  className={`mt-6 p-4 rounded-2xl text-xs font-medium border animate-in fade-in slide-in-from-top-2 ${
                    message.type === "success"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                      : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="mt-8 text-center">
                <Link
                  href="/login"
                  className="text-xs font-medium text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors"
                >
                  ← Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <aside className="rounded-3xl border border-slate-200 bg-slate-50 px-8 py-8 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Project tracking starts here
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          TrakIt keeps requirements, risk registers, and team ownership aligned 
          in one consistent workspace. Protecting your account ensures your project
          data remains secure.
        </p>
      </aside>
    </div>
  );
}