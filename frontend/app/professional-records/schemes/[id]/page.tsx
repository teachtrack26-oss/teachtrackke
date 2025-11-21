"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiDownload,
  FiEdit,
  FiTrash2,
  FiCalendar,
  FiBookOpen,
  FiClock,
  FiCheckCircle,
  FiFileText,
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

interface WeekLesson {
  lesson_id: number;
  lesson_title: string;
  strand: string;
  sub_strand: string;
  specific_learning_outcomes: string;
  key_inquiry_questions: string;
  learning_experiences: string;
  learning_resources: string;

  // Textbook references
  textbook_name?: string;
  textbook_teacher_guide_pages?: string;
  textbook_learner_book_pages?: string;

  assessment_methods: string;
  reflection: string;
  core_competencies?: string;
  values?: string;
  pcis?: string;
  links?: string;
  assessment_rubric?: string;
}

interface Week {
  week_number: number;
  lessons: WeekLesson[];
}

interface SchemeOfWork {
  id: number;
  subject_id: number;
  subject_name: string;
  grade: string;
  term_number: number;
  term_year: number;
  total_weeks: number;
  total_lessons: number;
  status: "draft" | "active" | "completed";
  weeks: Week[];
  created_at: string;
  updated_at: string;
}

export default function ViewSchemePage() {
  const router = useRouter();
  const params = useParams();
  const schemeId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [scheme, setScheme] = useState<SchemeOfWork | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());
  const [changingStatus, setChangingStatus] = useState(false);
  const [generatingPlans, setGeneratingPlans] = useState(false);

  useEffect(() => {
    if (schemeId) {
      fetchScheme();
    }
  }, [schemeId]);

  const fetchScheme = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`/api/v1/schemes/${schemeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setScheme(response.data);
    } catch (error) {
      console.error("Failed to fetch scheme:", error);
      toast.error("Failed to load scheme of work");
      router.push("/professional-records");
    } finally {
      setLoading(false);
    }
  };

  const toggleWeek = (weekNumber: number) => {
    setExpandedWeeks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(weekNumber)) {
        newSet.delete(weekNumber);
      } else {
        newSet.add(weekNumber);
      }
      return newSet;
    });
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this scheme of work?")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`/api/v1/schemes/${schemeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Scheme of work deleted successfully");
      router.push("/professional-records");
    } catch (error) {
      console.error("Failed to delete scheme:", error);
      toast.error("Failed to delete scheme of work");
    }
  };

  const handleDownloadPDF = async () => {
    if (!scheme) return;

    const loadingToast = toast.loading("Generating PDF...");

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`/api/v1/schemes/${schemeId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Generate filename
      const filename =
        `${scheme.subject_name}_${scheme.grade}_Term${scheme.term_number}_${scheme.term_year}.pdf`.replace(
          /\s+/g,
          "_"
        );
      link.setAttribute("download", filename);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to generate PDF");
    }
  };

  const handleStatusChange = async (
    newStatus: "draft" | "active" | "completed"
  ) => {
    if (!scheme) return;

    setChangingStatus(true);
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(
        `/api/v1/schemes/${schemeId}`,
        { ...scheme, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setScheme({ ...scheme, status: newStatus });
      toast.success(`Status changed to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    } finally {
      setChangingStatus(false);
    }
  };

  const handleGenerateLessonPlans = async () => {
    if (!scheme) return;

    const confirmGenerate = confirm(
      `This will create ${scheme.total_lessons} individual lesson plans from this scheme of work. Continue?`
    );

    if (!confirmGenerate) return;

    setGeneratingPlans(true);
    const loadingToast = toast.loading("Generating lesson plans...");

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `/api/v1/schemes/${schemeId}/generate-lesson-plans`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.dismiss(loadingToast);
      toast.success(
        `Successfully generated ${response.data.total_plans} lesson plans!`
      );

      // Optionally redirect to lesson plans tab
      router.push("/professional-records?tab=lessons");
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error("Failed to generate lesson plans:", error);

      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Failed to generate lesson plans");
      }
    } finally {
      setGeneratingPlans(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Loading scheme...</p>
        </div>
      </div>
    );
  }

  if (!scheme) {
    return null;
  }

  const statusColors = {
    draft: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm 5mm;
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

          table {
            page-break-inside: auto;
            font-size: 8.5pt !important;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          thead {
            display: table-header-group;
          }

          th,
          td {
            padding: 3px 4px !important;
            font-size: 8.5pt !important;
            line-height: 1.2 !important;
          }

          th {
            background: #4a5568 !important;
            color: white !important;
            font-size: 9pt !important;
          }

          .learning-experiences {
            font-size: 8.5pt !important;
            line-height: 1.3 !important;
          }
        }
      `}</style>
      <div className="min-h-screen bg-white relative overflow-hidden">
        <div className="relative z-10 max-w-full mx-auto px-8 py-6 print-full-width">
          {/* Action Buttons - Only visible on screen */}
          <div className="mb-4 flex justify-between items-center no-print">
            <button
              onClick={() => router.push("/professional-records")}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <FiArrowLeft className="w-5 h-5" />
              Back to Professional Records
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleGenerateLessonPlans}
                disabled={generatingPlans}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300 disabled:opacity-50"
              >
                <FiFileText className="w-4 h-4" />
                {generatingPlans ? "Generating..." : "Generate Lesson Plans"}
              </button>
              <button
                onClick={() => window.print()}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300"
              >
                <FiDownload className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={() =>
                  router.push(`/professional-records/schemes/${schemeId}/edit`)
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

          {/* Document Header - Scheme of Work Title */}
          <div className="text-center mb-3 pb-2 border-b-2 border-gray-700">
            <h1 className="text-3xl font-bold text-blue-700 uppercase">
              SCHEME OF WORK
            </h1>
          </div>

          {/* Scheme Info Grid */}
          <div className="mb-4 p-3 bg-gray-50 border border-gray-300">
            <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-sm">
              <div>
                <span className="font-bold">Teacher:</span> <span>kevin</span>
              </div>
              <div>
                <span className="font-bold">School:</span>{" "}
                <span>lions school</span>
              </div>
              <div>
                <span className="font-bold">Subject:</span>{" "}
                <span>{scheme.subject_name}</span>
              </div>
              <div>
                <span className="font-bold">Grade:</span>{" "}
                <span>{scheme.grade}</span>
              </div>
              <div>
                <span className="font-bold">Term:</span>{" "}
                <span>Term {scheme.term_number}</span>
              </div>
              <div>
                <span className="font-bold">Year:</span>{" "}
                <span>{scheme.term_year}</span>
              </div>
              <div>
                <span className="font-bold">Total Weeks:</span>{" "}
                <span>{scheme.total_weeks}</span>
              </div>
              <div>
                <span className="font-bold">Total Lessons:</span>{" "}
                <span>{scheme.total_lessons}</span>
              </div>
            </div>
          </div>

          {/* Stats Cards - Hidden on print */}
          <div className="grid md:grid-cols-3 gap-6 mb-8 no-print">
            <div className="glass-card bg-white/60 backdrop-blur-xl rounded-xl shadow-lg border border-white/60 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Weeks</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {scheme.total_weeks}
                  </p>
                </div>
                <FiClock className="w-10 h-10 text-indigo-500" />
              </div>
            </div>

            <div className="glass-card bg-white/60 backdrop-blur-xl rounded-xl shadow-lg border border-white/60 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Lessons</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {scheme.total_lessons}
                  </p>
                </div>
                <FiBookOpen className="w-10 h-10 text-purple-500" />
              </div>
            </div>

            <div className="glass-card bg-white/60 backdrop-blur-xl rounded-xl shadow-lg border border-white/60 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Lessons per Week</p>
                  <p className="text-3xl font-bold text-violet-600">
                    {Math.ceil(scheme.total_lessons / scheme.total_weeks)}
                  </p>
                </div>
                <FiCalendar className="w-10 h-10 text-violet-500" />
              </div>
            </div>
          </div>

          {/* Scheme Header */}
          <div className="glass-card bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8 mb-6 no-print">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teacher Name
                </label>
                <input
                  type="text"
                  placeholder="Enter teacher name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  School
                </label>
                <input
                  type="text"
                  placeholder="Enter school name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={scheme.subject_name}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Grade
                </label>
                <input
                  type="text"
                  value={scheme.grade}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Term
                </label>
                <input
                  type="text"
                  value={`Term ${scheme.term_number}`}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year
                </label>
                <input
                  type="text"
                  value={scheme.term_year}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Scheme of Work Table */}
          <div className="glass-card bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8 overflow-x-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 no-print">
              Scheme of Work
            </h2>

            <div className="overflow-x-auto">
              <table
                className="w-full border-collapse border border-gray-400"
                style={{ width: "100%" }}
              >
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <th
                      className="border border-gray-400 px-3 py-3 text-left text-sm font-bold"
                      style={{ width: "3.5%" }}
                    >
                      Week
                    </th>
                    <th
                      className="border border-gray-400 px-3 py-3 text-left text-sm font-bold"
                      style={{ width: "3.5%" }}
                    >
                      Lesson
                    </th>
                    <th
                      className="border border-gray-400 px-3 py-3 text-left text-sm font-bold"
                      style={{ width: "10%" }}
                    >
                      Strand /Theme
                    </th>
                    <th
                      className="border border-gray-400 px-3 py-3 text-left text-sm font-bold"
                      style={{ width: "10%" }}
                    >
                      Sub-strand
                    </th>
                    <th
                      className="border border-gray-400 px-3 py-3 text-left text-sm font-bold"
                      style={{ width: "19%" }}
                    >
                      Specific-Learning outcomes
                    </th>
                    <th
                      className="border border-gray-400 px-3 py-3 text-left text-sm font-bold"
                      style={{ width: "14%" }}
                    >
                      Key Inquiry Question(S)
                    </th>
                    <th
                      className="border border-gray-400 px-3 py-3 text-left text-sm font-bold"
                      style={{ width: "24%" }}
                    >
                      Learning/ Teaching Experience
                    </th>
                    <th
                      className="border border-gray-400 px-3 py-3 text-left text-sm font-bold"
                      style={{ width: "9%" }}
                    >
                      Learning Resources
                    </th>
                    <th
                      className="border border-gray-400 px-3 py-3 text-left text-sm font-bold"
                      style={{ width: "9%" }}
                    >
                      Assessment Methods
                    </th>
                    <th
                      className="border border-gray-400 px-3 py-3 text-left text-sm font-bold"
                      style={{ width: "6%" }}
                    >
                      Reflection
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scheme.weeks.map((week) =>
                    week.lessons.map((lesson, lessonIdx) => {
                      // Format specific learning outcomes to ensure it starts with the proper prefix
                      const formattedOutcomes =
                        lesson.specific_learning_outcomes?.trim()
                          ? lesson.specific_learning_outcomes.startsWith(
                              "By the end of the sub-strand"
                            )
                            ? lesson.specific_learning_outcomes
                            : `By the end of the sub-strand, the learner should be able to:\n${lesson.specific_learning_outcomes}`
                          : "";

                      return (
                        <tr
                          key={`${week.week_number}-${lessonIdx}`}
                          className="hover:bg-gray-50"
                        >
                          {lessonIdx === 0 && (
                            <td
                              className="border border-gray-400 px-3 py-3 text-sm font-semibold text-center bg-gray-50 align-middle"
                              rowSpan={week.lessons.length}
                            >
                              {week.week_number}
                            </td>
                          )}
                          <td className="border border-gray-400 px-3 py-3 text-sm font-semibold text-center bg-gray-50">
                            {lessonIdx + 1}
                          </td>
                          <td className="border border-gray-400 px-3 py-3 text-sm">
                            {lesson.strand || ""}
                          </td>
                          <td className="border border-gray-400 px-3 py-3 text-sm">
                            {lesson.sub_strand || ""}
                          </td>
                          <td className="border border-gray-400 px-3 py-3 text-sm whitespace-pre-wrap">
                            {formattedOutcomes}
                          </td>
                          <td className="border border-gray-400 px-3 py-3 text-sm whitespace-pre-wrap">
                            {lesson.key_inquiry_questions || ""}
                          </td>
                          <td className="border border-gray-400 px-3 py-3 text-sm whitespace-pre-wrap learning-experiences">
                            {(() => {
                              if (!lesson.learning_experiences) return "";

                              const text = lesson.learning_experiences.trim();
                              // Split by newline if present, otherwise split by period followed by space or end of string
                              // This handles both paragraph style (sentences) and list style (newlines)
                              let parts = text.includes("\n")
                                ? text.split("\n")
                                : text.split(/\.\s+/);

                              return parts
                                .map((p) => p.trim())
                                .filter((p) => p.length > 0)
                                .map((p) => {
                                  // Remove existing bullets if any
                                  const cleanP = p.replace(/^[•\-\*]\s*/, "");
                                  // Capitalize first letter
                                  return `• ${
                                    cleanP.charAt(0).toUpperCase() +
                                    cleanP.slice(1)
                                  }`;
                                })
                                .join("\n");
                            })()}
                          </td>
                          <td className="border border-gray-400 px-3 py-3 text-sm whitespace-pre-wrap">
                            <div className="space-y-1">
                              {lesson.learning_resources
                                ? lesson.learning_resources
                                    .split(",")
                                    .map((r) => r.trim())
                                    .filter((r) => r.length > 0)
                                    .map((r, i) => (
                                      <div key={i}>
                                        •{" "}
                                        {r.charAt(0).toUpperCase() + r.slice(1)}
                                      </div>
                                    ))
                                : ""}

                              {lesson.textbook_name && (
                                <div className="mt-3 pt-2 border-t border-gray-300">
                                  <div className="font-bold text-gray-900 mb-1">
                                    Textbook:
                                  </div>
                                  <div className="text-gray-800 mb-1">
                                    {lesson.textbook_name}
                                  </div>
                                  {lesson.textbook_teacher_guide_pages && (
                                    <div className="text-gray-700">
                                      TG: {lesson.textbook_teacher_guide_pages}
                                    </div>
                                  )}
                                  {lesson.textbook_learner_book_pages && (
                                    <div className="text-gray-700">
                                      LB: {lesson.textbook_learner_book_pages}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-400 px-3 py-3 text-sm whitespace-pre-wrap">
                            <div className="space-y-1">
                              {lesson.assessment_methods
                                ? lesson.assessment_methods
                                    .split(",")
                                    .map((m) => m.trim())
                                    .filter((m) => m.length > 0)
                                    .map((m, i) => (
                                      <div key={i}>
                                        •{" "}
                                        {m.charAt(0).toUpperCase() + m.slice(1)}
                                      </div>
                                    ))
                                : ""}
                            </div>
                          </td>
                          <td className="border border-gray-400 px-3 py-3 text-sm whitespace-pre-wrap">
                            {lesson.reflection || ""}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
