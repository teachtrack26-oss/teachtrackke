"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiUpload,
  FiBook,
  FiDownload,
  FiEye,
  FiTrash2,
  FiSearch,
  FiPlus,
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

interface Subject {
  id: number;
  subject_name: string;
  grade: string;
  curriculum_pdf_url?: string;
  total_lessons: number;
  lessons_completed: number;
  progress_percentage: number;
  created_at: string;
}

export default function CurriculumPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Please login to access curriculum");
      router.push("/login");
      return;
    }
    setIsAuthenticated(true);
    fetchSubjects();
  }, [router]);

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`/api/v1/subjects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(response.data);
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please login to access curriculum management.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Curriculum Management
          </h1>
          <p className="text-gray-600">
            Upload, organize, and track your CBC curriculum documents and
            progress.
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push("/curriculum/tracking")}
              className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <FiEye className="w-5 h-5" />
              <span>Track Progress</span>
            </button>
            <button
              onClick={() => router.push("/curriculum/select")}
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <FiPlus className="w-5 h-5" />
              <span>Add CBC Curriculum</span>
            </button>
            <button
              onClick={() => router.push("/curriculum/upload")}
              className="inline-flex items-center space-x-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <FiUpload className="w-5 h-5" />
              <span>Upload Custom</span>
            </button>
          </div>
        </div>

        {/* Subjects Grid */}
        {filteredSubjects.length === 0 ? (
          <div className="text-center py-12">
            <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No subjects found" : "No subjects yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Upload your first curriculum document to get started"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => router.push("/curriculum/select")}
                className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <FiPlus className="w-5 h-5" />
                <span>Add Your First CBC Curriculum</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSubjects.map((subject) => (
              <div
                key={subject.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {subject.subject_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Grade {subject.grade}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => toast("View curriculum coming soon")}
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="View Curriculum"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toast("Download coming soon")}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="Download"
                    >
                      <FiDownload className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to delete this subject?"
                          )
                        ) {
                          toast.success("Subject deleted");
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{Math.round(subject.progress_percentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${getProgressColor(
                        subject.progress_percentage
                      )} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${subject.progress_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-center text-sm">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {subject.total_lessons}
                    </div>
                    <div className="text-gray-600">Total Lessons</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {subject.lessons_completed}
                    </div>
                    <div className="text-gray-600">Completed</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => router.push(`/curriculum/${subject.id}`)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    Manage Curriculum
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {subjects.length}
            </div>
            <div className="text-gray-600">Total Subjects</div>
          </div>
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              {subjects.reduce((sum, s) => sum + s.lessons_completed, 0)}
            </div>
            <div className="text-gray-600">Lessons Completed</div>
          </div>
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {subjects.reduce((sum, s) => sum + s.total_lessons, 0)}
            </div>
            <div className="text-gray-600">Total Lessons</div>
          </div>
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {subjects.length > 0
                ? Math.round(
                    subjects.reduce(
                      (sum, s) => sum + s.progress_percentage,
                      0
                    ) / subjects.length
                  )
                : 0}
              %
            </div>
            <div className="text-gray-600">Average Progress</div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Upload Curriculum Document
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Upload your CBC curriculum PDF documents to automatically
                extract lessons and track progress.
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  Drag and drop your PDF here, or
                </p>
                <button className="text-indigo-600 hover:text-indigo-700 font-medium">
                  browse to upload
                </button>
              </div>

              <p className="text-sm text-gray-500 mt-4">
                Curriculum upload and parsing functionality will be implemented
                with AI integration.
              </p>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success("Curriculum upload feature coming soon!");
                  setShowUploadModal(false);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
