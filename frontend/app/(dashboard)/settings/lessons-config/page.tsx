"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FiBook, FiSave, FiEdit2, FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";

interface LessonConfig {
  subject_name: string;
  grade: string;
  lessons_per_week: number;
  double_lessons_per_week: number;
  single_lesson_duration: number;
  double_lesson_duration: number;
}

// CBC Grade levels and their subjects
const GRADE_LEVELS = {
  "Pre-Primary": ["Pre-Primary 1 (PP1)", "Pre-Primary 2 (PP2)"],
  "Lower Primary": ["Grade 1", "Grade 2", "Grade 3"],
  "Upper Primary": ["Grade 4", "Grade 5", "Grade 6"],
  "Junior Secondary": ["Grade 7", "Grade 8", "Grade 9"],
  "Senior Secondary": ["Grade 10", "Grade 11", "Grade 12"],
};

const LEARNING_AREAS: { [key: string]: string[] } = {
  "Pre-Primary": [
    "Language Activities",
    "Mathematical Activities",
    "Environmental Activities",
    "Psychomotor and Creative Activities",
    "Religious Education Activities",
  ],
  "Lower Primary": [
    "English",
    "Kiswahili / Kenyan Sign Language",
    "Mathematics",
    "Integrated Science",
    "Health Education",
    "Pre-Technical and Pre-Career Education",
    "Religious Education",
    "Creative Arts and Sports",
  ],
  "Upper Primary": [
    "English",
    "Kiswahili / Kenyan Sign Language",
    "Mathematics",
    "Integrated Science",
    "Health Education",
    "Pre-Technical and Pre-Career Education",
    "Social Studies",
    "Religious Education",
    "Creative Arts and Sports",
    "Business Studies",
    "Agriculture",
  ],
  "Junior Secondary": [
    "English",
    "Kiswahili / Kenyan Sign Language",
    "Mathematics",
    "Integrated Science",
    "Health Education",
    "Pre-Technical Studies",
    "Social Studies",
    "Religious Education",
    "Sports and Physical Education",
    "Creative Arts",
    "Business Studies",
    "Agriculture",
    "Life Skills Education",
  ],
  "Senior Secondary": [
    "English",
    "Kiswahili",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Geography",
    "History",
    "Religious Education",
    "Business Studies",
    "Agriculture",
    "Computer Science",
    "Music",
    "Fine Art",
    "Physical Education",
  ],
};

