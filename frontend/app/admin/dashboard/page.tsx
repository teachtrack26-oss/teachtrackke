"use client";

import { useEffect, useState } from "react";
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

export default function AdminDashboard() {
  const router = useRouter();
  const [templates, setTemplates] = useState<CurriculumTemplate[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"templates" | "users">(
    "templates"
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      // Fetch templates
      const templatesRes = await axios.get("/api/v1/curriculum-templates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTemplates(templatesRes.data.templates || []);

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
            Manage curriculum templates and monitor system usage
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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

          <button
            onClick={() => router.push("/admin/curriculum")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <FiBook className="w-8 h-8 text-purple-600 mb-2" />
            <h3 className="font-semibold text-gray-900">
              Curriculum Management
            </h3>
            <p className="text-sm text-gray-600 mt-1">Manage learning areas</p>
          </button>

          <button
            onClick={() => router.push("/admin/analytics")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <FiDatabase className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-600 mt-1">View usage metrics</p>
          </button>

          <button
            onClick={() => router.push("/admin/import-curriculum")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <FiUpload className="w-8 h-8 text-indigo-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Import Curriculum</h3>
            <p className="text-sm text-gray-600 mt-1">Upload JSON files</p>
          </button>

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
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    All Curriculum Templates
                  </h2>
                  <button
                    onClick={() => router.push("/admin/import-curriculum")}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <FiUpload className="inline mr-2" />
                    Import New
                  </button>
                </div>

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
                      {templates.map((template) => (
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
                                deleteTemplate(template.id, template.subject)
                              }
                              className="text-red-600 hover:text-red-900"
                              title="Delete curriculum"
                            >
                              <FiTrash2 className="inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
