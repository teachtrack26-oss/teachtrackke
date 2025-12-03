"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
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
  FiFilePlus,
  FiClipboard,
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

interface WeekLesson {
  id: number;
  lesson_number: number;
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
  start_date?: string;
  end_date?: string;
}

interface SchemeOfWork {
  id: number;
  subject_id: number;
  subject_name?: string;
  subject?: string;
  grade: string;
  term_number: number;
  term_year: number;
  total_weeks: number;
  total_lessons: number;
  status: "draft" | "active" | "completed";
  weeks: Week[];
  created_at: string;
  updated_at: string;
  teacher_name?: string;
  school?: string;
  term?: string;
  year?: number;
}

interface SchoolContext {
  has_context?: boolean;
  school_name?: string;
  principal_name?: string;
  county?: string;
  sub_county?: string;
}

export default function ViewSchemePage() {
  const router = useRouter();
  const params = useParams();
  const schemeId = params?.id as string;
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [scheme, setScheme] = useState<SchemeOfWork | null>(null);
  const [schoolContext, setSchoolContext] = useState<SchoolContext | null>(
    null
  );
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());
  const [changingStatus, setChangingStatus] = useState(false);
  const [generatingPlans, setGeneratingPlans] = useState(false);
  const [generatingRecord, setGeneratingRecord] = useState(false);

  // Sync session token to localStorage on mount
  useEffect(() => {
    if (status === "authenticated" && (session as any)?.accessToken) {
      const sessionToken = (session as any).accessToken;
      const localToken = localStorage.getItem("accessToken");
      if (!localToken || localToken !== sessionToken) {
        localStorage.setItem("accessToken", sessionToken);
        console.log("Synced session token to localStorage");
      }
    }
  }, [session, status]);

  useEffect(() => {
    // Wait for session to load before fetching
    if (status === "loading") return;

    if (schemeId) {
      fetchScheme();
    }
  }, [schemeId, status]);

  const fetchScheme = async () => {
    try {
      // Check for token from localStorage or session
      let token =
        localStorage.getItem("accessToken") || (session as any)?.accessToken;

      if (!token) {
        toast.error("Please login to view scheme");
        router.push("/login");
        return;
      }

      // Fetch school context for teacher/school names
      try {
        const contextRes = await axios.get("/api/v1/profile/school-context", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("School context response:", contextRes.data);
        setSchoolContext(contextRes.data);
      } catch (err) {
        console.error("Failed to fetch school context:", err);
      }

      const response = await axios.get(`/api/v1/schemes/${schemeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Scheme data:", response.data);
      console.log("Session user:", session?.user);
      setScheme(response.data);
    } catch (error: any) {
      console.error("Failed to fetch scheme:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        router.push("/login");
      } else {
        toast.error("Failed to load scheme of work");
        router.push("/professional-records");
      }
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
      const token =
        localStorage.getItem("accessToken") || (session as any)?.accessToken;
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

  const handleCreateLessonPlan = async (lessonId: number) => {
    try {
      setGeneratingPlans(true);
      const token =
        localStorage.getItem("accessToken") || (session as any)?.accessToken;

      const response = await axios.post(
        `/api/v1/lesson-plans/from-scheme/${lessonId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Lesson plan created!");
      // Redirect to edit page
      router.push(
        `/professional-records/lesson-plans/${response.data.id}/edit`
      );
    } catch (error) {
      console.error("Failed to create lesson plan:", error);
      toast.error("Failed to create lesson plan");
    } finally {
      setGeneratingPlans(false);
    }
  };

  const handleMarkTaught = async (lessonId: number) => {
    try {
      const token =
        localStorage.getItem("accessToken") || (session as any)?.accessToken;

      await axios.post(
        `/api/v1/records-of-work/mark-taught/${lessonId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Marked as taught!");
    } catch (error) {
      console.error("Failed to mark as taught:", error);
      toast.error("Failed to mark as taught");
    }
  };

  const handleDownloadPdf = async () => {
    if (!scheme) return;

    // Check for Free Plan
    const user = session?.user as any;
    if (user?.subscription_type === "FREE") {
      toast.error(
        "Downloads are available on Premium plans only. Please upgrade to download."
      );
      return;
    }

    const loadingToast = toast.loading("Generating PDF...");

    try {
      const token =
        localStorage.getItem("accessToken") || (session as any)?.accessToken;
      const response = await axios.get(`/api/v1/schemes/${schemeId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Generate filename
      const subjectName = scheme.subject_name || scheme.subject || "Scheme";
      const term = scheme.term || `Term${scheme.term_number}`;
      const year = scheme.year || scheme.term_year;
      const filename =
        `${subjectName}_${scheme.grade}_${term}_${year}.pdf`.replace(
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
      const token =
        localStorage.getItem("accessToken") || (session as any)?.accessToken;
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
      const token =
        localStorage.getItem("accessToken") || (session as any)?.accessToken;
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

  const handleGenerateRecordOfWork = async () => {
    if (!scheme) return;

    const confirmGenerate = confirm(
      "This will create a Record of Work from this scheme. Continue?"
    );

    if (!confirmGenerate) return;

    setGeneratingRecord(true);
    const loadingToast = toast.loading("Generating Record of Work...");

    try {
      const token =
        localStorage.getItem("accessToken") || (session as any)?.accessToken;
      const response = await axios.post(
        `/api/v1/records-of-work/create-from-scheme/${schemeId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.dismiss(loadingToast);
      toast.success("Record of Work generated successfully!");
      router.push(`/professional-records/record-of-work/${response.data.id}`);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error("Failed to generate record:", error);
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Failed to generate Record of Work");
      }
    } finally {
      setGeneratingRecord(false);
    }
  };

  if (loading || status === "loading") {
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
        @page {
          size: A4 landscape;
          margin: 5mm;
        }

        @media print {
          /* Hide navbar and all navigation elements */
          nav,
          header,
          .navbar,
          [class*="navbar"],
          [class*="Navbar"],
          .no-print {
            display: none !important;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            padding: 0 !important;
            margin: 0 !important;
          }

          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 5mm !important;
          }

          /* Remove extra spacing reserved for navbar */
          .pt-24 {
            padding-top: 0 !important;
          }

          .py-6 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }

          .mb-2,
          .mb-3,
          .mb-4 {
            margin-bottom: 2mm !important;
          }

          /* Compact header */
          .scheme-header {
            margin-bottom: 2mm !important;
            padding: 2mm !important;
          }

          .scheme-title {
            font-size: 14pt !important;
            margin-bottom: 1mm !important;
            padding-bottom: 1mm !important;
          }

          .scheme-info-grid {
            font-size: 9pt !important;
            gap: 1mm !important;
          }

          table {
            page-break-inside: auto;
            font-size: 9pt !important;
            width: 100% !important;
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
            font-size: 9pt !important;
            line-height: 1.25 !important;
          }

          th {
            background: #4338ca !important;
            color: white !important;
            font-size: 10pt !important;
          }

          .learning-experiences {
            font-size: 9pt !important;
            line-height: 1.25 !important;
          }

          /* Hide glass effects */
          .glass-card {
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
      <div className="min-h-screen bg-white relative overflow-hidden pt-24">
        <div className="relative z-10 max-w-full mx-auto px-8 py-6 print-full-width print-container">
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
                onClick={handleGenerateRecordOfWork}
                disabled={generatingRecord}
                className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300 disabled:opacity-50"
              >
                <FiClipboard className="w-4 h-4" />
                {generatingRecord ? "Generating..." : "Generate Record of Work"}
              </button>
              <button
                onClick={handleGenerateLessonPlans}
                disabled={generatingPlans}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300 disabled:opacity-50"
              >
                <FiFileText className="w-4 h-4" />
                {generatingPlans ? "Generating..." : "Generate Lesson Plans"}
              </button>
              <button
                onClick={handleDownloadPdf}
                className={`px-4 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300 ${
                  (session?.user as any)?.subscription_type === "FREE"
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                }`}
                title={
                  (session?.user as any)?.subscription_type === "FREE"
                    ? "Upgrade to download"
                    : "Download PDF"
                }
              >
                <FiDownload className="w-4 h-4" />
                {(session?.user as any)?.subscription_type === "FREE"
                  ? "Preview Only"
                  : "Download PDF"}
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
          <div className="text-center mb-2 pb-1 border-b-2 border-gray-700">
            <h1 className="text-2xl font-bold text-blue-700 uppercase scheme-title">
              SCHEME OF WORK
            </h1>
          </div>

          {/* Scheme Info Grid - Compact */}
          <div className="mb-3 p-2 bg-gray-50 border border-gray-300 scheme-header">
            <div className="grid grid-cols-4 gap-x-3 gap-y-1 text-sm scheme-info-grid">
              <div>
                <span className="font-bold">Teacher:</span>{" "}
                <span>
                  {scheme.teacher_name ||
                    (session?.user as any)?.full_name ||
                    session?.user?.name ||
                    "N/A"}
                </span>
              </div>
              <div>
                <span className="font-bold">School:</span>{" "}
                <span>
                  {schoolContext?.school_name || scheme.school || "N/A"}
                </span>
              </div>
              <div>
                <span className="font-bold">Subject:</span>{" "}
                <span>{scheme.subject || scheme.subject_name || "N/A"}</span>
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
                <span>{scheme.term_year || new Date().getFullYear()}</span>
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
                  value={
                    scheme.teacher_name ||
                    (session?.user as any)?.full_name ||
                    session?.user?.name ||
                    ""
                  }
                  readOnly
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
                  value={schoolContext?.school_name || scheme.school || ""}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={scheme.subject || scheme.subject_name}
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
                  value={
                    scheme.term ||
                    (scheme.term_number ? `Term ${scheme.term_number}` : "")
                  }
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
                  value={scheme.year || scheme.term_year}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Scheme of Work Table */}
          <div className="glass-card bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-4 overflow-x-auto print:p-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 no-print">
              Scheme of Work
            </h2>

            <div className="overflow-x-auto">
              <table
                className="w-full border-collapse border border-gray-400"
                style={{ width: "100%", tableLayout: "fixed" }}
              >
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <th
                      className="border border-gray-400 px-2 py-2 text-left text-xs font-bold"
                      style={{ width: "4%" }}
                    >
                      Wk
                    </th>
                    <th
                      className="border border-gray-400 px-2 py-2 text-left text-xs font-bold"
                      style={{ width: "4%" }}
                    >
                      Ls
                    </th>
                    <th
                      className="border border-gray-400 px-2 py-2 text-left text-xs font-bold"
                      style={{ width: "9%" }}
                    >
                      Strand/Theme
                    </th>
                    <th
                      className="border border-gray-400 px-2 py-2 text-left text-xs font-bold"
                      style={{ width: "9%" }}
                    >
                      Sub-strand
                    </th>
                    <th
                      className="border border-gray-400 px-2 py-2 text-left text-xs font-bold"
                      style={{ width: "15%" }}
                    >
                      Learning Outcomes
                    </th>
                    <th
                      className="border border-gray-400 px-2 py-2 text-left text-xs font-bold"
                      style={{ width: "12%" }}
                    >
                      Key Inquiry Questions
                    </th>
                    <th
                      className="border border-gray-400 px-2 py-2 text-left text-xs font-bold"
                      style={{ width: "22%" }}
                    >
                      Learning Experiences
                    </th>
                    <th
                      className="border border-gray-400 px-2 py-2 text-left text-xs font-bold"
                      style={{ width: "9%" }}
                    >
                      Resources
                    </th>
                    <th
                      className="border border-gray-400 px-2 py-2 text-left text-xs font-bold"
                      style={{ width: "9%" }}
                    >
                      Assessment
                    </th>
                    <th
                      className="border border-gray-400 px-2 py-2 text-left text-xs font-bold"
                      style={{ width: "7%" }}
                    >
                      Reflect.
                    </th>
                    <th
                      className="border border-gray-400 px-2 py-2 text-left text-xs font-bold no-print"
                      style={{ width: "5%" }}
                    >
                      Act.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scheme.weeks.map((week) =>
                    week.lessons.map((lesson, lessonIdx) => {
                      const isBreakLesson = (lesson.strand || "")
                        .toUpperCase()
                        .includes("BREAK");

                      const formattedOutcomes = (() => {
                        if (isBreakLesson) {
                          return "Mid Term Break";
                        }
                        if (!lesson.specific_learning_outcomes?.trim()) {
                          return "";
                        }
                        return lesson.specific_learning_outcomes.startsWith(
                          "By the end"
                        )
                          ? lesson.specific_learning_outcomes
                          : `By the end of the sub-strand, the learner should be able to: ${lesson.specific_learning_outcomes}`;
                      })();

                      const formattedInquiry = isBreakLesson
                        ? ""
                        : lesson.key_inquiry_questions || "";

                      const formattedExperiences = (() => {
                        if (isBreakLesson || !lesson.learning_experiences) {
                          return "";
                        }
                        const text = lesson.learning_experiences.trim();
                        const parts = text.includes("\n")
                          ? text.split("\n")
                          : text.split(/\.\s+/);
                        return parts
                          .map((p) => p.trim())
                          .filter((p) => p.length > 0)
                          .map((p) => {
                            const cleanP = p.replace(/^[•\-*]\s*/, "");
                            return `• ${
                              cleanP.charAt(0).toUpperCase() + cleanP.slice(1)
                            }`;
                          })
                          .join("\n");
                      })();

                      const formattedResources = isBreakLesson
                        ? ""
                        : lesson.learning_resources
                        ? lesson.learning_resources
                            .split(",")
                            .map((r) => r.trim())
                            .filter((r) => r.length > 0)
                            .map(
                              (r) =>
                                `• ${r.charAt(0).toUpperCase() + r.slice(1)}`
                            )
                            .join("\n")
                        : "";

                      const formattedAssessments = isBreakLesson
                        ? ""
                        : lesson.assessment_methods
                        ? lesson.assessment_methods
                            .split(",")
                            .map((m) => m.trim())
                            .filter((m) => m.length > 0)
                            .map(
                              (m) =>
                                `• ${m.charAt(0).toUpperCase() + m.slice(1)}`
                            )
                            .join("\n")
                        : "";

                      const formattedReflection = isBreakLesson
                        ? ""
                        : lesson.reflection || "";

                      return (
                        <tr
                          key={`${week.week_number}-${lessonIdx}`}
                          className="hover:bg-gray-50"
                        >
                          {lessonIdx === 0 && (
                            <td
                              className="border border-gray-400 px-2 py-2 text-xs font-semibold text-center bg-gray-50 align-middle"
                              rowSpan={week.lessons.length}
                            >
                              <div className="font-bold">
                                {week.week_number}
                              </div>
                              {week.start_date && week.end_date && (
                                <div className="text-[9px] text-gray-600 mt-1 leading-tight">
                                  {new Date(week.start_date).toLocaleDateString(
                                    "en-GB",
                                    { day: "numeric", month: "short" }
                                  )}
                                  <br />
                                  to
                                  <br />
                                  {new Date(week.end_date).toLocaleDateString(
                                    "en-GB",
                                    { day: "numeric", month: "short" }
                                  )}
                                </div>
                              )}
                            </td>
                          )}
                          <td className="border border-gray-400 px-2 py-2 text-xs font-semibold text-center bg-gray-50">
                            {lessonIdx + 1}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-xs">
                            {lesson.strand || ""}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-xs">
                            {lesson.sub_strand || ""}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-xs whitespace-pre-wrap">
                            {formattedOutcomes}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-xs whitespace-pre-wrap">
                            {formattedInquiry}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-xs whitespace-pre-wrap learning-experiences">
                            {formattedExperiences}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-xs whitespace-pre-wrap">
                            {formattedResources}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-xs whitespace-pre-wrap">
                            {formattedAssessments}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-xs whitespace-pre-wrap">
                            {formattedReflection}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-xs whitespace-pre-wrap no-print text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() =>
                                  handleCreateLessonPlan(lesson.id)
                                }
                                disabled={generatingPlans}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                title="Create Lesson Plan"
                              >
                                <FiFilePlus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleMarkTaught(lesson.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                                title="Mark as Taught"
                              >
                                <FiCheckCircle className="w-4 h-4" />
                              </button>
                            </div>
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
