"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiPlus, FiBook, FiUpload } from "react-icons/fi";
import axios from "axios";

interface Subject {
  id: number;
  subject_name: string;
  grade: string;
  current_strand_id: string;
  current_substrand_id: string;
  lessons_completed: number;
  total_lessons: number;
  progress_percentage: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check authentication - NextAuth or localStorage
    if (status === "loading") return; // Still loading

    if (status === "authenticated" && session) {
      // User authenticated via NextAuth (Google OAuth)
      setUser(session.user);
      fetchSubjects((session as any).accessToken);
    } else {
      // Check localStorage for direct login
      const token = localStorage.getItem("accessToken");
      const userData = localStorage.getItem("user");

      if (!token || !userData) {
        router.push("/login");
        return;
      }

      setUser(JSON.parse(userData));
      fetchSubjects(token);
    }
  }, [session, status, router]);

  const fetchSubjects = async (token: string) => {
    try {
      const response = await axios.get(`/api/v1/subjects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSubjects(response.data);
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
      // If unauthorized, redirect to login and clear all session data
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        sessionStorage.clear();
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteSubject = async (subjectId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this subject? All progress will be lost."
      )
    ) {
      return;
    }

    try {
      const token =
        localStorage.getItem("accessToken") || (session as any)?.accessToken;
      await axios.delete(`/api/v1/subjects/${subjectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove from state
      setSubjects(subjects.filter((s) => s.id !== subjectId));
    } catch (error) {
      console.error("Failed to delete subject:", error);
      alert("Failed to delete subject. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface shadow-2xl">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
          <Link
            href="/curriculum"
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 transition-colors"
          >
            <FiPlus /> Add Subject
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {subjects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  onDelete={deleteSubject}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <FiBook className="mx-auto h-12 w-12 text-muted" />
      <h3 className="mt-2 text-sm font-medium text-foreground">
        No subjects yet
      </h3>
      <p className="mt-1 text-sm text-muted">
        Get started by importing your first subject from the curriculum library
      </p>
      <div className="mt-6 flex justify-center">
        <Link
          href="/curriculum"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 transition-colors"
        >
          <FiBook /> Browse Curriculum Library
        </Link>
      </div>
    </div>
  );
}

function SubjectCard({
  subject,
  onDelete,
}: {
  subject: Subject;
  onDelete: (id: number) => void;
}) {
  const getStatusColor = (percentage: number) => {
    if (percentage >= 75) return "bg-success";
    if (percentage >= 50) return "bg-warning";
    return "bg-danger";
  };

  return (
    <div className="bg-surface rounded-2xl shadow-2xl p-8 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {subject.subject_name}
          </h3>
          <p className="text-sm text-muted">Grade {subject.grade}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary-500">
            {Math.round(subject.progress_percentage)}%
          </p>
          <p className="text-xs text-muted">
            {subject.lessons_completed}/{subject.total_lessons} lessons
          </p>
        </div>
      </div>

      <div className="w-full bg-border rounded-full h-4 overflow-hidden mb-4">
        <div
          className={`${getStatusColor(
            subject.progress_percentage
          )} h-full rounded-full transition-all duration-500`}
          style={{ width: `${subject.progress_percentage}%` }}
        />
      </div>

      <p className="text-sm text-foreground mb-4">
        <strong>Currently:</strong> {subject.current_strand_id} →{" "}
        {subject.current_substrand_id}
      </p>

      <div className="flex gap-3 mb-3">
        <Link
          href={`/subjects/${subject.id}`}
          className="flex-1 text-center py-2 border border-border rounded-xl hover:bg-background text-sm font-semibold text-primary-600 transition-colors"
        >
          View Details
        </Link>
        <button className="flex-1 bg-success text-white py-2 rounded-xl hover:bg-green-700 text-sm font-semibold transition-colors">
          ✓ Mark Complete
        </button>
      </div>

      <button
        onClick={() => onDelete(subject.id)}
        className="w-full py-2 border border-red-500 text-red-500 rounded-xl hover:bg-red-50 text-sm font-semibold transition-colors"
      >
        Delete Subject
      </button>
    </div>
  );
}
