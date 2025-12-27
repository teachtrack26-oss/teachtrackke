"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { FaUsers, FaBook, FaChartLine, FaGraduationCap } from "react-icons/fa";

interface Analytics {
  overview: {
    total_users: number;
    active_teachers: number;
    total_templates: number;
    total_subjects: number;
  };
  most_used_curricula: Array<{
    subject: string;
    grade: string;
    usage_count: number;
  }>;
  completion_rates: Array<{
    subject: string;
    avg_completion: number;
    count: number;
  }>;
  teacher_engagement: Array<{
    user_id: number;
    email: string;
    subjects: number;
    avg_progress: number;
  }>;
  subject_popularity: Array<{
    grade: string;
    count: number;
  }>;
  activity_timeline: Array<{
    date: string;
    count: number;
  }>;
  progress_distribution: {
    [key: string]: number;
  };
  department_stats: Array<{
    name: string;
    hod: string;
    teacher_count: number;
  }>;
  subscription_stats: {
    paid: number;
    free: number;
    school_sponsored: number;
  };
  retention_stats: Array<{
    date: string;
    active_users: number;
  }>;
  lesson_adherence: {
    planned: number;
    completed: number;
    rate: number;
  };
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get("/admin/analytics");
      setAnalytics(response.data);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error("Admin access required");
        router.push("/dashboard");
      } else if (error.response?.status === 401) {
        router.push("/login");
      } else {
        toast.error("Failed to load analytics");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  // Prepare progress distribution data for pie chart
  const progressData = Object.entries(analytics.progress_distribution).map(
    ([range, count]) => ({
      name: `${range}%`,
      value: count,
    })
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Curriculum Analytics
          </h1>
          <p className="text-gray-600">
            Comprehensive insights into curriculum usage and teacher engagement
          </p>
        </div>

        {/* PostHog Embedded Dashboard */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Product Analytics (PostHog)
            </h2>
            <a
              href="https://eu.posthog.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-800 text-sm font-medium"
            >
              Open in PostHog &rarr;
            </a>
          </div>
          {process.env.NEXT_PUBLIC_POSTHOG_DASHBOARD_URL ? (
            <div className="bg-white rounded-lg shadow overflow-hidden h-[800px] border border-gray-200">
              <iframe
                src={process.env.NEXT_PUBLIC_POSTHOG_DASHBOARD_URL}
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center border-2 border-dashed border-gray-300">
              <div className="max-w-md mx-auto">
                <FaChartLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Connect PostHog Dashboard
                </h3>
                <p className="text-gray-500 mb-6">
                  To view your live analytics here, create a shared dashboard in
                  PostHog and add the URL to your environment variables.
                </p>
                <div className="bg-gray-50 p-4 rounded text-left text-sm font-mono text-gray-700 mb-4 break-all">
                  NEXT_PUBLIC_POSTHOG_DASHBOARD_URL=https://eu.posthog.com/embedded/...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-3 mr-4">
                <FaUsers className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.overview.total_users}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-3 mr-4">
                <FaGraduationCap className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Active Teachers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.overview.active_teachers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-full p-3 mr-4">
                <FaBook className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Subjects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.overview.total_subjects}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-amber-100 rounded-full p-3 mr-4">
                <FaChartLine className="text-amber-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Templates</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.overview.total_templates}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Most Used Curricula */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Most Used Curricula
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.most_used_curricula}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="subject"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="usage_count" fill="#3b82f6" name="Usage Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Progress Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Progress Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={progressData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {progressData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Average Completion Rates */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Average Completion Rates by Subject
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.completion_rates}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="subject"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="avg_completion"
                  fill="#10b981"
                  name="Avg Completion %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Subject Popularity by Grade */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Subject Popularity by Grade
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.subject_popularity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#f59e0b" name="Subjects" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Stats */}
        {analytics.department_stats &&
          analytics.department_stats.length > 0 && (
            <div className="mb-6 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Department Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.department_stats.map((dept, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-bold text-primary-600">{dept.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      HOD: {dept.hod}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* New Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Subscription Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Subscription Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Paid", value: analytics.subscription_stats.paid },
                    { name: "Free", value: analytics.subscription_stats.free },
                    {
                      name: "School Sponsored",
                      value: analytics.subscription_stats.school_sponsored,
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#9ca3af" />
                  <Cell fill="#3b82f6" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* User Retention */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Daily Active Users (30 Days)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.retention_stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="active_users"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Lesson Adherence */}
          <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-center items-center text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 w-full text-left">
              Lesson Plan Adherence
            </h3>
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeDasharray={`${analytics.lesson_adherence.rate}, 100`}
                />
              </svg>
              <div className="absolute text-3xl font-bold text-gray-800">
                {analytics.lesson_adherence.rate}%
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>
                <span className="font-bold text-gray-900">
                  {analytics.lesson_adherence.completed}
                </span>{" "}
                completed of{" "}
                <span className="font-bold text-gray-900">
                  {analytics.lesson_adherence.planned}
                </span>{" "}
                planned
              </p>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        {analytics.activity_timeline.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Activity Timeline (Last 30 Days)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.activity_timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={11}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8b5cf6"
                  name="Subjects Created"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Teacher Engagement Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Teacher Engagement Metrics
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subjects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.teacher_engagement.map((teacher) => (
                  <tr key={teacher.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {teacher.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {teacher.subjects}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="mr-2">
                          {teacher.avg_progress.toFixed(1)}%
                        </span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${teacher.avg_progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          teacher.subjects > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {teacher.subjects > 0 ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
