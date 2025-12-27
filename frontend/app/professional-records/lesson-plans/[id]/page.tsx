"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import {
  FiArrowLeft,
  FiDownload,
  FiPrinter,
  FiEdit,
  FiTrash2,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiUser,
  FiBook,
  FiTarget,
  FiList,
  FiHelpCircle,
  FiLayers,
  FiStar,
  FiLink,
  FiBox,
  FiLock,
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import posthog from "posthog-js";

interface LessonPlan {
  id: number;
  learning_area: string;
  grade: string;
  date: string;
  time: string;
  roll: string;
  strand_theme_topic: string;
  sub_strand_sub_theme_sub_topic: string;
  specific_learning_outcomes: string;
  key_inquiry_questions: string;
  core_competences: string;
  values_to_be_developed: string;
  pcis_to_be_addressed: string;
  learning_resources: string;
  introduction: string;
  development: string;
  conclusion: string;
  summary: string;
  reflection_self_evaluation: string;
  status: "pending" | "taught" | "postponed";
  created_at: string;
  updated_at: string;
  lesson_duration_minutes?: number;
}

export default function ViewLessonPlanPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params?.id as string;
  const { user, isAuthenticated, loading: authLoading } = useCustomAuth();

  const isPremium =
    user?.subscription_type === "INDIVIDUAL_PREMIUM" ||
    user?.subscription_type === "SCHOOL_SPONSORED" ||
    !!user?.school_id ||
    user?.role === "SUPER_ADMIN";

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (planId) {
      fetchLessonPlan();
    }
  }, [planId]);

  const fetchLessonPlan = async () => {
    try {
      // Handle the case where the ID might have a trailing hyphen
      const cleanId = planId.replace(/-$/, "");

      const response = await axios.get(`/api/v1/lesson-plans/${cleanId}`, {
        withCredentials: true,
      });
      setPlan(response.data);
    } catch (error) {
      console.error("Failed to fetch lesson plan:", error);
      toast.error("Failed to load lesson plan");
      router.push("/professional-records?tab=lessons");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!plan) return;

    if (!isPremium) {
      toast.error("Downloads are available on Premium plans only.");
      return;
    }

    setDownloading(true);
    const loadingToast = toast.loading("Generating PDF...");

    try {
      const cleanId = planId.replace(/-$/, "");
      const response = await axios.get(`/api/v1/lesson-plans/${cleanId}/pdf`, {
        withCredentials: true,
        responseType: "blob",
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Generate filename
      const filename = `LessonPlan_${plan.learning_area}_${plan.grade}_${plan.date || "undated"}.pdf`.replace(/\s+/g, "_");
      link.setAttribute("download", filename);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.dismiss(loadingToast);
      toast.success("PDF downloaded successfully!");

      posthog.capture('lesson_plan_downloaded', {
          count: 1,
          method: 'single'
      });

    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this lesson plan?")) {
      return;
    }

    try {
      const cleanId = planId.replace(/-$/, "");
      await axios.delete(`/api/v1/lesson-plans/${cleanId}`, {
        withCredentials: true,
      });
      toast.success("Lesson plan deleted successfully");
      router.push("/professional-records?tab=lessons");
    } catch (error) {
      console.error("Failed to delete lesson plan:", error);
      toast.error("Failed to delete lesson plan");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-primary-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">
            Loading lesson plan...
          </p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm; /* Small margins */
          }

          body {
            font-size: 11px; /* Smaller font */
            line-height: 1.2;
            color: #000;
            background: white;
            height: auto !important;
            overflow: visible !important;
          }

          /* Reset min-height for containers to avoid extra pages */
          .min-h-screen {
            min-height: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* Hide non-print elements */
          .no-print {
            display: none !important;
          }

          /* Hide content for non-premium users during print */
          ${!isPremium
            ? `
            .print-full-width {
              display: none !important;
            }
            body::after {
              content: "Printing is available on Premium plans only. Please upgrade to print.";
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              font-size: 24pt;
              font-weight: bold;
              color: #555;
              text-align: center;
              padding: 20px;
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              background: white;
              z-index: 9999;
            }
          `
            : ""}

          /* Reset container widths */
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Compact Header */
          h1 {
            font-size: 14pt !important;
            margin-bottom: 2mm !important;
            padding-bottom: 2mm !important;
          }

          /* Compact Info Grid */
          .header-info-grid {
            display: grid !important;
            grid-template-columns: repeat(
              3,
              1fr
            ) !important; /* 3 columns to save height */
            gap: 4px !important;
            padding: 4px !important;
            margin-bottom: 4px !important;
            background-color: transparent !important;
            border: 1px solid #ccc !important;
          }

          .header-info-grid > div {
            display: flex;
            align-items: baseline;
            gap: 4px;
          }

          .header-info-grid span.font-bold {
            width: auto !important;
            min-width: 80px;
            font-size: 10px;
          }

          /* Compact Sections */
          .section-card {
            padding: 4px !important;
            margin-bottom: 4px !important;
            border: 1px solid #eee !important;
          }

          h3 {
            font-size: 11px !important;
            margin-bottom: 2px !important;
            color: #000 !important;
          }

          /* Hide Icons in headers to save space/ink */
          h3 svg,
          h4 svg {
            display: none !important;
          }

          /* Compact Grids for Strand/Competencies */
          .compact-grid {
            display: grid !important;
            gap: 4px !important;
          }

          /* Organization of Learning */
          .org-learning-container {
            border: 1px solid #ccc !important;
          }
          .org-learning-header {
            padding: 2px 4px !important;
            background-color: #f0f0f0 !important;
            font-size: 11px !important;
          }
          .org-learning-item {
            padding: 2px 4px !important;
          }
          .org-learning-item h4 {
            margin-bottom: 0 !important;
            font-size: 10px !important;
          }

          /* General Text */
          p,
          .whitespace-pre-wrap {
            font-size: 10px !important;
          }

          /* Remove heavy backgrounds */
          .bg-[#020617],
          .bg-yellow-50,
          .bg-[#0F172A] {
            background-color: transparent !important;
          }
        }
      `}</style>

      <div
        className={`min-h-screen bg-white relative overflow-hidden ${
          !isPremium ? "select-none" : ""
        }`}
        onContextMenu={(e) => {
          if (!isPremium) {
            e.preventDefault();
            toast.error("Right-click is disabled for preview.");
          }
        }}
      >
        <div className="relative z-10 max-w-4xl mx-auto px-8 pt-24 pb-6 print-full-width">
          {/* Free Plan Banner */}
          {!isPremium && (
            <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm relative overflow-hidden no-print">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <FiLock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Preview Mode Active
                    </h3>
                    <p className="text-sm text-gray-600">
                      Upgrade to Premium to download, print, and edit this
                      Lesson Plan.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/pricing")}
                  className="whitespace-nowrap px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-bold rounded-lg shadow-md transition-all"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mb-6 flex justify-between items-center no-print">
            <button
              onClick={() => router.push("/professional-records?tab=lessons")}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-800 font-medium"
            >
              <FiArrowLeft className="w-5 h-5" />
              Back to Lesson Plans
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={!isPremium || downloading}
                className={`px-4 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300 ${
                  !isPremium
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                }`}
                title={!isPremium ? "Upgrade to download" : "Download PDF"}
              >
                <FiDownload className={`w-4 h-4 ${downloading ? "animate-bounce" : ""}`} />
                {downloading ? "Downloading..." : "Download PDF"}
              </button>
              <button
                onClick={() => {
                  if (!isPremium) {
                    toast.error(
                      "Printing is available on Premium plans only."
                    );
                    return;
                  }
                  window.print();
                }}
                disabled={!isPremium}
                className={`px-4 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300 ${
                  !isPremium
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                }`}
                title={!isPremium ? "Upgrade to print" : "Print"}
              >
                <FiPrinter className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={() =>
                  router.push(
                    `/professional-records/lesson-plans/${planId}/edit`
                  )
                }
                className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300"
              >
                <FiEdit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300"
              >
                <FiTrash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          <div className="relative">
            {/* Watermark for non-premium users */}
            {!isPremium && (
              <div className="absolute inset-0 pointer-events-none z-50 grid grid-cols-2 gap-y-32 gap-x-12 content-start justify-items-center overflow-hidden opacity-10 p-10">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="transform -rotate-45 text-gray-900 text-3xl font-black whitespace-nowrap select-none"
                  >
                    {user?.email || "PREVIEW ONLY"}
                  </div>
                ))}
              </div>
            )}
            {/* Document Header */}
            <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
              <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wider">
                LESSON PLAN
              </h1>
            </div>

            {/* Header Info Grid */}
            <div className="header-info-grid grid grid-cols-2 gap-x-8 gap-y-4 mb-8 p-6 bg-[#020617] border border-gray-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-700 w-32">
                  Learning Area:
                </span>
                <span className="text-gray-900 font-medium">
                  {plan.learning_area}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-700 w-32">Grade:</span>
                <span className="text-gray-900 font-medium">{plan.grade}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-700 w-32">Date:</span>
                <span className="text-gray-900 font-medium">
                  {plan.date
                    ? new Date(plan.date).toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Not set"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-700 w-32">Time:</span>
                <span className="text-gray-900 font-medium">
                  {plan.time || "Not set"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-700 w-32">Roll:</span>
                <span className="text-gray-900 font-medium">
                  {plan.roll || "Not set"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-700 w-32">Duration:</span>
                <span className="text-gray-900 font-medium">
                  {plan.lesson_duration_minutes
                    ? `${plan.lesson_duration_minutes} minutes`
                    : "Not set"}
                </span>
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
              {/* Strand & Sub-strand */}
              <div className="compact-grid grid md:grid-cols-2 gap-6">
                <div className="section-card border border-gray-300 rounded-lg p-4">
                  <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <FiLayers className="text-primary-600" />
                    Strand / Theme / Topic
                  </h3>
                  <p className="text-gray-900">{plan.strand_theme_topic}</p>
                </div>
                <div className="section-card border border-gray-300 rounded-lg p-4">
                  <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <FiLayers className="text-purple-600" />
                    Sub-strand / Sub-theme
                  </h3>
                  <p className="text-gray-900">
                    {plan.sub_strand_sub_theme_sub_topic}
                  </p>
                </div>
              </div>

              {/* Learning Outcomes */}
              <div className="section-card border border-gray-300 rounded-lg p-4">
                <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FiTarget className="text-emerald-600" />
                  Specific Learning Outcomes
                </h3>
                <div className="text-gray-900 whitespace-pre-wrap">
                  {plan.specific_learning_outcomes}
                </div>
              </div>

              {/* Key Inquiry Questions */}
              <div className="section-card border border-gray-300 rounded-lg p-4">
                <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FiHelpCircle className="text-amber-600" />
                  Key Inquiry Questions
                </h3>
                <div className="text-gray-900 whitespace-pre-wrap">
                  {plan.key_inquiry_questions}
                </div>
              </div>

              {/* Competencies & Values */}
              <div className="compact-grid grid md:grid-cols-3 gap-4">
                <div className="section-card border border-gray-300 rounded-lg p-4">
                  <h3 className="font-bold text-gray-700 mb-2 text-sm flex items-center gap-2">
                    <FiStar className="text-blue-600" />
                    Core Competencies
                  </h3>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {plan.core_competences}
                  </p>
                </div>
                <div className="section-card border border-gray-300 rounded-lg p-4">
                  <h3 className="font-bold text-gray-700 mb-2 text-sm flex items-center gap-2">
                    <FiStar className="text-rose-600" />
                    Values
                  </h3>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {plan.values_to_be_developed}
                  </p>
                </div>
                <div className="section-card border border-gray-300 rounded-lg p-4">
                  <h3 className="font-bold text-gray-700 mb-2 text-sm flex items-center gap-2">
                    <FiLink className="text-cyan-600" />
                    PCIs
                  </h3>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {plan.pcis_to_be_addressed}
                  </p>
                </div>
              </div>

              {/* Learning Resources */}
              <div className="section-card border border-gray-300 rounded-lg p-4">
                <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FiBox className="text-orange-600" />
                  Learning Resources
                </h3>
                <div className="text-gray-900 whitespace-pre-wrap">
                  {plan.learning_resources}
                </div>
              </div>

              {/* Lesson Steps */}
              <div className="org-learning-container border border-gray-300 rounded-lg overflow-hidden">
                <div className="org-learning-header bg-[#0F172A] px-4 py-2 border-b border-gray-300 font-bold text-gray-800">
                  Organization of Learning
                  {plan.lesson_duration_minutes && (
                    <span className="ml-2 text-primary-600 font-normal">
                      (Total: {plan.lesson_duration_minutes} min)
                    </span>
                  )}
                </div>
                <div className="divide-y divide-gray-300">
                  <div className="org-learning-item p-4">
                    <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase flex justify-between">
                      <span>Introduction</span>
                      <span className="text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full text-xs normal-case">
                        {plan.lesson_duration_minutes ? "5 min" : "N/A"}
                      </span>
                    </h4>
                    <div className="text-gray-900 whitespace-pre-wrap">
                      {plan.introduction}
                    </div>
                  </div>
                  <div className="org-learning-item p-4">
                    <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase flex justify-between">
                      <span>Lesson Development</span>
                      <span className="text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full text-xs normal-case">
                        {plan.lesson_duration_minutes
                          ? `${Math.max(plan.lesson_duration_minutes - 10, 0)} min`
                          : "N/A"}
                      </span>
                    </h4>
                    <div className="text-gray-900 whitespace-pre-wrap">
                      {plan.development}
                    </div>
                  </div>
                  <div className="org-learning-item p-4">
                    <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase flex justify-between">
                      <span>Conclusion</span>
                      <span className="text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full text-xs normal-case">
                        {plan.lesson_duration_minutes ? "5 min" : "N/A"}
                      </span>
                    </h4>
                    <div className="text-gray-900 whitespace-pre-wrap">
                      {plan.conclusion}
                    </div>
                  </div>
                  <div className="org-learning-item p-4">
                    <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase">
                      Summary
                    </h4>
                    <div className="text-gray-900 whitespace-pre-wrap">
                      {plan.summary}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reflection */}
              <div className="section-card border border-gray-300 rounded-lg p-4 bg-yellow-50">
                <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FiCheckCircle className="text-yellow-600" />
                  Reflection / Self-Evaluation
                </h3>
                <div className="text-gray-900 whitespace-pre-wrap min-h-[100px]">
                  {plan.reflection_self_evaluation ||
                    "To be filled after the lesson..."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
