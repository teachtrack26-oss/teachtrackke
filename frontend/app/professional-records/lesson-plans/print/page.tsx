"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { FiPrinter, FiEdit2, FiSave, FiX } from "react-icons/fi";
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
  status: string;
  week_number?: number;
  lesson_number?: number;
  lesson_duration_minutes?: number;
}

function PrintContent() {
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePlanChange = (
    index: number,
    field: keyof LessonPlan,
    value: string
  ) => {
    const newPlans = [...plans];
    // @ts-ignore
    newPlans[index] = { ...newPlans[index], [field]: value };
    setPlans(newPlans);
  };

  const saveChanges = async () => {
    setSaving(true);
    const token = localStorage.getItem("accessToken");
    try {
      const promises = plans.map((plan) =>
        axios.put(`/api/v1/lesson-plans/${plan.id}`, plan, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      await Promise.all(promises);
      toast.success("All changes saved successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save changes", error);
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchPlans = async () => {
      const idsParam = searchParams.get("ids");
      if (!idsParam) {
        setLoading(false);
        return;
      }

      const ids = idsParam.split(",").map((id) => parseInt(id));
      const token = localStorage.getItem("accessToken");

      try {
        // Fetch all plans in parallel
        const promises = ids.map((id) =>
          axios.get(`/api/v1/lesson-plans/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );

        const responses = await Promise.all(promises);
        const fetchedPlans = responses.map((res) => res.data);

        // Sort by Week Number then Lesson Number
        fetchedPlans.sort((a, b) => {
          if ((a.week_number || 0) !== (b.week_number || 0)) {
            return (a.week_number || 0) - (b.week_number || 0);
          }
          return (a.lesson_number || 0) - (b.lesson_number || 0);
        });

        setPlans(fetchedPlans);
      } catch (error) {
        console.error("Failed to fetch lesson plans for printing", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Preparing print view...</p>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return <div className="p-8 text-center">No lesson plans selected.</div>;
  }

  return (
    <div className="bg-white min-h-screen">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          body {
            font-size: 11px;
            line-height: 1.2;
            color: #000;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-after: always;
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
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 4px !important;
            padding: 4px !important;
            margin-bottom: 4px !important;
            border: 1px solid #ccc !important;
          }
          .header-info-grid > div {
            display: flex;
            align-items: baseline;
            gap: 4px;
          }
          .header-info-grid span.font-bold {
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
          /* Compact Grids */
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
          p,
          .whitespace-pre-wrap {
            font-size: 10px !important;
          }
        }
      `}</style>

      {/* Print Controls */}
      <div className="no-print fixed top-0 left-0 right-0 bg-white shadow-md p-4 flex justify-between items-center z-50">
        <h2 className="text-xl font-bold">
          Printing {plans.length} Lesson Plans
        </h2>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-600"
                disabled={saving}
              >
                <FiX /> Cancel
              </button>
              <button
                onClick={saveChanges}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700"
                disabled={saving}
              >
                <FiSave /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700"
            >
              <FiEdit2 /> Edit Mode
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700"
          >
            <FiPrinter /> Print Now
          </button>
        </div>
      </div>

      <div className="pt-20 print:pt-0">
        {plans.map((plan, index) => (
          <div
            key={plan.id}
            className={index < plans.length - 1 ? "page-break" : ""}
          >
            <div className="max-w-4xl mx-auto px-8 py-6 print:px-0 print:py-0">
              {/* Document Header */}
              <div className="text-center mb-6 pb-4 border-b-2 border-gray-800 print:mb-2 print:pb-2">
                <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wider print:text-lg">
                  LESSON PLAN{" "}
                  {plan.week_number ? `- WEEK ${plan.week_number}` : ""}{" "}
                  {plan.lesson_number ? `LESSON ${plan.lesson_number}` : ""}
                </h1>
              </div>

              {/* Header Info Grid */}
              <div className="header-info-grid grid grid-cols-2 gap-x-8 gap-y-4 mb-8 p-6 bg-gray-50 border border-gray-200 rounded-xl print:grid-cols-3 print:gap-1 print:p-1 print:mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-700 w-32 print:w-auto">
                    Learning Area:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {plan.learning_area}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-700 w-32 print:w-auto">
                    Grade:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {plan.grade}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-700 w-32 print:w-auto">
                    Date:
                  </span>
                  {isEditing ? (
                    <input
                      type="date"
                      value={plan.date || ""}
                      onChange={(e) =>
                        handlePlanChange(index, "date", e.target.value)
                      }
                      className="border-b border-gray-400 bg-yellow-50 px-1"
                    />
                  ) : (
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
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-700 w-32 print:w-auto">
                    Time:
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={plan.time || ""}
                      onChange={(e) =>
                        handlePlanChange(index, "time", e.target.value)
                      }
                      className="border-b border-gray-400 bg-yellow-50 px-1 w-full"
                    />
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {plan.time || "Not set"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-700 w-32 print:w-auto">
                    Roll:
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={plan.roll || ""}
                      onChange={(e) =>
                        handlePlanChange(index, "roll", e.target.value)
                      }
                      className="border-b border-gray-400 bg-yellow-50 px-1 w-full"
                    />
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {plan.roll || "Not set"}
                    </span>
                  )}
                </div>
              </div>

              {/* Main Content */}
              <div className="space-y-6 print:space-y-2">
                {/* Strand & Sub-strand */}
                <div className="compact-grid grid md:grid-cols-2 gap-6 print:gap-1">
                  <div className="section-card border border-gray-300 rounded-lg p-4 print:p-1">
                    <h3 className="font-bold text-gray-700 mb-2">
                      Strand / Theme / Topic
                    </h3>
                    {isEditing ? (
                      <input
                        type="text"
                        value={plan.strand_theme_topic}
                        onChange={(e) =>
                          handlePlanChange(
                            index,
                            "strand_theme_topic",
                            e.target.value
                          )
                        }
                        className="w-full border-b border-gray-400 bg-yellow-50 px-1"
                      />
                    ) : (
                      <p className="text-gray-900">{plan.strand_theme_topic}</p>
                    )}
                  </div>
                  <div className="section-card border border-gray-300 rounded-lg p-4 print:p-1">
                    <h3 className="font-bold text-gray-700 mb-2">
                      Sub-strand / Sub-theme
                    </h3>
                    {isEditing ? (
                      <input
                        type="text"
                        value={plan.sub_strand_sub_theme_sub_topic}
                        onChange={(e) =>
                          handlePlanChange(
                            index,
                            "sub_strand_sub_theme_sub_topic",
                            e.target.value
                          )
                        }
                        className="w-full border-b border-gray-400 bg-yellow-50 px-1"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {plan.sub_strand_sub_theme_sub_topic}
                      </p>
                    )}
                  </div>
                </div>

                {/* Learning Outcomes */}
                <div className="section-card border border-gray-300 rounded-lg p-4 print:p-1">
                  <h3 className="font-bold text-gray-700 mb-2">
                    Specific Learning Outcomes
                  </h3>
                  {isEditing ? (
                    <textarea
                      value={plan.specific_learning_outcomes}
                      onChange={(e) =>
                        handlePlanChange(
                          index,
                          "specific_learning_outcomes",
                          e.target.value
                        )
                      }
                      className="w-full border border-gray-400 bg-yellow-50 p-1 text-sm"
                      rows={4}
                    />
                  ) : (
                    <div className="text-gray-900 whitespace-pre-wrap">
                      {plan.specific_learning_outcomes}
                    </div>
                  )}
                </div>

                {/* Key Inquiry Questions */}
                <div className="section-card border border-gray-300 rounded-lg p-4 print:p-1">
                  <h3 className="font-bold text-gray-700 mb-2">
                    Key Inquiry Questions
                  </h3>
                  {isEditing ? (
                    <textarea
                      value={plan.key_inquiry_questions}
                      onChange={(e) =>
                        handlePlanChange(
                          index,
                          "key_inquiry_questions",
                          e.target.value
                        )
                      }
                      className="w-full border border-gray-400 bg-yellow-50 p-1 text-sm"
                      rows={2}
                    />
                  ) : (
                    <div className="text-gray-900 whitespace-pre-wrap">
                      {plan.key_inquiry_questions}
                    </div>
                  )}
                </div>

                {/* Competencies & Values */}
                <div className="compact-grid grid md:grid-cols-3 gap-4 print:gap-1">
                  <div className="section-card border border-gray-300 rounded-lg p-4 print:p-1">
                    <h3 className="font-bold text-gray-700 mb-2 text-sm">
                      Core Competencies
                    </h3>
                    {isEditing ? (
                      <textarea
                        value={plan.core_competences}
                        onChange={(e) =>
                          handlePlanChange(
                            index,
                            "core_competences",
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-400 bg-yellow-50 p-1 text-xs"
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {plan.core_competences}
                      </p>
                    )}
                  </div>
                  <div className="section-card border border-gray-300 rounded-lg p-4 print:p-1">
                    <h3 className="font-bold text-gray-700 mb-2 text-sm">
                      Values
                    </h3>
                    {isEditing ? (
                      <textarea
                        value={plan.values_to_be_developed}
                        onChange={(e) =>
                          handlePlanChange(
                            index,
                            "values_to_be_developed",
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-400 bg-yellow-50 p-1 text-xs"
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {plan.values_to_be_developed}
                      </p>
                    )}
                  </div>
                  <div className="section-card border border-gray-300 rounded-lg p-4 print:p-1">
                    <h3 className="font-bold text-gray-700 mb-2 text-sm">
                      PCIs
                    </h3>
                    {isEditing ? (
                      <textarea
                        value={plan.pcis_to_be_addressed}
                        onChange={(e) =>
                          handlePlanChange(
                            index,
                            "pcis_to_be_addressed",
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-400 bg-yellow-50 p-1 text-xs"
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {plan.pcis_to_be_addressed}
                      </p>
                    )}
                  </div>
                </div>

                {/* Learning Resources */}
                <div className="section-card border border-gray-300 rounded-lg p-4 print:p-1">
                  <h3 className="font-bold text-gray-700 mb-2">
                    Learning Resources
                  </h3>
                  {isEditing ? (
                    <textarea
                      value={plan.learning_resources}
                      onChange={(e) =>
                        handlePlanChange(
                          index,
                          "learning_resources",
                          e.target.value
                        )
                      }
                      className="w-full border border-gray-400 bg-yellow-50 p-1 text-sm"
                      rows={2}
                    />
                  ) : (
                    <div className="text-gray-900 whitespace-pre-wrap">
                      {plan.learning_resources}
                    </div>
                  )}
                </div>

                {/* Lesson Steps */}
                <div className="org-learning-container border border-gray-300 rounded-lg overflow-hidden">
                  <div className="org-learning-header bg-gray-100 px-4 py-2 border-b border-gray-300 font-bold text-gray-800 print:bg-gray-200">
                    Organization of Learning
                  </div>
                  <div className="divide-y divide-gray-300">
                    <div className="org-learning-item p-4 print:p-1">
                      <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase flex justify-between">
                        <span>Introduction</span>
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-xs normal-case print:bg-transparent print:text-black">
                          5 min
                        </span>
                      </h4>
                      {isEditing ? (
                        <textarea
                          value={plan.introduction}
                          onChange={(e) =>
                            handlePlanChange(
                              index,
                              "introduction",
                              e.target.value
                            )
                          }
                          className="w-full border border-gray-400 bg-yellow-50 p-1 text-sm"
                          rows={3}
                        />
                      ) : (
                        <div className="text-gray-900 whitespace-pre-wrap">
                          {plan.introduction}
                        </div>
                      )}
                    </div>
                    <div className="org-learning-item p-4 print:p-1">
                      <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase flex justify-between">
                        <span>Lesson Development</span>
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-xs normal-case print:bg-transparent print:text-black">
                          {(plan.lesson_duration_minutes || 40) - 10} min
                        </span>
                      </h4>
                      {isEditing ? (
                        <textarea
                          value={plan.development}
                          onChange={(e) =>
                            handlePlanChange(
                              index,
                              "development",
                              e.target.value
                            )
                          }
                          className="w-full border border-gray-400 bg-yellow-50 p-1 text-sm"
                          rows={5}
                        />
                      ) : (
                        <div className="text-gray-900 whitespace-pre-wrap">
                          {plan.development}
                        </div>
                      )}
                    </div>
                    <div className="org-learning-item p-4 print:p-1">
                      <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase flex justify-between">
                        <span>Conclusion</span>
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-xs normal-case print:bg-transparent print:text-black">
                          5 min
                        </span>
                      </h4>
                      {isEditing ? (
                        <textarea
                          value={plan.conclusion}
                          onChange={(e) =>
                            handlePlanChange(
                              index,
                              "conclusion",
                              e.target.value
                            )
                          }
                          className="w-full border border-gray-400 bg-yellow-50 p-1 text-sm"
                          rows={3}
                        />
                      ) : (
                        <div className="text-gray-900 whitespace-pre-wrap">
                          {plan.conclusion}
                        </div>
                      )}
                    </div>
                    <div className="org-learning-item p-4 print:p-1">
                      <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase">
                        Summary
                      </h4>
                      {isEditing ? (
                        <textarea
                          value={plan.summary}
                          onChange={(e) =>
                            handlePlanChange(index, "summary", e.target.value)
                          }
                          className="w-full border border-gray-400 bg-yellow-50 p-1 text-sm"
                          rows={2}
                        />
                      ) : (
                        <div className="text-gray-900 whitespace-pre-wrap">
                          {plan.summary}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reflection */}
                <div className="section-card border border-gray-300 rounded-lg p-4 bg-yellow-50 print:bg-transparent">
                  <h3 className="font-bold text-gray-700 mb-2">
                    Reflection / Self-Evaluation
                  </h3>
                  {isEditing ? (
                    <textarea
                      value={plan.reflection_self_evaluation}
                      onChange={(e) =>
                        handlePlanChange(
                          index,
                          "reflection_self_evaluation",
                          e.target.value
                        )
                      }
                      className="w-full border border-gray-400 bg-white p-1 text-sm"
                      rows={3}
                      placeholder="To be filled after the lesson..."
                    />
                  ) : (
                    <div className="text-gray-900 whitespace-pre-wrap min-h-[100px]">
                      {plan.reflection_self_evaluation ||
                        "To be filled after the lesson..."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BulkPrintPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PrintContent />
    </Suspense>
  );
}
