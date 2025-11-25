"use client";

import { useState } from "react";
import { FiX, FiDownload, FiShare2, FiEye } from "react-icons/fi";

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

        {/* Content Area - Actual file display */}
        <div className="flex-1 overflow-auto bg-gray-900">
          {/* PDF Display - Auto-open in new tab due to CORS restrictions */}
          {note.file_type.toLowerCase() === 'pdf' && (
            <div className="h-full flex items-center justify-center p-8">
              <div className="max-w-2xl w-full bg-gray-800 rounded-lg p-8 text-white text-center">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-2xl font-semibold mb-3">{note.title}</h3>
                <p className="text-gray-400 mb-6">
                  Click below to view your PDF document
                </p>
                
                <div className="space-y-3">
                  <a
                    href={note.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-lg font-semibold shadow-lg"
                  >
                    <FiEye size={24} />
                    Open PDF Document
                  </a>
                  
                  <div className="text-sm text-gray-500">or</div>
                  
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    {downloading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <FiDownload size={18} />
                        Download PDF
                      </>
                    )}
                  </button>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-700 text-left">
                  <p className="text-sm text-gray-400 mb-3 font-semibold">Document Details:</p>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                    <div>
                      <strong className="text-gray-400">Type:</strong> PDF Document
                    </div>
                    <div>
                      <strong className="text-gray-400">Size:</strong> {formatFileSize(note.file_size_bytes)}
                    </div>
                    <div className="col-span-2">
                      <strong className="text-gray-400">Created:</strong> {new Date(note.created_at).toLocaleString()}
                    </div>
                  </div>
                  
                  {note.description && (
                    <div className="mt-4">
                      <strong className="text-gray-400">Description:</strong>
                      <p className="text-gray-300 mt-1">{note.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Image Display */}
          {['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(note.file_type.toLowerCase()) && (
            <div className="h-full flex items-center justify-center p-8">
              <img
                src={note.file_url}
                alt={note.title}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          {/* Video Display */}
          {['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(note.file_type.toLowerCase()) && (
            <div className="h-full flex items-center justify-center p-8">
              <video
                src={note.file_url}
                controls
                className="max-w-full max-h-full"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Office Documents (DOCX, PPTX, etc.) - Use Google Docs Viewer */}
          {['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls'].includes(note.file_type.toLowerCase()) && (
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(note.file_url)}&embedded=true`}
              className="w-full h-full border-0"
              title={note.title}
            />
          )}

          {/* Fallback - Show file info for unsupported types */}
          {!['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'mp4', 'mov', 'avi', 'mkv', 'webm', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls'].includes(note.file_type.toLowerCase()) && (
            <div className="h-full flex items-center justify-center p-8">
              <div className="max-w-4xl w-full bg-gray-800 rounded-lg p-8 text-white">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">📎</div>
                  <h3 className="text-2xl font-semibold mb-2">Preview Not Available</h3>
                  <p className="text-gray-400">This file type cannot be previewed directly.</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-3">File Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Title:</span>
                        <p className="text-white font-medium">{note.title}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">File Type:</span>
                        <p className="text-white font-medium">{note.file_type.toUpperCase()}</p>
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
                    </div>
                  </div>

                  {note.description && (
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Description</h4>
                      <p className="text-gray-300">{note.description}</p>
                    </div>
                  )}

                  {note.tags && (
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Tags</h4>
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
          )}
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
