"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { toast } from "react-hot-toast";
import axios from "axios";
import {
  FiClock,
  FiBook,
  FiPlus,
  FiTrash2,
  FiSettings,
  FiInfo,
  FiEdit,
  FiPlay,
  FiPause,
  FiChevronDown,
  FiPrinter,
} from "react-icons/fi";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
} from "@dnd-kit/core";
import AllLevelsListView from "@/components/timetable/AllLevelsListView";

const DraggableLesson = ({
  entry,
  theme,
  subjectName,
  onEdit,
  onDelete,
}: any) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `lesson-${entry.id}`,
      data: entry,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
      }
    : undefined;

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} className="opacity-50">
        <div
          className={`p-4 rounded-xl bg-gradient-to-br ${theme.gradient} border-l-4 ${theme.border} shadow-lg`}
        >
          <div className="font-bold text-sm text-white">{subjectName}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`glass-lesson relative overflow-hidden p-4 rounded-xl bg-gradient-to-br ${theme.gradient} border-l-4 ${theme.border} ${theme.shadow} backdrop-blur-sm border border-white/60 group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-grab active:cursor-grabbing mb-3`}
      onClick={onEdit}
    >
      {/* Pattern overlay */}
      <div
        className={`absolute inset-0 ${theme.pattern} opacity-20 pointer-events-none`}
      ></div>

      {/* Double lesson badge */}
      {entry.is_double_lesson && (
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-gray-700 shadow-md">
          Double
        </div>
      )}

      <div className="relative z-10 flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-10 h-10 ${theme.iconBg} rounded-lg flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-200`}
            >
              <span className="text-2xl">{theme.icon}</span>
            </div>
            <div className="font-bold text-sm text-white drop-shadow-md">
              {subjectName}
            </div>
          </div>
          <div className="text-xs text-white/90 space-y-1.5">
            {entry.grade_section && (
              <div className="inline-flex items-center bg-white/30 backdrop-blur-sm px-2 py-1 rounded-lg font-medium">
                <strong className="mr-1">📚</strong>
                {entry.grade_section}
              </div>
            )}
            {entry.room_number && (
              <div className="inline-flex items-center bg-white/30 backdrop-blur-sm px-2 py-1 rounded-lg ml-1 font-medium">
                <FiBook className="w-3 h-3 mr-1" />
                Room {entry.room_number}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 print:hidden">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onEdit}
            className="p-2 bg-white/90 backdrop-blur-sm text-blue-600 rounded-lg hover:bg-white shadow-md transition-all duration-200 hover:scale-110"
            title="Edit"
          >
            <FiEdit className="w-4 h-4" />
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onDelete}
            className="p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-lg hover:bg-white shadow-md transition-all duration-200 hover:scale-110"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const DroppableCell = ({ id, dayIndex, slotId, children, onClick }: any) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: { dayIndex, slotId },
  });

  return (
    <td
      ref={setNodeRef}
      className={`p-3 align-top transition-colors duration-200 ${
        isOver
          ? "bg-indigo-100/50 dark:bg-indigo-900/30 ring-2 ring-indigo-400 ring-inset rounded-lg"
          : ""
      }`}
    >
      <div
        onClick={onClick}
        className={`w-full min-h-[110px] rounded-xl border-2 border-dashed ${
          isOver
            ? "border-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/20"
            : "border-gray-300 dark:border-gray-700 bg-gradient-to-br from-gray-100/80 to-slate-100/80 dark:from-gray-800/80 dark:to-slate-800/80 hover:from-indigo-100/60 hover:to-purple-100/60 dark:hover:from-indigo-900/40 dark:hover:to-purple-900/40 hover:border-indigo-400"
        } backdrop-blur-sm transition-all duration-300 flex flex-col items-center justify-center group cursor-pointer`}
      >
        {children}
      </div>
    </td>
  );
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Subject theme configuration with colors and patterns
const getSubjectTheme = (subjectName: string) => {
  const name = subjectName?.toLowerCase() || "";

  // Mathematics & Sciences
  if (
    name.includes("math") ||
    name.includes("algebra") ||
    name.includes("geometry")
  ) {
    return {
      gradient: "from-blue-500/90 to-cyan-500/90",
      border: "border-blue-400",
      icon: "🔢",
      iconBg: "bg-blue-600",
      pattern: "pattern-dots",
      shadow: "shadow-blue-200",
    };
  }
  if (name.includes("physics")) {
    return {
      gradient: "from-indigo-500/90 to-purple-500/90",
      border: "border-indigo-400",
      icon: "⚛️",
      iconBg: "bg-indigo-600",
      pattern: "pattern-zigzag",
      shadow: "shadow-indigo-200",
    };
  }
  if (name.includes("chemistry")) {
    return {
      gradient: "from-green-500/90 to-emerald-500/90",
      border: "border-green-400",
      icon: "🧪",
      iconBg: "bg-green-600",
      pattern: "pattern-dots",
      shadow: "shadow-green-200",
    };
  }
  if (name.includes("biology") || name.includes("science")) {
    return {
      gradient: "from-emerald-500/90 to-teal-500/90",
      border: "border-emerald-400",
      icon: "🌿",
      iconBg: "bg-emerald-600",
      pattern: "pattern-dots",
      shadow: "shadow-emerald-200",
    };
  }

  // Languages
  if (name.includes("english")) {
    return {
      gradient: "from-rose-500/90 to-pink-500/90",
      border: "border-rose-400",
      icon: "📖",
      iconBg: "bg-rose-600",
      pattern: "pattern-zigzag",
      shadow: "shadow-rose-200",
    };
  }
  if (name.includes("kiswahili") || name.includes("swahili")) {
    return {
      gradient: "from-amber-500/90 to-orange-500/90",
      border: "border-amber-400",
      icon: "🗣️",
      iconBg: "bg-amber-600",
      pattern: "pattern-dots",
      shadow: "shadow-amber-200",
    };
  }
  if (
    name.includes("french") ||
    name.includes("german") ||
    name.includes("language")
  ) {
    return {
      gradient: "from-purple-500/90 to-fuchsia-500/90",
      border: "border-purple-400",
      icon: "🌐",
      iconBg: "bg-purple-600",
      pattern: "pattern-zigzag",
      shadow: "shadow-purple-200",
    };
  }

  // Social Sciences
  if (name.includes("history")) {
    return {
      gradient: "from-yellow-600/90 to-amber-600/90",
      border: "border-yellow-500",
      icon: "🏛️",
      iconBg: "bg-yellow-600",
      pattern: "pattern-dots",
      shadow: "shadow-yellow-200",
    };
  }
  if (name.includes("geography") || name.includes("social")) {
    return {
      gradient: "from-teal-500/90 to-cyan-500/90",
      border: "border-teal-400",
      icon: "🌍",
      iconBg: "bg-teal-600",
      pattern: "pattern-zigzag",
      shadow: "shadow-teal-200",
    };
  }

  // Arts & PE
  if (name.includes("art") || name.includes("creative")) {
    return {
      gradient: "from-pink-500/90 to-rose-500/90",
      border: "border-pink-400",
      icon: "🎨",
      iconBg: "bg-pink-600",
      pattern: "pattern-zigzag",
      shadow: "shadow-pink-200",
    };
  }
  if (name.includes("music")) {
    return {
      gradient: "from-violet-500/90 to-purple-500/90",
      border: "border-violet-400",
      icon: "🎵",
      iconBg: "bg-violet-600",
      pattern: "pattern-dots",
      shadow: "shadow-violet-200",
    };
  }
  if (
    name.includes("physical") ||
    name.includes("p.e") ||
    name.includes("sport")
  ) {
    return {
      gradient: "from-lime-500/90 to-green-500/90",
      border: "border-lime-400",
      icon: "⚽",
      iconBg: "bg-lime-600",
      pattern: "pattern-zigzag",
      shadow: "shadow-lime-200",
    };
  }

  // Technology & Computer
  if (
    name.includes("computer") ||
    name.includes("ict") ||
    name.includes("technology")
  ) {
    return {
      gradient: "from-slate-600/90 to-gray-700/90",
      border: "border-slate-500",
      icon: "💻",
      iconBg: "bg-slate-700",
      pattern: "pattern-dots",
      shadow: "shadow-slate-300",
    };
  }

  // Business & Economics
  if (
    name.includes("business") ||
    name.includes("commerce") ||
    name.includes("economics")
  ) {
    return {
      gradient: "from-sky-500/90 to-blue-500/90",
      border: "border-sky-400",
      icon: "💼",
      iconBg: "bg-sky-600",
      pattern: "pattern-zigzag",
      shadow: "shadow-sky-200",
    };
  }

  // Religious Education
  if (
    name.includes("religious") ||
    name.includes("cre") ||
    name.includes("ire")
  ) {
    return {
      gradient: "from-indigo-600/90 to-blue-600/90",
      border: "border-indigo-500",
      icon: "📿",
      iconBg: "bg-indigo-700",
      pattern: "pattern-dots",
      shadow: "shadow-indigo-200",
    };
  }

  // Default theme for unlisted subjects
  return {
    gradient: "from-gray-500/90 to-slate-500/90",
    border: "border-gray-400",
    icon: "📚",
    iconBg: "bg-gray-600",
    pattern: "pattern-dots",
    shadow: "shadow-gray-200",
  };
};

