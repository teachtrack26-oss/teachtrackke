"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import axios from "axios";
import toast from "react-hot-toast";
import { FiClock, FiSave, FiArrowLeft, FiCalendar } from "react-icons/fi";

interface SubjectScheduling {
  lessons_per_week: number;
  single_lesson_duration: number;
  double_lesson_duration: number;
  double_lessons_per_week: number;
}

interface Subject {
  id: number;
  subject_name: string;
  grade: string;
}

export default function SubjectSchedulingPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useCustomAuth();
  const subjectId = params.id as string;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [scheduling, setScheduling] = useState<SubjectScheduling>({
    lessons_per_week: 5,
    single_lesson_duration: 40,
    double_lesson_duration: 80,
    double_lessons_per_week: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      toast.error("Please login to continue");
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchData();
    }
  }, [subjectId, router, authLoading, isAuthenticated]);

  const fetchData = async () => {
    try {
      const [subjectResponse, schedulingResponse] = await Promise.all([
        axios.get(`/api/v1/subjects/${subjectId}`, {
          withCredentials: true,
        }),
        axios.get(`/api/v1/subjects/${subjectId}/scheduling`, {
          withCredentials: true,
        }),
      ]);

      setSubject(subjectResponse.data);
      setScheduling(schedulingResponse.data.scheduling);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load subject scheduling");
    } finally {
      setLoading(false);
    }
  };

  const saveScheduling = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/v1/subjects/${subjectId}/scheduling`, scheduling, {
        withCredentials: true,
      });
      toast.success("Scheduling updated successfully");
      router.push(`/curriculum/${subjectId}`);
    } catch (error) {
      console.error("Failed to update scheduling:", error);
      toast.error("Failed to update scheduling");
    } finally {
      setSaving(false);
    }
  };

  const calculateTotalMinutesPerWeek = () => {
    const singleLessons =
      scheduling.lessons_per_week - scheduling.double_lessons_per_week;
    const singleMinutes = singleLessons * scheduling.single_lesson_duration;
    const doubleMinutes =
      scheduling.double_lessons_per_week * scheduling.double_lesson_duration;
    return singleMinutes + doubleMinutes;
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Subject not found
          </h2>
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
    <div className="min-h-screen bg-gray-50 pt-6 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <button
          onClick={() => router.push(`/curriculum/${subjectId}`)}
          className="text-indigo-600 hover:text-indigo-700 mb-4 inline-flex items-center"
        >
          <FiArrowLeft className="mr-2" />
          Back to Curriculum
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lesson Scheduling
          </h1>
          <p className="text-gray-600">
            {subject.subject_name} - Grade {subject.grade}
          </p>
        </div>

        {/* Scheduling Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <FiClock className="w-6 h-6 text-indigo-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Weekly Schedule Configuration
            </h2>
          </div>

          <div className="space-y-6">
            {/* Lessons per Week */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Lessons per Week
              </label>
              <input
                type="number"
                value={scheduling.lessons_per_week}
                onChange={(e) =>
                  setScheduling({
                    ...scheduling,
                    lessons_per_week: parseInt(e.target.value) || 5,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="1"
                max="15"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended: 5 lessons per week. Some schools have 7-8 lessons.
              </p>
            </div>

            {/* Single Lesson Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Single Lesson Duration (minutes)
              </label>
              <input
                type="number"
                value={scheduling.single_lesson_duration}
                onChange={(e) =>
                  setScheduling({
                    ...scheduling,
                    single_lesson_duration: parseInt(e.target.value) || 40,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="20"
                max="90"
                step="5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Common durations: 30, 35, or 40 minutes
              </p>
            </div>

            {/* Double Lesson Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Double Lesson Duration (minutes)
              </label>
              <input
                type="number"
                value={scheduling.double_lesson_duration}
                onChange={(e) =>
                  setScheduling({
                    ...scheduling,
                    double_lesson_duration: parseInt(e.target.value) || 80,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="40"
                max="120"
                step="5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Common durations: 60, 70, or 80 minutes
              </p>
            </div>

            {/* Double Lessons per Week */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Double Lessons per Week
              </label>
              <input
                type="number"
                value={scheduling.double_lessons_per_week}
                onChange={(e) =>
                  setScheduling({
                    ...scheduling,
                    double_lessons_per_week: Math.min(
                      parseInt(e.target.value) || 0,
                      scheduling.lessons_per_week
                    ),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="0"
                max={scheduling.lessons_per_week}
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of double lessons out of your total weekly lessons (0-2
                typically)
              </p>
            </div>

            {/* Summary Card */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-indigo-900 mb-3">
                📊 Weekly Summary
              </h3>
              <div className="space-y-2 text-sm text-indigo-800">
                <div className="flex justify-between">
                  <span>Single lessons per week:</span>
                  <span className="font-semibold">
                    {scheduling.lessons_per_week -
                      scheduling.double_lessons_per_week}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Double lessons per week:</span>
                  <span className="font-semibold">
                    {scheduling.double_lessons_per_week}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-indigo-300">
                  <span className="font-semibold">
                    Total teaching time per week:
                  </span>
                  <span className="font-bold">
                    {calculateTotalMinutesPerWeek()} minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Time in hours:</span>
                  <span className="font-bold">
                    {(calculateTotalMinutesPerWeek() / 60).toFixed(1)} hours
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                onClick={saveScheduling}
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
              >
                <FiSave className="mr-2" />
                {saving ? "Saving..." : "Save Scheduling"}
              </button>
              <button
                onClick={() => router.push(`/curriculum/${subjectId}`)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            💡 How to Configure
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Mathematics typically has 5 lessons/week, but can vary (7-8 in
              some schools)
            </li>
            <li>
              • A single lesson is usually 30, 35, or 40 minutes depending on
              your school
            </li>
            <li>
              • Double lessons are 60, 70, or 80 minutes (for practical work or
              extended activities)
            </li>
            <li>• You can have 0, 1, or 2 double lessons per week typically</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
