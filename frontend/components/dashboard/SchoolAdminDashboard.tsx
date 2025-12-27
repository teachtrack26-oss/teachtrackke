"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiUsers,
  FiPlus,
  FiTrash2,
  FiBriefcase,
  FiCheckCircle,
} from "react-icons/fi";

interface School {
  id: number;
  name: string;
  max_teachers: number;
  subscription_status: string;
}

interface Teacher {
  id: number;
  full_name: string;
  email: string;
  subscription_status: string;
}

export default function SchoolAdminDashboard({ user }: { user: any }) {
  const [school, setSchool] = useState<School | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [maxTeachers, setMaxTeachers] = useState(5);
  const [teacherCounts, setTeacherCounts] = useState<Record<string, number>>(
    {}
  );
  const [creatingSchool, setCreatingSchool] = useState(false);

  useEffect(() => {
    fetchSchoolData();
  }, []);

  const fetchSchoolData = async () => {
    try {
      // const token = localStorage.getItem("accessToken");
      // Get School Details
      const schoolRes = await axios.get("/api/v1/schools/me", {
        // headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setSchool(schoolRes.data);

      // Get Teachers
      const teachersRes = await axios.get("/api/v1/schools/teachers", {
        // headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setTeachers(teachersRes.data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error("Error fetching school data", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingSchool(true);
    try {
      // const token = localStorage.getItem("accessToken");
      const res = await axios.post(
        "/api/v1/schools",
        {
          name: schoolName,
          max_teachers: maxTeachers,
          teacher_counts_by_level: teacherCounts,
        },
        {
          // headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setSchool(res.data);
      toast.success("School created successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to create school");
    } finally {
      setCreatingSchool(false);
    }
  };

  const handleInviteTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // const token = localStorage.getItem("accessToken");
      const res = await axios.post(
        "/api/v1/schools/teachers",
        { email: inviteEmail },
        {
          // headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setTeachers([...teachers, res.data]);
      setInviteEmail("");
      toast.success("Teacher added successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to add teacher");
    }
  };

  const handleRemoveTeacher = async (id: number) => {
    if (!confirm("Are you sure you want to remove this teacher?")) return;
    try {
      // const token = localStorage.getItem("accessToken");
      await axios.delete(`/api/v1/schools/teachers/${id}`, {
        // headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setTeachers(teachers.filter((t) => t.id !== id));
      toast.success("Teacher removed.");
    } catch (error: any) {
      toast.error("Failed to remove teacher");
    }
  };

  if (loading)
    return <div className="p-8 text-center">Loading school data...</div>;

  if (!school) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-[2rem] shadow-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBriefcase className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Setup Your School
          </h2>
          <p className="text-gray-600 mt-2">
            Create your school profile to start managing teachers and licenses.
          </p>
        </div>

        <form onSubmit={handleCreateSchool} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              School Name
            </label>
            <input
              type="text"
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g. Nairobi Primary School"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Number of Teachers
            </label>
            <input
              type="number"
              required
              min="1"
              value={maxTeachers}
              onChange={(e) => setMaxTeachers(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g. 20"
            />
          </div>

          <div className="bg-[#020617] p-4 rounded-2xl border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Teachers per Level
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Pre-Primary",
                "Lower Primary",
                "Upper Primary",
                "Junior Secondary",
                "Senior Secondary",
              ].map((level) => (
                <div key={level}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {level}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={teacherCounts[level] || 0}
                    onChange={(e) =>
                      setTeacherCounts({
                        ...teacherCounts,
                        [level]: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={creatingSchool}
            className="w-full py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {creatingSchool ? "Creating..." : "Create School Profile"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Stats */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{school.name}</h1>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-2xl">
                <FiUsers className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Teachers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teachers.length} / {school.max_teachers}
                </p>
              </div>
            </div>
            <div className="mt-4 w-full bg-[#0F172A] rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${(teachers.length / school.max_teachers) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-2xl">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-2xl font-bold text-green-600">
                  {school.subscription_status}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Management */}
      <div className="glass-card border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900">Manage Teachers</h2>

          <form
            onSubmit={handleInviteTeacher}
            className="flex gap-2 w-full md:w-auto"
          >
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teacher@email.com"
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 flex-1 md:w-64"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 font-medium"
            >
              <FiPlus /> Add Teacher
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#020617] text-gray-500 text-sm uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teachers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No teachers added yet. Invite someone above!
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-[#020617]">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {teacher.full_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{teacher.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemoveTeacher(teacher.id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Teacher"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
