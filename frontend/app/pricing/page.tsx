"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import {
  FiCheck,
  FiX,
  FiStar,
  FiClock,
  FiShield,
  FiSmartphone,
} from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "axios";

interface PricingPlanConfig {
  label: string;
  price_kes: number;
  duration_label: string;
}

interface PricingConfig {
  currency: string;
  termly: PricingPlanConfig;
  yearly: PricingPlanConfig;
}

export default function PricingPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useCustomAuth(false);
  const [billingCycle, setBillingCycle] = useState<"termly" | "yearly">(
    "termly"
  );

  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(
    null
  );

  // Payment State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(
    null
  );
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchPricingConfig = async () => {
      try {
        const res = await axios.get("/api/v1/pricing-config");
        if (res?.data) setPricingConfig(res.data);
      } catch (err) {
        console.warn("Failed to load pricing config; using defaults", err);
      }
    };
    fetchPricingConfig();
  }, []);

  const currentPlan = user?.subscription_type || "FREE";

  const currency = pricingConfig?.currency || "KES";
  const termlyLabel = pricingConfig?.termly?.label || "Termly Pass";
  const yearlyLabel = pricingConfig?.yearly?.label || "Yearly Saver";
  const termlyDurationLabel = pricingConfig?.termly?.duration_label || "/term";
  const yearlyDurationLabel = pricingConfig?.yearly?.duration_label || "/year";
  const termlyPriceKes = Number(pricingConfig?.termly?.price_kes ?? 350);
  const yearlyPriceKes = Number(pricingConfig?.yearly?.price_kes ?? 1000);
  const yearlySavingsKes = Math.max(0, termlyPriceKes * 3 - yearlyPriceKes);

  const handleSubscribe = async (plan: string) => {
    if (!isAuthenticated) {
      toast.error("Please login to subscribe");
      router.push("/login?callbackUrl=/pricing");
      return;
    }

    if (plan === currentPlan) {
      toast.success("You are already on this plan");
      return;
    }

    if (plan === "FREE") {
      if (
        confirm(
          "Are you sure you want to downgrade to the Free plan? You will lose access to premium features immediately."
        )
      ) {
        try {
          await axios.post(
            "/api/v1/payments/downgrade",
            {},
            {
              withCredentials: true,
            }
          );
          toast.success("Plan downgraded to Free");
          if (user && user.has_subjects === false) {
            router.push("/curriculum/select");
          } else {
            window.location.reload();
          }
        } catch (error) {
          console.error("Downgrade error:", error);
          toast.error("Failed to downgrade plan");
        }
      }
      return;
    }

    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !selectedPlan) return;

    // Basic validation for Kenyan phone number
    // Allow 07xx, 01xx, 2547xx, 2541xx
    const phoneRegex = /^(?:254|\+254|0)?([17]\d{8})$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error("Please enter a valid Safaricom phone number");
      return;
    }

    setProcessing(true);
    const loadingToast = toast.loading("Initiating M-Pesa payment...");

    try {
      // Determine amount based on plan (server currently trusts amount passed)
      const amount =
        selectedPlan === "TERMLY" ? termlyPriceKes : yearlyPriceKes;

      const response = await axios.post(
        "/api/v1/payments/stk-push",
        {
          phone_number: phoneNumber,
          amount: amount,
          plan: selectedPlan,
        },
        { withCredentials: true }
      );

      toast.dismiss(loadingToast);
      toast.success(
        "STK Push sent! Please check your phone to complete payment.",
        { duration: 6000 }
      );

      // Store checkout request ID for status polling
      const checkoutId = response.data.checkout_request_id;
      setCheckoutRequestId(checkoutId);
      setPaymentStatus("PENDING");

      // Start polling for payment status
      pollPaymentStatus(checkoutId);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error("Payment error:", error);
      toast.error(error.response?.data?.detail || "Failed to initiate payment");
    } finally {
      setProcessing(false);
    }
  };

  const checkPaymentOnce = async () => {
    if (!checkoutRequestId) return;

    try {
      const response = await axios.get(
        `/api/v1/payments/status/${checkoutRequestId}`,
        { withCredentials: true }
      );

      const status = response.data.status;
      setPaymentStatus(status);

      if (status === "COMPLETED") {
        // Don't close immediately - show success state
        setPaymentStatus("COMPLETED");
        toast.success("🎉 Payment successful!", { duration: 4000 });

        // Reload after delay
        setTimeout(() => {
          setIsModalOpen(false);
          setCheckoutRequestId(null);
          if (user && user.has_subjects === false) {
            router.push("/curriculum/select");
          } else {
            window.location.reload();
          }
        }, 4000);
      } else if (status === "FAILED" || status === "CANCELLED") {
        toast.error(
          status === "CANCELLED"
            ? "Payment was cancelled."
            : "Payment failed. Please try again.",
          { duration: 5000 }
        );
        setIsModalOpen(false);
        setCheckoutRequestId(null);
      } else {
        toast("Still processing. Please wait and try again.", {
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
      toast.error("Error checking status. Please try again.");
    }
  };

  const pollPaymentStatus = async (checkoutId: string) => {
    let attempts = 0;
    const maxAttempts = 12; // Poll for up to 2 minutes (12 * 10 seconds)

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setPaymentStatus("TIMEOUT");
        toast(
          "Payment taking longer than expected. Click 'Check Status' to verify.",
          { duration: 5000 }
        );
        return;
      }

      try {
        const response = await axios.get(
          `/api/v1/payments/status/${checkoutId}`,
          { withCredentials: true }
        );

        const status = response.data.status;
        setPaymentStatus(status);

        if (status === "COMPLETED") {
          // Don't close immediately - show success state
          setPaymentStatus("COMPLETED");
          toast.success("🎉 Payment successful!", { duration: 4000 });

          // Reload after delay
          setTimeout(() => {
            setIsModalOpen(false);
            setCheckoutRequestId(null);
            if (user && user.has_subjects === false) {
              router.push("/curriculum/select");
            } else {
              window.location.reload();
            }
          }, 4000);
          return;
        } else if (status === "FAILED" || status === "CANCELLED") {
          toast.error(
            status === "CANCELLED"
              ? "Payment was cancelled."
              : "Payment failed. Please try again.",
            { duration: 5000 }
          );
          setIsModalOpen(false);
          setCheckoutRequestId(null);
          return;
        }

        // Still pending, continue polling (slower to avoid rate limits)
        attempts++;
        setTimeout(poll, 10000); // Check every 10 seconds (was 5)
      } catch (error) {
        console.error("Error checking payment status:", error);
        attempts++;
        setTimeout(poll, 10000);
      }
    };

    // Start polling after 5 seconds (give time for user to enter PIN)
    setTimeout(poll, 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => !paymentStatus && setIsModalOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-[101]">
            <div className="p-6">
              {/* Payment Status View */}
              {paymentStatus === "COMPLETED" ? (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mx-auto mb-6">
                    <FiCheck className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Payment Successful!
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Thank you for subscribing. Your account has been upgraded.
                  </p>
                  <div className="text-sm text-indigo-600 font-medium animate-pulse">
                    Redirecting to dashboard...
                  </div>
                </div>
              ) : paymentStatus === "PENDING" || paymentStatus === "TIMEOUT" ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-6"></div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {paymentStatus === "TIMEOUT"
                      ? "Verifying Payment..."
                      : "Waiting for Payment"}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {paymentStatus === "TIMEOUT"
                      ? "Click the button below to check if your payment was received."
                      : "Please check your phone and enter your M-Pesa PIN to complete the payment."}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-3 mb-4">
                    <FiSmartphone className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      STK Push sent to your phone
                    </span>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        setPaymentStatus(null);
                        setCheckoutRequestId(null);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={checkPaymentOnce}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                    >
                      Check Status
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                      <FiSmartphone className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="ml-4 text-lg font-medium text-gray-900">
                      Pay with M-Pesa
                    </h3>
                  </div>

                  <p className="text-sm text-gray-500 mb-4">
                    Enter your M-Pesa phone number to pay for the{" "}
                    <strong>
                      {selectedPlan === "TERMLY" ? termlyLabel : yearlyLabel}
                    </strong>
                    .
                  </p>

                  <p className="text-2xl font-bold text-gray-900 mb-4">
                    {currency}{" "}
                    {selectedPlan === "TERMLY"
                      ? termlyPriceKes
                      : yearlyPriceKes}
                  </p>

                  <form onSubmit={handlePayment}>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Safaricom Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., 0712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      You will receive a prompt on your phone to enter your
                      M-Pesa PIN.
                    </p>

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={processing}
                        className={`flex-1 px-4 py-2 rounded-md text-white font-medium ${
                          processing
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {processing ? "Processing..." : "Pay Now"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-5 text-xl text-gray-500">
            Choose the plan that fits your teaching needs. Upgrade anytime to
            unlock full potential.
          </p>

          {/* Billing Toggle */}
          {currentPlan === "SCHOOL_SPONSORED" ? (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-3">
                <FiShield className="h-6 w-6 text-blue-600" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-blue-900">
                    School Sponsored Plan
                  </h3>
                  <p className="text-blue-700">
                    Your subscription is managed by your school. You have full
                    access to all features.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 flex justify-center">
              <div className="relative bg-white rounded-lg p-0.5 flex sm:mt-0 shadow-sm border border-gray-200">
                <button
                  type="button"
                  onClick={() => setBillingCycle("termly")}
                  className={`${
                    billingCycle === "termly"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  } relative w-1/2 whitespace-nowrap py-2 px-6 rounded-md text-sm font-medium focus:outline-none focus:z-10 sm:w-auto sm:px-8 transition-all duration-200`}
                >
                  Termly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={`${
                    billingCycle === "yearly"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  } relative w-1/2 whitespace-nowrap py-2 px-6 rounded-md text-sm font-medium focus:outline-none focus:z-10 sm:w-auto sm:px-8 transition-all duration-200`}
                >
                  Yearly{" "}
                  <span className="ml-1 text-xs text-amber-300 font-bold">
                    (Save 30%)
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-3 lg:gap-x-8">
          {/* Free Plan */}
          <div
            className={`relative flex flex-col bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 ${
              currentPlan === "SCHOOL_SPONSORED" ? "opacity-60 grayscale" : ""
            }`}
          >
            <div className="p-8 flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                Mwalimu Starter
              </h3>
              <p className="absolute top-0 py-1.5 px-4 bg-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wide transform -translate-y-1/2 rounded-full">
                30-Day Free Trial
              </p>
              <p className="mt-4 flex items-baseline text-gray-900">
                <span className="text-5xl font-extrabold tracking-tight">
                  KES 0
                </span>
                <span className="ml-1 text-xl font-semibold text-gray-500">
                  /30 days
                </span>
              </p>
              <p className="mt-6 text-gray-500">
                Perfect for trying out the platform and generating quick weekly
                plans.
              </p>

              <ul role="list" className="mt-6 space-y-4">
                <li className="flex">
                  <FiCheck className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-3 text-gray-500">
                    Generate 1 Week Scheme
                  </span>
                </li>
                <li className="flex">
                  <FiCheck className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-3 text-gray-500">
                    1 Week Lesson Plans
                  </span>
                </li>
                <li className="flex">
                  <FiCheck className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-3 text-gray-500">
                    1 Week Record of Work
                  </span>
                </li>
                <li className="flex">
                  <FiCheck className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-3 text-gray-500">
                    Screen Preview Only
                  </span>
                </li>
                <li className="flex opacity-50">
                  <FiX className="flex-shrink-0 w-5 h-5 text-gray-400" />
                  <span className="ml-3 text-gray-500">No PDF Downloads</span>
                </li>
                <li className="flex opacity-50">
                  <FiX className="flex-shrink-0 w-5 h-5 text-gray-400" />
                  <span className="ml-3 text-gray-500">
                    No Full Term Generation
                  </span>
                </li>
                <li className="flex">
                  <FiCheck className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-3 text-gray-500">
                    Access to Dashboard, Notes, Curriculum, Records & Timetable
                  </span>
                </li>
              </ul>
            </div>
            <div className="p-8 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  if (currentPlan === "FREE" && user?.has_subjects === false) {
                    router.push("/curriculum/select");
                  } else {
                    handleSubscribe("FREE");
                  }
                }}
                disabled={
                  (currentPlan === "FREE" && user?.has_subjects !== false) ||
                  currentPlan === "SCHOOL_SPONSORED"
                }
                className={`w-full block border rounded-md py-3 text-sm font-semibold text-center ${
                  (currentPlan === "FREE" && user?.has_subjects !== false) ||
                  currentPlan === "SCHOOL_SPONSORED"
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-default"
                    : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {currentPlan === "FREE"
                  ? user?.has_subjects === false
                    ? "Continue with Free"
                    : "Current Plan"
                  : currentPlan === "SCHOOL_SPONSORED"
                  ? "Included in School Plan"
                  : "Downgrade to Free"}
              </button>
            </div>
          </div>

          {/* Termly Plan */}
          <div
            className={`relative flex flex-col bg-white rounded-2xl shadow-xl border-2 border-indigo-500 transform scale-105 z-10 ${
              currentPlan === "SCHOOL_SPONSORED"
                ? "border-blue-500 ring-4 ring-blue-100"
                : ""
            }`}
          >
            <div className="absolute top-0 inset-x-0 transform -translate-y-1/2">
              <div className="flex justify-center">
                <span
                  className={`inline-flex rounded-full px-4 py-1 text-sm font-semibold tracking-wider uppercase text-white shadow-sm ${
                    currentPlan === "SCHOOL_SPONSORED"
                      ? "bg-blue-600"
                      : "bg-indigo-600"
                  }`}
                >
                  {currentPlan === "SCHOOL_SPONSORED"
                    ? "Your Active Plan"
                    : "Most Popular"}
                </span>
              </div>
            </div>
            <div className="p-8 flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {currentPlan === "SCHOOL_SPONSORED"
                  ? "School Sponsored"
                  : termlyLabel}
              </h3>
              <p className="mt-4 flex items-baseline text-gray-900">
                <span className="text-5xl font-extrabold tracking-tight">
                  {currentPlan === "SCHOOL_SPONSORED"
                    ? "Paid"
                    : `${currency} ${termlyPriceKes}`}
                </span>
                <span className="ml-1 text-xl font-semibold text-gray-500">
                  {currentPlan === "SCHOOL_SPONSORED"
                    ? "by School"
                    : termlyDurationLabel}
                </span>
              </p>
              <p className="mt-6 text-gray-500">
                Everything you need for a successful school term. Full access.
              </p>

              <ul role="list" className="mt-6 space-y-4">
                <li className="flex">
                  <FiCheck
                    className={`flex-shrink-0 w-5 h-5 ${
                      currentPlan === "SCHOOL_SPONSORED"
                        ? "text-blue-500"
                        : "text-indigo-500"
                    }`}
                  />
                  <span className="ml-3 text-gray-900 font-medium">
                    Unlimited Scheme Generation
                  </span>
                </li>
                <li className="flex">
                  <FiCheck
                    className={`flex-shrink-0 w-5 h-5 ${
                      currentPlan === "SCHOOL_SPONSORED"
                        ? "text-blue-500"
                        : "text-indigo-500"
                    }`}
                  />
                  <span className="ml-3 text-gray-900 font-medium">
                    Full Term Coverage
                  </span>
                </li>
                <li className="flex">
                  <FiCheck
                    className={`flex-shrink-0 w-5 h-5 ${
                      currentPlan === "SCHOOL_SPONSORED"
                        ? "text-blue-500"
                        : "text-indigo-500"
                    }`}
                  />
                  <span className="ml-3 text-gray-900 font-medium">
                    Unlimited PDF Downloads
                  </span>
                </li>
                <li className="flex">
                  <FiCheck
                    className={`flex-shrink-0 w-5 h-5 ${
                      currentPlan === "SCHOOL_SPONSORED"
                        ? "text-blue-500"
                        : "text-indigo-500"
                    }`}
                  />
                  <span className="ml-3 text-gray-900 font-medium">
                    Lesson Plans & Records
                  </span>
                </li>
                <li className="flex">
                  <FiCheck
                    className={`flex-shrink-0 w-5 h-5 ${
                      currentPlan === "SCHOOL_SPONSORED"
                        ? "text-blue-500"
                        : "text-indigo-500"
                    }`}
                  />
                  <span className="ml-3 text-gray-900 font-medium">
                    Valid for 4 Months
                  </span>
                </li>
              </ul>
            </div>
            <div
              className={`p-8 rounded-b-2xl ${
                currentPlan === "SCHOOL_SPONSORED"
                  ? "bg-blue-50"
                  : "bg-indigo-50"
              }`}
            >
              <button
                onClick={() => handleSubscribe("TERMLY")}
                disabled={
                  currentPlan === "INDIVIDUAL_BASIC" ||
                  currentPlan === "SCHOOL_SPONSORED"
                }
                className={`w-full block border border-transparent rounded-md py-3 text-sm font-semibold text-center shadow-md transition-all ${
                  currentPlan === "INDIVIDUAL_BASIC" ||
                  currentPlan === "SCHOOL_SPONSORED"
                    ? "bg-blue-600 text-white cursor-default"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105"
                }`}
              >
                {currentPlan === "INDIVIDUAL_BASIC"
                  ? "Current Plan"
                  : currentPlan === "SCHOOL_SPONSORED"
                  ? "Active via School"
                  : `Get ${termlyLabel}`}
              </button>
            </div>
          </div>

          {/* Yearly Plan */}
          <div
            className={`relative flex flex-col bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 ${
              currentPlan === "SCHOOL_SPONSORED" ? "opacity-60 grayscale" : ""
            }`}
          >
            <div className="p-8 flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {yearlyLabel}
              </h3>
              <p className="absolute top-0 py-1.5 px-4 bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wide transform -translate-y-1/2 rounded-full">
                Best Value
              </p>
              <p className="mt-4 flex items-baseline text-gray-900">
                <span className="text-5xl font-extrabold tracking-tight">
                  {currency} {yearlyPriceKes}
                </span>
                <span className="ml-1 text-xl font-semibold text-gray-500">
                  {yearlyDurationLabel}
                </span>
              </p>
              <p className="mt-6 text-gray-500">
                Secure your peace of mind for the entire academic year.
              </p>

              <ul role="list" className="mt-6 space-y-4">
                <li className="flex">
                  <FiCheck className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-3 text-gray-500">
                    All Termly Features
                  </span>
                </li>
                <li className="flex">
                  <FiCheck className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-3 text-gray-500">
                    Valid for 1 Full Year
                  </span>
                </li>
                <li className="flex">
                  <FiCheck className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-3 text-gray-500">Priority Support</span>
                </li>
                <li className="flex">
                  <FiCheck className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-3 text-gray-500">
                    Early Access to New Features
                  </span>
                </li>
                <li className="flex">
                  <FiStar className="flex-shrink-0 w-5 h-5 text-amber-500" />
                  <span className="ml-3 text-gray-900 font-bold">
                    {yearlySavingsKes > 0
                      ? `Save ${currency} ${yearlySavingsKes} vs Termly`
                      : "Best yearly value"}
                  </span>
                </li>
              </ul>
            </div>
            <div className="p-8 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => handleSubscribe("YEARLY")}
                disabled={
                  currentPlan === "INDIVIDUAL_PREMIUM" ||
                  currentPlan === "SCHOOL_SPONSORED"
                }
                className={`w-full block border rounded-md py-3 text-sm font-semibold text-center ${
                  currentPlan === "INDIVIDUAL_PREMIUM" ||
                  currentPlan === "SCHOOL_SPONSORED"
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-default"
                    : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                }`}
              >
                {currentPlan === "INDIVIDUAL_PREMIUM"
                  ? "Current Plan"
                  : currentPlan === "SCHOOL_SPONSORED"
                  ? "Included in School Plan"
                  : `Get ${yearlyLabel}`}
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto mt-24 border-t border-gray-200 pt-16">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <dl className="space-y-10">
            <div>
              <dt className="text-lg leading-6 font-medium text-gray-900">
                How do I pay?
              </dt>
              <dd className="mt-2 text-base text-gray-500">
                We accept M-Pesa payments directly through the platform. Once
                you select a plan, you'll be prompted to enter your phone number
                to complete the transaction.
              </dd>
            </div>
            <div>
              <dt className="text-lg leading-6 font-medium text-gray-900">
                Can I upgrade later?
              </dt>
              <dd className="mt-2 text-base text-gray-500">
                Yes! You can upgrade from the Free plan to Termly or Yearly at
                any time. Your new features will be unlocked instantly.
              </dd>
            </div>
            <div>
              <dt className="text-lg leading-6 font-medium text-gray-900">
                What happens to my data if my subscription expires?
              </dt>
              <dd className="mt-2 text-base text-gray-500">
                Your data is safe. You will still be able to view your records,
                but you won't be able to generate new full-term schemes or
                download files until you renew.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
