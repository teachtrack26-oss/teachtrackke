"use client";

import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GoogleSignInButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          token: credentialResponse.credential,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Google sign-in failed");
      }

      // Store token and user data
      // localStorage.setItem("token", data.access_token);
      // localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  console.log(
    "Google Client ID loaded:",
    clientId ? "Yes (" + clientId.substring(0, 10) + "...)" : "No"
  );

  if (!clientId) {
    return (
      <div className="text-red-500 text-sm flex flex-col items-center">
        <p>Google Client ID not configured</p>
        <p className="text-xs text-gray-400 mt-1">Check console for details</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <GoogleOAuthProvider clientId={clientId}>
        <div className="w-full flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => setError("Google Sign-In Failed")}
            theme="filled_blue"
            shape="rectangular"
            text="continue_with"
            useOneTap={false}
          />
        </div>
      </GoogleOAuthProvider>

      {isLoading && (
        <p className="text-sm text-gray-500 animate-pulse">Signing in...</p>
      )}

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
}
