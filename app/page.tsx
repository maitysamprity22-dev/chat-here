"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BrandMark from "@/components/BrandMark";

export default function SignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "https://chatapp.adnecto.in/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.error.message);
        setLoading(false);
        return;
      }

      localStorage.setItem("token", result.data.token);
      localStorage.setItem("username", result.data.username);

      router.push("/rooms");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }

  }


  return (
    <div className="app-shell flex min-h-screen items-center justify-center">
      <div className="panel w-full max-w-md p-7 sm:p-10">
        <div className="mb-8 flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="brand-name">ChitChat</p>

          </div>
        </div>
        <p className="mb-6 text-lg text-rose-100/75">Sign in</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
            className="field w-full"
          />
          <button
            type="submit"
            disabled={loading}
            className="button button--primary w-full"
          >
            {loading ? "Joining..." : "Continue"}
          </button>
          {error && <p className="notice">{error}</p>}
        </form>
      </div>
    </div>
  );
}           