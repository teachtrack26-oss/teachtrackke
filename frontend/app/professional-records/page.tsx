"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiBookOpen,
  FiFileText,
  FiCheckSquare,
  FiCalendar,
  FiDownload,
  FiPlus,
  FiEye,
  FiEdit,
  FiTrash2,
  FiClock,
  FiUsers,
  FiTrendingUp,
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

interface Subject {
  id: number;
  subject_name: string;
  grade: string;
  current_strand_id: string;
  current_substrand_id: string;
  lessons_completed: number;
  total_lessons: number;
  progress_percentage: number;
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
  created_at: string;
  updated_at: string;
}

interface LessonPlan {
  id: number;
  subject_id: number;
  subject_name: string;
  grade: string;
  lesson_number: number;
  lesson_title: string;
  strand_name: string;
  substrand_name: string;
  date_planned: string;
  status: "pending" | "taught" | "postponed";
  created_at: string;
}

interface RecordOfWork {
  id: number;
  subject_id: number;
  subject_name: string;
  grade: string;
  lesson_title: string;
  date_taught: string;
  lessons_covered: number;
  attendance: number;
  notes: string;
  created_at: string;
}

export default function ProfessionalRecordsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeTab, setActiveTab] = useState<"schemes" | "lessons" | "records">(
    "schemes"
  );

  // Data states
  const [schemes, setSchemes] = useState<SchemeOfWork[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [recordsOfWork, setRecordsOfWork] = useState<RecordOfWork[]>([]);

  // Statistics
  const [stats, setStats] = useState({
    totalSchemes: 0,
    activeSchemes: 0,
    totalLessonPlans: 0,
    taughtLessons: 0,
    recordsThisWeek: 0,
    completionRate: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      // Fetch subjects
      const subjectsRes = await axios.get("/api/v1/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(subjectsRes.data);

      // Fetch schemes of work
      const schemesRes = await axios.get("/api/v1/schemes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchemes(schemesRes.data);

      // Fetch schemes statistics
      const statsRes = await axios.get("/api/v1/schemes/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch lesson plans
      try {
        const lessonPlansRes = await axios.get("/api/v1/lesson-plans", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLessonPlans(lessonPlansRes.data);
      } catch (error) {
        console.log("Lesson plans not available yet");
        setLessonPlans([]);
      }

      // TODO: Fetch records from API
      setRecordsOfWork([]);

      // Calculate stats
      setStats({
        totalSchemes: statsRes.data.total_schemes || 0,
        activeSchemes: statsRes.data.active_schemes || 0,
        totalLessonPlans: lessonPlans.length || 0,
        taughtLessons:
          lessonPlans.filter((lp) => lp.status === "taught").length || 0,
        recordsThisWeek: 0,
        completionRate: statsRes.data.active_schemes
          ? Math.round(
              (statsRes.data.completed_schemes / statsRes.data.total_schemes) *
                100
            )
          : 0,
      });
    } catch (error) {
      console.error("Failed to fetch professional records data:", error);
      toast.error("Failed to load professional records");
    } finally {
      setLoading(false);
    }
  };

  const getSubjectTheme = (subjectName: string) => {
    const name = subjectName?.toLowerCase() || "";
    if (name.includes("math"))
      return { gradient: "from-blue-500 to-cyan-500", icon: "🔢" };
    if (name.includes("english"))
      return { gradient: "from-rose-500 to-pink-500", icon: "📖" };
    if (name.includes("kiswahili"))
      return { gradient: "from-amber-500 to-orange-500", icon: "🗣️" };
    if (name.includes("science"))
      return { gradient: "from-emerald-500 to-teal-500", icon: "🌿" };
    if (name.includes("social"))
      return { gradient: "from-teal-500 to-cyan-500", icon: "🌍" };
    return { gradient: "from-gray-500 to-slate-500", icon: "📚" };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">
            Loading professional records...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
            Professional Records
          </h1>
          <p className="text-gray-700 mt-2 text-lg">
            Manage your schemes of work, lesson plans, and teaching records
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="glass-card bg-white/60 backdrop-blur-xl rounded-xl shadow-lg border border-white/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Schemes</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.totalSchemes}
                </p>
              </div>
              <FiBookOpen className="w-8 h-8 text-indigo-500" />
            </div>
          </div>

          <div className="glass-card bg-white/60 backdrop-blur-xl rounded-xl shadow-lg border border-white/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Schemes</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.activeSchemes}
                </p>
              </div>
              <FiCheckSquare className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="glass-card bg-white/60 backdrop-blur-xl rounded-xl shadow-lg border border-white/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lesson Plans</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalLessonPlans}
                </p>
              </div>
              <FiFileText className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="glass-card bg-white/60 backdrop-blur-xl rounded-xl shadow-lg border border-white/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taught Lessons</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.taughtLessons}
                </p>
              </div>
              <FiUsers className="w-8 h-8 text-emerald-500" />
            </div>
          </div>

          <div className="glass-card bg-white/60 backdrop-blur-xl rounded-xl shadow-lg border border-white/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.recordsThisWeek}
                </p>
              </div>
              <FiClock className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="glass-card bg-white/60 backdrop-blur-xl rounded-xl shadow-lg border border-white/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.completionRate}%
                </p>
              </div>
              <FiTrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="glass-card bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 mb-6 p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("schemes")}
              className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === "schemes"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "text-gray-700 hover:bg-white/60"
              }`}
            >
              <FiBookOpen className="w-5 h-5" />
              Schemes of Work
            </button>
            <button
              onClick={() => setActiveTab("lessons")}
              className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === "lessons"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "text-gray-700 hover:bg-white/60"
              }`}
            >
              <FiFileText className="w-5 h-5" />
              Lesson Plans
            </button>
            <button
              onClick={() => setActiveTab("records")}
              className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === "records"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "text-gray-700 hover:bg-white/60"
              }`}
            >
              <FiCheckSquare className="w-5 h-5" />
              Records of Work
            </button>
          </div>
        </div>

        {/* Schemes of Work Tab */}
        {activeTab === "schemes" && (
          <div className="glass-card bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Schemes of Work
              </h2>
              <Link
                href="/professional-records/generate-scheme"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300"
              >
                <FiPlus className="w-5 h-5" />
                Create New Scheme
              </Link>
            </div>

            {schemes.length === 0 ? (
              <div className="text-center py-12">
                <FiBookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Schemes of Work Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first scheme of work to organize your teaching.
                </p>
                <Link
                  href="/professional-records/generate-scheme"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <FiPlus className="w-5 h-5" />
                  Create Scheme
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schemes.map((scheme) => {
                  const theme = getSubjectTheme(scheme.subject_name);
                  const statusColors = {
                    draft: "bg-yellow-100 text-yellow-800",
                    active: "bg-green-100 text-green-800",
                    completed: "bg-blue-100 text-blue-800",
                  };

                  return (
                    <div
                      key={scheme.id}
                      className="glass-card bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/60 hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden"
                    >
                      {/* Gradient Header */}
                      <div
                        className={`bg-gradient-to-br ${theme.gradient} p-6 text-white`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-4xl">{theme.icon}</div>
                          <span className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                            {scheme.grade}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-2 break-words">
                          {scheme.subject_name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm">
                          <FiCalendar className="w-4 h-4" />
                          <span>
                            Term {scheme.term_number} • {scheme.term_year}
                          </span>
                        </div>
                      </div>

                      {/* White Body */}
                      <div className="p-6 flex-1 flex flex-col bg-white">
                        <div className="mb-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              statusColors[scheme.status]
                            }`}
                          >
                            {scheme.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-gray-700 text-sm flex items-center gap-2">
                            <FiClock className="w-4 h-4" />
                            <span className="font-semibold">
                              {scheme.total_weeks} weeks
                            </span>
                          </p>
                          <p className="text-gray-700 text-sm flex items-center gap-2">
                            <FiBookOpen className="w-4 h-4" />
                            <span className="font-semibold">
                              {scheme.total_lessons} lessons
                            </span>
                          </p>
                        </div>

                        <div className="flex gap-2 mt-auto">
                          <Link
                            href={`/professional-records/schemes/${scheme.id}`}
                            className={`flex-1 bg-gradient-to-r ${theme.gradient} text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm hover:shadow-lg`}
                          >
                            <FiEye className="w-4 h-4" />
                            View
                          </Link>
                          <Link
                            href={`/professional-records/schemes/${scheme.id}/edit`}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                          >
                            <FiEdit className="w-4 h-4" />
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Lesson Plans Tab */}
        {activeTab === "lessons" && (
          <div className="glass-card bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Lesson Plans</h2>
              <Link
                href="/professional-records/create-lesson-plan"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300"
              >
                <FiPlus className="w-5 h-5" />
                Create Lesson Plan
              </Link>
            </div>

            {lessonPlans.length === 0 ? (
              <div className="text-center py-12">
                <FiFileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Lesson Plans Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create schemes of work first, then use "Generate Lesson Plans"
                  to automatically create individual lesson plans for each
                  lesson.
                </p>
                <div className="text-sm text-gray-500 mb-4">
                  <p>
                    📝 <strong>Tip:</strong> Go to any scheme of work and click
                    "Generate Lesson Plans" to automatically create lesson plans
                    from your existing schemes!
                  </p>
                </div>
                <Link
                  href="/professional-records/create-lesson-plan"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <FiPlus className="w-5 h-5" />
                  Create Manual Lesson Plan
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lessonPlans.map((lessonPlan) => {
                  const statusColors = {
                    pending: "bg-yellow-100 text-yellow-800",
                    taught: "bg-green-100 text-green-800",
                    postponed: "bg-red-100 text-red-800",
                  };

                  return (
                    <div
                      key={lessonPlan.id}
                      className="glass-card bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/60 hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden"
                    >
                      {/* Header */}
                      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-4xl">📝</div>
                          <span className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold">
                            {lessonPlan.grade}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-2 break-words">
                          {lessonPlan.learning_area}
                        </h3>
                        <div className="flex items-center gap-2 text-sm">
                          <FiCalendar className="w-4 h-4" />
                          <span>{lessonPlan.date || "No date set"}</span>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-6 flex-1 flex flex-col bg-white">
                        <div className="mb-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              statusColors[
                                lessonPlan.status as keyof typeof statusColors
                              ]
                            }`}
                          >
                            {lessonPlan.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-gray-700 text-sm">
                            <span className="font-semibold">Topic:</span>{" "}
                            {lessonPlan.strand_theme_topic}
                          </p>
                          {lessonPlan.sub_strand_sub_theme_sub_topic && (
                            <p className="text-gray-700 text-sm">
                              <span className="font-semibold">Sub-topic:</span>{" "}
                              {lessonPlan.sub_strand_sub_theme_sub_topic}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 mt-auto">
                          <Link
                            href={`/professional-records/lesson-plans/${lessonPlan.id}`}
                            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm hover:shadow-lg"
                          >
                            <FiEye className="w-4 h-4" />
                            View
                          </Link>
                          <Link
                            href={`/professional-records/lesson-plans/${lessonPlan.id}/edit`}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                          >
                            <FiEdit className="w-4 h-4" />
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Records of Work Tab */}
        {activeTab === "records" && (
          <div className="glass-card bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Records of Work Covered
              </h2>
              <button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300">
                <FiPlus className="w-5 h-5" />
                Add Record
              </button>
            </div>

            <div className="text-center py-12">
              <FiCheckSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Records Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start teaching lessons and record your progress here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
