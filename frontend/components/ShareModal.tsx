"use client";

import { useState, useEffect } from "react";
import { FiX, FiCopy, FiCheck, FiTrash2, FiExternalLink } from "react-icons/fi";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ShareLink {
  id: number;
  share_url: string;
  expires_at: string | null;
  is_active: boolean;
  view_count: number;
  allow_download: boolean;
  created_at: string;
}

interface ShareModalProps {
  noteId: number;
  noteTitle: string;
  onClose: () => void;
}

export default function ShareModal({
  noteId,
  noteTitle,
  onClose,
}: ShareModalProps) {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);
  const [allowDownload, setAllowDownload] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    loadShareLinks();
  }, []);

  const loadShareLinks = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/notes/${noteId}/shares`,
        { withCredentials: true }
      );
      setShareLinks(response.data);
    } catch (error) {
      console.error("Failed to load share links:", error);
    }
  };

  const createShareLink = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/v1/notes/${noteId}/share`,
        {
          expires_in_days: expiryDays > 0 ? expiryDays : null,
          allow_download: allowDownload,
        },
        { withCredentials: true }
      );
      setShareLinks([response.data, ...shareLinks]);
    } catch (error) {
      console.error("Failed to create share link:", error);
      alert("Failed to create share link");
    } finally {
      setLoading(false);
    }
  };

  const deleteShareLink = async (shareId: number) => {
    if (!confirm("Deactivate this share link?")) return;

    try {
      await axios.delete(`${API_URL}/api/v1/shares/${shareId}`, {
        withCredentials: true,
      });
      setShareLinks(
        shareLinks.map((link) =>
          link.id === shareId ? { ...link, is_active: false } : link
        )
      );
    } catch (error) {
      console.error("Failed to delete share link:", error);
    }
  };

  const copyToClipboard = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Share Presentation
            </h2>
            <p className="text-sm text-gray-500 mt-1">{noteTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Create New Share Link */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Create New Share Link
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry (days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0 = never expires"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Set to 0 for no expiry
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowDownload"
                  checked={allowDownload}
                  onChange={(e) => setAllowDownload(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="allowDownload"
                  className="ml-2 text-sm text-gray-700"
                >
                  Allow viewers to download the file
                </label>
              </div>

              <button
                onClick={createShareLink}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md font-medium transition-colors"
              >
                {loading ? "Creating..." : "Generate Share Link"}
              </button>
            </div>
          </div>

          {/* Existing Share Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Active Share Links
            </h3>

            {shareLinks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No share links created yet
              </p>
            ) : (
              <div className="space-y-3">
                {shareLinks.map((link) => (
                  <div
                    key={link.id}
                    className={`border rounded-lg p-4 ${
                      link.is_active
                        ? "border-gray-200 bg-white"
                        : "border-gray-200 bg-gray-50 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              link.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {link.is_active ? "Active" : "Inactive"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {link.view_count} views
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            value={link.share_url}
                            readOnly
                            className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded px-3 py-2 font-mono"
                          />
                          <button
                            onClick={() =>
                              copyToClipboard(link.share_url, link.id)
                            }
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Copy link"
                          >
                            {copiedId === link.id ? (
                              <FiCheck size={18} className="text-green-600" />
                            ) : (
                              <FiCopy size={18} />
                            )}
                          </button>
                          <a
                            href={link.share_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Open link"
                          >
                            <FiExternalLink size={18} />
                          </a>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Created: {formatDate(link.created_at)}</span>
                          {link.expires_at && (
                            <span>Expires: {formatDate(link.expires_at)}</span>
                          )}
                          {link.allow_download && (
                            <span className="text-blue-600">
                              Download enabled
                            </span>
                          )}
                        </div>
                      </div>

                      {link.is_active && (
                        <button
                          onClick={() => deleteShareLink(link.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Deactivate"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
