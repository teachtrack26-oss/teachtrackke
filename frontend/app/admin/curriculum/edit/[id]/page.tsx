"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import {
  FaSave,
  FaPlus,
  FaTrash,
  FaEdit,
  FaChevronDown,
  FaChevronUp,
  FaArrowLeft,
} from "react-icons/fa";

interface Substrand {
  id: number;
  sequence_order: number;
  substrand_name: string;
  specific_learning_outcomes?: string;
  suggested_learning_experiences?: string;
  key_inquiry_questions?: string;
  number_of_lessons: number;
}

interface Strand {
  id: number;
  sequence_order: number;
  strand_name: string;
  substrands: Substrand[];
}

interface Template {
  id: number;
  subject: string;
  grade: string;
  is_active: boolean;
  total_strands: number;
  total_substrands: number;
  total_lessons: number;
  strands: Strand[];
}

export default function EditCurriculumPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedStrands, setExpandedStrands] = useState<Set<number>>(
    new Set()
  );
  const [editingStrand, setEditingStrand] = useState<number | null>(null);
  const [editingSubstrand, setEditingSubstrand] = useState<number | null>(null);

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const response = await api.get(
        `/admin/curriculum-templates/${templateId}`
      );

      setTemplate(response.data);
      // Expand all strands by default
      setExpandedStrands(
        new Set(response.data.strands.map((s: Strand) => s.id))
      );
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error("Admin access required");
        router.push("/dashboard");
      } else if (error.response?.status === 401) {
        router.push("/login");
      } else {
        toast.error("Failed to load curriculum");
      }
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    if (!template) return;

    setSaving(true);
    try {
      await api.put(`/admin/curriculum-templates/${templateId}`, {
        subject: template.subject,
        grade: template.grade,
        is_active: template.is_active,
        strands: template.strands,
      });

      toast.success("Curriculum updated successfully");
    } catch (error) {
      toast.error("Failed to update curriculum");
    } finally {
      setSaving(false);
    }
  };

  const toggleStrand = (strandId: number) => {
    const newExpanded = new Set(expandedStrands);
    if (newExpanded.has(strandId)) {
      newExpanded.delete(strandId);
    } else {
      newExpanded.add(strandId);
    }
    setExpandedStrands(newExpanded);
  };

  const updateTemplateInfo = (field: string, value: any) => {
    if (!template) return;
    setTemplate({ ...template, [field]: value });
  };

  const updateStrand = (strandId: number, field: string, value: any) => {
    if (!template) return;
    const updatedStrands = template.strands.map((strand) =>
      strand.id === strandId ? { ...strand, [field]: value } : strand
    );
    setTemplate({ ...template, strands: updatedStrands });
  };

  const updateSubstrand = (
    strandId: number,
    substrandId: number,
    field: string,
    value: any
  ) => {
    if (!template) return;
    const updatedStrands = template.strands.map((strand) => {
      if (strand.id === strandId) {
        const updatedSubstrands = strand.substrands.map((substrand) =>
          substrand.id === substrandId
            ? { ...substrand, [field]: value }
            : substrand
        );
        return { ...strand, substrands: updatedSubstrands };
      }
      return strand;
    });
    setTemplate({ ...template, strands: updatedStrands });
  };

  const addStrand = () => {
    if (!template) return;
    const newStrand: Strand = {
      id: Date.now(), // Temporary ID
      sequence_order: template.strands.length + 1,
      strand_name: "New Strand",
      substrands: [],
    };
    setTemplate({
      ...template,
      strands: [...template.strands, newStrand],
      total_strands: template.total_strands + 1,
    });
    setExpandedStrands(new Set([...expandedStrands, newStrand.id]));
  };

  const deleteStrand = (strandId: number) => {
    if (!template) return;
    if (!confirm("Are you sure you want to delete this strand?")) return;

    const updatedStrands = template.strands.filter((s) => s.id !== strandId);
    setTemplate({
      ...template,
      strands: updatedStrands,
      total_strands: updatedStrands.length,
    });
  };

  const addSubstrand = (strandId: number) => {
    if (!template) return;
    const strand = template.strands.find((s) => s.id === strandId);
    if (!strand) return;

    const newSubstrand: Substrand = {
      id: Date.now(), // Temporary ID
      sequence_order: strand.substrands.length + 1,
      substrand_name: "New Sub-Strand",
      specific_learning_outcomes: "",
      suggested_learning_experiences: "",
      key_inquiry_questions: "",
      number_of_lessons: 1,
    };

    const updatedStrands = template.strands.map((s) => {
      if (s.id === strandId) {
        return {
          ...s,
          substrands: [...s.substrands, newSubstrand],
        };
      }
      return s;
    });

    setTemplate({
      ...template,
      strands: updatedStrands,
      total_substrands: template.total_substrands + 1,
    });
  };

  const deleteSubstrand = (strandId: number, substrandId: number) => {
    if (!template) return;
    if (!confirm("Are you sure you want to delete this sub-strand?")) return;

    const updatedStrands = template.strands.map((strand) => {
      if (strand.id === strandId) {
        return {
          ...strand,
          substrands: strand.substrands.filter((ss) => ss.id !== substrandId),
        };
      }
      return strand;
    });

    setTemplate({
      ...template,
      strands: updatedStrands,
      total_substrands: template.total_substrands - 1,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading curriculum...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Curriculum not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <FaArrowLeft className="mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Curriculum
            </h1>
            <p className="text-gray-600">
              Modify curriculum structure and content
            </p>
          </div>
          <button
            onClick={saveChanges}
            disabled={saving}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center disabled:bg-gray-400"
          >
            <FaSave className="mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Template Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Curriculum Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={template.subject}
                onChange={(e) => updateTemplateInfo("subject", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade
              </label>
              <input
                type="text"
                value={template.grade}
                onChange={(e) => updateTemplateInfo("grade", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={template.is_active ? "active" : "inactive"}
                onChange={(e) =>
                  updateTemplateInfo("is_active", e.target.value === "active")
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Strands</p>
              <p className="text-2xl font-bold text-blue-600">
                {template.strands.length}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Sub-Strands</p>
              <p className="text-2xl font-bold text-green-600">
                {template.strands.reduce(
                  (sum, s) => sum + s.substrands.length,
                  0
                )}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Total Lessons</p>
              <p className="text-2xl font-bold text-purple-600">
                {template.strands.reduce(
                  (sum, s) =>
                    sum +
                    s.substrands.reduce(
                      (ss, sub) => ss + sub.number_of_lessons,
                      0
                    ),
                  0
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Strands Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Strands</h2>
            <button
              onClick={addStrand}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <FaPlus className="mr-2" />
              Add Strand
            </button>
          </div>

          <div className="space-y-4">
            {template.strands.map((strand, strandIndex) => (
              <div
                key={strand.id}
                className="border border-gray-200 rounded-lg"
              >
                {/* Strand Header */}
                <div className="bg-gray-50 p-4 flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <button
                      onClick={() => toggleStrand(strand.id)}
                      className="mr-3 text-gray-600 hover:text-gray-900"
                    >
                      {expandedStrands.has(strand.id) ? (
                        <FaChevronUp />
                      ) : (
                        <FaChevronDown />
                      )}
                    </button>
                    {editingStrand === strand.id ? (
                      <input
                        type="text"
                        value={strand.strand_name}
                        onChange={(e) =>
                          updateStrand(strand.id, "strand_name", e.target.value)
                        }
                        onBlur={() => setEditingStrand(null)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {strandIndex + 1}. {strand.strand_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {strand.substrands.length} sub-strands
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingStrand(strand.id)}
                      className="text-blue-600 hover:text-blue-800 p-2"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => deleteStrand(strand.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                {/* Strand Content */}
                {expandedStrands.has(strand.id) && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">
                        Sub-Strands
                      </h4>
                      <button
                        onClick={() => addSubstrand(strand.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 flex items-center text-sm"
                      >
                        <FaPlus className="mr-1" />
                        Add Sub-Strand
                      </button>
                    </div>

                    <div className="space-y-3">
                      {strand.substrands.map((substrand, subIndex) => (
                        <div
                          key={substrand.id}
                          className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              {editingSubstrand === substrand.id ? (
                                <input
                                  type="text"
                                  value={substrand.substrand_name}
                                  onChange={(e) =>
                                    updateSubstrand(
                                      strand.id,
                                      substrand.id,
                                      "substrand_name",
                                      e.target.value
                                    )
                                  }
                                  onBlur={() => setEditingSubstrand(null)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  autoFocus
                                />
                              ) : (
                                <h5 className="font-medium text-gray-900">
                                  {strandIndex + 1}.{subIndex + 1}{" "}
                                  {substrand.substrand_name}
                                </h5>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={() =>
                                  setEditingSubstrand(substrand.id)
                                }
                                className="text-blue-600 hover:text-blue-800 p-1"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() =>
                                  deleteSubstrand(strand.id, substrand.id)
                                }
                                className="text-red-600 hover:text-red-800 p-1"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Specific Learning Outcomes
                              </label>
                              <textarea
                                value={
                                  substrand.specific_learning_outcomes || ""
                                }
                                onChange={(e) =>
                                  updateSubstrand(
                                    strand.id,
                                    substrand.id,
                                    "specific_learning_outcomes",
                                    e.target.value
                                  )
                                }
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Suggested Learning Experiences
                              </label>
                              <textarea
                                value={
                                  substrand.suggested_learning_experiences || ""
                                }
                                onChange={(e) =>
                                  updateSubstrand(
                                    strand.id,
                                    substrand.id,
                                    "suggested_learning_experiences",
                                    e.target.value
                                  )
                                }
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Key Inquiry Questions
                              </label>
                              <textarea
                                value={substrand.key_inquiry_questions || ""}
                                onChange={(e) =>
                                  updateSubstrand(
                                    strand.id,
                                    substrand.id,
                                    "key_inquiry_questions",
                                    e.target.value
                                  )
                                }
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Number of Lessons
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={substrand.number_of_lessons}
                                onChange={(e) =>
                                  updateSubstrand(
                                    strand.id,
                                    substrand.id,
                                    "number_of_lessons",
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {strand.substrands.length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                          No sub-strands yet. Click "Add Sub-Strand" to create
                          one.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {template.strands.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No strands yet. Click "Add Strand" to create one.
              </p>
            )}
          </div>
        </div>

        {/* Save Button at Bottom */}
        <div className="flex justify-end">
          <button
            onClick={saveChanges}
            disabled={saving}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 flex items-center disabled:bg-gray-400 text-lg"
          >
            <FaSave className="mr-2" />
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
