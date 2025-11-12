'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
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
} from 'recharts';
import { FaUsers, FaBook, FaChartLine, FaGraduationCap } from 'react-icons/fa';

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
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get(
        'http://192.168.0.102:8000/api/v1/admin/analytics',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setAnalytics(response.data);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Admin access required');
        router.push('/dashboard');
      } else {
        toast.error('Failed to load analytics');
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
    <div className="min-h-screen bg-gray-50 p-8">
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
                        <span className="mr-2">{teacher.avg_progress.toFixed(1)}%</span>
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
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {teacher.subjects > 0 ? 'Active' : 'Inactive'}
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
