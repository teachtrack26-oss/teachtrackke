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
      const credential = credentialResponse?.credential;
      if (!credential) {
        throw new Error("Google did not return a credential token");
      }

      const res = await fetch("/api/v1/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          token: credential,
        }),
      });

      let data: any = null;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { detail: text };
      }

      if (!res.ok) {
        throw new Error(data?.detail || "Google sign-in failed");
      }

      // Store token and user data
      // localStorage.setItem("token", data.access_token);
      // localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect to dashboard
      window.dispatchEvent(new Event("teachtrack:authChanged"));
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const clientIdRaw = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientId = clientIdRaw?.replace(/\s+/g, "");

  if (!clientId) {
    return (
      <div className="text-red-500 text-sm flex flex-col items-center">
        <p>Google Client ID not configured</p>
        <p className="text-xs text-gray-400 mt-1">Check console for details</p>
      </div>
    );
  }

  const handleGoogleError = () => {
    const detailedError = `Google Sign-In Failed. This usually means:
1. The Google Client ID doesn't match your domain
2. Your domain isn't authorized in Google Cloud Console
3. Check that 'Authorized JavaScript origins' includes: ${
      window.location.origin
    }

Current domain: ${window.location.origin}
Client ID: ${clientId.substring(0, 20)}...`;

    console.error(detailedError);
    setError(
      "Google Sign-In configuration error. Check browser console for details."
    );
  };

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <GoogleOAuthProvider clientId={clientId}>
        <div className="w-full flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleGoogleError}
            theme="filled_blue"
            shape="rectangular"
            text="continue_with"
            useOneTap={false}
            ux_mode="popup"
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
