"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiArrowLeft, FiSave, FiPlus, FiTrash2 } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

interface WeekLesson {
  lesson_id?: number;
  lesson_title: string;
  strand: string;
  sub_strand: string;
  specific_learning_outcomes: string;
  key_inquiry_questions: string;
  learning_experiences: string;
  learning_resources: string;
  assessment_methods: string;
  reflection: string;
}

interface Week {
  week_number: number;
  lessons: WeekLesson[];
}

interface SchemeOfWork {
  id: number;
  subject_id: number;
  subject_name: string;
  grade: string;
  term_number: number;
  term_year: number;
  total_weeks: number;
  total_lessons: number;
  status: "draft" | "active" | "completed";
  weeks: Week[];
}

export default function EditSchemePage() {
  const router = useRouter();
  const params = useParams();
  const schemeId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scheme, setScheme] = useState<SchemeOfWork | null>(null);

  useEffect(() => {
    if (schemeId) {
      fetchScheme();
    }
  }, [schemeId]);

  const fetchScheme = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`/api/v1/schemes/${schemeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setScheme(response.data);
    } catch (error) {
      console.error("Failed to fetch scheme:", error);
      toast.error("Failed to load scheme of work");
      router.push("/professional-records");
    } finally {
      setLoading(false);
    }
  };

  const updateLesson = (
    weekIndex: number,
    lessonIndex: number,
    field: keyof WeekLesson,
    value: string
  ) => {
    if (!scheme) return;

    const updatedWeeks = [...scheme.weeks];
    updatedWeeks[weekIndex].lessons[lessonIndex] = {
      ...updatedWeeks[weekIndex].lessons[lessonIndex],
      [field]: value,
    };

    setScheme({
      ...scheme,
      weeks: updatedWeeks,
    });
  };

  const addLesson = (weekIndex: number) => {
    if (!scheme) return;

    const updatedWeeks = [...scheme.weeks];
    updatedWeeks[weekIndex].lessons.push({
      lesson_title: "",
      strand: "",
      sub_strand: "",
      specific_learning_outcomes:
        "By the end of the sub-strand, the learner should be able to:\na. \nb. \nc. ",
      key_inquiry_questions: "",
      learning_experiences: "The learner is guided to:\n● \n● ",
      learning_resources: "",
      assessment_methods: "",
      reflection: "",
    });

    setScheme({
      ...scheme,
      weeks: updatedWeeks,
      total_lessons: scheme.total_lessons + 1,
    });
  };

  const removeLesson = (weekIndex: number, lessonIndex: number) => {
    if (!scheme) return;
    if (scheme.weeks[weekIndex].lessons.length === 1) {
      toast.error("Each week must have at least one lesson");
      return;
    }

    const updatedWeeks = [...scheme.weeks];
    updatedWeeks[weekIndex].lessons.splice(lessonIndex, 1);

    setScheme({
      ...scheme,
      weeks: updatedWeeks,
      total_lessons: scheme.total_lessons - 1,
    });
  };

  const handleSave = async () => {
    if (!scheme) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(`/api/v1/schemes/${schemeId}`, scheme, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Scheme updated successfully!");
      router.push(`/professional-records/schemes/${schemeId}`);
    } catch (error) {
      console.error("Failed to update scheme:", error);
      toast.error("Failed to update scheme of work");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Loading scheme...</p>
        </div>
      </div>
    );
  }

  if (!scheme) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() =>
              router.push(`/professional-records/schemes/${schemeId}`)
            }
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4 font-medium"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to View Scheme
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
                Edit Scheme of Work
              </h1>
              <p className="text-lg text-gray-700 mt-2">
                {scheme.subject_name} - {scheme.grade} - Term{" "}
                {scheme.term_number} • {scheme.term_year}
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300 disabled:opacity-50"
            >
              <FiSave className="w-5 h-5" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Editing Form */}
        <div className="space-y-6">
          {scheme.weeks.map((week, weekIndex) => (
            <div
              key={week.week_number}
              className="glass-card bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Week {week.week_number}
                </h2>
                <button
                  onClick={() => addLesson(weekIndex)}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300"
                >
                  <FiPlus className="w-4 h-4" />
                  Add Lesson
                </button>
              </div>

              <div className="space-y-6">
                {week.lessons.map((lesson, lessonIndex) => (
                  <div
                    key={lessonIndex}
                    className="bg-gray-50 rounded-xl p-6 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-indigo-600">
                        Lesson {lessonIndex + 1}
                      </h3>
                      {week.lessons.length > 1 && (
                        <button
                          onClick={() => removeLesson(weekIndex, lessonIndex)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Strand/Theme
                        </label>
                        <input
                          type="text"
                          value={lesson.strand}
                          onChange={(e) =>
                            updateLesson(
                              weekIndex,
                              lessonIndex,
                              "strand",
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Sub-strand
                        </label>
                        <input
                          type="text"
                          value={lesson.sub_strand}
                          onChange={(e) =>
                            updateLesson(
                              weekIndex,
                              lessonIndex,
                              "sub_strand",
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Specific Learning Outcomes
                        </label>
                        <textarea
                          value={lesson.specific_learning_outcomes}
                          onChange={(e) =>
                            updateLesson(
                              weekIndex,
                              lessonIndex,
                              "specific_learning_outcomes",
                              e.target.value
                            )
                          }
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Key Inquiry Questions
                        </label>
                        <textarea
                          value={lesson.key_inquiry_questions}
                          onChange={(e) =>
                            updateLesson(
                              weekIndex,
                              lessonIndex,
                              "key_inquiry_questions",
                              e.target.value
                            )
                          }
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Learning/Teaching Experience
                        </label>
                        <textarea
                          value={lesson.learning_experiences}
                          onChange={(e) =>
                            updateLesson(
                              weekIndex,
                              lessonIndex,
                              "learning_experiences",
                              e.target.value
                            )
                          }
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Learning Resources
                        </label>
                        <textarea
                          value={lesson.learning_resources}
                          onChange={(e) =>
                            updateLesson(
                              weekIndex,
                              lessonIndex,
                              "learning_resources",
                              e.target.value
                            )
                          }
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Assessment Methods
                        </label>
                        <textarea
                          value={lesson.assessment_methods}
                          onChange={(e) =>
                            updateLesson(
                              weekIndex,
                              lessonIndex,
                              "assessment_methods",
                              e.target.value
                            )
                          }
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Reflection (Post-teaching notes)
                        </label>
                        <textarea
                          value={lesson.reflection}
                          onChange={(e) =>
                            updateLesson(
                              weekIndex,
                              lessonIndex,
                              "reflection",
                              e.target.value
                            )
                          }
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Fill this after teaching the lesson..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Save Button at Bottom */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300 disabled:opacity-50"
          >
            <FiSave className="w-5 h-5" />
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
