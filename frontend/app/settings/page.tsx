"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiCalendar,
  FiClock,
  FiSave,
  FiPlus,
  FiEdit2,
  FiCheck,
} from "react-icons/fi";

interface Term {
  id: number;
  term_number: number;
  term_name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  teaching_weeks: number;
  is_current: boolean;
}

interface UserSettings {
  default_lesson_duration: number;
  default_double_lesson_duration: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [terms, setTerms] = useState<Term[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    default_lesson_duration: 40,
    default_double_lesson_duration: 80,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Please login to access settings");
      router.push("/login");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const [termsResponse] = await Promise.all([
        axios.get(`/api/v1/terms`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setTerms(termsResponse.data.terms);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const updateUserSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(`/api/v1/user/settings`, userSettings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Settings updated successfully");
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const updateTerm = async (termId: number, updates: Partial<Term>) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(`/api/v1/terms/${termId}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Term updated successfully");
      fetchData();
    } catch (error) {
      console.error("Failed to update term:", error);
      toast.error("Failed to update term");
    }
  };

  const setCurrentTerm = async (termId: number) => {
    await updateTerm(termId, { is_current: true });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Schedule Settings
          </h1>
          <p className="text-gray-600">
            Configure your academic terms and default lesson durations
          </p>
        </div>

        {/* Default Lesson Durations */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-6">
            <FiClock className="w-6 h-6 text-indigo-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Default Lesson Durations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Single Lesson Duration (minutes)
              </label>
              <input
                type="number"
                value={userSettings.default_lesson_duration}
                onChange={(e) =>
                  setUserSettings({
                    ...userSettings,
                    default_lesson_duration: parseInt(e.target.value) || 40,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="20"
                max="90"
                step="5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Typical values: 30, 35, 40 minutes
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Double Lesson Duration (minutes)
              </label>
              <input
                type="number"
                value={userSettings.default_double_lesson_duration}
                onChange={(e) =>
                  setUserSettings({
                    ...userSettings,
                    default_double_lesson_duration:
                      parseInt(e.target.value) || 80,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="40"
                max="120"
                step="5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Typical values: 60, 70, 80 minutes
              </p>
            </div>
          </div>

          <button
            onClick={updateUserSettings}
            disabled={saving}
            className="mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center"
          >
            <FiSave className="mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        {/* Academic Terms */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FiCalendar className="w-6 h-6 text-indigo-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                Academic Terms
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            {terms.map((term) => (
              <div
                key={term.id}
                className={`border rounded-lg p-4 transition-all ${
                  term.is_current
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {term.term_name}
                      </h3>
                      {term.is_current && (
                        <span className="ml-3 px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full inline-flex items-center">
                          <FiCheck className="mr-1" />
                          Current Term
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Academic Year: {term.academic_year}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          Start Date:
                        </span>
                        <p className="text-gray-600">
                          {formatDate(term.start_date)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          End Date:
                        </span>
                        <p className="text-gray-600">
                          {formatDate(term.end_date)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Teaching Weeks:
                        </span>
                        <p className="text-gray-600">{term.teaching_weeks}</p>
                      </div>
                    </div>
                  </div>

                  {!term.is_current && (
                    <button
                      onClick={() => setCurrentTerm(term.id)}
                      className="ml-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium inline-flex items-center"
                    >
                      <FiCheck className="mr-1" />
                      Set as Current
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {terms.length === 0 && (
            <div className="text-center py-8">
              <FiCalendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-600">No terms configured yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Academic terms will be automatically created
              </p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            📋 About Academic Terms
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • <strong>Term 1</strong> is typically the longest term (14 weeks)
            </li>
            <li>
              • <strong>Term 2</strong> is medium length (12 weeks)
            </li>
            <li>
              • <strong>Term 3</strong> is the shortest term (10 weeks)
            </li>
            <li>• Set the current term to track your progress accurately</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
