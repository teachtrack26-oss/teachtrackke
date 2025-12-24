"use client";

import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forgot password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Password reset is not available yet for this deployment.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-700">
            If you need help accessing your account, please contact support or
            sign in using Google if your account was created with Google.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Link
            href="/login"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to sign in
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
