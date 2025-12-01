"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiArrowLeft, FiSave, FiFileText } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

interface LessonPlanData {
  id?: number;
  subject_id: number;
  learning_area: string;
  grade: string;
  date: string;
  time: string;
  roll: string;
  strand_theme_topic: string;
  sub_strand_sub_theme_sub_topic: string;
  specific_learning_outcomes: string;
  key_inquiry_questions: string;
  core_competences: string;
  values_to_be_developed: string;
  pcis_to_be_addressed: string;
  learning_resources: string;
  introduction: string;
  development: string;
  conclusion: string;
  summary: string;
  reflection_self_evaluation: string;
}

interface TimetableEntry {
  id: number;
  day_of_week: number;
  time_slot_id: number;
  subject_id: number;
  grade_section: string;
  room_number: string;
}

interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  label: string;
  slot_type?: string;
}

interface SchoolSettings {
  grades_offered: string[];
  streams_per_grade: { [key: string]: { name: string; pupils: number }[] };
}

interface Subject {
  id: number;
  subject_name: string;
  grade: string;
}

export default function EditLessonPlanPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAuto, setGeneratingAuto] = useState(false);
  const [enhancingAI, setEnhancingAI] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<LessonPlanData>({
    subject_id: 0,
    learning_area: "",
    grade: "",
    date: "",
    time: "",
    roll: "",
    strand_theme_topic: "",
    sub_strand_sub_theme_sub_topic: "",
    specific_learning_outcomes: "",
    key_inquiry_questions: "",
    core_competences: "",
    values_to_be_developed: "",
    pcis_to_be_addressed: "",
    learning_resources: "",
    introduction: "",
    development: "",
    conclusion: "",
    summary: "",
    reflection_self_evaluation: "",
  });

  // New state for automation
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>(
    []
  );
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(
    null
  );
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedStream, setSelectedStream] = useState<string>("");
  const [presentLearners, setPresentLearners] = useState<string>("");
  const [totalLearners, setTotalLearners] = useState<number>(0);

  useEffect(() => {
    if (planId) {
      fetchLessonPlan();
      fetchAutomationData();
    }
  }, [planId]);

  const fetchAutomationData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };

      const [entriesRes, slotsRes, settingsRes, subjectsRes] =
        await Promise.all([
          axios.get("/api/v1/timetable/entries", { headers }),
          axios.get("/api/v1/timetable/time-slots", { headers }),
          axios.get("/api/v1/admin/school-settings", { headers }),
          axios.get("/api/v1/subjects", { headers }),
        ]);

      setTimetableEntries(entriesRes.data);
      setTimeSlots(slotsRes.data);
      setSchoolSettings(settingsRes.data);
      setSubjects(subjectsRes.data);
    } catch (error) {
      console.error("Failed to fetch automation data:", error);
      // Don't block the main UI if this fails, just log it
    }
  };

  const fetchLessonPlan = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const cleanId = planId.replace(/-$/, "");
      const response = await axios.get(`/api/v1/lesson-plans/${cleanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Ensure null values are converted to empty strings for inputs
      const data = response.data;
      const sanitizedData = Object.keys(data).reduce((acc, key) => {
        acc[key] = data[key] === null ? "" : data[key];
        return acc;
      }, {} as any);

      setLessonPlan(sanitizedData);

      // Parse existing roll data if available
      if (sanitizedData.roll && sanitizedData.roll.includes("/")) {
        const [present, total] = sanitizedData.roll.split("/");
        setPresentLearners(present.trim());
        setTotalLearners(parseInt(total.trim()) || 0);
      } else if (sanitizedData.roll) {
        setPresentLearners(sanitizedData.roll);
      }
    } catch (error) {
      console.error("Failed to fetch lesson plan:", error);
      toast.error("Failed to load lesson plan");
      router.push("/professional-records?tab=lessons");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setLessonPlan((prev) => ({ ...prev, [name]: value }));
  };

  const handleTimetableSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const entryId = parseInt(e.target.value);
    const entry = timetableEntries.find((en) => en.id === entryId);

    if (entry) {
      const slot = timeSlots.find((s) => s.id === entry.time_slot_id);
      const subject = subjects.find((s) => s.id === entry.subject_id);

      if (slot && subject) {
        // Calculate next occurrence of this day
        const today = new Date();
        const currentDay = today.getDay(); // 0=Sun, 1=Mon, etc.
        // entry.day_of_week is 1=Mon, 5=Fri
        // Adjust for Sunday being 0 in JS
        const targetDay = entry.day_of_week;

        let daysUntil = targetDay - currentDay;
        if (daysUntil <= 0) {
          daysUntil += 7;
        }

        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + daysUntil);
        const dateString = nextDate.toISOString().split("T")[0]; // YYYY-MM-DD

        setLessonPlan((prev) => ({
          ...prev,
          time: `${slot.start_time} - ${slot.end_time}`,
          grade: entry.grade_section || subject.grade, // Use timetable grade or subject grade
          learning_area: subject.subject_name,
          subject_id: subject.id,
          date: dateString,
        }));

        // Trigger grade change logic to update streams
        handleGradeChange(entry.grade_section || subject.grade);
      }
    }
  };

  const handleGradeChange = (grade: string) => {
    // Extract just the grade part (e.g., "Grade 7" from "Grade 7A")
    // This is a simple heuristic, might need refinement based on exact data format
    let gradeKey = grade;
    if (schoolSettings?.grades_offered) {
      // Try to find exact match first
      if (!schoolSettings.grades_offered.includes(grade)) {
        // Try to find partial match
        const match = schoolSettings.grades_offered.find((g) =>
          grade.startsWith(g)
        );
        if (match) gradeKey = match;
      }
    }

    if (
      schoolSettings?.streams_per_grade &&
      schoolSettings.streams_per_grade[gradeKey]
    ) {
      const streams = schoolSettings.streams_per_grade[gradeKey];
      if (streams.length === 1) {
        // Only one stream (or single class), auto-select
        setSelectedStream(streams[0].name);
        setTotalLearners(streams[0].pupils);
      } else {
        // Multiple streams, reset selection
        setSelectedStream("");
        setTotalLearners(0);
      }
    }
  };

  const handleStreamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const streamName = e.target.value;
    setSelectedStream(streamName);

    // Find pupils count
    // Need to extract grade again from current lessonPlan state or use a ref
    // For simplicity, we'll iterate all grades to find the stream if unique, or rely on lessonPlan.grade
    if (schoolSettings && lessonPlan.grade) {
      let gradeKey = lessonPlan.grade;
      const match = schoolSettings.grades_offered.find((g) =>
        lessonPlan.grade.startsWith(g)
      );
      if (match) gradeKey = match;

      const streams = schoolSettings.streams_per_grade[gradeKey];
      if (streams) {
        const stream = streams.find((s) => s.name === streamName);
        if (stream) {
          setTotalLearners(stream.pupils);
        }
      }
    }
  };

  const handleRollChange = (present: string) => {
    setPresentLearners(present);
    if (totalLearners > 0) {
      setLessonPlan((prev) => ({
        ...prev,
        roll: `${present}/${totalLearners}`,
      }));
    } else {
      setLessonPlan((prev) => ({ ...prev, roll: present }));
    }
  };

  // Apply a standard template
  const applyTemplate = () => {
    setLessonPlan((prev) => ({
      ...prev,
      introduction:
        "Introduction (5 minutes)\n- Recap the previous lesson on...\n- Guide learners to...\n- State the learning objectives",
      development:
        "Lesson Development (30 minutes)\n\nStep 1: (10 mins)\n- ...\n\nStep 2: (10 mins)\n- ...\n\nStep 3: (10 mins)\n- ...",
      conclusion:
        "Conclusion (5 minutes)\n- Summarize key points\n- Ask review questions\n- Preview next lesson\n- Assign homework",
    }));
    toast.success("Template applied!");
  };

  // Auto-generate from curriculum data
  const autoGeneratePlan = async () => {
    if (!lessonPlan.id) {
      toast.error("Please save the lesson plan first");
      return;
    }

    setGeneratingAuto(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `/api/v1/lesson-plans/${lessonPlan.id}/auto-generate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedPlan = response.data;
      setLessonPlan((prev) => ({
        ...prev,
        introduction: updatedPlan.introduction || prev.introduction,
        development: updatedPlan.development || prev.development,
        conclusion: updatedPlan.conclusion || prev.conclusion,
        summary: updatedPlan.summary || prev.summary,
      }));
      toast.success("Plan auto-generated from curriculum!");
    } catch (error) {
      console.error("Failed to auto-generate plan", error);
      toast.error("Failed to auto-generate. Please try again.");
    } finally {
      setGeneratingAuto(false);
    }
  };

  // Enhance with AI
  const enhancePlan = async () => {
    if (!lessonPlan.id) {
      toast.error("Please save the lesson plan first");
      return;
    }

    setEnhancingAI(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `/api/v1/lesson-plans/${lessonPlan.id}/enhance`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const enhancedPlan = response.data;
      setLessonPlan((prev) => ({
        ...prev,
        introduction: enhancedPlan.introduction || prev.introduction,
        development: enhancedPlan.development || prev.development,
        conclusion: enhancedPlan.conclusion || prev.conclusion,
        summary: enhancedPlan.summary || prev.summary,
        reflection_self_evaluation:
          enhancedPlan.reflection_self_evaluation ||
          prev.reflection_self_evaluation,
      }));
      toast.success("Lesson plan enhanced with AI!");
    } catch (error) {
      console.error("Failed to enhance plan", error);
      toast.error("Failed to enhance plan. Please try again.");
    } finally {
      setEnhancingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !lessonPlan.learning_area ||
      !lessonPlan.grade ||
      !lessonPlan.strand_theme_topic
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("accessToken");
      const cleanId = planId.replace(/-$/, "");

      // Handle empty date string by converting to null or keeping as is depending on backend requirement
      // Based on previous fixes, backend expects None (null) for empty date string
      const payload = { ...lessonPlan };
      if (payload.date === "") {
        // @ts-ignore
        payload.date = null;
      }

      await axios.put(`/api/v1/lesson-plans/${cleanId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Lesson plan updated successfully!");
      router.push(`/professional-records/lesson-plans/${cleanId}`);
    } catch (error) {
      console.error("Failed to update lesson plan:", error);
      toast.error("Failed to update lesson plan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">
            Loading lesson plan...
          </p>
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

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push("/professional-records?tab=lessons")}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <FiArrowLeft className="w-5 h-5" />
              Back to Professional Records
            </button>
            <span className="text-gray-400">|</span>
            <button
              onClick={() =>
                router.push(
                  `/professional-records/lesson-plans/${planId.replace(
                    /-$/,
                    ""
                  )}`
                )
              }
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              View Lesson Plan
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl">
              <FiFileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
                Edit Lesson Plan
              </h1>
              <p className="text-gray-700 mt-1">
                Update your lesson plan details
              </p>
            </div>
          </div>
        </div>

        {/* Lesson Plan Form */}
        <form onSubmit={handleSubmit}>
          <div className="glass-card bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8 mb-6">
            {/* Header Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center border-b-2 border-gray-300 pb-3">
                CBC LESSON PLAN
              </h2>

              <div className="grid md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 border border-gray-300">
                {/* Timetable Selection - Spans 2 columns */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    SELECT FROM TIMETABLE
                  </label>
                  <select
                    onChange={handleTimetableSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="">-- Select a slot to auto-fill --</option>
                    {timetableEntries.map((entry) => {
                      const slot = timeSlots.find(
                        (s) => s.id === entry.time_slot_id
                      );
                      const subject = subjects.find(
                        (s) => s.id === entry.subject_id
                      );
                      const dayName = [
                        "Sun",
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                      ][entry.day_of_week % 7]; // Adjust if day_of_week is 1-5
                      // Assuming day_of_week 1=Mon
                      const days = [
                        "",
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                        "Sun",
                      ];
                      const dayStr =
                        days[entry.day_of_week] || `Day ${entry.day_of_week}`;

                      return (
                        <option key={entry.id} value={entry.id}>
                          {dayStr} {slot?.start_time} - {subject?.subject_name}{" "}
                          ({entry.grade_section})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    LEARNING AREA *
                  </label>
                  <input
                    type="text"
                    name="learning_area"
                    value={lessonPlan.learning_area}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    GRADE *
                  </label>
                  <input
                    type="text"
                    name="grade"
                    value={lessonPlan.grade}
                    onChange={(e) => {
                      handleInputChange(e);
                      handleGradeChange(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    DATE
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={lessonPlan.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    TIME
                  </label>
                  {timeSlots.length > 0 ? (
                    <select
                      name="time"
                      value={lessonPlan.time}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select Time</option>
                      {timeSlots
                        .filter((slot) => slot.slot_type === "lesson")
                        .map((slot) => (
                          <option
                            key={slot.id}
                            value={`${slot.start_time} - ${slot.end_time}`}
                          >
                            {slot.start_time} - {slot.end_time}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="time"
                      value={lessonPlan.time}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    ROLL (Present / Total)
                  </label>
                  <div className="flex gap-2">
                    {schoolSettings && lessonPlan.grade && (
                      <select
                        value={selectedStream}
                        onChange={handleStreamChange}
                        className="w-1/3 px-2 py-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Stream</option>
                        {(() => {
                          let gradeKey = lessonPlan.grade;
                          const match = schoolSettings.grades_offered.find(
                            (g) => lessonPlan.grade.startsWith(g)
                          );
                          if (match) gradeKey = match;
                          return schoolSettings.streams_per_grade[
                            gradeKey
                          ]?.map((s) => (
                            <option key={s.name} value={s.name}>
                              {s.name || "Class"}
                            </option>
                          ));
                        })()}
                      </select>
                    )}
                    <div className="flex items-center gap-1 w-full">
                      <input
                        type="number"
                        placeholder="Present"
                        value={presentLearners}
                        onChange={(e) => handleRollChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <span className="text-gray-500 font-bold">/</span>
                      <input
                        type="number"
                        value={totalLearners}
                        readOnly
                        className="w-20 px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lesson Details */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  STRAND/THEME/TOPIC *
                </label>
                <input
                  type="text"
                  name="strand_theme_topic"
                  value={lessonPlan.strand_theme_topic}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Sub-strand/Sub-Theme/Sub-Topic
                </label>
                <input
                  type="text"
                  name="sub_strand_sub_theme_sub_topic"
                  value={lessonPlan.sub_strand_sub_theme_sub_topic}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Learner's Specific Learning Outcomes
                </label>
                <textarea
                  name="specific_learning_outcomes"
                  value={lessonPlan.specific_learning_outcomes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Key Inquiry Question(s)
                </label>
                <textarea
                  name="key_inquiry_questions"
                  value={lessonPlan.key_inquiry_questions}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Core Competencies
                </label>
                <textarea
                  name="core_competences"
                  value={lessonPlan.core_competences}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Value to be developed
                </label>
                <textarea
                  name="values_to_be_developed"
                  value={lessonPlan.values_to_be_developed}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  PCIs to be addressed
                </label>
                <textarea
                  name="pcis_to_be_addressed"
                  value={lessonPlan.pcis_to_be_addressed}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Learning Resources
                </label>
                <textarea
                  name="learning_resources"
                  value={lessonPlan.learning_resources}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Organization of Learning */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Organization of learning
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={applyTemplate}
                      className="text-sm bg-gray-600 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 flex items-center gap-1 transition-colors"
                      title="Apply a standard structure template"
                    >
                      <span>📝</span> Template
                    </button>
                    <button
                      type="button"
                      onClick={autoGeneratePlan}
                      disabled={generatingAuto}
                      className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1 transition-colors disabled:opacity-50"
                      title="Auto-generate from curriculum (Free)"
                    >
                      {generatingAuto ? (
                        <span className="animate-spin">⌛</span>
                      ) : (
                        <span>⚡</span>
                      )}
                      {generatingAuto ? "Generating..." : "Auto-Generate"}
                    </button>
                    <button
                      type="button"
                      onClick={enhancePlan}
                      disabled={enhancingAI}
                      className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 flex items-center gap-1 transition-colors disabled:opacity-50"
                      title="Generate detailed content using AI"
                    >
                      {enhancingAI ? (
                        <span className="animate-spin">⌛</span>
                      ) : (
                        <span>✨</span>
                      )}
                      {enhancingAI ? "Enhancing..." : "AI Enhance"}
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      1. Introduction
                    </label>
                    <textarea
                      name="introduction"
                      value={lessonPlan.introduction}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      2. Development
                    </label>
                    <textarea
                      name="development"
                      value={lessonPlan.development}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      3. Conclusion
                    </label>
                    <textarea
                      name="conclusion"
                      value={lessonPlan.conclusion}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      4. Summary
                    </label>
                    <textarea
                      name="summary"
                      value={lessonPlan.summary}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Reflection Section */}
              <div className="border-t pt-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Reflection on the lesson/self-evaluation
                  </label>
                  <textarea
                    name="reflection_self_evaluation"
                    value={lessonPlan.reflection_self_evaluation}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Reflect on what went well, challenges faced, and areas for improvement..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/professional-records/lesson-plans/${planId.replace(
                    /-$/,
                    ""
                  )}`
                )
              }
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300 disabled:opacity-50"
            >
              <FiSave className="w-5 h-5" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
