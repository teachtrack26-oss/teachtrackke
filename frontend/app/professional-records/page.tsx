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
  FiSearch,
  FiArchive,
  FiShare2,
  FiCopy,
  FiCheckCircle,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface LessonPlan {
  id: number;
  learning_area: string;
  grade: string;
  strand_theme_topic: string;
  sub_strand_sub_theme_sub_topic: string;
  date: string;
  status: "pending" | "taught" | "postponed";
  is_archived: boolean;
  created_at: string;
  lesson_number?: number;
  week_number?: number;
}

interface RecordOfWork {
  id: number;
  learning_area: string;
  grade: string;
  term: string;
  year: number;
  is_archived: boolean;
  created_at: string;
}

export default function ProfessionalRecordsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeTab, setActiveTab] = useState<"schemes" | "lessons" | "records">(
    "schemes"
  );
  const [showArchived, setShowArchived] = useState(false);

  // Data states
  const [schemes, setSchemes] = useState<SchemeOfWork[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [recordsOfWork, setRecordsOfWork] = useState<RecordOfWork[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<number[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter states
  const [filters, setFilters] = useState({
    subject: "all",
    grade: "all",
    term: "all",
    year: "all",
    status: "all",
  });

  // Statistics
  const [stats, setStats] = useState({
    totalSchemes: 0,
    activeSchemes: 0,
    totalLessonPlans: 0,
    taughtLessons: 0,
    recordsThisWeek: 0,
    completionRate: 0,
  });

  const [dashboardData, setDashboardData] = useState({
    weekly_activity: [],
    subject_progress: [],
  });

  useEffect(() => {
    fetchData();
  }, [showArchived]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const archivedQuery = showArchived ? "?archived=true" : "";

      // Fetch subjects
      const subjectsRes = await axios.get("/api/v1/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(subjectsRes.data);

      // Fetch schemes of work
      const schemesRes = await axios.get(`/api/v1/schemes${archivedQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchemes(schemesRes.data);

      // Fetch schemes statistics
      const statsRes = await axios.get("/api/v1/schemes/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch dashboard stats
      try {
        const dashboardRes = await axios.get("/api/v1/dashboard/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDashboardData(dashboardRes.data);
      } catch (error) {
        console.log("Dashboard stats not available");
      }

      // Fetch lesson plans
      try {
        const lessonPlansRes = await axios.get(
          `/api/v1/lesson-plans${archivedQuery}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setLessonPlans(lessonPlansRes.data);
      } catch (error) {
        console.log("Lesson plans not available yet");
        setLessonPlans([]);
      }

      // Fetch records from API
      try {
        const recordsRes = await axios.get(
          `/api/v1/records-of-work${archivedQuery}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setRecordsOfWork(recordsRes.data);
      } catch (error) {
        console.log("Records of work not available yet");
        setRecordsOfWork([]);
      }

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

  const toggleSelection = (id: number) => {
    setSelectedPlans((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPlans.length === lessonPlans.length) {
      setSelectedPlans([]);
    } else {
      setSelectedPlans(lessonPlans.map((lp) => lp.id));
    }
  };

  const handleBulkDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedPlans.length} lesson plans?`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      await axios.post("/api/v1/lesson-plans/bulk-delete", selectedPlans, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Lesson plans deleted successfully");
      setSelectedPlans([]);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Failed to delete lesson plans:", error);
      toast.error("Failed to delete lesson plans");
    }
  };

  const handleBulkPrint = () => {
    if (selectedPlans.length === 0) {
      toast.error("Please select at least one lesson plan to print");
      return;
    }
    const ids = selectedPlans.join(",");
    // Open in new tab
    window.open(
      `/professional-records/lesson-plans/print?ids=${ids}`,
      "_blank"
    );
  };

  const toggleRecordSelection = (id: number) => {
    setSelectedRecords((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    );
  };

  const toggleSelectAllRecords = () => {
    if (selectedRecords.length === filteredRecordsOfWork.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(filteredRecordsOfWork.map((r) => r.id));
    }
  };

  const handleBulkDeleteRecords = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedRecords.length} record(s) of work?`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      // Delete each record individually
      await Promise.all(
        selectedRecords.map((id) =>
          axios.delete(`/api/v1/records-of-work/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      toast.success("Records of work deleted successfully");
      setSelectedRecords([]);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Failed to delete records:", error);
      toast.error("Failed to delete records of work");
    }
  };

  const handleExport = (type: "schemes" | "lessons" | "records") => {
    let data: any[] = [];
    let filename = "";

    if (type === "schemes") {
      data = filteredSchemes.map((s) => ({
        Subject: s.subject_name,
        Grade: s.grade,
        Term: `Term ${s.term_number}`,
        Year: s.term_year,
        Status: s.status,
        Weeks: s.total_weeks,
        Lessons: s.total_lessons,
      }));
      filename = "schemes_of_work.csv";
    } else if (type === "lessons") {
      data = filteredLessonPlans.map((l) => ({
        Date: l.date,
        Subject: l.learning_area,
        Grade: l.grade,
        Topic: l.strand_theme_topic,
        Subtopic: l.sub_strand_sub_theme_sub_topic,
        Status: l.status,
      }));
      filename = "lesson_plans.csv";
    } else if (type === "records") {
      data = filteredRecordsOfWork.map((r) => ({
        Term: r.term,
        Year: r.year,
        Subject: r.learning_area,
        Grade: r.grade,
      }));
      filename = "records_of_work.csv";
    }

    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Convert to CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => `"${String(row[header] || "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleArchive = async (
    type: "scheme" | "lesson" | "record",
    id: number
  ) => {
    if (!confirm("Are you sure you want to archive this item?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      let endpoint = "";
      if (type === "scheme") endpoint = `/api/v1/schemes/${id}/archive`;
      else if (type === "lesson")
        endpoint = `/api/v1/lesson-plans/${id}/archive`;
      else if (type === "record")
        endpoint = `/api/v1/records-of-work/${id}/archive`;

      await axios.post(
        endpoint,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Item archived successfully");
      fetchData();
    } catch (error) {
      console.error("Failed to archive item:", error);
      toast.error("Failed to archive item");
    }
  };

  const handleUnarchive = async (
    type: "scheme" | "lesson" | "record",
    id: number
  ) => {
    try {
      const token = localStorage.getItem("accessToken");
      let endpoint = "";
      if (type === "scheme") endpoint = `/api/v1/schemes/${id}/unarchive`;
      else if (type === "lesson")
        endpoint = `/api/v1/lesson-plans/${id}/unarchive`;
      else if (type === "record")
        endpoint = `/api/v1/records-of-work/${id}/unarchive`;

      await axios.post(
        endpoint,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Item unarchived successfully");
      fetchData();
    } catch (error) {
      console.error("Failed to unarchive item:", error);
      toast.error("Failed to unarchive item");
    }
  };

  const handleShare = async (
    type: "schemes" | "lesson-plans" | "records-of-work",
    id: number
  ) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(
        `/api/v1/${type}/${id}/share`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Copy to clipboard
      navigator.clipboard.writeText(res.data.share_url);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error("Failed to share item:", error);
      toast.error("Failed to generate share link");
    }
  };

  const handleDuplicate = async (
    type: "schemes" | "lesson-plans",
    id: number
  ) => {
    if (!confirm("Create a copy of this item?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `/api/v1/${type}/${id}/duplicate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Item duplicated successfully");
      fetchData();
    } catch (error) {
      console.error("Failed to duplicate item:", error);
      toast.error("Failed to duplicate item");
    }
  };

  // Helper functions for filtering
  const getUniqueSubjects = () => {
    const schemesSubjects = schemes.map((s) => s.subject_name).filter(Boolean);
    const lessonSubjects = lessonPlans
      .map((lp) => lp.learning_area)
      .filter(Boolean);
    const recordSubjects = recordsOfWork
      .map((r) => r.learning_area)
      .filter(Boolean);
    return Array.from(
      new Set([...schemesSubjects, ...lessonSubjects, ...recordSubjects])
    ).sort();
  };

  const getUniqueGrades = () => {
    const schemesGrades = schemes.map((s) => s.grade).filter(Boolean);
    const lessonGrades = lessonPlans.map((lp) => lp.grade).filter(Boolean);
    const recordGrades = recordsOfWork.map((r) => r.grade).filter(Boolean);
    return Array.from(
      new Set([...schemesGrades, ...lessonGrades, ...recordGrades])
    ).sort();
  };

  const getUniqueTerms = () => {
    const schemesTerms = schemes
      .filter((s) => s.term_number != null)
      .map((s) => `Term ${s.term_number}`);
    const recordTerms = recordsOfWork.map((r) => r.term).filter(Boolean);
    return Array.from(new Set([...schemesTerms, ...recordTerms])).sort();
  };

  const getUniqueYears = () => {
    const schemesYears = schemes
      .filter((s) => s.term_year != null)
      .map((s) => s.term_year.toString());
    const recordYears = recordsOfWork
      .filter((r) => r.year != null)
      .map((r) => r.year.toString());
    return Array.from(new Set([...schemesYears, ...recordYears])).sort(
      (a, b) => Number(b) - Number(a)
    );
  };

  // Apply filters
  const filteredSchemes = schemes.filter((scheme) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        scheme.subject_name?.toLowerCase().includes(query) ||
        scheme.grade?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (filters.subject !== "all" && scheme.subject_name !== filters.subject)
      return false;
    if (filters.grade !== "all" && scheme.grade !== filters.grade) return false;
    if (filters.term !== "all" && `Term ${scheme.term_number}` !== filters.term)
      return false;
    if (filters.year !== "all" && scheme.term_year?.toString() !== filters.year)
      return false;
    if (filters.status !== "all" && scheme.status !== filters.status)
      return false;
    return true;
  });

  const filteredLessonPlans = lessonPlans.filter((lessonPlan) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        lessonPlan.learning_area?.toLowerCase().includes(query) ||
        lessonPlan.grade?.toLowerCase().includes(query) ||
        lessonPlan.strand_theme_topic?.toLowerCase().includes(query) ||
        lessonPlan.sub_strand_sub_theme_sub_topic
          ?.toLowerCase()
          .includes(query);
      if (!matchesSearch) return false;
    }

    if (
      filters.subject !== "all" &&
      lessonPlan.learning_area !== filters.subject
    )
      return false;
    if (filters.grade !== "all" && lessonPlan.grade !== filters.grade)
      return false;
    if (filters.status !== "all" && lessonPlan.status !== filters.status)
      return false;
    return true;
  });

  const filteredRecordsOfWork = recordsOfWork.filter((record) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        record.learning_area?.toLowerCase().includes(query) ||
        record.grade?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (filters.subject !== "all" && record.learning_area !== filters.subject)
      return false;
    if (filters.grade !== "all" && record.grade !== filters.grade) return false;
    if (filters.term !== "all" && record.term !== filters.term) return false;
    if (filters.year !== "all" && record.year?.toString() !== filters.year)
      return false;
    return true;
  });

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Premium Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/20 rounded-full blur-[128px] animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-[128px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-pink-400/20 rounded-full blur-[128px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Premium Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <FiFileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
              Professional Records
            </h1>
          </div>
          <p className="text-lg text-gray-600 ml-15">
            Manage your schemes of work, lesson plans, and teaching documentation
          </p>
        </div>

        {/* Premium Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:border-indigo-200 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <FiBookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {stats.totalSchemes}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600">Total Schemes</div>
          </div>

          <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:border-green-200 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <FiCheckSquare className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {stats.activeSchemes}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600">Active Schemes</div>
          </div>

          <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:border-purple-200 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <FiFileText className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {stats.totalLessonPlans}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600">Lesson Plans</div>
          </div>

          <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:border-emerald-200 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <FiUsers className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {stats.taughtLessons}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600">Taught Lessons</div>
          </div>

          <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:border-orange-200 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <FiClock className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                {stats.recordsThisWeek}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600">This Week</div>
          </div>

          <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:border-blue-200 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <FiTrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {stats.completionRate}%
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600">Completion Rate</div>
          </div>
        </div>

        {/* Charts Section */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Weekly Activity Chart */}
            <div className="glass-card bg-white/60 backdrop-blur-xl rounded-xl shadow-lg border border-white/60 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Weekly Teaching Activity
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.weekly_activity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="lessons"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                      name="Lessons Taught"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject Progress */}
            <div className="glass-card bg-white/60 backdrop-blur-xl rounded-xl shadow-lg border border-white/60 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Subject Progress
              </h3>
              <div className="space-y-4 overflow-y-auto h-64 pr-2 custom-scrollbar">
                {dashboardData.subject_progress.map(
                  (subject: any, index: number) => (
                    <div key={index} className="bg-white/50 p-3 rounded-lg">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-gray-800">
                          {subject.subject} ({subject.grade})
                        </span>
                        <span className="text-indigo-600 font-bold">
                          {subject.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${subject.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {subject.completed} / {subject.total} lessons completed
                      </div>
                    </div>
                  )
                )}
                {dashboardData.subject_progress.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <FiBookOpen className="w-8 h-8 mb-2 opacity-50" />
                    <p>No active schemes to track.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="glass-card bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-2 flex-1">
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

          <div className="glass-card bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-2 flex items-center justify-center gap-3 px-6">
            <span
              className={`text-sm font-bold ${
                !showArchived ? "text-indigo-600" : "text-gray-500"
              }`}
            >
              Active
            </span>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 flex items-center ${
                showArchived ? "bg-indigo-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                  showArchived ? "translate-x-6" : ""
                }`}
              />
            </button>
            <span
              className={`text-sm font-bold ${
                showArchived ? "text-indigo-600" : "text-gray-500"
              }`}
            >
              Archived
            </span>
          </div>
        </div>

        {/* Schemes of Work Tab */}
        {activeTab === "schemes" && (
          <div className="glass-card bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Schemes of Work
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport("schemes")}
                  className="bg-white text-indigo-600 border border-indigo-200 px-4 py-3 rounded-xl font-bold shadow-sm hover:bg-indigo-50 flex items-center gap-2 transition-all duration-300"
                >
                  <FiDownload className="w-5 h-5" />
                  Export
                </button>
                <Link
                  href="/professional-records/generate-scheme"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300"
                >
                  <FiPlus className="w-5 h-5" />
                  Create New Scheme
                </Link>
              </div>
            </div>

            {/* Filters */}
            {schemes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 p-4 bg-white/40 rounded-xl">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search schemes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filters.subject}
                  onChange={(e) =>
                    setFilters({ ...filters, subject: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Subjects</option>
                  {getUniqueSubjects().map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.grade}
                  onChange={(e) =>
                    setFilters({ ...filters, grade: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Grades</option>
                  {getUniqueGrades().map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.term}
                  onChange={(e) =>
                    setFilters({ ...filters, term: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Terms</option>
                  {getUniqueTerms().map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.year}
                  onChange={(e) =>
                    setFilters({ ...filters, year: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Years</option>
                  {getUniqueYears().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}

            {filteredSchemes.length === 0 && schemes.length > 0 ? (
              <div className="text-center py-12">
                <FiBookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Schemes Match Your Filters
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters to see more results.
                </p>
                <button
                  onClick={() =>
                    setFilters({
                      subject: "all",
                      grade: "all",
                      term: "all",
                      year: "all",
                      status: "all",
                    })
                  }
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all duration-300"
                >
                  Clear Filters
                </button>
              </div>
            ) : schemes.length === 0 ? (
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
                {filteredSchemes.map((scheme) => {
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
                          <button
                            onClick={() => handleShare("schemes", scheme.id)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                            title="Share"
                          >
                            <FiShare2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDuplicate("schemes", scheme.id)
                            }
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                            title="Duplicate"
                          >
                            <FiCopy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              showArchived
                                ? handleUnarchive("scheme", scheme.id)
                                : handleArchive("scheme", scheme.id)
                            }
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                            title={showArchived ? "Unarchive" : "Archive"}
                          >
                            <FiArchive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleShare("schemes", scheme.id)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                            title="Share"
                          >
                            <FiShare2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDuplicate("schemes", scheme.id)
                            }
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                            title="Duplicate"
                          >
                            <FiCopy className="w-4 h-4" />
                          </button>
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
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Lesson Plans
                </h2>
                {lessonPlans.length > 0 && (
                  <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={
                        selectedPlans.length === lessonPlans.length &&
                        lessonPlans.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Select All
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {selectedPlans.length > 0 && (
                  <>
                    <button
                      onClick={handleBulkPrint}
                      className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 flex items-center gap-2 transition-all duration-300"
                    >
                      <FiDownload className="w-5 h-5" />
                      Print ({selectedPlans.length})
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="bg-red-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg hover:bg-red-700 flex items-center gap-2 transition-all duration-300"
                    >
                      <FiTrash2 className="w-5 h-5" />
                      Delete ({selectedPlans.length})
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleExport("lessons")}
                  className="bg-white text-emerald-600 border border-emerald-200 px-4 py-3 rounded-xl font-bold shadow-sm hover:bg-emerald-50 flex items-center gap-2 transition-all duration-300"
                >
                  <FiDownload className="w-5 h-5" />
                  Export
                </button>
                <Link
                  href="/professional-records/create-lesson-plan"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300"
                >
                  <FiPlus className="w-5 h-5" />
                  Create Lesson Plan
                </Link>
              </div>
            </div>

            {/* Filters for Lesson Plans */}
            {lessonPlans.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 p-4 bg-white/40 rounded-xl">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search lessons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filters.subject}
                  onChange={(e) =>
                    setFilters({ ...filters, subject: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Subjects</option>
                  {getUniqueSubjects().map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.grade}
                  onChange={(e) =>
                    setFilters({ ...filters, grade: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Grades</option>
                  {getUniqueGrades().map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="taught">Taught</option>
                  <option value="postponed">Postponed</option>
                </select>

                <button
                  onClick={() =>
                    setFilters({
                      subject: "all",
                      grade: "all",
                      term: "all",
                      year: "all",
                      status: "all",
                    })
                  }
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {filteredLessonPlans.length === 0 && lessonPlans.length > 0 ? (
              <div className="text-center py-12">
                <FiFileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Lesson Plans Match Your Filters
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters to see more results.
                </p>
                <button
                  onClick={() =>
                    setFilters({
                      subject: "all",
                      grade: "all",
                      term: "all",
                      year: "all",
                      status: "all",
                    })
                  }
                  className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all duration-300"
                >
                  Clear Filters
                </button>
              </div>
            ) : lessonPlans.length === 0 ? (
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
                {filteredLessonPlans.map((lessonPlan) => {
                  const statusColors = {
                    pending: "bg-yellow-100 text-yellow-800",
                    taught: "bg-green-100 text-green-800",
                    postponed: "bg-red-100 text-red-800",
                  };

                  return (
                    <div
                      key={lessonPlan.id}
                      className={`glass-card bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border ${
                        selectedPlans.includes(lessonPlan.id)
                          ? "border-indigo-500 ring-2 ring-indigo-500"
                          : "border-white/60"
                      } hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden relative`}
                    >
                      {/* Selection Checkbox */}
                      <div className="absolute top-4 right-4 z-10">
                        <input
                          type="checkbox"
                          checked={selectedPlans.includes(lessonPlan.id)}
                          onChange={() => toggleSelection(lessonPlan.id)}
                          className="w-6 h-6 rounded border-white text-indigo-600 focus:ring-indigo-500 shadow-sm cursor-pointer"
                        />
                      </div>

                      {/* Header */}
                      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-4xl">📝</div>
                          <span className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold">
                            {lessonPlan.grade}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-2 break-words pr-8">
                          {lessonPlan.learning_area}
                        </h3>
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-2">
                            <FiCalendar className="w-4 h-4" />
                            <span>{lessonPlan.date || "No date set"}</span>
                          </div>
                          {(lessonPlan.week_number ||
                            lessonPlan.lesson_number) && (
                            <div className="flex items-center gap-2 bg-white/20 px-2 py-1 rounded w-fit mt-1">
                              <span className="font-semibold">
                                {lessonPlan.week_number
                                  ? `Week ${lessonPlan.week_number}`
                                  : ""}
                                {lessonPlan.week_number &&
                                lessonPlan.lesson_number
                                  ? " • "
                                  : ""}
                                {lessonPlan.lesson_number
                                  ? `Lesson ${lessonPlan.lesson_number}`
                                  : ""}
                              </span>
                            </div>
                          )}
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
                          <button
                            onClick={() =>
                              handleShare("lesson-plans", lessonPlan.id)
                            }
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                            title="Share"
                          >
                            <FiShare2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDuplicate("lesson-plans", lessonPlan.id)
                            }
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                            title="Duplicate"
                          >
                            <FiCopy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              showArchived
                                ? handleUnarchive("lesson", lessonPlan.id)
                                : handleArchive("lesson", lessonPlan.id)
                            }
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                            title={showArchived ? "Unarchive" : "Archive"}
                          >
                            <FiArchive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleShare("lesson-plans", lessonPlan.id)
                            }
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                            title="Share"
                          >
                            <FiShare2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDuplicate("lesson-plans", lessonPlan.id)
                            }
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                            title="Duplicate"
                          >
                            <FiCopy className="w-4 h-4" />
                          </button>
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
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Records of Work Covered
                </h2>
                {recordsOfWork.length > 0 && (
                  <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={
                        selectedRecords.length ===
                          filteredRecordsOfWork.length &&
                        filteredRecordsOfWork.length > 0
                      }
                      onChange={toggleSelectAllRecords}
                      className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Select All
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {selectedRecords.length > 0 && (
                  <button
                    onClick={handleBulkDeleteRecords}
                    className="bg-red-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg hover:bg-red-700 flex items-center gap-2 transition-all duration-300"
                  >
                    <FiTrash2 className="w-5 h-5" />
                    Delete ({selectedRecords.length})
                  </button>
                )}
                <button
                  onClick={() => handleExport("records")}
                  className="bg-white text-green-600 border border-green-200 px-4 py-3 rounded-xl font-bold shadow-sm hover:bg-green-50 flex items-center gap-2 transition-all duration-300"
                >
                  <FiDownload className="w-5 h-5" />
                  Export
                </button>
                <Link
                  href="/professional-records/record-of-work/create"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300"
                >
                  <FiPlus className="w-5 h-5" />
                  Create Record
                </Link>
              </div>
            </div>

            {/* Filters for Records of Work */}
            {recordsOfWork.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 p-4 bg-white/40 rounded-xl">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filters.subject}
                  onChange={(e) =>
                    setFilters({ ...filters, subject: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Subjects</option>
                  {getUniqueSubjects().map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.grade}
                  onChange={(e) =>
                    setFilters({ ...filters, grade: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Grades</option>
                  {getUniqueGrades().map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.term}
                  onChange={(e) =>
                    setFilters({ ...filters, term: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Terms</option>
                  {getUniqueTerms().map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.year}
                  onChange={(e) =>
                    setFilters({ ...filters, year: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Years</option>
                  {getUniqueYears().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filteredRecordsOfWork.length === 0 && recordsOfWork.length > 0 ? (
              <div className="text-center py-12">
                <FiCheckSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Records Match Your Filters
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters to see more results.
                </p>
                <button
                  onClick={() =>
                    setFilters({
                      subject: "all",
                      grade: "all",
                      term: "all",
                      year: "all",
                      status: "all",
                    })
                  }
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all duration-300"
                >
                  Clear Filters
                </button>
              </div>
            ) : recordsOfWork.length === 0 ? (
              <div className="text-center py-12">
                <FiCheckSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Records Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start teaching lessons and record your progress here.
                </p>
                <Link
                  href="/professional-records/record-of-work/create"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <FiPlus className="w-5 h-5" />
                  Create Record
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecordsOfWork.map((record) => {
                  const theme = getSubjectTheme(record.learning_area);
                  const isSelected = selectedRecords.includes(record.id);
                  return (
                    <div
                      key={record.id}
                      className={`glass-card bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden relative ${
                        isSelected
                          ? "border-green-500 ring-2 ring-green-500"
                          : "border-white/60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRecordSelection(record.id)}
                        className="absolute top-4 right-4 z-10 w-6 h-6 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer bg-white shadow-lg"
                      />
                      <div
                        className={`bg-gradient-to-br ${theme.gradient} p-6 text-white`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-4xl">{theme.icon}</div>
                          <span className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                            {record.grade}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-2 break-words">
                          {record.learning_area}
                        </h3>
                        <div className="flex items-center gap-2 text-sm">
                          <FiCalendar className="w-4 h-4" />
                          <span>
                            {record.term} • {record.year}
                          </span>
                        </div>
                      </div>
                      <div className="p-6 flex-1 flex flex-col bg-white">
                        <div className="flex gap-2 mt-auto">
                          <Link
                            href={`/professional-records/record-of-work/${record.id}`}
                            className={`flex-1 bg-gradient-to-r ${theme.gradient} text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm hover:shadow-lg`}
                          >
                            <FiEye className="w-4 h-4" />
                            View & Edit
                          </Link>
                          <button
                            onClick={() =>
                              handleShare("records-of-work", record.id)
                            }
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                            title="Share"
                          >
                            <FiShare2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              showArchived
                                ? handleUnarchive("record", record.id)
                                : handleArchive("record", record.id)
                            }
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                            title={showArchived ? "Unarchive" : "Archive"}
                          >
                            <FiArchive className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
