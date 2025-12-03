"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FiArrowLeft,
  FiPrinter,
  FiSave,
  FiCheck,
  FiEdit,
  FiDownload,
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";
import { RecordOfWorkPrintView } from "@/components/RecordOfWorkPrintView";

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
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<RecordOfWork | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Record of Work - ${record?.learning_area}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm 15mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

  useEffect(() => {
    fetchRecord();
  }, []);

  const fetchRecord = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`/api/v1/records-of-work/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
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
      const token = localStorage.getItem("accessToken");
      await axios.put(
        `/api/v1/records-of-work/${params.id}/entries/${entryId}`,
        { [field]: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Failed to update entry:", error);
      toast.error("Failed to save changes");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Actions - Explicitly visible */}
        <div className="mb-8 flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200 print:hidden">
          <Link
            href="/professional-records/record-of-work"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <FiArrowLeft className="mr-2" /> Back to Records
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md transition-colors ${
                isEditing
                  ? "border-green-600 text-green-600 bg-green-50 hover:bg-green-100"
                  : "border-indigo-600 text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
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
            <button
              onClick={() => {
                const user = session?.user as any;
                if (user?.subscription_type === "FREE") {
                  toast.error("Downloads are available on Premium plans only.");
                  return;
                }
                handlePrint();
              }}
              className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md transition-colors ${
                (session?.user as any)?.subscription_type === "FREE"
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "text-gray-700 bg-white hover:bg-gray-50"
              }`}
              title={
                (session?.user as any)?.subscription_type === "FREE"
                  ? "Upgrade to download"
                  : "Download"
              }
            >
              <FiDownload className="mr-2 -ml-1 h-5 w-5" />
              {(session?.user as any)?.subscription_type === "FREE"
                ? "Preview Only"
                : "Download"}
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <RecordOfWorkPrintView
          ref={componentRef}
          record={record}
          isEditing={isEditing}
          onUpdateEntry={handleUpdateEntry}
        />
      </div>
    </div>
  );
}
