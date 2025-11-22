// Additional Dashboard Components
import { useState } from "react";
import { FiBell, FiX, FiBarChart2, FiUsers, FiCheck, FiSettings, FiEye, FiEyeOff } from "react-icons/fi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: "deadline" | "reminder" | "info";
  date: Date;
  read: boolean;
}

export interface AttendanceEntry {
  lessonId: number;
  subjectName: string;
  gradeSection: string;
  timeSlot: string;
  totalStudents: number;
  presentStudents: number;
}

export interface WidgetPreferences {
  weeklyCalendar: boolean;
  quickStats: boolean;
  quickActions: boolean;
  trendGraph: boolean;
  attendance: boolean;
  notifications: boolean;
}

// Notifications Dropdown
export function NotificationsDropdown({
  notifications,
  onClose,
  onMarkRead,
}: {
  notifications: Notification[];
  onClose: () => void;
  onMarkRead: (id: number) => void;
}) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
        <h3 className="font-bold text-gray-900">
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/50 rounded-lg transition-colors"
        >
          <FiX className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FiBell className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                !notif.read ? "bg-indigo-50/50" : ""
              }`}
              onClick={() => onMarkRead(notif.id)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    notif.type === "deadline"
                      ? "bg-red-500"
                      : notif.type === "reminder"
                      ? "bg-amber-500"
                      : "bg-blue-500"
                  }`}
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {notif.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notif.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Trend Graph Widget
export function TrendGraph({ data }: { data: any[] }) {
  return (
    <div className="glass-card bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FiBarChart2 className="w-5 h-5 text-indigo-600" />
          Weekly Trends
        </h3>
        <span className="text-xs text-gray-500">Last 4 weeks</span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="week" style={{ fontSize: "12px" }} stroke="#6b7280" />
          <YAxis style={{ fontSize: "12px" }} stroke="#6b7280" />
          <RechartsTooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Line
            type="monotone"
            dataKey="lessons"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ fill: "#6366f1", r: 4 }}
            name="Total Lessons"
          />
          <Line
            type="monotone"
            dataKey="completed"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", r: 4 }}
            name="Completed"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-indigo-50 p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-indigo-600 rounded-full" />
            <span className="text-xs text-gray-600">Total Lessons</span>
          </div>
          <p className="text-2xl font-bold text-indigo-600">
            {data[data.length - 1]?.lessons || 0}
          </p>
        </div>
        <div className="bg-green-50 p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-green-600 rounded-full" />
            <span className="text-xs text-gray-600">Completed</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {data[data.length - 1]?.completed || 0}
          </p>
        </div>
      </div>
    </div>
  );
}

// Attendance Quick Entry Widget
export function AttendanceWidget({
  data,
  onMarkAttendance,
}: {
  data: AttendanceEntry[];
  onMarkAttendance: (lessonId: number, present: number) => void;
}) {
  return (
    <div className="glass-card bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FiUsers className="w-5 h-5 text-indigo-600" />
          Quick Attendance
        </h3>
        <span className="text-xs text-gray-500">Today's Classes</span>
      </div>

      <div className="space-y-3">
        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiUsers className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No classes today</p>
          </div>
        ) : (
          data.map((entry) => (
            <div
              key={entry.lessonId}
              className="bg-white p-4 rounded-xl border border-gray-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {entry.subjectName}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {entry.gradeSection} • {entry.timeSlot}
                  </p>
                </div>
                {entry.presentStudents > 0 && (
                  <FiCheck className="w-5 h-5 text-green-600" />
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={entry.totalStudents}
                  value={entry.presentStudents}
                  onChange={(e) =>
                    onMarkAttendance(
                      entry.lessonId,
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0"
                />
                <span className="text-sm text-gray-600">
                  / {entry.totalStudents} students
                </span>
                <div className="ml-auto">
                  <div
                    className="text-xs font-semibold px-2 py-1 rounded-lg"
                    style={{
                      background:
                        entry.presentStudents === 0
                          ? "#fef3c7"
                          : entry.presentStudents >= entry.totalStudents * 0.9
                          ? "#d1fae5"
                          : entry.presentStudents >= entry.totalStudents * 0.75
                          ? "#dbeafe"
                          : "#fee2e2",
                      color:
                        entry.presentStudents === 0
                          ? "#92400e"
                          : entry.presentStudents >= entry.totalStudents * 0.9
                          ? "#065f46"
                          : entry.presentStudents >= entry.totalStudents * 0.75
                          ? "#1e40af"
                          : "#991b1b",
                    }}
                  >
                    {entry.totalStudents > 0
                      ? `${Math.round(
                          (entry.presentStudents / entry.totalStudents) * 100
                        )}%`
                      : "0%"}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {data.length > 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
          <p className="text-xs text-gray-600 text-center">
            📊 Average attendance:{" "}
            {data.length > 0
              ? Math.round(
                  (data.reduce(
                    (sum, e) => sum + (e.totalStudents > 0 ? (e.presentStudents / e.totalStudents) * 100 : 0),
                    0
                  ) /
                    data.length)
                )
              : 0}
            %
          </p>
        </div>
      )}
    </div>
  );
}

// Customization Panel
export function CustomizationPanel({
  preferences,
  onSave,
  onClose,
}: {
  preferences: WidgetPreferences;
  onSave: (prefs: WidgetPreferences) => void;
  onClose: () => void;
}) {
  const [localPrefs, setLocalPrefs] = useState(preferences);

  const widgets = [
    { key: "weeklyCalendar" as keyof WidgetPreferences, label: "Weekly Calendar", icon: "📅" },
    { key: "quickStats" as keyof WidgetPreferences, label: "Quick Stats", icon: "📊" },
    { key: "quickActions" as keyof WidgetPreferences, label: "Quick Actions", icon: "⚡" },
    { key: "trendGraph" as keyof WidgetPreferences, label: "Trend Graph", icon: "📈" },
    { key: "attendance" as keyof WidgetPreferences, label: "Attendance", icon: "👥" },
  ];

  const handleSave = () => {
    onSave(localPrefs);
    onClose();
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-t border-indigo-200 p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FiSettings className="w-5 h-5 text-indigo-600" />
            Customize Dashboard
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/50 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {widgets.map((widget) => (
            <button
              key={widget.key}
              onClick={() =>
                setLocalPrefs({
                  ...localPrefs,
                  [widget.key]: !localPrefs[widget.key],
                })
              }
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                localPrefs[widget.key]
                  ? "bg-white border-indigo-500 shadow-lg"
                  : "bg-white/60 border-gray-200 opacity-50"
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{widget.icon}</div>
                <p className="text-sm font-semibold text-gray-900">
                  {widget.label}
                </p>
                <div className="mt-2 flex items-center justify-center gap-1">
                  {localPrefs[widget.key] ? (
                    <FiEye className="w-4 h-4 text-green-600" />
                  ) : (
                    <FiEyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors shadow-lg"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
