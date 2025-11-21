"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiSave, FiFileText } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  slot_type: string;
  label: string;
}

interface LessonPlanData {
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

export default function CreateLessonPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [lessonPlan, setLessonPlan] = useState<LessonPlanData>({
    subject_id: 0,
    learning_area: "",
    grade: "",
    date: "",
    time: "",
    roll: "",
    strand_theme_topic: "",
    sub_strand_sub_theme_sub_topic: "",
    specific_learning_outcomes:
      "By the end of the lesson, the learner should be able to:\na. \nb. \nc. ",
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

  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        // Fetch time slots for Junior Secondary (or make this dynamic based on grade)
        // For now, we'll fetch the active schedule's slots
        const response = await axios.get("/api/v1/timetable/time-slots", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Filter for lesson slots only
        const lessonSlots = response.data.filter((slot: TimeSlot) => slot.slot_type === "lesson");
        setTimeSlots(lessonSlots);
      } catch (error) {
        console.error("Failed to fetch time slots:", error);
        // Don't show error toast as this is an enhancement, not a blocker
      }
    };

    fetchTimeSlots();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setLessonPlan((prev) => ({ ...prev, [name]: value }));
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

    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        "/api/v1/lesson-plans",
        {
          ...lessonPlan,
          subject_id: 1, // You might want to make this selectable
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Lesson plan created successfully!");
      router.push("/professional-records");
    } catch (error) {
      console.error("Failed to create lesson plan:", error);
      toast.error("Failed to create lesson plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/professional-records")}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4 font-medium"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Professional Records
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl">
              <FiFileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Create Lesson Plan
              </h1>
              <p className="text-gray-700 mt-1">
                Design your lesson following the CBC framework
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
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    LEARNING AREA *
                  </label>
                  <input
                    type="text"
                    name="learning_area"
                    value={lessonPlan.learning_area}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    DATE
                  </label>
                  <input
                    type="text"
                    name="date"
                    value={lessonPlan.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Select Time</option>
                      {timeSlots.map((slot) => (
                        <option key={slot.id} value={`${slot.start_time} - ${slot.end_time}`}>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="e.g. 08:00 - 08:40"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    ROLL
                  </label>
                  <input
                    type="text"
                    name="roll"
                    value={lessonPlan.roll}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Learner's Specific Learning Outcomes: By the end of the
                  lesson, the learner should be able to:
                </label>
                <textarea
                  name="specific_learning_outcomes"
                  value={lessonPlan.specific_learning_outcomes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Organization of Learning */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Organization of learning
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Lesson's steps:
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      1. Introduction
                    </label>
                    <textarea
                      name="introduction"
                      value={lessonPlan.introduction}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
              onClick={() => router.push("/professional-records")}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300 disabled:opacity-50"
            >
              <FiSave className="w-5 h-5" />
              {loading ? "Creating..." : "Create Lesson Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
