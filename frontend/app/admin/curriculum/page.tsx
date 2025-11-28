"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiX,
  FiFilter,
} from "react-icons/fi";

interface CurriculumTemplate {
  id: number;
  education_level: string;
  grade: string;
  subject: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TemplateFormData {
  education_level: string;
  grade: string;
  subject: string;
  is_active: boolean;
}

const EDUCATION_LEVELS = [
  "Pre-Primary",
  "Lower Primary",
  "Upper Primary",
  "Junior Secondary",
  "Senior Secondary",
];

const GRADES_BY_LEVEL: Record<string, string[]> = {
  "Pre-Primary": ["PP1", "PP2"],
  "Lower Primary": ["Grade 1", "Grade 2", "Grade 3"],
  "Upper Primary": ["Grade 4", "Grade 5", "Grade 6"],
  "Junior Secondary": ["Grade 7", "Grade 8", "Grade 9"],
  "Senior Secondary": ["Grade 10", "Grade 11", "Grade 12"],
};

export default function CurriculumManagementPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<CurriculumTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<
    CurriculumTemplate[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<CurriculumTemplate | null>(null);

  // Check for Super Admin access on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role !== "SUPER_ADMIN") {
        toast.error("Access denied. Super Admin privileges required.");
        router.push("/admin/dashboard");
        return;
      }
    }
  }, [router]);

  const [formData, setFormData] = useState<TemplateFormData>({
    education_level: "",
    grade: "",
    subject: "",
    is_active: true,
  });

  // Filters
  const [filterLevel, setFilterLevel] = useState<string>("");
  const [filterGrade, setFilterGrade] = useState<string>("");
  const [filterActive, setFilterActive] = useState<string>("all");

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [templates, filterLevel, filterGrade, filterActive]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await axios.get("/api/v1/admin/curriculum-templates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTemplates(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch curriculum templates:", error);
      toast.error("Failed to load curriculum templates");
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...templates];

    if (filterLevel) {
      filtered = filtered.filter((t) => t.education_level === filterLevel);
    }

    if (filterGrade) {
      filtered = filtered.filter((t) => t.grade === filterGrade);
    }

    if (filterActive !== "all") {
      const isActive = filterActive === "active";
      filtered = filtered.filter((t) => t.is_active === isActive);
    }

    setFilteredTemplates(filtered);
  };

  const resetForm = () => {
    setFormData({
      education_level: "",
      grade: "",
      subject: "",
      is_active: true,
    });
    setEditingTemplate(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.education_level || !formData.grade || !formData.subject) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      await axios.post("/api/v1/admin/curriculum-templates", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Curriculum template added successfully");
      setShowAddModal(false);
      resetForm();
      fetchTemplates();
    } catch (error: any) {
      console.error("Failed to add template:", error);
      const errorMsg =
        error.response?.data?.detail || "Failed to add curriculum template";
      toast.error(errorMsg);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTemplate) return;

    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(
        `/api/v1/admin/curriculum-templates/${editingTemplate.id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Curriculum template updated successfully");
      setShowEditModal(false);
      resetForm();
      fetchTemplates();
    } catch (error: any) {
      console.error("Failed to update template:", error);
      const errorMsg =
        error.response?.data?.detail || "Failed to update curriculum template";
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id: number, subjectName: string) => {
    if (
      !confirm(
        `Are you sure you want to deactivate "${subjectName}"? This will soft-delete the template.`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`/api/v1/admin/curriculum-templates/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Curriculum template deactivated");
      fetchTemplates();
    } catch (error) {
      console.error("Failed to delete template:", error);
      toast.error("Failed to deactivate template");
    }
  };

  const openEditModal = (template: CurriculumTemplate) => {
    setEditingTemplate(template);
    setFormData({
      education_level: template.education_level,
      grade: template.grade,
      subject: template.subject,
      is_active: template.is_active,
    });
    setShowEditModal(true);
  };

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.education_level]) {
      acc[template.education_level] = [];
    }
    acc[template.education_level].push(template);
    return acc;
  }, {} as Record<string, CurriculumTemplate[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading curriculum templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Curriculum Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage learning areas across all education levels
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <FiPlus />
            Add New Subject
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FiFilter className="text-gray-500" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Education Level
              </label>
              <select
                value={filterLevel}
                onChange={(e) => {
                  setFilterLevel(e.target.value);
                  setFilterGrade("");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Levels</option>
                {EDUCATION_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade
              </label>
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                disabled={!filterLevel}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              >
                <option value="">All Grades</option>
                {filterLevel &&
                  GRADES_BY_LEVEL[filterLevel]?.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterLevel("");
                  setFilterGrade("");
                  setFilterActive("all");
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-indigo-600">
              {templates.length}
            </div>
            <div className="text-sm text-gray-600">Total Templates</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {templates.filter((t) => t.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Active Templates</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">
              {Object.keys(groupedTemplates).length}
            </div>
            <div className="text-sm text-gray-600">Education Levels</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">
              {filteredTemplates.length}
            </div>
            <div className="text-sm text-gray-600">Filtered Results</div>
          </div>
        </div>

        {/* Templates by Education Level */}
        <div className="space-y-6">
          {Object.keys(groupedTemplates).length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No curriculum templates found</p>
            </div>
          ) : (
            EDUCATION_LEVELS.filter((level) => groupedTemplates[level]).map(
              (level) => (
                <div key={level} className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">{level}</h2>
                    <p className="text-sm text-gray-600">
                      {groupedTemplates[level].length} subject(s)
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Subject Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Grade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Last Updated
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {groupedTemplates[level].map((template) => (
                          <tr key={template.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">
                                {template.subject}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {template.grade}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  template.is_active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {template.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(
                                template.updated_at
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium">
                              <button
                                onClick={() => openEditModal(template)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                title="Edit"
                              >
                                <FiEdit className="inline w-5 h-5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(template.id, template.subject)
                                }
                                className="text-red-600 hover:text-red-900"
                                title="Deactivate"
                              >
                                <FiTrash2 className="inline w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )
          )}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Add New Subject
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Education Level *
                  </label>
                  <select
                    value={formData.education_level}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        education_level: e.target.value,
                        grade: "",
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select Level</option>
                    {EDUCATION_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade *
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) =>
                      setFormData({ ...formData, grade: e.target.value })
                    }
                    disabled={!formData.education_level}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                    required
                  >
                    <option value="">Select Grade</option>
                    {formData.education_level &&
                      GRADES_BY_LEVEL[formData.education_level]?.map(
                        (grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        )
                      )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Mathematics"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active_add"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="is_active_add"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Active
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add Subject
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Edit Subject
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Education Level *
                  </label>
                  <select
                    value={formData.education_level}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        education_level: e.target.value,
                        grade: "",
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select Level</option>
                    {EDUCATION_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade *
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) =>
                      setFormData({ ...formData, grade: e.target.value })
                    }
                    disabled={!formData.education_level}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                    required
                  >
                    <option value="">Select Grade</option>
                    {formData.education_level &&
                      GRADES_BY_LEVEL[formData.education_level]?.map(
                        (grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        )
                      )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Mathematics"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active_edit"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="is_active_edit"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Active
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Update Subject
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
