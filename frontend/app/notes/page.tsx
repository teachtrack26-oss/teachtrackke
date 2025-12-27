"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import {
  FiPlus,
  FiSearch,
  FiEdit3,
  FiTrash2,
  FiBook,
  FiCalendar,
  FiFile,
  FiDownload,
  FiStar,
  FiPlay,
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import FileUpload from "@/components/FileUpload";
import NoteViewer from "@/components/NoteViewer";
import { getCachedData, setCachedData, CACHE_KEYS } from "@/lib/dataCache";

interface Note {
  id: number;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size_bytes: number;
  thumbnail_url?: string;
  subject_id?: number;
  tags?: string;
  is_favorite: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

interface Subject {
  id: number;
  subject_name: string;
  grade: string;
}

export default function NotesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useCustomAuth();
  // Initialize from cache
  const cachedNotes = getCachedData<Note[]>(CACHE_KEYS.NOTES);
  const cachedSubjects = getCachedData<Subject[]>(CACHE_KEYS.SUBJECTS);
  const cachedEducationLevels = getCachedData<any>( 'education_levels');

  const [notes, setNotes] = useState<Note[]>(cachedNotes || []);
  const [subjects, setSubjects] = useState<Subject[]>(cachedSubjects || []);
  const [loading, setLoading] = useState(!cachedNotes);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [viewerNoteIndex, setViewerNoteIndex] = useState(0);

