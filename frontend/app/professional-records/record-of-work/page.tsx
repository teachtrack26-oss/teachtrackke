"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FiArrowLeft,
  FiSearch,
  FiFilter,
  FiDownload,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiBookOpen,
  FiEye,
  FiCheckSquare,
  FiSquare,
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";
import { RecordOfWorkPrintView } from "@/components/RecordOfWorkPrintView";

// Summary interface for the list
interface RecordOfWorkSummary {
  id: number;
  learning_area: string;
  grade: string;
  term: string;
  year: number;
  is_archived: boolean;
  created_at: string;
}

// Full interface for printing (imported from component or redefined)
// We'll redefine it here to match what the component expects
interface RecordEntry {
  id: number;
  week_number: number;
  strand: string;
  topic: string;
  learning_outcome_a: string;
  learning_outcome_b: string;
  learning_outcome_c: string;
  learning_outcome_d: string;
  reflection: string;
  signature: string;
  date_taught: string;
  status: string;
}

interface FullRecordOfWork {
  id: number;
  school_name: string;
  teacher_name: string;
  learning_area: string;
  grade: string;
  term: string;
  year: number;
  entries: RecordEntry[];
}

export default function RecordsOfWorkListPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<RecordOfWorkSummary[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<RecordOfWorkSummary[]>(
    []
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Bulk Selection & Printing
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [bulkPrintData, setBulkPrintData] = useState<FullRecordOfWork[]>([]);
  const [weekFilter, setWeekFilter] = useState<number | null>(null);
  const bulkPrintRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: bulkPrintRef,
    documentTitle: "Records of Work Bulk Export",
    onAfterPrint: () => {
      setBulkPrintData([]); // Clear data after print to save memory
      setIsBulkDownloading(false);
    },
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    subject: "all",
    grade: "all",
    term: "all",
    year: "all",
  });

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === currentItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentItems.map((r) => r.id));
    }
  };

  const handleBulkDownload = async (type: "all" | "weekly") => {
    const user = session?.user as any;
    if (user?.subscription_type === "FREE") {
      toast.error("Bulk downloads are available on Premium plans only.");
      return;
    }

    if (selectedIds.length === 0) {
      toast.error("Please select records to download");
      return;
    }

    let week: number | null = null;
    if (type === "weekly") {
      const weekInput = prompt("Enter Week Number (e.g., 1):");
      if (!weekInput) return;
      week = parseInt(weekInput);
      if (isNaN(week)) {
        toast.error("Invalid week number");
        return;
      }
      setWeekFilter(week);
    } else {
      setWeekFilter(null);
    }

    setIsBulkDownloading(true);
    const toastId = toast.loading("Preparing records...");

    try {
      const token = localStorage.getItem("accessToken");
      const promises = selectedIds.map((id) =>
        axios.get(`/api/v1/records-of-work/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      const responses = await Promise.all(promises);
      const fullRecords = responses.map((r) => r.data);
      setBulkPrintData(fullRecords);

      // Wait for state update and render before printing
      setTimeout(() => {
        handlePrint();
        toast.dismiss(toastId);
      }, 1000);
    } catch (error) {
      console.error("Failed to fetch records for bulk download:", error);
      toast.error("Failed to prepare download", { id: toastId });
      setIsBulkDownloading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchRecords();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);

  useEffect(() => {
    filterRecords();
  }, [records, searchQuery, filters]);

  const fetchRecords = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get("/api/v1/records-of-work", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch records:", error);
      toast.error("Failed to load records of work");
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let result = [...records];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.learning_area.toLowerCase().includes(query) ||
          r.grade.toLowerCase().includes(query)
      );
    }

    // Filters
    if (filters.subject !== "all") {
      result = result.filter((r) => r.learning_area === filters.subject);
    }
    if (filters.grade !== "all") {
      result = result.filter((r) => r.grade === filters.grade);
    }
    if (filters.term !== "all") {
      result = result.filter((r) => r.term === filters.term);
    }
    if (filters.year !== "all") {
      result = result.filter((r) => r.year.toString() === filters.year);
    }

    setFilteredRecords(result);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Unique values for filters
  const getUniqueSubjects = () => [
    ...new Set(records.map((r) => r.learning_area)),
  ];
  const getUniqueGrades = () => [...new Set(records.map((r) => r.grade))];
  const getUniqueTerms = () => [...new Set(records.map((r) => r.term))];
  const getUniqueYears = () => [
    ...new Set(records.map((r) => r.year.toString())),
  ];

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`/api/v1/records-of-work/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Record deleted successfully");
      fetchRecords();
    } catch (error) {
      console.error("Failed to delete record:", error);
      toast.error("Failed to delete record");
    }
  };

  const handleDownload = (id: number) => {
    // Placeholder for download functionality
    // Ideally this would call an API endpoint to generate a PDF
    toast("Download feature coming soon!", { icon: "📥" });
    // Alternatively, navigate to the view page and trigger print
    // router.push(`/professional-records/record-of-work/${id}?print=true`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <Link
              href="/professional-records"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-2"
            >
              <FiArrowLeft className="mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Records of Work
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and track your teaching progress
            </p>
          </div>
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkDownload("all")}
                  disabled={isBulkDownloading}
                  className={`inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
                    (session?.user as any)?.subscription_type === "FREE"
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "text-gray-700 bg-white hover:bg-gray-50"
                  }`}
                  title={
                    (session?.user as any)?.subscription_type === "FREE"
                      ? "Upgrade to download"
                      : "Download Selected"
                  }
                >
                  <FiDownload className="mr-2 -ml-1 h-5 w-5" />
                  {(session?.user as any)?.subscription_type === "FREE"
                    ? "Preview Only"
                    : "Download Selected"}
                </button>
                <button
                  onClick={() => handleBulkDownload("weekly")}
                  disabled={isBulkDownloading}
                  className={`inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
                    (session?.user as any)?.subscription_type === "FREE"
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "text-gray-700 bg-white hover:bg-gray-50"
                  }`}
                  title={
                    (session?.user as any)?.subscription_type === "FREE"
                      ? "Upgrade to download"
                      : "Download Weekly"
                  }
                >
                  <FiCalendar className="mr-2 -ml-1 h-5 w-5" />
                  {(session?.user as any)?.subscription_type === "FREE"
                    ? "Preview Only"
                    : "Download Weekly"}
                </button>
              </div>
            )}
            <Link
              href="/professional-records/record-of-work/create"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FiPlus className="mr-2 -ml-1 h-5 w-5" />
              Create New Record
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center mb-4">
            <FiFilter className="text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <select
              value={filters.subject}
              onChange={(e) =>
                setFilters({ ...filters, subject: e.target.value })
              }
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">All Subjects</option>
              {getUniqueSubjects().map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={filters.grade}
              onChange={(e) =>
                setFilters({ ...filters, grade: e.target.value })
              }
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">All Grades</option>
              {getUniqueGrades().map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <select
              value={filters.term}
              onChange={(e) => setFilters({ ...filters, term: e.target.value })}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">All Terms</option>
              {getUniqueTerms().map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">All Years</option>
              {getUniqueYears().map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Records List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center">
            <input
              type="checkbox"
              checked={
                selectedIds.length === currentItems.length &&
                currentItems.length > 0
              }
              onChange={toggleSelectAll}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
            />
            <span className="text-sm text-gray-700 font-medium">
              Select All
            </span>
          </div>
          <ul className="divide-y divide-gray-200">
            {currentItems.length > 0 ? (
              currentItems.map((record) => (
                <li
                  key={record.id}
                  className="flex items-center hover:bg-gray-50 transition duration-150 ease-in-out"
                >
                  <div className="pl-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(record.id)}
                      onChange={() => toggleSelection(record.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              {record.learning_area}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {record.grade}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex justify-between">
                            <div className="sm:flex">
                              <div className="mr-6 flex items-center text-sm text-gray-500">
                                <FiCalendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                {record.term} {record.year}
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                <FiBookOpen className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                Record ID: #{record.id}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-5 flex items-center gap-2">
                          <Link
                            href={`/professional-records/record-of-work/${record.id}`}
                            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                            title="View & Edit"
                          >
                            <FiEdit className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleDownload(record.id)}
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                            title="Download"
                          >
                            <FiDownload className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-8 text-center text-gray-500">
                No records found matching your criteria.
              </li>
            )}
          </ul>
        </div>

        {/* Pagination */}
        {filteredRecords.length > itemsPerPage && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredRecords.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{filteredRecords.length}</span>{" "}
                  results
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <FiChevronLeft className="h-5 w-5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => paginate(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === i + 1
                          ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <FiChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden Print Container */}
      <div style={{ display: "none" }}>
        <div ref={bulkPrintRef}>
          {bulkPrintData.map((record) => (
            <RecordOfWorkPrintView
              key={record.id}
              record={record}
              weekFilter={weekFilter}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
