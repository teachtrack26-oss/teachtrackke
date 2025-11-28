"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  FiUsers, FiTrendingUp, FiBriefcase, FiBook, FiShield, 
  FiZap, FiSearch, FiFilter, FiCheck, FiX 
} from "react-icons/fi";

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
}

interface School {
  id: number;
  name: string;
  admin_email: string;
  teacher_count: number;
  max_teachers: number;
  subscription_status: string;
  created_at: string;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "schools">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      
      // Fetch stats
      const statsRes = await axios.get("/api/v1/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(statsRes.data);

      // Fetch users
      const usersRes = await axios.get("/api/v1/admin/users?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(usersRes.data.users || []);

      // Fetch schools
      const schoolsRes = await axios.get("/api/v1/admin/schools", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchools(schoolsRes.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeUser = async (userId: number) => {
    if (!confirm("Upgrade this user to Premium?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(`/api/v1/admin/users/${userId}/upgrade`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User upgraded to Premium!");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to upgrade user");
    }
  };

  const handleBanUser = async (userId: number) => {
    if (!confirm("Are you sure you want to ban this user?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`/api/v1/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User banned successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to ban user");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="p-3 bg-red-100 rounded-xl">
            <FiShield className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.total_schools}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.total_subjects}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.subscriptions.premium}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Breakdown */}
        {stats && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Subscription Distribution</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-orange-50 rounded-xl">
                <p className="text-sm text-gray-600">Individual Basic</p>
                <p className="text-3xl font-bold text-orange-600">{stats.subscriptions.basic}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl">
                <p className="text-sm text-gray-600">Individual Premium</p>
                <p className="text-3xl font-bold text-purple-600">{stats.subscriptions.premium}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-gray-600">School Sponsored</p>
                <p className="text-3xl font-bold text-blue-600">{stats.subscriptions.school_sponsored}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "users"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            All Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("schools")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "schools"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Schools ({schools.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by email or name..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Roles</option>
                  <option value="TEACHER">Teachers</option>
                  <option value="SCHOOL_ADMIN">School Admins</option>
                  <option value="SUPER_ADMIN">Super Admins</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium">User</th>
                    <th className="px-6 py-4 text-left font-medium">Role</th>
                    <th className="px-6 py-4 text-left font-medium">Subscription</th>
                    <th className="px-6 py-4 text-left font-medium">Subjects</th>
                    <th className="px-6 py-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{user.full_name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "SUPER_ADMIN" ? "bg-red-100 text-red-700" :
                          user.role === "SCHOOL_ADMIN" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.subscription_type === "INDIVIDUAL_PREMIUM" ? "bg-purple-100 text-purple-700" :
                          user.subscription_type === "SCHOOL_SPONSORED" ? "bg-blue-100 text-blue-700" :
                          "bg-orange-100 text-orange-700"
                        }`}>
                          {user.subscription_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{user.subject_count}</td>
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
                            <button
                              onClick={() => handleBanUser(user.id)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                            >
                              <FiX className="inline w-3 h-3 mr-1" />
                              Ban
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Schools Tab */}
        {activeTab === "schools" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium">School Name</th>
                    <th className="px-6 py-4 text-left font-medium">Admin</th>
                    <th className="px-6 py-4 text-left font-medium">Teachers</th>
                    <th className="px-6 py-4 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schools.map((school) => (
                    <tr key={school.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{school.name}</td>
                      <td className="px-6 py-4 text-gray-600">{school.admin_email}</td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 font-medium">{school.teacher_count}</span>
                        <span className="text-gray-500"> / {school.max_teachers}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {school.subscription_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
