"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiBook, FiSave, FiEdit2, FiPlus } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

interface LessonConfig {
  subject_name: string;
  grade: string;
  lessons_per_week: number;
  double_lessons_per_week: number;
  single_lesson_duration: number;
  double_lesson_duration: number;
  user_count: number;
}

// CBC Grade levels and their subjects
const GRADE_LEVELS = {
  "Pre-Primary": ["Pre-Primary 1 (PP1)", "Pre-Primary 2 (PP2)"],
  "Lower Primary": ["Grade 1", "Grade 2", "Grade 3"],
  "Upper Primary": ["Grade 4", "Grade 5", "Grade 6"],
  "Junior Secondary": ["Grade 7", "Grade 8", "Grade 9"],
};

const LEARNING_AREAS = {
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
};

export default function LessonsConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<LessonConfig[]>([]);
  const [selectedLevel, setSelectedLevel] =
    useState<keyof typeof GRADE_LEVELS>("Junior Secondary");
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

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    // Update selected grade when level changes
    setSelectedGrade(GRADE_LEVELS[selectedLevel][0]);
  }, [selectedLevel]);

  const fetchConfigs = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get("/api/v1/admin/lessons-per-week", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConfigs(response.data.configs || []);
    } catch (error) {
      console.error("Failed to fetch configs:", error);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        toast.error("Admin access required");
        router.push("/admin/dashboard");
      } else {
        toast.error("Failed to load lesson configurations");
      }
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
        user_count: 0,
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

    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        "/api/v1/admin/lessons-per-week",
        {
          subject_name: editingConfig.subject_name,
          grade: editingConfig.grade,
          ...editValues,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Configuration updated successfully");
      setEditingConfig(null);
      fetchConfigs();
    } catch (error) {
      console.error("Failed to save config:", error);
      toast.error("Failed to save configuration");
    }
  };

  const cancelEditing = () => {
    setEditingConfig(null);
  };

  const isEditing = (subject: string, grade: string) => {
    return (
      editingConfig?.subject_name === subject && editingConfig?.grade === grade
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Lessons Per Week Configuration
          </h1>
          <p className="text-gray-600">
            Configure the number of lessons per week for each learning area and
            grade
          </p>
        </div>

        {/* Grade Level Selector */}
        <div className="glass-card bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Education Level
              </label>
              <select
                value={selectedLevel}
                onChange={(e) =>
                  setSelectedLevel(e.target.value as keyof typeof GRADE_LEVELS)
                }
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
                {GRADE_LEVELS[selectedLevel].map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="glass-card bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
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
                    Single Duration (min)
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">
                    Double Duration (min)
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">
                    Users
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {LEARNING_AREAS[selectedLevel].map((subjectName, index) => {
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
                            min="30"
                            max="90"
                            step="5"
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
                            {config.single_lesson_duration} min
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            min="60"
                            max="120"
                            step="5"
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
                            {config.double_lesson_duration} min
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm text-gray-600">
                          {config.user_count}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={saveConfig}
                              className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                            >
                              <FiSave className="w-4 h-4" />
                              Save
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

          <div className="mt-8 p-4 bg-indigo-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">How it works:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>
                • When you update a configuration, it applies to ALL users with
                that subject and grade
              </li>
              <li>
                • Lessons per week determines how many lessons appear in each
                week of the scheme
              </li>
              <li>
                • Double lessons are for subjects that have longer class periods
              </li>
              <li>
                • Changes take effect immediately for new schemes generated
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
