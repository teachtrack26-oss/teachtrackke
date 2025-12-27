"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import axios from "axios";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { FiEye, FiEyeOff, FiCheck, FiX } from "react-icons/fi";
import { useCustomAuth } from "@/hooks/useCustomAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useCustomAuth(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    school: "",
    gradeLevel: "",
    tscNumber: "",
    role: "TEACHER", // Default role
  });
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [] as string[],
  });

  // Check if user is already logged in
  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated) {
      router.replace("/dashboard");
      return;
    }

    setCheckingAuth(false);
  }, [authLoading, isAuthenticated, router]);

  // Calculate password strength
  useEffect(() => {
    const calculateStrength = (pwd: string) => {
      let score = 0;
      const feedback: string[] = [];

      if (pwd.length >= 8) {
        score++;
      } else {
        feedback.push("At least 8 characters");
      }

      if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) {
        score++;
      } else {
        feedback.push("Upper & lowercase letters");
      }

      if (/\d/.test(pwd)) {
        score++;
      } else {
        feedback.push("At least one number");
      }

      if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
        score++;
      } else {
        feedback.push("Special character (@, !, #, etc.)");
      }

      setPasswordStrength({ score, feedback });
    };

    if (formData.password) {
      calculateStrength(formData.password);
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
    }
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`/api/v1/auth/register`, {
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        phone: formData.phone,
        school: formData.school,
        grade_level: formData.gradeLevel,
        tsc_number: formData.tscNumber,
        role: formData.role,
      });

      setRegistrationSuccess(true);
      toast.success(
        "Registration successful! Please check your email to verify your account."
      );
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        "Registration failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-cyan-50 to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const getStrengthColor = () => {
    if (passwordStrength.score === 0) return "bg-gray-200";
    if (passwordStrength.score === 1) return "bg-red-500";
    if (passwordStrength.score === 2) return "bg-orange-500";
    if (passwordStrength.score === 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (passwordStrength.score === 0) return "";
    if (passwordStrength.score === 1) return "Weak";
    if (passwordStrength.score === 2) return "Fair";
    if (passwordStrength.score === 3) return "Good";
    return "Strong";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-cyan-50 to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white rounded-[2rem] shadow-2xl p-8">
        {registrationSuccess ? (
          <div className="text-center space-y-4">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Check your email!
            </h2>
            <p className="text-gray-600">
              We've sent a verification link to{" "}
              <strong>{formData.email}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Click the link in the email to verify your account and start using
              TeachTrack.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent rounded-2xl text-base font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                Go to Login
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Didn't receive the email? Check your spam folder or contact
              support.
            </p>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-center text-3xl font-extrabold text-gray-900">
                Create your TeachTrack account
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Sign in
                </Link>
              </p>
            </div>

            {/* Account Type Selection */}
            <div className="flex p-1 bg-gray-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "TEACHER" })}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  formData.role === "TEACHER"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                👩‍🏫 Teacher
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, role: "SCHOOL_ADMIN" })
                }
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  formData.role === "SCHOOL_ADMIN"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                🏫 School Admin
              </button>
            </div>

            {/* Google Sign In - Only show for Teachers */}
            {formData.role === "TEACHER" && (
              <div className="mb-6">
                <GoogleSignInButton />

                <p className="mt-3 text-center text-xs text-gray-500 italic">
                  💡 Skip the form! Google Sign-In creates your account
                  instantly
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
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 placeholder-gray-400"
                    placeholder="Mary Wanjiku"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 placeholder-gray-400"
                    placeholder="teacher@example.com"
                  />
                </div>

                {/* Phone Number - For all users */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 placeholder-gray-400"
                    placeholder="0712345678"
                  />
                </div>

                {/* School Name - For both Teachers and School Admins */}
                <div>
                  <label
                    htmlFor="school"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    School Name{" "}
                    {formData.role === "SCHOOL_ADMIN" && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <input
                    id="school"
                    name="school"
                    type="text"
                    required={formData.role === "SCHOOL_ADMIN"}
                    value={formData.school}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 placeholder-gray-400"
                    placeholder={
                      formData.role === "SCHOOL_ADMIN"
                        ? "e.g., Nairobi Primary School"
                        : "Your School (optional)"
                    }
                  />
                  {formData.role === "SCHOOL_ADMIN" && (
                    <p className="mt-1 text-xs text-gray-500">
                      The name of the school you will manage
                    </p>
                  )}
                </div>

                {/* Teacher-specific fields ONLY */}
                {formData.role === "TEACHER" && (
                  <>
                    <div>
                      <label
                        htmlFor="tscNumber"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        TSC Number
                        <span className="text-xs text-gray-500 ml-1">
                          (Optional)
                        </span>
                      </label>
                      <input
                        id="tscNumber"
                        name="tscNumber"
                        type="text"
                        value={formData.tscNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 placeholder-gray-400"
                        placeholder="123456"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Teachers Service Commission registration number
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="gradeLevel"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Primary Grade Level You Teach
                      </label>
                      <select
                        id="gradeLevel"
                        name="gradeLevel"
                        value={formData.gradeLevel}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                      >
                        <option value="">Select grade (optional)</option>
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            Grade {i + 1}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        The main grade you teach (can track multiple subjects)
                      </p>
                    </div>
                  </>
                )}

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 placeholder-gray-400 ph-no-capture"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <FiEyeOff size={20} />
                      ) : (
                        <FiEye size={20} />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-all ${
                              level <= passwordStrength.score
                                ? getStrengthColor()
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      {passwordStrength.score > 0 && (
                        <p className="text-xs font-medium text-gray-600">
                          {getStrengthText()}
                        </p>
                      )}
                      {passwordStrength.feedback.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {passwordStrength.feedback.map((item, index) => (
                            <li
                              key={index}
                              className="text-xs text-gray-500 flex items-center gap-1"
                            >
                              <FiX className="text-red-400" size={12} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || passwordStrength.score < 1}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-2xl text-white bg-primary-600 hover:bg-primary-700 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </div>

              <p className="text-xs text-center text-gray-600">
                By signing up, you agree to our{" "}
                <Link
                  href="/terms"
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  Privacy Policy
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
