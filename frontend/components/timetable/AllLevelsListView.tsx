"use client";
import React from "react";
import { FiClock, FiBook, FiEdit, FiTrash2, FiMapPin } from "react-icons/fi";

interface AllLevelsListViewProps {
  entries: any[];
  subjects: any[];
  timeSlots: any[];
  onEdit: (entry: any) => void;
  onDelete: (entryId: number) => void;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const getSubjectTheme = (subjectName: string) => {
  const name = subjectName?.toLowerCase() || "";

  // Mathematics & Sciences
  if (name.includes("math"))
    return { color: "blue", icon: "🔢", gradient: "from-blue-500 to-cyan-500" };
  if (name.includes("physics"))
    return {
      color: "indigo",
      icon: "⚛️",
      gradient: "from-indigo-500 to-purple-500",
    };
  if (name.includes("chemistry"))
    return {
      color: "green",
      icon: "🧪",
      gradient: "from-green-500 to-emerald-500",
    };
  if (name.includes("biology") || name.includes("science"))
    return {
      color: "emerald",
      icon: "🌿",
      gradient: "from-emerald-500 to-teal-500",
    };

  // Languages
  if (name.includes("english"))
    return { color: "rose", icon: "📖", gradient: "from-rose-500 to-pink-500" };
  if (name.includes("kiswahili") || name.includes("swahili"))
    return {
      color: "amber",
      icon: "🗣️",
      gradient: "from-amber-500 to-orange-500",
    };
  if (name.includes("french") || name.includes("german"))
    return {
      color: "purple",
      icon: "🌐",
      gradient: "from-purple-500 to-fuchsia-500",
    };

  // Social Sciences
  if (name.includes("history"))
    return {
      color: "yellow",
      icon: "🏛️",
      gradient: "from-yellow-600 to-amber-600",
    };
  if (name.includes("geography") || name.includes("social"))
    return { color: "teal", icon: "🌍", gradient: "from-teal-500 to-cyan-500" };

  // Arts & PE
  if (name.includes("art"))
    return { color: "pink", icon: "🎨", gradient: "from-pink-500 to-rose-500" };
  if (name.includes("music"))
    return {
      color: "violet",
      icon: "🎵",
      gradient: "from-violet-500 to-purple-500",
    };
  if (name.includes("physical") || name.includes("p.e"))
    return {
      color: "lime",
      icon: "⚽",
      gradient: "from-lime-500 to-green-500",
    };

  // Technology & Computer
  if (name.includes("computer") || name.includes("ict"))
    return {
      color: "slate",
      icon: "💻",
      gradient: "from-slate-600 to-gray-700",
    };

  // Business
  if (name.includes("business") || name.includes("commerce"))
    return { color: "sky", icon: "💼", gradient: "from-sky-500 to-blue-500" };

  // Religious
  if (name.includes("religious") || name.includes("cre"))
    return {
      color: "indigo",
      icon: "📿",
      gradient: "from-indigo-600 to-blue-600",
    };

  // Default
  return { color: "gray", icon: "📚", gradient: "from-gray-500 to-slate-500" };
};

export default function AllLevelsListView({
  entries,
  subjects,
  timeSlots,
  onEdit,
  onDelete,
}: AllLevelsListViewProps) {
  // Create a map of time slot IDs to their details
  const timeSlotMap = new Map(timeSlots.map((slot) => [slot.id, slot]));

  // Group entries by day
  const entriesByDay = DAYS.map((day, dayIndex) => {
    const dayEntries = (Array.isArray(entries) ? entries : [])
      .filter((entry) => entry.day_of_week === dayIndex + 1)
      .map((entry) => {
        const subject = subjects.find((s) => s.id === entry.subject_id);
        const timeSlot = timeSlotMap.get(entry.time_slot_id);
        return { ...entry, subject, timeSlot };
      })
      .filter((entry) => entry.timeSlot) // Only show entries with valid time slots
      .sort((a, b) => {
        // Sort by start time
        if (!a.timeSlot || !b.timeSlot) return 0;
        return a.timeSlot.start_time.localeCompare(b.timeSlot.start_time);
      });

    return { day, dayIndex: dayIndex + 1, entries: dayEntries };
  });

  // Check if there are any entries
  const hasEntries = entriesByDay.some((d) => d.entries.length > 0);

  if (!hasEntries) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          No Lessons Scheduled
        </h3>
        <p className="text-gray-600 mb-4">
          You haven't added any lessons to your timetable yet across any
          education level.
        </p>
        <p className="text-sm text-gray-500">
          Click the "+ Add Lesson" button to start building your timetable.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {entriesByDay.map(({ day, dayIndex, entries: dayEntries }) => (
        <div
          key={day}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {/* Day Header */}
          <div
            className={`px-6 py-4 bg-gradient-to-r ${
              dayIndex === 1
                ? "from-blue-500 to-indigo-500"
                : dayIndex === 2
                ? "from-indigo-500 to-purple-500"
                : dayIndex === 3
                ? "from-purple-500 to-violet-500"
                : dayIndex === 4
                ? "from-violet-500 to-pink-500"
                : "from-pink-500 to-rose-500"
            }`}
          >
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FiClock className="w-5 h-5" />
              {day}
              {dayEntries.length > 0 && (
                <span className="ml-auto text-sm bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  {dayEntries.length} lesson{dayEntries.length !== 1 ? "s" : ""}
                </span>
              )}
            </h3>
          </div>

          {/* Lessons List */}
          {dayEntries.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {dayEntries.map((entry) => {
                const theme = getSubjectTheme(
                  entry.subject?.subject_name || ""
                );

                return (
                  <div
                    key={entry.id}
                    className="p-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Time */}
                      <div className="flex-shrink-0 text-center">
                        <div className="text-sm font-bold text-gray-900">
                          {entry.timeSlot?.start_time}
                        </div>
                        <div className="text-xs text-gray-500">
                          {entry.timeSlot?.end_time}
                        </div>
                        {entry.is_double_lesson && (
                          <div className="mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                            Double
                          </div>
                        )}
                      </div>

                      {/* Subject Icon */}
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-2xl shadow-md`}
                      >
                        {theme.icon}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">
                          {entry.subject?.subject_name || "Unknown Subject"}
                        </h4>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm">
                          {/* Education Level Badge */}
                          {entry.subject?.education_level && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md font-medium text-xs bg-${theme.color}-100 text-${theme.color}-700 border border-${theme.color}-200`}
                            >
                              {entry.subject.education_level}
                            </span>
                          )}

                          {/* Grade */}
                          {entry.grade_section && (
                            <span className="inline-flex items-center gap-1 text-gray-600">
                              <FiBook className="w-3 h-3" />
                              {entry.grade_section}
                            </span>
                          )}

                          {/* Room */}
                          {entry.room_number && (
                            <span className="inline-flex items-center gap-1 text-gray-600">
                              <FiMapPin className="w-3 h-3" />
                              Room {entry.room_number}
                            </span>
                          )}
                        </div>

                        {/* Notes */}
                        {entry.notes && (
                          <p className="mt-1 text-xs text-gray-500 italic truncate">
                            {entry.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(entry);
                          }}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          title="Edit"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(entry.id);
                          }}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">☕</div>
              <p className="text-sm">No lessons scheduled for {day}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
