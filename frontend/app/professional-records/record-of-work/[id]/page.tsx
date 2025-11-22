"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiPrinter, FiSave, FiCheck } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";

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
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<RecordOfWork | null>(null);
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

  // Helper to calculate rowspans for a specific week's entries
  const calculateRowSpans = (entries: RecordEntry[]) => {
    const strandSpans: number[] = new Array(entries.length).fill(0);
    const topicSpans: number[] = new Array(entries.length).fill(0);

    let currentStrandIndex = 0;
    let currentTopicIndex = 0;

    for (let i = 0; i < entries.length; i++) {
      // Strand Logic
      if (i > 0 && entries[i].strand === entries[i - 1].strand) {
        strandSpans[currentStrandIndex]++;
      } else {
        currentStrandIndex = i;
        strandSpans[i] = 1;
      }

      // Topic Logic (merge if topic AND strand are same)
      if (
        i > 0 &&
        entries[i].topic === entries[i - 1].topic &&
        entries[i].strand === entries[i - 1].strand
      ) {
        topicSpans[currentTopicIndex]++;
      } else {
        currentTopicIndex = i;
        topicSpans[i] = 1;
      }
    }
    return { strandSpans, topicSpans };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!record) return null;

  const groupedEntries = record.entries.reduce((acc, entry) => {
    if (!acc[entry.week_number]) {
      acc[entry.week_number] = [];
    }
    acc[entry.week_number].push(entry);
    return acc;
  }, {} as Record<number, RecordEntry[]>);

  const sortedWeeks = Object.keys(groupedEntries)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Actions */}
        <div className="mb-8 flex justify-between items-center print:hidden">
          <Link
            href="/professional-records"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700"
          >
            <FiArrowLeft className="mr-2" /> Back to Records
          </Link>
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <FiPrinter className="mr-2 -ml-1 h-5 w-5" />
            Print Record
          </button>
        </div>

        {/* Printable Content */}
        <div
          ref={componentRef}
          className="bg-white shadow-lg p-8 print:shadow-none print:p-0"
        >
          {/* Document Header */}
          <div className="border-b-2 border-gray-800 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-center uppercase mb-6">
              Records of Work Covered
            </h1>
            <div className="flex justify-between text-sm font-bold uppercase border border-gray-300 p-4 rounded-lg">
              <div className="space-y-2">
                <p>
                  <span className="w-32 inline-block text-gray-600">
                    SCHOOL:
                  </span>
                  {record.school_name}
                </p>
                <p>
                  <span className="w-32 inline-block text-gray-600">
                    LEARNING AREA:
                  </span>
                  {record.learning_area}
                </p>
                <p>
                  <span className="w-32 inline-block text-gray-600">
                    TEACHER:
                  </span>
                  {record.teacher_name}
                </p>
              </div>
              <div className="space-y-2 text-right">
                <p>
                  <span className="w-20 inline-block text-left text-gray-600">
                    GRADE:
                  </span>
                  {record.grade}
                </p>
                <p>
                  <span className="w-20 inline-block text-left text-gray-600">
                    TERM:
                  </span>
                  {record.term}
                </p>
                <p>
                  <span className="w-20 inline-block text-left text-gray-600">
                    YEAR:
                  </span>
                  {record.year}
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full border-collapse border border-gray-800 text-sm">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-100">
                <th className="border border-gray-800 p-2 w-16 text-center">
                  WEEK
                </th>
                <th className="border border-gray-800 p-2 w-1/4 text-left">
                  STRAND
                </th>
                <th className="border border-gray-800 p-2 w-1/3 text-left">
                  WORK COVERED
                </th>
                <th className="border border-gray-800 p-2 text-left">
                  REFLECTION
                </th>
                <th className="border border-gray-800 p-2 w-24 text-center">
                  SIGN
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedWeeks.map((weekNum) => {
                const weekEntries = groupedEntries[weekNum];
                const { strandSpans, topicSpans } =
                  calculateRowSpans(weekEntries);

                return weekEntries.map((entry, index) => (
                  <tr key={entry.id} className="break-inside-avoid">
                    {/* Show Week Number only on first row of the week */}
                    {index === 0 && (
                      <td
                        className="border border-gray-800 p-2 text-center font-bold align-top"
                        rowSpan={weekEntries.length}
                      >
                        {weekNum}
                      </td>
                    )}

                    {/* Strand Column with RowSpan */}
                    {strandSpans[index] > 0 && (
                      <td
                        className="border border-gray-800 p-2 align-top"
                        rowSpan={strandSpans[index]}
                      >
                        <div className="font-semibold">{entry.strand}</div>
                      </td>
                    )}

                    {/* Work Covered Column - Merged Topic if applicable */}
                    <td className="border border-gray-800 p-2 align-top">
                      {/* Only show topic if it's the start of a topic span */}
                      {topicSpans[index] > 0 && (
                        <div className="font-bold mb-2 pb-1 border-b border-gray-200">
                          {entry.topic}
                        </div>
                      )}

                      <div className="pl-2 space-y-1 text-gray-700">
                        {entry.learning_outcome_a && (
                          <div>a) {entry.learning_outcome_a}</div>
                        )}
                        {entry.learning_outcome_b && (
                          <div>b) {entry.learning_outcome_b}</div>
                        )}
                        {entry.learning_outcome_c && (
                          <div>c) {entry.learning_outcome_c}</div>
                        )}
                        {entry.learning_outcome_d && (
                          <div>d) {entry.learning_outcome_d}</div>
                        )}
                      </div>
                    </td>

                    <td className="border border-gray-800 p-2 align-top">
                      <textarea
                        className="w-full h-full min-h-[60px] p-1 border-0 focus:ring-0 resize-none bg-transparent print:hidden"
                        placeholder="Enter reflection..."
                        value={entry.reflection || ""}
                        onChange={(e) =>
                          handleUpdateEntry(
                            entry.id,
                            "reflection",
                            e.target.value
                          )
                        }
                      />
                      <div className="hidden print:block whitespace-pre-wrap">
                        {entry.reflection}
                      </div>
                    </td>
                    <td className="border border-gray-800 p-2 align-top text-center">
                      <input
                        type="text"
                        className="w-full text-center border-0 focus:ring-0 bg-transparent print:hidden"
                        placeholder="Sign"
                        value={entry.signature || ""}
                        onChange={(e) =>
                          handleUpdateEntry(
                            entry.id,
                            "signature",
                            e.target.value
                          )
                        }
                      />
                      <div className="hidden print:block font-script text-lg">
                        {entry.signature}
                      </div>
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
