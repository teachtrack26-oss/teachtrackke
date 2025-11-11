"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiArrowLeft, FiBook, FiCheckCircle, FiCircle } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

interface SubStrand {
  id: number;
  substrand_name: string;
  substrand_code: string;
  lessons_count: number;
}

interface Strand {
  id: number;
  strand_name: string;
  strand_code: string;
  description: string | null;
  sub_strands: SubStrand[];
}

interface Subject {
  id: number;
  subject_name: string;
  grade: string;
  total_lessons: number;
  lessons_completed: number;
  progress_percentage: number;
}

export default function SubjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [strands, setStrands] = useState<Strand[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStrands, setExpandedStrands] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Please login to view subject details");
      router.push("/login");
      return;
    }
    fetchSubjectDetails();
  }, [subjectId]);

  const fetchSubjectDetails = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      // Fetch subject info
      const subjectResponse = await axios.get(`/api/v1/subjects/${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubject(subjectResponse.data);

      // Fetch strands
      const strandsResponse = await axios.get(
        `/api/v1/subjects/${subjectId}/strands`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const fetchedStrands = strandsResponse.data;
      setStrands(fetchedStrands);

      // Expand all strands by default
      const allStrandIds = new Set<number>(
        fetchedStrands.map((s: Strand) => s.id)
      );
      setExpandedStrands(allStrandIds);
    } catch (error) {
      console.error("Failed to fetch subject details:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        router.push("/login");
      } else {
        toast.error("Failed to load subject details");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleStrand = (strandId: number) => {
    const newExpanded = new Set(expandedStrands);
    if (newExpanded.has(strandId)) {
      newExpanded.delete(strandId);
    } else {
      newExpanded.add(strandId);
    }
    setExpandedStrands(newExpanded);
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Subject Not Found
          </h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-indigo-600 hover:text-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Back to Dashboard
          </button>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {subject.subject_name}
                </h1>
                <p className="text-gray-600">{subject.grade}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-indigo-600">
                  {Math.round(subject.progress_percentage)}%
                </div>
                <p className="text-sm text-gray-600">
                  {subject.lessons_completed}/{subject.total_lessons} lessons
                  completed
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${subject.progress_percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Strands List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Curriculum Strands
          </h2>

          {/* Info banner for default structure */}
          {strands.length === 1 &&
            strands[0].strand_code === "1.0" &&
            strands[0].strand_name === "Main Content" && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Default Structure Applied:</strong> The PDF could
                      not be parsed (possibly scanned or has encoding issues). A
                      generic structure with 20 lessons has been created. You
                      can still track your progress through these lessons.
                    </p>
                  </div>
                </div>
              </div>
            )}

          {strands.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No strands found
              </h3>
              <p className="text-gray-600">
                The curriculum structure will appear here once the document is
                parsed.
              </p>
            </div>
          ) : (
            strands.map((strand) => (
              <div
                key={strand.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <button
                  onClick={() => toggleStrand(strand.id)}
                  className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-indigo-600">
                      {strand.strand_code}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {strand.strand_name}
                    </h3>
                    {strand.description && (
                      <span className="text-sm text-gray-500 italic">
                        ({strand.description})
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400">
                    {expandedStrands.has(strand.id) ? "−" : "+"}
                  </span>
                </button>

                {expandedStrands.has(strand.id) && (
                  <div className="px-6 pb-4 border-t border-gray-200">
                    <div className="mt-4 space-y-3">
                      {strand.sub_strands.map((substrand) => (
                        <div
                          key={substrand.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <FiCircle className="text-gray-400" />
                            <div>
                              <span className="font-medium text-gray-700">
                                {substrand.substrand_code}
                              </span>
                              <span className="ml-2 text-gray-900">
                                {substrand.substrand_name}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {substrand.lessons_count} lesson
                            {substrand.lessons_count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
