"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiUsers,
  FiBriefcase,
  FiBook,
  FiShield,
  FiZap,
  FiSearch,
  FiCheck,
  FiX,
  FiSlash,
  FiTrash2,
  FiArrowUp,
  FiArrowDown,
  FiChevronLeft,
  FiChevronRight,
  FiActivity,
  FiDatabase,
  FiServer,
  FiDownload,
  FiLogIn,
  FiEdit2,
  FiHome,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PlatformStats {
  total_users: number;
  total_teachers: number;
  total_school_admins: number;
  total_schools: number;
  total_subjects: number;
  subscriptions: {
    basic: number;
    premium: number;
    school_sponsored: number;
  };
}

interface GrowthTrend {
  week: string;
  new_users: number;
}

interface CurriculumStat {
  grade: string;
  avg_progress: number;
  subject_count: number;
}

interface ActivityLog {
  type: string;
  description: string;
  timestamp: string;
  entity_id: number;
}

interface SystemHealth {
  status: string;
  database: string;
  timestamp: string;
  error?: string;
}

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  subscription_type: string;
  subscription_status: string;
  school_id: number | null;
  subject_count: number;
  created_at: string;
  is_active: boolean;
}

interface School {
  id: number;
  name: string;
  admin_email?: string;
  email?: string;
  teacher_count: number;
  max_teachers: number;
  subscription_status: string;
  created_at: string;
}

interface SchoolTeacher {
  id: number;
  full_name: string;
  email: string;
  subscription_type: string;
  is_active: boolean;
  created_at: string;
  is_current?: boolean;
  subject_count?: number;
  subjects?: TeacherSubjectSummary[];
}

interface TeacherSubjectSummary {
  id: number;
  name: string;
  grade: string;
  lessons_completed?: number;
  total_lessons?: number;
  progress?: number;
}

interface SchoolDetails {
  school: {
    id: number;
    name: string;
    email?: string | null;
    max_teachers: number;
    subscription_status: string;
  };
  school_admin: {
    id: number;
    full_name: string;
    email: string;
    is_active: boolean;
  } | null;
  teachers: SchoolTeacher[];
  previous_teachers?: SchoolTeacher[];
  teacher_count: number;
  previous_teacher_count?: number;
}

