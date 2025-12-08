"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiChevronRight,
  FiChevronDown,
  FiBook,
  FiCheckCircle,
  FiCircle,
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import {
  parseLessons,
  getLessonsForSubstrand,
  Lesson,
} from "../../../lib/curriculum";
import { SecurityWrapper } from "@/components/SecurityWrapper";

// Lesson type now imported from lib/curriculum with runtime validation

interface SubStrand {
  id: number;
  substrand_code: string;
  substrand_name: string;
  lessons_count: number;
  learning_outcomes: string;
  key_inquiry_questions: string;
  specific_learning_outcomes: string[];
  suggested_learning_experiences: string[];
  core_competencies: string[];
  values: string[];
  pcis: string[];
  links_to_other_subjects: string[];
  sequence_order: number;
}

interface Strand {
  id: number;
  strand_code: string;
  strand_name: string;
  sequence_order: number;
  sub_strands: SubStrand[];
}

interface Subject {
  id: number;
  subject_name: string;
  grade: string;
  total_lessons: number;
  lessons_completed: number;
  progress_percentage: number;
  strands: Strand[];
}

export default function CurriculumDetailPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.id;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStrands, setExpandedStrands] = useState<Set<number>>(
    new Set()
  );
  const [expandedSubStrands, setExpandedSubStrands] = useState<Set<number>>(
    new Set()
  );
  const [completingLesson, setCompletingLesson] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const userStr = localStorage.getItem("user");

    if (!token) {
      toast.error("Please login to access curriculum");
      router.push("/login");
      return;
    }

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserEmail(user.email || "");
        // Check if user is super admin (adjust based on your actual user object structure)
        setIsSuperAdmin(user.role === "SUPER_ADMIN" || user.is_admin === true);
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }

    fetchSubjectDetails();
    fetchLessons();
  }, [subjectId, router]);

  const fetchSubjectDetails = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`/api/v1/subjects/${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.data) {
        throw new Error("No data received from server");
      }

      setSubject(response.data);

      // Expand all strands by default
      if (response.data.strands && Array.isArray(response.data.strands)) {
        setExpandedStrands(
          new Set(response.data.strands.map((s: Strand) => s.id))
        );
      }
    } catch (error) {
      console.error("Failed to fetch subject details:", error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }
        toast.error(
          error.response?.data?.detail || "Failed to load curriculum details"
        );
      } else {
        toast.error("Failed to load curriculum details");
      }
      router.push("/curriculum");
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `/api/v1/subjects/${subjectId}/lessons`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const fetchedLessons = parseLessons(response.data);
      console.log("=== LESSONS FETCHED (validated) ===");
      console.log("Total lessons:", fetchedLessons.length);
      if (fetchedLessons.length > 0) {
        console.log("First lesson (validated):", fetchedLessons[0]);
        console.log("Using substrand_id for linking lessons to sub-strands");
      }
      setLessons(fetchedLessons);
    } catch (error) {
      console.error("Failed to fetch lessons:", error);
    }
  };

  const toggleLessonCompletion = async (
    lessonId: number,
    isCompleted: boolean
  ) => {
    setCompletingLesson(lessonId);
    try {
      const token = localStorage.getItem("accessToken");
      const endpoint = isCompleted ? "uncomplete" : "complete";

      await axios.post(
        `/api/v1/lessons/${lessonId}/${endpoint}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update local state
      setLessons((prev) =>
        prev.map((lesson) =>
          lesson.id === lessonId
            ? {
                ...lesson,
                is_completed: !isCompleted,
                completed_at: isCompleted ? null : new Date().toISOString(),
              }
            : lesson
        )
      );

      // Refresh subject to update progress
      fetchSubjectDetails();

      toast.success(
        isCompleted ? "Lesson marked as incomplete" : "Lesson completed! ✓"
      );
    } catch (error) {
      console.error("Failed to toggle lesson:", error);
      toast.error("Failed to update lesson status");
    } finally {
      setCompletingLesson(null);
    }
  };

  const getLessonsForSubstrandLocal = (substrandId: number) => {
    return getLessonsForSubstrand(lessons, substrandId);
  };

  const toggleStrand = (strandId: number) => {
    const newExpanded = new Set(expandedStrands);
    if (newExpanded.has(strandId)) {
      newExpanded.delete(strandId);
    } else {
      newExpanded.add(strandId);
    }
    setExpandedStrands(newExpanded);
  };

  const toggleSubStrand = (subStrandId: number) => {
    const newExpanded = new Set(expandedSubStrands);
    if (newExpanded.has(subStrandId)) {
      newExpanded.delete(subStrandId);
    } else {
      newExpanded.add(subStrandId);
    }
    setExpandedSubStrands(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Subject Not Found
          </h1>
          <button
            onClick={() => router.push("/curriculum")}
            className="text-indigo-600 hover:text-indigo-700"
          >
            Return to Curriculum
          </button>
        </div>
      </div>
    );
  }

  return (
    <SecurityWrapper
      watermarkText={userEmail || "CONFIDENTIAL"}
      isSuperAdmin={isSuperAdmin}
    >
      <div className="min-h-screen bg-gray-50 pt-6 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/curriculum")}
              className="text-indigo-600 hover:text-indigo-700 mb-4 inline-flex items-center"
            >
              ← Back to Curriculum
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {subject.subject_name} - Grade {subject.grade}
            </h1>
            <p className="text-gray-600">
              {subject.total_lessons} lessons • {subject.strands?.length || 0}{" "}
              strands
            </p>
          </div>

          {/* Progress Overview */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Overall Progress
              </h2>
              <span className="text-2xl font-bold text-indigo-600">
                {Math.round(subject.progress_percentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${subject.progress_percentage}%` }}
              />
            </div>
            <div className="mt-4 flex justify-between text-sm text-gray-600">
              <span>
                {subject.lessons_completed} / {subject.total_lessons} lessons
                completed
              </span>
              <span>
                {subject.total_lessons - subject.lessons_completed} remaining
              </span>
            </div>
          </div>

          {/* Strands */}
          <div className="space-y-4">
            {subject.strands && subject.strands.length > 0 ? (
              subject.strands
                .sort((a, b) => a.sequence_order - b.sequence_order)
                .map((strand) => (
                  <div
                    key={strand.id}
                    className="bg-white rounded-lg shadow-md"
                  >
                    {/* Strand Header */}
                    <button
                      onClick={() => toggleStrand(strand.id)}
                      className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        {expandedStrands.has(strand.id) ? (
                          <FiChevronDown className="w-6 h-6 text-gray-500" />
                        ) : (
                          <FiChevronRight className="w-6 h-6 text-gray-500" />
                        )}
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {strand.strand_code}. {strand.strand_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {strand.sub_strands.length} sub-strands
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Sub-Strands */}
                    {expandedStrands.has(strand.id) && (
                      <div className="border-t border-gray-200">
                        {strand.sub_strands
                          .sort((a, b) => a.sequence_order - b.sequence_order)
                          .map((subStrand) => (
                            <div
                              key={subStrand.id}
                              className="border-b border-gray-100 last:border-b-0"
                            >
                              {/* Sub-Strand Header */}
                              <button
                                onClick={() => toggleSubStrand(subStrand.id)}
                                className="w-full p-6 pl-16 flex items-center justify-between hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center space-x-4">
                                  {expandedSubStrands.has(subStrand.id) ? (
                                    <FiChevronDown className="w-5 h-5 text-gray-500" />
                                  ) : (
                                    <FiChevronRight className="w-5 h-5 text-gray-500" />
                                  )}
                                  <div className="text-left">
                                    <h4 className="text-md font-medium text-gray-900">
                                      {subStrand.substrand_code}.{" "}
                                      {subStrand.substrand_name}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      {subStrand.lessons_count} lessons
                                    </p>
                                  </div>
                                </div>
                              </button>

                              {/* Sub-Strand Details */}
                              {expandedSubStrands.has(subStrand.id) && (
                                <div className="p-6 pl-24 bg-gray-50 space-y-6">
                                  {/* Specific Learning Outcomes */}
                                  {subStrand.specific_learning_outcomes &&
                                    subStrand.specific_learning_outcomes
                                      .length > 0 && (
                                      <div>
                                        <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                          <FiCheckCircle className="w-5 h-5 mr-2 text-green-600" />
                                          Specific Learning Outcomes
                                        </h5>
                                        <ul className="space-y-2">
                                          {subStrand.specific_learning_outcomes.map(
                                            (outcome, idx) => (
                                              <li
                                                key={idx}
                                                className="text-gray-700 pl-4 border-l-2 border-green-400"
                                              >
                                                {outcome}
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}

                                  {/* Suggested Learning Experiences */}
                                  {subStrand.suggested_learning_experiences &&
                                    subStrand.suggested_learning_experiences
                                      .length > 0 && (
                                      <div>
                                        <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                          <FiBook className="w-5 h-5 mr-2 text-blue-600" />
                                          Suggested Learning Experiences
                                        </h5>
                                        <ul className="space-y-2">
                                          {subStrand.suggested_learning_experiences.map(
                                            (experience, idx) => (
                                              <li
                                                key={idx}
                                                className="text-gray-700 pl-4 border-l-2 border-blue-400"
                                              >
                                                {experience}
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}

                                  {/* Key Inquiry Questions */}
                                  {subStrand.key_inquiry_questions && (
                                    <div>
                                      <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <span className="text-purple-600 mr-2">
                                          ?
                                        </span>
                                        Key Inquiry Questions
                                      </h5>
                                      <p className="text-gray-700 pl-4 border-l-2 border-purple-400">
                                        {subStrand.key_inquiry_questions}
                                      </p>
                                    </div>
                                  )}

                                  {/* Core Competencies */}
                                  {subStrand.core_competencies &&
                                    subStrand.core_competencies.length > 0 && (
                                      <div>
                                        <h5 className="font-semibold text-gray-900 mb-3">
                                          Core Competencies to be Developed
                                        </h5>
                                        <ul className="space-y-2">
                                          {subStrand.core_competencies.map(
                                            (competency, idx) => (
                                              <li
                                                key={idx}
                                                className="text-gray-700 pl-4 border-l-2 border-indigo-400"
                                              >
                                                {competency}
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}

                                  {/* Values */}
                                  {subStrand.values &&
                                    subStrand.values.length > 0 && (
                                      <div>
                                        <h5 className="font-semibold text-gray-900 mb-3">
                                          Values
                                        </h5>
                                        <ul className="space-y-2">
                                          {subStrand.values.map(
                                            (value, idx) => (
                                              <li
                                                key={idx}
                                                className="text-gray-700 pl-4 border-l-2 border-yellow-400"
                                              >
                                                {value}
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}

                                  {/* PCIs */}
                                  {subStrand.pcis &&
                                    subStrand.pcis.length > 0 && (
                                      <div>
                                        <h5 className="font-semibold text-gray-900 mb-3">
                                          Pertinent and Contemporary Issues
                                          (PCIs)
                                        </h5>
                                        <ul className="space-y-2">
                                          {subStrand.pcis.map((pci, idx) => (
                                            <li
                                              key={idx}
                                              className="text-gray-700 pl-4 border-l-2 border-red-400"
                                            >
                                              {pci}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                  {/* Links to Other Subjects */}
                                  {subStrand.links_to_other_subjects &&
                                    subStrand.links_to_other_subjects.length >
                                      0 && (
                                      <div>
                                        <h5 className="font-semibold text-gray-900 mb-3">
                                          Links to Other Subjects
                                        </h5>
                                        <ul className="space-y-2">
                                          {subStrand.links_to_other_subjects.map(
                                            (link, idx) => (
                                              <li
                                                key={idx}
                                                className="text-gray-700 pl-4 border-l-2 border-teal-400"
                                              >
                                                {link}
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}

                                  {/* Lessons Checklist */}
                                  {(() => {
                                    // Filter lessons using substrand_id (more reliable than code)
                                    const substrandLessons =
                                      getLessonsForSubstrandLocal(subStrand.id);

                                    if (substrandLessons.length === 0)
                                      return null;

                                    const completedCount =
                                      substrandLessons.filter(
                                        (l) => l.is_completed
                                      ).length;

                                    return (
                                      <div className="border-t border-gray-200 pt-6 mt-6">
                                        <div className="flex items-center justify-between mb-4">
                                          <h5 className="font-semibold text-gray-900 flex items-center">
                                            <FiCheckCircle className="w-5 h-5 mr-2 text-indigo-600" />
                                            Lessons ({completedCount} /{" "}
                                            {substrandLessons.length} completed)
                                          </h5>
                                          <div className="text-sm text-gray-600">
                                            {Math.round(
                                              (completedCount /
                                                substrandLessons.length) *
                                                100
                                            )}
                                            % complete
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          {substrandLessons
                                            .sort(
                                              (a, b) =>
                                                a.lesson_number -
                                                b.lesson_number
                                            )
                                            .map((lesson) => (
                                              <div
                                                key={lesson.id}
                                                className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                                                  lesson.is_completed
                                                    ? "bg-green-50"
                                                    : "bg-white hover:bg-gray-50"
                                                }`}
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={lesson.is_completed}
                                                  disabled={
                                                    completingLesson ===
                                                    lesson.id
                                                  }
                                                  onChange={() =>
                                                    toggleLessonCompletion(
                                                      lesson.id,
                                                      lesson.is_completed
                                                    )
                                                  }
                                                  className="mt-1 h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer disabled:cursor-wait"
                                                />
                                                <div className="flex-1 min-w-0">
                                                  <label
                                                    htmlFor={`lesson-${lesson.id}`}
                                                    className={`text-sm font-medium cursor-pointer ${
                                                      lesson.is_completed
                                                        ? "text-gray-500 line-through"
                                                        : "text-gray-900"
                                                    }`}
                                                  >
                                                    Lesson{" "}
                                                    {lesson.lesson_number}:{" "}
                                                    {lesson.lesson_title}
                                                  </label>
                                                  {lesson.is_completed &&
                                                    lesson.completed_at && (
                                                      <p className="text-xs text-gray-500 mt-1">
                                                        Completed on{" "}
                                                        {new Date(
                                                          lesson.completed_at
                                                        ).toLocaleDateString(
                                                          "en-US",
                                                          {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                          }
                                                        )}
                                                      </p>
                                                    )}
                                                </div>
                                                {completingLesson ===
                                                  lesson.id && (
                                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                                                )}
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No curriculum content yet
                </h3>
                <p className="text-gray-600">
                  This subject doesn't have any strands or lessons yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SecurityWrapper>
  );
}
