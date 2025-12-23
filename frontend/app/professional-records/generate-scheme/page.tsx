"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiBookOpen,
  FiCalendar,
  FiUser,
  FiHome,
  FiCheckCircle,
  FiCheck,
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiSave,
  FiChevronDown,
  FiChevronRight,
  FiZap,
  FiEye,
  FiX,
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
  core_competencies?: string[];
  values?: string[];
  pcis?: string[];
  links_to_other_subjects?: string[];
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

  // Textbook references
  textbook_name?: string;
  textbook_teacher_guide_pages?: string;
  textbook_learner_book_pages?: string;

  learning_resources: string;
  selected_resources?: string[];

  assessment_methods: string;
  selected_assessment_methods?: string[];

  reflection: string;
}

// Predefined resource options (same as edit page)
const LEARNING_RESOURCES_OPTIONS = [
  "Teacher's Guide",
  "Learner's Book",
  "Textbooks",
  "Charts and posters",
  "Models and realia",
  "Digital devices (tablets/computers)",
  "Projector/smartboard",
  "Internet/online resources",
  "Videos/audio clips",
  "Flashcards",
  "Worksheets",
  "Manipulatives (blocks, counters, etc.)",
  "Science lab equipment",
  "Art supplies",
  "Sports equipment",
  "Musical instruments",
  "Maps and globes",
  "Reference books/dictionaries",
  "Community resources/guest speakers",
  "Field trip locations",
];

// Predefined assessment options (same as edit page)
const ASSESSMENT_METHODS_OPTIONS = [
  "Oral questions",
  "Written questions",
  "Observation",
  "Practical demonstration",
  "Project work",
  "Portfolio assessment",
  "Peer assessment",
  "Self-assessment",
  "Quizzes",
  "Tests",
  "Presentations",
  "Group work assessment",
  "Homework review",
  "Class participation",
  "Role play evaluation",
  "Problem-solving tasks",
  "Creative work (art, essays, models)",
  "Performance tasks",
  "Rubrics",
  "Checklists",
];

interface Week {
  week_number: number;
  lessons: WeekLesson[];
}

