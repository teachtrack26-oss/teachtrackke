"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiSave,
  FiUpload,
  FiImage,
  FiCalendar,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import Image from "next/image";

interface SchoolSettings {
  id?: number;
  school_name: string;
  school_email: string;
  school_phone: string;
  school_address: string;
  school_type: string;
  school_motto: string;
  school_logo_url?: string;
  principal_name: string;
  deputy_principal_name: string;
  county: string;
  sub_county: string;
  established_year: number;
  grades_offered: string[];
  streams_per_grade: { [key: string]: string[] };
}

interface Term {
  id?: number;
  term_number: 1 | 2 | 3;
  year: number;
  start_date: string;
  end_date: string;
  mid_term_break_start?: string;
  mid_term_break_end?: string;
}

interface CalendarActivity {
  id?: number;
  term_id: number;
  activity_name: string;
  activity_date: string;
  activity_type: string;
  description?: string;
}

export default function SchoolSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "basic" | "terms" | "calendar"
  >("basic");

  // School Settings State
  const [settings, setSettings] = useState<SchoolSettings>({
    school_name: "",
    school_email: "",
    school_phone: "",
    school_address: "",
    school_type: "Public",
    school_motto: "",
    principal_name: "",
    deputy_principal_name: "",
    county: "",
    sub_county: "",
    established_year: new Date().getFullYear(),
    grades_offered: [],
    streams_per_grade: {},
  });

  // Terms State
  const [terms, setTerms] = useState<Term[]>([]);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [showTermModal, setShowTermModal] = useState(false);

  // Calendar Activities State
  const [activities, setActivities] = useState<CalendarActivity[]>([]);
  const [editingActivity, setEditingActivity] =
    useState<CalendarActivity | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);

  // Logo Upload State
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const schoolTypes = [
    "Public",
    "Private",
    "Government",
    "Faith-Based",
    "County",
  ];
  const gradeOptions = [
    "PP1",
    "PP2",
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12",
  ];
  const activityTypes = [
    "Opening Day",
    "Closing Day",
    "Mid-Term Break",
    "Exam Week",
    "Sports Day",
    "Parents Day",
    "KCPE/KCSE",
    "Holiday",
    "Staff Meeting",
    "Other",
  ];

  useEffect(() => {
    fetchSchoolSettings();
    fetchTerms();
    fetchCalendarActivities();
  }, []);

  const fetchSchoolSettings = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get("/api/v1/admin/school-settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data) {
        setSettings(response.data);
        if (response.data.school_logo_url) {
          setLogoPreview(response.data.school_logo_url);
        }
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error("Failed to fetch school settings:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTerms = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get("/api/v1/admin/school-terms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTerms(response.data || []);
    } catch (error) {
      console.error("Failed to fetch terms:", error);
    }
  };

  const fetchCalendarActivities = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get("/api/v1/admin/calendar-activities", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivities(response.data || []);
    } catch (error) {
      console.error("Failed to fetch calendar activities:", error);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo file size must be less than 2MB");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("accessToken");

      // Upload logo if changed
      let logoUrl = settings.school_logo_url;
      if (logoFile) {
        const formData = new FormData();
        formData.append("logo", logoFile);
        const uploadRes = await axios.post(
          "/api/v1/admin/upload-logo",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        logoUrl = uploadRes.data.url;
      }

      // Save settings
      const payload = { ...settings, school_logo_url: logoUrl };
      if (settings.id) {
        await axios.put(
          `/api/v1/admin/school-settings/${settings.id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        await axios.post("/api/v1/admin/school-settings", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      toast.success("School settings saved successfully!");
      fetchSchoolSettings();
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleGradeToggle = (grade: string) => {
    const newGrades = settings.grades_offered.includes(grade)
      ? settings.grades_offered.filter((g) => g !== grade)
      : [...settings.grades_offered, grade];
    setSettings({ ...settings, grades_offered: newGrades });
  };

  const handleAddStream = (grade: string) => {
    const streamName = prompt(
      `Enter stream name for ${grade} (e.g., A, East, Red):`
    );
    if (streamName) {
      setSettings({
        ...settings,
        streams_per_grade: {
          ...settings.streams_per_grade,
          [grade]: [...(settings.streams_per_grade[grade] || []), streamName],
        },
      });
    }
  };

  const handleRemoveStream = (grade: string, stream: string) => {
    setSettings({
      ...settings,
      streams_per_grade: {
        ...settings.streams_per_grade,
        [grade]: (settings.streams_per_grade[grade] || []).filter(
          (s) => s !== stream
        ),
      },
    });
  };

  const handleSaveTerm = async () => {
    if (!editingTerm) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (editingTerm.id) {
        await axios.put(
          `/api/v1/admin/school-terms/${editingTerm.id}`,
          editingTerm,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        await axios.post("/api/v1/admin/school-terms", editingTerm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      toast.success("Term saved successfully!");
      fetchTerms();
      setShowTermModal(false);
      setEditingTerm(null);
    } catch (error) {
      console.error("Failed to save term:", error);
      toast.error("Failed to save term");
    }
  };

  const handleDeleteTerm = async (id: number) => {
    if (!confirm("Delete this term?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`/api/v1/admin/school-terms/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Term deleted");
      fetchTerms();
    } catch (error) {
      console.error("Failed to delete term:", error);
      toast.error("Failed to delete term");
    }
  };

  const handleSaveActivity = async () => {
    if (!editingActivity) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (editingActivity.id) {
        await axios.put(
          `/api/v1/admin/calendar-activities/${editingActivity.id}`,
          editingActivity,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        await axios.post("/api/v1/admin/calendar-activities", editingActivity, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      toast.success("Activity saved successfully!");
      fetchCalendarActivities();
      setShowActivityModal(false);
      setEditingActivity(null);
    } catch (error) {
      console.error("Failed to save activity:", error);
      toast.error("Failed to save activity");
    }
  };

  const handleDeleteActivity = async (id: number) => {
    if (!confirm("Delete this activity?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`/api/v1/admin/calendar-activities/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Activity deleted");
      fetchCalendarActivities();
    } catch (error) {
      console.error("Failed to delete activity:", error);
      toast.error("Failed to delete activity");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">
            Loading school settings...
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="text-indigo-600 hover:text-indigo-800 font-medium mb-4 flex items-center gap-2"
          >
            ← Back to Admin Dashboard
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
            School Settings
          </h1>
          <p className="text-gray-700 mt-2 text-lg">
            Configure your school's information and calendar
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="glass-card bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 mb-6 p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveSection("basic")}
              className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                activeSection === "basic"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "text-gray-700 hover:bg-white/60"
              }`}
            >
              Basic Information
            </button>
            <button
              onClick={() => setActiveSection("terms")}
              className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                activeSection === "terms"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "text-gray-700 hover:bg-white/60"
              }`}
            >
              School Terms
            </button>
            <button
              onClick={() => setActiveSection("calendar")}
              className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                activeSection === "calendar"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "text-gray-700 hover:bg-white/60"
              }`}
            >
              Calendar of Activities
            </button>
          </div>
        </div>

        {/* Basic Information Section */}
        {activeSection === "basic" && (
          <div className="glass-card bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveSettings();
              }}
            >
              {/* Logo Upload */}
              <div className="mb-8 text-center">
                <label className="block text-sm font-bold text-gray-900 mb-4">
                  School Logo
                </label>
                <div className="flex flex-col items-center">
                  {logoPreview ? (
                    <div className="relative w-32 h-32 mb-4">
                      <Image
                        src={logoPreview}
                        alt="School Logo"
                        fill
                        className="rounded-full object-cover border-4 border-indigo-200"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-4 border-4 border-indigo-200">
                      <FiImage className="w-12 h-12 text-indigo-400" />
                    </div>
                  )}
                  <label className="cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2">
                    <FiUpload />
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-600 mt-2">
                    Max 2MB • PNG, JPG, or SVG
                  </p>
                </div>
              </div>

              {/* School Details Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    School Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={settings.school_name}
                    onChange={(e) =>
                      setSettings({ ...settings, school_name: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    School Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={settings.school_type}
                    onChange={(e) =>
                      setSettings({ ...settings, school_type: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    required
                  >
                    {schoolTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    School Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={settings.school_email}
                    onChange={(e) =>
                      setSettings({ ...settings, school_email: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    School Phone
                  </label>
                  <input
                    type="tel"
                    value={settings.school_phone}
                    onChange={(e) =>
                      setSettings({ ...settings, school_phone: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    School Address
                  </label>
                  <textarea
                    value={settings.school_address}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        school_address: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    County
                  </label>
                  <input
                    type="text"
                    value={settings.county}
                    onChange={(e) =>
                      setSettings({ ...settings, county: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Sub-County
                  </label>
                  <input
                    type="text"
                    value={settings.sub_county}
                    onChange={(e) =>
                      setSettings({ ...settings, sub_county: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Principal Name
                  </label>
                  <input
                    type="text"
                    value={settings.principal_name}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        principal_name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Deputy Principal
                  </label>
                  <input
                    type="text"
                    value={settings.deputy_principal_name}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        deputy_principal_name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    School Motto
                  </label>
                  <input
                    type="text"
                    value={settings.school_motto}
                    onChange={(e) =>
                      setSettings({ ...settings, school_motto: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    placeholder="e.g., Excellence in Education"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Established Year
                  </label>
                  <input
                    type="number"
                    value={settings.established_year}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        established_year: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>

              {/* Grades Offered */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Grades/Classes Offered <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {gradeOptions.map((grade) => (
                    <label
                      key={grade}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={settings.grades_offered.includes(grade)}
                        onChange={() => handleGradeToggle(grade)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-800">
                        {grade}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Streams per Grade */}
              {settings.grades_offered.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    Streams per Grade
                  </label>
                  <div className="space-y-4">
                    {settings.grades_offered.map((grade) => (
                      <div
                        key={grade}
                        className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border-2 border-indigo-200"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-gray-900">{grade}</h4>
                          <button
                            type="button"
                            onClick={() => handleAddStream(grade)}
                            className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 flex items-center gap-1"
                          >
                            <FiPlus className="w-4 h-4" /> Add Stream
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(settings.streams_per_grade[grade] || []).map(
                            (stream) => (
                              <span
                                key={stream}
                                className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-lg text-sm font-medium text-gray-800 border border-indigo-200"
                              >
                                {grade} {stream}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveStream(grade, stream)
                                  }
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <FiTrash2 className="w-3 h-3" />
                                </button>
                              </span>
                            )
                          )}
                          {(settings.streams_per_grade[grade] || []).length ===
                            0 && (
                            <span className="text-sm text-gray-500 italic">
                              No streams added yet
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSave className="w-5 h-5" />
                  {saving ? "Saving..." : "Save School Settings"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* School Terms Section */}
        {activeSection === "terms" && (
          <div className="glass-card bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                School Terms Configuration
              </h2>
              <button
                onClick={() => {
                  setEditingTerm({
                    term_number: 1,
                    year: new Date().getFullYear(),
                    start_date: "",
                    end_date: "",
                  });
                  setShowTermModal(true);
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <FiPlus /> Add Term
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((termNum) => {
                const term = terms.find((t) => t.term_number === termNum);
                return (
                  <div
                    key={termNum}
                    className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-indigo-200"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Term {termNum}
                    </h3>
                    {term ? (
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-600">Year:</span>
                          <p className="font-semibold text-gray-900">
                            {term.year}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">
                            Start Date:
                          </span>
                          <p className="font-semibold text-gray-900">
                            {new Date(term.start_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">
                            End Date:
                          </span>
                          <p className="font-semibold text-gray-900">
                            {new Date(term.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        {term.mid_term_break_start && (
                          <div>
                            <span className="text-sm text-gray-600">
                              Mid-Term Break:
                            </span>
                            <p className="font-semibold text-gray-900">
                              {new Date(
                                term.mid_term_break_start
                              ).toLocaleDateString()}{" "}
                              -{" "}
                              {new Date(
                                term.mid_term_break_end!
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        <div className="flex gap-2 pt-3">
                          <button
                            onClick={() => {
                              setEditingTerm(term);
                              setShowTermModal(true);
                            }}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                          >
                            <FiEdit2 className="w-4 h-4" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTerm(term.id!)}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                          >
                            <FiTrash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">
                          Term {termNum} not configured
                        </p>
                        <button
                          onClick={() => {
                            setEditingTerm({
                              term_number: termNum as any,
                              year: new Date().getFullYear(),
                              start_date: "",
                              end_date: "",
                            });
                            setShowTermModal(true);
                          }}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                        >
                          Configure Term
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Calendar Activities Section */}
        {activeSection === "calendar" && (
          <div className="glass-card bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Calendar of Activities
              </h2>
              <button
                onClick={() => {
                  setEditingActivity({
                    term_id: terms[0]?.id || 0,
                    activity_name: "",
                    activity_date: "",
                    activity_type: "Other",
                  });
                  setShowActivityModal(true);
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <FiPlus /> Add Activity
              </button>
            </div>

            <div className="space-y-4">
              {terms.map((term) => (
                <div
                  key={term.id}
                  className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-indigo-200"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Term {term.term_number} - {term.year}
                  </h3>
                  <div className="space-y-3">
                    {activities
                      .filter((a) => a.term_id === term.id)
                      .sort(
                        (a, b) =>
                          new Date(a.activity_date).getTime() -
                          new Date(b.activity_date).getTime()
                      )
                      .map((activity) => (
                        <div
                          key={activity.id}
                          className="bg-white p-4 rounded-lg border border-indigo-200 flex justify-between items-center"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <FiCalendar className="w-5 h-5 text-indigo-600" />
                              <div>
                                <h4 className="font-bold text-gray-900">
                                  {activity.activity_name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {new Date(
                                    activity.activity_date
                                  ).toLocaleDateString()}{" "}
                                  • {activity.activity_type}
                                </p>
                                {activity.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {activity.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingActivity(activity);
                                setShowActivityModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 p-2"
                            >
                              <FiEdit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteActivity(activity.id!)}
                              className="text-red-600 hover:text-red-800 p-2"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    {activities.filter((a) => a.term_id === term.id).length ===
                      0 && (
                      <p className="text-gray-500 italic text-center py-4">
                        No activities scheduled for this term
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Term Modal */}
      {showTermModal && editingTerm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-modal bg-white/95 backdrop-blur-2xl rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editingTerm.id ? "Edit" : "Add"} Term {editingTerm.term_number}
            </h3>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Term Number
                  </label>
                  <select
                    value={editingTerm.term_number}
                    onChange={(e) =>
                      setEditingTerm({
                        ...editingTerm,
                        term_number: parseInt(e.target.value) as any,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500"
                  >
                    <option value="1">Term 1</option>
                    <option value="2">Term 2</option>
                    <option value="3">Term 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Year
                  </label>
                  <input
                    type="number"
                    value={editingTerm.year}
                    onChange={(e) =>
                      setEditingTerm({
                        ...editingTerm,
                        year: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editingTerm.start_date}
                    onChange={(e) =>
                      setEditingTerm({
                        ...editingTerm,
                        start_date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editingTerm.end_date}
                    onChange={(e) =>
                      setEditingTerm({
                        ...editingTerm,
                        end_date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Mid-Term Break Start (Optional)
                  </label>
                  <input
                    type="date"
                    value={editingTerm.mid_term_break_start || ""}
                    onChange={(e) =>
                      setEditingTerm({
                        ...editingTerm,
                        mid_term_break_start: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Mid-Term Break End (Optional)
                  </label>
                  <input
                    type="date"
                    value={editingTerm.mid_term_break_end || ""}
                    onChange={(e) =>
                      setEditingTerm({
                        ...editingTerm,
                        mid_term_break_end: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowTermModal(false);
                    setEditingTerm(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTerm}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl"
                >
                  Save Term
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      {showActivityModal && editingActivity && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-modal bg-white/95 backdrop-blur-2xl rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editingActivity.id ? "Edit" : "Add"} Calendar Activity
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Term
                </label>
                <select
                  value={editingActivity.term_id}
                  onChange={(e) =>
                    setEditingActivity({
                      ...editingActivity,
                      term_id: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500"
                >
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      Term {term.term_number} - {term.year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Activity Name
                </label>
                <input
                  type="text"
                  value={editingActivity.activity_name}
                  onChange={(e) =>
                    setEditingActivity({
                      ...editingActivity,
                      activity_name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500"
                  placeholder="e.g., Term 1 Opening Day"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Activity Type
                  </label>
                  <select
                    value={editingActivity.activity_type}
                    onChange={(e) =>
                      setEditingActivity({
                        ...editingActivity,
                        activity_type: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500"
                  >
                    {activityTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editingActivity.activity_date}
                    onChange={(e) =>
                      setEditingActivity({
                        ...editingActivity,
                        activity_date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={editingActivity.description || ""}
                  onChange={(e) =>
                    setEditingActivity({
                      ...editingActivity,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500"
                  placeholder="Additional details about this activity..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowActivityModal(false);
                    setEditingActivity(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveActivity}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl"
                >
                  Save Activity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
