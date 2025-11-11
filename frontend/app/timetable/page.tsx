"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  FiCalendar,
  FiClock,
  FiBook,
  FiUser,
  FiMapPin,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiFilter,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiMoreVertical,
} from "react-icons/fi";

interface TimetableEntry {
  id: string;
  subject: string;
  teacher: string;
  classroom: string;
  day: string;
  startTime: string;
  endTime: string;
  color: string;
  type: "lecture" | "practical" | "tutorial" | "exam";
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

const COLORS = [
  "bg-blue-100 border-blue-500 text-blue-800",
  "bg-green-100 border-green-500 text-green-800",
  "bg-purple-100 border-purple-500 text-purple-800",
  "bg-orange-100 border-orange-500 text-orange-800",
  "bg-red-100 border-red-500 text-red-800",
  "bg-indigo-100 border-indigo-500 text-indigo-800",
];

const TimetablePage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([
    {
      id: "1",
      subject: "Mathematics",
      teacher: "Dr. Smith",
      classroom: "Room 101",
      day: "Monday",
      startTime: "09:00",
      endTime: "10:30",
      color: COLORS[0],
      type: "lecture",
    },
    {
      id: "2",
      subject: "Physics",
      teacher: "Prof. Johnson",
      classroom: "Lab 1",
      day: "Tuesday",
      startTime: "11:00",
      endTime: "12:30",
      color: COLORS[1],
      type: "practical",
    },
    {
      id: "3",
      subject: "Chemistry",
      teacher: "Dr. Williams",
      classroom: "Room 203",
      day: "Wednesday",
      startTime: "14:00",
      endTime: "15:30",
      color: COLORS[2],
      type: "tutorial",
    },
  ]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      toast.error("Please login to access the timetable");
      router.push("/login");
      return;
    }

    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, [router]);

  const handleAddEntry = () => {
    setEditingEntry(null);
    setIsAddModalOpen(true);
  };

  const handleEditEntry = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setIsAddModalOpen(true);
  };

  const handleDeleteEntry = (id: string) => {
    setTimetableEntries((prev) => prev.filter((entry) => entry.id !== id));
    toast.success("Class deleted successfully");
  };

  const getEntriesForDay = (day: string) => {
    return timetableEntries.filter(
      (entry) =>
        entry.day === day &&
        (filterType === "all" || entry.type === filterType) &&
        (searchTerm === "" ||
          entry.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.classroom.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const getTimeSlotEntries = (day: string, time: string) => {
    const entries = getEntriesForDay(day);
    return entries.filter((entry) => {
      const entryStart = parseInt(entry.startTime.split(":")[0]);
      const entryEnd = parseInt(entry.endTime.split(":")[0]);
      const slotTime = parseInt(time.split(":")[0]);
      return slotTime >= entryStart && slotTime < entryEnd;
    });
  };

  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset + currentWeek * 7);

    return DAYS.map((_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your timetable...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Timetable
              </h1>
              <p className="text-gray-600">
                Manage your class schedule and timetable
              </p>
            </div>
            <button
              onClick={handleAddEntry}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Add Class
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Week Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentWeek(currentWeek - 1)}
                className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-center">
                <h3 className="font-medium text-gray-900">
                  Week{" "}
                  {currentWeek === 0
                    ? "(Current)"
                    : currentWeek > 0
                    ? `+${currentWeek}`
                    : currentWeek}
                </h3>
                <p className="text-sm text-gray-600">
                  {getCurrentWeekDates()[0].toLocaleDateString()} -{" "}
                  {getCurrentWeekDates()[5].toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => setCurrentWeek(currentWeek + 1)}
                className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-4">
              <div className="flex bg-white rounded-lg p-1 shadow-sm border">
                <button
                  onClick={() => setViewMode("week")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "week"
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Week View
                </button>
                <button
                  onClick={() => setViewMode("day")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "day"
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Day View
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by subject, teacher, or classroom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <FiFilter className="text-gray-400 w-4 h-4" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="lecture">Lectures</option>
                <option value="practical">Practicals</option>
                <option value="tutorial">Tutorials</option>
                <option value="exam">Exams</option>
              </select>
            </div>
          </div>
        </div>

        {/* Timetable Grid */}
        {viewMode === "week" ? (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="grid grid-cols-8 border-b border-gray-200">
              <div className="p-4 font-medium text-gray-900 bg-gray-50">
                Time
              </div>
              {DAYS.map((day, index) => {
                const date = getCurrentWeekDates()[index];
                return (
                  <div
                    key={day}
                    className="p-4 font-medium text-gray-900 bg-gray-50 text-center"
                  >
                    <div>{day}</div>
                    <div className="text-sm text-gray-600 font-normal">
                      {date.getDate()}/{date.getMonth() + 1}
                    </div>
                  </div>
                );
              })}
            </div>

            {TIME_SLOTS.map((time) => (
              <div
                key={time}
                className="grid grid-cols-8 border-b border-gray-100 min-h-[80px]"
              >
                <div className="p-4 font-medium text-gray-900 bg-gray-50 border-r border-gray-200">
                  {time}
                </div>
                {DAYS.map((day) => {
                  const entries = getTimeSlotEntries(day, time);
                  return (
                    <div
                      key={`${day}-${time}`}
                      className="p-2 border-r border-gray-100 relative"
                    >
                      {entries.map((entry) => (
                        <div
                          key={entry.id}
                          className={`p-2 rounded-md border-l-4 mb-1 ${entry.color} relative group cursor-pointer`}
                          onClick={() => handleEditEntry(entry)}
                        >
                          <div className="text-sm font-medium">
                            {entry.subject}
                          </div>
                          <div className="text-xs">{entry.teacher}</div>
                          <div className="text-xs">{entry.classroom}</div>
                          <div className="text-xs">
                            {entry.startTime} - {entry.endTime}
                          </div>

                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEntry(entry.id);
                              }}
                              className="p-1 text-red-500 hover:bg-red-100 rounded"
                            >
                              <FiTrash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          /* Day View */
          <div className="bg-white rounded-lg shadow-sm border">
            {/* Day Selector */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex space-x-2 overflow-x-auto">
                {DAYS.map((day, index) => {
                  const date = getCurrentWeekDates()[index];
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                        selectedDay === day
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <div className="font-medium">{day}</div>
                      <div className="text-xs">
                        {date.getDate()}/{date.getMonth() + 1}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day Schedule */}
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedDay} Schedule
              </h3>

              <div className="space-y-3">
                {getEntriesForDay(selectedDay).length > 0 ? (
                  getEntriesForDay(selectedDay)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((entry) => (
                      <div
                        key={entry.id}
                        className={`p-4 rounded-lg border-l-4 ${entry.color} group cursor-pointer hover:shadow-md transition-shadow`}
                        onClick={() => handleEditEntry(entry)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-2">
                              <h4 className="font-medium text-lg">
                                {entry.subject}
                              </h4>
                              <span className="px-2 py-1 text-xs bg-gray-100 rounded-full capitalize">
                                {entry.type}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              <div className="flex items-center">
                                <FiClock className="w-4 h-4 mr-2" />
                                {entry.startTime} - {entry.endTime}
                              </div>
                              <div className="flex items-center">
                                <FiUser className="w-4 h-4 mr-2" />
                                {entry.teacher}
                              </div>
                              <div className="flex items-center">
                                <FiMapPin className="w-4 h-4 mr-2" />
                                {entry.classroom}
                              </div>
                            </div>
                          </div>

                          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEntry(entry);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEntry(entry.id);
                              }}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FiCalendar className="w-12 h-12 mx-auto mb-4" />
                    <p>No classes scheduled for {selectedDay}</p>
                    <button
                      onClick={handleAddEntry}
                      className="mt-4 text-indigo-600 hover:text-indigo-700"
                    >
                      Add a class
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium">
                  {editingEntry ? "Edit Class" : "Add New Class"}
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="Enter subject name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teacher
                  </label>
                  <input
                    type="text"
                    placeholder="Enter teacher name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classroom
                  </label>
                  <input
                    type="text"
                    placeholder="Enter classroom/location"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Day
                    </label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500">
                      {DAYS.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="lecture">Lecture</option>
                      <option value="practical">Practical</option>
                      <option value="tutorial">Tutorial</option>
                      <option value="exam">Exam</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      toast.success(
                        editingEntry
                          ? "Class updated successfully!"
                          : "Class added successfully!"
                      );
                      setIsAddModalOpen(false);
                    }}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    {editingEntry ? "Update" : "Add Class"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetablePage;
