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
  FiCheckCircle,
  FiTarget,
  FiTrendingUp,
  FiAward,
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
    if (percentage >= 75) return "from-green-500 to-emerald-600";
    if (percentage >= 50) return "from-yellow-500 to-amber-600";
    return "from-red-500 to-rose-600";
  };

  const getSubjectTheme = (subjectName: string) => {
    const name = subjectName?.toLowerCase() || "";
    if (name.includes("math"))
      return { gradient: "from-blue-500 to-cyan-500", icon: "🔢" };
    if (name.includes("english"))
      return { gradient: "from-rose-500 to-pink-500", icon: "📖" };
    if (name.includes("kiswahili"))
      return { gradient: "from-amber-500 to-orange-500", icon: "🗣️" };
    if (name.includes("science"))
      return { gradient: "from-emerald-500 to-teal-500", icon: "🌿" };
    if (name.includes("social"))
      return { gradient: "from-teal-500 to-cyan-500", icon: "🌍" };
    return { gradient: "from-purple-500 to-indigo-500", icon: "📚" };
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Premium Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/20 rounded-full blur-[128px] animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-[128px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-pink-400/20 rounded-full blur-[128px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Premium Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <FiBook className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
              Curriculum Hub
            </h1>
          </div>
          <p className="text-lg text-gray-600 ml-15">
            Upload, organize, and track your CBC curriculum progress with ease
          </p>
        </div>

        {/* Premium Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md w-full">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search subjects by name or grade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/curriculum/tracking")}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700 hover:text-green-700 rounded-xl font-medium transition-all shadow-sm hover:shadow group"
            >
              <FiEye className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Track Progress</span>
            </button>
            <button
              onClick={() => router.push("/curriculum/select")}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300"
            >
              <FiPlus className="w-5 h-5" />
              <span>Add CBC Curriculum</span>
            </button>
            <button
              onClick={() => router.push("/curriculum/upload")}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-xl font-medium transition-all shadow-sm hover:shadow group"
            >
              <FiUpload className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Upload Custom</span>
              <span className="sm:hidden">Upload</span>
            </button>
          </div>
        </div>

        {/* Subjects Grid */}
        {filteredSubjects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl group-hover:bg-indigo-100 transition-colors duration-500"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-50 rounded-full blur-3xl group-hover:bg-purple-100 transition-colors duration-500"></div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <FiBook className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {searchTerm ? "No subjects found" : "Your curriculum library is empty"}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                {searchTerm
                  ? "Try adjusting your search terms or clear the filter"
                  : "Get started by adding your first CBC curriculum to begin tracking your teaching progress"}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => router.push("/curriculum/select")}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
                >
                  <FiPlus className="w-5 h-5" />
                  <span>Add Your First CBC Curriculum</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSubjects.map((subject) => {
              const theme = getSubjectTheme(subject.subject_name);
              return (
                <div
                  key={subject.id}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden hover:-translate-y-1"
                >
                  {/* Card Header with Gradient */}
                  <div className={`h-2 bg-gradient-to-r ${theme.gradient}`}></div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white shadow-md transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                          <span className="text-2xl">{theme.icon}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                            {subject.subject_name}
                          </h3>
                          <p className="text-sm text-gray-500 font-medium">
                            Grade {subject.grade}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => toast("View curriculum coming soon")}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="View Curriculum"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toast("Download coming soon")}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
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
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Section */}
                    <div className="mb-5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">Progress</span>
                        <span className="text-sm font-bold text-gray-900">
                          {Math.round(subject.progress_percentage)}%
                        </span>
                      </div>
                      <div className="relative w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getProgressColor(
                            subject.progress_percentage
                          )} rounded-full transition-all duration-500 shadow-sm`}
                          style={{ width: `${subject.progress_percentage}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">
                          {subject.total_lessons}
                        </div>
                        <div className="text-xs text-gray-600 font-medium">Total Lessons</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-700">
                          {subject.lessons_completed}
                        </div>
                        <div className="text-xs text-green-700 font-medium">Completed</div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => router.push(`/curriculum/${subject.id}`)}
                      className="w-full bg-gradient-to-r from-gray-50 to-gray-100 hover:from-indigo-600 hover:to-purple-600 text-gray-700 hover:text-white border border-gray-200 hover:border-transparent py-3 rounded-xl font-semibold transition-all duration-300 shadow-sm hover:shadow-md group"
                    >
                      <span className="flex items-center justify-center gap-2">
                        Manage Curriculum
                        <FiTarget className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Premium Quick Stats */}
        {subjects.length > 0 && (
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <FiBook className="w-5 h-5 text-white" />
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {subjects.length}
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600">Total Subjects</div>
            </div>
            
            <div className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <FiCheckCircle className="w-5 h-5 text-white" />
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {subjects.reduce((sum, s) => sum + s.lessons_completed, 0)}
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600">Lessons Completed</div>
            </div>
            
            <div className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-amber-200 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <FiTrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {subjects.reduce((sum, s) => sum + s.total_lessons, 0)}
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600">Total Lessons</div>
            </div>
            
            <div className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <FiAward className="w-5 h-5 text-white" />
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
              </div>
              <div className="text-sm font-medium text-gray-600">Average Progress</div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                Upload Curriculum Document
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Upload your CBC curriculum PDF documents to automatically
                extract lessons and track progress.
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-indigo-400 transition-colors">
                <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  Drag and drop your PDF here, or
                </p>
                <button className="text-indigo-600 hover:text-indigo-700 font-semibold">
                  browse to upload
                </button>
              </div>

              <p className="text-sm text-gray-500 mt-4">
                Curriculum upload and parsing functionality will be implemented
                with AI integration.
              </p>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-6 py-2.5 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success("Curriculum upload feature coming soon!");
                  setShowUploadModal(false);
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-colors font-medium shadow-lg"
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
