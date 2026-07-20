"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing sign-in…");
  useEffect(() => {
    const complete = async () => {
      const values = new URLSearchParams(window.location.hash.slice(1));
      const access_token = values.get("access_token");
      if (!access_token)
        return setMessage("Sign-in could not be completed. Please try again.");
      const apiUrl = "/api";
      const response = await fetch(`${apiUrl}/auth/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          access_token,
          expires_at: values.get("expires_at"),
        }),
      });
      if (!response.ok)
        return setMessage("Sign-in could not be completed. Please try again.");
      router.replace("/");
      router.refresh();
    };
    complete();
  }, [router]);
  return (
    <main className="min-h-screen grid place-items-center px-4 text-sm text-gray-600">
      {message}
    </main>
  );
}
