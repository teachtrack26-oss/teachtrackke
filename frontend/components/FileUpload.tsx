"use client";

import { useState } from "react";
import { FiUpload, FiX, FiFile, FiCheck, FiAlertCircle } from "react-icons/fi";

interface FileUploadProps {
  subjectId?: number | null;
  strandId?: number;
  substrandId?: number;
  lessonId?: number;
  onSuccess?: (note: any) => void;
  onClose?: () => void;
}

export default function FileUpload({
  subjectId,
  strandId,
  substrandId,
  lessonId,
  onSuccess,
  onClose,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const allowedTypes = [
    "pdf",
    "docx",
    "doc",
    "pptx",
    "ppt",
    "xlsx",
    "xls",
    "txt",
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "svg",
    "mp4",
    "mov",
    "avi",
    "mkv",
    "webm",
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (extension: string) => {
    const ext = extension.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "bmp", "svg"].includes(ext)) return "🖼️";
    if (["pdf"].includes(ext)) return "📄";
    if (["docx", "doc"].includes(ext)) return "📝";
    if (["pptx", "ppt"].includes(ext)) return "📊";
    if (["xlsx", "xls"].includes(ext)) return "📊";
    if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "🎥";
    return "📎";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const extension = selectedFile.name.split(".").pop()?.toLowerCase();

      // Validate file type
      if (!extension || !allowedTypes.includes(extension)) {
        setErrorMessage(`File type .${extension} is not allowed`);
        setUploadStatus("error");
        return;
      }

      // Validate file size (50MB max)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setErrorMessage("File size exceeds 50MB limit");
        setUploadStatus("error");
        return;
      }

      setFile(selectedFile);
      setUploadStatus("idle");
      setErrorMessage("");

      // Auto-fill title from filename if empty
      if (!title) {
        const nameWithoutExt = selectedFile.name.substring(
          0,
          selectedFile.name.lastIndexOf(".")
        );
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !title) {
      setErrorMessage("Please select a file and enter a title");
      setUploadStatus("error");
      return;
    }

    setUploading(true);
    setUploadStatus("idle");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    if (subjectId) formData.append("subject_id", subjectId.toString());
    if (strandId) formData.append("strand_id", strandId.toString());
    if (substrandId) formData.append("substrand_id", substrandId.toString());
    if (lessonId) formData.append("lesson_id", lessonId.toString());
    if (description) formData.append("description", description);
    if (tags) formData.append("tags", tags);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/v1/notes/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadStatus("success");

        // Reset form
        setTimeout(() => {
          setFile(null);
          setTitle("");
          setDescription("");
          setTags("");
          setUploadStatus("idle");

          if (onSuccess) onSuccess(data.note);
          if (onClose) onClose();
        }, 2000);
      } else {
        const error = await response.json();

        // Handle validation errors (422) which return an array of error objects
        if (Array.isArray(error.detail)) {
          const errorMessages = error.detail
            .map((err: any) => err.msg)
            .join(", ");
          setErrorMessage(errorMessages || "Validation failed");
        } else if (typeof error.detail === "string") {
          setErrorMessage(error.detail);
        } else if (error.message) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Upload failed");
        }

        setUploadStatus("error");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Upload error occurred"
      );
      setUploadStatus("error");
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploadStatus("idle");
    setErrorMessage("");
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FiUpload className="text-blue-600" />
          Upload Note/Resource
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        )}
      </div>

      {/* Upload Status Messages */}
      {uploadStatus === "success" && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <FiCheck className="text-green-600" size={20} />
          <span className="text-green-800 font-medium">
            File uploaded successfully!
          </span>
        </div>
      )}

      {uploadStatus === "error" && errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <FiAlertCircle className="text-red-600" size={20} />
          <span className="text-red-800">{errorMessage}</span>
        </div>
      )}

      <div className="space-y-5">
        {/* File Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select File *
          </label>

          {!file ? (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FiUpload className="text-gray-400 mb-3" size={40} />
                <p className="mb-2 text-sm text-gray-600">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500">
                  PDF, DOCX, PPTX, Images, Videos (Max 50MB)
                </p>
              </div>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-4xl">
                {getFileIcon(file.name.split(".").pop() || "")}
              </span>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-600">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                onClick={clearFile}
                className="text-red-500 hover:text-red-700 p-2"
              >
                <FiX size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter note title"
            disabled={uploading}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Add a description..."
            disabled={uploading}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tags (Optional)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., worksheets, lesson-plan, assessment"
            disabled={uploading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Separate multiple tags with commas
          </p>
        </div>

        {/* Upload Button */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleUpload}
            disabled={!file || !title || uploading}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              <>
                <FiUpload />
                Upload File
              </>
            )}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-semibold transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Allowed File Types Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900 font-medium mb-2">
          Supported File Types:
        </p>
        <p className="text-xs text-blue-700">
          Documents: PDF, DOCX, DOC, PPTX, PPT, XLSX, XLS, TXT
          <br />
          Images: JPG, JPEG, PNG, GIF, BMP, SVG
          <br />
          Videos: MP4, MOV, AVI, MKV, WEBM
        </p>
      </div>
    </div>
  );
}
