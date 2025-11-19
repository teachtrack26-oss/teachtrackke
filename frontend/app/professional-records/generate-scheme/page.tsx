"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiBookOpen,
  FiCalendar,
  FiUser,
  FiHome,
  FiCheckCircle,
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiSave,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

interface Subject {
  id: number;
  subject_name: string;
  grade: string;
  lessons_per_week?: number;
}

interface Strand {
  id: number;
  strand_number: string;
  strand_name: string;
  sequence_order: number;
}

interface Substrand {
  id: number;
  substrand_code: string;
  substrand_name: string;
  lessons_count: number;
  specific_learning_outcomes?: string[];
  suggested_learning_experiences?: string[];
  key_inquiry_questions?: string;
  sequence_order: number;
}

interface Lesson {
  id: number;
  lesson_number: number;
  lesson_title: string;
  description: string;
  learning_outcomes: string;
  substrand_id: number;
}

interface StrandWithSubstrands {
  id: number;
  strand_name: string;
  strand_code: string;
  sequence_order: number;
  sub_strands: Substrand[];
}

interface WeekLesson {
  lesson_id: number;
  lesson_number: number;
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

export default function SchemeGeneratorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [strands, setStrands] = useState<StrandWithSubstrands[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Selection state
  const [expandedStrands, setExpandedStrands] = useState<Set<number>>(
    new Set()
  );
  const [expandedSubstrands, setExpandedSubstrands] = useState<Set<number>>(
    new Set()
  );
  const [selectedLessons, setSelectedLessons] = useState<Set<number>>(
    new Set()
  );

  // Form data
  const [formData, setFormData] = useState({
    subject_id: 0,
    teacher_name: "",
    school: "",
    term: "Term 1",
    year: new Date().getFullYear(),
    subject: "",
    grade: "",
    total_weeks: 14,
    total_lessons: 0,
    lessons_per_week: 5,
    status: "draft",
  });

  const [weeks, setWeeks] = useState<Week[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      // Fetch subjects
      const subjectsRes = await axios.get("/api/v1/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(subjectsRes.data);

      // Get user info for teacher name
      const userRes = await axios.get("/api/v1/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFormData((prev) => ({
        ...prev,
        teacher_name: userRes.data.full_name,
      }));

      // Get school settings
      try {
        const settingsRes = await axios.get("/api/v1/school-settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (settingsRes.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            school: settingsRes.data[0].school_name,
          }));
        }
      } catch (err) {
        console.log("No school settings found");
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = async (subjectId: number) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    // Fetch strands with nested substrands for this subject
    try {
      const token = localStorage.getItem("accessToken");

      // Get subject details including lessons_per_week
      const subjectRes = await axios.get(`/api/v1/subjects/${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFormData((prev) => ({
        ...prev,
        subject_id: subjectId,
        subject: subject.subject_name,
        grade: subject.grade,
      }));

      const strandsRes = await axios.get(
        `/api/v1/subjects/${subjectId}/strands`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStrands(strandsRes.data);

      // Fetch all lessons for this subject
      const lessonsRes = await axios.get(
        `/api/v1/subjects/${subjectId}/lessons`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setLessons(lessonsRes.data.lessons || []);

      // Store the subject's lessons_per_week for later use
      const lessonsPerWeek = subjectRes.data.lessons_per_week || 5;
      setFormData((prev) => ({
        ...prev,
        lessons_per_week: lessonsPerWeek,
      }));
    } catch (error) {
      console.error("Failed to fetch curriculum data:", error);
      toast.error("Failed to load curriculum data");
    }
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

  const toggleSubstrand = (substrandId: number) => {
    const newExpanded = new Set(expandedSubstrands);
    if (newExpanded.has(substrandId)) {
      newExpanded.delete(substrandId);
    } else {
      newExpanded.add(substrandId);
    }
    setExpandedSubstrands(newExpanded);
  };

  const toggleLesson = (lessonId: number) => {
    const newSelected = new Set(selectedLessons);
    if (newSelected.has(lessonId)) {
      newSelected.delete(lessonId);
    } else {
      newSelected.add(lessonId);
    }
    setSelectedLessons(newSelected);
  };

  const getLessonsForSubstrand = (substrandId: number) => {
    return lessons.filter((lesson) => lesson.substrand_id === substrandId);
  };

  const generateWeeks = () => {
    if (selectedLessons.size === 0) {
      toast.error("Please select at least one lesson");
      return;
    }

    // Get the selected lesson objects with their strand/substrand info
    const selectedLessonData = lessons.filter((lesson) =>
      selectedLessons.has(lesson.id)
    );

    // Sort by lesson number
    selectedLessonData.sort((a, b) => a.lesson_number - b.lesson_number);

    const totalLessons = selectedLessonData.length;
    // Use the subject's lessons_per_week setting
    const lessonsPerWeek = formData.lessons_per_week || 5;

    // Calculate how many weeks we actually need
    const requiredWeeks = Math.ceil(totalLessons / lessonsPerWeek);
    const actualWeeks = Math.max(requiredWeeks, formData.total_weeks);

    const generatedWeeks: Week[] = [];

    let lessonIndex = 0;

    for (
      let weekNum = 1;
      weekNum <= actualWeeks && lessonIndex < totalLessons;
      weekNum++
    ) {
      const weekLessons: WeekLesson[] = [];

      for (
        let lessonInWeek = 1;
        lessonInWeek <= lessonsPerWeek && lessonIndex < totalLessons;
        lessonInWeek++
      ) {
        const currentLesson = selectedLessonData[lessonIndex];

        // Find the substrand and strand for this lesson
        let substrandInfo: Substrand | undefined;
        let strandInfo: StrandWithSubstrands | undefined;

        for (const strand of strands) {
          const substrand = strand.sub_strands.find(
            (ss) => ss.id === currentLesson.substrand_id
          );
          if (substrand) {
            substrandInfo = substrand;
            strandInfo = strand;
            break;
          }
        }

        weekLessons.push({
          lesson_id: currentLesson.id,
          lesson_number: lessonInWeek,
          lesson_title: currentLesson.lesson_title,
          strand: strandInfo?.strand_name || "Strand",
          sub_strand: substrandInfo?.substrand_name || "Substrand",
          specific_learning_outcomes:
            currentLesson.learning_outcomes ||
            substrandInfo?.specific_learning_outcomes?.join("\n") ||
            "By the end of the lesson, the learner should be able to:\na. \nb. \nc. ",
          key_inquiry_questions: substrandInfo?.key_inquiry_questions || "",
          learning_experiences:
            substrandInfo?.suggested_learning_experiences?.join("\n") ||
            "The learner is guided to:\n● \n● ",
          learning_resources: "Textbooks, digital devices, realia",
          assessment_methods: "Written questions, Oral questions, Observation",
          reflection: "",
        });

        lessonIndex++;
      }

      if (weekLessons.length > 0) {
        generatedWeeks.push({
          week_number: weekNum,
          lessons: weekLessons,
        });
      }
    }

    setWeeks(generatedWeeks);
    setFormData((prev) => ({ ...prev, total_lessons: totalLessons }));
    setCurrentStep(3);
    toast.success(
      `Generated ${generatedWeeks.length} weeks with ${totalLessons} lessons`
    );
  };

  const updateLesson = (
    weekIndex: number,
    lessonIndex: number,
    field: string,
    value: string
  ) => {
    setWeeks((prev) => {
      const updated = [...prev];
      updated[weekIndex].lessons[lessonIndex] = {
        ...updated[weekIndex].lessons[lessonIndex],
        [field]: value,
      };
      return updated;
    });
  };

  const saveScheme = async () => {
    if (!formData.subject_id) {
      toast.error("Please select a subject");
      return;
    }

    if (weeks.length === 0) {
      toast.error("Please generate weeks first");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("accessToken");
      const schemeData = {
        ...formData,
        weeks: weeks,
      };

      await axios.post("/api/v1/schemes", schemeData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Scheme of work created successfully!");
      router.push("/professional-records");
    } catch (error) {
      console.error("Failed to save scheme:", error);
      toast.error("Failed to save scheme of work");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Loading...</p>
        </div>
      </div>
    );
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
            onClick={() => router.push("/professional-records")}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4 font-medium"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Professional Records
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
            Generate Scheme of Work
          </h1>
          <p className="text-gray-700 mt-2 text-lg">
            Create a comprehensive term-level planning document
          </p>
        </div>

        {/* Progress Steps */}
        <div className="glass-card bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center gap-3 ${
                currentStep >= 1 ? "text-indigo-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= 1 ? "bg-indigo-600 text-white" : "bg-gray-200"
                }`}
              >
                1
              </div>
              <span className="font-medium">Basic Info</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-200">
              <div
                className={`h-full ${
                  currentStep >= 2 ? "bg-indigo-600" : ""
                } transition-all duration-300`}
              ></div>
            </div>
            <div
              className={`flex items-center gap-3 ${
                currentStep >= 2 ? "text-indigo-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= 2 ? "bg-indigo-600 text-white" : "bg-gray-200"
                }`}
              >
                2
              </div>
              <span className="font-medium">Select Content</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-200">
              <div
                className={`h-full ${
                  currentStep >= 3 ? "bg-indigo-600" : ""
                } transition-all duration-300`}
              ></div>
            </div>
            <div
              className={`flex items-center gap-3 ${
                currentStep >= 3 ? "text-indigo-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= 3 ? "bg-indigo-600 text-white" : "bg-gray-200"
                }`}
              >
                3
              </div>
              <span className="font-medium">Review & Save</span>
            </div>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="glass-card bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Basic Information
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiBookOpen className="inline w-4 h-4 mr-2" />
                  Subject *
                </label>
                <select
                  value={formData.subject_id}
                  onChange={(e) => handleSubjectChange(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value={0}>Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.subject_name} - {subject.grade}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiUser className="inline w-4 h-4 mr-2" />
                  Teacher Name *
                </label>
                <input
                  type="text"
                  value={formData.teacher_name}
                  onChange={(e) =>
                    setFormData({ ...formData, teacher_name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiHome className="inline w-4 h-4 mr-2" />
                  School Name *
                </label>
                <input
                  type="text"
                  value={formData.school}
                  onChange={(e) =>
                    setFormData({ ...formData, school: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiCalendar className="inline w-4 h-4 mr-2" />
                  Term *
                </label>
                <select
                  value={formData.term}
                  onChange={(e) =>
                    setFormData({ ...formData, term: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiCalendar className="inline w-4 h-4 mr-2" />
                  Year *
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: Number(e.target.value) })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  min={2020}
                  max={2030}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Weeks *
                </label>
                <input
                  type="number"
                  value={formData.total_weeks}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      total_weeks: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  min={1}
                  max={20}
                  required
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => {
                  if (
                    !formData.subject_id ||
                    !formData.teacher_name ||
                    !formData.school
                  ) {
                    toast.error("Please fill in all required fields");
                    return;
                  }
                  setCurrentStep(2);
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Next: Select Content
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Lessons */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="glass-card bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Select Lessons
              </h2>
              <p className="text-gray-600 mb-4">
                Expand strands and substrands to select individual lessons
              </p>
              <div className="text-sm text-indigo-600 font-medium mb-6">
                {selectedLessons.size} lesson
                {selectedLessons.size !== 1 ? "s" : ""} selected
              </div>

              {strands.length === 0 ? (
                <div className="text-center py-12">
                  <FiBookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-600">
                    No curriculum content found for this subject
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {strands.map((strand) => (
                    <div
                      key={strand.id}
                      className="border border-gray-200 rounded-xl overflow-hidden"
                    >
                      {/* Strand Header */}
                      <div
                        className="bg-indigo-50 p-4 cursor-pointer hover:bg-indigo-100 transition-colors"
                        onClick={() => toggleStrand(strand.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {expandedStrands.has(strand.id) ? (
                              <FiChevronDown className="w-5 h-5 text-indigo-600" />
                            ) : (
                              <FiChevronRight className="w-5 h-5 text-indigo-600" />
                            )}
                            <span className="font-bold text-gray-900">
                              {strand.strand_name}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {strand.sub_strands.length} substrand
                            {strand.sub_strands.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      {/* Substrands */}
                      {expandedStrands.has(strand.id) && (
                        <div className="p-2 space-y-2">
                          {strand.sub_strands.map((substrand) => {
                            const substrandLessons = getLessonsForSubstrand(
                              substrand.id
                            );
                            const selectedCount = substrandLessons.filter((l) =>
                              selectedLessons.has(l.id)
                            ).length;

                            return (
                              <div
                                key={substrand.id}
                                className="border border-gray-200 rounded-lg overflow-hidden"
                              >
                                {/* Substrand Header */}
                                <div
                                  className="bg-purple-50 p-3 cursor-pointer hover:bg-purple-100 transition-colors"
                                  onClick={() => toggleSubstrand(substrand.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {expandedSubstrands.has(substrand.id) ? (
                                        <FiChevronDown className="w-4 h-4 text-purple-600" />
                                      ) : (
                                        <FiChevronRight className="w-4 h-4 text-purple-600" />
                                      )}
                                      <span className="font-semibold text-gray-800 text-sm">
                                        {substrand.substrand_name}
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-600">
                                      {selectedCount}/{substrandLessons.length}{" "}
                                      lessons
                                    </span>
                                  </div>
                                </div>

                                {/* Lessons */}
                                {expandedSubstrands.has(substrand.id) && (
                                  <div className="p-2 space-y-1 bg-white">
                                    {substrandLessons.length === 0 ? (
                                      <div className="text-center py-4 text-sm text-gray-500">
                                        No lessons found
                                      </div>
                                    ) : (
                                      substrandLessons
                                        .sort(
                                          (a, b) =>
                                            a.lesson_number - b.lesson_number
                                        )
                                        .map((lesson) => (
                                          <div
                                            key={lesson.id}
                                            onClick={() =>
                                              toggleLesson(lesson.id)
                                            }
                                            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-start gap-3 ${
                                              selectedLessons.has(lesson.id)
                                                ? "bg-indigo-50 border-2 border-indigo-400"
                                                : "bg-gray-50 border-2 border-transparent hover:border-gray-300"
                                            }`}
                                          >
                                            <div
                                              className={`w-5 h-5 rounded flex items-center justify-center mt-0.5 flex-shrink-0 ${
                                                selectedLessons.has(lesson.id)
                                                  ? "bg-indigo-600"
                                                  : "bg-gray-300"
                                              }`}
                                            >
                                              {selectedLessons.has(
                                                lesson.id
                                              ) && (
                                                <FiCheckCircle className="w-3 h-3 text-white" />
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="font-medium text-gray-900 text-sm">
                                                Lesson {lesson.lesson_number}:{" "}
                                                {lesson.lesson_title}
                                              </div>
                                              {lesson.description && (
                                                <div className="text-xs text-gray-600 mt-1 line-clamp-1">
                                                  {lesson.description}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2"
                >
                  <FiArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={generateWeeks}
                  disabled={selectedLessons.size === 0}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Scheme ({selectedLessons.size} lesson
                  {selectedLessons.size !== 1 ? "s" : ""} selected)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review and Edit */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="glass-card bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Review Scheme of Work
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {weeks.length} weeks · {formData.total_lessons} lessons
                  </p>
                </div>
                <button
                  onClick={saveScheme}
                  disabled={saving}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                >
                  <FiSave className="w-5 h-5" />
                  {saving ? "Saving..." : "Save Scheme"}
                </button>
              </div>

              <div className="space-y-6">
                {weeks.map((week, weekIndex) => (
                  <div
                    key={week.week_number}
                    className="border border-gray-200 rounded-xl p-6 bg-white"
                  >
                    <h3 className="text-lg font-bold text-indigo-600 mb-4">
                      Week {week.week_number}
                    </h3>

                    <div className="space-y-4">
                      {week.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lessonIndex}
                          className="border-l-4 border-indigo-500 pl-4 space-y-3"
                        >
                          <div className="font-semibold text-gray-900">
                            Lesson {lesson.lesson_number}: {lesson.lesson_title}
                          </div>
                          <div className="text-sm text-gray-600">
                            {lesson.strand} → {lesson.sub_strand}
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-medium text-gray-600 mb-1 block">
                                Strand
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
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-medium text-gray-600 mb-1 block">
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
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">
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
                              rows={3}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">
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
                              rows={2}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">
                              Learning Experiences
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
                              rows={3}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-medium text-gray-600 mb-1 block">
                                Learning Resources
                              </label>
                              <input
                                type="text"
                                value={lesson.learning_resources}
                                onChange={(e) =>
                                  updateLesson(
                                    weekIndex,
                                    lessonIndex,
                                    "learning_resources",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-medium text-gray-600 mb-1 block">
                                Assessment Methods
                              </label>
                              <input
                                type="text"
                                value={lesson.assessment_methods}
                                onChange={(e) =>
                                  updateLesson(
                                    weekIndex,
                                    lessonIndex,
                                    "assessment_methods",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2"
                >
                  <FiArrowLeft className="w-5 h-5" />
                  Back to Selection
                </button>
                <button
                  onClick={saveScheme}
                  disabled={saving}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                >
                  <FiSave className="w-5 h-5" />
                  {saving ? "Saving..." : "Save Scheme of Work"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