const TimetablePage = () => {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useCustomAuth();

  const isPremium =
    user?.subscription_type === "INDIVIDUAL_PREMIUM" ||
    user?.subscription_type === "SCHOOL_SPONSORED" ||
    !!user?.school_id ||
    user?.role === "SUPER_ADMIN";

  const [isLoading, setIsLoading] = useState(true);
  const [schedule, setSchedule] = useState<any>(null);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedEducationLevel, setSelectedEducationLevel] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    time_slot_id: 0,
    subject_id: 0,
    day_of_week: 1,
    room_number: "",
    grade_section: "",
    notes: "",
    is_double_lesson: false,
  });
  const [bulkLessons, setBulkLessons] = useState<any[]>([
    { day_of_week: 1, time_slot_id: 0 },
  ]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentStatus, setCurrentStatus] = useState<{
    type: "before-school" | "in-lesson" | "free-period" | "after-school";
    message: string;
    nextEvent?: string;
    timeUntil?: string;
    progress?: number;
  } | null>(null);

  const [selectedViewLevel, setSelectedViewLevel] = useState("All Levels");
  const [allTimeSlots, setAllTimeSlots] = useState<any[]>([]); // All time slots from all levels for list view

  // Education levels and their grades
  const educationLevels = {
    "Pre-Primary": ["PP1", "PP2"],
    "Lower Primary": ["Grade 1", "Grade 2", "Grade 3"],
    "Upper Primary": ["Grade 4", "Grade 5", "Grade 6"],
    "Junior Secondary": ["Grade 7", "Grade 8", "Grade 9"],
    "Senior Secondary": ["Grade 10", "Grade 11", "Grade 12"],
  };

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated) {
      loadData();
    }
  }, [selectedViewLevel, isAuthenticated, authLoading]);

  // Timer and status update effect
  useEffect(() => {
    // ... (existing code)
  }, [schedule, timeSlots, entries, subjects]);

  const loadData = async () => {
    try {
      const config = { withCredentials: true };

      // Handle "All Levels" view differently
      if (selectedViewLevel === "All Levels") {
        // For "All Levels", we fetch ALL entries and ALL time slots from all levels

        // Fetch all entries (no level filter)
        let fetchedEntries: any[] = [];
        try {
          const entriesRes = await axios.get(
            "/api/v1/timetable/entries",
            config
          );
          fetchedEntries = Array.isArray(entriesRes.data)
            ? entriesRes.data
            : [];
          setEntries(fetchedEntries);
        } catch (e) {
          setEntries([]);
        }

        // Fetch time slots from ALL education levels
        const allLevels = [
          "Pre-Primary",
          "Lower Primary",
          "Upper Primary",
          "Junior Secondary",
          "Senior Secondary",
        ];
        const allSlotsPromises = allLevels.map((level) =>
          axios
            .get(
              `/api/v1/timetable/time-slots?education_level=${encodeURIComponent(
                level
              )}`,
              config
            )
            .then((res) => res.data)
            .then((slots) =>
              slots.map((s: any) => ({ ...s, education_level: level }))
            )
            .catch(() => [])
        );

        const allSlotsArrays = await Promise.all(allSlotsPromises);
        const combinedSlots = allSlotsArrays.flat();
        setAllTimeSlots(combinedSlots);

        // Deduplicate slots by ID to prevent React key errors
        // This handles cases where the backend returns the same fallback schedule for multiple levels
        const uniqueSlotsMap = new Map();
        combinedSlots.forEach((slot: any) => {
          if (!uniqueSlotsMap.has(slot.id)) {
            uniqueSlotsMap.set(slot.id, slot);
          }
        });
        const uniqueSlots = Array.from(uniqueSlotsMap.values());

        // Sort and filter for the grid view
        const sortedSlots = uniqueSlots
          .filter((s: any) => s.slot_type === "lesson")
          .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))
          .map((s: any) => ({
            ...s,
            label: s.education_level, // Use level as label
          }));

        setTimeSlots(sortedSlots);

        // Create a dummy schedule object for the header stats
        setSchedule({
          schedule_name: "All Levels Overview",
          school_start_time: "08:00",
          school_end_time: "16:00",
          single_lesson_duration: "Var",
          double_lesson_duration: "Var",
          first_break_duration: 0,
          second_break_duration: 0,
          lunch_break_duration: 0,
        });
      } else {
        // Level-specific view (existing code)
        let scheduleData;
        try {
          const scheduleRes = await axios.get(
            `/api/v1/timetable/schedules/active?education_level=${encodeURIComponent(
              selectedViewLevel
            )}`,
            config
          );
          scheduleData = scheduleRes.data;
          setSchedule(scheduleData);
        } catch (e) {
          setSchedule(null);
          setTimeSlots([]);
          setEntries([]);
          setIsLoading(false);
          return;
        }

        const slotsRes = await axios.get(
          `/api/v1/timetable/time-slots?education_level=${encodeURIComponent(
            selectedViewLevel
          )}`,
          config
        );
        const slotsData = slotsRes.data;

        console.log("Raw time slots from API:", slotsData);

        // Filter lesson slots and add labels
        const lessonSlots = slotsData
          .filter((s: any) => s.slot_type === "lesson")
          .map((s: any, index: number) => ({
            ...s,
            label: `Lesson ${index + 1}`,
            education_level: selectedViewLevel,
          }));

        console.log("Filtered lesson slots:", lessonSlots);
        console.log("Number of lesson slots:", lessonSlots.length);

        setTimeSlots(lessonSlots);
        console.log("Time slots set to state:", lessonSlots);

        const levelEntriesRes = await axios.get(
          "/api/v1/timetable/entries",
          config
        );
        setEntries(
          Array.isArray(levelEntriesRes.data) ? levelEntriesRes.data : []
        );
      }

      // Fetch USER'S SUBJECTS (for displaying in timetable)
      const userSubjectsRes = await axios.get("/api/v1/subjects", config);
      const userSubjects = userSubjectsRes.data;
      console.log("Loaded user subjects:", userSubjects);

      // Fetch all curriculum templates (learning areas) - any teacher can use any template
      // Only call admin endpoint if user is admin; otherwise use public endpoint directly
      let curriculumData = [];
      try {
        const isAdmin = user?.is_admin || user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_ADMIN";
        const endpoint = isAdmin
          ? "/api/v1/admin/curriculum-templates?is_active=true"
          : "/api/v1/curriculum-templates";
        
        const templatesRes = await axios.get(endpoint, config);
        curriculumData = templatesRes.data;
      } catch (err) {
        console.error("Failed to fetch curriculum templates", err);
      }

      // Transform curriculum templates to match expected format
      const transformedTemplates = curriculumData.map((template: any) => ({
        id: template.id,
        subject_name: template.subject,
        grade: template.grade,
        education_level: template.education_level,
        is_template: true, // Flag to indicate this is a template, not a user subject
      }));

      // COMBINE user subjects and templates
      // User subjects take precedence (they have actual IDs used in timetable entries)
      const allSubjects = [...userSubjects, ...transformedTemplates];
      setSubjects(allSubjects);
      console.log("Combined subjects (user + templates):", allSubjects);

      setIsLoading(false);
    } catch (error) {
      toast.error("Failed to load");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("=== SUBMITTING FORM ===");
    console.log("Form data being sent:", formData);
    console.log("Time slot:", formData.time_slot_id);
    console.log(
      "Day of week:",
      formData.day_of_week,
      "=>",
      DAYS[formData.day_of_week - 1]
    );

    try {
      const config = { withCredentials: true };
      const url = editingEntry
        ? `/api/v1/timetable/entries/${editingEntry.id}`
        : "/api/v1/timetable/entries";

      if (editingEntry) {
        await axios.put(url, formData, config);
      } else {
        await axios.post(url, formData, config);
      }

      toast.success("Lesson saved successfully!");
      setIsAddModalOpen(false);
      setEditingEntry(null);
      setSelectedSubject(null);
      loadData();
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.response?.data?.detail || "Failed to save lesson");
    }
  };

  const handleDelete = async (entryId: number) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;

    try {
      await axios.delete(`/api/v1/timetable/entries/${entryId}`, {
        withCredentials: true,
      });

      toast.success("Lesson deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete lesson");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const entryId = parseInt(active.id.toString().replace("lesson-", ""));
    // over.id format: cell-{dayIndex+1}-{slotId}
    const overIdParts = over.id.toString().split("-");
    const newDayOfWeek = parseInt(overIdParts[1]);
    const newTimeSlotId = parseInt(overIdParts[2]);

    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;

    // If position hasn't changed, do nothing
    if (
      entry.day_of_week === newDayOfWeek &&
      entry.time_slot_id === newTimeSlotId
    ) {
      return;
    }

    // Optimistic update
    const originalEntries = [...entries];
    const updatedEntries = entries.map((e) => {
      if (e.id === entryId) {
        return { ...e, day_of_week: newDayOfWeek, time_slot_id: newTimeSlotId };
      }
      return e;
    });
    setEntries(updatedEntries);

    try {
      const payload = {
        subject_id: entry.subject_id,
        time_slot_id: newTimeSlotId,
        day_of_week: newDayOfWeek,
        room_number: entry.room_number,
        grade_section: entry.grade_section,
        notes: entry.notes,
        is_double_lesson: entry.is_double_lesson,
      };

      await axios.put(`/api/v1/timetable/entries/${entryId}`, payload, {
        withCredentials: true,
      });

      toast.success("Lesson moved", { duration: 1500, icon: "👌" });
    } catch (error) {
      console.error("Drag update failed:", error);
      toast.error("Failed to move lesson");
      setEntries(originalEntries); // Revert on failure
    }
  };

  const openAddModal = (timeSlotId?: number, dayOfWeek?: number) => {
    console.log("=== OPEN ADD MODAL ===");
    console.log("Time Slot ID passed:", timeSlotId);
    console.log("Day of Week passed:", dayOfWeek);
    console.log("Day name:", dayOfWeek ? DAYS[dayOfWeek - 1] : "Not specified");

    setEditingEntry(null);
    setSelectedSubject(null);

    // Try to find the slot to pre-fill education level
    let preSelectedLevel = "";
    if (timeSlotId) {
      const slot = timeSlots.find((s) => s.id === timeSlotId);
      if (slot && slot.education_level) {
        preSelectedLevel = slot.education_level;
      }
    }

    setSelectedEducationLevel(preSelectedLevel);
    setSelectedGrade("");
    setFilteredSubjects([]);
    setFormData({
      time_slot_id: timeSlotId || 0,
      subject_id: 0,
      day_of_week: dayOfWeek || 1,
      room_number: "",
      grade_section: "",
      notes: "",
      is_double_lesson: false,
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (entry: any) => {
    const subject = subjects.find((s) => s.id === entry.subject_id);
    setEditingEntry(entry);
    setSelectedSubject(subject);
    setFormData({
      time_slot_id: entry.time_slot_id,
      subject_id: entry.subject_id,
      day_of_week: entry.day_of_week,
      room_number: entry.room_number || "",
      grade_section: entry.grade_section || "",
      notes: entry.notes || "",
      is_double_lesson: entry.is_double_lesson,
    });
    setIsAddModalOpen(true);
  };

  const handleEducationLevelChange = (level: string) => {
    setSelectedEducationLevel(level);
    setSelectedGrade("");
    setFilteredSubjects([]);
    setFormData({ ...formData, subject_id: 0, grade_section: "" });
  };

  const handleGradeChange = (grade: string) => {
    setSelectedGrade(grade);

    // Log for debugging
    console.log("Selected education level:", selectedEducationLevel);
    console.log("Selected grade:", grade);
    console.log(
      "Available subjects:",
      subjects.map((s) => ({
        name: s.subject_name,
        grade: s.grade,
        level: s.education_level,
      }))
    );

    // Filter subjects by BOTH education level AND grade
    const filtered = subjects.filter((s) => {
      // First check education level match
      if (
        s.education_level &&
        selectedEducationLevel &&
        s.education_level !== selectedEducationLevel
      ) {
        return false;
      }

      if (!s.grade) return false;

      // Normalize both strings for comparison
      const subjectGrade = s.grade.toLowerCase().trim();
      const selectedGradeLower = grade.toLowerCase().trim();

      // Direct match
      if (subjectGrade === selectedGradeLower) return true;

      // Match "Grade 1" with "1" or "grade1"
      if (
        subjectGrade.replace(/\s+/g, "") ===
        selectedGradeLower.replace(/\s+/g, "")
      )
        return true;

      // Match grade number (e.g., "Grade 1" matches if subject has "1")
      const gradeNumber = grade.match(/\d+/)?.[0];
      if (gradeNumber && subjectGrade.includes(gradeNumber)) return true;

      // Match PP1/PP2 format
      if (grade.includes("PP") && subjectGrade.includes(grade.toLowerCase()))
        return true;

      return false;
    });

    console.log(
      "Filtered subjects:",
      filtered.map((s) => ({
        name: s.subject_name,
        grade: s.grade,
        level: s.education_level,
      }))
    );

    // Set filtered subjects
    if (filtered.length === 0) {
      console.warn(
        `No learning areas found for ${selectedEducationLevel} - ${grade}`
      );
      toast.error(
        `No learning areas found for ${selectedEducationLevel} - ${grade}. Please add subjects in curriculum management.`
      );
      setFilteredSubjects([]);
    } else {
      setFilteredSubjects(filtered);
      toast.success(`Found ${filtered.length} learning area(s) for ${grade}`, {
        duration: 2000,
      });
    }

    setFormData({ ...formData, subject_id: 0, grade_section: grade });
  };

  const handleSubjectChange = (subjectId: number) => {
    console.log("=== HANDLE SUBJECT CHANGE ===");
    console.log("Selected subject ID:", subjectId);
    const subject = filteredSubjects.find((s) => s.id === subjectId);
    console.log("Found subject:", subject);
    console.log("Subject name:", subject?.subject_name);
    console.log("Subject grade:", subject?.grade);
    setSelectedSubject(subject);
    setFormData({
      ...formData,
      subject_id: subjectId,
      grade_section: subject?.grade || selectedGrade,
    });
    console.log("Form data after update:", {
      ...formData,
      subject_id: subjectId,
      grade_section: subject?.grade || selectedGrade,
    });
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject_id) {
      toast.error("Please select a subject");
      return;
    }

    if (bulkLessons.length === 0) {
      toast.error("Please add at least one lesson slot");
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;

      // Submit each lesson
      for (const lesson of bulkLessons) {
        if (!lesson.time_slot_id || !lesson.day_of_week) continue;

        const lessonData = {
          subject_id: formData.subject_id,
          time_slot_id: lesson.time_slot_id,
          day_of_week: lesson.day_of_week,
          room_number: formData.room_number,
          grade_section: formData.grade_section,
          notes: formData.notes,
          is_double_lesson: formData.is_double_lesson,
        };

        try {
          await axios.post("/api/v1/timetable/entries", lessonData, {
            withCredentials: true,
          });
          successCount++;
        } catch (e) {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} lesson(s) added successfully!`);
        setIsBulkModalOpen(false);
        setBulkLessons([{ day_of_week: 1, time_slot_id: 0 }]);
        setFormData({
          time_slot_id: 0,
          subject_id: 0,
          day_of_week: 1,
          room_number: "",
          grade_section: "",
          notes: "",
          is_double_lesson: false,
        });
        loadData();
      }

      if (failCount > 0) {
        toast.error(`${failCount} lesson(s) failed (may already exist)`);
      }
    } catch (error) {
      toast.error("Failed to add lessons");
    }
  };

  const addBulkLessonRow = () => {
    setBulkLessons([...bulkLessons, { day_of_week: 1, time_slot_id: 0 }]);
  };

  const removeBulkLessonRow = (index: number) => {
    if (bulkLessons.length > 1) {
      setBulkLessons(bulkLessons.filter((_, i) => i !== index));
    }
  };

  const updateBulkLesson = (index: number, field: string, value: any) => {
    const updated = [...bulkLessons];
    updated[index] = { ...updated[index], [field]: value };
    setBulkLessons(updated);
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 relative overflow-hidden">
        {/* Animated background patterns */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-40 w-72 h-72 bg-violet-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative">
          <div className="w-20 h-20 border-4 border-white/30 border-t-indigo-600 rounded-full animate-spin backdrop-blur-sm"></div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.5cm;
          }
          body * {
            visibility: hidden;
          }
          #timetable-content, #timetable-content * {
            visibility: visible;
          }
          #timetable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding-top: 0 !important;
            max-width: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          
          /* Hide content for non-premium users during print */
          ${
            !isPremium
              ? `
            #timetable-content {
              display: none !important;
            }
            body::after {
              content: "Printing is available on Premium plans only. Please upgrade to print.";
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              font-size: 24pt;
              font-weight: bold;
              color: #555;
              text-align: center;
              padding: 20px;
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              background: white;
              z-index: 9999;
            }
          `
              : ""
          }
        }
      `}</style>
      {/* Premium Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/20 rounded-full blur-[128px] animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-[128px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-pink-400/20 rounded-full blur-[128px] animate-blob animation-delay-4000"></div>
      </div>

      <div
        id="timetable-content"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8"
      >
        {/* Header with Schedule Info */}
        <div className="mb-8">
          {/* Live Status Timer */}
          {currentStatus && (
            <div
              className={`glass-card mb-6 p-5 rounded-2xl shadow-xl border border-white/60 print:hidden ${
                currentStatus.type === "in-lesson"
                  ? "bg-gradient-to-r from-green-400/30 to-emerald-400/30"
                  : currentStatus.type === "free-period"
                  ? "bg-gradient-to-r from-blue-400/30 to-cyan-400/30"
                  : currentStatus.type === "before-school"
                  ? "bg-gradient-to-r from-orange-400/30 to-amber-400/30"
                  : "bg-gradient-to-r from-purple-400/30 to-violet-400/30"
              } backdrop-blur-xl`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Animated Icon */}
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
                      currentStatus.type === "in-lesson"
                        ? "bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse"
                        : currentStatus.type === "free-period"
                        ? "bg-gradient-to-br from-blue-500 to-cyan-600"
                        : currentStatus.type === "before-school"
                        ? "bg-gradient-to-br from-orange-500 to-amber-600"
                        : "bg-gradient-to-br from-purple-500 to-violet-600"
                    }`}
                  >
                    {currentStatus.type === "in-lesson" ? (
                      <FiPlay className="w-7 h-7 text-white" />
                    ) : currentStatus.type === "free-period" ? (
                      <FiPause className="w-7 h-7 text-white" />
                    ) : (
                      <FiClock className="w-7 h-7 text-white" />
                    )}
                  </div>

                  {/* Status Info */}
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {currentStatus.message}
                      </h3>
                      {currentStatus.timeUntil && (
                        <div
                          className={`px-4 py-1.5 rounded-full font-bold text-sm shadow-md ${
                            currentStatus.type === "in-lesson"
                              ? "bg-green-500 text-white"
                              : currentStatus.type === "free-period"
                              ? "bg-blue-500 text-white"
                              : "bg-orange-500 text-white"
                          }`}
                        >
                          {currentStatus.type === "in-lesson" ? "⏱️ " : "⏳ "}
                          {currentStatus.timeUntil}
                          {currentStatus.type === "in-lesson"
                            ? " left"
                            : " until"}
                        </div>
                      )}
                    </div>
                    <p className="text-gray-700 font-medium mt-1">
                      {currentStatus.nextEvent}
                    </p>
                  </div>
                </div>

                {/* Current Time Display */}
                <div className="text-right">
                  <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {currentTime.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                  <div className="text-sm text-gray-600 font-medium mt-1">
                    {currentTime.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>

              {/* Progress Bar for Current Lesson */}
              {currentStatus.type === "in-lesson" &&
                currentStatus.progress !== undefined && (
                  <div className="mt-4">
                    <div className="w-full bg-white/40 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-1000 ease-linear shadow-lg"
                        style={{ width: `${currentStatus.progress}%` }}
                      >
                        <div className="h-full w-full bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 font-medium mt-1">
                      <span>Lesson Progress</span>
                      <span>{Math.round(currentStatus.progress)}%</span>
                    </div>
                  </div>
                )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <FiClock className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
                  Weekly Timetable
                </h1>
              </div>
              <p className="text-gray-600 text-lg ml-15">
                Organize your teaching schedule with ease
              </p>
            </div>
            <div className="flex flex-wrap gap-3 items-center print:hidden">
              <div className="relative">
                <select
                  value={selectedViewLevel}
                  onChange={(e) => setSelectedViewLevel(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 px-4 py-3 pr-10 rounded-xl text-gray-700 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all font-medium"
                >
                  <option value="All Levels">All Levels</option>
                  {Object.keys(educationLevels).map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <FiChevronDown className="w-4 h-4" />
                </div>
              </div>

              <button
                onClick={() => {
                  if (!isPremium) {
                    toast.error(
                      "Printing is available on Premium plans only. Please upgrade to print."
                    );
                    return;
                  }
                  window.print();
                }}
                disabled={!isPremium}
                className={`inline-flex items-center gap-2 px-4 py-3 border rounded-xl font-semibold transition-all shadow-sm hover:shadow group print:hidden ${
                  !isPremium
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                    : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                }`}
                title={!isPremium ? "Upgrade to print" : "Print"}
              >
                <FiPrinter className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">
                  {!isPremium ? "Preview Only" : "Print"}
                </span>
              </button>

              <button
                onClick={() => {
                  setSelectedEducationLevel("");
                  setSelectedGrade("");
                  setFilteredSubjects([]);
                  setFormData({
                    time_slot_id: 0,
                    subject_id: 0,
                    day_of_week: 1,
                    room_number: "",
                    grade_section: "",
                    notes: "",
                    is_double_lesson: false,
                  });
                  setBulkLessons([{ day_of_week: 1, time_slot_id: 0 }]);
                  setIsBulkModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700 hover:text-green-700 rounded-xl font-semibold transition-all shadow-sm hover:shadow group"
              >
                <FiBook className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Bulk Add</span>
              </button>
              <button
                onClick={() => openAddModal()}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all"
              >
                <FiPlus className="w-5 h-5" />
                <span>Add Lesson</span>
              </button>
            </div>
          </div>

          {/* Schedule Information Card */}
          {schedule && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                  <FiInfo className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 ml-4">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">
                    {schedule.schedule_name}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800">
                      <span className="text-gray-600 dark:text-gray-300 block text-xs font-medium mb-1">
                        School Hours
                      </span>
                      <p className="font-bold text-indigo-700 dark:text-indigo-300">
                        {schedule.school_start_time} -{" "}
                        {schedule.school_end_time}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-3 border border-purple-100 dark:border-purple-800">
                      <span className="text-gray-600 dark:text-gray-300 block text-xs font-medium mb-1">
                        Lesson Duration
                      </span>
                      <p className="font-bold text-purple-700 dark:text-purple-300">
                        {schedule.single_lesson_duration} min /{" "}
                        {schedule.double_lesson_duration} min
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800">
                      <span className="text-gray-600 dark:text-gray-300 block text-xs font-medium mb-1">
                        Total Lessons
                      </span>
                      <p className="font-bold text-emerald-700 dark:text-emerald-300">
                        {timeSlots.length} per day
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-3 border border-orange-100 dark:border-orange-800">
                      <span className="text-gray-600 dark:text-gray-300 block text-xs font-medium mb-1">
                        Breaks
                      </span>
                      <p className="font-bold text-orange-700 dark:text-orange-300">
                        {schedule.first_break_duration +
                          schedule.second_break_duration +
                          schedule.lunch_break_duration}{" "}
                        min total
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timetable Content */}
        <DndContext onDragEnd={handleDragEnd}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-violet-500/10 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-violet-900/20 border-b border-white/40 dark:border-gray-700">
                    <th className="p-5 text-left font-bold text-gray-800 dark:text-gray-100 sticky left-0 bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-violet-50/80 dark:from-gray-800/90 dark:via-gray-800/90 dark:to-gray-800/90 backdrop-blur-xl z-10 border-r border-white/40 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        <FiClock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <span>Time</span>
                      </div>
                    </th>
                    {DAYS.map((day, idx) => (
                      <th
                        key={day}
                        className={`p-5 min-w-[220px] font-bold text-gray-800 dark:text-gray-100 ${
                          idx === 0
                            ? "text-blue-700 dark:text-blue-400"
                            : idx === 1
                            ? "text-indigo-700 dark:text-indigo-400"
                            : idx === 2
                            ? "text-purple-700 dark:text-purple-400"
                            : idx === 3
                            ? "text-violet-700 dark:text-violet-400"
                            : "text-pink-700 dark:text-pink-400"
                        }`}
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot, slotIdx) => (
                    <tr
                      key={slot.id}
                      className="border-b border-white/30 dark:border-gray-700 hover:bg-white/20 dark:hover:bg-gray-700/20 transition-colors duration-200"
                    >
                      <td className="p-5 bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-violet-50/80 dark:from-gray-800/90 dark:via-gray-800/90 dark:to-gray-800/90 backdrop-blur-xl sticky left-0 z-10 border-r border-white/40 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md ${
                              slotIdx % 3 === 0
                                ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                                : slotIdx % 3 === 1
                                ? "bg-gradient-to-br from-purple-500 to-violet-600"
                                : "bg-gradient-to-br from-pink-500 to-rose-600"
                            }`}
                          >
                            <FiClock className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-gray-900 dark:text-white">
                              {slot.label}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                              {slot.start_time} - {slot.end_time}
                            </div>
                          </div>
                        </div>
                      </td>
                      {DAYS.map((day, dayIndex) => {
                        const dayEntries = entries.filter(
                          (e) =>
                            e.time_slot_id === slot.id &&
                            e.day_of_week === dayIndex + 1
                        );

                        return (
                          <DroppableCell
                            key={`${dayIndex}-${slot.id}`}
                            id={`cell-${dayIndex + 1}-${slot.id}`}
                            dayIndex={dayIndex}
                            slotId={slot.id}
                            onClick={() => {
                              if (dayEntries.length === 0) {
                                openAddModal(slot.id, dayIndex + 1);
                              }
                            }}
                          >
                            {dayEntries.length > 0 ? (
                              dayEntries.map((entry) => {
                                const subject = subjects.find(
                                  (s) => s.id === entry.subject_id
                                );
                                const theme = getSubjectTheme(
                                  subject?.subject_name || ""
                                );

                                return (
                                  <DraggableLesson
                                    key={entry.id}
                                    entry={entry}
                                    theme={theme}
                                    subjectName={subject?.subject_name}
                                    onEdit={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      openEditModal(entry);
                                    }}
                                    onDelete={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      handleDelete(entry.id);
                                    }}
                                  />
                                );
                              })
                            ) : (
                              <div className="h-full w-full flex flex-col items-center justify-center opacity-60 hover:opacity-100 transition-opacity">
                                <div className="text-2xl mb-1">☕</div>
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                  Free
                                </div>
                              </div>
                            )}
                          </DroppableCell>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DndContext>

        {/* Add/Edit Lesson Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="glass-modal bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto border border-white/60 dark:border-gray-700 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {editingEntry ? "Edit Lesson" : "Add New Lesson"}
                </h3>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingEntry(null);
                    setSelectedSubject(null);
                    setSelectedEducationLevel("");
                    setSelectedGrade("");
                    setFilteredSubjects([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl leading-none hover:rotate-90 transition-transform duration-300"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Education Level Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                    Education Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedEducationLevel}
                    onChange={(e) => handleEducationLevelChange(e.target.value)}
                    className="w-full bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm border-2 border-indigo-200 dark:border-indigo-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-200 font-medium dark:text-white"
                    required
                  >
                    <option value="" className="dark:bg-gray-800">
                      Select education level
                    </option>
                    {Object.keys(educationLevels).map((level) => (
                      <option
                        key={level}
                        value={level}
                        className="dark:bg-gray-800"
                      >
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grade Selection */}
                {selectedEducationLevel && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Grade <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedGrade}
                      onChange={(e) => handleGradeChange(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    >
                      <option value="" className="dark:bg-gray-800">
                        Select grade
                      </option>
                      {educationLevels[
                        selectedEducationLevel as keyof typeof educationLevels
                      ]?.map((grade) => (
                        <option
                          key={grade}
                          value={grade}
                          className="dark:bg-gray-800"
                        >
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Subject Selection (only show when grade is selected) */}
                {selectedGrade && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Learning Area / Subject{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.subject_id}
                      onChange={(e) =>
                        handleSubjectChange(parseInt(e.target.value))
                      }
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    >
                      <option value="" className="dark:bg-gray-800">
                        Select learning area
                      </option>
                      {filteredSubjects.map((subject) => (
                        <option
                          key={subject.id}
                          value={subject.id}
                          className="dark:bg-gray-800"
                        >
                          {subject.subject_name}
                        </option>
                      ))}
                    </select>
                    {filteredSubjects.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        No learning areas found for {selectedGrade}. Please add
                        subjects first.
                      </p>
                    )}
                  </div>
                )}

                {/* Day and Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Day <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.day_of_week}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          day_of_week: parseInt(e.target.value),
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      {DAYS.map((day, index) => (
                        <option key={day} value={index + 1}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Slot <span className="text-red-500">*</span>{" "}
                      {timeSlots.length === 0 && (
                        <span className="text-red-500 text-xs">
                          (No slots available)
                        </span>
                      )}
                    </label>
                    <select
                      value={formData.time_slot_id}
                      onChange={(e) => {
                        console.log(
                          "Add modal - Time slot selected:",
                          e.target.value
                        );
                        console.log(
                          "Add modal - Available time slots:",
                          timeSlots
                        );
                        setFormData({
                          ...formData,
                          time_slot_id: parseInt(e.target.value),
                        });
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="0">Select time</option>
                      {timeSlots.length === 0 ? (
                        <option value="" disabled>
                          No time slots available - please set up schedule first
                        </option>
                      ) : (
                        timeSlots
                          .filter((slot) => {
                            if (!selectedEducationLevel) return true;
                            if (
                              slot.education_level &&
                              slot.education_level !== selectedEducationLevel
                            )
                              return false;
                            return true;
                          })
                          .map((slot) => (
                            <option key={slot.id} value={slot.id}>
                              {slot.label || `Lesson ${slot.id}`}:{" "}
                              {slot.start_time} - {slot.end_time}
                            </option>
                          ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Grade/Stream and Room */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stream/Section <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.grade_section}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          grade_section: e.target.value,
                        })
                      }
                      placeholder={
                        selectedGrade
                          ? `e.g., ${selectedGrade} A, ${selectedGrade} East`
                          : "e.g., Grade 5A, Form 2 East"
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Add stream/section (e.g., A, B, East, West)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Number
                    </label>
                    <input
                      type="text"
                      value={formData.room_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          room_number: e.target.value,
                        })
                      }
                      placeholder="e.g., Lab 1, Room 204"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Lesson Type */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="double"
                    checked={formData.is_double_lesson}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_double_lesson: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="double"
                    className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    This is a double lesson (80 minutes)
                  </label>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    placeholder="Additional information about this lesson..."
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingEntry(null);
                      setSelectedSubject(null);
                    }}
                    className="flex-1 px-6 py-3 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 font-bold transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    {editingEntry ? "Update Lesson" : "Add Lesson"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Add Modal */}
        {isBulkModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="glass-modal bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto border border-white/60 dark:border-gray-700 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    Bulk Add Lessons
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 font-medium">
                    Add the same subject at different times throughout the week
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsBulkModalOpen(false);
                    setBulkLessons([{ day_of_week: 1, time_slot_id: 0 }]);
                    setSelectedEducationLevel("");
                    setSelectedGrade("");
                    setFilteredSubjects([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl leading-none hover:rotate-90 transition-transform duration-300"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleBulkSubmit} className="space-y-6">
                {/* Common Subject Information */}
                <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 dark:from-indigo-900/30 dark:to-purple-900/30 backdrop-blur-sm p-6 rounded-2xl border-2 border-indigo-200/60 dark:border-indigo-700/60 shadow-lg">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-lg flex items-center">
                    <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                    Common Information (applies to all lessons)
                  </h4>

                  <div className="space-y-4">
                    {/* Education Level Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Education Level <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedEducationLevel}
                        onChange={(e) =>
                          handleEducationLevelChange(e.target.value)
                        }
                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                        required
                      >
                        <option value="" className="dark:bg-gray-800">
                          Select education level
                        </option>
                        {Object.keys(educationLevels).map((level) => (
                          <option
                            key={level}
                            value={level}
                            className="dark:bg-gray-800"
                          >
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Grade Selection */}
                    {selectedEducationLevel && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Grade <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedGrade}
                          onChange={(e) => handleGradeChange(e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="" className="dark:bg-gray-800">
                            Select grade
                          </option>
                          {educationLevels[
                            selectedEducationLevel as keyof typeof educationLevels
                          ]?.map((grade) => (
                            <option
                              key={grade}
                              value={grade}
                              className="dark:bg-gray-800"
                            >
                              {grade}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Subject Selection (only show when grade is selected) */}
                    {selectedGrade && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Learning Area / Subject{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.subject_id}
                          onChange={(e) =>
                            handleSubjectChange(parseInt(e.target.value))
                          }
                          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="" className="dark:bg-gray-800">
                            Select learning area
                          </option>
                          {filteredSubjects.map((subject) => (
                            <option
                              key={subject.id}
                              value={subject.id}
                              className="dark:bg-gray-800"
                            >
                              {subject.subject_name}
                            </option>
                          ))}
                        </select>
                        {filteredSubjects.length === 0 && (
                          <p className="text-xs text-amber-600 mt-1">
                            No learning areas found for {selectedGrade}. Please
                            add subjects first.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Grade/Stream and Room */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Stream/Section <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.grade_section}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              grade_section: e.target.value,
                            })
                          }
                          placeholder={
                            selectedGrade
                              ? `e.g., ${selectedGrade} A, ${selectedGrade} East`
                              : "e.g., Grade 5A"
                          }
                          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Room Number
                        </label>
                        <input
                          type="text"
                          value={formData.room_number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              room_number: e.target.value,
                            })
                          }
                          placeholder="e.g., Lab 1, Room 204"
                          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Lesson Type */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="bulk-double"
                        checked={formData.is_double_lesson}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_double_lesson: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <label
                        htmlFor="bulk-double"
                        className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        All are double lessons (80 minutes)
                      </label>
                    </div>
                  </div>
                </div>

                {/* Lesson Schedule (Day & Time Combinations) */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg flex items-center">
                      <span className="w-2 h-2 bg-emerald-600 rounded-full mr-2"></span>
                      Lesson Schedule{" "}
                      <span className="text-red-500 ml-1">*</span>
                    </h4>
                    <button
                      type="button"
                      onClick={addBulkLessonRow}
                      className="text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-600 font-bold flex items-center shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <FiPlus className="w-4 h-4 mr-1" />
                      Add Another Time Slot
                    </button>
                  </div>

                  <div className="space-y-3">
                    {bulkLessons.map((lesson, index) => (
                      <div
                        key={index}
                        className="flex gap-3 items-start p-4 bg-gradient-to-r from-white/70 to-indigo-50/70 dark:from-gray-800/70 dark:to-indigo-900/30 backdrop-blur-sm rounded-xl border-2 border-indigo-200/50 dark:border-indigo-700/50 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Day
                            </label>
                            <select
                              value={lesson.day_of_week}
                              onChange={(e) =>
                                updateBulkLesson(
                                  index,
                                  "day_of_week",
                                  parseInt(e.target.value)
                                )
                              }
                              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                              required
                            >
                              {DAYS.map((day, dayIndex) => (
                                <option
                                  key={day}
                                  value={dayIndex + 1}
                                  className="dark:bg-gray-800"
                                >
                                  {day}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Time Slot{" "}
                              {timeSlots.length === 0 && (
                                <span className="text-red-500">
                                  (No slots available)
                                </span>
                              )}
                            </label>
                            <select
                              value={lesson.time_slot_id}
                              onChange={(e) => {
                                console.log(
                                  "Time slot selected:",
                                  e.target.value
                                );
                                console.log("Available time slots:", timeSlots);
                                updateBulkLesson(
                                  index,
                                  "time_slot_id",
                                  parseInt(e.target.value)
                                );
                              }}
                              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                              required
                            >
                              <option value="0" className="dark:bg-gray-800">
                                Select time
                              </option>
                              {timeSlots.length === 0 ? (
                                <option
                                  value=""
                                  disabled
                                  className="dark:bg-gray-800"
                                >
                                  No time slots available
                                </option>
                              ) : (
                                timeSlots.map((slot) => (
                                  <option
                                    key={slot.id}
                                    value={slot.id}
                                    className="dark:bg-gray-800"
                                  >
                                    {slot.label || `Lesson ${slot.id}`}:{" "}
                                    {slot.start_time} - {slot.end_time}
                                  </option>
                                ))
                              )}
                            </select>
                          </div>
                        </div>

                        {bulkLessons.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBulkLessonRow(index)}
                            className="text-red-600 hover:text-red-800 p-2 mt-5"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    💡 Example: Math on Monday 8:00-8:40, Tuesday 10:00-10:40,
                    Wednesday 9:00-9:40, etc.
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={2}
                    placeholder="Additional information for all these lessons..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBulkModalOpen(false);
                      setBulkLessons([{ day_of_week: 1, time_slot_id: 0 }]);
                    }}
                    className="flex-1 px-6 py-3 bg-white/60 backdrop-blur-sm border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 hover:border-gray-400 font-bold transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    Add{" "}
                    {
                      bulkLessons.filter((l) => l.time_slot_id && l.day_of_week)
                        .length
                    }{" "}
                    Lesson(s)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetablePage;
