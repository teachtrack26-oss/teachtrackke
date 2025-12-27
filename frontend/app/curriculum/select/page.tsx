"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiCheck, FiAlertCircle, FiBook } from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "axios";
import { useCustomAuth } from "@/hooks/useCustomAuth";

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
];

interface CurriculumTemplate {
  id: number;
  subject: string;
  grade: string;
  educationLevel: string;
  createdAt: string;
}

export default function CurriculumSelectPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useCustomAuth();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<CurriculumTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<
    CurriculumTemplate[]
  >([]);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);
  const [addingTemplate, setAddingTemplate] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchTemplates();
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    // Filter templates by selected grade
    if (selectedGrade) {
      const filtered = templates.filter((t) => t.grade === selectedGrade);
      setFilteredTemplates(filtered);
      // Don't clear selection when changing grades to allow multi-grade selection
    } else {
      setFilteredTemplates([]);
    }
  }, [selectedGrade, templates]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/v1/curriculum-templates", {
        withCredentials: true,
      });
      // Backend returns a list directly, or check if it's wrapped
      const data = response.data;
      let rawTemplates = [];

      if (Array.isArray(data)) {
        rawTemplates = data;
      } else if (data.templates && Array.isArray(data.templates)) {
        rawTemplates = data.templates;
      }

      // Map backend snake_case to frontend camelCase
      const mappedTemplates = rawTemplates.map((t: any) => ({
        id: t.id,
        subject: t.subject,
        grade: t.grade,
        educationLevel: t.education_level || t.educationLevel,
        createdAt: t.created_at || t.createdAt,
      }));

      setTemplates(mappedTemplates);
    } catch (error: any) {
      console.error("Failed to fetch templates:", error);
      toast.error("Failed to load curriculum templates");
    } finally {
      setLoading(false);
    }
  };

  const toggleTemplate = (id: number) => {
    setSelectedTemplates((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredTemplates.map((t) => t.id);
    const allVisibleSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedTemplates.includes(id));

    if (allVisibleSelected) {
      // Deselect all visible
      setSelectedTemplates((prev) =>
        prev.filter((id) => !visibleIds.includes(id))
      );
    } else {
      // Select all visible (merge unique)
      setSelectedTemplates((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const handleAddCurriculum = async () => {
    if (selectedTemplates.length === 0) {
      toast.error("Please select at least one curriculum template");
      return;
    }

    // Check Free Plan Limit
    if (user?.subscription_type === "FREE" && selectedTemplates.length > 2) {
      toast.error(
        "Free plan is limited to 6 subjects total. Please upgrade to add more.",
        {
          duration: 5000,
          icon: "🔒",
          style: {
            border: "1px solid #EAB308",
            padding: "16px",
            color: "#713F12",
          },
        }
      );
      return;
    }

    setAddingTemplate(true);

    try {
      const response = await axios.post(
        `/api/v1/curriculum-templates/bulk-use`,
        { template_ids: selectedTemplates },
        {
          withCredentials: true,
        }
      );

      const result = response.data;
      const successCount = result.results.success.length;
      const skippedCount = result.results.skipped.length;
      const failedCount = result.results.failed.length;

      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} subjects!`);
      }
      if (skippedCount > 0) {
        toast(`Skipped ${skippedCount} subjects (already exist)`, {
          icon: "ℹ️",
        });
      }
      if (failedCount > 0) {
        toast.error(`Failed to add ${failedCount} subjects`);
      }

      if (successCount > 0) {
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Add curriculum error:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Failed to add curriculum. Please try again.";
      toast.error(errorMessage);
    } finally {
      setAddingTemplate(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Select CBC Curriculum
          </h1>
          <p className="text-gray-600">
            Choose from our pre-loaded official CBC curriculum templates for
            your grade and subject.
          </p>
        </div>

        {/* Selection Form */}
        <div className="space-y-6">
          {/* Grade Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full mr-3 font-bold text-sm">
                1
              </span>
              Select Your Grade Level
            </h2>
            <select
              required
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Choose a grade...</option>
              {GRADES.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selection */}
          {selectedGrade && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full mr-3 font-bold text-sm">
                    2
                  </span>
                  Select Subject Curriculum
                </div>
                {user?.subscription_type === "FREE" && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-yellow-100 text-yellow-800">
                    Free Plan: Max 6 Subjects
                  </span>
                )}
              </h2>

              {filteredTemplates.length > 0 && (
                <div className="mb-4 flex justify-end">
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm font-medium text-primary-600 hover:text-primary-800"
                  >
                    {filteredTemplates.length > 0 &&
                    filteredTemplates.every((t) =>
                      selectedTemplates.includes(t.id)
                    )
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <FiAlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800">
                      <strong>No curriculum templates available</strong> for{" "}
                      {selectedGrade} yet.
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Templates are being added. Please check back later or
                      contact your administrator.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => toggleTemplate(template.id)}
                      className={`relative p-5 border-2 rounded-lg text-left transition-all ${
                        selectedTemplates.includes(template.id)
                          ? "border-primary-600 bg-primary-50"
                          : "border-gray-200 hover:border-primary-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`mt-1 ${
                            selectedTemplates.includes(template.id)
                              ? "text-primary-600"
                              : "text-gray-400"
                          }`}
                        >
                          {selectedTemplates.includes(template.id) ? (
                            <div className="w-5 h-5 bg-primary-600 rounded flex items-center justify-center">
                              <FiCheck className="w-3 h-3 text-white" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {template.subject}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {template.educationLevel}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Official CBC Curriculum
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {selectedTemplates.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Selection Summary */}
              <div className="mb-4 pb-4 border-b border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Selected Subjects Summary:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(
                    new Set(
                      templates
                        .filter((t) => selectedTemplates.includes(t.id))
                        .map((t) => t.grade)
                    )
                  )
                    .sort()
                    .map((grade) => {
                      const count = templates.filter(
                        (t) =>
                          t.grade === grade && selectedTemplates.includes(t.id)
                      ).length;
                      return (
                        <span
                          key={grade}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {grade}: {count} subject{count !== 1 ? "s" : ""}
                        </span>
                      );
                    })}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Ready to add {selectedTemplates.length} subject
                    {selectedTemplates.length !== 1 ? "s" : ""}?
                  </h3>
                  <p className="text-sm text-gray-600">
                    This will add all strands, sub-strands, and lessons to your
                    account.
                  </p>
                </div>
                <button
                  onClick={handleAddCurriculum}
                  disabled={addingTemplate}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ml-4 ${
                    user?.subscription_type === "FREE" &&
                    selectedTemplates.length > 2
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-primary-600 text-white hover:bg-primary-700"
                  }`}
                >
                  {addingTemplate ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      {user?.subscription_type === "FREE" &&
                      selectedTemplates.length > 2 ? (
                        <FiAlertCircle className="w-5 h-5" />
                      ) : (
                        <FiCheck className="w-5 h-5" />
                      )}
                      <span>
                        {user?.subscription_type === "FREE" &&
                        selectedTemplates.length > 2
                          ? "Limit Exceeded (Max 6)"
                          : `Add ${selectedTemplates.length} Subject${
                              selectedTemplates.length !== 1 ? "s" : ""
                            }`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            About Curriculum Templates
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • All templates are official Kenya Institute of Curriculum
              Development (KICD) CBC curriculums
            </li>
            <li>
              • Each template includes complete strands, sub-strands, learning
              outcomes, and suggested lessons
            </li>
            <li>
              • Once added, you can start tracking your teaching progress
              immediately
            </li>
            <li>• You can add multiple subjects across different grades</li>
            <li>
              • Templates are regularly updated to match the latest KICD
              releases
            </li>
          </ul>
        </div>

        {/* Legacy Upload Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Have a custom curriculum document?{" "}
            <button
              onClick={() => router.push("/curriculum/upload")}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Upload it here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