type SchoolSortField =
  | "name"
  | "created_at"
  | "teacher_count"
  | "subscription_status";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  // Analytics State
  const [growthTrends, setGrowthTrends] = useState<GrowthTrend[]>([]);
  const [curriculumStats, setCurriculumStats] = useState<CurriculumStat[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const [schools, setSchools] = useState<School[]>([]);
  const [schoolTotal, setSchoolTotal] = useState(0);
  const [schoolPage, setSchoolPage] = useState(1);
  const [schoolPageSize, setSchoolPageSize] = useState(10);
  const [schoolSearchTerm, setSchoolSearchTerm] = useState("");
  const [schoolSubscriptionFilter, setSchoolSubscriptionFilter] =
    useState<string>("all");
  const [schoolSortBy, setSchoolSortBy] = useState<SchoolSortField>("name");
  const [schoolSortOrder, setSchoolSortOrder] = useState<"asc" | "desc">("asc");
  const [schoolsLoading, setSchoolsLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "schools">(
    "overview"
  );
  const [selectedSchool, setSelectedSchool] = useState<SchoolDetails | null>(
    null
  );
  const [loadingSchoolDetails, setLoadingSchoolDetails] = useState(false);

  const initializedRef = useRef(false);

  const fetchStats = useCallback(async () => {
    try {
      // const token = localStorage.getItem("accessToken");
      const statsRes = await axios.get("/api/v1/admin/stats", {
        // headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setStats(statsRes.data);
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || "Failed to load platform stats"
      );
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      // const token = localStorage.getItem("accessToken");
      // const headers = { Authorization: `Bearer ${token}` };

      const [trendsRes, curriculumRes, activityRes, healthRes] =
        await Promise.all([
          axios.get("/api/v1/admin/analytics/trends", {
            withCredentials: true,
          }),
          axios.get("/api/v1/admin/analytics/curriculum", {
            withCredentials: true,
          }),
          axios.get("/api/v1/admin/analytics/activity", {
            withCredentials: true,
          }),
          axios.get("/api/v1/admin/analytics/health", {
            withCredentials: true,
          }),
        ]);

      setGrowthTrends(trendsRes.data);
      setCurriculumStats(curriculumRes.data);
      setActivityLogs(activityRes.data);
      setSystemHealth(healthRes.data);
    } catch (error) {
      console.error("Failed to fetch analytics", error);
    }
  }, []);

  const handleBulkAction = async (action: "ban" | "unban" | "delete") => {
    if (selectedUserIds.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to ${action} ${selectedUserIds.length} selected users?`
      )
    )
      return;

    try {
      // const token = localStorage.getItem("accessToken");
      // const headers = { Authorization: `Bearer ${token}` };

      if (action === "delete") {
        await axios.post(
          "/api/v1/admin/users/bulk-delete",
          { user_ids: selectedUserIds },
          { withCredentials: true }
        );
      } else {
        await axios.post(
          "/api/v1/admin/users/bulk-ban",
          { user_ids: selectedUserIds, action },
          { withCredentials: true }
        );
      }

      toast.success(`Bulk ${action} successful`);
      setSelectedUserIds([]);
      fetchUsers();
    } catch (error: any) {
      toast.error(`Failed to perform bulk ${action}`);
    }
  };

  const handleExportUsers = async () => {
    setIsExporting(true);
    try {
      // const token = localStorage.getItem("accessToken");
      const res = await axios.get("/api/v1/admin/users/export", {
        // headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
        params: {
          search: userSearchTerm || undefined,
          role: userRoleFilter !== "all" ? userRoleFilter : undefined,
        },
      });

      // Convert JSON to CSV
      const items = res.data;
      if (items.length === 0) {
        toast("No users to export");
        return;
      }
      const replacer = (key: string, value: any) =>
        value === null ? "" : value;
      const header = Object.keys(items[0]);
      const csv = [
        header.join(","),
        ...items.map((row: any) =>
          header
            .map((fieldName) => JSON.stringify(row[fieldName], replacer))
            .join(",")
        ),
      ].join("\r\n");

      // Download
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.setAttribute("hidden", "");
      a.setAttribute("href", url);
      a.setAttribute("download", "users_export.csv");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImpersonate = async (userId: number) => {
    if (!confirm("Are you sure you want to impersonate this user?")) return;
    try {
      // const token = localStorage.getItem("accessToken");
      const res = await axios.post(
        `/api/v1/admin/users/${userId}/impersonate`,
        {},
        {
          // headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      // Save current admin token to restore later if needed (optional feature)
      // For now, just switch session
      // localStorage.setItem("accessToken", res.data.access_token);
      // localStorage.setItem("user", JSON.stringify(res.data.user));

      // Force reload to dashboard
      window.location.href = "/dashboard";
    } catch (error: any) {
      toast.error("Impersonation failed");
    }
  };

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      // const token = localStorage.getItem("accessToken");
      const usersRes = await axios.get("/api/v1/admin/users", {
        // headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
        params: {
          page: userPage,
          limit: userPageSize,
          search: userSearchTerm || undefined,
          role: userRoleFilter !== "all" ? userRoleFilter : undefined,
        },
      });
      const total = usersRes.data?.total ?? 0;
      setUsers(usersRes.data?.users || []);
      setUserTotal(total);

      const totalPages = total === 0 ? 1 : Math.ceil(total / userPageSize);
      if (total > 0 && userPage > totalPages) {
        setUserPage(totalPages);
      } else if (total === 0 && userPage !== 1) {
        setUserPage(1);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }, [userPage, userPageSize, userSearchTerm, userRoleFilter]);

  const fetchSchools = useCallback(async () => {
    setSchoolsLoading(true);
    try {
      // const token = localStorage.getItem("accessToken");
      const schoolsRes = await axios.get("/api/v1/admin/schools", {
        // headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
        params: {
          page: schoolPage,
          limit: schoolPageSize,
          search: schoolSearchTerm || undefined,
          subscription_status:
            schoolSubscriptionFilter !== "all"
              ? schoolSubscriptionFilter
              : undefined,
          sort_by: schoolSortBy,
          sort_order: schoolSortOrder,
        },
      });

      const payload = Array.isArray(schoolsRes.data)
        ? {
            schools: schoolsRes.data,
            total: schoolsRes.data.length,
          }
        : schoolsRes.data;

      const total = payload?.total ?? payload?.schools?.length ?? 0;
      setSchools(payload?.schools || []);
      setSchoolTotal(total);

      const totalPages = total === 0 ? 1 : Math.ceil(total / schoolPageSize);
      if (total > 0 && schoolPage > totalPages) {
        setSchoolPage(totalPages);
      } else if (total === 0 && schoolPage !== 1) {
        setSchoolPage(1);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to load schools");
    } finally {
      setSchoolsLoading(false);
    }
  }, [
    schoolPage,
    schoolPageSize,
    schoolSearchTerm,
    schoolSubscriptionFilter,
    schoolSortBy,
    schoolSortOrder,
  ]);

  useEffect(() => {
    const initialize = async () => {
      try {
        await Promise.all([
          fetchStats(),
          fetchUsers(),
          fetchSchools(),
          fetchAnalytics(),
        ]);
      } finally {
        initializedRef.current = true;
        setLoading(false);
      }
    };

    initialize();
  }, [fetchStats, fetchUsers, fetchSchools, fetchAnalytics]);

  useEffect(() => {
    if (!initializedRef.current) return;
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!initializedRef.current) return;
    fetchSchools();
  }, [fetchSchools]);

  const handleUpgradeUser = async (userId: number) => {
    if (!confirm("Upgrade this user to Premium?")) return;
    try {
      // const token = localStorage.getItem("accessToken");
      await axios.put(
        `/api/v1/admin/users/${userId}/upgrade`,
        {},
        {
          // headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      toast.success("User upgraded to Premium!");
      await Promise.all([fetchUsers(), fetchStats(), fetchSchools()]);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to upgrade user");
    }
  };

  const handleToggleBanUser = async (user: User) => {
    const action = user.is_active ? "ban" : "unban";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      // const token = localStorage.getItem("accessToken");
      await axios.post(
        `/api/v1/admin/users/${user.id}/${action}`,
        {},
        {
          // headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      toast.success(`User ${action}ned successfully`);
      await Promise.all([fetchUsers(), fetchStats(), fetchSchools()]);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || `Failed to ${action} user`);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (
      !confirm(
        "Are you sure you want to PERMANENTLY delete this user? This action cannot be undone."
      )
    )
      return;

    try {
      // const token = localStorage.getItem("accessToken");
      await axios.delete(`/api/v1/admin/users/${userId}`, {
        // headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      toast.success("User deleted successfully");
      await Promise.all([fetchUsers(), fetchStats(), fetchSchools()]);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to delete user");
    }
  };

  const [isEditingSchool, setIsEditingSchool] = useState(false);
  const [editSchoolForm, setEditSchoolForm] = useState({
    max_teachers: 0,
    subscription_status: "",
  });

  const handleUpdateSchool = async () => {
    if (!selectedSchool) return;
    try {
      // const token = localStorage.getItem("accessToken");
      await axios.patch(
        `/api/v1/admin/schools/${selectedSchool.school.id}`,
        editSchoolForm,
        {
          // headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      toast.success("School updated successfully");
      setIsEditingSchool(false);
      // Refresh data
      handleViewSchoolTeachers(selectedSchool.school.id);
      fetchSchools();
    } catch (error: any) {
      toast.error("Failed to update school");
    }
  };

  const handleUnlinkTeacher = async (userId: number) => {
    if (!confirm("Are you sure you want to unlink this teacher?")) return;
    try {
      // const token = localStorage.getItem("accessToken");
      await axios.post(
        `/api/v1/admin/users/${userId}/unlink`,
        {},
        {
          // headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      toast.success("Teacher unlinked successfully");
      // Refresh data
      if (selectedSchool) {
        handleViewSchoolTeachers(selectedSchool.school.id);
      }
    } catch (error: any) {
      toast.error("Failed to unlink teacher");
    }
  };

  const handleToggleBanTeacher = async (teacher: SchoolTeacher) => {
    const action = teacher.is_active ? "ban" : "unban";
    if (!confirm(`Are you sure you want to ${action} ${teacher.full_name}?`))
      return;

    try {
      // const token = localStorage.getItem("accessToken");
      await axios.post(
        `/api/v1/admin/users/${teacher.id}/${action}`,
        {},
        {
          // headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      toast.success(`Teacher ${action}ned successfully`);
      // Refresh data
      if (selectedSchool) {
        handleViewSchoolTeachers(selectedSchool.school.id);
      }
      fetchUsers(); // Also refresh main user list
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || `Failed to ${action} teacher`
      );
    }
  };

  const handleViewSchoolTeachers = async (schoolId: number) => {
    setLoadingSchoolDetails(true);
    try {
      // const token = localStorage.getItem("accessToken");
      const res = await axios.get(
        `/api/v1/admin/schools/${schoolId}/teachers`,
        {
          // headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setSelectedSchool(res.data);
      setEditSchoolForm({
        max_teachers: res.data.school.max_teachers,
        subscription_status: res.data.school.subscription_status,
      });
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || "Failed to load school details"
      );
    } finally {
      setLoadingSchoolDetails(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const userTotalPages =
    userTotal === 0 ? 1 : Math.ceil(userTotal / userPageSize);
  const schoolTotalPages =
    schoolTotal === 0 ? 1 : Math.ceil(schoolTotal / schoolPageSize);

  const formatRangeLabel = (page: number, pageSize: number, total: number) => {
    if (total === 0) {
      return "Showing 0 of 0";
    }
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    return `Showing ${start}-${end} of ${total}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <nav
          className="flex mb-6 text-sm text-gray-500"
          aria-label="Breadcrumb"
        >
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a
                href="/dashboard"
                className="inline-flex items-center hover:text-indigo-600 transition-colors"
              >
                <FiHome className="w-4 h-4 mr-2" />
                Dashboard
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <FiChevronRight className="w-4 h-4 text-gray-400" />
                <span className="ml-1 font-medium text-gray-700 md:ml-2">
                  Super Admin
                </span>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <FiChevronRight className="w-4 h-4 text-gray-400" />
                <span className="ml-1 font-medium text-gray-500 md:ml-2 capitalize">
                  {activeTab}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="p-3 bg-red-100 rounded-xl">
            <FiShield className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Super Admin Dashboard
            </h1>
            <p className="text-gray-600">Platform oversight and management</p>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <FiUsers className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_users}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-xl">
                  <FiBriefcase className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Schools</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_schools}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 rounded-xl">
                  <FiBook className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subjects</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_subjects}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-xl">
                  <FiZap className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Premium Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.subscriptions.premium}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Breakdown */}
        {stats && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Subscription Distribution
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-orange-50 rounded-xl">
                <p className="text-sm text-gray-600">Individual Basic</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.subscriptions.basic}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl">
                <p className="text-sm text-gray-600">Individual Premium</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.subscriptions.premium}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-gray-600">School Sponsored</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.subscriptions.school_sponsored}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "users"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            All Users ({userTotal})
          </button>
          <button
            onClick={() => setActiveTab("schools")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "schools"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Schools ({schoolTotal})
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Growth Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  User Growth
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthTrends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="new_users"
                        stroke="#4F46E5"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Curriculum Progress Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Curriculum Progress by Grade
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={curriculumStats}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar
                        dataKey="avg_progress"
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Activity & Health Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiActivity className="text-indigo-600" /> Recent Activity
                </h3>
                <div className="space-y-4">
                  {activityLogs.map((log, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0"
                    >
                      <div
                        className={`mt-1 w-2 h-2 rounded-full ${
                          log.type === "USER_JOINED"
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <div>
                        <p className="text-sm text-gray-900 font-medium">
                          {log.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activityLogs.length === 0 && (
                    <p className="text-gray-500 text-sm italic">
                      No recent activity recorded.
                    </p>
                  )}
                </div>
              </div>

              {/* System Health */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiServer className="text-gray-600" /> System Health
                </h3>
                {systemHealth ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            systemHealth.status === "healthy"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />
                        <span className="font-medium text-gray-700">
                          API Status
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 capitalize">
                        {systemHealth.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FiDatabase className="text-gray-500" />
                        <span className="font-medium text-gray-700">
                          Database
                        </span>
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          systemHealth.database === "connected"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {systemHealth.database === "connected"
                          ? "Connected"
                          : "Error"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 text-center mt-4">
                      Last checked:{" "}
                      {new Date(systemHealth.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ) : (
                  <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-100 rounded-lg"></div>
                    <div className="h-10 bg-gray-100 rounded-lg"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 items-center flex-1">
                  <div className="flex-1 min-w-[220px] relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value);
                        setUserPage(1);
                      }}
                      placeholder="Search by email or name..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => {
                      setUserRoleFilter(e.target.value);
                      setUserPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="TEACHER">Teachers</option>
                    <option value="SCHOOL_ADMIN">School Admins</option>
                    <option value="SUPER_ADMIN">Super Admins</option>
                  </select>
                  <select
                    value={userPageSize}
                    onChange={(e) => {
                      setUserPageSize(Number(e.target.value));
                      setUserPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                </div>
                <button
                  onClick={handleExportUsers}
                  disabled={isExporting}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium flex items-center gap-2"
                >
                  <FiDownload className="w-4 h-4" />
                  {isExporting ? "Exporting..." : "Export CSV"}
                </button>
              </div>

              {/* Bulk Actions Bar */}
              {selectedUserIds.length > 0 && (
                <div className="mt-4 p-3 bg-indigo-50 rounded-lg flex items-center justify-between animate-fade-in">
                  <span className="text-sm font-medium text-indigo-900">
                    {selectedUserIds.length} users selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkAction("ban")}
                      className="px-3 py-1.5 bg-white text-yellow-700 border border-yellow-200 rounded-md text-sm font-medium hover:bg-yellow-50"
                    >
                      Ban Selected
                    </button>
                    <button
                      onClick={() => handleBulkAction("unban")}
                      className="px-3 py-1.5 bg-white text-green-700 border border-green-200 rounded-md text-sm font-medium hover:bg-green-50"
                    >
                      Unban Selected
                    </button>
                    <button
                      onClick={() => handleBulkAction("delete")}
                      className="px-3 py-1.5 bg-white text-red-700 border border-red-200 rounded-md text-sm font-medium hover:bg-red-50"
                    >
                      Delete Selected
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                  <tr>
                    <th className="px-6 py-4 w-4">
                      <input
                        type="checkbox"
                        checked={
                          users.length > 0 &&
                          selectedUserIds.length === users.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUserIds(users.map((u) => u.id));
                          } else {
                            setSelectedUserIds([]);
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left font-medium">User</th>
                    <th className="px-6 py-4 text-left font-medium">Role</th>
                    <th className="px-6 py-4 text-left font-medium">
                      Subscription
                    </th>
                    <th className="px-6 py-4 text-left font-medium">
                      Subjects
                    </th>
                    <th className="px-6 py-4 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersLoading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                          <span>Loading users...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!usersLoading && users.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No users found for the selected filters.
                      </td>
                    </tr>
                  )}
                  {!usersLoading &&
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className={`hover:bg-gray-50 ${
                          !user.is_active ? "bg-red-50" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUserIds((prev) => [
                                  ...prev,
                                  user.id,
                                ]);
                              } else {
                                setSelectedUserIds((prev) =>
                                  prev.filter((id) => id !== user.id)
                                );
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">
                                  {user.full_name}
                                </p>
                                {!user.is_active && (
                                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
                                    BANNED
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === "SUPER_ADMIN"
                                ? "bg-red-100 text-red-700"
                                : user.role === "SCHOOL_ADMIN"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {user.role === "SUPER_ADMIN"
                              ? "Super Admin"
                              : user.role === "SCHOOL_ADMIN"
                              ? "School Admin"
                              : user.role === "TEACHER"
                              ? "Teacher"
                              : user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.subscription_type === "INDIVIDUAL_PREMIUM"
                                ? "bg-purple-100 text-purple-700"
                                : user.subscription_type === "SCHOOL_SPONSORED"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {user.subscription_type === "INDIVIDUAL_PREMIUM"
                              ? "Premium"
                              : user.subscription_type === "SCHOOL_SPONSORED"
                              ? "School Sponsored"
                              : user.subscription_type === "INDIVIDUAL_BASIC"
                              ? "Basic"
                              : user.subscription_type === "FREE"
                              ? "Free"
                              : user.subscription_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {user.subject_count}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            {user.subscription_type === "INDIVIDUAL_BASIC" && (
                              <button
                                onClick={() => handleUpgradeUser(user.id)}
                                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium"
                              >
                                <FiZap className="inline w-3 h-3 mr-1" />
                                Upgrade
                              </button>
                            )}
                            {user.role !== "SUPER_ADMIN" && (
                              <>
                                <button
                                  onClick={() => handleToggleBanUser(user)}
                                  className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 ${
                                    user.is_active
                                      ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                      : "bg-green-100 text-green-700 hover:bg-green-200"
                                  }`}
                                >
                                  {user.is_active ? (
                                    <>
                                      <FiSlash className="w-3 h-3" />
                                      Ban
                                    </>
                                  ) : (
                                    <>
                                      <FiCheck className="w-3 h-3" />
                                      Unban
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium flex items-center gap-1"
                                >
                                  <FiTrash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-gray-600">
                {formatRangeLabel(userPage, userPageSize, userTotal)}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setUserPage((prev) => Math.max(prev - 1, 1))}
                  disabled={userPage === 1 || userTotal === 0}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1"
                >
                  <FiChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {userTotal === 0 ? 0 : userPage} of {userTotalPages}
                </span>
                <button
                  onClick={() =>
                    setUserPage((prev) =>
                      userTotal === 0
                        ? prev
                        : Math.min(prev + 1, userTotalPages)
                    )
                  }
                  disabled={userPage >= userTotalPages || userTotal === 0}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1"
                >
                  Next
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Schools Tab */}
        {activeTab === "schools" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[220px] relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={schoolSearchTerm}
                    onChange={(e) => {
                      setSchoolSearchTerm(e.target.value);
                      setSchoolPage(1);
                    }}
                    placeholder="Search school names..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <select
                  value={schoolSubscriptionFilter}
                  onChange={(e) => {
                    setSchoolSubscriptionFilter(e.target.value);
                    setSchoolPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Subscriptions</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="TRIAL">Trial</option>
                </select>
                <select
                  value={schoolSortBy}
                  onChange={(e) => {
                    setSchoolSortBy(e.target.value as SchoolSortField);
                    setSchoolPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="name">Sort by Name</option>
                  <option value="teacher_count">Sort by Teachers</option>
                  <option value="created_at">Sort by Created</option>
                  <option value="subscription_status">Sort by Status</option>
                </select>
                <button
                  onClick={() => {
                    setSchoolSortOrder((prev) =>
                      prev === "asc" ? "desc" : "asc"
                    );
                    setSchoolPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {schoolSortOrder === "asc" ? (
                    <>
                      <FiArrowUp className="w-4 h-4" /> Asc
                    </>
                  ) : (
                    <>
                      <FiArrowDown className="w-4 h-4" /> Desc
                    </>
                  )}
                </button>
                <select
                  value={schoolPageSize}
                  onChange={(e) => {
                    setSchoolPageSize(Number(e.target.value));
                    setSchoolPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium">
                      School Name
                    </th>
                    <th className="px-6 py-4 text-left font-medium">Email</th>
                    <th className="px-6 py-4 text-left font-medium">
                      Teachers
                    </th>
                    <th className="px-6 py-4 text-left font-medium">Status</th>
                    <th className="px-6 py-4 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schoolsLoading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                          <span>Loading schools...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!schoolsLoading && schools.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No schools match the current filters.
                      </td>
                    </tr>
                  )}
                  {!schoolsLoading &&
                    schools.map((school) => (
                      <tr key={school.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {school.name}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {school.email || school.admin_email || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900 font-medium">
                            {school.teacher_count ?? 0}
                          </span>
                          <span className="text-gray-500">
                            {" "}
                            / {school.max_teachers}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            {school.subscription_status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end">
                            <button
                              onClick={() =>
                                handleViewSchoolTeachers(school.id)
                              }
                              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm font-medium flex items-center gap-1"
                            >
                              <FiUsers className="w-3 h-3" />
                              View Teachers
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-gray-600">
                {formatRangeLabel(schoolPage, schoolPageSize, schoolTotal)}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSchoolPage((prev) => Math.max(prev - 1, 1))}
                  disabled={schoolPage === 1 || schoolTotal === 0}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1"
                >
                  <FiChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {schoolTotal === 0 ? 0 : schoolPage} of{" "}
                  {schoolTotalPages}
                </span>
                <button
                  onClick={() =>
                    setSchoolPage((prev) =>
                      schoolTotal === 0
                        ? prev
                        : Math.min(prev + 1, schoolTotalPages)
                    )
                  }
                  disabled={schoolPage >= schoolTotalPages || schoolTotal === 0}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1"
                >
                  Next
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* School Teachers Modal */}
        {selectedSchool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedSchool.school.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedSchool.school.email || "No admin email on file"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingSchool(!isEditingSchool)}
                    className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                  >
                    {isEditingSchool ? "Cancel Edit" : "Edit Settings"}
                  </button>
                  <button
                    onClick={() => setSelectedSchool(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Edit Form */}
                {isEditingSchool && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">
                      Edit School Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Teachers
                        </label>
                        <input
                          type="number"
                          value={editSchoolForm.max_teachers}
                          onChange={(e) =>
                            setEditSchoolForm({
                              ...editSchoolForm,
                              max_teachers: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subscription Status
                        </label>
                        <select
                          value={editSchoolForm.subscription_status}
                          onChange={(e) =>
                            setEditSchoolForm({
                              ...editSchoolForm,
                              subscription_status: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="TRIAL">Trial</option>
                          <option value="PAST_DUE">Past Due</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleUpdateSchool}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {/* School Admin Section */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                    School Admin
                  </h4>
                  {selectedSchool.school_admin ? (
                    <div
                      className={`p-4 rounded-lg border ${
                        !selectedSchool.school_admin.is_active
                          ? "bg-red-50 border-red-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 flex items-center gap-2">
                            {selectedSchool.school_admin.full_name}
                            {!selectedSchool.school_admin.is_active && (
                              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
                                BANNED
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {selectedSchool.school_admin.email}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          School Admin
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">
                      No school admin found
                    </p>
                  )}
                </div>

                {/* Teachers Section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                    Current Teachers ({selectedSchool.teacher_count} /{" "}
                    {selectedSchool.school.max_teachers})
                  </h4>
                  {selectedSchool.teachers.length > 0 ? (
                    <div className="space-y-2">
                      {selectedSchool.teachers.map((teacher) => (
                        <div
                          key={teacher.id}
                          className={`p-4 rounded-lg border ${
                            !teacher.is_active
                              ? "bg-red-50 border-red-200"
                              : "bg-green-50 border-green-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 flex items-center gap-2">
                                {teacher.full_name}
                                {teacher.is_active && (
                                  <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full">
                                    ACTIVE
                                  </span>
                                )}
                                {!teacher.is_active && (
                                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
                                    BANNED
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">
                                {teacher.email}
                              </p>
                              <div className="mt-3">
                                {teacher.subjects &&
                                teacher.subjects.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {teacher.subjects.map((subject) => (
                                      <span
                                        key={`${teacher.id}-subject-${subject.id}`}
                                        className="px-2 py-1 bg-white/70 text-gray-700 rounded-full text-xs font-medium border border-gray-200"
                                      >
                                        {subject.name} · Grade {subject.grade}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400">
                                    No curriculum subjects yet
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  teacher.subscription_type ===
                                  "SCHOOL_SPONSORED"
                                    ? "bg-blue-100 text-blue-700"
                                    : teacher.subscription_type ===
                                      "INDIVIDUAL_PREMIUM"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                {teacher.subscription_type ===
                                "SCHOOL_SPONSORED"
                                  ? "School Sponsored"
                                  : teacher.subscription_type ===
                                    "INDIVIDUAL_PREMIUM"
                                  ? "Premium"
                                  : teacher.subscription_type === "FREE"
                                  ? "Free"
                                  : teacher.subscription_type || "Free"}
                              </span>
                              {isEditingSchool && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      handleUnlinkTeacher(teacher.id)
                                    }
                                    className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                                  >
                                    <FiSlash className="w-3 h-3" /> Unlink
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleToggleBanTeacher(teacher)
                                    }
                                    className={`text-xs font-medium flex items-center gap-1 ${
                                      teacher.is_active
                                        ? "text-red-600 hover:text-red-800"
                                        : "text-green-600 hover:text-green-800"
                                    }`}
                                  >
                                    {teacher.is_active ? (
                                      <>
                                        <FiShield className="w-3 h-3" /> Ban
                                      </>
                                    ) : (
                                      <>
                                        <FiCheck className="w-3 h-3" /> Unban
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">
                      No teachers currently linked to this school
                    </p>
                  )}
                </div>

                {/* Previous Teachers Section (Downgraded) */}
                {selectedSchool.previous_teachers &&
                  selectedSchool.previous_teachers.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                        <span className="text-orange-600">
                          Previously Linked Teachers
                        </span>
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                          {selectedSchool.previous_teacher_count} downgraded
                        </span>
                      </h4>
                      <div className="space-y-2">
                        {selectedSchool.previous_teachers.map((teacher) => (
                          <div
                            key={teacher.id}
                            className={`p-4 rounded-lg border ${
                              !teacher.is_active
                                ? "bg-red-50 border-red-200"
                                : "bg-orange-50 border-orange-200"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900 flex items-center gap-2">
                                  {teacher.full_name}
                                  <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded-full">
                                    DOWNGRADED
                                  </span>
                                  {!teacher.is_active && (
                                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
                                      BANNED
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {teacher.email}
                                </p>
                                <div className="mt-3">
                                  {teacher.subjects &&
                                  teacher.subjects.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {teacher.subjects.map((subject) => (
                                        <span
                                          key={`${teacher.id}-subject-${subject.id}`}
                                          className="px-2 py-1 bg-white/70 text-gray-700 rounded-full text-xs font-medium border border-gray-200"
                                        >
                                          {subject.name} · Grade {subject.grade}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-400">
                                      No curriculum subjects yet
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  teacher.subscription_type ===
                                  "SCHOOL_SPONSORED"
                                    ? "bg-blue-100 text-blue-700"
                                    : teacher.subscription_type ===
                                      "INDIVIDUAL_PREMIUM"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                {teacher.subscription_type ===
                                "SCHOOL_SPONSORED"
                                  ? "School Sponsored"
                                  : teacher.subscription_type ===
                                    "INDIVIDUAL_PREMIUM"
                                  ? "Premium"
                                  : teacher.subscription_type === "FREE"
                                  ? "Free"
                                  : teacher.subscription_type || "Free"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay for School Details */}
        {loadingSchoolDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-3 text-gray-600">Loading school details...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
