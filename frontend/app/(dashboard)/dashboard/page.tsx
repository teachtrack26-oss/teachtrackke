"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiPlus,
  FiBook,
  FiUpload,
  FiClock,
  FiCalendar,
  FiMapPin,
  FiTarget,
  FiLayers,
  FiCheckCircle,
  FiLink,
  FiHeart,
  FiZap,
  FiUsers,
  FiChevronDown,
  FiChevronUp,
  FiTrendingUp,
  FiActivity,
  FiEdit3,
  FiFileText,
  FiUserCheck,
  FiAward,
  FiBell,
  FiChevronLeft,
  FiChevronRight,
  FiSettings,
  FiX,
  FiEye,
  FiEyeOff,
  FiMove,
  FiBarChart2,
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  NotificationsDropdown,
  TrendGraph,
  AttendanceWidget,
  CustomizationPanel,
  CurriculumProgressTracker,
  UpcomingDeadlinesWidget,
  TeachingInsightsWidget,
  ResourceCenterWidget,
  PerformanceSummaryCards,
} from "../dashboard-components";
import type {
  Notification,
  AttendanceEntry,
  WidgetPreferences,
  SubjectProgress,
  DeadlineItem,
  TeachingInsight,
  ResourceItem,
  PerformanceSummary,
} from "../dashboard-components";
import SchoolAdminDashboard from "@/components/dashboard/SchoolAdminDashboard";
import SuperAdminDashboard from "@/components/dashboard/SuperAdminDashboard";
import { useCustomAuth } from "@/hooks/useCustomAuth";

// Force use of Next.js Proxy for client-side requests to ensure cookies are sent correctly
// and to avoid CORS issues when accessing from different devices (e.g. 10.2.0.2)
const API_BASE_URL = "/api/v1";

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

interface TimetableEntry {
  id: number;
  subject_id: number;
  time_slot_id: number;
  day_of_week: number;
  room_number: string;
  grade_section: string;
  notes: string;
  is_double_lesson: boolean;
}

interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  slot_type: string;
  label?: string;
}

interface CurriculumDetails {
  strand: {
    strand_number: string;
    strand_name: string;
  };
  substrand: {
    substrand_number: string;
    substrand_name: string;
    specific_learning_outcomes: string[];
    key_inquiry_questions: string[];
    learning_experiences: string[];
    core_competencies: string[];
    values: string[];
    pertinent_issues: string[];
    links_to_other_subjects: string[];
  };
}

