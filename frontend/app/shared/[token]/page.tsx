"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { FiDownload, FiEye } from "react-icons/fi";

interface SharedNote {
  id: number;
  title: string;
  file_url: string;
  file_type: string;
  thumbnail_url?: string;
}

interface SharedPresentation {
  note: SharedNote;
  allow_download: boolean;
  view_count: number;
}

export default function SharedPresentationPage() {
  const params = useParams();
  const token = params.token as string;

  const [presentation, setPresentation] = useState<SharedPresentation | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (token) {
      loadSharedPresentation();
    }
  }, [token]);

  const loadSharedPresentation = async () => {
    try {
      const response = await axios.get(`/api/v1/shared/${token}`);
      setPresentation(response.data);
    } catch (err: any) {
      if (err.response?.status === 410) {
        setError("This share link has expired");
      } else if (err.response?.status === 404) {
        setError("Shared presentation not found");
      } else {
        setError("Failed to load presentation");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!presentation?.note.file_url) return;

    try {
      setDownloading(true);

      // For shared presentations, fetch directly from R2 with proper error handling
      const response = await fetch(presentation.note.file_url, {
        method: "GET",
        headers: {
          Accept: "*/*",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the blob with explicit type
      const blob = await response.blob();

      // Verify blob has content
      if (blob.size === 0) {
        throw new Error("Downloaded file is empty");
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from title or URL
      let filename = presentation.note.title;
      if (!filename.includes(".")) {
        const urlExt = presentation.note.file_url
          .split(".")
          .pop()
          ?.split("?")[0];
        if (urlExt && urlExt.length <= 5) {
          filename = `${filename}.${urlExt}`;
        }
      }

      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      // Clean up after a delay
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Download failed:", error);
      alert(
        "Download failed. The file may have CORS restrictions. Opening in new tab instead."
      );
      // Fallback: open in new tab
      window.open(presentation.note.file_url, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading presentation...</p>
        </div>
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {error || "Presentation Not Found"}
          </h1>
          <p className="text-gray-400">
            This link may have expired or been deactivated
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {presentation.note.title}
            </h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <FiEye size={16} />
                {presentation.view_count} views
              </span>
            </div>
          </div>

          {presentation.allow_download && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          )}
        </div>
      </div>

      {/* Content Area - Display file info only */}
      <div className="h-[calc(100vh-80px)] flex items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-gray-800 rounded-lg p-8 text-white">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-2xl font-bold mb-2">
              {presentation.note.title}
            </h2>
            <p className="text-gray-400">{presentation.note.file_type}</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
              <span className="text-gray-300">Views</span>
              <span className="font-semibold">{presentation.view_count}</span>
            </div>

            {presentation.allow_download ? (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <FiDownload size={24} />
                    Download File
                  </>
                )}
              </button>
            ) : (
              <div className="p-4 bg-gray-700 rounded-lg text-center text-gray-400">
                <p>Downloads are disabled for this file</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
            <p>Shared via TeachTrack</p>
          </div>
        </div>
      </div>
    </div>
  );
}
