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
} from "react-icons/fi";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : "/api/v1";

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
  const { data: session, status } = useSession();
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

  useEffect(() => {
    if (status === "loading") return; // Still loading

    const storedToken =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    const storedUser =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;

    const sessionToken = (session as any)?.accessToken || null;
    const tokenToUse = sessionToken || storedToken;

    if (!tokenToUse) {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      setUser(session.user);
    } else if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    fetchSubjects(tokenToUse);
    // fetchTodayLessons will be called after subjects are loaded and education level is determined
  }, [session, status, router]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchSubjects = async (token: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/subjects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
        fetchTodayLessons(token, level);
      } else {
        // No subjects yet, still try to fetch lessons without education level filter
        fetchTodayLessons(token, "");
      }
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
      // If unauthorized, redirect to login and clear all session data
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        sessionStorage.clear();
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayLessons = async (token: string, level: string) => {
    try {
      // Build query params
      const params = new URLSearchParams();
      if (level) {
        params.append("education_level", level);
      }
      const queryString = params.toString();
      const query = queryString ? `?${queryString}` : "";

      // Fetch time slots
      const slotsRes = await axios.get(
        `${API_BASE_URL}/timetable/time-slots${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const allSlots = slotsRes.data.filter(
        (s: TimeSlot) => s.slot_type === "lesson"
      );
      setTimeSlots(allSlots);

      // Fetch timetable entries
      const entriesRes = await axios.get(
        `${API_BASE_URL}/timetable/entries${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
        fetchCurriculumDetails(token, entry.subject_id);
      }

      // If no lessons today, fetch next lesson
      if (todayEntries.length === 0) {
        fetchNextLesson(token);
      }

      // Fetch all weekly entries for the calendar
      setWeeklyEntries(entriesRes.data || []);

      // Calculate weekly stats
      const todayForStats = new Date().getDay();
      const thisWeekEntries = entriesRes.data.filter((e: TimetableEntry) => e.day_of_week >= 1 && e.day_of_week <= 5);
      const lessonsThisWeek = thisWeekEntries.length;
      const currentDay = todayForStats === 0 ? 7 : todayForStats;
      const lessonsSoFar = thisWeekEntries.filter((e: TimetableEntry) => e.day_of_week < currentDay).length;
      
      setWeeklyStats({
        lessonsThisWeek,
        lessonsTaught: lessonsSoFar,
        lessonPlansCreated: subjects.filter(s => s.lessons_completed > 0).length,
        progressPercentage: lessonsThisWeek > 0 ? Math.round((lessonsSoFar / lessonsThisWeek) * 100) : 0,
      });
    } catch (error) {
      console.error("Failed to fetch today's lessons:", error);
    }
  };

  const fetchNextLesson = async (token: string) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/timetable/entries/next`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data) {
        setNextLesson(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch next lesson:", error);
    }
  };

  const fetchCurriculumDetails = async (token: string, subjectId: number) => {
    try {
      const subject = subjects.find((s) => s.id === subjectId);
      if (!subject) return;

      // Fetch the curriculum template and current progress
      const response = await axios.get(
        `${API_BASE_URL}/subjects/${subjectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
      const token =
        localStorage.getItem("accessToken") || (session as any)?.accessToken;
      await axios.delete(`${API_BASE_URL}/subjects/${subjectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      {/* Header */}
      <header className="glass-card bg-white/40 backdrop-blur-xl shadow-xl border-b border-white/60 relative z-10">
        <div className="container mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
              Today's Teaching Schedule
            </h1>
            <p className="text-gray-700 mt-1 flex items-center gap-2">
              <FiCalendar className="w-4 h-4" />
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/timetable"
              className="glass-button bg-white/60 backdrop-blur-lg border border-white/60 hover:bg-white/80 px-5 py-2.5 rounded-xl flex items-center gap-2 text-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
            >
              <FiClock /> View Timetable
            </Link>
            <Link
              href="/curriculum"
              className="glass-button bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300 font-medium"
            >
              <FiPlus /> Add Subject
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 relative z-10">
        {/* Dashboard Widgets Row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Weekly Overview Calendar */}
          <WeeklyCalendar
            weeklyEntries={weeklyEntries}
            subjects={subjects}
            currentTime={currentTime}
          />

          {/* Quick Stats Widget */}
          <QuickStats stats={weeklyStats} />

          {/* Quick Actions Panel */}
          <QuickActions />
        </div>

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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              My Subjects Overview
            </h2>
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
    <div className="space-y-6">
      <div className="glass-card bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-12 text-center">
        <div className="text-6xl mb-4">{isWeekend ? "🏖️" : "☕"}</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          No Lessons Today! {isWeekend && `(${dayName})`}
        </h3>
        <p className="text-gray-600 mb-6">
          {isWeekend
            ? "It's the weekend! Enjoy your break. Your next lessons will appear on Monday."
            : "You have a free day. Enjoy your break or set up your timetable."}
        </p>
        <Link
          href="/timetable"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <FiClock /> {nextLesson ? "View Timetable" : "Setup Timetable"}
        </Link>
      </div>

      {/* Show next lesson if available */}
      {nextLesson && (
        <div className="glass-card bg-gradient-to-r from-blue-50/60 to-indigo-50/60 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/60 p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <FiCalendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Next Upcoming Lesson
              </h3>
              <p className="text-sm text-gray-600">
                {nextLesson.day_name && `${nextLesson.day_name}, `}
                {nextLesson.time_slot?.start_time} -{" "}
                {nextLesson.time_slot?.end_time}
              </p>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/60">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-3xl">
                📚
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-900 mb-1">
                  {nextLesson.subject?.subject_name}
                </h4>
                <div className="flex flex-wrap gap-3 text-sm text-gray-700">
                  {nextLesson.grade_section && (
                    <div className="flex items-center gap-1">
                      <FiUsers className="w-4 h-4" />
                      <span>{nextLesson.grade_section}</span>
                    </div>
                  )}
                  {nextLesson.room_number && (
                    <div className="flex items-center gap-1">
                      <FiMapPin className="w-4 h-4" />
                      <span>Room {nextLesson.room_number}</span>
                    </div>
                  )}
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
      bg: "from-blue-400/30 to-cyan-400/30",
      badge: "bg-blue-500",
      text: "Upcoming",
    },
    current: {
      bg: "from-green-400/30 to-emerald-400/30",
      badge: "bg-green-500 animate-pulse",
      text: "In Progress",
    },
    completed: {
      bg: "from-gray-400/30 to-slate-400/30",
      badge: "bg-gray-500",
      text: "Completed",
    },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.upcoming;

  return (
    <div
      className={`glass-card bg-gradient-to-r ${config.bg} backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 overflow-hidden transition-all duration-300 hover:shadow-2xl`}
    >
      {/* Lesson Header */}
      <div
        className={`p-6 bg-gradient-to-r ${theme.gradient} relative overflow-hidden`}
      >
        <div className="absolute inset-0 pattern-dots opacity-20"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div className="flex items-start gap-4 flex-1">
            <div
              className={`w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg`}
            >
              <span className="text-4xl">{theme.icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-white drop-shadow-md">
                  {subject?.subject_name || "Unknown Subject"}
                </h3>
                <span
                  className={`${config.badge} text-white px-3 py-1 rounded-full text-xs font-bold shadow-md`}
                >
                  {config.text}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-white/90 text-sm">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                  <FiClock className="w-4 h-4" />
                  <span className="font-medium">
                    {timeSlot?.start_time} - {timeSlot?.end_time}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                  <FiUsers className="w-4 h-4" />
                  <span className="font-medium">{lesson.grade_section}</span>
                </div>
                {lesson.room_number && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                    <FiMapPin className="w-4 h-4" />
                    <span className="font-medium">
                      Room {lesson.room_number}
                    </span>
                  </div>
                )}
                {lesson.is_double_lesson && (
                  <div className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-lg font-bold text-xs">
                    Double Lesson
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onToggleExpand}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded-lg transition-all duration-200"
          >
            {isExpanded ? (
              <FiChevronUp className="w-6 h-6 text-white" />
            ) : (
              <FiChevronDown className="w-6 h-6 text-white" />
            )}
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

// Weekly Calendar Widget
function WeeklyCalendar({
  weeklyEntries,
  subjects,
  currentTime,
}: {
  weeklyEntries: TimetableEntry[];
  subjects: Subject[];
  currentTime: Date;
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
    <div className="glass-card bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FiCalendar className="w-5 h-5 text-indigo-600" />
          Week at a Glance
        </h3>
        <Link
          href="/timetable"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Full Timetable →
        </Link>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {days.map((day) => {
          const lessons = getDayLessons(day.day);
          const isToday = todayIndex === day.day;
          const isPast = todayIndex > day.day;

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

              {/* Show subject icons for upcoming days */}
              {!isPast && lessons.length > 0 && (
                <div className="mt-2 flex justify-center gap-1 flex-wrap">
                  {lessons.slice(0, 3).map((lesson, idx) => (
                    <span key={idx} className="text-xs">
                      {getSubjectIcon(lesson.subject_id)}
                    </span>
                  ))}
                  {lessons.length > 3 && (
                    <span className="text-xs opacity-70">+{lessons.length - 3}</span>
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
          💡 <span className="font-semibold">Tip:</span> Create lesson plans ahead to stay organized!
        </p>
      </div>
    </div>
  );
}
