"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaTrash,
  FaUserShield,
  FaUser,
  FaChartBar,
  FaSync,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

interface Subject {
  id: number;
  subject_name: string;
  grade: string;
  total_lessons: number;
  lessons_completed: number;
  progress_percentage: number;
}

interface User {
  id: number;
  email: string;
  full_name: string;
  school: string;
  grade_level: string;
  is_admin: boolean;
  auth_provider: string;
  created_at: string;
  subjects_count: number;
  subjects: Subject[];
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await axios.get(
        "http://192.168.0.102:8000/api/v1/admin/users",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUsers(response.data.users);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error("Admin access required");
        router.push("/dashboard");
      } else {
        toast.error("Failed to load users");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleUserRole = async (userId: number, currentIsAdmin: boolean) => {
    try {
      const token = localStorage.getItem("accessToken");

      await axios.patch(
        `http://192.168.0.102:8000/api/v1/admin/users/${userId}/role`,
        { is_admin: !currentIsAdmin },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(
        currentIsAdmin ? "User demoted from admin" : "User promoted to admin"
      );

      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update user role");
    }
  };

  const deleteUser = async (userId: number, userEmail: string) => {
    if (
      !confirm(
        `Are you sure you want to delete user ${userEmail}? This will delete all their subjects and progress.`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");

      await axios.delete(
        `http://192.168.0.102:8000/api/v1/admin/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to delete user");
    }
  };

  const resetProgress = async (
    userId: number,
    userEmail: string,
    subjectId?: number
  ) => {
    const message = subjectId
      ? "Are you sure you want to reset this subject progress?"
      : `Are you sure you want to reset ALL progress for ${userEmail}?`;

    if (!confirm(message)) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");

      await axios.post(
        `http://192.168.0.102:8000/api/v1/admin/users/${userId}/reset-progress`,
        subjectId ? { subject_id: subjectId } : {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Progress reset successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error("Failed to reset progress");
    }
  };

  const toggleExpanded = (userId: number) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            User Management
          </h1>
          <p className="text-gray-600">
            Manage all registered teachers, view their subjects and progress
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-3 mr-4">
                <FaUser className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-3 mr-4">
                <FaUserShield className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Admin Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter((u) => u.is_admin).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-full p-3 mr-4">
                <FaChartBar className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Subjects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.reduce((sum, u) => sum + u.subjects_count, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    School / Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subjects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <>
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.school}
                        </div>
                        <div className="text-sm text-gray-500">
                          Grade {user.grade_level}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {user.subjects_count} subjects
                          </span>
                          {user.subjects_count > 0 && (
                            <button
                              onClick={() => toggleExpanded(user.id)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              {expandedUser === user.id ? (
                                <FaChevronUp />
                              ) : (
                                <FaChevronDown />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.is_admin
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.is_admin ? "Admin" : "Teacher"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              toggleUserRole(user.id, user.is_admin)
                            }
                            className="text-blue-600 hover:text-blue-900"
                            title={
                              user.is_admin ? "Remove admin" : "Make admin"
                            }
                          >
                            <FaUserShield />
                          </button>
                          <button
                            onClick={() => resetProgress(user.id, user.email)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Reset all progress"
                          >
                            <FaSync />
                          </button>
                          <button
                            onClick={() => deleteUser(user.id, user.email)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete user"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded subjects row */}
                    {expandedUser === user.id && user.subjects.length > 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-700 mb-3">
                              Subjects & Progress:
                            </h4>
                            {user.subjects.map((subject) => (
                              <div
                                key={subject.id}
                                className="bg-white p-4 rounded border border-gray-200"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <span className="font-medium text-gray-900">
                                      {subject.subject_name}
                                    </span>
                                    <span className="text-sm text-gray-500 ml-2">
                                      ({subject.grade})
                                    </span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      resetProgress(
                                        user.id,
                                        user.email,
                                        subject.id
                                      )
                                    }
                                    className="text-sm text-yellow-600 hover:text-yellow-800 flex items-center"
                                  >
                                    <FaSync className="mr-1" />
                                    Reset
                                  </button>
                                </div>
                                <div className="flex items-center">
                                  <div className="flex-1">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{
                                          width: `${subject.progress_percentage}%`,
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                  <span className="ml-4 text-sm font-medium text-gray-700">
                                    {subject.lessons_completed}/
                                    {subject.total_lessons} lessons (
                                    {subject.progress_percentage.toFixed(1)}%)
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