export default function DashboardPage() {
  const {
    user: authUser,
    loading: authLoading,
    isAuthenticated,
  } = useCustomAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [todayLessons, setTodayLessons] = useState<TimetableEntry[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [curriculumDetails, setCurriculumDetails] = useState<{
    [key: number]: CurriculumDetails;
  }>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  const [educationLevel, setEducationLevel] = useState<string>("");
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [weeklyEntries, setWeeklyEntries] = useState<TimetableEntry[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({
    lessonsThisWeek: 0,
    lessonsTaught: 0,
    lessonPlansCreated: 0,
    progressPercentage: 0,
  });

  // Advanced features state
  const [weekOffset, setWeekOffset] = useState(0); // For week navigation
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceEntry[]>([]);
  const [widgetPreferences, setWidgetPreferences] = useState<WidgetPreferences>(
    {
      weeklyCalendar: true,
      quickStats: true,
      quickActions: true,
      trendGraph: true,
      attendance: true,
      notifications: true,
      curriculumProgress: true,
      upcomingDeadlines: true,
      teachingInsights: true,
      resourceCenter: true,
      performanceSummary: true,
    }
  );
  const [showCustomization, setShowCustomization] = useState(false);
  const [draggedLesson, setDraggedLesson] = useState<TimetableEntry | null>(
    null
  );

  // New widgets state
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [teachingInsights, setTeachingInsights] = useState<TeachingInsight>({
    mostTaughtSubjects: [],
    averageLessonDuration: 0,
    peakTeachingHours: [],
    weeklyComparison: [],
  });
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [performanceSummary, setPerformanceSummary] =
    useState<PerformanceSummary>({
      lessonsCompleted: 0,
      totalLessons: 0,
      attendanceAverage: 0,
      assessmentsCreated: 0,
    });

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated && authUser) {
      setUser(authUser);
      fetchSubjects();
    }
  }, [authUser, isAuthenticated, authLoading]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Swipe gesture detection for mobile
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeThreshold = 50;
      if (touchStartX - touchEndX > swipeThreshold) {
        // Swipe left - next week
        setWeekOffset((prev) => prev + 1);
      } else if (touchEndX - touchStartX > swipeThreshold) {
        // Swipe right - previous week
        setWeekOffset((prev) => Math.max(-4, prev - 1)); // Limit to 4 weeks back
      }
    };

    const calendarElement = document.getElementById("weekly-calendar");
    if (calendarElement) {
      calendarElement.addEventListener("touchstart", handleTouchStart);
      calendarElement.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      if (calendarElement) {
        calendarElement.removeEventListener("touchstart", handleTouchStart);
        calendarElement.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, []);

  // Load widget preferences from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem("dashboardWidgets");
    if (savedPrefs) {
      setWidgetPreferences(JSON.parse(savedPrefs));
    }
  }, []);

  // Initialize mock data for new features
  useEffect(() => {
    // Mock notifications
    setNotifications([
      {
        id: 1,
        title: "Scheme of Work Due",
        message: "Term 3 scheme due on December 5th",
        type: "deadline",
        date: new Date("2025-12-05"),
        read: false,
      },
      {
        id: 2,
        title: "Assessment Period",
        message: "End-of-term assessments: Dec 10-14",
        type: "reminder",
        date: new Date("2025-12-10"),
        read: false,
      },
      {
        id: 3,
        title: "Progress Reports",
        message: "Submit progress reports by Dec 20th",
        type: "deadline",
        date: new Date("2025-12-20"),
        read: true,
      },
    ]);

    // Mock trend data (last 4 weeks)
    setTrendData([
      { week: "Week 1", lessons: 12, completed: 10 },
      { week: "Week 2", lessons: 15, completed: 14 },
      { week: "Week 3", lessons: 13, completed: 11 },
      { week: "This Week", lessons: 15, completed: 12 },
    ]);

    // Mock attendance data for today
    setAttendanceData([
      {
        lessonId: 1,
        subjectName: "Mathematics",
        gradeSection: "Grade 7A",
        timeSlot: "08:00 - 09:00",
        totalStudents: 35,
        presentStudents: 0,
      },
      {
        lessonId: 2,
        subjectName: "English",
        gradeSection: "Grade 7B",
        timeSlot: "10:00 - 11:00",
        totalStudents: 32,
        presentStudents: 0,
      },
    ]);

    // Fetch real dashboard data
    const fetchDashboardData = async () => {
      // We don't need token from localStorage anymore
      // const token = localStorage.getItem("accessToken");
      // if (!token) return;

      try {
        const config = { withCredentials: true };

        // 1. Curriculum Progress
        const progressRes = await axios.get(
          `${API_BASE_URL}/dashboard/curriculum-progress`,
          config
        );

        // Transform to match SubjectProgress interface
        // Backend returns { subjects: [...], overview: {...} }
        const subjectsList = Array.isArray(progressRes.data)
          ? progressRes.data
          : progressRes.data.subjects || [];

        const progressData = subjectsList.map((s: any) => ({
          id: s.id,
          subjectName: s.subject_name,
          grade: s.grade,
          completedLessons: s.completed_lessons,
          totalLessons: s.total_lessons,
          progressPercentage: s.progress_percentage,
          estimatedCompletionDate: new Date(
            new Date().setDate(new Date().getDate() + 30)
          ), // Mock estimate for now
          status:
            s.progress_percentage > 50
              ? "ahead"
              : s.progress_percentage > 20
              ? "on-track"
              : "behind",
        }));
        setSubjectProgress(progressData);

        // 2. Stats / Performance Summary
        const statsRes = await axios.get(
          `${API_BASE_URL}/dashboard/stats`,
          config
        );
        setPerformanceSummary(statsRes.data);

        // 3. Teaching Insights
        const insightsRes = await axios.get(
          `${API_BASE_URL}/dashboard/insights`,
          config
        );
        setTeachingInsights(insightsRes.data);

        // Use weeklyComparison for TrendGraph as well
        if (insightsRes.data.weeklyComparison) {
          setTrendData(insightsRes.data.weeklyComparison);
        }

        // 4. Upcoming Deadlines
        const deadlinesRes = await axios.get(
          `${API_BASE_URL}/dashboard/deadlines`,
          config
        );
        // Ensure dates are Date objects
        const deadlinesData = deadlinesRes.data.map((d: any) => ({
          ...d,
          date: new Date(d.date),
        }));
        setDeadlines(deadlinesData);

        // 5. Resources
        const resourcesRes = await axios.get(
          `${API_BASE_URL}/dashboard/resources`,
          config
        );
        const resourcesData = resourcesRes.data.map((r: any) => ({
          ...r,
          lastAccessed: new Date(r.lastAccessed),
        }));
        setResources(resourcesData);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          console.warn(
            "Session expired (401) in fetchDashboardData, redirecting..."
          );
          router.push("/login");
          return;
        }
        console.error("Failed to fetch dashboard data:", error);
        // Fallback to empty states or keep loading state
      }
    };

    fetchDashboardData();
  }, []);

  const saveWidgetPreferences = (prefs: WidgetPreferences) => {
    setWidgetPreferences(prefs);
    localStorage.setItem("dashboardWidgets", JSON.stringify(prefs));
  };

  const handleDragStart = (lesson: TimetableEntry) => {
    setDraggedLesson(lesson);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetDay: number) => {
    if (!draggedLesson) return;

    // Update lesson day
    try {
      await axios.put(
        `${API_BASE_URL}/timetable/entries/${draggedLesson.id}`,
        { ...draggedLesson, day_of_week: targetDay },
        { withCredentials: true }
      );

      // Refresh data
      fetchSubjects();
    } catch (error) {
      console.error("Failed to reschedule lesson:", error);
    }

    setDraggedLesson(null);
  };

  const markAttendance = (lessonId: number, present: number) => {
    setAttendanceData((prev) =>
      prev.map((entry) =>
        entry.lessonId === lessonId
          ? { ...entry, presentStudents: present }
          : entry
      )
    );
    // TODO: Save to backend
  };

  const markNotificationRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const fetchSubjects = async () => {
    try {
      const config = {
        withCredentials: true,
      };
      const response = await axios.get(`${API_BASE_URL}/subjects`, config);
      setSubjects(response.data);

      // Infer education level from the first subject's grade
      if (response.data.length > 0) {
        const firstGrade = response.data[0].grade;
        let level = "";
        if (["Grade 7", "Grade 8", "Grade 9"].includes(firstGrade)) {
          level = "Junior Secondary";
        } else if (["Grade 10", "Grade 11", "Grade 12"].includes(firstGrade)) {
          level = "Senior Secondary";
        } else if (["Grade 4", "Grade 5", "Grade 6"].includes(firstGrade)) {
          level = "Upper Primary";
        } else if (["Grade 1", "Grade 2", "Grade 3"].includes(firstGrade)) {
          level = "Lower Primary";
        } else if (["PP1", "PP2"].includes(firstGrade)) {
          level = "Pre-Primary";
        }
        setEducationLevel(level);
        // Now fetch today's lessons with the correct education level
        fetchTodayLessons(level);
      } else {
        // No subjects yet - redirect to curriculum selection for onboarding
        if (authUser) {
          const userObj = authUser as any;
          // Redirect teachers to curriculum selection if they have no subjects
          if (userObj.role === "TEACHER" || userObj.role === "SCHOOL_ADMIN") {
            router.push("/curriculum/select");
            return;
          }
        }

        // No subjects yet, still try to fetch lessons without education level filter
        fetchTodayLessons("");
      }
    } catch (error) {
      // If unauthorized, redirect to login and clear all session data
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.warn("Session expired (401) in fetchSubjects, redirecting...");
        router.push("/login");
        return;
      }
      console.error("Failed to fetch subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayLessons = async (level: string) => {
    try {
      // Build query params
      const params = new URLSearchParams();
      if (level) {
        params.append("education_level", level);
      }
      const queryString = params.toString();
      const query = queryString ? `?${queryString}` : "";

      const config = {
        withCredentials: true,
      };

      // Fetch time slots
      const slotsRes = await axios.get(
        `${API_BASE_URL}/timetable/time-slots${query}`,
        config
      );
      const allSlots = slotsRes.data.filter(
        (s: TimeSlot) => s.slot_type === "lesson"
      );
      setTimeSlots(allSlots);

      // Fetch timetable entries
      const entriesRes = await axios.get(
        `${API_BASE_URL}/timetable/entries${query}`,
        config
      );

      // Get today's day of week (JS getDay: 0=Sunday, 1=Monday, ...)
      // Backend expects: 1=Monday, 2=Tuesday, ..., 7=Sunday
      const jsDay = new Date().getDay();
      const today = jsDay === 0 ? 7 : jsDay; // Convert Sunday from 0 to 7
      const todayEntries = entriesRes.data.filter(
        (entry: TimetableEntry) => entry.day_of_week === today
      );

      setTodayLessons(todayEntries);

      // Fetch curriculum details for each lesson
      for (const entry of todayEntries) {
        fetchCurriculumDetails(entry.subject_id);
      }

      // If no lessons today, fetch next lesson
      if (todayEntries.length === 0) {
        fetchNextLesson();
      }

      // Fetch all weekly entries for the calendar
      setWeeklyEntries(entriesRes.data || []);

      // Calculate weekly stats
      const todayForStats = new Date().getDay();
      const thisWeekEntries = entriesRes.data.filter(
        (e: TimetableEntry) => e.day_of_week >= 1 && e.day_of_week <= 5
      );
      const lessonsThisWeek = thisWeekEntries.length;
      const currentDay = todayForStats === 0 ? 7 : todayForStats;
      const lessonsSoFar = thisWeekEntries.filter(
        (e: TimetableEntry) => e.day_of_week < currentDay
      ).length;

      setWeeklyStats({
        lessonsThisWeek,
        lessonsTaught: lessonsSoFar,
        lessonPlansCreated: subjects.filter((s) => s.lessons_completed > 0)
          .length,
        progressPercentage:
          lessonsThisWeek > 0
            ? Math.round((lessonsSoFar / lessonsThisWeek) * 100)
            : 0,
      });
    } catch (error) {
      console.error("Failed to fetch today's lessons:", error);
    }
  };

  const fetchNextLesson = async () => {
    try {
      const config = {
        withCredentials: true,
      };
      const response = await axios.get(
        `${API_BASE_URL}/timetable/entries/next`,
        config
      );
      if (response.data) {
        setNextLesson(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch next lesson:", error);
    }
  };

  const fetchCurriculumDetails = async (subjectId: number) => {
    try {
      const subject = subjects.find((s) => s.id === subjectId);
      if (!subject) return;

      const config = {
        withCredentials: true,
      };

      // Fetch the curriculum template and current progress
      const response = await axios.get(
        `${API_BASE_URL}/subjects/${subjectId}`,
        config
      );

      const subjectData = response.data;

      // Get current strand and substrand details
      // This assumes the API returns strand/substrand information
      setCurriculumDetails((prev) => ({
        ...prev,
        [subjectId]: {
          strand: {
            strand_number: subjectData.current_strand_number || "",
            strand_name: subjectData.current_strand_name || "",
          },
          substrand: {
            substrand_number: subjectData.current_substrand_number || "",
            substrand_name: subjectData.current_substrand_name || "",
            specific_learning_outcomes:
              subjectData.specific_learning_outcomes || [],
            key_inquiry_questions: subjectData.key_inquiry_questions || [],
            learning_experiences: subjectData.learning_experiences || [],
            core_competencies: subjectData.core_competencies || [],
            values: subjectData.values || [],
            pertinent_issues: subjectData.pertinent_issues || [],
            links_to_other_subjects: subjectData.links_to_other_subjects || [],
          },
        },
      }));
    } catch (error) {
      console.error(
        `Failed to fetch curriculum details for subject ${subjectId}:`,
        error
      );
    }
  };

  const deleteSubject = async (subjectId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this subject? All progress will be lost."
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/subjects/${subjectId}`, {
        withCredentials: true,
      });

      // Remove from state
      setSubjects(subjects.filter((s) => s.id !== subjectId));
    } catch (error) {
      console.error("Failed to delete subject:", error);
      alert("Failed to delete subject. Please try again.");
    }
  };

  const getSubjectTheme = (subjectName: string) => {
    const name = subjectName?.toLowerCase() || "";
    if (name.includes("math"))
      return {
        gradient: "from-blue-500 to-cyan-500",
        icon: "🔢",
        color: "blue",
      };
    if (name.includes("english"))
      return {
        gradient: "from-rose-500 to-pink-500",
        icon: "📖",
        color: "rose",
      };
    if (name.includes("kiswahili"))
      return {
        gradient: "from-amber-500 to-orange-500",
        icon: "🗣️",
        color: "amber",
      };
    if (name.includes("science"))
      return {
        gradient: "from-emerald-500 to-teal-500",
        icon: "🌿",
        color: "emerald",
      };
    if (name.includes("social"))
      return {
        gradient: "from-teal-500 to-cyan-500",
        icon: "🌍",
        color: "teal",
      };
    return {
      gradient: "from-gray-500 to-slate-500",
      icon: "📚",
      color: "gray",
    };
  };

  const getLessonStatus = (timeSlot: TimeSlot) => {
    const now = currentTime;
    const currentTimeStr = now.toTimeString().slice(0, 5);

    if (currentTimeStr < timeSlot.start_time) return "upcoming";
    if (
      currentTimeStr >= timeSlot.start_time &&
      currentTimeStr < timeSlot.end_time
    )
      return "current";
    return "completed";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Check for Super Admin role
  if (user?.role === "SUPER_ADMIN") {
    return <SuperAdminDashboard />;
  }

  // Check for School Admin role
  if (user?.role === "SCHOOL_ADMIN") {
    return <SchoolAdminDashboard user={user} />;
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Premium Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-400/30 rounded-full mix-blend-multiply filter blur-[128px] animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/30 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-pink-400/30 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
      </div>

      {/* Header */}
      {/* Premium Glass Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 border-b border-white/50 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
                Dashboard
              </h1>
              <p className="text-sm text-gray-500 font-medium flex items-center gap-2 mt-0.5">
                <FiCalendar className="w-3.5 h-3.5" />
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 rounded-xl bg-white/50 border border-white/60 hover:bg-white hover:shadow-md transition-all duration-300 group relative"
                >
                  <FiBell className="w-5 h-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                  )}
                </button>
                {showNotifications && (
                  <NotificationsDropdown
                    notifications={notifications}
                    onClose={() => setShowNotifications(false)}
                    onMarkRead={markNotificationRead}
                  />
                )}
              </div>

              {/* Customization */}
              <button
                onClick={() => setShowCustomization(!showCustomization)}
                className="p-2.5 rounded-xl bg-white/50 border border-white/60 hover:bg-white hover:shadow-md transition-all duration-300 group"
              >
                <FiSettings className="w-5 h-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
              </button>

              <div className="h-8 w-[1px] bg-gray-200 mx-1"></div>

              <Link
                href="/timetable"
                className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/50 border border-white/60 hover:bg-white hover:shadow-md transition-all duration-300 text-sm font-semibold text-gray-700 group"
              >
                <FiClock className="w-4 h-4 text-gray-500 group-hover:text-indigo-600 transition-colors" />
                <span>Timetable</span>
              </Link>

              <Link
                href="/curriculum"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all duration-300 text-sm font-semibold"
              >
                <FiPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Subject</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Customization Panel */}
        {showCustomization && (
          <CustomizationPanel
            preferences={widgetPreferences}
            onSave={saveWidgetPreferences}
            onClose={() => setShowCustomization(false)}
          />
        )}
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 relative z-10 max-w-7xl">
        {/* Dashboard Widgets Row */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Weekly Overview Calendar with Swipe */}
          {widgetPreferences.weeklyCalendar && (
            <WeeklyCalendar
              weeklyEntries={weeklyEntries}
              subjects={subjects}
              currentTime={currentTime}
              weekOffset={weekOffset}
              onWeekChange={setWeekOffset}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          )}

          {/* Quick Stats Widget */}
          {widgetPreferences.quickStats && <QuickStats stats={weeklyStats} />}

          {/* Quick Actions Panel */}
          {widgetPreferences.quickActions && <QuickActions />}
        </div>

        {/* Second Row - Trends and Attendance */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Trend Graph */}
          {widgetPreferences.trendGraph && <TrendGraph data={trendData} />}

          {/* Attendance Quick Entry */}
          {widgetPreferences.attendance && (
            <AttendanceWidget
              data={attendanceData}
              onMarkAttendance={markAttendance}
            />
          )}
        </div>

        {/* Third Row - New Advanced Widgets */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Curriculum Progress Tracker */}
          {widgetPreferences.curriculumProgress && (
            <CurriculumProgressTracker subjects={subjectProgress} />
          )}

          {/* Upcoming Deadlines */}
          {widgetPreferences.upcomingDeadlines && (
            <UpcomingDeadlinesWidget deadlines={deadlines} />
          )}

          {/* Teaching Insights */}
          {widgetPreferences.teachingInsights && (
            <TeachingInsightsWidget insights={teachingInsights} />
          )}
        </div>

        {/* Fourth Row - Performance Summary */}
        {widgetPreferences.performanceSummary && (
          <div className="mb-8">
            <PerformanceSummaryCards performance={performanceSummary} />
          </div>
        )}

        {/* Fifth Row - Resource Center */}
        {widgetPreferences.resourceCenter && (
          <div className="mb-8">
            <ResourceCenterWidget resources={resources} />
          </div>
        )}

        {/* Today's Schedule Section */}
        {todayLessons.length === 0 ? (
          <EmptySchedule nextLesson={nextLesson} currentTime={currentTime} />
        ) : (
          <div className="space-y-6">
            {todayLessons
              .sort((a, b) => {
                const slotA = timeSlots.find((s) => s.id === a.time_slot_id);
                const slotB = timeSlots.find((s) => s.id === b.time_slot_id);
                return (slotA?.start_time || "").localeCompare(
                  slotB?.start_time || ""
                );
              })
              .map((lesson) => {
                const subject = subjects.find(
                  (s) => s.id === lesson.subject_id
                );
                const timeSlot = timeSlots.find(
                  (s) => s.id === lesson.time_slot_id
                );
                const curriculum = curriculumDetails[lesson.subject_id];
                const theme = getSubjectTheme(subject?.subject_name || "");
                const status = timeSlot
                  ? getLessonStatus(timeSlot)
                  : "upcoming";
                const isExpanded = expandedLesson === lesson.id;

                return (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    subject={subject}
                    timeSlot={timeSlot}
                    curriculum={curriculum}
                    theme={theme}
                    status={status}
                    isExpanded={isExpanded}
                    onToggleExpand={() =>
                      setExpandedLesson(isExpanded ? null : lesson.id)
                    }
                  />
                );
              })}
          </div>
        )}

        {/* My Subjects Overview */}
        {subjects.length > 0 && (
          <div className="mt-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-gray-900">
                My Subjects Overview
              </h2>

              {/* SaaS Limit Indicator */}
              {(user?.subscription_type === "INDIVIDUAL_BASIC" ||
                user?.subscription_type === "FREE" ||
                !user?.subscription_type) && (
                <div className="flex items-center gap-3 bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-orange-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          subjects.length >=
                          (user?.subscription_type === "INDIVIDUAL_BASIC"
                            ? 6
                            : 6)
                            ? "bg-red-500"
                            : "bg-orange-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            (subjects.length /
                              (user?.subscription_type === "INDIVIDUAL_BASIC"
                                ? 6
                                : 6)) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-orange-800">
                      {subjects.length}/
                      {user?.subscription_type === "INDIVIDUAL_BASIC" ? 6 : 6}{" "}
                      Used
                    </span>
                  </div>

                  {subjects.length >=
                    (user?.subscription_type === "INDIVIDUAL_BASIC"
                      ? 6
                      : 6) && (
                    <button
                      onClick={() =>
                        toast.success("Premium features coming soon!")
                      }
                      className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-md hover:shadow-md transition-all font-bold flex items-center gap-1"
                    >
                      <FiZap className="w-3 h-3" /> Upgrade
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  onDelete={deleteSubject}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function EmptySchedule({
  nextLesson,
  currentTime,
}: {
  nextLesson: any;
  currentTime: Date;
}) {
  const isWeekend = currentTime.getDay() === 0 || currentTime.getDay() === 6;
  const dayName = currentTime.toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center relative overflow-hidden group hover:shadow-lg transition-all duration-500">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl group-hover:bg-indigo-100 transition-colors duration-500"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-50 rounded-full blur-3xl group-hover:bg-purple-100 transition-colors duration-500"></div>

        <div className="relative z-10">
          <div className="text-7xl mb-6 transform group-hover:scale-110 transition-transform duration-500 inline-block">
            {isWeekend ? "🏖️" : "☕"}
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
            No Lessons Today!{" "}
            {isWeekend && (
              <span className="text-indigo-600">It's {dayName}</span>
            )}
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg leading-relaxed">
            {isWeekend
              ? "Time to recharge! Enjoy your well-deserved break. Your next lessons will be ready for you on Monday."
              : "You have a free day ahead. Use this time to plan, grade, or just relax."}
          </p>
          <Link
            href="/timetable"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <FiClock className="w-5 h-5" />
            <span>
              {nextLesson ? "View Full Timetable" : "Setup Timetable"}
            </span>
          </Link>
        </div>
      </div>

      {/* Show next lesson if available */}
      {nextLesson && (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-xl p-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 sm:p-8 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/20 flex-shrink-0">
                <FiCalendar className="w-8 h-8 text-white" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 text-indigo-100 mb-1 font-medium">
                  <span className="uppercase tracking-wider text-xs bg-white/20 px-2 py-0.5 rounded">
                    Up Next
                  </span>
                  <span>
                    {nextLesson.day_name && `${nextLesson.day_name}, `}
                    {nextLesson.time_slot?.start_time}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {nextLesson.subject?.subject_name}
                </h3>

                <div className="flex flex-wrap gap-3">
                  {nextLesson.grade_section && (
                    <div className="flex items-center gap-1.5 text-white/90 bg-black/20 px-3 py-1.5 rounded-lg text-sm backdrop-blur-sm">
                      <FiUsers className="w-4 h-4" />
                      <span>{nextLesson.grade_section}</span>
                    </div>
                  )}
                  {nextLesson.room_number && (
                    <div className="flex items-center gap-1.5 text-white/90 bg-black/20 px-3 py-1.5 rounded-lg text-sm backdrop-blur-sm">
                      <FiMapPin className="w-4 h-4" />
                      <span>Room {nextLesson.room_number}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="hidden sm:block">
                <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center text-white/50">
                  <FiChevronRight className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LessonCard({
  lesson,
  subject,
  timeSlot,
  curriculum,
  theme,
  status,
  isExpanded,
  onToggleExpand,
}: {
  lesson: TimetableEntry;
  subject?: Subject;
  timeSlot?: TimeSlot;
  curriculum?: CurriculumDetails;
  theme: any;
  status: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const statusConfig = {
    upcoming: {
      border: "border-l-4 border-l-blue-500",
      badge: "bg-blue-100 text-blue-700 border border-blue-200",
      text: "Upcoming",
      icon: <FiClock className="w-3 h-3" />,
    },
    current: {
      border: "border-l-4 border-l-green-500 ring-2 ring-green-500/20",
      badge:
        "bg-green-100 text-green-700 border border-green-200 animate-pulse",
      text: "In Progress",
      icon: <FiActivity className="w-3 h-3" />,
    },
    completed: {
      border: "border-l-4 border-l-gray-400 opacity-75",
      badge: "bg-gray-100 text-gray-600 border border-gray-200",
      text: "Completed",
      icon: <FiCheckCircle className="w-3 h-3" />,
    },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.upcoming;

  return (
    <div
      className={`group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden ${config.border}`}
    >
      {/* Lesson Header */}
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4 flex-1">
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br ${theme.gradient} text-white transform group-hover:scale-110 transition-transform duration-300`}
            >
              <span className="text-2xl">{theme.icon}</span>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {subject?.subject_name || "Unknown Subject"}
                </h3>
                <span
                  className={`${config.badge} px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5`}
                >
                  {config.icon}
                  {config.text}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 mt-2">
                <div className="flex items-center gap-1.5">
                  <FiClock className="w-4 h-4 text-indigo-400" />
                  <span className="font-medium text-gray-700">
                    {timeSlot?.start_time} - {timeSlot?.end_time}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FiUsers className="w-4 h-4 text-purple-400" />
                  <span>{lesson.grade_section}</span>
                </div>
                {lesson.room_number && (
                  <div className="flex items-center gap-1.5">
                    <FiMapPin className="w-4 h-4 text-pink-400" />
                    <span>Room {lesson.room_number}</span>
                  </div>
                )}
                {lesson.is_double_lesson && (
                  <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-medium">
                    <FiLayers className="w-3 h-3" />
                    Double Lesson
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onToggleExpand}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isExpanded
                ? "bg-indigo-50 text-indigo-600 rotate-180"
                : "hover:bg-gray-50 text-gray-400 hover:text-gray-600"
            }`}
          >
            <FiChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Curriculum Details - Expandable */}
      {isExpanded && curriculum && (
        <div className="p-6 bg-white/60 backdrop-blur-sm space-y-6">
          {/* Current Topic */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border-2 border-indigo-200">
              <div className="flex items-center gap-2 mb-2">
                <FiLayers className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-gray-900">Current Strand</h4>
              </div>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">
                  {curriculum.strand.strand_number}:
                </span>{" "}
                {curriculum.strand.strand_name}
              </p>
            </div>
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-4 rounded-xl border-2 border-violet-200">
              <div className="flex items-center gap-2 mb-2">
                <FiTarget className="w-5 h-5 text-violet-600" />
                <h4 className="font-bold text-gray-900">Current Sub-Strand</h4>
              </div>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">
                  {curriculum.substrand.substrand_number}:
                </span>{" "}
                {curriculum.substrand.substrand_name}
              </p>
            </div>
          </div>

          {/* Specific Learning Outcomes */}
          {curriculum.substrand.specific_learning_outcomes?.length > 0 && (
            <div className="bg-green-50/80 p-5 rounded-xl border-2 border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <FiCheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-bold text-gray-900 text-lg">
                  Specific Learning Outcomes (SLOs)
                </h4>
              </div>
              <ul className="space-y-2">
                {curriculum.substrand.specific_learning_outcomes.map(
                  (slo, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-gray-800"
                    >
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>{slo}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {/* Key Inquiry Questions */}
          {curriculum.substrand.key_inquiry_questions?.length > 0 && (
            <div className="bg-blue-50/80 p-5 rounded-xl border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">❓</span>
                <h4 className="font-bold text-gray-900 text-lg">
                  Key Inquiry Questions (KIQs)
                </h4>
              </div>
              <ul className="space-y-2">
                {curriculum.substrand.key_inquiry_questions.map((kiq, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-gray-800"
                  >
                    <span className="text-blue-600 font-bold mt-0.5">
                      Q{idx + 1}.
                    </span>
                    <span>{kiq}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Core Competencies */}
          {curriculum.substrand.core_competencies?.length > 0 && (
            <div className="bg-purple-50/80 p-5 rounded-xl border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <FiZap className="w-5 h-5 text-purple-600" />
                <h4 className="font-bold text-gray-900 text-lg">
                  Core Competencies
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {curriculum.substrand.core_competencies.map((comp, idx) => (
                  <span
                    key={idx}
                    className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-md"
                  >
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Values */}
          {curriculum.substrand.values?.length > 0 && (
            <div className="bg-rose-50/80 p-5 rounded-xl border-2 border-rose-200">
              <div className="flex items-center gap-2 mb-3">
                <FiHeart className="w-5 h-5 text-rose-600" />
                <h4 className="font-bold text-gray-900 text-lg">Values</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {curriculum.substrand.values.map((value, idx) => (
                  <span
                    key={idx}
                    className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-md"
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* PCIs (Pertinent and Contemporary Issues) */}
          {curriculum.substrand.pertinent_issues?.length > 0 && (
            <div className="bg-amber-50/80 p-5 rounded-xl border-2 border-amber-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⚠️</span>
                <h4 className="font-bold text-gray-900 text-lg">
                  PCIs (Pertinent & Contemporary Issues)
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {curriculum.substrand.pertinent_issues.map((pci, idx) => (
                  <span
                    key={idx}
                    className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-md"
                  >
                    {pci}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links to Other Subjects */}
          {curriculum.substrand.links_to_other_subjects?.length > 0 && (
            <div className="bg-teal-50/80 p-5 rounded-xl border-2 border-teal-200">
              <div className="flex items-center gap-2 mb-3">
                <FiLink className="w-5 h-5 text-teal-600" />
                <h4 className="font-bold text-gray-900 text-lg">
                  Links to Other Learning Areas
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {curriculum.substrand.links_to_other_subjects.map(
                  (link, idx) => (
                    <span
                      key={idx}
                      className="bg-teal-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-md"
                    >
                      {link}
                    </span>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <FiBook className="mx-auto h-12 w-12 text-muted" />
      <h3 className="mt-2 text-sm font-medium text-foreground">
        No subjects yet
      </h3>
      <p className="mt-1 text-sm text-muted">
        Get started by importing your first subject from the curriculum library
      </p>
      <div className="mt-6 flex justify-center">
        <Link
          href="/curriculum"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 transition-colors"
        >
          <FiBook /> Browse Curriculum Library
        </Link>
      </div>
    </div>
  );
}

function SubjectCard({
  subject,
  onDelete,
}: {
  subject: Subject;
  onDelete: (id: number) => void;
}) {
  const getStatusColor = (percentage: number) => {
    if (percentage >= 75) return "bg-success";
    if (percentage >= 50) return "bg-warning";
    return "bg-danger";
  };

  return (
    <div className="bg-surface rounded-2xl shadow-2xl p-8 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {subject.subject_name}
          </h3>
          <p className="text-sm text-muted">Grade {subject.grade}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary-500">
            {Math.round(subject.progress_percentage)}%
          </p>
          <p className="text-xs text-muted">
            {subject.lessons_completed}/{subject.total_lessons} lessons
          </p>
        </div>
      </div>

      <div className="w-full bg-border rounded-full h-4 overflow-hidden mb-4">
        <div
          className={`${getStatusColor(
            subject.progress_percentage
          )} h-full rounded-full transition-all duration-500`}
          style={{ width: `${subject.progress_percentage}%` }}
        />
      </div>

      <p className="text-sm text-foreground mb-4">
        <strong>Currently:</strong> {subject.current_strand_id} →{" "}
        {subject.current_substrand_id}
      </p>

      <div className="flex gap-3 mb-3">
        <Link
          href={`/subjects/${subject.id}`}
          className="flex-1 text-center py-2 border border-border rounded-xl hover:bg-background text-sm font-semibold text-primary-600 transition-colors"
        >
          View Details
        </Link>
        <button className="flex-1 bg-success text-white py-2 rounded-xl hover:bg-green-700 text-sm font-semibold transition-colors">
          ✓ Mark Complete
        </button>
      </div>

      <button
        onClick={() => onDelete(subject.id)}
        className="w-full py-2 border border-red-500 text-red-500 rounded-xl hover:bg-red-50 text-sm font-semibold transition-colors"
      >
        Delete Subject
      </button>
    </div>
  );
}

// Weekly Calendar Widget with Swipe & Drag-Drop
function WeeklyCalendar({
  weeklyEntries,
  subjects,
  currentTime,
  weekOffset = 0,
  onWeekChange,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  weeklyEntries: TimetableEntry[];
  subjects: Subject[];
  currentTime: Date;
  weekOffset?: number;
  onWeekChange?: (offset: number) => void;
  onDragStart?: (lesson: TimetableEntry) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (targetDay: number) => Promise<void>;
}) {
  const days = [
    { name: "Mon", fullName: "Monday", day: 1, emoji: "📚" },
    { name: "Tue", fullName: "Tuesday", day: 2, emoji: "📖" },
    { name: "Wed", fullName: "Wednesday", day: 3, emoji: "✏️" },
    { name: "Thu", fullName: "Thursday", day: 4, emoji: "📝" },
    { name: "Fri", fullName: "Friday", day: 5, emoji: "🎓" },
  ];

  const currentDay = currentTime.getDay();
  const todayIndex = currentDay === 0 ? 7 : currentDay;

  const getWeekLabel = () => {
    if (weekOffset === 0) return "This Week";
    if (weekOffset === 1) return "Next Week";
    if (weekOffset === -1) return "Last Week";
    if (weekOffset > 1) return `${weekOffset} Weeks Ahead`;
    return `${Math.abs(weekOffset)} Weeks Ago`;
  };

  const getDayLessons = (day: number) => {
    return weeklyEntries.filter((entry) => entry.day_of_week === day);
  };

  const getSubjectIcon = (subjectId: number) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return "📚";
    const name = subject.subject_name.toLowerCase();
    if (name.includes("math")) return "🔢";
    if (name.includes("english")) return "📖";
    if (name.includes("kiswahili")) return "🗣️";
    if (name.includes("science")) return "🌿";
    if (name.includes("social")) return "🌍";
    return "📚";
  };

  return (
    <div
      id="weekly-calendar"
      className="glass-card bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FiCalendar className="w-5 h-5 text-indigo-600" />
            {getWeekLabel()}
          </h3>
          {weekOffset !== 0 && (
            <button
              onClick={() => onWeekChange && onWeekChange(0)}
              className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-200"
            >
              Today
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onWeekChange && onWeekChange(weekOffset - 1)}
            className="p-1 hover:bg-white/50 rounded-lg transition-colors disabled:opacity-50"
            disabled={weekOffset <= -4}
          >
            <FiChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => onWeekChange && onWeekChange(weekOffset + 1)}
            className="p-1 hover:bg-white/50 rounded-lg transition-colors"
          >
            <FiChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <Link
            href="/timetable"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Full →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {days.map((day) => {
          const lessons = getDayLessons(day.day);
          const isToday = todayIndex === day.day && weekOffset === 0;
          const isPast = todayIndex > day.day && weekOffset === 0;

          return (
            <div
              key={day.day}
              className={`relative p-3 rounded-xl transition-all duration-200 ${
                isToday
                  ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg scale-105"
                  : isPast
                  ? "bg-gray-100 border border-gray-200"
                  : "bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-md"
              }`}
              onDragOver={(e) => onDragOver && onDragOver(e)}
              onDrop={() => onDrop && onDrop(day.day)}
            >
              <div className="text-center">
                <div className="text-xs font-semibold mb-1 opacity-70">
                  {day.name}
                </div>
                <div className="text-2xl mb-2">{day.emoji}</div>
                <div
                  className={`text-xl font-bold ${
                    isToday ? "text-white" : "text-gray-900"
                  }`}
                >
                  {lessons.length}
                </div>
                <div
                  className={`text-xs ${
                    isToday ? "text-white/80" : "text-gray-500"
                  }`}
                >
                  {lessons.length === 1 ? "lesson" : "lessons"}
                </div>
              </div>

              {/* Show subject icons for upcoming days - Draggable */}
              {!isPast && lessons.length > 0 && (
                <div className="mt-2 flex justify-center gap-1 flex-wrap">
                  {lessons.slice(0, 3).map((lesson, idx) => (
                    <span
                      key={idx}
                      className="text-xs cursor-move hover:scale-125 transition-transform"
                      draggable={!!onDragStart}
                      onDragStart={() => onDragStart && onDragStart(lesson)}
                      title="Drag to reschedule"
                    >
                      {getSubjectIcon(lesson.subject_id)}
                    </span>
                  ))}
                  {lessons.length > 3 && (
                    <span className="text-xs opacity-70">
                      +{lessons.length - 3}
                    </span>
                  )}
                </div>
              )}

              {isToday && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Quick Stats Widget
function QuickStats({ stats }: { stats: any }) {
  return (
    <div className="glass-card bg-gradient-to-br from-indigo-50/70 to-purple-50/70 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-200/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FiTrendingUp className="w-5 h-5 text-indigo-600" />
          This Week's Progress
        </h3>
      </div>

      <div className="space-y-4">
        {/* Progress Ring */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative w-16 h-16">
                <svg className="transform -rotate-90 w-16 h-16">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 28 * (1 - stats.progressPercentage / 100)
                    }`}
                    className="text-indigo-600 transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-indigo-600">
                    {stats.progressPercentage}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.lessonsTaught}/{stats.lessonsThisWeek}
                </p>
                <p className="text-sm text-gray-600">Lessons Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/60">
            <div className="flex items-center gap-2 mb-1">
              <FiActivity className="w-4 h-4 text-green-600" />
              <p className="text-xs text-gray-600">Total Lessons</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.lessonsThisWeek}
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/60">
            <div className="flex items-center gap-2 mb-1">
              <FiFileText className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-gray-600">Lesson Plans</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.lessonPlansCreated}
            </p>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 rounded-xl text-center">
          <p className="text-sm font-semibold">
            {stats.progressPercentage >= 80
              ? "🎉 Excellent progress!"
              : stats.progressPercentage >= 50
              ? "💪 Keep going!"
              : "🚀 Great start to the week!"}
          </p>
        </div>
      </div>
    </div>
  );
}

