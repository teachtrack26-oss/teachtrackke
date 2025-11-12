"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiBook,
  FiCalendar,
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

interface SubStrandProgress {
  substrand_code: string;
  substrand_name: string;
  total_lessons: number;
  completed_lessons: number;
  progress: number;
}

interface StrandProgress {
  strand_code: string;
  strand_name: string;
  total_lessons: number;
  completed_lessons: number;
  progress: number;
  substrands: SubStrandProgress[];
}

interface SubjectProgress {
  id: number;
  subject_name: string;
  grade: string;
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
  strands: StrandProgress[];
}

interface RecentCompletion {
  lesson_id: number;
  lesson_title: string;
  completed_at: string;
  subject_name: string;
  grade: string;
}

interface DashboardData {
  overview: {
    total_subjects: number;
    total_lessons: number;
    completed_lessons: number;
    average_progress: number;
  };
  subjects: SubjectProgress[];
  recent_completions: RecentCompletion[];
}

export default function CurriculumTrackingPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Please login to access curriculum tracking");
      router.push("/login");
      return;
    }
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `/api/v1/dashboard/curriculum-progress`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load curriculum tracking data");
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    if (percentage >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            No Data Available
          </h1>
          <button
            onClick={() => router.push("/curriculum")}
            className="text-indigo-600 hover:text-indigo-700"
          >
            Return to Curriculum
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/curriculum")}
            className="text-indigo-600 hover:text-indigo-700 mb-4 inline-flex items-center"
          >
            ← Back to Curriculum
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Curriculum Tracking Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor your teaching progress across all subjects and strands
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <FiBook className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {data.overview.total_subjects}
            </div>
            <div className="text-sm text-gray-600">Total Subjects</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {data.overview.completed_lessons}
            </div>
            <div className="text-sm text-gray-600">Lessons Completed</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FiClock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {data.overview.total_lessons}
            </div>
            <div className="text-sm text-gray-600">Total Lessons</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiTrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {data.overview.average_progress.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Average Progress</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Subject Progress */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Subject Progress
            </h2>

            {data.subjects.map((subject) => (
              <div
                key={subject.id}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {subject.subject_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Grade {subject.grade}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/curriculum/${subject.id}`)}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    View Details →
                  </button>
                </div>

                {/* Overall Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Overall Progress</span>
                    <span>{subject.progress_percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`${getProgressColor(
                        subject.progress_percentage
                      )} h-3 rounded-full transition-all duration-300`}
                      style={{ width: `${subject.progress_percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {subject.completed_lessons} / {subject.total_lessons}{" "}
                    lessons completed
                  </div>
                </div>

                {/* Strand Progress */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Strand Progress
                  </h4>
                  {subject.strands.map((strand) => (
                    <div key={strand.strand_code} className="mb-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span className="font-medium">
                          {strand.strand_code}. {strand.strand_name}
                        </span>
                        <span>{strand.progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${getProgressColor(
                            strand.progress
                          )} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${strand.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {strand.completed_lessons} / {strand.total_lessons}{" "}
                        lessons
                      </div>

                      {/* Substrand Progress - Only show if there are completed lessons */}
                      {strand.substrands && strand.substrands.length > 0 && (
                        <div className="mt-2 ml-4 space-y-2 border-l-2 border-gray-200 pl-3">
                          {strand.substrands.map((substrand) => (
                            <div key={substrand.substrand_code}>
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span className="flex items-center">
                                  <span className="inline-block w-1.5 h-1.5 bg-indigo-400 rounded-full mr-2"></span>
                                  {substrand.substrand_code}.{" "}
                                  {substrand.substrand_name}
                                </span>
                                <span className="text-green-600 font-medium">
                                  {substrand.completed_lessons}/
                                  {substrand.total_lessons}
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                  className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${substrand.progress}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {data.subjects.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Subjects Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Add your first curriculum to start tracking progress
                </p>
                <button
                  onClick={() => router.push("/curriculum/select")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Add CBC Curriculum
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Recent Activity */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Completions
            </h2>

            <div className="bg-white rounded-lg shadow-md p-6">
              {data.recent_completions.length > 0 ? (
                <div className="space-y-4">
                  {data.recent_completions.map((completion, idx) => (
                    <div
                      key={idx}
                      className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
                    >
                      <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                        <FiCheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {completion.lesson_title}
                        </p>
                        <p className="text-xs text-gray-600">
                          {completion.subject_name} • {completion.grade}
                        </p>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <FiCalendar className="w-3 h-3 mr-1" />
                          {formatDate(completion.completed_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiClock className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600">
                    No completed lessons yet
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Mark lessons as complete to see them here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
