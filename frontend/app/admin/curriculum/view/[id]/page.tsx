"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import {
  FaChevronDown,
  FaChevronUp,
  FaArrowLeft,
  FaBook,
  FaLayerGroup,
  FaListUl,
  FaClock,
} from "react-icons/fa";
import { FiEdit } from "react-icons/fi";

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
  education_level?: string;
  is_active: boolean;
  total_strands: number;
  total_substrands: number;
  total_lessons: number;
  strands: Strand[];
}

export default function ViewCurriculumPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;
  const { user, isAuthenticated, loading: authLoading } = useCustomAuth();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStrands, setExpandedStrands] = useState<Set<number>>(
    new Set()
  );
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // Check if user has admin access
      if (user?.role !== "SUPER_ADMIN" && user?.role !== "SCHOOL_ADMIN") {
        toast.error("Access denied. Admin privileges required.");
        router.push("/dashboard");
        return;
      }
      fetchTemplate();
    }
  }, [templateId, router, authLoading, isAuthenticated, user]);

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

  const toggleStrand = (strandId: number) => {
    const newExpanded = new Set(expandedStrands);
    if (newExpanded.has(strandId)) {
      newExpanded.delete(strandId);
    } else {
      newExpanded.add(strandId);
    }
    setExpandedStrands(newExpanded);
  };

  const expandAll = () => {
    if (template) {
      setExpandedStrands(new Set(template.strands.map((s) => s.id)));
    }
  };

  const collapseAll = () => {
    setExpandedStrands(new Set());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading curriculum...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Curriculum not found</p>
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="mt-4 text-primary-600 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="flex items-center text-gray-600 hover:text-primary-600 mb-4 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to Dashboard
          </button>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {template.subject}
              </h1>
              <p className="text-gray-600 mt-1">
                {template.grade}{" "}
                {template.education_level && `• ${template.education_level}`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  template.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {template.is_active ? "Active" : "Inactive"}
              </span>

              {/* Edit button - Super Admin Only */}
              {isSuperAdmin && (
                <button
                  onClick={() =>
                    router.push(`/admin/curriculum/edit/${template.id}`)
                  }
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                >
                  <FiEdit className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <FaLayerGroup className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {template.strands.length}
              </p>
              <p className="text-sm text-gray-500">Strands</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FaListUl className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {template.strands.reduce(
                  (sum, s) => sum + s.substrands.length,
                  0
                )}
              </p>
              <p className="text-sm text-gray-500">Sub-strands</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FaClock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {template.strands.reduce(
                  (sum, s) =>
                    sum +
                    s.substrands.reduce(
                      (sSum, ss) => sSum + ss.number_of_lessons,
                      0
                    ),
                  0
                )}
              </p>
              <p className="text-sm text-gray-500">Total Lessons</p>
            </div>
          </div>
        </div>

        {/* Expand/Collapse All */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={expandAll}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            Expand All
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={collapseAll}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            Collapse All
          </button>
        </div>

        {/* Strands */}
        <div className="space-y-4">
          {template.strands.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <FaBook className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                No strands found in this curriculum.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                This curriculum template is empty.
              </p>
            </div>
          ) : (
            template.strands
              .sort((a, b) => a.sequence_order - b.sequence_order)
              .map((strand, strandIndex) => (
                <div
                  key={strand.id}
                  className="bg-white rounded-lg shadow overflow-hidden"
                >
                  {/* Strand Header */}
                  <button
                    onClick={() => toggleStrand(strand.id)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-primary-50 to-purple-50 hover:from-primary-100 hover:to-purple-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-primary-600 text-white rounded-full text-sm font-bold">
                        {strandIndex + 1}
                      </span>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">
                          {strand.strand_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {strand.substrands.length} sub-strand
                          {strand.substrands.length !== 1 ? "s" : ""} •{" "}
                          {strand.substrands.reduce(
                            (sum, ss) => sum + ss.number_of_lessons,
                            0
                          )}{" "}
                          lessons
                        </p>
                      </div>
                    </div>
                    {expandedStrands.has(strand.id) ? (
                      <FaChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <FaChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {/* Substrands */}
                  {expandedStrands.has(strand.id) && (
                    <div className="divide-y divide-gray-100">
                      {strand.substrands.length === 0 ? (
                        <div className="px-6 py-4 text-center text-gray-500">
                          No sub-strands in this strand.
                        </div>
                      ) : (
                        strand.substrands
                          .sort((a, b) => a.sequence_order - b.sequence_order)
                          .map((substrand, subIndex) => (
                            <div key={substrand.id} className="px-6 py-4">
                              <div className="flex items-start gap-4">
                                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-xs font-bold">
                                  {strandIndex + 1}.{subIndex + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-4">
                                    <h4 className="font-medium text-gray-900">
                                      {substrand.substrand_name}
                                    </h4>
                                    <span className="flex-shrink-0 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                      {substrand.number_of_lessons} lesson
                                      {substrand.number_of_lessons !== 1
                                        ? "s"
                                        : ""}
                                    </span>
                                  </div>

                                  {/* Learning Outcomes */}
                                  {substrand.specific_learning_outcomes && (
                                    <div className="mt-3">
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                        Learning Outcomes
                                      </p>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {substrand.specific_learning_outcomes}
                                      </p>
                                    </div>
                                  )}

                                  {/* Learning Experiences */}
                                  {substrand.suggested_learning_experiences && (
                                    <div className="mt-3">
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                        Suggested Learning Experiences
                                      </p>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {
                                          substrand.suggested_learning_experiences
                                        }
                                      </p>
                                    </div>
                                  )}

                                  {/* Inquiry Questions */}
                                  {substrand.key_inquiry_questions && (
                                    <div className="mt-3">
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                        Key Inquiry Questions
                                      </p>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {substrand.key_inquiry_questions}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
