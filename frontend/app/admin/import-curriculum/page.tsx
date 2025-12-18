"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import {
  FiUpload,
  FiFile,
  FiCheckCircle,
  FiAlertCircle,
  FiTrash2,
  FiList,
} from "react-icons/fi";

interface Curriculum {
  id: number;
  subject: string;
  grade: string;
  education_level: string;
  is_active: boolean;
  created_at: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  curriculum_id?: number;
  stats?: {
    strands: number;
    substrands: number;
    lessons: number;
  };
  filename?: string;
}

export default function ImportCurriculumPage() {
  const router = useRouter();
  const {
    user: authUser,
    loading: authLoading,
    isAuthenticated,
  } = useCustomAuth();
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<ImportResult[]>([]);

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated && authUser) {
      if (authUser.role !== "SUPER_ADMIN") {
        toast.error("Access denied. Super Admin privileges required.");
        router.push("/admin/dashboard");
        return;
      }
      fetchCurricula();
    }
  }, [isAuthenticated, authLoading, authUser, router]);

  const fetchCurricula = async () => {
    try {
      const response = await axios.get(`/api/v1/admin/curricula`, {
        withCredentials: true,
      });
      setCurricula(response.data.curricula);
    } catch (error) {
      console.error("Failed to fetch curricula:", error);
      toast.error("Failed to load curricula list");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadResults: ImportResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post(
          `/api/v1/admin/import-curriculum`,
          formData,
          {
            withCredentials: true,
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        uploadResults.push({
          success: true,
          message: response.data.message,
          curriculum_id: response.data.curriculum_id,
          stats: response.data.stats,
          filename: file.name,
        });

        toast.success(`✅ ${file.name} imported successfully`);
      } catch (error: any) {
        const errorMsg =
          error.response?.data?.detail || `Failed to import ${file.name}`;
        uploadResults.push({
          success: false,
          message: errorMsg,
          filename: file.name,
        });
        toast.error(`❌ ${errorMsg}`);
      }
    }

    setResults(uploadResults);
    setUploading(false);
    fetchCurricula(); // Refresh list

    // Clear file input
    event.target.value = "";
  };

  const handleDelete = async (curriculumId: number, subject: string) => {
    if (!confirm(`Delete ${subject}? This cannot be undone.`)) return;

    try {
      await axios.delete(`/api/v1/admin/curricula/${curriculumId}`, {
        withCredentials: true,
      });
      toast.success(`Deleted ${subject}`);
      fetchCurricula();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || "Failed to delete";
      toast.error(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Import Curriculum
          </h1>
          <p className="text-gray-600">
            Upload JSON curriculum files to add new subjects to the system
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center mb-6">
            <FiUpload className="w-6 h-6 text-indigo-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Upload Curriculum Files
            </h2>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
            <input
              type="file"
              id="curriculum-upload"
              multiple
              accept=".json"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <label htmlFor="curriculum-upload" className="cursor-pointer block">
              <FiFile className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                {uploading ? "Uploading..." : "Click to upload JSON files"}
              </p>
              <p className="text-sm text-gray-500">
                You can select multiple files at once
              </p>
              <button
                type="button"
                disabled={uploading}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center"
              >
                <FiUpload className="mr-2" />
                {uploading ? "Uploading..." : "Select Files"}
              </button>
            </label>
          </div>

          {/* Upload Results */}
          {results.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Upload Results:
              </h3>
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`flex items-start p-4 rounded-lg border ${
                    result.success
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  {result.success ? (
                    <FiCheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  ) : (
                    <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        result.success ? "text-green-900" : "text-red-900"
                      }`}
                    >
                      {result.filename}
                    </p>
                    <p
                      className={`text-sm ${
                        result.success ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {result.message}
                    </p>
                    {result.stats && (
                      <p className="text-xs text-green-600 mt-1">
                        {result.stats.strands} strands,{" "}
                        {result.stats.substrands} substrands,{" "}
                        {result.stats.lessons} lessons
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Imported Curricula List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <FiList className="w-6 h-6 text-indigo-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Imported Curricula ({curricula.length})
            </h2>
          </div>

          {curricula.length === 0 ? (
            <div className="text-center py-12">
              <FiFile className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No curricula imported yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Upload JSON files to get started
              </p>
            </div>
          ) : (
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
                      Education Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Imported
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {curricula.map((curriculum) => (
                    <tr key={curriculum.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {curriculum.subject}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {curriculum.grade}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {curriculum.education_level}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            curriculum.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {curriculum.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(curriculum.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() =>
                            handleDelete(curriculum.id, curriculum.subject)
                          }
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                        >
                          <FiTrash2 className="mr-1" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            📋 JSON File Format
          </h4>
          <p className="text-sm text-blue-800 mb-2">
            Your JSON files should follow this structure:
          </p>
          <pre className="text-xs bg-blue-100 p-3 rounded overflow-x-auto text-blue-900">
            {`{
  "subject": "English",
  "grade": "Grade 9",
  "education_level": "Junior Secondary",
  "strands": [
    {
      "strand_number": "1",
      "strand_name": "Listening and Speaking",
      "substrands": [
        {
          "substrand_number": "1.1",
          "substrand_name": "Interactive Skills",
          "number_of_lessons": 8,
          "specific_learning_outcomes": [...],
          "suggested_learning_experiences": [...],
          "key_inquiry_questions": [...],
          "core_competencies": [...],
          "values": [...],
          "pcis": [...],
          "links_to_other_subjects": [...]
        }
      ]
    }
  ]
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
