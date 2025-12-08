"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  FiClock,
  FiX,
  FiBook,
} from "react-icons/fi";
import Image from "next/image";

// Interfaces
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
  grades_offered: string[];
  streams_per_grade: { [key: string]: { name: string; pupils: number }[] };
}

interface Term {
  id?: number;
  term_number: 1 | 2 | 3;
  term_name?: string;
  year: number;
  start_date: string;
  end_date: string;
  mid_term_break_start?: string;
  mid_term_break_end?: string;
}

interface CalendarActivity {
  id?: number;
  term_id?: number;
  activity_name: string;
  activity_date: string;
  activity_type: string;
  description?: string;
}

interface ScheduleConfig {
  id?: number;
  schedule_name: string;
  education_level: string;
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

// Constants
const KENYAN_COUNTIES = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo-Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita-Taveta",
  "Tana River",
  "Tharaka-Nithi",
  "Trans-Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot",
];

const SCHOOL_TYPES = [
  "Public",
  "Private",
  "Government",
  "Faith-Based",
  "County",
];

const GRADE_OPTIONS = [
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

const EDUCATION_LEVELS = [
  { id: "Pre-Primary", label: "Pre-Primary (PP1-PP2)" },
  { id: "Lower Primary", label: "Lower Primary (Grade 1-3)" },
  { id: "Upper Primary", label: "Upper Primary (Grade 4-6)" },
  { id: "Junior Secondary", label: "Junior Secondary (Grade 7-9)" },
  { id: "Senior Secondary", label: "Senior Secondary (Grade 10-12)" },
];

const ACTIVITY_TYPES = [
  "Academic",
  "Sports",
  "Cultural",
  "Holiday",
  "Meeting",
  "Examination",
  "Other",
];

export default function TeacherSettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "basic" | "terms" | "calendar" | "timetable"
  >("basic");
  const [isSchoolLinked, setIsSchoolLinked] = useState(false);

  // Get auth token
  const getAuthToken = (): string | null => {
    const sessionToken = (session as any)?.accessToken;
    if (sessionToken) return sessionToken;
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  };

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

  // Timetable State
  const [selectedLevel, setSelectedLevel] = useState("Junior Secondary");
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    schedule_name: "My Schedule",
    education_level: "Junior Secondary",
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

  // Logo State
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Fetch data on mount
  useEffect(() => {
    if (status === "loading") return;
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetchAllData();
  }, [session, status]);

  const fetchAllData = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Check if user is linked to school
      try {
        const contextRes = await axios.get(
          `${apiUrl}/api/v1/profile/school-context`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setIsSchoolLinked(contextRes.data.is_school_linked || false);
      } catch (err) {
        console.log("No school context");
      }

      // Fetch profile settings
      try {
        const profileRes = await axios.get(
          `${apiUrl}/api/v1/profile/settings`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = profileRes.data;
        setSettings({
          school_name: data.school_name || "",
          school_email: data.school_email || "",
          school_phone: data.school_phone || "",
          school_address: data.school_address || "",
          school_type: data.school_type || "Public",
          school_motto: data.school_motto || "",
          school_logo_url: data.school_logo_url,
          principal_name: data.principal_name || "",
          deputy_principal_name: data.deputy_principal_name || "",
          county: data.county || "",
          sub_county: data.sub_county || "",
          grades_offered: data.grades_offered || [],
          streams_per_grade: data.streams_per_grade || {},
        });
        if (data.school_logo_url) {
          setLogoPreview(data.school_logo_url);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          console.error("Failed to fetch profile:", err);
        }
      }

      // Fetch terms (use school-terms endpoint)
      try {
        const termsRes = await axios.get(`${apiUrl}/api/v1/school-terms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTerms(termsRes.data || []);
      } catch (err) {
        console.log("Terms not available");
      }

      // Fetch schedule config
      try {
        const scheduleRes = await axios.get(
          `${apiUrl}/api/v1/timetable/schedules/active?education_level=${encodeURIComponent(
            selectedLevel
          )}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (scheduleRes.data) {
          setScheduleConfig((prev) => ({
            ...prev,
            ...scheduleRes.data,
          }));
        }
      } catch (err) {
        console.log("Schedule config not available");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
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

  // Save basic settings
  const handleSaveBasicSettings = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Please log in to save settings");
      return;
    }

    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Upload logo if changed
      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        const logoRes = await axios.post(
          `${apiUrl}/api/v1/profile/upload-logo`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        settings.school_logo_url = logoRes.data.logo_url;
        setLogoFile(null);
      }

      // Save settings
      await axios.post(`${apiUrl}/api/v1/profile/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Settings saved successfully!");
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.response?.data?.detail || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Term management
  const handleSaveTerm = async () => {
    if (!editingTerm) return;
    const token = getAuthToken();
    if (!token) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const termData = {
        ...editingTerm,
        term_name: `Term ${editingTerm.term_number}`,
      };

      if (editingTerm.id) {
        await axios.put(
          `${apiUrl}/api/v1/school-terms/${editingTerm.id}`,
          termData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setTerms(terms.map((t) => (t.id === editingTerm.id ? editingTerm : t)));
      } else {
        const res = await axios.post(
          `${apiUrl}/api/v1/school-terms`,
          termData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setTerms([...terms, res.data]);
      }

      setShowTermModal(false);
      setEditingTerm(null);
      toast.success("Term saved successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to save term");
    }
  };

  const handleDeleteTerm = async (termId: number) => {
    const token = getAuthToken();
    if (!token) return;

    if (!confirm("Are you sure you want to delete this term?")) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await axios.delete(`${apiUrl}/api/v1/school-terms/${termId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTerms(terms.filter((t) => t.id !== termId));
      toast.success("Term deleted");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to delete term");
    }
  };

  // Schedule config
  const handleSaveSchedule = async () => {
    const token = getAuthToken();
    if (!token) return;

    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await axios.post(`${apiUrl}/api/v1/timetable/schedules`, scheduleConfig, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Schedule saved successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  // Toggle grade selection
  const toggleGrade = (grade: string) => {
    setSettings((prev) => {
      const isCurrentlySelected = prev.grades_offered.includes(grade);
      let newGrades: string[];
      let newStreams = { ...prev.streams_per_grade };

      if (isCurrentlySelected) {
        // Removing grade - also remove its streams
        newGrades = prev.grades_offered.filter((g) => g !== grade);
        delete newStreams[grade];
      } else {
        // Adding grade
        newGrades = [...prev.grades_offered, grade];
      }

      return {
        ...prev,
        grades_offered: newGrades,
        streams_per_grade: newStreams,
      };
    });
  };

  // Add stream to a grade
  const addStream = (grade: string) => {
    setSettings((prev) => {
      const currentStreams = prev.streams_per_grade[grade] || [];
      const streamNumber = currentStreams.length + 1;
      const streamLetter = String.fromCharCode(64 + streamNumber); // A, B, C, etc.
      const newStream = { name: `${grade} ${streamLetter}`, pupils: 30 };

      return {
        ...prev,
        streams_per_grade: {
          ...prev.streams_per_grade,
          [grade]: [...currentStreams, newStream],
        },
      };
    });
  };

  // Add single class (no stream letter)
  const addSingleClass = (grade: string) => {
    setSettings((prev) => {
      const currentStreams = prev.streams_per_grade[grade] || [];
      // Check if single class already exists
      if (currentStreams.some((s) => s.name === grade)) {
        toast.error("Single class already exists for this grade");
        return prev;
      }
      const newStream = { name: grade, pupils: 30 };

      return {
        ...prev,
        streams_per_grade: {
          ...prev.streams_per_grade,
          [grade]: [...currentStreams, newStream],
        },
      };
    });
  };

  // Remove stream from a grade
  const removeStream = (grade: string, streamIndex: number) => {
    setSettings((prev) => {
      const currentStreams = prev.streams_per_grade[grade] || [];
      const newStreams = currentStreams.filter((_, i) => i !== streamIndex);

      return {
        ...prev,
        streams_per_grade: {
          ...prev.streams_per_grade,
          [grade]: newStreams,
        },
      };
    });
  };

  // Update stream pupils count
  const updateStreamPupils = (
    grade: string,
    streamIndex: number,
    pupils: number
  ) => {
    setSettings((prev) => {
      const currentStreams = [...(prev.streams_per_grade[grade] || [])];
      if (currentStreams[streamIndex]) {
        currentStreams[streamIndex] = {
          ...currentStreams[streamIndex],
          pupils,
        };
      }

      return {
        ...prev,
        streams_per_grade: {
          ...prev.streams_per_grade,
          [grade]: currentStreams,
        },
      };
    });
  };

  // Update stream name
  const updateStreamName = (
    grade: string,
    streamIndex: number,
    name: string
  ) => {
    setSettings((prev) => {
      const currentStreams = [...(prev.streams_per_grade[grade] || [])];
      if (currentStreams[streamIndex]) {
        currentStreams[streamIndex] = { ...currentStreams[streamIndex], name };
      }

      return {
        ...prev,
        streams_per_grade: {
          ...prev.streams_per_grade,
          [grade]: currentStreams,
        },
      };
    });
  };

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Auth check
  const hasAuth = status === "authenticated" || getAuthToken();
  if (!hasAuth) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Authentication Required
          </h2>
          <p className="text-red-700">Please log in to access your settings.</p>
        </div>
      </div>
    );
  }

  // School-linked user message
  if (isSchoolLinked) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">
            School-Linked Account
          </h2>
          <p className="text-yellow-700">
            Your account is linked to a school. Settings are managed by your
            School Admin. Contact your administrator to update school
            information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure your school information and teaching preferences
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b overflow-x-auto">
            {[
              { id: "basic", label: "Basic Information", icon: FiImage },
              { id: "terms", label: "School Terms", icon: FiCalendar },
              { id: "timetable", label: "Timetable Config", icon: FiClock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeSection === tab.id
                    ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                    : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
            {/* Link to Lessons Config */}
            <a
              href="/settings/lessons-config"
              className="flex items-center gap-2 px-6 py-4 font-medium text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition-colors whitespace-nowrap border-l border-gray-200"
            >
              <FiBook className="w-5 h-5" />
              Lessons Per Week
            </a>
          </div>
        </div>

        {/* Basic Information Section */}
        {activeSection === "basic" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Basic Information
            </h2>

            {/* Logo Upload */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Logo
              </label>
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <FiImage className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <div>
                  <label className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2">
                    <FiUpload className="w-4 h-4" />
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School Name *
                </label>
                <input
                  type="text"
                  value={settings.school_name}
                  onChange={(e) =>
                    setSettings({ ...settings, school_name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter school name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School Type
                </label>
                <select
                  value={settings.school_type}
                  onChange={(e) =>
                    setSettings({ ...settings, school_type: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                >
                  {SCHOOL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  County
                </label>
                <select
                  value={settings.county}
                  onChange={(e) =>
                    setSettings({ ...settings, county: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select County</option>
                  {KENYAN_COUNTIES.map((county) => (
                    <option key={county} value={county}>
                      {county}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sub-County
                </label>
                <input
                  type="text"
                  value={settings.sub_county}
                  onChange={(e) =>
                    setSettings({ ...settings, sub_county: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter sub-county"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School Address
                </label>
                <textarea
                  value={settings.school_address}
                  onChange={(e) =>
                    setSettings({ ...settings, school_address: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  placeholder="P.O. Box, Town"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School Motto
                </label>
                <input
                  type="text"
                  value={settings.school_motto}
                  onChange={(e) =>
                    setSettings({ ...settings, school_motto: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter school motto"
                />
              </div>
            </div>

            {/* Grades/Classes Offered - Checkbox Grid */}
            <div className="mt-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Grades/Classes Offered <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {GRADE_OPTIONS.map((grade) => (
                  <label
                    key={grade}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={settings.grades_offered.includes(grade)}
                      onChange={() => toggleGrade(grade)}
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-gray-700 group-hover:text-indigo-600 transition-colors">
                      {grade}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Streams per Grade */}
            {settings.grades_offered.length > 0 && (
              <div className="mt-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Streams per Grade
                </label>
                <div className="space-y-4">
                  {settings.grades_offered.map((grade) => (
                    <div
                      key={grade}
                      className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-gray-800">{grade}</h4>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => addSingleClass(grade)}
                            className="bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-600 transition-colors flex items-center gap-1"
                          >
                            <FiPlus className="w-4 h-4" />
                            Single Class
                          </button>
                          <button
                            type="button"
                            onClick={() => addStream(grade)}
                            className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-purple-700 transition-colors flex items-center gap-1"
                          >
                            <FiPlus className="w-4 h-4" />
                            Add Stream
                          </button>
                        </div>
                      </div>

                      {(settings.streams_per_grade[grade] || []).length ===
                      0 ? (
                        <p className="text-sm text-gray-500 italic">
                          No streams added. Click "+ Single Class" or "+ Add
                          Stream" to add.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {(settings.streams_per_grade[grade] || []).map(
                            (stream, idx) => (
                              <div
                                key={idx}
                                className="bg-white rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm border border-gray-200"
                              >
                                <input
                                  type="text"
                                  value={stream.name}
                                  onChange={(e) =>
                                    updateStreamName(grade, idx, e.target.value)
                                  }
                                  className="w-20 text-sm border-0 bg-transparent focus:ring-0 p-0 font-medium text-gray-700"
                                />
                                <input
                                  type="number"
                                  value={
                                    isNaN(stream.pupils) ? "" : stream.pupils
                                  }
                                  onChange={(e) =>
                                    updateStreamPupils(
                                      grade,
                                      idx,
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="w-12 text-sm border border-gray-300 rounded px-1 py-0.5 text-center"
                                  min="1"
                                />
                                <span className="text-xs text-gray-500">
                                  pupils
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeStream(grade, idx)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSaveBasicSettings}
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                <FiSave className="w-5 h-5" />
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        )}

        {/* Terms Section */}
        {activeSection === "terms" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                School Terms
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
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <FiPlus className="w-5 h-5" />
                Add Term
              </button>
            </div>

            {terms.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FiCalendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No terms configured yet</p>
                <p className="text-sm">
                  Click "Add Term" to create your first term
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {terms.map((term) => (
                  <div
                    key={term.id}
                    className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        Term {term.term_number} - {term.year}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {term.start_date} to {term.end_date}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingTerm(term);
                          setShowTermModal(true);
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => term.id && handleDeleteTerm(term.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timetable Config Section */}
        {activeSection === "timetable" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Timetable Configuration
            </h2>

            {/* Education Level Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Education Level
              </label>
              <div className="flex flex-wrap gap-2">
                {EDUCATION_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => {
                      setSelectedLevel(level.id);
                      setScheduleConfig({
                        ...scheduleConfig,
                        education_level: level.id,
                      });
                    }}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedLevel === level.id
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule Config Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School Start Time
                </label>
                <input
                  type="time"
                  value={scheduleConfig.school_start_time}
                  onChange={(e) =>
                    setScheduleConfig({
                      ...scheduleConfig,
                      school_start_time: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Single Lesson (mins)
                </label>
                <input
                  type="number"
                  value={
                    isNaN(scheduleConfig.single_lesson_duration)
                      ? ""
                      : scheduleConfig.single_lesson_duration
                  }
                  onChange={(e) =>
                    setScheduleConfig({
                      ...scheduleConfig,
                      single_lesson_duration: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Double Lesson (mins)
                </label>
                <input
                  type="number"
                  value={
                    isNaN(scheduleConfig.double_lesson_duration)
                      ? ""
                      : scheduleConfig.double_lesson_duration
                  }
                  onChange={(e) =>
                    setScheduleConfig({
                      ...scheduleConfig,
                      double_lesson_duration: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lessons Before 1st Break
                </label>
                <input
                  type="number"
                  value={
                    isNaN(scheduleConfig.lessons_before_first_break)
                      ? ""
                      : scheduleConfig.lessons_before_first_break
                  }
                  onChange={(e) =>
                    setScheduleConfig({
                      ...scheduleConfig,
                      lessons_before_first_break: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  1st Break (mins)
                </label>
                <input
                  type="number"
                  value={
                    isNaN(scheduleConfig.first_break_duration)
                      ? ""
                      : scheduleConfig.first_break_duration
                  }
                  onChange={(e) =>
                    setScheduleConfig({
                      ...scheduleConfig,
                      first_break_duration: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lessons Before 2nd Break
                </label>
                <input
                  type="number"
                  value={
                    isNaN(scheduleConfig.lessons_before_second_break)
                      ? ""
                      : scheduleConfig.lessons_before_second_break
                  }
                  onChange={(e) =>
                    setScheduleConfig({
                      ...scheduleConfig,
                      lessons_before_second_break: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  2nd Break (mins)
                </label>
                <input
                  type="number"
                  value={
                    isNaN(scheduleConfig.second_break_duration)
                      ? ""
                      : scheduleConfig.second_break_duration
                  }
                  onChange={(e) =>
                    setScheduleConfig({
                      ...scheduleConfig,
                      second_break_duration: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lessons Before Lunch
                </label>
                <input
                  type="number"
                  value={
                    isNaN(scheduleConfig.lessons_before_lunch)
                      ? ""
                      : scheduleConfig.lessons_before_lunch
                  }
                  onChange={(e) =>
                    setScheduleConfig({
                      ...scheduleConfig,
                      lessons_before_lunch: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lunch Break (mins)
                </label>
                <input
                  type="number"
                  value={
                    isNaN(scheduleConfig.lunch_break_duration)
                      ? ""
                      : scheduleConfig.lunch_break_duration
                  }
                  onChange={(e) =>
                    setScheduleConfig({
                      ...scheduleConfig,
                      lunch_break_duration: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lessons After Lunch
                </label>
                <input
                  type="number"
                  value={
                    isNaN(scheduleConfig.lessons_after_lunch)
                      ? ""
                      : scheduleConfig.lessons_after_lunch
                  }
                  onChange={(e) =>
                    setScheduleConfig({
                      ...scheduleConfig,
                      lessons_after_lunch: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School End Time
                </label>
                <input
                  type="time"
                  value={scheduleConfig.school_end_time}
                  onChange={(e) =>
                    setScheduleConfig({
                      ...scheduleConfig,
                      school_end_time: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSaveSchedule}
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                <FiSave className="w-5 h-5" />
                {saving ? "Saving..." : "Save Schedule"}
              </button>
            </div>
          </div>
        )}

        {/* Term Modal */}
        {showTermModal && editingTerm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingTerm.id ? "Edit Term" : "Add Term"}
                </h3>
                <button
                  onClick={() => setShowTermModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Term Number
                  </label>
                  <select
                    value={editingTerm.term_number}
                    onChange={(e) =>
                      setEditingTerm({
                        ...editingTerm,
                        term_number: parseInt(e.target.value) as 1 | 2 | 3,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  >
                    <option value={1}>Term 1</option>
                    <option value={2}>Term 2</option>
                    <option value={3}>Term 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={isNaN(editingTerm.year) ? "" : editingTerm.year}
                    onChange={(e) =>
                      setEditingTerm({
                        ...editingTerm,
                        year: parseInt(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mid-Term Break Start
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
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mid-Term Break End
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
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowTermModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTerm}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Save Term
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
