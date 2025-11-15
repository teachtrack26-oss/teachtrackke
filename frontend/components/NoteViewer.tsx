"use client";

import { useState } from "react";
import { FiX, FiDownload, FiShare2 } from "react-icons/fi";

import ShareModal from "./ShareModal";

interface Note {
  id: number;
  title: string;
  file_url: string;
  file_type: string;
  file_size_bytes: number;
  thumbnail_url?: string;
  description?: string;
  subject_id?: number;
  tags?: string;
  is_favorite: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

interface NoteViewerProps {
  note: Note;
  onClose: () => void;
  notes?: Note[]; // Optional: for navigation between notes
  currentIndex?: number;
}

export default function NoteViewer({ note, onClose }: NoteViewerProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // Download file using backend endpoint (proxies through Cloudinary)
  const handleDownload = async () => {
    try {
      setDownloading(true);

      // Prefer relative API path so Next.js proxy & axios interceptors (auth) apply.
      // Fallback to explicit backend URL only if NEXT_PUBLIC_API_URL is set.
      const API_URL = process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
        : "/api/v1";

      // Token storage inconsistency fix: other requests use localStorage key 'accessToken'.
      // Fallback to 'token' in case of older storage scheme.
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        "";

      if (!token) {
        console.warn(
          "No auth token found for download. Ensure login sets 'accessToken' in localStorage."
        );
      }

      // Use backend download endpoint
      const response = await fetch(`${API_URL}/notes/${note.id}/download`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      // Get the blob
      const blob = await response.blob();

      // Get filename from Content-Disposition header or use title
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = note.title;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      } else if (!filename.includes(".")) {
        // Add file extension based on file_type if missing
        filename = `${filename}.${note.file_type.toLowerCase()}`;
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download file. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/95 backdrop-blur-sm">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white mb-1">
                {note.title}
              </h2>
              <p className="text-sm text-gray-400">
                {note.file_type} • {formatFileSize(note.file_size_bytes)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowShareModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                title="Share"
              >
                <FiShare2 size={18} />
                Share
              </button>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <FiDownload size={18} />
                    Download
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                title="Close"
              >
                <FiX size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area - Basic file info display */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg p-8 text-white">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">File Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Title:</span>
                    <p className="text-white font-medium">{note.title}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">File Type:</span>
                    <p className="text-white font-medium">{note.file_type}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">File Size:</span>
                    <p className="text-white font-medium">
                      {formatFileSize(note.file_size_bytes)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Views:</span>
                    <p className="text-white font-medium">{note.view_count}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Created:</span>
                    <p className="text-white font-medium">
                      {new Date(note.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Updated:</span>
                    <p className="text-white font-medium">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {note.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-300">{note.description}</p>
                </div>
              )}

              {note.tags && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {note.tags.split(",").map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-700 rounded-full text-sm"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-gray-700">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <FiDownload size={18} />
                      Download File
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          noteId={note.id}
          noteTitle={note.title}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
