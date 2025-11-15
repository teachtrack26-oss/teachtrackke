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
} from "react-icons/fi";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

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
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };

      const scheduleRes = await fetch(
        "http://localhost:8000/api/v1/timetable/schedules/active",
        { headers }
      );
      if (!scheduleRes.ok) {
        toast.error("No schedule. Please set up first.");
        router.push("/timetable/setup");
        return;
      }
      const scheduleData = await scheduleRes.json();
      setSchedule(scheduleData);

      const slotsRes = await fetch(
        "http://localhost:8000/api/v1/timetable/time-slots",
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
      const transformedSubjects = curriculumData.map((template: any) => ({
        id: template.id,
        subject_name: template.subject,
        grade: template.grade,
        education_level: template.education_level,
        is_template: true, // Flag to indicate this is a template, not a user subject
      }));

      setSubjects(transformedSubjects);
      console.log("Loaded curriculum templates:", transformedSubjects);

      setIsLoading(false);
    } catch (error) {
      toast.error("Failed to load");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        toast.success("Lesson saved successfully!");
        setIsAddModalOpen(false);
        setEditingEntry(null);
        setSelectedSubject(null);
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to save lesson");
      }
    } catch (error) {
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

  const openAddModal = (timeSlotId?: number, dayOfWeek?: number) => {
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
    const subject = filteredSubjects.find((s) => s.id === subjectId);
    setSelectedSubject(subject);
    setFormData({
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with Schedule Info */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Weekly Timetable
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your teaching schedule
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push("/timetable/setup")}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center text-gray-700"
              >
                <FiSettings className="mr-2" />
                Setup
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
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <FiBook className="mr-2" />
                Bulk Add
              </button>
              <button
                onClick={() => openAddModal()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <FiPlus className="mr-2" />
                Add Lesson
              </button>
            </div>
          </div>

          {/* Schedule Information Card */}
          {schedule && (
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="flex items-start">
                <FiInfo className="w-5 h-5 text-indigo-600 mr-3 mt-1" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {schedule.schedule_name}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">School Hours:</span>
                      <p className="font-medium">
                        {schedule.school_start_time} -{" "}
                        {schedule.school_end_time}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Lesson Duration:</span>
                      <p className="font-medium">
                        {schedule.single_lesson_duration} min /{" "}
                        {schedule.double_lesson_duration} min
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Lessons:</span>
                      <p className="font-medium">{timeSlots.length} per day</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Breaks:</span>
                      <p className="font-medium">
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
        <div className="bg-white rounded-lg shadow border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 text-left font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">
                  Time
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className="p-4 min-w-[200px] font-semibold text-gray-700"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={slot.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 bg-gray-50 sticky left-0 z-10 border-r">
                    <div className="flex items-center">
                      <FiClock className="w-4 h-4 text-gray-500 mr-2" />
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {slot.label}
                        </div>
                        <div className="text-xs text-gray-600">
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
                      <td key={dayIndex} className="p-2 align-top">
                        {dayEntries.length > 0 ? (
                          dayEntries.map((entry) => {
                            const subject = subjects.find(
                              (s) => s.id === entry.subject_id
                            );
                            return (
                              <div
                                key={entry.id}
                                className="p-3 rounded-lg bg-indigo-50 border-l-4 border-indigo-500 group hover:shadow-md transition-shadow cursor-pointer mb-2"
                                onClick={() => openEditModal(entry)}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-semibold text-sm text-gray-900">
                                      {subject?.subject_name}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1 space-y-1">
                                      {entry.grade_section && (
                                        <div>
                                          <strong>Grade:</strong>{" "}
                                          {entry.grade_section}
                                        </div>
                                      )}
                                      {entry.room_number && (
                                        <div className="flex items-center">
                                          <FiBook className="w-3 h-3 mr-1" />
                                          Room {entry.room_number}
                                        </div>
                                      )}
                                      {entry.is_double_lesson && (
                                        <div className="text-indigo-600 font-medium">
                                          Double Lesson
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditModal(entry);
                                      }}
                                      className="text-blue-600 hover:text-blue-800 p-1"
                                    >
                                      <FiEdit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(entry.id);
                                      }}
                                      className="text-red-600 hover:text-red-800 p-1"
                                    >
                                      <FiTrash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <button
                            onClick={() => openAddModal(slot.id, dayIndex + 1)}
                            className="w-full min-h-[80px] text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border-2 border-dashed border-gray-200 hover:border-indigo-300 transition-colors flex items-center justify-center"
                          >
                            <FiPlus className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Lesson Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
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
                  className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Education Level Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Education Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedEducationLevel}
                    onChange={(e) => handleEducationLevelChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingEntry(null);
                      setSelectedSubject(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Bulk Add Lessons
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
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
                  className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleBulkSubmit} className="space-y-6">
                {/* Common Subject Information */}
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h4 className="font-medium text-gray-900 mb-4">
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
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900">
                      Lesson Schedule <span className="text-red-500">*</span>
                    </h4>
                    <button
                      type="button"
                      onClick={addBulkLessonRow}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
                    >
                      <FiPlus className="w-4 h-4 mr-1" />
                      Add Another Time Slot
                    </button>
                  </div>

                  <div className="space-y-3">
                    {bulkLessons.map((lesson, index) => (
                      <div
                        key={index}
                        className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg border"
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
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBulkModalOpen(false);
                      setBulkLessons([{ day_of_week: 1, time_slot_id: 0 }]);
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
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
