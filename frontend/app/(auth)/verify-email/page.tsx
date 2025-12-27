"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const token = searchParams.get("token");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        return;
      }

      try {
        const response = await fetch(
          `/api/v1/auth/verify-email?token=${token}`
        );

        if (!response.ok) {
          throw new Error("Verification failed");
        }

        setStatus("success");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (error) {
        setStatus("error");
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-[2rem] shadow-2xl shadow-primary-500/5 p-8 border border-white/10 text-center">
        {status === "loading" && (
          <>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Verifying your email...
            </h2>
            <p className="text-gray-600">Please wait a moment</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-4">
                <FiCheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Email Verified Successfully!
            </h2>
            <p className="text-gray-600">
              Your email has been verified. You can now sign in to your account.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to login page...
            </p>
            <Link
              href="/login"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-primary-700 transition-colors"
            >
              Go to Login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex justify-center">
              <div className="rounded-full bg-red-100 p-4">
                <FiXCircle className="h-16 w-16 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Verification Failed
            </h2>
            <p className="text-gray-600">
              The verification link is invalid or has expired.
            </p>
            <Link
              href="/register"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-primary-700 transition-colors"
            >
              Register Again
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#020617] py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 bg-white rounded-[2rem] shadow-2xl shadow-primary-500/5 p-8 border border-white/10 text-center">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Loading...</h2>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
