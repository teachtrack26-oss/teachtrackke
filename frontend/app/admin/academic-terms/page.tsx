"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiCalendar,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiArrowLeft,
  FiStar,
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import { useCustomAuth } from "@/hooks/useCustomAuth";

interface SystemTerm {
  id: number;
  term_number: number;
  term_name: string;
  year: number;
  start_date: string;
  end_date: string;
  teaching_weeks: number;
  mid_term_break_start?: string;
  mid_term_break_end?: string;
  is_current: boolean;
  created_at?: string;
}

interface TermFormData {
  term_number: number;
  term_name: string;
  year: number;
  start_date: string;
  end_date: string;
  teaching_weeks?: number;
  mid_term_break_start?: string;
  mid_term_break_end?: string;
  is_current: boolean;
}

export default function AcademicTermsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useCustomAuth();
  const [terms, setTerms] = useState<SystemTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTerm, setEditingTerm] = useState<SystemTerm | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  const [formData, setFormData] = useState<TermFormData>({
    term_number: 1,
    term_name: "Term 1",
    year: new Date().getFullYear(),
    start_date: "",
    end_date: "",
    teaching_weeks: 13,
    is_current: false,
  });

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== "SUPER_ADMIN" && !user.is_admin) {
        toast.error("Access denied. Super Admin only.");
        router.push("/dashboard");
        return;
      }
      fetchTerms();
    }
  }, [authLoading, user, selectedYear]); // Added selectedYear to refetch when filter changes

  const fetchTerms = async (yearOverride?: number) => {
    const yearToFetch = yearOverride ?? selectedYear;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/v1/admin/system-terms?year=${yearToFetch}`,
        {
          withCredentials: true,
        }
      );
      setTerms(res.data);
    } catch (error: any) {
      console.error("Failed to fetch terms:", error);
      if (error.response?.status === 403) {
        toast.error("Access denied. Super Admin privileges required.");
        router.push("/dashboard");
      } else {
        toast.error("Failed to load academic terms");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateYear = async (year: number) => {
    setGenerating(true);
    try {
      const res = await axios.post(
        `/api/v1/admin/system-terms/generate-year/${year}`,
        {},
        { withCredentials: true }
      );
      toast.success(res.data.message);
      setSelectedYear(year);
      // Pass year directly to avoid stale state issue
      fetchTerms(year);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to generate terms");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTerm) {
        await axios.put(
          `/api/v1/admin/system-terms/${editingTerm.id}`,
          formData,
          { withCredentials: true }
        );
        toast.success("Term updated successfully");
      } else {
        await axios.post("/api/v1/admin/system-terms", formData, {
          withCredentials: true,
        });
        toast.success("Term created successfully");
      }
      setShowForm(false);
      setEditingTerm(null);
      resetForm();
      fetchTerms();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to save term");
    }
  };

  const handleDelete = async (term: SystemTerm) => {
    if (!confirm(`Delete ${term.term_name} (${term.year})?`)) return;
    try {
      await axios.delete(`/api/v1/admin/system-terms/${term.id}`, {
        withCredentials: true,
      });
      toast.success("Term deleted");
      fetchTerms();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to delete term");
    }
  };

  const handleSetCurrent = async (term: SystemTerm) => {
    try {
      await axios.post(
        `/api/v1/admin/system-terms/set-current/${term.id}`,
        {},
        { withCredentials: true }
      );
      toast.success(`${term.term_name} (${term.year}) is now the current term`);
      fetchTerms();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to set current term");
    }
  };

  const handleEdit = (term: SystemTerm) => {
    setEditingTerm(term);
    setFormData({
      term_number: term.term_number,
      term_name: term.term_name,
      year: term.year,
      start_date: term.start_date.split("T")[0],
      end_date: term.end_date.split("T")[0],
      teaching_weeks: term.teaching_weeks,
      mid_term_break_start: term.mid_term_break_start?.split("T")[0] || "",
      mid_term_break_end: term.mid_term_break_end?.split("T")[0] || "",
      is_current: term.is_current,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      term_number: 1,
      term_name: "Term 1",
      year: selectedYear,
      start_date: "",
      end_date: "",
      teaching_weeks: 13,
      is_current: false,
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Get unique years from terms for the filter
  const availableYears = [...new Set(terms.map((t) => t.year))].sort(
    (a, b) => b - a
  );
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    ...new Set([
      currentYear - 1,
      currentYear,
      currentYear + 1,
      ...availableYears,
    ]),
  ].sort((a, b) => b - a);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Back to Admin Dashboard
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Academic Terms Management
              </h1>
              <p className="text-gray-600 mt-2">
                Configure system-wide academic terms for the Kenya academic
                calendar. These terms apply to all teachers and schools.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingTerm(null);
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <FiPlus className="mr-2" />
              Add Term
            </button>
          </div>
        </div>

        {/* Year Filter & Generate */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Filter by Year:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                fetchTerms();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleGenerateYear(currentYear)}
              disabled={generating}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <FiRefreshCw
                className={`mr-2 ${generating ? "animate-spin" : ""}`}
              />
              Generate {currentYear} Terms
            </button>
            <button
              onClick={() => handleGenerateYear(currentYear + 1)}
              disabled={generating}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <FiRefreshCw
                className={`mr-2 ${generating ? "animate-spin" : ""}`}
              />
              Generate {currentYear + 1} Terms
            </button>
          </div>
        </div>

        {/* Terms Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {terms.length === 0 ? (
            <div className="p-12 text-center">
              <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No terms for {selectedYear}
              </h3>
              <p className="mt-2 text-gray-500">
                Click "Generate {selectedYear} Terms" to create default Kenya
                academic calendar terms.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Term
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Weeks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {terms.map((term) => (
                  <tr
                    key={term.id}
                    className={term.is_current ? "bg-green-50" : ""}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">
                          {term.term_name}
                        </span>
                        {term.is_current && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <FiStar className="mr-1 h-3 w-3" />
                            Current
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {term.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {formatDate(term.start_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {formatDate(term.end_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {term.teaching_weeks} weeks
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {term.is_current ? (
                        <span className="text-green-600 font-medium">
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetCurrent(term)}
                          className="text-primary-600 hover:text-primary-900 text-sm"
                        >
                          Set as Current
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleEdit(term)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(term)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingTerm ? "Edit Term" : "Add New Term"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingTerm(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Term Number *
                      </label>
                      <select
                        value={formData.term_number}
                        onChange={(e) => {
                          const num = Number(e.target.value);
                          setFormData({
                            ...formData,
                            term_number: num,
                            term_name: `Term ${num}`,
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                        required
                      >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year *
                      </label>
                      <input
                        type="number"
                        value={formData.year}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            year: Number(e.target.value),
                          })
                        }
                        min={2020}
                        max={2030}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Term Name
                    </label>
                    <input
                      type="text"
                      value={formData.term_name}
                      onChange={(e) =>
                        setFormData({ ...formData, term_name: e.target.value })
                      }
                      placeholder="e.g., Term 1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            start_date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) =>
                          setFormData({ ...formData, end_date: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teaching Weeks
                    </label>
                    <input
                      type="number"
                      value={formData.teaching_weeks || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          teaching_weeks: Number(e.target.value),
                        })
                      }
                      placeholder="Auto-calculated from dates"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to auto-calculate from start/end dates.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mid-Term Break Start
                      </label>
                      <input
                        type="date"
                        value={formData.mid_term_break_start || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            mid_term_break_start: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mid-Term Break End
                      </label>
                      <input
                        type="date"
                        value={formData.mid_term_break_end || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            mid_term_break_end: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_current"
                      checked={formData.is_current}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_current: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="is_current"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Set as current active term
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingTerm(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      {editingTerm ? "Update Term" : "Create Term"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
