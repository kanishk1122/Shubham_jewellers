"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { Input, Button } from "@/components/ui";
import { User, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const [identifier, setIdentifier] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin@123");
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    if (!auth.loading && auth.user) {
      router.push("/dashboard");
    }
  }, [auth.loading, auth.user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLocalLoading(true);
    try {
      const result = await auth.login(identifier.trim(), password);
      if (result.success) {
        if (remember && typeof window !== "undefined") {
          localStorage.setItem("remember_me_identifier", identifier.trim());
        } else {
          localStorage.removeItem("remember_me_identifier");
        }
        router.push("/dashboard");
      } else {
        setError(result.error || "Invalid credentials");
      }
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    // prefill remembered identifier
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("remember_me_identifier");
      if (saved) {
        setIdentifier(saved);
        setRemember(true);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: Branding / Illustration */}
        <div className="hidden md:flex flex-col justify-center items-start gap-6 pl-6">
          <div className="flex items-center gap-3">
            <div className="relative w-[100px] h-[58px] rounded-md overflow-hidden shadow-lg">
              <Image src="/logo.png" alt="Logo" fill className="object-contain w-fit h-fit rounded"  />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Shubham Jewellers
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Billing & Inventory management for jewelry stores — secure,
                simple and fast.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow p-6 w-full border border-zinc-100 dark:border-zinc-700">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Welcome back!
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
              Sign in to continue to the dashboard. Manage bills, inventory,
              customers and reports from one place.
            </p>
            <ul className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <li>• Fast billing with GST support</li>
              <li>• Track bulk inventory & exchanges</li>
              <li>• Profit & loss and daily summaries</li>
            </ul>
          </div>
        </div>

        {/* Right: Login Card */}
        <div className="flex justify-center">
          <div className="w-full max-w-md bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-700 p-8">
            <div className="flex flex-col items-center mb-6">
              <Image
                src="/logo.png"
                alt="Logo"
                width={200}
                height={200}
                className="mb-4 rounded-2xl"
              />
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                Sign in to your account
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Enter your email or phone and password
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  <User className="w-4 h-4" />
                </span>
                <Input
                  placeholder="Email or phone"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10"
                  aria-label="Email or phone"
                  autoComplete="username"

                />
              </label>

              <label className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  <Lock className="w-4 h-4" />
                </span>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  aria-label="Password"
                  autoComplete="current-password"
                />
              </label>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700"
                  />
                  Remember me
                </label>
               
              </div>

              {error && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div>
                <Button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2"
                  disabled={localLoading || auth.loading}
                >
                  {(localLoading || auth.loading) && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Sign in
                </Button>
              </div>
            </form>

         
          </div>
        </div>
      </div>
    </div>
  );
}
