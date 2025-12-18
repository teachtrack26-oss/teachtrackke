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
  FaBan,
  FaCheck,
  FaEdit,
  FaPlus,
  FaTimes,
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
  is_active: boolean;
  role: string; // Added role field
  auth_provider: string;
  created_at: string;
  subjects_count: number;
  subjects: Subject[];
  subscription_type?: string;
  subscription_status?: string;
}

interface UserFormData {
  full_name: string;
  email: string;
  school: string;
  grade_level: string;
  role: string;
  password?: string;
}

const ALL_GRADES = [
  "PP1",
  "PP2",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    full_name: "",
    email: "",
    school: "",
    grade_level: "",
    role: "TEACHER",
    password: "",
  });
  const [subscriptionData, setSubscriptionData] = useState({
    type: "FREE",
    status: "ACTIVE",
  });

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

  const toggleGrade = (grade: string) => {
    const currentGrades = formData.grade_level
      ? formData.grade_level
          .split(",")
          .map((g) => g.trim())
          .filter((g) => g)
      : [];
    let newGrades;
    if (currentGrades.includes(grade)) {
      newGrades = currentGrades.filter((g) => g !== grade);
    } else {
      newGrades = [...currentGrades, grade];
    }
    // Sort grades based on ALL_GRADES order
    newGrades.sort((a, b) => ALL_GRADES.indexOf(a) - ALL_GRADES.indexOf(b));
    setFormData({ ...formData, grade_level: newGrades.join(", ") });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/admin/users", formData);
      toast.success("User created successfully");
      setIsCreateModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      toast.error(
        typeof detail === "string" ? detail : "Failed to create user"
      );
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const payload: any = { ...formData };
      if (!payload.password) delete payload.password; // Don't send empty password

      await api.patch(`/admin/users/${currentUser.id}`, payload);
      toast.success("User updated successfully");
      setIsEditModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      toast.error(
        typeof detail === "string" ? detail : "Failed to update user"
      );
    }
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setCurrentUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      school: user.school || "",
      grade_level: user.grade_level || "",
      role: user.role || "TEACHER",
      password: "",
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      school: "",
      grade_level: "",
      role: "TEACHER",
      password: "",
    });
    setCurrentUser(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on search
    fetchUsers();
  };

  const openSubscriptionModal = (user: User) => {
    setCurrentUser(user);
    setSubscriptionData({
      type: user.subscription_type || "FREE",
      status: user.subscription_status || "ACTIVE",
    });
    setIsSubscriptionModalOpen(true);
  };

  const handleSubscriptionUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      await api.put(`/admin/users/${currentUser.id}/subscription`, {
        subscription_type: subscriptionData.type,
        subscription_status: subscriptionData.status,
      });
      toast.success("Subscription updated successfully");
      setIsSubscriptionModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Failed to update subscription");
    }
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

  const toggleBanUser = async (userId: number, isActive: boolean) => {
    const action = isActive ? "ban" : "unban";
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      await api.post(`/admin/users/${userId}/${action}`);
      toast.success(`User ${action}ned successfully`);
      fetchUsers();
    } catch (error: any) {
      toast.error(`Failed to ${action} user`);
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
      await api.post(`/admin/users/${userId}/impersonate`);
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
    <div className="min-h-screen bg-gray-50 p-8 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              User Management
            </h1>
            <p className="text-gray-600">
              Manage all registered teachers, view their subjects and progress
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <FaPlus className="mr-2" />
            Add User
          </button>
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
                        Subscription
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
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 whitespace-nowrap">
                                {user.school}
                              </div>
                              <div className="text-sm text-gray-500 max-w-[200px] whitespace-normal">
                                {user.grade_level}
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
                                  user.role === "SUPER_ADMIN"
                                    ? "bg-red-100 text-red-800"
                                    : user.role === "SCHOOL_ADMIN"
                                    ? "bg-blue-100 text-blue-800"
                                    : user.is_admin
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {user.role === "SUPER_ADMIN"
                                  ? "Super Admin"
                                  : user.role === "SCHOOL_ADMIN"
                                  ? "School Admin"
                                  : user.role === "TEACHER"
                                  ? "Teacher"
                                  : user.is_admin
                                  ? "Admin"
                                  : "Teacher"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {user.subscription_type || "FREE"}
                              </div>
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.subscription_status === "ACTIVE"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {user.subscription_status || "INACTIVE"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openSubscriptionModal(user)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="Manage Subscription"
                                >
                                  <FaUserShield />
                                </button>
                                <button
                                  onClick={() => openEditModal(user)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit user details"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleImpersonate(user.id)}
                                  className="text-purple-600 hover:text-purple-900"
                                  title="Login as this user"
                                >
                                  <FaSignInAlt />
                                </button>
                                <button
                                  onClick={() =>
                                    toggleBanUser(user.id, user.is_active)
                                  }
                                  className={`${
                                    user.is_active
                                      ? "text-orange-600 hover:text-orange-900"
                                      : "text-green-600 hover:text-green-900"
                                  }`}
                                  title={
                                    user.is_active ? "Ban user" : "Unban user"
                                  }
                                >
                                  {user.is_active ? <FaBan /> : <FaCheck />}
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

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New User</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  >
                    <option value="TEACHER">Teacher</option>
                    <option value="SCHOOL_ADMIN">School Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    School
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.school}
                    onChange={(e) =>
                      setFormData({ ...formData, school: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade Levels (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-gray-50">
                    {ALL_GRADES.map((grade) => (
                      <label
                        key={grade}
                        className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={
                            formData.grade_level
                              ? formData.grade_level
                                  .split(",")
                                  .map((g) => g.trim())
                                  .includes(grade)
                              : false
                          }
                          onChange={() => toggleGrade(grade)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{grade}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {formData.grade_level || "None"}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit User</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  >
                    <option value="TEACHER">Teacher</option>
                    <option value="SCHOOL_ADMIN">School Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    School
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.school}
                    onChange={(e) =>
                      setFormData({ ...formData, school: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade Levels (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-gray-50">
                    {ALL_GRADES.map((grade) => (
                      <label
                        key={grade}
                        className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={
                            formData.grade_level
                              ? formData.grade_level
                                  .split(",")
                                  .map((g) => g.trim())
                                  .includes(grade)
                              : false
                          }
                          onChange={() => toggleGrade(grade)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{grade}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {formData.grade_level || "None"}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {isSubscriptionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Manage Subscription</h2>
              <button
                onClick={() => setIsSubscriptionModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubscriptionUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Subscription Type
                  </label>
                  <select
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    value={subscriptionData.type}
                    onChange={(e) =>
                      setSubscriptionData({
                        ...subscriptionData,
                        type: e.target.value,
                      })
                    }
                  >
                    <option value="FREE">Free</option>
                    <option value="SCHOOL_SPONSORED">School Sponsored</option>
                    <option value="INDIVIDUAL_BASIC">
                      Individual Basic (Termly)
                    </option>
                    <option value="INDIVIDUAL_PREMIUM">
                      Individual Premium (Yearly)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    value={subscriptionData.status}
                    onChange={(e) =>
                      setSubscriptionData({
                        ...subscriptionData,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="PAST_DUE">Past Due</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsSubscriptionModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
