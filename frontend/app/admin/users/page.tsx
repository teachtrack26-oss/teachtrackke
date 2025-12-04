"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import {
  FaTrash,
  FaUserShield,
  FaUser,
  FaChartBar,
  FaSync,
  FaChevronDown,
  FaChevronUp,
  FaSignInAlt,
  FaSearch,
  FaFilter,
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

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Bulk Actions
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  useEffect(() => {
    fetchUsers();
  }, [page, limit, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
        role: roleFilter || undefined,
      };

      if (search) params.search = search;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await api.get("/admin/users", { params });
      setUsers(response.data.users);
      setTotal(response.data.total);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error("Admin access required");
        router.push("/dashboard");
      } else if (error.response?.status === 401) {
        router.push("/login");
      } else {
        toast.error("Failed to load users");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on search
    fetchUsers();
  };

  const toggleUserRole = async (userId: number, currentIsAdmin: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, {
        is_admin: !currentIsAdmin,
      });

      toast.success(
        currentIsAdmin ? "User demoted from admin" : "User promoted to admin"
      );

      fetchUsers();
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const message =
        typeof detail === "string" ? detail : "Failed to update user role";
      toast.error(message);
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
      await api.delete(`/admin/users/${userId}`);

      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const message =
        typeof detail === "string" ? detail : "Failed to delete user";
      toast.error(message);
    }
  };

  const handleBulkDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await api.post("/admin/users/bulk-delete", { user_ids: selectedUsers });
      toast.success("Users deleted successfully");
      setSelectedUsers([]);
      fetchUsers();
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const message =
        typeof detail === "string" ? detail : "Failed to delete users";
      toast.error(message);
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
      await api.post(
        `/admin/users/${userId}/reset-progress`,
        subjectId ? { subject_id: subjectId } : {}
      );

      toast.success("Progress reset successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error("Failed to reset progress");
    }
  };

  const handleImpersonate = async (userId: number) => {
    try {
      const response = await api.post(`/admin/users/${userId}/impersonate`);
      const { access_token } = response.data;

      localStorage.setItem("accessToken", access_token);

      const userResponse = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      localStorage.setItem("user", JSON.stringify(userResponse.data));
      window.location.href = "/dashboard";
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const message =
        typeof detail === "string" ? detail : "Failed to impersonate user";
      toast.error(message);
    }
  };

  const toggleExpanded = (userId: number) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  };

  const toggleSelectUser = (id: number) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter((uid) => uid !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const totalPages = Math.ceil(total / limit);

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
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
            </div>
          </div>
          {/* Other stats cards removed or simplified as they depend on full data */}
        </div>

        {/* Filters & Actions Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search & Filters */}
            <form
              onSubmit={handleSearch}
              className="flex flex-1 gap-4 flex-wrap"
            >
              <div className="relative flex-1 min-w-[200px]">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, school..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="relative min-w-[150px]">
                <FaFilter className="absolute left-3 top-3 text-gray-400" />
                <select
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admins</option>
                  <option value="teacher">Teachers</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </form>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaTrash className="mr-2" />
                Delete Selected ({selectedUsers.length})
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={
                            users.length > 0 &&
                            selectedUsers.length === users.length
                          }
                          onChange={toggleSelectAll}
                        />
                      </th>
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
                    {users.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          No users found matching your criteria
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <React.Fragment key={user.id}>
                          <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={selectedUsers.includes(user.id)}
                                onChange={() => toggleSelectUser(user.id)}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.full_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {user.email}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    Joined:{" "}
                                    {new Date(
                                      user.created_at
                                    ).toLocaleDateString()}
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
                                  onClick={() => handleImpersonate(user.id)}
                                  className="text-purple-600 hover:text-purple-900"
                                  title="Login as this user"
                                >
                                  <FaSignInAlt />
                                </button>
                                <button
                                  onClick={() =>
                                    toggleUserRole(user.id, user.is_admin)
                                  }
                                  className="text-blue-600 hover:text-blue-900"
                                  title={
                                    user.is_admin
                                      ? "Remove admin"
                                      : "Make admin"
                                  }
                                >
                                  <FaUserShield />
                                </button>
                                <button
                                  onClick={() =>
                                    resetProgress(user.id, user.email)
                                  }
                                  className="text-yellow-600 hover:text-yellow-900"
                                  title="Reset all progress"
                                >
                                  <FaSync />
                                </button>
                                <button
                                  onClick={() =>
                                    deleteUser(user.id, user.email)
                                  }
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete user"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded subjects row */}
                          {expandedUser === user.id &&
                            user.subjects.length > 0 && (
                              <tr>
                                <td
                                  colSpan={6}
                                  className="px-6 py-4 bg-gray-50"
                                >
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
                                            {subject.progress_percentage.toFixed(
                                              1
                                            )}
                                            %)
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {(page - 1) * limit + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(page * limit, total)}
                      </span>{" "}
                      of <span className="font-medium">{total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <FaChevronDown className="h-5 w-5 transform rotate-90" />
                      </button>
                      {/* Simple page numbers - can be improved for many pages */}
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        // Logic to show relevant pages around current page could go here
                        // For now, just showing first 5 or simple logic
                        let p = page - 2 + i;
                        if (page < 3) p = i + 1;
                        if (p > totalPages) return null;
                        if (p < 1) return null;

                        return (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === p
                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <FaChevronDown className="h-5 w-5 transform -rotate-90" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
