"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiBookOpen,
  FiCheckSquare,
  FiLoader,
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

interface SchemeOfWork {
  id: number;
  subject_name: string;
  grade: string;
  term: string;
  year: number;
  status: string;
}

export default function CreateRecordOfWorkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [schemes, setSchemes] = useState<SchemeOfWork[]>([]);
  const [generating, setGenerating] = useState<number | null>(null);

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      const response = await axios.get("/api/v1/schemes", {
        withCredentials: true,
      });
      setSchemes(response.data);
    } catch (error) {
      console.error("Failed to fetch schemes:", error);
      toast.error("Failed to load schemes");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (schemeId: number) => {
    setGenerating(schemeId);
    try {
      const response = await axios.post(
        `/api/v1/records-of-work/create-from-scheme/${schemeId}`,
        {},
        { withCredentials: true }
      );
      toast.success("Record of Work generated successfully!");
      router.push(`/professional-records/record-of-work/${response.data.id}`);
    } catch (error) {
      console.error("Failed to generate record:", error);
      toast.error("Failed to generate record of work");
      setGenerating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/professional-records"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <FiArrowLeft className="mr-2" /> Back to Professional Records
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Create Record of Work
          </h1>
          <p className="mt-2 text-gray-600">
            Select a Scheme of Work to automatically generate your Record of
            Work.
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {schemes.length === 0 ? (
              <li className="px-6 py-12 text-center">
                <FiBookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No Schemes Found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  You need to create a Scheme of Work first.
                </p>
                <div className="mt-6">
                  <Link
                    href="/professional-records/generate-scheme"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <FiBookOpen className="mr-2 -ml-1 h-5 w-5" />
                    Create Scheme
                  </Link>
                </div>
              </li>
            ) : (
              schemes.map((scheme) => (
                <li key={scheme.id}>
                  <div className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                          <FiBookOpen className="h-6 w-6 text-indigo-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-indigo-600 truncate">
                          {scheme.subject_name}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="mr-4 font-semibold">
                            {scheme.grade}
                          </span>
                          <span>
                            {scheme.term} • {scheme.year}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <button
                        onClick={() => handleGenerate(scheme.id)}
                        disabled={generating === scheme.id}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                          generating === scheme.id
                            ? "bg-indigo-400 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                      >
                        {generating === scheme.id ? (
                          <>
                            <FiLoader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FiCheckSquare className="-ml-1 mr-2 h-5 w-5" />
                            Generate Record
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
