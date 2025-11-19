"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiDownload,
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
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

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
}

export default function ViewLessonPlanPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<LessonPlan | null>(null);

  useEffect(() => {
    if (planId) {
      fetchLessonPlan();
    }
  }, [planId]);

  const fetchLessonPlan = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      // Handle the case where the ID might have a trailing hyphen
      const cleanId = planId.replace(/-$/, "");

      const response = await axios.get(`/api/v1/lesson-plans/${cleanId}`, {
        headers: { Authorization: `Bearer ${token}` },
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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this lesson plan?")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const cleanId = planId.replace(/-$/, "");
      await axios.delete(`/api/v1/lesson-plans/${cleanId}`, {
        headers: { Authorization: `Bearer ${token}` },
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
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
            size: A4;
            margin: 10mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-white relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto px-8 py-6 print-full-width">
          {/* Action Buttons */}
          <div className="mb-6 flex justify-between items-center no-print">
            <button
              onClick={() => router.push("/professional-records?tab=lessons")}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <FiArrowLeft className="w-5 h-5" />
              Back to Lesson Plans
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300"
              >
                <FiDownload className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={() =>
                  router.push(
                    `/professional-records/lesson-plans/${planId}/edit`
                  )
                }
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300"
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

          {/* Document Header */}
          <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
            <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wider">
              LESSON PLAN
            </h1>
          </div>

          {/* Header Info Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 p-6 bg-gray-50 border border-gray-200 rounded-xl">
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
                {plan.date || "Not set"}
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
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Strand & Sub-strand */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-300 rounded-lg p-4">
                <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FiLayers className="text-indigo-600" />
                  Strand / Theme / Topic
                </h3>
                <p className="text-gray-900">{plan.strand_theme_topic}</p>
              </div>
              <div className="border border-gray-300 rounded-lg p-4">
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
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                <FiTarget className="text-emerald-600" />
                Specific Learning Outcomes
              </h3>
              <div className="text-gray-900 whitespace-pre-wrap">
                {plan.specific_learning_outcomes}
              </div>
            </div>

            {/* Key Inquiry Questions */}
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                <FiHelpCircle className="text-amber-600" />
                Key Inquiry Questions
              </h3>
              <div className="text-gray-900 whitespace-pre-wrap">
                {plan.key_inquiry_questions}
              </div>
            </div>

            {/* Competencies & Values */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border border-gray-300 rounded-lg p-4">
                <h3 className="font-bold text-gray-700 mb-2 text-sm flex items-center gap-2">
                  <FiStar className="text-blue-600" />
                  Core Competencies
                </h3>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {plan.core_competences}
                </p>
              </div>
              <div className="border border-gray-300 rounded-lg p-4">
                <h3 className="font-bold text-gray-700 mb-2 text-sm flex items-center gap-2">
                  <FiStar className="text-rose-600" />
                  Values
                </h3>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {plan.values_to_be_developed}
                </p>
              </div>
              <div className="border border-gray-300 rounded-lg p-4">
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
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                <FiBox className="text-orange-600" />
                Learning Resources
              </h3>
              <div className="text-gray-900 whitespace-pre-wrap">
                {plan.learning_resources}
              </div>
            </div>

            {/* Lesson Steps */}
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 font-bold text-gray-800">
                Organization of Learning
              </div>
              <div className="divide-y divide-gray-300">
                <div className="p-4">
                  <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase">
                    Introduction
                  </h4>
                  <div className="text-gray-900 whitespace-pre-wrap">
                    {plan.introduction}
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase">
                    Lesson Development
                  </h4>
                  <div className="text-gray-900 whitespace-pre-wrap">
                    {plan.development}
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase">
                    Conclusion
                  </h4>
                  <div className="text-gray-900 whitespace-pre-wrap">
                    {plan.conclusion}
                  </div>
                </div>
                <div className="p-4">
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
            <div className="border border-gray-300 rounded-lg p-4 bg-yellow-50">
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
    </>
  );
}