export default function SchemeGeneratorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [strands, setStrands] = useState<StrandWithSubstrands[]>([]);
  const [schoolTerms, setSchoolTerms] = useState<any[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [autoPopulating, setAutoPopulating] = useState(false);
  const [schemeAlreadySaved, setSchemeAlreadySaved] = useState(false);
  const [savedSchemeId, setSavedSchemeId] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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
    term: "Term 3",
    year: new Date().getFullYear(),
    subject: "",
    grade: "",
    total_weeks: 14,
    total_lessons: 0,
    lessons_per_week: 5,
    default_textbook: "", // New field
    include_special_weeks: false,
    status: "active",
  });

  const [weeks, setWeeks] = useState<Week[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch subjects
      const subjectsRes = await axios.get("/api/v1/subjects", {
        withCredentials: true,
      });
      setSubjects(subjectsRes.data);

      // Get user info for teacher name
      const userRes = await axios.get("/api/v1/auth/me", {
        withCredentials: true,
      });
      setFormData((prev) => ({
        ...prev,
        teacher_name: userRes.data.full_name,
      }));

      // Get school context (uses TeacherProfile for independent teachers, SchoolSettings for school-linked)
      try {
        const contextRes = await axios.get("/api/v1/profile/school-context", {
          withCredentials: true,
        });

        const contextData = contextRes.data;
        if (contextData && contextData.school_name) {
          setFormData((prev) => ({
            ...prev,
            school: contextData.school_name,
          }));
        }
      } catch (err) {
        console.log("No school context found, trying legacy school-settings");
        // Fallback to legacy school-settings endpoint
        try {
          const settingsRes = await axios.get("/api/v1/school-settings", {
            withCredentials: true,
          });

          // Handle both object and array responses
          const settingsData = Array.isArray(settingsRes.data)
            ? settingsRes.data[0]
            : settingsRes.data;

          if (settingsData && settingsData.school_name) {
            setFormData((prev) => ({
              ...prev,
              school: settingsData.school_name,
            }));
          }
        } catch (e) {
          console.log("No school settings found");
        }
      }

      // Get school terms
      try {
        // Fetch school terms
        const termsRes = await axios.get("/api/v1/school-terms", {
          withCredentials: true,
        });
        console.log("School terms response:", termsRes.data);

        if (!termsRes.data || termsRes.data.length === 0) {
          console.warn("Received empty school terms list from API");
          // Don't show toast error immediately to avoid annoyance, but log it
        }

        setSchoolTerms(termsRes.data || []);

        // Auto-select the current active term if available
        const currentTerm = termsRes.data.find((t: any) => {
          const now = new Date();
          const start = new Date(t.start_date);
          const end = new Date(t.end_date);
          return now >= start && now <= end;
        });

        if (currentTerm) {
          const weeksDiff = calculateWeeks(
            currentTerm.start_date,
            currentTerm.end_date
          );
          setFormData((prev) => ({
            ...prev,
            term: currentTerm.term_name,
            year: currentTerm.year,
            total_weeks: weeksDiff,
          }));
        }
      } catch (err) {
        console.log("No school settings found");
      }
    } catch (error: any) {
      console.error("Failed to fetch initial data:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        router.push("/login");
      } else {
        toast.error("Failed to load data");
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeks = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  };

  const handleTermChange = (termName: string) => {
    const selectedTerm = schoolTerms.find((t) => t.term_name === termName);
    if (selectedTerm) {
      const weeksDiff = calculateWeeks(
        selectedTerm.start_date,
        selectedTerm.end_date
      );
      setFormData((prev) => ({
        ...prev,
        term: termName,
        year: selectedTerm.year,
        total_weeks: weeksDiff,
      }));
    } else {
      setFormData((prev) => ({ ...prev, term: termName }));
    }
  };

  const handleSubjectChange = async (subjectId: number) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    // Fetch strands with nested substrands for this subject
    try {
      // Get subject details including lessons_per_week
      const subjectRes = await axios.get(`/api/v1/subjects/${subjectId}`, {
        withCredentials: true,
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
          withCredentials: true,
        }
      );
      setStrands(strandsRes.data);

      // Fetch all lessons for this subject
      const lessonsRes = await axios.get(
        `/api/v1/subjects/${subjectId}/lessons`,
        {
          withCredentials: true,
        }
      );
      // Handle both array response (direct list) and object response ({ lessons: [...] })
      const lessonsData = Array.isArray(lessonsRes.data)
        ? lessonsRes.data
        : lessonsRes.data.lessons || [];
      setLessons(lessonsData);

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

        if (substrandInfo) {
          console.log("Substrand info for lesson:", {
            name: substrandInfo.substrand_name,
            key_inquiry_questions: substrandInfo.key_inquiry_questions,
            suggested_learning_experiences:
              substrandInfo.suggested_learning_experiences,
          });
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

  const getWeekDateRange = (weekNumber: number) => {
    // Try exact match first
    let selectedTerm = schoolTerms.find(
      (t) => t.term_name === formData.term && t.year === formData.year
    );

    // Fallback: Try matching by term number if exact match fails
    if (!selectedTerm && formData.term) {
      const termNumMatch = formData.term.match(/\d+/);
      if (termNumMatch) {
        const termNum = parseInt(termNumMatch[0]);
        selectedTerm = schoolTerms.find(
          (t) => t.term_number === termNum && t.year === formData.year
        );
      }
    }

    if (!selectedTerm) return "";
    if (!selectedTerm.start_date) return " (Dates not set)";

    try {
      const startDate = new Date(selectedTerm.start_date);
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (weekNumber - 1) * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 4); // Assuming 5 day week

      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
      };
      return ` (${weekStart.toLocaleDateString(
        "en-US",
        options
      )} - ${weekEnd.toLocaleDateString("en-US", options)})`;
    } catch (e) {
      return "";
    }
  };

  // Auto-populate from curriculum template (one-click generation)
  const autoPopulateFromCurriculum = async () => {
    if (!formData.subject_id) {
      toast.error("Please select a subject first");
      return;
    }

    setAutoPopulating(true);
    try {
      const payload = {
        subject_id: formData.subject_id,
        teacher_name: formData.teacher_name,
        school: formData.school,
        term: formData.term || "Term 1",
        year: formData.year,
        subject: formData.subject,
        grade: formData.grade,
        total_weeks: formData.total_weeks,
        lessons_per_week: formData.lessons_per_week || 5,
        include_special_weeks: formData.include_special_weeks,
      };

      const response = await axios.post("/api/v1/schemes/generate", payload, {
        withCredentials: true,
      });

      const scheme = response.data;

      // Convert the response to the format expected by this page
      const generatedWeeks: Week[] = scheme.weeks.map((w: any) => ({
        week_number: w.week_number,
        lessons: w.lessons.map((l: any, idx: number) => ({
          lesson_id: l.id || idx + 1,
          lesson_number: l.lesson_number || idx + 1,
          lesson_title: l.sub_strand || `Lesson ${idx + 1}`,
          strand: l.strand || "",
          sub_strand: l.sub_strand || "",
          specific_learning_outcomes: l.specific_learning_outcomes || "",
          key_inquiry_questions: l.key_inquiry_questions || "",
          learning_experiences: l.learning_experiences || "",
          learning_resources: (() => {
            let resources =
              l.learning_resources || "Textbooks, digital devices";
            const tbName = l.textbook_name || formData.default_textbook;

            if (tbName) {
              // If "Textbooks" exists, replace it with the specific name
              if (resources.includes("Textbooks")) {
                resources = resources.replace("Textbooks", tbName);
              } else if (!resources.includes(tbName)) {
                // Otherwise append it if not already there
                resources = `${resources}, ${tbName}`;
              }
            }
            return resources;
          })(),
          textbook_name: l.textbook_name || formData.default_textbook || "",
          textbook_teacher_guide_pages: l.textbook_teacher_guide_pages || "",
          textbook_learner_book_pages: l.textbook_learner_book_pages || "",
          assessment_methods:
            l.assessment_methods || "Oral questions, Observation",
          reflection: l.reflection || "",
        })),
      }));

      setWeeks(generatedWeeks);
      setFormData((prev) => ({
        ...prev,
        total_lessons: scheme.total_lessons,
      }));
      setSchemeAlreadySaved(true);
      setSavedSchemeId(scheme.id);
      setCurrentStep(3);

      toast.success(
        `🎉 Auto-populated ${generatedWeeks.length} weeks with ${scheme.total_lessons} lessons from curriculum!`
      );
    } catch (error: any) {
      console.error("Auto-populate failed:", error);
      if (error.response?.status === 404) {
        toast.error(
          `No curriculum template found for ${formData.subject} ${formData.grade}. Please use manual selection.`
        );
      } else {
        toast.error("Failed to auto-populate. Try manual selection.");
      }
    } finally {
      setAutoPopulating(false);
    }
  };

  const updateLesson = (
    weekIndex: number,
    lessonIndex: number,
    field: keyof WeekLesson,
    value: string
  ) => {
    const updatedWeeks = [...weeks];
    updatedWeeks[weekIndex].lessons[lessonIndex][field] = value as never;

    // If updating textbook name, also update resources
    if (field === "textbook_name") {
      let resources =
        updatedWeeks[weekIndex].lessons[lessonIndex].learning_resources;
      if (resources.includes("Textbooks")) {
        updatedWeeks[weekIndex].lessons[lessonIndex].learning_resources =
          resources.replace("Textbooks", value);
      } else if (!resources.includes(value)) {
        // If it doesn't have "Textbooks" but also doesn't have the new name, append it?
        // Maybe safer to just leave it if "Textbooks" isn't there to replace.
        // But if it was "Textbooks, digital devices", it becomes "Mentor Grade 9, digital devices"
      }
    }

    setWeeks(updatedWeeks);
  };

  const handleTextbookBlur = (
    weekIndex: number,
    lessonIndex: number,
    value: string
  ) => {
    if (value.trim() === "") return;

    const updatedWeeks = [...weeks];
    let startLessonIdx = lessonIndex + 1;
    let updatedCount = 0;

    // Also update the CURRENT lesson's resources if needed (since blur happens after change)
    const currentLesson = updatedWeeks[weekIndex].lessons[lessonIndex];
    if (currentLesson.learning_resources.includes("Textbooks")) {
      currentLesson.learning_resources =
        currentLesson.learning_resources.replace("Textbooks", value);
    }

    for (let w = weekIndex; w < updatedWeeks.length; w++) {
      const week = updatedWeeks[w];
      // For subsequent weeks, start from the first lesson
      if (w > weekIndex) startLessonIdx = 0;

      for (let l = startLessonIdx; l < week.lessons.length; l++) {
        const lesson = week.lessons[l];
        // Only update if the textbook name is empty
        if (!lesson.textbook_name || lesson.textbook_name.trim() === "") {
          lesson.textbook_name = value;

          // Also update resources for these subsequent lessons
          if (lesson.learning_resources.includes("Textbooks")) {
            lesson.learning_resources = lesson.learning_resources.replace(
              "Textbooks",
              value
            );
          }

          updatedCount++;
        }
      }
    }

    if (updatedCount > 0) {
      setWeeks(updatedWeeks);
      toast.success(
        `Textbook name applied to ${updatedCount} subsequent empty lessons`,
        {
          id: "textbook-autofill",
          duration: 2000,
        }
      );
    } else {
      // If we only updated the current lesson's resources, we still need to set state
      setWeeks(updatedWeeks);
    }
  };

  const toggleResourceInReview = (
    weekIndex: number,
    lessonIndex: number,
    resource: string
  ) => {
    const lesson = weeks[weekIndex].lessons[lessonIndex];
    const currentResources = lesson.selected_resources || [];

    let updatedResources: string[];
    if (currentResources.includes(resource)) {
      updatedResources = currentResources.filter((r) => r !== resource);
    } else {
      updatedResources = [...currentResources, resource];
    }

    const updatedWeeks = [...weeks];
    updatedWeeks[weekIndex].lessons[lessonIndex] = {
      ...lesson,
      selected_resources: updatedResources,
      learning_resources: updatedResources.join(", "),
    };

    setWeeks(updatedWeeks);
  };

  const toggleAssessmentInReview = (
    weekIndex: number,
    lessonIndex: number,
    method: string
  ) => {
    const lesson = weeks[weekIndex].lessons[lessonIndex];
    const currentMethods = lesson.selected_assessment_methods || [];

    let updatedMethods: string[];
    if (currentMethods.includes(method)) {
      updatedMethods = currentMethods.filter((m) => m !== method);
    } else {
      updatedMethods = [...currentMethods, method];
    }

    const updatedWeeks = [...weeks];
    updatedWeeks[weekIndex].lessons[lessonIndex] = {
      ...lesson,
      selected_assessment_methods: updatedMethods,
      assessment_methods: updatedMethods.join(", "),
    };

    setWeeks(updatedWeeks);
  };

  const saveScheme = async () => {
    // If scheme was auto-populated, it's already saved - just redirect
    if (schemeAlreadySaved && savedSchemeId) {
      toast.success("Scheme of work saved! Redirecting...");
      router.push(`/professional-records/schemes/${savedSchemeId}`);
      return;
    }

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
      const schemeData = {
        ...formData,
        weeks: weeks,
      };

      const response = await axios.post("/api/v1/schemes", schemeData, {
        withCredentials: true,
      });

      toast.success("Scheme of work created successfully!");
      router.push(`/professional-records/schemes/${response.data.id}`);
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
        <div className="glass-card bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-4 sm:p-6 mb-8 overflow-hidden">
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center gap-1 sm:gap-3 flex-shrink-0 ${
                currentStep >= 1 ? "text-indigo-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base flex-shrink-0 ${
                  currentStep >= 1 ? "bg-indigo-600 text-white" : "bg-gray-200"
                }`}
              >
                1
              </div>
              <span className="font-medium text-xs sm:text-base hidden sm:inline">
                Basic Info
              </span>
              <span className="font-medium text-xs sm:hidden">
                Basic
                <br />
                Info
              </span>
            </div>
            <div className="flex-1 h-1 mx-1 sm:mx-4 bg-gray-200 min-w-[20px]">
              <div
                className={`h-full ${
                  currentStep >= 2 ? "bg-indigo-600" : ""
                } transition-all duration-300`}
              ></div>
            </div>
            <div
              className={`flex items-center gap-1 sm:gap-3 flex-shrink-0 ${
                currentStep >= 2 ? "text-indigo-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base flex-shrink-0 ${
                  currentStep >= 2 ? "bg-indigo-600 text-white" : "bg-gray-200"
                }`}
              >
                2
              </div>
              <span className="font-medium text-xs sm:text-base hidden sm:inline">
                Select Content
              </span>
              <span className="font-medium text-xs sm:hidden">
                Select
                <br />
                Content
              </span>
            </div>
            <div className="flex-1 h-1 mx-1 sm:mx-4 bg-gray-200 min-w-[20px]">
              <div
                className={`h-full ${
                  currentStep >= 3 ? "bg-indigo-600" : ""
                } transition-all duration-300`}
              ></div>
            </div>
            <div
              className={`flex items-center gap-1 sm:gap-3 flex-shrink-0 ${
                currentStep >= 3 ? "text-indigo-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base flex-shrink-0 ${
                  currentStep >= 3 ? "bg-indigo-600 text-white" : "bg-gray-200"
                }`}
              >
                3
              </div>
              <span className="font-medium text-xs sm:text-base hidden sm:inline">
                Review & Save
              </span>
              <span className="font-medium text-xs sm:hidden">
                Review
                <br />& Save
              </span>
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
                  className="w-full px-3 sm:px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white text-sm sm:text-base"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900"
                  required
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiCalendar className="inline w-4 h-4 mr-2" />
                  Term *
                </label>
                <select
                  value={formData.term}
                  onChange={(e) => handleTermChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                >
                  {!schoolTerms || schoolTerms.length === 0 ? (
                    <>
                      <option value="">Select a term (Manual Mode)</option>
                      <option value="Term 3">Term 3 (Current)</option>
                    </>
                  ) : (
                    <>
                      <option value="">Select a term</option>
                      {schoolTerms
                        .filter((term) => term.term_name === "Term 3")
                        .map((term) => (
                          <option key={term.id} value={term.term_name}>
                            {term.term_name} ({term.year})
                          </option>
                        ))}
                    </>
                  )}
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900"
                  min={2020}
                  max={2030}
                  required
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiBookOpen className="inline w-4 h-4 mr-2" />
                  Default Textbook (Optional)
                </label>
                <input
                  type="text"
                  value={formData.default_textbook}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      default_textbook: e.target.value,
                    })
                  }
                  placeholder="e.g. Oxford English Grade 7"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be applied to all lessons if no specific textbook is
                  defined in the curriculum.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Weeks *
                  {formData.total_weeks && (
                    <span className="ml-2 text-xs text-indigo-600 font-normal">
                      (Auto-calculated from term dates)
                    </span>
                  )}
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900"
                  min={1}
                  max={20}
                  required
                  readOnly
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.include_special_weeks}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          include_special_weeks: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-900">
                      Include Opening, Assessment & Closing Weeks
                    </span>
                    <span className="block text-xs text-gray-500">
                      Automatically adds Opener Assessment (Week 1), End of Term
                      Assessment (Week N-1), and Closing (Week N).
                    </span>
                  </div>
                </label>
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
            {/* Auto-Populate Card */}
            <div className="glass-card bg-gradient-to-r from-emerald-50 to-teal-50 backdrop-blur-xl rounded-2xl shadow-xl border border-emerald-200 p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-emerald-800 flex items-center gap-2">
                    <FiZap className="w-5 h-5 flex-shrink-0" />
                    Auto-Populate from Curriculum
                  </h3>
                  <p className="text-emerald-700 text-xs sm:text-sm mt-1">
                    Automatically fill in your entire scheme using the CBC
                    curriculum database. All strands, sub-strands, and learning
                    outcomes will be populated.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowPreview(true)}
                    className="bg-white text-emerald-700 border border-emerald-200 px-4 py-2.5 sm:py-3 rounded-xl font-bold shadow-sm hover:shadow-md hover:bg-emerald-50 transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <FiEye className="w-4 h-4 sm:w-5 sm:h-5" />
                    Preview Content
                  </button>
                  <button
                    onClick={autoPopulateFromCurriculum}
                    disabled={autoPopulating}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
                  >
                    {autoPopulating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <FiZap className="w-4 h-4 sm:w-5 sm:h-5" />
                        Auto-Populate Scheme
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-gray-500 text-sm font-medium">
                OR select manually
              </span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

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
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    Review Scheme of Work
                    {schemeAlreadySaved && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-sm font-semibold rounded-full border border-green-200">
                        <FiCheckCircle className="w-4 h-4" />
                        Auto-Generated & Saved
                      </span>
                    )}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {weeks.length} weeks · {formData.total_lessons} lessons
                    {schoolTerms.length > 0 ? (
                      <span className="ml-2 text-xs bg-green-100 px-2 py-1 rounded text-green-700 border border-green-200">
                        Term Data Loaded ({schoolTerms.length})
                      </span>
                    ) : (
                      <span className="ml-2 text-xs bg-red-100 px-2 py-1 rounded text-red-700 border border-red-200">
                        No Term Data (0) - Breaks won't be calculated
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={saveScheme}
                  disabled={saving}
                  className={`${
                    schemeAlreadySaved
                      ? "bg-gradient-to-r from-emerald-500 to-green-500"
                      : "bg-gradient-to-r from-green-600 to-emerald-600"
                  } text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50`}
                >
                  {schemeAlreadySaved ? (
                    <FiCheck className="w-5 h-5" />
                  ) : (
                    <FiSave className="w-5 h-5" />
                  )}
                  {saving
                    ? "Saving..."
                    : schemeAlreadySaved
                    ? "View Saved Scheme →"
                    : "Save Scheme"}
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
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        {getWeekDateRange(week.week_number)}
                      </span>
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

                          {/* Textbook References */}
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <h4 className="font-semibold text-blue-900 mb-3 text-sm">
                              📚 Textbook References
                            </h4>

                            <div className="grid md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Textbook Name
                                </label>
                                <input
                                  type="text"
                                  value={lesson.textbook_name || ""}
                                  onChange={(e) =>
                                    updateLesson(
                                      weekIndex,
                                      lessonIndex,
                                      "textbook_name",
                                      e.target.value
                                    )
                                  }
                                  onBlur={(e) =>
                                    handleTextbookBlur(
                                      weekIndex,
                                      lessonIndex,
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., CBC Pre-Technical Studies Grade 9"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Teacher's Guide Pages
                                </label>
                                <input
                                  type="text"
                                  value={
                                    lesson.textbook_teacher_guide_pages || ""
                                  }
                                  onChange={(e) =>
                                    updateLesson(
                                      weekIndex,
                                      lessonIndex,
                                      "textbook_teacher_guide_pages",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., pp. 45-48"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Learner's Book Pages
                                </label>
                                <input
                                  type="text"
                                  value={
                                    lesson.textbook_learner_book_pages || ""
                                  }
                                  onChange={(e) =>
                                    updateLesson(
                                      weekIndex,
                                      lessonIndex,
                                      "textbook_learner_book_pages",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., pp. 32-35"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Learning Resources Multi-select */}
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-2 block">
                              Learning Resources (Select all that apply)
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                              {LEARNING_RESOURCES_OPTIONS.map((resource) => {
                                const isSelected = (
                                  lesson.selected_resources || []
                                ).includes(resource);
                                return (
                                  <label
                                    key={resource}
                                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors text-xs ${
                                      isSelected
                                        ? "bg-indigo-50 border border-indigo-300"
                                        : ""
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() =>
                                        toggleResourceInReview(
                                          weekIndex,
                                          lessonIndex,
                                          resource
                                        )
                                      }
                                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-gray-700">
                                      {resource}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Selected: {lesson.learning_resources || "None"}
                            </p>
                          </div>

                          {/* Assessment Methods Multi-select */}
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-2 block">
                              Assessment Methods (Select all that apply)
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                              {ASSESSMENT_METHODS_OPTIONS.map((method) => {
                                const isSelected = (
                                  lesson.selected_assessment_methods || []
                                ).includes(method);
                                return (
                                  <label
                                    key={method}
                                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors text-xs ${
                                      isSelected
                                        ? "bg-indigo-50 border border-indigo-300"
                                        : ""
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() =>
                                        toggleAssessmentInReview(
                                          weekIndex,
                                          lessonIndex,
                                          method
                                        )
                                      }
                                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-gray-700">
                                      {method}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Selected: {lesson.assessment_methods || "None"}
                            </p>
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

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Curriculum Content Preview
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  The following content will be included in your scheme
                </p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-indigo-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {strands.length}
                  </div>
                  <div className="text-xs font-medium text-indigo-800 uppercase tracking-wider">
                    Strands
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {strands.reduce((acc, s) => acc + s.sub_strands.length, 0)}
                  </div>
                  <div className="text-xs font-medium text-purple-800 uppercase tracking-wider">
                    Sub-strands
                  </div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {lessons.length}
                  </div>
                  <div className="text-xs font-medium text-emerald-800 uppercase tracking-wider">
                    Total Lessons
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {strands.map((strand) => (
                  <div
                    key={strand.id}
                    className="border border-gray-200 rounded-xl overflow-hidden"
                  >
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-semibold text-gray-800">
                      {strand.strand_name}
                    </div>
                    <div className="divide-y divide-gray-100">
                      {strand.sub_strands.map((sub) => (
                        <div
                          key={sub.id}
                          className="px-4 py-3 text-sm text-gray-600 flex justify-between items-center hover:bg-gray-50"
                        >
                          <span>{sub.substrand_name}</span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">
                            {
                              lessons.filter((l) => l.substrand_id === sub.id)
                                .length
                            }{" "}
                            lessons
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
