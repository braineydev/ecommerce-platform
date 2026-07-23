"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { signup, startGoogleSignIn } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signup(form);
      router.push("/");
    } catch (err) {
      setError(err.message || "Unable to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfb] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-md border border-neutral-200 bg-white p-7 sm:p-9">
        <div className="mb-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Create account
          </p>
          <h1 className="mt-3 text-3xl font-medium tracking-[-0.045em] text-neutral-950">
            Join TRIPPLE ORE
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Full name
            </label>
            <input
              name="full_name"
              autoComplete="name"
              value={form.full_name}
              onChange={handleChange}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-black focus:bg-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-black focus:bg-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-black focus:bg-white"
            />
            <p className="mt-2 text-xs text-gray-500">
              Use 12+ characters with uppercase, lowercase, number, and symbol.
            </p>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#171716] px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.13em] text-white hover:bg-neutral-700 disabled:opacity-70"
          >
            {isSubmitting ? "Please wait..." : "Create account"}
          </button>
        </form>

        {/* Google signup is temporarily hidden until provider setup is sorted. */}
        <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
          <span className="h-px flex-1 bg-gray-200" />
          or
          <span className="h-px flex-1 bg-gray-200" />
        </div>
        <div className="hidden">
          <button
            type="button"
            onClick={() =>
              startGoogleSignIn().catch(err => setError(err.message))
            }
            className="w-full border border-neutral-300 px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.13em] text-neutral-800 hover:bg-neutral-50"
          >
            Continue with Google
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-black">
            Sign in
          </Link>
        </p>
        <p className="mt-5 text-center text-xs leading-5 text-neutral-500">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