export default function TeacherLessonsConfigPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<LessonConfig[]>([]);
  const [selectedLevel, setSelectedLevel] =
    useState<string>("Junior Secondary");
  const [selectedGrade, setSelectedGrade] = useState<string>("Grade 7");
  const [editingConfig, setEditingConfig] = useState<{
    subject_name: string;
    grade: string;
  } | null>(null);
  const [editValues, setEditValues] = useState({
    lessons_per_week: 5,
    double_lessons_per_week: 0,
    single_lesson_duration: 40,
    double_lesson_duration: 80,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    fetchConfigs();
  }, [session, status]);

  useEffect(() => {
    // Update selected grade when level changes
    const grades = GRADE_LEVELS[selectedLevel as keyof typeof GRADE_LEVELS];
    if (grades && grades.length > 0) {
      setSelectedGrade(grades[0]);
    }
  }, [selectedLevel]);

  const fetchConfigs = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await axios.get(
        `${apiUrl}/api/v1/profile/lessons-config`,
        {
          withCredentials: true,
        }
      );
      setConfigs(response.data.configs || []);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error("Failed to fetch configs:", error);
      }
      // Use defaults if no config found
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  const getConfigForSubject = (
    subjectName: string,
    grade: string
  ): LessonConfig => {
    const existing = configs.find(
      (c) => c.subject_name === subjectName && c.grade === grade
    );
    return (
      existing || {
        subject_name: subjectName,
        grade: grade,
        lessons_per_week: 5,
        double_lessons_per_week: 0,
        single_lesson_duration: 40,
        double_lesson_duration: 80,
      }
    );
  };

  const startEditing = (config: LessonConfig) => {
    setEditingConfig({
      subject_name: config.subject_name,
      grade: config.grade,
    });
    setEditValues({
      lessons_per_week: config.lessons_per_week,
      double_lessons_per_week: config.double_lessons_per_week,
      single_lesson_duration: config.single_lesson_duration,
      double_lesson_duration: config.double_lesson_duration,
    });
  };

  const saveConfig = async () => {
    if (!editingConfig) return;

    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await axios.post(
        `${apiUrl}/api/v1/profile/lessons-config`,
        {
          subject_name: editingConfig.subject_name,
          grade: editingConfig.grade,
          ...editValues,
        },
        {
          withCredentials: true,
        }
      );

      toast.success("Configuration saved!");
      setEditingConfig(null);
      fetchConfigs();
    } catch (error: any) {
      console.error("Failed to save config:", error);
      toast.error(
        error.response?.data?.detail || "Failed to save configuration"
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditingConfig(null);
  };

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Auth check
  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Authentication Required
          </h2>
          <p className="text-red-700">
            Please log in to access lessons configuration.
          </p>
        </div>
      </div>
    );
  }

  const currentLearningAreas = LEARNING_AREAS[selectedLevel] || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Link */}
        <Link
          href="/settings/profile"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FiBook className="w-8 h-8 text-indigo-600" />
            Lessons Per Week Configuration
          </h1>
          <p className="text-gray-600 mt-2">
            Configure the number of lessons per week for each learning area and
            grade
          </p>
        </div>

        {/* Grade Level Selector */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Education Level
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {Object.keys(GRADE_LEVELS).map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Grade
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {(
                  GRADE_LEVELS[selectedLevel as keyof typeof GRADE_LEVELS] || []
                ).map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Learning Areas Table */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            {selectedGrade} Learning Areas
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">
                    Learning Area
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">
                    Lessons/Week
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">
                    Double Lessons
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">
                    Single (min)
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">
                    Double (min)
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentLearningAreas.map((subjectName, index) => {
                  const config = getConfigForSubject(
                    subjectName,
                    selectedGrade
                  );
                  const isEditing =
                    editingConfig?.subject_name === config.subject_name &&
                    editingConfig?.grade === config.grade;
                  return (
                    <tr
                      key={`${config.subject_name}-${config.grade}`}
                      className={`border-b border-gray-100 hover:bg-indigo-50/50 transition-colors ${
                        index % 2 === 0 ? "bg-gray-50/50" : ""
                      }`}
                    >
                      <td className="py-4 px-4 font-medium text-gray-900">
                        {config.subject_name}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={editValues.lessons_per_week}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                lessons_per_week: parseInt(e.target.value) || 5,
                              })
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <span className="font-semibold text-indigo-600">
                            {config.lessons_per_week}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="5"
                            value={editValues.double_lessons_per_week}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                double_lessons_per_week:
                                  parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <span className="text-gray-700">
                            {config.double_lessons_per_week}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            max="90"
                            value={editValues.single_lesson_duration}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                single_lesson_duration:
                                  parseInt(e.target.value) || 40,
                              })
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <span className="text-gray-700">
                            {config.single_lesson_duration}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            max="180"
                            value={editValues.double_lesson_duration}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                double_lesson_duration:
                                  parseInt(e.target.value) || 80,
                              })
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <span className="text-gray-700">
                            {config.double_lesson_duration}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={saveConfig}
                              disabled={saving}
                              className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <FiSave className="w-4 h-4" />
                              {saving ? "..." : "Save"}
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="bg-gray-400 text-white px-3 py-1 rounded-lg hover:bg-gray-500 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(config)}
                            className="bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 mx-auto"
                          >
                            <FiEdit2 className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-indigo-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">How it works:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>
                • <strong>Lessons per week</strong> determines how many lessons
                appear in each week of your scheme
              </li>
              <li>
                • <strong>Double lessons</strong> are for subjects that require
                longer class periods (e.g., practicals)
              </li>
              <li>
                • <strong>Single/Double duration</strong> sets the time for each
                lesson type in minutes
              </li>
              <li>
                • Changes apply to new schemes and timetables you generate
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
