"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { FiUpload, FiFile, FiX, FiAlertCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "axios";

// Learning areas by education level
const LEARNING_AREAS = {
  "Pre-Primary": [
    "Literacy Activities",
    "Mathematical Activities",
    "Environmental Activities",
    "Psychomotor and Creative Activities",
    "Religious Education Activities",
  ],
  "Lower Primary": [
    "Literacy Activities (English/Kiswahili)",
    "Mathematical Activities",
    "Environmental Activities",
    "Hygiene and Nutrition Activities",
    "Religious Education Activities (CRE/IRE/HRE)",
    "Movement and Creative Activities",
  ],
  "Upper Primary": [
    "English",
    "Kiswahili/KSL (Kenyan Sign Language)",
    "Mathematics",
    "Social Studies",
    "Religious Education (CRE/IRE/HRE)",
    "Creative Arts and Sports",
    "Agriculture and Nutrition",
    "Science and Technology",
  ],
  "Junior Secondary": [
    "English",
    "Kiswahili/KSL",
    "Mathematics",
    "Integrated Science",
    "Agriculture",
    "Religious Education (CRE/IRE/HRE)",
    "Creative Arts and Sports",
    "Social Studies",
    "Pre-Technical and Pre-Career Education",
  ],
};

// Grade to education level mapping
const GRADE_TO_LEVEL: { [key: string]: keyof typeof LEARNING_AREAS } = {
  PP1: "Pre-Primary",
  PP2: "Pre-Primary",
  "Grade 1": "Lower Primary",
  "Grade 2": "Lower Primary",
  "Grade 3": "Lower Primary",
  "Grade 4": "Upper Primary",
  "Grade 5": "Upper Primary",
  "Grade 6": "Upper Primary",
  "Grade 7": "Junior Secondary",
  "Grade 8": "Junior Secondary",
  "Grade 9": "Junior Secondary",
};

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

export default function CurriculumUploadPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useCustomAuth();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    grade: "",
    learningArea: "",
  });
  const [availableLearningAreas, setAvailableLearningAreas] = useState<
    string[]
  >([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error("Please login to upload curriculum");
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    // Update available learning areas when grade changes
    if (formData.grade) {
      const level = GRADE_TO_LEVEL[formData.grade];
      if (level) {
        setAvailableLearningAreas(LEARNING_AREAS[level]);
        // Reset learning area selection when grade changes
        setFormData((prev) => ({ ...prev, learningArea: "" }));
      } else {
        // Grade 10 - not yet implemented
        setAvailableLearningAreas([]);
        setFormData((prev) => ({ ...prev, learningArea: "" }));
      }
    }
  }, [formData.grade]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (file: File) => {
    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    const validExtensions = [".pdf", ".docx", ".doc"];

    const fileExtension = file.name.substring(file.name.lastIndexOf("."));
    if (
      !validTypes.includes(file.type) &&
      !validExtensions.includes(fileExtension.toLowerCase())
    ) {
      toast.error("Only PDF and DOCX files are allowed");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!formData.grade) {
      toast.error("Please select a grade");
      return;
    }

    if (!formData.learningArea) {
      toast.error("Please select a learning area");
      return;
    }

    setLoading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", selectedFile);
      uploadFormData.append("grade", formData.grade);
      uploadFormData.append("learning_area", formData.learningArea);

      const response = await axios.post(
        `/api/v1/curriculum/upload`,
        uploadFormData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const data = response.data;
      if (data?.fallback_used) {
        toast(
          (t) => (
            <span>
              Curriculum uploaded, but parsing used a default structure.
              <br />
              This PDF looks scanned or unreadable. Consider uploading DOCX or
              installing OCR dependencies.
            </span>
          ),
          { icon: "⚠️" }
        );
        if (Array.isArray(data?.parse_warnings) && data.parse_warnings.length) {
          console.warn("Parse warnings:", data.parse_warnings);
        }
      } else {
        toast.success("Curriculum uploaded successfully!");
      }
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Failed to upload curriculum. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-[#020617] pt-6 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Curriculum
          </h1>
          <p className="text-gray-600">
            Upload your CBC curriculum document (PDF or DOCX) and we'll help you
            track your progress.
          </p>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grade Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              1. Select Grade Level
            </h2>
            <select
              required
              value={formData.grade}
              onChange={(e) =>
                setFormData({ ...formData, grade: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Choose a grade...</option>
              {GRADES.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>

          {/* Learning Area Selection */}
          {formData.grade && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                2. Select Learning Area
              </h2>
              {formData.grade === "Grade 10" ? (
                <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <FiAlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800">
                      <strong>Grade 10 learning areas</strong> will be
                      implemented later. Please select a different grade for
                      now.
                    </p>
                  </div>
                </div>
              ) : availableLearningAreas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableLearningAreas.map((area) => (
                    <label
                      key={area}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.learningArea === area
                          ? "border-primary-600 bg-primary-50"
                          : "border-gray-200 hover:border-primary-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="learningArea"
                        value={area}
                        checked={formData.learningArea === area}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            learningArea: e.target.value,
                          })
                        }
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        {area}
                      </span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* File Upload */}
          {formData.grade &&
            formData.learningArea &&
            formData.grade !== "Grade 10" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  3. Upload Curriculum Document
                </h2>

                {!selectedFile ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-300 hover:border-primary-400"
                    }`}
                  >
                    <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">
                      Drag and drop your curriculum file here, or
                    </p>
                    <label className="inline-block">
                      <span className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition-colors">
                        Browse Files
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-sm text-gray-500 mt-4">
                      Supported formats: PDF, DOCX (Max size: 10MB)
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-green-300 bg-green-50 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <FiFile className="w-8 h-8 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {selectedFile.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Submit Button */}
          {selectedFile && formData.grade !== "Grade 10" && (
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-[#020617] font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <FiUpload className="w-5 h-5" />
                    <span>Upload Curriculum</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            What happens after upload?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your curriculum will be processed and parsed</li>
            <li>• Lessons and learning outcomes will be extracted</li>
            <li>• You can start tracking your teaching progress</li>
            <li>• Generate reports and monitor completion rates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