  // Cascading dropdown states
  const [educationLevels, setEducationLevels] = useState<string[]>(cachedEducationLevels?.education_levels || []);
  const [grades, setGrades] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [selectedEducationLevel, setSelectedEducationLevel] =
    useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // If we have cached data, do background refresh
      const hasCache = !!(cachedNotes && cachedSubjects);
      fetchData(hasCache);
    }
  }, [authLoading, isAuthenticated]);

  const fetchData = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) setLoading(true);

      // First, try to make the request
      try {
        const [notesResponse, subjectsResponse, educationLevelsResponse] =
          await Promise.all([
            axios.get(`/api/v1/notes`, {
              withCredentials: true,
            }),
            axios.get(`/api/v1/subjects`, {
              withCredentials: true,
            }),
            axios.get("/api/v1/education-levels", {
              withCredentials: true,
            }),
          ]);

        setNotes(notesResponse.data);
        setCachedData(CACHE_KEYS.NOTES, notesResponse.data);

        setSubjects(subjectsResponse.data);
        setCachedData(CACHE_KEYS.SUBJECTS, subjectsResponse.data);

        setEducationLevels(educationLevelsResponse.data.education_levels || []);
        setCachedData('education_levels', educationLevelsResponse.data);

      } catch (error: any) {
        // If 401, redirect to login
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          console.log("Session expired or invalid");
          toast.error("Please login to access notes");
          router.push("/login");
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  // Fetch grades when education level changes
  const fetchGrades = async (educationLevel: string) => {
    try {
      const response = await axios.get(
        `/api/v1/grades?education_level=${educationLevel}`,
        {
          withCredentials: true,
        }
      );
      setGrades(response.data.grades || []);
      setSelectedGrade(""); // Reset grade selection
      setAvailableSubjects([]); // Reset subjects
      setSelectedSubjectName(""); // Reset subject selection
    } catch (error) {
      console.error("Failed to fetch grades:", error);
      toast.error("Failed to load grades");
    }
  };

  // Fetch subjects when grade changes
  const fetchSubjectsByGrade = async (
    grade: string,
    educationLevel: string
  ) => {
    try {
      const response = await axios.get(
        `/api/v1/subjects-by-grade?grade=${grade}&education_level=${educationLevel}`,
        { withCredentials: true }
      );
      setAvailableSubjects(response.data.subjects || []);
      setSelectedSubjectName(""); // Reset subject selection
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
      toast.error("Failed to load subjects");
    }
  };

  // Handle education level change
  const handleEducationLevelChange = (level: string) => {
    setSelectedEducationLevel(level);
    if (level) {
      fetchGrades(level);
    } else {
      setGrades([]);
      setAvailableSubjects([]);
      setSelectedGrade("");
      setSelectedSubjectName("");
    }
  };

  // Handle grade change
  const handleGradeChange = (grade: string) => {
    setSelectedGrade(grade);
    if (grade && selectedEducationLevel) {
      fetchSubjectsByGrade(grade, selectedEducationLevel);
    } else {
      setAvailableSubjects([]);
      setSelectedSubjectName("");
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      await axios.delete(`/api/v1/notes/${noteId}`, {
        withCredentials: true,
      });

      toast.success("Note deleted successfully");
      fetchData(); // Refresh notes list
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast.error("Failed to delete note");
    }
  };

  const handleToggleFavorite = async (noteId: number) => {
    try {
      await axios.patch(
        `/api/v1/notes/${noteId}/favorite`,
        {},
        { withCredentials: true }
      );

      // Update local state
      setNotes(
        notes.map((note) =>
          note.id === noteId
            ? { ...note, is_favorite: !note.is_favorite }
            : note
        )
      );

      toast.success("Updated favorite status");
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast.error("Failed to update favorite");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "bmp", "svg"].includes(type)) return "🖼️";
    if (["pdf"].includes(type)) return "📄";
    if (["docx", "doc"].includes(type)) return "📝";
    if (["pptx", "ppt"].includes(type)) return "📊";
    if (["mp4", "mov", "avi", "mkv", "webm"].includes(type)) return "🎥";
    return "📎";
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.description &&
        note.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (note.tags && note.tags.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Show loading first to prevent flash
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please login to access your notes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Premium Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-400/20 rounded-full blur-[128px] animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-[128px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-pink-400/20 rounded-full blur-[128px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Premium Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center shadow-lg">
              <FiBook className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
              My Notes
            </h1>
          </div>
          <p className="text-lg text-gray-600 ml-15">
            Organize and manage all your teaching notes and resources
          </p>
        </div>

        {/* Premium Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md w-full">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search notes by title, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-all"
            />
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all"
          >
            <FiPlus className="w-5 h-5" />
            <span>Upload Note</span>
          </button>
        </div>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <div className="glass-card border border-gray-100 p-16 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-50 rounded-full blur-3xl group-hover:bg-primary-100 transition-colors duration-500"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-50 rounded-full blur-3xl group-hover:bg-purple-100 transition-colors duration-500"></div>

            <div className="relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <FiBook className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {searchTerm ? "No notes found" : "Your notes library is empty"}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                {searchTerm
                  ? "Try adjusting your search terms or clear the filter"
                  : "Get started by uploading your first note to organize your teaching resources"}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
                >
                  <FiPlus className="w-5 h-5" />
                  <span>Upload Your First Note</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note, index) => (
              <div
                key={note.id}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden hover:-translate-y-1"
              >
                {/* Thumbnail or file icon */}
                {note.thumbnail_url ? (
                  <img
                    src={note.thumbnail_url}
                    alt={note.title}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-40 bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-primary-50 group-hover:to-purple-50 transition-colors">
                    <span className="text-5xl transform group-hover:scale-110 transition-transform">
                      {getFileIcon(note.file_type)}
                    </span>
                  </div>
                )}

                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1 group-hover:text-primary-600 transition-colors">
                      {note.title}
                    </h3>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewerNoteIndex(index);
                          setShowViewer(true);
                        }}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        title="Present"
                      >
                        <FiPlay className="w-4 h-4" />
                      </button>
                      <a
                        href={note.file_url}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        title="Download"
                      >
                        <FiDownload className="w-4 h-4" />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {note.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {note.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3 pb-3 border-b border-gray-100">
                    <span className="flex items-center gap-1.5">
                      <FiFile className="w-3 h-3" />
                      <span className="font-medium">
                        {note.file_type.toUpperCase()}
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(note.file_size_bytes)}</span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(note.id);
                      }}
                      className={`p-1 rounded transition-colors ${
                        note.is_favorite
                          ? "text-yellow-500 hover:text-yellow-600"
                          : "text-gray-400 hover:text-yellow-500"
                      }`}
                    >
                      <FiStar
                        className="w-4 h-4"
                        fill={note.is_favorite ? "currentColor" : "none"}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <FiCalendar className="w-3 h-3" />
                      <span>
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span>{note.view_count} views</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note Detail Modal */}
      {selectedNote && !showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedNote.title}
              </h2>
              <div className="flex space-x-2">
                <a
                  href={selectedNote.file_url}
                  download
                  className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                >
                  <FiDownload className="w-5 h-5" />
                </a>
                <button
                  onClick={() => handleToggleFavorite(selectedNote.id)}
                  className={`p-2 ${
                    selectedNote.is_favorite
                      ? "text-yellow-500"
                      : "text-gray-400"
                  } hover:text-yellow-600 transition-colors`}
                >
                  <FiStar className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* File preview */}
              <div className="mb-4">
                {selectedNote.thumbnail_url ? (
                  <img
                    src={selectedNote.thumbnail_url}
                    alt={selectedNote.title}
                    className="max-w-full h-auto rounded"
                  />
                ) : selectedNote.file_type.match(
                    /^(jpg|jpeg|png|gif|bmp|svg)$/i
                  ) ? (
                  <img
                    src={selectedNote.file_url}
                    alt={selectedNote.title}
                    className="max-w-full h-auto rounded"
                  />
                ) : selectedNote.file_type === "pdf" ? (
                  <iframe
                    src={selectedNote.file_url}
                    className="w-full h-96 border rounded"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 bg-gray-100 rounded">
                    <span className="text-6xl mb-4">
                      {getFileIcon(selectedNote.file_type)}
                    </span>
                    <span className="text-gray-600">
                      {selectedNote.file_type.toUpperCase()} File
                    </span>
                    <span className="text-sm text-gray-500 mt-2">
                      {formatFileSize(selectedNote.file_size_bytes)}
                    </span>
                  </div>
                )}
              </div>

              {selectedNote.description && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedNote.description}
                  </p>
                </div>
              )}

              {selectedNote.tags && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedNote.tags.split(",").map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between text-sm text-gray-500">
                <span>
                  Created:{" "}
                  {new Date(selectedNote.created_at).toLocaleDateString()}
                </span>
                <span>Views: {selectedNote.view_count}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Upload New Note
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedSubject(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {/* Cascading Dropdowns */}
              <div className="mb-6 space-y-4">
                {/* Education Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Education Level (Optional)
                  </label>
                  <select
                    value={selectedEducationLevel}
                    onChange={(e) => handleEducationLevelChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">-- Select Education Level --</option>
                    {educationLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grade */}
                {selectedEducationLevel && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade
                    </label>
                    <select
                      value={selectedGrade}
                      onChange={(e) => handleGradeChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      disabled={!selectedEducationLevel}
                    >
                      <option value="">-- Select Grade --</option>
                      {grades.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Subject */}
                {selectedGrade && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <select
                      value={selectedSubjectName}
                      onChange={(e) => setSelectedSubjectName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      disabled={!selectedGrade}
                    >
                      <option value="">-- Select Subject --</option>
                      {availableSubjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* File Upload Component */}
              <FileUpload
                subjectId={selectedSubject}
                onSuccess={() => {
                  toast.success("File uploaded successfully!");
                  setShowUploadModal(false);
                  setSelectedSubject(null);
                  setSelectedEducationLevel("");
                  setSelectedGrade("");
                  setSelectedSubjectName("");
                  fetchData(); // Refresh the notes list
                }}
                onClose={() => {
                  setShowUploadModal(false);
                  setSelectedSubject(null);
                  setSelectedEducationLevel("");
                  setSelectedGrade("");
                  setSelectedSubjectName("");
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Note Viewer/Presentation Mode */}
      {showViewer && filteredNotes.length > 0 && (
        <NoteViewer
          note={filteredNotes[viewerNoteIndex]}
          notes={filteredNotes}
          currentIndex={viewerNoteIndex}
          onClose={() => setShowViewer(false)}
        />
      )}
    </div>
  );
}
