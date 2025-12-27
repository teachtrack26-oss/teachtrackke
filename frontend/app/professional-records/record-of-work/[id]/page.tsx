"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import Link from "next/link";
import {
  FiArrowLeft,
  FiCheck,
  FiEdit,
  FiDownload,
  FiLock,
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import { RecordOfWorkPrintView } from "@/components/RecordOfWorkPrintView";
import { downloadElementAsPdf } from "@/lib/pdf";

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

interface RecordOfWork {
  id: number;
  school_name: string;
  teacher_name: string;
  learning_area: string;
  grade: string;
  term: string;
  year: number;
  entries: RecordEntry[];
}

export default function RecordOfWorkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useCustomAuth();

  const isPremium =
    user?.subscription_type === "INDIVIDUAL_PREMIUM" ||
    user?.subscription_type === "SCHOOL_SPONSORED" ||
    !!user?.school_id ||
    user?.role === "SUPER_ADMIN";

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<RecordOfWork | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const visibleRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);
  const [downloadWeek, setDownloadWeek] = useState<number | "all">("all");

  useEffect(() => {
    fetchRecord();
  }, []);

  const fetchRecord = async () => {
    try {
      const response = await axios.get(`/api/v1/records-of-work/${params.id}`, {
        withCredentials: true,
      });
      setRecord(response.data);
    } catch (error) {
      console.error("Failed to fetch record:", error);
      toast.error("Failed to load record of work");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEntry = async (
    entryId: number,
    field: string,
    value: string
  ) => {
    // Optimistic update
    setRecord((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        entries: prev.entries.map((e) =>
          e.id === entryId ? { ...e, [field]: value } : e
        ),
      };
    });

    try {
      await axios.put(
        `/api/v1/records-of-work/${params.id}/entries/${entryId}`,
        { [field]: value },
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Failed to update entry:", error);
      toast.error("Failed to save changes");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!record) return null;

  const availableWeeks = Array.from(
    new Set((record.entries || []).map((e) => e.week_number).filter(Boolean))
  ).sort((a, b) => a - b);

  const handleDownloadPdf = async () => {
    if (!isPremium) {
      toast.error("Downloads are available on Premium plans only.");
      return;
    }

    if (!downloadRef.current) {
      toast.error("Unable to prepare download.");
      return;
    }

    const toastId = toast.loading("Preparing PDF...");
    try {
      const safeArea = (record.learning_area || "record")
        .replace(/[^a-z0-9\-\s]/gi, "")
        .trim()
        .replace(/\s+/g, "-");
      const weekSuffix =
        downloadWeek === "all" ? "all-weeks" : `week-${downloadWeek}`;
      const filename = `record-of-work-${safeArea}-${record.term || "term"}-${
        record.year || "year"
      }-${weekSuffix}.pdf`;
      await downloadElementAsPdf(downloadRef.current, filename);
      toast.dismiss(toastId);
    } catch (e) {
      console.error("PDF download failed:", e);
      toast.error("Failed to generate PDF", { id: toastId });
    }
  };

  return (
    <div
      className={`min-h-screen bg-[#020617] pt-24 pb-8 px-4 sm:px-6 lg:px-8 ${
        !isPremium ? "select-none" : ""
      }`}
      onContextMenu={(e) => {
        if (!isPremium) {
          e.preventDefault();
          toast.error("Right-click is disabled for preview.");
        }
      }}
    >
      <style jsx global>{`
        @media print {
          /* Hide content for non-premium users during print */
          ${!isPremium
            ? `
            body > * {
              display: none !important;
            }
            body::after {
              content: "Printing is available on Premium plans only. Please upgrade to print.";
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              font-size: 24pt;
              font-weight: bold;
              color: #555;
              text-align: center;
              padding: 20px;
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              background: white;
              z-index: 9999;
            }
          `
            : ""}
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        {/* Free Plan Banner */}
        {!isPremium && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm relative overflow-hidden print:hidden">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <FiLock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    Preview Mode Active
                  </h3>
                  <p className="text-sm text-gray-600">
                    Upgrade to Premium to download, print, and edit this Record
                    of Work.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/pricing")}
                className="whitespace-nowrap px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-bold rounded-lg shadow-md transition-all"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Header Actions - Explicitly visible */}
        <div className="mb-8 flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200 print:hidden">
          <Link
            href="/professional-records/record-of-work"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            <FiArrowLeft className="mr-2" /> Back to Records
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md transition-colors ${
                isEditing
                  ? "border-green-600 text-green-600 bg-green-50 hover:bg-green-100"
                  : "border-primary-600 text-primary-600 bg-primary-50 hover:bg-primary-100"
              }`}
            >
              {isEditing ? (
                <>
                  <FiCheck className="mr-2 -ml-1 h-5 w-5" />
                  Done Editing
                </>
              ) : (
                <>
                  <FiEdit className="mr-2 -ml-1 h-5 w-5" />
                  Edit Record
                </>
              )}
            </button>

            <select
              value={downloadWeek}
              onChange={(e) => {
                const v = e.target.value;
                setDownloadWeek(v === "all" ? "all" : parseInt(v, 10));
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
              disabled={!isPremium}
              title={
                !isPremium ? "Upgrade to download" : "Select week to download"
              }
            >
              <option value="all">All Weeks</option>
              {availableWeeks.map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>

            <button
              onClick={handleDownloadPdf}
              disabled={!isPremium}
              className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md transition-colors ${
                !isPremium
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "text-gray-700 bg-white hover:bg-[#020617]"
              }`}
              title={!isPremium ? "Upgrade to download" : "Download"}
            >
              <FiDownload className="mr-2 -ml-1 h-5 w-5" />
              {!isPremium ? "Preview Only" : "Download"}
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="relative">
          {/* Watermark for non-premium users */}
          {!isPremium && (
            <div className="absolute inset-0 pointer-events-none z-50 grid grid-cols-3 gap-y-32 gap-x-12 content-start justify-items-center overflow-hidden opacity-10 p-10">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="transform -rotate-45 text-gray-900 text-3xl font-black whitespace-nowrap select-none"
                >
                  {user?.email || "PREVIEW ONLY"}
                </div>
              ))}
            </div>
          )}
          <RecordOfWorkPrintView
            ref={visibleRef}
            record={record}
            isEditing={isEditing}
            onUpdateEntry={handleUpdateEntry}
          />
        </div>

        {/* Offscreen PDF-only content (so download doesn't include inputs/controls) */}
        <div
          style={{
            position: "fixed",
            left: "-10000px",
            top: 0,
            width: "794px",
          }}
          aria-hidden="true"
        >
          <RecordOfWorkPrintView
            ref={downloadRef}
            record={record}
            isEditing={false}
            weekFilter={downloadWeek === "all" ? null : downloadWeek}
          />
        </div>
      </div>
    </div>
  );
}
