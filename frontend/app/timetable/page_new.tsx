"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { FiClock, FiBook, FiPlus, FiTrash2, FiSettings } from "react-icons/fi";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TimetablePage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState([]);
  const [entries, setEntries] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    time_slot_id: 0,
    subject_id: 0,
    day_of_week: 1,
    room_number: "",
    grade_section: "",
    notes: "",
    is_double_lesson: false,
  });

  useEffect(() => {
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) {
      toast.error("Please login");
      router.push("/login");
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const scheduleRes = await fetch(
        "http://localhost:8000/api/v1/timetable/schedules/active",
        { headers }
      );
      if (!scheduleRes.ok) {
        toast.error("No schedule. Please set up first.");
        router.push("/timetable/setup");
        return;
      }
      const slotsRes = await fetch(
        "http://localhost:8000/api/v1/timetable/time-slots",
        { headers }
      );
      const slotsData = await slotsRes.json();
      setTimeSlots(slotsData.filter((s) => s.slot_type === "lesson"));
      const entriesRes = await fetch(
        "http://localhost:8000/api/v1/timetable/entries",
        { headers }
      );
      setEntries(await entriesRes.json());
      const subjectsRes = await fetch("http://localhost:8000/api/v1/subjects", {
        headers,
      });
      const subjectsData = await subjectsRes.json();
      setSubjects(subjectsData.subjects || subjectsData);
      setIsLoading(false);
    } catch (error) {
      toast.error("Failed to load");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      const url = editingEntry
        ? `http://localhost:8000/api/v1/timetable/entries/${editingEntry.id}`
        : "http://localhost:8000/api/v1/timetable/entries";
      const response = await fetch(url, {
        method: editingEntry ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        toast.success("Saved!");
        setIsAddModalOpen(false);
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed");
      }
    } catch (error) {
      toast.error("Failed");
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Weekly Timetable</h1>
            <p className="text-gray-600">Manage your schedule</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push("/timetable/setup")}
              className="bg-gray-100 px-4 py-2 rounded-lg flex items-center"
            >
              <FiSettings className="mr-2" />
              Setup
            </button>
            <button
              onClick={() => {
                setEditingEntry(null);
                setIsAddModalOpen(true);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <FiPlus className="mr-2" />
              Add Lesson
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 text-left sticky left-0 bg-gray-50">Time</th>
                {DAYS.map((d) => (
                  <th key={d} className="p-4 min-w-[180px]">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={slot.id} className="border-b">
                  <td className="p-4 bg-gray-50 sticky left-0">
                    <FiClock className="inline mr-2" />
                    <div className="text-sm">
                      {slot.label}
                      <br />
                      <span className="text-xs text-gray-600">
                        {slot.start_time}-{slot.end_time}
                      </span>
                    </div>
                  </td>
                  {DAYS.map((d, i) => {
                    const dayEntries = entries.filter(
                      (e) =>
                        e.time_slot_id === slot.id && e.day_of_week === i + 1
                    );
                    return (
                      <td key={i} className="p-2 align-top">
                        {dayEntries.length > 0 ? (
                          dayEntries.map((entry) => {
                            const subj = subjects.find(
                              (s) => s.id === entry.subject_id
                            );
                            return (
                              <div
                                key={entry.id}
                                className="p-3 rounded-lg bg-indigo-50 border-l-4 border-indigo-500 group cursor-pointer"
                                onClick={() => {
                                  setEditingEntry(entry);
                                  setFormData({
                                    time_slot_id: entry.time_slot_id,
                                    subject_id: entry.subject_id,
                                    day_of_week: entry.day_of_week,
                                    room_number: entry.room_number || "",
                                    grade_section: entry.grade_section || "",
                                    notes: entry.notes || "",
                                    is_double_lesson: entry.is_double_lesson,
                                  });
                                  setIsAddModalOpen(true);
                                }}
                              >
                                <div className="flex justify-between">
                                  <div>
                                    <div className="font-medium text-sm">
                                      {subj?.subject_name}
                                    </div>
                                    {entry.grade_section && (
                                      <div className="text-xs text-gray-600">
                                        {entry.grade_section}
                                      </div>
                                    )}
                                    {entry.room_number && (
                                      <div className="text-xs">
                                        <FiBook className="inline w-3 h-3" />{" "}
                                        {entry.room_number}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (confirm("Delete?")) {
                                        const token =
                                          localStorage.getItem("accessToken") ||
                                          localStorage.getItem("token");
                                        await fetch(
                                          `http://localhost:8000/api/v1/timetable/entries/${entry.id}`,
                                          {
                                            method: "DELETE",
                                            headers: {
                                              Authorization: `Bearer ${token}`,
                                            },
                                          }
                                        );
                                        toast.success("Deleted");
                                        loadData();
                                      }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-red-600"
                                  >
                                    <FiTrash2 />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <button
                            onClick={() => {
                              setFormData({
                                ...formData,
                                time_slot_id: slot.id,
                                day_of_week: i + 1,
                              });
                              setIsAddModalOpen(true);
                            }}
                            className="w-full min-h-[80px] text-gray-400 hover:text-indigo-600"
                          >
                            <FiPlus className="w-5 h-5 mx-auto" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between mb-6">
                <h3 className="text-lg font-medium">
                  {editingEntry ? "Edit" : "Add"} Lesson
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-400 text-2xl"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Subject *
                  </label>
                  <select
                    value={formData.subject_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subject_id: parseInt(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.subject_name} - {s.grade}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Day *
                    </label>
                    <select
                      value={formData.day_of_week}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          day_of_week: parseInt(e.target.value),
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    >
                      {DAYS.map((d, i) => (
                        <option key={d} value={i + 1}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Time *
                    </label>
                    <select
                      value={formData.time_slot_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          time_slot_id: parseInt(e.target.value),
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    >
                      {timeSlots.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.start_time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Room
                    </label>
                    <input
                      type="text"
                      value={formData.room_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          room_number: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Section
                    </label>
                    <input
                      type="text"
                      value={formData.grade_section}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          grade_section: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={2}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <input
                    type="checkbox"
                    id="double"
                    checked={formData.is_double_lesson}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_double_lesson: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <label htmlFor="double" className="ml-2 text-sm">
                    Double Lesson
                  </label>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 px-4 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg"
                  >
                    {editingEntry ? "Update" : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetablePage;