// Quick Actions Panel
function QuickActions() {
  const actions = [
    {
      icon: FiEdit3,
      label: "New Lesson Plan",
      href: "/professional-records/create-lesson-plan",
      color: "from-blue-500 to-cyan-500",
      emoji: "📝",
    },
    {
      icon: FiFileText,
      label: "Scheme of Work",
      href: "/professional-records/generate-scheme",
      color: "from-purple-500 to-pink-500",
      emoji: "📊",
    },
    {
      icon: FiUserCheck,
      label: "Record of Work",
      href: "/professional-records/record-of-work/create",
      color: "from-emerald-500 to-teal-500",
      emoji: "✅",
    },
    {
      icon: FiAward,
      label: "Track Progress",
      href: "/curriculum",
      color: "from-amber-500 to-orange-500",
      emoji: "🎯",
    },
  ];

  return (
    <div className="glass-card bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <FiZap className="w-5 h-5 text-indigo-600" />
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, idx) => (
          <Link
            key={idx}
            href={action.href}
            className="group relative overflow-hidden bg-white hover:shadow-xl transition-all duration-300 rounded-xl border border-gray-200 hover:border-indigo-300 p-4 flex flex-col items-center justify-center gap-2"
          >
            <div
              className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
            >
              <action.icon className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-gray-700 text-center">
              {action.label}
            </span>
            <span className="absolute top-2 right-2 text-lg opacity-20 group-hover:opacity-40 transition-opacity">
              {action.emoji}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
        <p className="text-xs text-gray-600 text-center">
          💡 <span className="font-semibold">Tip:</span> Create lesson plans
          ahead to stay organized!
        </p>
      </div>
    </div>
  );
}
