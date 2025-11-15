"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { FiClock, FiSave, FiArrowLeft } from "react-icons/fi";

interface ScheduleConfig {
  schedule_name: string;
  school_start_time: string;
  single_lesson_duration: number;
  double_lesson_duration: number;
  lessons_before_first_break: number;
  first_break_duration: number;
  lessons_before_second_break: number;
  second_break_duration: number;
  lessons_before_lunch: number;
  lunch_break_duration: number;
  lessons_after_lunch: number;
  school_end_time: string;
}

const TimetableSetupPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hasActiveSchedule, setHasActiveSchedule] = useState(false);

  const [config, setConfig] = useState<ScheduleConfig>({
    schedule_name: "My School Schedule",
    school_start_time: "08:00",
    single_lesson_duration: 40,
    double_lesson_duration: 80,
    lessons_before_first_break: 2,
    first_break_duration: 15,
    lessons_before_second_break: 2,
    second_break_duration: 30,
    lessons_before_lunch: 2,
    lunch_break_duration: 60,
    lessons_after_lunch: 2,
    school_end_time: "16:00",
  });

  // Helper to safely convert to number
  const toNumber = (value: string | number): number => {
    const num = typeof value === "string" ? parseInt(value, 10) : value;
    return isNaN(num) ? 0 : num;
  };

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Please login first");
      router.push("/login");
      return;
    }
    checkActiveSchedule();
  }, []);

  const checkActiveSchedule = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Please login first");
        router.push("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:8000/api/v1/timetable/schedules/active",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        toast.error("Session expired. Please login again");
        router.push("/login");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setHasActiveSchedule(true);
      }
    } catch (error) {
      // No active schedule yet
      setHasActiveSchedule(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        toast.error("Please login first");
        router.push("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:8000/api/v1/timetable/schedules",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(config),
        }
      );

      if (response.status === 401) {
        toast.error("Session expired. Please login again");
        router.push("/login");
        return;
      }

      if (response.ok) {
        toast.success("Schedule created successfully! Time slots generated.");
        router.push("/timetable");
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to create schedule");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to create schedule");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEndTime = () => {
    const startHour = parseInt(config.school_start_time.split(":")[0]);
    const totalMinutes =
      config.single_lesson_duration *
        (config.lessons_before_first_break +
          config.lessons_before_second_break +
          config.lessons_before_lunch +
          config.lessons_after_lunch) +
      config.first_break_duration +
      config.second_break_duration +
      config.lunch_break_duration;

    const endHour = startHour + Math.floor(totalMinutes / 60);
    const endMinute = totalMinutes % 60;

    return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(
      2,
      "0"
    )}`;
  };

  const totalLessons =
    config.lessons_before_first_break +
    config.lessons_before_second_break +
    config.lessons_before_lunch +
    config.lessons_after_lunch;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push("/timetable")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Back to Timetable
        </button>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {hasActiveSchedule
                ? "Update School Schedule"
                : "Setup School Schedule"}
            </h1>
            <p className="text-gray-600">
              Configure your school timing structure. Time slots will be
              automatically generated.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Schedule Name */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Schedule Information
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Name
                </label>
                <input
                  type="text"
                  value={config.schedule_name}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      schedule_name: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., Grade 5 2025 Schedule"
                  required
                />
              </div>
            </div>

            {/* Basic Timing */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Basic Timing
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Start Time
                  </label>
                  <input
                    type="time"
                    value={config.school_start_time}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        school_start_time: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Single Lesson Duration (min)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="60"
                    step="5"
                    value={config.single_lesson_duration || 40}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        single_lesson_duration: toNumber(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Double Lesson Duration (min)
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="120"
                    step="5"
                    value={config.double_lesson_duration || 80}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        double_lesson_duration: toNumber(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Session 1 */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Session 1 (Morning)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lessons Before First Break
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={config.lessons_before_first_break || 0}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        lessons_before_first_break: toNumber(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Break Duration (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="5"
                    value={config.first_break_duration || 0}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        first_break_duration: toNumber(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Session 2 */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Session 2 (Mid-Morning)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lessons Before Second Break
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={config.lessons_before_second_break || 0}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        lessons_before_second_break: toNumber(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Second Break Duration (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    step="5"
                    value={config.second_break_duration || 0}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        second_break_duration: toNumber(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Session 3 */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Session 3 (Before Lunch)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lessons Before Lunch
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={config.lessons_after_lunch || 0}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        lessons_after_lunch: toNumber(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lunch Break Duration (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    step="5"
                    value={config.lunch_break_duration || 0}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        lunch_break_duration: toNumber(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Session 4 */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Session 4 (Afternoon)
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lessons After Lunch
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={config.lessons_after_lunch}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      lessons_after_lunch: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-indigo-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                Schedule Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Lessons</p>
                  <p className="text-xl font-bold text-indigo-600">
                    {totalLessons}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Start Time</p>
                  <p className="text-xl font-bold text-indigo-600">
                    {config.school_start_time}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Estimated End</p>
                  <p className="text-xl font-bold text-indigo-600">
                    {calculateEndTime()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Break Time</p>
                  <p className="text-xl font-bold text-indigo-600">
                    {config.first_break_duration +
                      config.second_break_duration +
                      config.lunch_break_duration}{" "}
                    min
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push("/timetable")}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FiSave className="w-4 h-4 mr-2" />
                    Create Schedule
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TimetableSetupPage;
