"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomAuth } from "@/hooks/useCustomAuth";
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
  FiLock,
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
import { getCachedData, setCachedData, CACHE_KEYS } from "@/lib/dataCache";

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
  // API may return either subject_name or subject
  subject_name?: string;
  subject?: string;
  grade: string;
  // API returns term/year, but older UI expected term_number/term_year
  term?: string;
  year?: number;
  term_number?: number;
  term_year?: number;
  total_weeks: number;
  total_lessons: number;
  status?: "draft" | "active" | "completed";
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  teacher_name?: string; // Added for Admin view
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
  const { user, isAuthenticated, loading: authLoading } = useCustomAuth();

  const isPremium =
    user?.subscription_type === "INDIVIDUAL_PREMIUM" ||
    user?.subscription_type === "SCHOOL_SPONSORED" ||
    !!user?.school_id ||
    user?.role === "SUPER_ADMIN";

  // Get cached data for instant load
  const cachedSubjects = getCachedData<Subject[]>(CACHE_KEYS.SUBJECTS);
  const cachedSchemes = getCachedData<SchemeOfWork[]>(CACHE_KEYS.SCHEMES);
  const cachedLessonPlans = getCachedData<LessonPlan[]>(CACHE_KEYS.LESSON_PLANS);
  const cachedRecords = getCachedData<RecordOfWork[]>(CACHE_KEYS.RECORDS_OF_WORK);
  
  const hasCache = !!(cachedSubjects || cachedSchemes || cachedLessonPlans || cachedRecords);

  const [loading, setLoading] = useState(!hasCache);
  const [subjects, setSubjects] = useState<Subject[]>(cachedSubjects || []);
  const [activeTab, setActiveTab] = useState<"schemes" | "lessons" | "records">(
    "schemes"
  );
  const [showArchived, setShowArchived] = useState(false);

  // Data states - initialize from cache
  const [schemes, setSchemes] = useState<SchemeOfWork[]>(cachedSchemes || []);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>(cachedLessonPlans || []);
  const [recordsOfWork, setRecordsOfWork] = useState<RecordOfWork[]>(cachedRecords || []);
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
    if (!authLoading && isAuthenticated) {
      // If we have cached data, do background refresh; otherwise show loading
      fetchData(hasCache);
    }
  }, [showArchived, authLoading, isAuthenticated]);

  const fetchData = async (isBackgroundRefresh = false) => {
    // Avoid firing requests before auth state is known.
    if (authLoading || !isAuthenticated) return;
    if (!isBackgroundRefresh) {
      setLoading(true);
    }
    try {
      const config = { withCredentials: true };
      const archivedQuery = showArchived ? "?archived=true" : "";

      const [subjectsRes, schemesRes, statsRes, lessonPlansRes, recordsRes] =
        await Promise.allSettled([
          axios.get("/api/v1/subjects", config),
          axios.get(`/api/v1/schemes${archivedQuery}`, config),
          axios.get("/api/v1/schemes/stats", config),
          axios.get(`/api/v1/lesson-plans${archivedQuery}`, config),
          axios.get(`/api/v1/records-of-work${archivedQuery}`, config),
        ]);

      if (subjectsRes.status === "fulfilled") {
        setSubjects(subjectsRes.value.data);
        if (!showArchived)
          setCachedData(CACHE_KEYS.SUBJECTS, subjectsRes.value.data);
      } else {
        throw subjectsRes.reason;
      }

      if (schemesRes.status !== "fulfilled") {
        throw schemesRes.reason;
      }
      const parseTermNumber = (termValue: unknown): number | undefined => {
        if (!termValue) return undefined;
        const match = String(termValue).match(/(\d+)/);
        if (!match) return undefined;
        const parsed = Number(match[1]);
        return Number.isFinite(parsed) ? parsed : undefined;
      };

      const rawSchemes = Array.isArray(schemesRes.value.data)
        ? schemesRes.value.data
        : schemesRes.value.data?.items || [];

      const normalizedSchemes: SchemeOfWork[] = rawSchemes.map((s: any) => {
        const subject_name = s.subject_name ?? s.subject;
        const term =
          s.term ??
          (s.term_number != null ? `Term ${s.term_number}` : undefined);
        const year = s.year ?? s.term_year;

        // If status is missing, assume active. If status is draft (old default), treat as active for display.
        const normalizedStatus =
          (s.status === "draft" ? "active" : s.status) ?? "active";

        return {
          ...s,
          subject_name,
          term,
          year,
          term_number: s.term_number ?? parseTermNumber(term),
          term_year: s.term_year ?? year,
          status: normalizedStatus,
        };
      });

      setSchemes(normalizedSchemes);
      if (!showArchived) setCachedData(CACHE_KEYS.SCHEMES, normalizedSchemes);

      // Fetch dashboard stats and charts data
      try {
        const [progressRes, insightsRes] = await Promise.all([
          axios.get("/api/v1/dashboard/curriculum-progress", config),
          axios.get("/api/v1/dashboard/insights", config),
        ]);

        // Process progress data
        const subjectsList = Array.isArray(progressRes.data)
          ? progressRes.data
          : progressRes.data.subjects || [];

        const subjectProgress = subjectsList.map((s: any) => ({
          subject: s.subject_name,
          grade: s.grade,
          progress: s.progress_percentage,
        }));

        // Process weekly activity
        const weeklyActivity = (insightsRes.data.weeklyComparison || []).map(
          (w: any) => ({
            name: w.week,
            lessons: w.lessons,
          })
        );

        setDashboardData({
          weekly_activity: weeklyActivity,
          subject_progress: subjectProgress,
        });
      } catch (error) {
        console.log("Dashboard charts data not available", error);
        // Keep default empty state but ensure structure exists
        setDashboardData((prev) => ({
          ...prev,
          subject_progress: prev.subject_progress || [],
          weekly_activity: prev.weekly_activity || [],
        }));
      }

      const fetchedLessonPlans =
        lessonPlansRes.status === "fulfilled" ? lessonPlansRes.value.data : [];
      const fetchedRecords =
        recordsRes.status === "fulfilled" ? recordsRes.value.data : [];

      if (lessonPlansRes.status !== "fulfilled") {
        console.log("Lesson plans not available yet");
      }
      if (recordsRes.status !== "fulfilled") {
        console.log("Records of work not available yet");
      }

      setLessonPlans(fetchedLessonPlans);
      if (!showArchived)
        setCachedData(CACHE_KEYS.LESSON_PLANS, fetchedLessonPlans);

      setRecordsOfWork(fetchedRecords);
      if (!showArchived)
        setCachedData(CACHE_KEYS.RECORDS_OF_WORK, fetchedRecords);

      // Calculate stats
      const statsData =
        statsRes.status === "fulfilled" ? statsRes.value.data : {};
      setStats({
        totalSchemes: statsData.total_schemes || 0,
        activeSchemes: statsData.active_schemes || 0,
        totalLessonPlans: fetchedLessonPlans.length || 0,
        taughtLessons:
          fetchedLessonPlans.filter((lp: any) => lp.status === "taught")
            .length || 0,
        recordsThisWeek: 0,
        completionRate: statsData.active_schemes
          ? Math.round(
              (statsData.completed_schemes / statsData.total_schemes) * 100
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
      await axios.post("/api/v1/lesson-plans/bulk-delete", selectedPlans, {
        withCredentials: true,
      });
      toast.success("Lesson plans deleted successfully");
      setSelectedPlans([]);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Failed to delete lesson plans:", error);
      toast.error("Failed to delete lesson plans");
    }
  };

  const handleBulkDownload = async () => {
    if (selectedPlans.length === 0) {
      toast.error("Please select at least one lesson plan to download");
      return;
    }

    if (!isPremium) {
      toast.error("Bulk download is a Premium feature");
      return;
    }

    const toastId = toast.loading("Generating PDF bundle...");
    try {
      const response = await axios.post(
        "/api/v1/lesson-plans/bulk-download", 
        selectedPlans, 
        { 
          withCredentials: true,
          responseType: 'blob'
        }
      );
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Get filename from header if possible, or default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'LessonPlans_Bundle.pdf';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=(.+)/);
        if (match && match[1]) filename = match[1].replace(/["']/g, "");
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("PDF bundle downloaded successfully!", { id: toastId });
      setSelectedPlans([]);
    } catch (error: any) {
      console.error("Bulk download failed:", error);
      const msg = error.response?.data?.detail || "Failed to download PDF bundle";
      toast.error(msg, { id: toastId });
    }
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
      // Delete each record individually
      await Promise.all(
        selectedRecords.map((id) =>
          axios.delete(`/api/v1/records-of-work/${id}`, {
            withCredentials: true,
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
    if (!isPremium) {
      toast.error("Export is available on Premium plans only.");
      return;
    }

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
      let endpoint = "";
      if (type === "scheme") endpoint = `/api/v1/schemes/${id}/archive`;
      else if (type === "lesson")
        endpoint = `/api/v1/lesson-plans/${id}/archive`;
      else if (type === "record")
        endpoint = `/api/v1/records-of-work/${id}/archive`;

      await axios.post(endpoint, {}, { withCredentials: true });
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
      let endpoint = "";
      if (type === "scheme") endpoint = `/api/v1/schemes/${id}/unarchive`;
      else if (type === "lesson")
        endpoint = `/api/v1/lesson-plans/${id}/unarchive`;
      else if (type === "record")
        endpoint = `/api/v1/records-of-work/${id}/unarchive`;

      await axios.post(endpoint, {}, { withCredentials: true });
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
      const res = await axios.post(
        `/api/v1/${type}/${id}/share`,
        {},
        { withCredentials: true }
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
      await axios.post(
        `/api/v1/${type}/${id}/duplicate`,
        {},
        { withCredentials: true }
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
    const schemesSubjects = schemes
      .map((s) => s.subject_name || s.subject)
      .filter(Boolean);
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
      .map(
        (s) =>
          s.term ||
          (s.term_number != null ? `Term ${s.term_number}` : undefined)
      )
      .filter(Boolean);
    const recordTerms = recordsOfWork.map((r) => r.term).filter(Boolean);
    return Array.from(new Set([...schemesTerms, ...recordTerms])).sort();
  };

  const getUniqueYears = () => {
    const schemesYears = schemes
      .map((s) => s.year ?? s.term_year)
      .filter((y) => y != null)
      .map((y) => String(y));
    const recordYears = recordsOfWork
      .filter((r) => r.year != null)
      .map((r) => r.year.toString());
    return Array.from(new Set([...schemesYears, ...recordYears])).sort(
      (a, b) => Number(b) - Number(a)
    );
  };

  // Apply filters
  const filteredSchemes = schemes.filter((scheme) => {
    const schemeSubject = scheme.subject_name || scheme.subject || "";
    const schemeTerm =
      scheme.term ||
      (scheme.term_number != null ? `Term ${scheme.term_number}` : "");
    const schemeYear = String(scheme.year ?? scheme.term_year ?? "");
    const schemeStatus = (scheme.status || "active") as
      | "draft"
      | "active"
      | "completed";

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        schemeSubject.toLowerCase().includes(query) ||
        scheme.grade?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (filters.subject !== "all" && schemeSubject !== filters.subject)
      return false;
    if (filters.grade !== "all" && scheme.grade !== filters.grade) return false;
    if (filters.term !== "all" && schemeTerm !== filters.term) return false;
    if (filters.year !== "all" && schemeYear !== filters.year) return false;
    if (filters.status !== "all" && schemeStatus !== filters.status)
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
    <div className="min-h-screen bg-gray-50 relative overflow-hidden pt-24">
      {/* Premium Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/20 rounded-full blur-[128px] animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-[128px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-pink-400/20 rounded-full blur-[128px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
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
            Manage your schemes of work, lesson plans, and teaching
            documentation
          </p>
        </div>

        {/* Free Plan Banner */}
        {!isPremium && (
          <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <FiLock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Preview Mode Active
                  </h3>
                  <p className="text-gray-600 max-w-xl">
                    You are viewing Professional Records in preview mode.
                    Upgrade to Premium to unlock full access, including PDF
                    downloads, printing, and editing capabilities.
                  </p>
                </div>
              </div>
              <Link
                href="/pricing"
                className="whitespace-nowrap px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-lg shadow-lg shadow-orange-200 transition-all transform hover:-translate-y-0.5"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        )}

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
            <div className="text-sm font-medium text-gray-600">
              Total Schemes
            </div>
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
            <div className="text-sm font-medium text-gray-600">
              Active Schemes
            </div>
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
            <div className="text-sm font-medium text-gray-600">
              Lesson Plans
            </div>
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
            <div className="text-sm font-medium text-gray-600">
              Taught Lessons
            </div>
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
            <div className="text-sm font-medium text-gray-600">
              Completion Rate
            </div>
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
                {dashboardData.subject_progress?.map(
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
                className={`flex-1 px-3 sm:px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base ${
                  activeTab === "schemes"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                    : "text-gray-700 hover:bg-white/60"
                }`}
              >
                <FiBookOpen className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Schemes of Work</span>
                <span className="sm:hidden">Schemes</span>
              </button>
              <button
                onClick={() => setActiveTab("lessons")}
                className={`flex-1 px-3 sm:px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base ${
                  activeTab === "lessons"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                    : "text-gray-700 hover:bg-white/60"
                }`}
              >
                <FiFileText className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Lesson Plans</span>
                <span className="sm:hidden">Lessons</span>
              </button>
              <button
                onClick={() => setActiveTab("records")}
                className={`flex-1 px-3 sm:px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base ${
                  activeTab === "records"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                    : "text-gray-700 hover:bg-white/60"
                }`}
              >
                <FiCheckSquare className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Records of Work</span>
                <span className="sm:hidden">Records</span>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Schemes of Work
              </h2>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleExport("schemes")}
                  disabled={!isPremium}
                  className={`bg-white text-indigo-600 border border-indigo-200 px-4 py-3 rounded-xl font-bold shadow-sm hover:bg-indigo-50 flex items-center justify-center gap-2 transition-all duration-300 text-sm sm:text-base ${
                    !isPremium ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  title={!isPremium ? "Upgrade to export" : "Export"}
                >
                  <FiDownload className="w-4 h-4 sm:w-5 sm:h-5" />
                  Export
                </button>
                <Link
                  href="/professional-records/generate-scheme"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 sm:px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all duration-300 text-sm sm:text-base"
                >
                  <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Create New Scheme</span>
                  <span className="sm:hidden">New Scheme</span>
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
                  const subjectDisplay =
                    scheme.subject_name || scheme.subject || "Unknown Subject";
                  const theme = getSubjectTheme(subjectDisplay);
                  const termDisplay =
                    scheme.term ||
                    (scheme.term_number != null
                      ? `Term ${scheme.term_number}`
                      : "Term");
                  const yearDisplay = scheme.year ?? scheme.term_year;
                  const termLabel = yearDisplay
                    ? `${termDisplay} • ${yearDisplay}`
                    : termDisplay;
                  const status = (scheme.status || "active") as
                    | "draft"
                    | "active"
                    | "completed";
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
                          {subjectDisplay}
                        </h3>
                        <div className="flex items-center gap-2 text-sm">
                          <FiCalendar className="w-4 h-4" />
                          <span>{termLabel}</span>
                        </div>
                        {scheme.teacher_name && (
                          <div className="flex items-center gap-2 text-sm mt-1 opacity-90">
                            <FiUsers className="w-4 h-4" />
                            <span>{scheme.teacher_name}</span>
                          </div>
                        )}
                      </div>

                      {/* White Body */}
                      <div className="p-6 flex-1 flex flex-col bg-white">
                        <div className="mb-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[status]}`}
                          >
                            {status.toUpperCase()}
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
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
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

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
                {selectedPlans.length > 0 && (
                  <>
                    <button
                      onClick={handleBulkDownload}
                      className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-all duration-300 text-sm sm:text-base"
                    >
                      <FiDownload className="w-4 h-4 sm:w-5 sm:h-5" />
                      Download PDF ({selectedPlans.length})
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="bg-red-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg hover:bg-red-700 flex items-center justify-center gap-2 transition-all duration-300 text-sm sm:text-base"
                    >
                      <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      Delete ({selectedPlans.length})
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleExport("lessons")}
                  disabled={!isPremium}
                  className={`bg-white text-emerald-600 border border-emerald-200 px-4 py-3 rounded-xl font-bold shadow-sm hover:bg-emerald-50 flex items-center justify-center gap-2 transition-all duration-300 text-sm sm:text-base ${
                    !isPremium ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  title={!isPremium ? "Upgrade to export" : "Export"}
                >
                  <FiDownload className="w-4 h-4 sm:w-5 sm:h-5" />
                  Export
                </button>
                <Link
                  href="/professional-records/create-lesson-plan"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 sm:px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all duration-300 text-sm sm:text-base"
                >
                  <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Create Lesson Plan</span>
                  <span className="sm:hidden">New Plan</span>
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
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
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

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
                {selectedRecords.length > 0 && (
                  <button
                    onClick={handleBulkDeleteRecords}
                    className="bg-red-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg hover:bg-red-700 flex items-center justify-center gap-2 transition-all duration-300 text-sm sm:text-base"
                  >
                    <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    Delete ({selectedRecords.length})
                  </button>
                )}
                <button
                  onClick={() => handleExport("records")}
                  disabled={!isPremium}
                  className={`bg-white text-green-600 border border-green-200 px-4 py-3 rounded-xl font-bold shadow-sm hover:bg-green-50 flex items-center justify-center gap-2 transition-all duration-300 text-sm sm:text-base ${
                    !isPremium ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  title={!isPremium ? "Upgrade to export" : "Export"}
                >
                  <FiDownload className="w-4 h-4 sm:w-5 sm:h-5" />
                  Export
                </button>
                <Link
                  href="/professional-records/record-of-work/create"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all duration-300 text-sm sm:text-base"
                >
                  <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Create Record</span>
                  <span className="sm:hidden">New Record</span>
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
                          <button
                            onClick={() => handleExport("records")}
                            disabled={!isPremium}
                            className={`bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm ${
                              !isPremium ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            title={
                              !isPremium
                                ? "Upgrade to download"
                                : "Download Record"
                            }
                          >
                            <FiDownload className="w-4 h-4" />
                          </button>
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
