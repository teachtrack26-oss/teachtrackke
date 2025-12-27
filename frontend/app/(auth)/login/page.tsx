"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import posthog from "posthog-js";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [captcha, setCaptcha] = useState<{
    id: string;
    question: string;
  } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  // Check if user is already logged in
  useEffect(() => {
    fetchCaptcha();
    // Don't clear auth if coming back from OAuth callback with error
    const error = searchParams.get("error");
    if (error) {
      // Show OAuth error message
      if (error === "Configuration") {
        toast.error("Google sign-in configuration error. Please try again.");
      } else {
        toast.error(`Sign-in error: ${error}`);
      }
    }

    // Only clear auth data if user is intentionally visiting login page
    // Don't clear if there's an OAuth callback happening
    const callbackUrl = searchParams.get("callbackUrl");
    if (!callbackUrl) {
      // localStorage.removeItem("accessToken");
      // localStorage.removeItem("user");
      // sessionStorage.clear();
    }
    setCheckingAuth(false);
  }, [searchParams]);

  const fetchCaptcha = async () => {
    try {
      const res = await fetch("/api/v1/auth/captcha");
      if (res.ok) {
        const data = await res.json();
        setCaptcha(data);
      }
    } catch (error) {
      console.error("Failed to fetch captcha", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clear any existing session data before login
      // localStorage.removeItem("accessToken");
      // localStorage.removeItem("user");
      // sessionStorage.clear();

      // Call backend API directly
      // Use Next.js rewrite proxy to avoid CORS in dev
      const response = await fetch(`/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          captcha_id: captcha?.id,
          captcha_answer: captchaAnswer,
        }),
      });

      if (!response.ok) {
        let msg = "Invalid credentials";
        try {
          const text = await response.text();
          // Try to parse JSON error if possible
          try {
            const jsonError = JSON.parse(text);
            msg = jsonError.detail || msg;
          } catch {
            msg = text || msg;
          }
        } catch {}
        toast.error(msg);
        setLoading(false);
        fetchCaptcha();
        setCaptchaAnswer("");
        return;
      }

      const data = await response.json();

      // Fetch user info - Cookie will be sent automatically
      const userResponse = await fetch(`/api/v1/auth/me`, {
        credentials: "include",
        // headers: { Authorization: `Bearer ${data.access_token}` }, // No longer needed
      });

      if (userResponse.ok) {
        const user = await userResponse.json();

        posthog.capture("teacher_login", { method: "email" });

        // Store user info in localStorage (but NOT the token)
        // localStorage.setItem("accessToken", data.access_token); // REMOVED for security
        // localStorage.setItem(
        //   "user",
        //   JSON.stringify({
        //     id: user.id,
        //     email: user.email,
        //     name: user.full_name,
        //     is_admin: user.is_admin,
        //     role: user.role,
        //     subscription_type: user.subscription_type,
        //     has_subjects: user.has_subjects,
        //   })
        // );

        toast.success("Login successful!");

        // Notify the rest of the app (Navbar/layout) that auth state has changed.
        // This helps immediately unlock UI that depends on cookie-based auth.
        window.dispatchEvent(new Event("teachtrack:authChanged"));

        // Redirect based on user role
        if (user.role === "SUPER_ADMIN") {
          router.push("/dashboard"); // Super Admin sees Super Admin Dashboard
        } else if (user.role === "SCHOOL_ADMIN") {
          router.push("/dashboard"); // School Admin sees School Admin Dashboard
        } else {
          // Check if teacher has subjects
          if (user.has_subjects === false) {
            toast("Welcome! Please select a plan to continue.", { icon: "👋" });
            router.push("/pricing");
          } else {
            router.push("/dashboard"); // Teachers see Teacher Dashboard
          }
        }
      } else {
        toast.success("Login successful!");

        // Still notify app even if /me fails (cookie may not be readable yet).
        window.dispatchEvent(new Event("teachtrack:authChanged"));

        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Login error", error);
      toast.error(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-cyan-50 to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-cyan-50 to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-2xl p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome back to TeachTrack
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign up free
            </Link>
          </p>
        </div>

        {/* Google Sign In */}
        <div className="mb-6">
          <GoogleSignInButton />

          {/* Helper text */}
          <p className="mt-3 text-center text-xs text-gray-500 italic">
            New to TeachTrack? Google Sign-In automatically creates your
            account!
          </p>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                placeholder="teacher@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white ph-no-capture"
                placeholder="••••••••"
              />
            </div>

            {captcha && (
              <div>
                <label
                  htmlFor="captcha"
                  className="block text-sm font-medium text-gray-700"
                >
                  Security Check: {captcha.question}
                </label>
                <input
                  id="captcha"
                  name="captcha"
                  type="text"
                  required
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                  placeholder="Answer"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
