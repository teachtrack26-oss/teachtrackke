"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiCheck, FiAlertCircle, FiBook } from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "axios";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<CurriculumTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<
    CurriculumTemplate[]
  >([]);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [addingTemplate, setAddingTemplate] = useState(false);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Please login to select curriculum");
      router.push("/login");
      return;
    }
    setIsAuthenticated(true);
    fetchTemplates();
  }, [router]);

  useEffect(() => {
    // Filter templates by selected grade
    if (selectedGrade) {
      const filtered = templates.filter((t) => t.grade === selectedGrade);
      setFilteredTemplates(filtered);
      setSelectedTemplate(null);
    } else {
      setFilteredTemplates([]);
    }
  }, [selectedGrade, templates]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get("/api/v1/curriculum-templates", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTemplates(response.data.templates || []);
    } catch (error: any) {
      console.error("Failed to fetch templates:", error);
      toast.error("Failed to load curriculum templates");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCurriculum = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a curriculum template");
      return;
    }

    setAddingTemplate(true);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `/api/v1/curriculum-templates/${selectedTemplate}/use`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(response.data.message || "Curriculum added successfully!");
      router.push("/dashboard");
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-indigo-600 hover:text-indigo-700 mb-4 inline-flex items-center"
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
              <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full mr-3 font-bold text-sm">
                1
              </span>
              Select Your Grade Level
            </h2>
            <select
              required
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full mr-3 font-bold text-sm">
                  2
                </span>
                Select Subject Curriculum
              </h2>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`relative p-5 border-2 rounded-lg text-left transition-all ${
                        selectedTemplate === template.id
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200 hover:border-indigo-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <FiBook
                          className={`w-6 h-6 flex-shrink-0 mt-1 ${
                            selectedTemplate === template.id
                              ? "text-indigo-600"
                              : "text-gray-400"
                          }`}
                        />
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
                        {selectedTemplate === template.id && (
                          <div className="absolute top-3 right-3">
                            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                              <FiCheck className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {selectedTemplate && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Ready to add this curriculum?
                  </h3>
                  <p className="text-sm text-gray-600">
                    This will add all strands, sub-strands, and lessons to your
                    account.
                  </p>
                </div>
                <button
                  onClick={handleAddCurriculum}
                  disabled={addingTemplate}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ml-4"
                >
                  {addingTemplate ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-5 h-5" />
                      <span>Add to My Subjects</span>
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
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Upload it here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
