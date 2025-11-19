"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
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
} from "react-icons/fi";
import { DndContext, useDraggable, useDroppable, DragEndEvent } from "@dnd-kit/core";

const DraggableLesson = ({ entry, theme, subjectName, onEdit, onDelete }: any) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lesson-${entry.id}`,
    data: entry,
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999,
  } : undefined;

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} className="opacity-50">
        <div className={`p-4 rounded-xl bg-gradient-to-br ${theme.gradient} border-l-4 ${theme.border} shadow-lg`}>
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
      <div className={`absolute inset-0 ${theme.pattern} opacity-20 pointer-events-none`}></div>

      {/* Double lesson badge */}
      {entry.is_double_lesson && (
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-gray-700 shadow-md">
          Double
        </div>
      )}

      <div className="relative z-10 flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 ${theme.iconBg} rounded-lg flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-200`}>
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
        <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
      className={`p-3 align-top transition-colors duration-200 ${isOver ? 'bg-indigo-100/50 ring-2 ring-indigo-400 ring-inset rounded-lg' : ''}`}
    >
      <div 
        onClick={onClick}
        className={`w-full min-h-[110px] rounded-xl border-2 border-dashed ${isOver ? 'border-indigo-400 bg-indigo-50/30' : 'border-gray-300 bg-gradient-to-br from-gray-100/80 to-slate-100/80 hover:from-indigo-100/60 hover:to-purple-100/60 hover:border-indigo-400'} backdrop-blur-sm transition-all duration-300 flex flex-col items-center justify-center group cursor-pointer`}
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

  const [selectedViewLevel, setSelectedViewLevel] =
    useState("Junior Secondary");

  // Education levels and their grades
  const educationLevels = {
    "Pre-Primary": ["PP1", "PP2"],
    "Lower Primary": ["Grade 1", "Grade 2", "Grade 3"],
    "Upper Primary": ["Grade 4", "Grade 5", "Grade 6"],
    "Junior Secondary": ["Grade 7", "Grade 8", "Grade 9"],
    "Senior Secondary": ["Grade 10", "Grade 11", "Grade 12"],
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Please login");
      router.push("/login");
      return;
    }
    loadData();
  }, [selectedViewLevel]); // Reload when level changes

  // Timer and status update effect
  useEffect(() => {
    // ... (existing code)
  }, [schedule, timeSlots, entries, subjects]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };

      const scheduleRes = await fetch(
        `http://localhost:8000/api/v1/timetable/schedules/active?education_level=${encodeURIComponent(
          selectedViewLevel
        )}`,
        { headers }
      );
      if (!scheduleRes.ok) {
        // If no schedule for this level, clear state but don't redirect immediately if they might want to switch levels
        // But if it's the initial load, maybe we should warn.
        // For now, let's just clear the schedule so the UI shows "No schedule"
        setSchedule(null);
        setTimeSlots([]);
        setEntries([]);
        // toast.error(`No schedule found for ${selectedViewLevel}`);
        setIsLoading(false);
        return;
      }
      const scheduleData = await scheduleRes.json();
      setSchedule(scheduleData);

      // Fetch time slots for this schedule
      // Note: The backend time-slots endpoint currently returns ALL slots for the user's active schedule.
      // If we have multiple active schedules (one per level), we need to make sure we get the slots for THIS schedule.
      // The backend `get_time_slots` uses `get_active_schedule` internally.
      // We should update `get_time_slots` to accept `education_level` or `schedule_id`.
      // Let's check backend `get_time_slots` implementation.

      // Assuming I need to update backend `get_time_slots` as well.
      // For now, let's try passing the param if the backend supports it, or rely on the backend finding the correct one.
      // Wait, I haven't updated `get_time_slots` in backend yet!

      const slotsRes = await fetch(
        `http://localhost:8000/api/v1/timetable/time-slots?education_level=${encodeURIComponent(
          selectedViewLevel
        )}`,
        { headers }
      );
      const slotsData = await slotsRes.json();

      console.log("Raw time slots from API:", slotsData);

      // Filter lesson slots and add labels
      const lessonSlots = slotsData
        .filter((s: any) => s.slot_type === "lesson")
        .map((s: any, index: number) => ({
          ...s,
          label: `Lesson ${index + 1}`,
        }));

      console.log("Filtered lesson slots:", lessonSlots);
      console.log("Number of lesson slots:", lessonSlots.length);

      setTimeSlots(lessonSlots);
      console.log("Time slots set to state:", lessonSlots);

      const entriesRes = await fetch(
        "http://localhost:8000/api/v1/timetable/entries",
        { headers }
      );
      setEntries(await entriesRes.json());

      // Fetch USER'S SUBJECTS (for displaying in timetable)
      const userSubjectsRes = await fetch(
        "http://localhost:8000/api/v1/subjects",
        { headers }
      );
      const userSubjects = await userSubjectsRes.json();
      console.log("Loaded user subjects:", userSubjects);

      // Fetch all curriculum templates (learning areas) - any teacher can use any template
      let curriculumData = [];
      try {
        // Try admin endpoint first (works if user has admin access)
        const adminRes = await fetch(
          "http://localhost:8000/api/v1/admin/curriculum-templates?is_active=true",
          {
            headers,
          }
        );
        if (adminRes.ok) {
          curriculumData = await adminRes.json();
        } else {
          // Fall back to public endpoint
          const publicRes = await fetch(
            "http://localhost:8000/api/v1/curriculum-templates",
            {
              headers,
            }
          );
          const publicData = await publicRes.json();
          curriculumData = publicData.templates || [];
        }
      } catch (error) {
        console.error("Failed to fetch curriculum templates:", error);
        toast.error("Failed to load learning areas");
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
      const token = localStorage.getItem("accessToken");
      const url = editingEntry
        ? `http://localhost:8000/api/v1/timetable/entries/${editingEntry.id}`
        : "http://localhost:8000/api/v1/timetable/entries";
      const response = await fetch(url, {
        method: editingEntry ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Response from server:", data);
        toast.success("Lesson saved successfully!");
        setIsAddModalOpen(false);
        setEditingEntry(null);
        setSelectedSubject(null);
        loadData();
      } else {
        const error = await response.json();
        console.error("Server error:", error);
        toast.error(error.detail || "Failed to save lesson");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to save lesson");
    }
  };

  const handleDelete = async (entryId: number) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `http://localhost:8000/api/v1/timetable/entries/${entryId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        toast.success("Lesson deleted");
        loadData();
      } else {
        toast.error("Failed to delete lesson");
      }
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
    if (entry.day_of_week === newDayOfWeek && entry.time_slot_id === newTimeSlotId) {
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
      const token = localStorage.getItem("accessToken");
      // We need to send the full payload required by the API
      // We'll fetch the current entry data first or just construct it from what we have
      // The API expects: subject_id, time_slot_id, day_of_week, etc.
      
      const payload = {
        subject_id: entry.subject_id,
        time_slot_id: newTimeSlotId,
        day_of_week: newDayOfWeek,
        room_number: entry.room_number,
        grade_section: entry.grade_section,
        notes: entry.notes,
        is_double_lesson: entry.is_double_lesson
      };

      const response = await fetch(
        `http://localhost:8000/api/v1/timetable/entries/${entryId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update lesson position");
      }
      
      toast.success("Lesson moved", { duration: 1500, icon: '👌' });
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
    setSelectedEducationLevel("");
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
      const token = localStorage.getItem("accessToken");
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

        const response = await fetch(
          "http://localhost:8000/api/v1/timetable/entries",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(lessonData),
          }
        );

        if (response.ok) {
          successCount++;
        } else {
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
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background patterns */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-40 w-96 h-96 bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header with Schedule Info */}
        <div className="mb-8">
          {/* Live Status Timer */}
          {currentStatus && (
            <div
              className={`glass-card mb-6 p-5 rounded-2xl shadow-xl border border-white/60 ${
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

          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
                Weekly Timetable
              </h1>
              <p className="text-gray-700 mt-2 text-lg font-medium">
                Manage your teaching schedule with elegance
              </p>
            </div>
            <div className="flex space-x-3 items-center">
              <div className="relative">
                <select
                  value={selectedViewLevel}
                  onChange={(e) => setSelectedViewLevel(e.target.value)}
                  className="appearance-none bg-white/60 backdrop-blur-lg border border-white/60 hover:bg-white/80 px-4 py-2.5 pr-8 rounded-xl text-gray-800 shadow-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {Object.keys(educationLevels).map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <FiChevronDown className="w-4 h-4" />
                </div>
              </div>

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
                className="glass-button bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-5 py-2.5 rounded-xl flex items-center shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
              >
                <FiBook className="mr-2" />
                Bulk Add
              </button>
              <button
                onClick={() => openAddModal()}
                className="glass-button bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl flex items-center shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
              >
                <FiPlus className="mr-2" />
                Add Lesson
              </button>
            </div>
          </div>

          {/* Schedule Information Card */}
          {schedule && (
            <div className="glass-card bg-white/50 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-6 mb-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <FiInfo className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 ml-4">
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">
                    {schedule.schedule_name}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                    <div className="glass-stat bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-xl p-3 border border-indigo-100/50">
                      <span className="text-gray-600 block text-xs font-medium mb-1">
                        School Hours
                      </span>
                      <p className="font-bold text-indigo-700">
                        {schedule.school_start_time} -{" "}
                        {schedule.school_end_time}
                      </p>
                    </div>
                    <div className="glass-stat bg-gradient-to-br from-purple-50/50 to-violet-50/50 rounded-xl p-3 border border-purple-100/50">
                      <span className="text-gray-600 block text-xs font-medium mb-1">
                        Lesson Duration
                      </span>
                      <p className="font-bold text-purple-700">
                        {schedule.single_lesson_duration} min /{" "}
                        {schedule.double_lesson_duration} min
                      </p>
                    </div>
                    <div className="glass-stat bg-gradient-to-br from-emerald-50/50 to-green-50/50 rounded-xl p-3 border border-emerald-100/50">
                      <span className="text-gray-600 block text-xs font-medium mb-1">
                        Total Lessons
                      </span>
                      <p className="font-bold text-emerald-700">
                        {timeSlots.length} per day
                      </p>
                    </div>
                    <div className="glass-stat bg-gradient-to-br from-orange-50/50 to-amber-50/50 rounded-xl p-3 border border-orange-100/50">
                      <span className="text-gray-600 block text-xs font-medium mb-1">
                        Breaks
                      </span>
                      <p className="font-bold text-orange-700">
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

        {/* Timetable Grid */}
        <DndContext onDragEnd={handleDragEnd}>
          <div className="glass-card bg-white/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-violet-500/10 border-b border-white/40">
                    <th className="p-5 text-left font-bold text-gray-800 sticky left-0 bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-violet-50/80 backdrop-blur-xl z-10 border-r border-white/40">
                      <div className="flex items-center space-x-2">
                        <FiClock className="w-5 h-5 text-indigo-600" />
                        <span>Time</span>
                      </div>
                    </th>
                    {DAYS.map((day, idx) => (
                      <th
                        key={day}
                        className={`p-5 min-w-[220px] font-bold text-gray-800 ${
                          idx === 0
                            ? "text-blue-700"
                            : idx === 1
                            ? "text-indigo-700"
                            : idx === 2
                            ? "text-purple-700"
                            : idx === 3
                            ? "text-violet-700"
                            : "text-pink-700"
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
                      className="border-b border-white/30 hover:bg-white/20 transition-colors duration-200"
                    >
                      <td className="p-5 bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-violet-50/80 backdrop-blur-xl sticky left-0 z-10 border-r border-white/40">
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
                            <div className="font-bold text-sm text-gray-900">
                              {slot.label}
                            </div>
                            <div className="text-xs text-gray-600 font-medium">
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
                                    onEdit={(e) => {
                                      e.stopPropagation();
                                      openEditModal(entry);
                                    }}
                                    onDelete={(e) => {
                                      e.stopPropagation();
                                      handleDelete(entry.id);
                                    }}
                                  />
                                );
                              })
                            ) : (
                              <div className="h-full w-full flex flex-col items-center justify-center opacity-60 hover:opacity-100 transition-opacity">
                                <div className="text-2xl mb-1">☕</div>
                                <div className="text-xs font-medium text-gray-500">Free</div>
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
            <div className="glass-modal bg-white/95 backdrop-blur-2xl rounded-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto border border-white/60 shadow-2xl">
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
                  className="text-gray-400 hover:text-gray-600 text-3xl leading-none hover:rotate-90 transition-transform duration-300"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Education Level Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Education Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedEducationLevel}
                    onChange={(e) => handleEducationLevelChange(e.target.value)}
                    className="w-full bg-white/60 backdrop-blur-sm border-2 border-indigo-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-200 font-medium"
                    required
                  >
                    <option value="">Select education level</option>
                    {Object.keys(educationLevels).map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grade Selection */}
                {selectedEducationLevel && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedGrade}
                      onChange={(e) => handleGradeChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select grade</option>
                      {educationLevels[
                        selectedEducationLevel as keyof typeof educationLevels
                      ]?.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Subject Selection (only show when grade is selected) */}
                {selectedGrade && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Learning Area / Subject{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.subject_id}
                      onChange={(e) =>
                        handleSubjectChange(parseInt(e.target.value))
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select learning area</option>
                      {filteredSubjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        timeSlots.map((slot) => (
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
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    This is a double lesson (80 minutes)
                  </label>
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
                    rows={3}
                    placeholder="Additional information about this lesson..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingEntry(null);
                      setSelectedSubject(null);
                    }}
                    className="flex-1 px-6 py-3 bg-white/60 backdrop-blur-sm border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 hover:border-gray-400 font-bold transition-all duration-200 shadow-md hover:shadow-lg"
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
            <div className="glass-modal bg-white/95 backdrop-blur-2xl rounded-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto border border-white/60 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    Bulk Add Lessons
                  </h3>
                  <p className="text-sm text-gray-700 mt-2 font-medium">
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
                  className="text-gray-400 hover:text-gray-600 text-3xl leading-none hover:rotate-90 transition-transform duration-300"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleBulkSubmit} className="space-y-6">
                {/* Common Subject Information */}
                <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 backdrop-blur-sm p-6 rounded-2xl border-2 border-indigo-200/60 shadow-lg">
                  <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center">
                    <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                    Common Information (applies to all lessons)
                  </h4>

                  <div className="space-y-4">
                    {/* Education Level Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Education Level <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedEducationLevel}
                        onChange={(e) =>
                          handleEducationLevelChange(e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                        required
                      >
                        <option value="">Select education level</option>
                        {Object.keys(educationLevels).map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Grade Selection */}
                    {selectedEducationLevel && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Grade <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedGrade}
                          onChange={(e) => handleGradeChange(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="">Select grade</option>
                          {educationLevels[
                            selectedEducationLevel as keyof typeof educationLevels
                          ]?.map((grade) => (
                            <option key={grade} value={grade}>
                              {grade}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Subject Selection (only show when grade is selected) */}
                    {selectedGrade && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Learning Area / Subject{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.subject_id}
                          onChange={(e) =>
                            handleSubjectChange(parseInt(e.target.value))
                          }
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="">Select learning area</option>
                          {filteredSubjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
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
                              : "e.g., Grade 5A"
                          }
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
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
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
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
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="bulk-double"
                        className="ml-2 text-sm font-medium text-gray-700"
                      >
                        All are double lessons (80 minutes)
                      </label>
                    </div>
                  </div>
                </div>

                {/* Lesson Schedule (Day & Time Combinations) */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-900 text-lg flex items-center">
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
                        className="flex gap-3 items-start p-4 bg-gradient-to-r from-white/70 to-indigo-50/70 backdrop-blur-sm rounded-xl border-2 border-indigo-200/50 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
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
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                              required
                            >
                              {DAYS.map((day, dayIndex) => (
                                <option key={day} value={dayIndex + 1}>
                                  {day}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
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
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                              required
                            >
                              <option value="0">Select time</option>
                              {timeSlots.length === 0 ? (
                                <option value="" disabled>
                                  No time slots available
                                </option>
                              ) : (
                                timeSlots.map((slot) => (
                                  <option key={slot.id} value={slot.id}>
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
