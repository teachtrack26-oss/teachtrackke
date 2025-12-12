"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiBook,
  FiUsers,
  FiUpload,
  FiDatabase,
  FiSettings,
  FiTrash2,
  FiEdit,
  FiLock,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiSearch,
  FiEye,
} from "react-icons/fi";

interface CurriculumTemplate {
  id: number;
  subject: string;
  grade: string;
  education_level: string;
  is_active: boolean;
}

interface UserSubject {
  user_email: string;
  subject_name: string;
  grade: string;
  progress_percentage: number;
}

interface User {
  id: number;
  email: string;
  full_name: string;
  role: "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER";
}

const ITEMS_PER_PAGE = 10;

const EDUCATION_LEVELS = [
  "Pre-Primary",
  "Lower Primary",
  "Upper Primary",
  "Junior Secondary",
  "Senior Secondary",
];

const GRADES = [
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

export default function AdminDashboard() {
  const router = useRouter();
  const [templates, setTemplates] = useState<CurriculumTemplate[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"templates" | "users">(
    "templates"
  );

  // Filter states
  const [filterGrade, setFilterGrade] = useState<string>("");
  const [filterLevel, setFilterLevel] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isSchoolAdmin = currentUser?.role === "SCHOOL_ADMIN";

  // Get unique subjects for filter dropdown
  const uniqueSubjects = useMemo(() => {
    const subjects = [...new Set(templates.map((t) => t.subject))].sort();
    return subjects;
  }, [templates]);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      if (filterGrade && template.grade !== filterGrade) return false;
      if (filterLevel && template.education_level !== filterLevel) return false;
      if (filterSubject && template.subject !== filterSubject) return false;
      if (filterStatus === "active" && !template.is_active) return false;
      if (filterStatus === "inactive" && template.is_active) return false;
      return true;
    });
  }, [templates, filterGrade, filterLevel, filterSubject, filterStatus]);

  // Paginated templates
  const paginatedTemplates = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTemplates.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTemplates, currentPage]);

  // Total pages
  const totalPages = Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterGrade, filterLevel, filterSubject, filterStatus]);

  // Clear all filters
  const clearFilters = () => {
    setFilterGrade("");
    setFilterLevel("");
    setFilterSubject("");
    setFilterStatus("");
  };

  // Check if any filter is active
  const hasActiveFilters =
    filterGrade || filterLevel || filterSubject || filterStatus;

  useEffect(() => {
    // Get current user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);

      // Check if user has admin access
      if (user.role !== "SUPER_ADMIN" && user.role !== "SCHOOL_ADMIN") {
        toast.error("Access denied. Admin privileges required.");
        router.push("/dashboard");
        return;
      }
    } else {
      toast.error("Please log in to access admin features");
      router.push("/login");
      return;
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      // Fetch templates
      const templatesRes = await axios.get("/api/v1/curriculum-templates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const templatesData = Array.isArray(templatesRes.data)
        ? templatesRes.data
        : templatesRes.data.templates || [];
      setTemplates(templatesData);

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      toast.error("Failed to load admin data");
      setLoading(false);
    }
  };

  const deleteTemplate = async (id: number, subject: string) => {
    if (
      !confirm(
        `Are you sure you want to delete ${subject}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`/api/v1/curriculum-templates/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Curriculum template deleted");
      fetchData();
    } catch (error) {
      console.error("Failed to delete template:", error);
      toast.error("Failed to delete template");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            {isSuperAdmin
              ? "Manage curriculum templates, users, and monitor system usage"
              : "Manage your school settings, teachers, and view curriculum templates"}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => router.push("/admin/school-settings")}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-white"
          >
            <FiSettings className="w-8 h-8 mb-2" />
            <h3 className="font-semibold">School Settings</h3>
            <p className="text-sm text-indigo-100 mt-1">
              Configure school details
            </p>
          </button>

          <button
            onClick={() => router.push("/admin/users")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <FiUsers className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900">User Management</h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage teachers & roles
            </p>
          </button>

          {/* Curriculum Management - Super Admin Only */}
          {isSuperAdmin && (
            <button
              onClick={() => router.push("/admin/curriculum")}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <FiBook className="w-8 h-8 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900">
                Curriculum Management
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage learning areas
              </p>
            </button>
          )}

          <button
            onClick={() => router.push("/admin/analytics")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <FiDatabase className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-600 mt-1">View usage metrics</p>
          </button>

          {/* Import Curriculum - Super Admin Only */}
          {isSuperAdmin && (
            <button
              onClick={() => router.push("/admin/import-curriculum")}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <FiUpload className="w-8 h-8 text-indigo-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Import Curriculum</h3>
              <p className="text-sm text-gray-600 mt-1">Upload JSON files</p>
            </button>
          )}

          <button
            onClick={() => router.push("/admin/lessons-config")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <FiSettings className="w-8 h-8 text-orange-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Lessons Per Week</h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure lesson frequency
            </p>
          </button>

          {/* Curriculum stats - All Admins */}
          <div className="bg-white p-6 rounded-lg shadow">
            <FiBook className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900">{templates.length}</h3>
            <p className="text-sm text-gray-600 mt-1">Curriculum Templates</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <FiUsers className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900">{users.length}</h3>
            <p className="text-sm text-gray-600 mt-1">Active Users</p>
          </div>

          {/* Active templates stat - All Admins */}
          <div className="bg-white p-6 rounded-lg shadow">
            <FiDatabase className="w-8 h-8 text-purple-600 mb-2" />
            <h3 className="font-semibold text-gray-900">
              {templates.reduce((sum, t) => sum + (t.is_active ? 1 : 0), 0)}
            </h3>
            <p className="text-sm text-gray-600 mt-1">Active Templates</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {/* Curriculum Templates Tab - All Admins can view */}
              <button
                onClick={() => setActiveTab("templates")}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === "templates"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <FiBook className="inline mr-2" />
                Curriculum Templates
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === "users"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <FiUsers className="inline mr-2" />
                Users & Usage
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "templates" && (
              <div>
                <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">
                      All Curriculum Templates
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Showing {filteredTemplates.length} of {templates.length}{" "}
                      templates
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Filter toggle button */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                        showFilters || hasActiveFilters
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <FiFilter className="w-4 h-4" />
                      Filters
                      {hasActiveFilters && (
                        <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                          {
                            [
                              filterGrade,
                              filterLevel,
                              filterSubject,
                              filterStatus,
                            ].filter(Boolean).length
                          }
                        </span>
                      )}
                    </button>
                    {/* Import button - Super Admin Only */}
                    {isSuperAdmin && (
                      <button
                        onClick={() => router.push("/admin/import-curriculum")}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        <FiUpload className="inline mr-2" />
                        Import New
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex flex-wrap gap-4">
                      {/* Education Level Filter */}
                      <div className="flex-1 min-w-[180px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Education Level
                        </label>
                        <select
                          value={filterLevel}
                          onChange={(e) => setFilterLevel(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">All Levels</option>
                          {EDUCATION_LEVELS.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Grade Filter */}
                      <div className="flex-1 min-w-[180px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Grade
                        </label>
                        <select
                          value={filterGrade}
                          onChange={(e) => setFilterGrade(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">All Grades</option>
                          {GRADES.map((grade) => (
                            <option key={grade} value={grade}>
                              {grade}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Subject Filter */}
                      <div className="flex-1 min-w-[180px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subject
                        </label>
                        <select
                          value={filterSubject}
                          onChange={(e) => setFilterSubject(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">All Subjects</option>
                          {uniqueSubjects.map((subject) => (
                            <option key={subject} value={subject}>
                              {subject}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status Filter */}
                      <div className="flex-1 min-w-[180px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">All Status</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          onClick={clearFilters}
                          className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          <FiX className="w-4 h-4" />
                          Clear all filters
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedTemplates.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            {hasActiveFilters
                              ? "No templates match your filters. Try adjusting your search criteria."
                              : "No curriculum templates found."}
                          </td>
                        </tr>
                      ) : (
                        paginatedTemplates.map((template) => (
                          <tr key={template.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">
                                {template.subject}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {template.grade}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {template.education_level}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  template.is_active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {template.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {/* View button for all admins */}
                              <button
                                onClick={() =>
                                  router.push(
                                    `/admin/curriculum/view/${template.id}`
                                  )
                                }
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                title="View curriculum"
                              >
                                <FiEye className="inline" />
                              </button>
                              {/* Edit/Delete buttons - Super Admin Only */}
                              {isSuperAdmin && (
                                <>
                                  <button
                                    onClick={() =>
                                      router.push(
                                        `/admin/curriculum/edit/${template.id}`
                                      )
                                    }
                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                    title="Edit curriculum"
                                  >
                                    <FiEdit className="inline" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      deleteTemplate(
                                        template.id,
                                        template.subject
                                      )
                                    }
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete curriculum"
                                  >
                                    <FiTrash2 className="inline" />
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                    <div className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(
                          currentPage * ITEMS_PER_PAGE,
                          filteredTemplates.length
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">
                        {filteredTemplates.length}
                      </span>{" "}
                      results
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className={`px-3 py-2 rounded-lg border flex items-center gap-1 ${
                          currentPage === 1
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                        }`}
                      >
                        <FiChevronLeft className="w-4 h-4" />
                        Previous
                      </button>

                      {/* Page Numbers */}
                      <div className="hidden sm:flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((page) => {
                            // Show first, last, current, and nearby pages
                            if (page === 1 || page === totalPages) return true;
                            if (Math.abs(page - currentPage) <= 1) return true;
                            return false;
                          })
                          .map((page, index, arr) => (
                            <span key={page} className="flex items-center">
                              {index > 0 && arr[index - 1] !== page - 1 && (
                                <span className="px-2 text-gray-400">...</span>
                              )}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1 rounded-lg ${
                                  currentPage === page
                                    ? "bg-indigo-600 text-white"
                                    : "text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                {page}
                              </button>
                            </span>
                          ))}
                      </div>

                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className={`px-3 py-2 rounded-lg border flex items-center gap-1 ${
                          currentPage === totalPages
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                        }`}
                      >
                        Next
                        <FiChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "users" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">User Management</h2>
                <p className="text-gray-600">
                  User management features coming soon...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
