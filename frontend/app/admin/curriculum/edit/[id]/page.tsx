"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import {
  FaSave,
  FaPlus,
  FaTrash,
  FaEdit,
  FaChevronDown,
  FaChevronUp,
  FaArrowLeft,
  FaArrowUp,
  FaArrowDown,
  FaCopy,
  FaCompress,
  FaExpand,
} from "react-icons/fa";

interface Substrand {
  id: number;
  sequence_order: number;
  substrand_name: string;
  specific_learning_outcomes?: string | string[];
  suggested_learning_experiences?: string | string[];
  key_inquiry_questions?: string | string[];
  core_competencies?: string | string[];
  values?: string | string[];
  pcis?: string | string[];
  links_to_other_subjects?: string | string[];
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
  const { user, isAuthenticated, loading: authLoading } = useCustomAuth();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedStrands, setExpandedStrands] = useState<Set<number>>(
    new Set()
  );
  const [editingStrand, setEditingStrand] = useState<number | null>(null);
  const [editingSubstrand, setEditingSubstrand] = useState<number | null>(null);
  const [newlyAddedId, setNewlyAddedId] = useState<number | null>(null);

  // Check for Super Admin access on mount
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (user?.role !== "SUPER_ADMIN") {
        toast.error("Access denied. Super Admin privileges required.");
        router.push("/admin/dashboard");
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  useEffect(() => {
    if (newlyAddedId) {
      const element = document.getElementById(`item-${newlyAddedId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        setNewlyAddedId(null);
      }
    }
  }, [newlyAddedId, template]);

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
      // Sanitize payload to match backend schema and remove temporary IDs
      const sanitizedStrands = template.strands.map((s) => ({
        id: s.id > 2000000000 ? undefined : s.id, // Assume IDs > 2 billion are temp timestamps
        strand_name: s.strand_name,
        sequence_order: s.sequence_order,
        substrands: s.substrands.map((ss) => ({
          id: ss.id > 2000000000 ? undefined : ss.id,
          substrand_name: ss.substrand_name,
          number_of_lessons: ss.number_of_lessons,
          specific_learning_outcomes:
            typeof ss.specific_learning_outcomes === "string"
              ? ss.specific_learning_outcomes
                  .split("\n")
                  .filter((line) => line.trim() !== "")
              : ss.specific_learning_outcomes,
          suggested_learning_experiences:
            typeof ss.suggested_learning_experiences === "string"
              ? ss.suggested_learning_experiences
                  .split("\n")
                  .filter((line) => line.trim() !== "")
              : ss.suggested_learning_experiences,
          key_inquiry_questions:
            typeof ss.key_inquiry_questions === "string"
              ? ss.key_inquiry_questions
                  .split("\n")
                  .filter((line) => line.trim() !== "")
              : ss.key_inquiry_questions,
          core_competencies:
            typeof ss.core_competencies === "string"
              ? ss.core_competencies
                  .split("\n")
                  .filter((line) => line.trim() !== "")
              : ss.core_competencies,
          values:
            typeof ss.values === "string"
              ? ss.values.split("\n").filter((line) => line.trim() !== "")
              : ss.values,
          pcis:
            typeof ss.pcis === "string"
              ? ss.pcis.split("\n").filter((line) => line.trim() !== "")
              : ss.pcis,
          links_to_other_subjects:
            typeof ss.links_to_other_subjects === "string"
              ? ss.links_to_other_subjects
                  .split("\n")
                  .filter((line) => line.trim() !== "")
              : ss.links_to_other_subjects,
          sequence_order: ss.sequence_order,
        })),
      }));

      await api.put(`/admin/curriculum-templates/${templateId}`, {
        subject: template.subject,
        grade: template.grade,
        is_active: template.is_active,
        strands: sanitizedStrands,
      });

      toast.success("Curriculum updated successfully");
      fetchTemplate(); // Refresh to get real IDs
    } catch (error) {
      console.error("Failed to update curriculum:", error);
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

  const moveStrand = (index: number, direction: "up" | "down") => {
    if (!template) return;
    const newStrands = [...template.strands];
    if (direction === "up" && index > 0) {
      [newStrands[index], newStrands[index - 1]] = [
        newStrands[index - 1],
        newStrands[index],
      ];
    } else if (direction === "down" && index < newStrands.length - 1) {
      [newStrands[index], newStrands[index + 1]] = [
        newStrands[index + 1],
        newStrands[index],
      ];
    }
    // Update sequence orders
    newStrands.forEach((s, i) => (s.sequence_order = i + 1));
    setTemplate({ ...template, strands: newStrands });
  };

  const moveSubstrand = (
    strandId: number,
    subIndex: number,
    direction: "up" | "down"
  ) => {
    if (!template) return;
    const updatedStrands = template.strands.map((strand) => {
      if (strand.id === strandId) {
        const newSubstrands = [...strand.substrands];
        if (direction === "up" && subIndex > 0) {
          [newSubstrands[subIndex], newSubstrands[subIndex - 1]] = [
            newSubstrands[subIndex - 1],
            newSubstrands[subIndex],
          ];
        } else if (
          direction === "down" &&
          subIndex < newSubstrands.length - 1
        ) {
          [newSubstrands[subIndex], newSubstrands[subIndex + 1]] = [
            newSubstrands[subIndex + 1],
            newSubstrands[subIndex],
          ];
        }
        // Update sequence orders
        newSubstrands.forEach((s, i) => (s.sequence_order = i + 1));
        return { ...strand, substrands: newSubstrands };
      }
      return strand;
    });
    setTemplate({ ...template, strands: updatedStrands });
  };

  const duplicateSubstrand = (strandId: number, substrand: Substrand) => {
    if (!template) return;
    const newId = Date.now();
    const updatedStrands = template.strands.map((strand) => {
      if (strand.id === strandId) {
        const newSubstrand = {
          ...substrand,
          id: newId,
          substrand_name: `${substrand.substrand_name} (Copy)`,
          sequence_order: strand.substrands.length + 1,
        };
        return {
          ...strand,
          substrands: [...strand.substrands, newSubstrand],
        };
      }
      return strand;
    });
    setTemplate({
      ...template,
      strands: updatedStrands,
      total_substrands: template.total_substrands + 1,
    });
    setNewlyAddedId(newId);
  };

  const toggleAllStrands = (expand: boolean) => {
    if (!template) return;
    if (expand) {
      setExpandedStrands(new Set(template.strands.map((s) => s.id)));
    } else {
      setExpandedStrands(new Set());
    }
  };

  const addStrand = () => {
    if (!template) return;
    console.log("Adding new strand");
    const newStrand: Strand = {
      id: Date.now(), // Temporary ID
      sequence_order: template.strands.length + 1,
      strand_name: "New Strand",
      substrands: [],
    };

    setTemplate((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        strands: [...prev.strands, newStrand],
        total_strands: prev.total_strands + 1,
      };
    });

    setExpandedStrands((prev) => {
      const next = new Set(prev);
      next.add(newStrand.id);
      return next;
    });
    setNewlyAddedId(newStrand.id);
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
    console.log("Adding substrand to strand", strandId);

    const newSubstrandId = Date.now();

    setTemplate((prev) => {
      if (!prev) return null;

      const updatedStrands = prev.strands.map((s) => {
        if (s.id === strandId) {
          const newSubstrand: Substrand = {
            id: newSubstrandId, // Temporary ID
            sequence_order: s.substrands.length + 1,
            substrand_name: "New Sub-Strand",
            specific_learning_outcomes: "",
            suggested_learning_experiences: "",
            key_inquiry_questions: "",
            core_competencies: "",
            values: "",
            pcis: "",
            links_to_other_subjects: "",
            number_of_lessons: 1,
          };

          return {
            ...s,
            substrands: [...s.substrands, newSubstrand],
          };
        }
        return s;
      });

      return {
        ...prev,
        strands: updatedStrands,
        total_substrands: prev.total_substrands + 1,
      };
    });
    setNewlyAddedId(newSubstrandId);
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
    <div className="min-h-screen bg-[#020617] p-8">
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
            <div className="flex space-x-2">
              <button
                onClick={() => toggleAllStrands(true)}
                className="text-gray-600 hover:text-blue-600 p-2"
                title="Expand All"
              >
                <FaExpand />
              </button>
              <button
                onClick={() => toggleAllStrands(false)}
                className="text-gray-600 hover:text-blue-600 p-2"
                title="Collapse All"
              >
                <FaCompress />
              </button>
              <button
                type="button"
                onClick={addStrand}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <FaPlus className="mr-2" />
                Add Strand
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {template.strands.map((strand, strandIndex) => (
              <div
                key={strand.id}
                id={`item-${strand.id}`}
                className="border border-gray-200 rounded-lg"
              >
                {/* Strand Header */}
                <div className="bg-[#020617] p-4 flex items-center justify-between">
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
                      onClick={() => moveStrand(strandIndex, "up")}
                      disabled={strandIndex === 0}
                      className={`p-2 ${
                        strandIndex === 0
                          ? "text-gray-300"
                          : "text-gray-600 hover:text-blue-600"
                      }`}
                      title="Move Up"
                    >
                      <FaArrowUp />
                    </button>
                    <button
                      onClick={() => moveStrand(strandIndex, "down")}
                      disabled={strandIndex === template.strands.length - 1}
                      className={`p-2 ${
                        strandIndex === template.strands.length - 1
                          ? "text-gray-300"
                          : "text-gray-600 hover:text-blue-600"
                      }`}
                      title="Move Down"
                    >
                      <FaArrowDown />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingStrand(strand.id)}
                      className="text-blue-600 hover:text-blue-800 p-2"
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
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
                        type="button"
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
                          id={`item-${substrand.id}`}
                          className="border border-gray-200 rounded-lg p-4 bg-[#020617]"
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
                                  moveSubstrand(strand.id, subIndex, "up")
                                }
                                disabled={subIndex === 0}
                                className={`p-1 ${
                                  subIndex === 0
                                    ? "text-gray-300"
                                    : "text-gray-600 hover:text-blue-600"
                                }`}
                                title="Move Up"
                              >
                                <FaArrowUp />
                              </button>
                              <button
                                onClick={() =>
                                  moveSubstrand(strand.id, subIndex, "down")
                                }
                                disabled={
                                  subIndex === strand.substrands.length - 1
                                }
                                className={`p-1 ${
                                  subIndex === strand.substrands.length - 1
                                    ? "text-gray-300"
                                    : "text-gray-600 hover:text-blue-600"
                                }`}
                                title="Move Down"
                              >
                                <FaArrowDown />
                              </button>
                              <button
                                onClick={() =>
                                  duplicateSubstrand(strand.id, substrand)
                                }
                                className="text-gray-600 hover:text-blue-600 p-1"
                                title="Duplicate"
                              >
                                <FaCopy />
                              </button>
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
                                  Array.isArray(
                                    substrand.specific_learning_outcomes
                                  )
                                    ? substrand.specific_learning_outcomes.join(
                                        "\n"
                                      )
                                    : substrand.specific_learning_outcomes || ""
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
                                  Array.isArray(
                                    substrand.suggested_learning_experiences
                                  )
                                    ? substrand.suggested_learning_experiences.join(
                                        "\n"
                                      )
                                    : substrand.suggested_learning_experiences ||
                                      ""
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
                                value={
                                  Array.isArray(substrand.key_inquiry_questions)
                                    ? substrand.key_inquiry_questions.join("\n")
                                    : substrand.key_inquiry_questions || ""
                                }
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
                                Core Competencies
                              </label>
                              <textarea
                                value={
                                  Array.isArray(substrand.core_competencies)
                                    ? substrand.core_competencies.join("\n")
                                    : substrand.core_competencies || ""
                                }
                                onChange={(e) =>
                                  updateSubstrand(
                                    strand.id,
                                    substrand.id,
                                    "core_competencies",
                                    e.target.value
                                  )
                                }
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Values
                              </label>
                              <textarea
                                value={
                                  Array.isArray(substrand.values)
                                    ? substrand.values.join("\n")
                                    : substrand.values || ""
                                }
                                onChange={(e) =>
                                  updateSubstrand(
                                    strand.id,
                                    substrand.id,
                                    "values",
                                    e.target.value
                                  )
                                }
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                PCIs
                              </label>
                              <textarea
                                value={
                                  Array.isArray(substrand.pcis)
                                    ? substrand.pcis.join("\n")
                                    : substrand.pcis || ""
                                }
                                onChange={(e) =>
                                  updateSubstrand(
                                    strand.id,
                                    substrand.id,
                                    "pcis",
                                    e.target.value
                                  )
                                }
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Link to Other Learning Areas
                              </label>
                              <textarea
                                value={
                                  Array.isArray(
                                    substrand.links_to_other_subjects
                                  )
                                    ? substrand.links_to_other_subjects.join(
                                        "\n"
                                      )
                                    : substrand.links_to_other_subjects || ""
                                }
                                onChange={(e) =>
                                  updateSubstrand(
                                    strand.id,
                                    substrand.id,
                                    "links_to_other_subjects",
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

        {/* Floating Save Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {template.strands.length} Strands • {template.total_substrands}{" "}
              Sub-strands
            </div>
            <button
              onClick={saveChanges}
              disabled={saving}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 flex items-center disabled:bg-gray-400 text-lg shadow-md"
            >
              <FaSave className="mr-2" />
              {saving ? "Saving..." : "Save All Changes"}
            </button>
          </div>
        </div>
        {/* Spacer for floating bar */}
        <div className="h-24"></div>
      </div>
    </div>
  );
}
