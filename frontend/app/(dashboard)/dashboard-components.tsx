// Additional Dashboard Components
import { useState } from "react";
import { 
  FiBell, 
  FiX, 
  FiBarChart2, 
  FiUsers, 
  FiCheck, 
  FiSettings, 
  FiEye, 
  FiEyeOff, 
  FiTarget,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiCalendar,
  FiPieChart,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
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
  curriculumProgress?: boolean;
  upcomingDeadlines?: boolean;
  teachingInsights?: boolean;
}

export interface SubjectProgress {
  id: number;
  subjectName: string;
  grade: string;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  estimatedCompletionDate: Date;
  status: "ahead" | "on-track" | "behind";
}

export interface DeadlineItem {
  id: number;
  title: string;
  date: Date;
  type: "scheme" | "assessment" | "report" | "other";
  daysUntil: number;
}

export interface TeachingInsight {
  mostTaughtSubjects: { subject: string; count: number; color: string }[];
  averageLessonDuration: number;
  peakTeachingHours: { hour: string; count: number }[];
  weeklyComparison: { week: string; lessons: number }[];
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
    { key: "curriculumProgress" as keyof WidgetPreferences, label: "Curriculum Progress", icon: "🎯" },
    { key: "upcomingDeadlines" as keyof WidgetPreferences, label: "Deadlines", icon: "📅" },
    { key: "teachingInsights" as keyof WidgetPreferences, label: "Insights", icon: "📊" },
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

// Curriculum Progress Tracker Widget
export function CurriculumProgressTracker({
  subjects,
}: {
  subjects: SubjectProgress[];
}) {
  const getMilestoneIcon = (percentage: number) => {
    if (percentage >= 100) return "🏆";
    if (percentage >= 75) return "🎯";
    if (percentage >= 50) return "⭐";
    if (percentage >= 25) return "🌱";
    return "🔵";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ahead": return "text-green-600 bg-green-50";
      case "on-track": return "text-blue-600 bg-blue-50";
      case "behind": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ahead": return <FiCheckCircle className="w-4 h-4" />;
      case "on-track": return <FiTarget className="w-4 h-4" />;
      case "behind": return <FiAlertCircle className="w-4 h-4" />;
      default: return <FiClock className="w-4 h-4" />;
    }
  };

  return (
    <div className="glass-card bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FiTarget className="w-5 h-5 text-indigo-600" />
          Curriculum Progress
        </h3>
        <span className="text-xs text-gray-500">
          {subjects.length} {subjects.length === 1 ? "Subject" : "Subjects"}
        </span>
      </div>

      <div className="space-y-4">
        {subjects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiTarget className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No subjects tracked yet</p>
          </div>
        ) : (
          subjects.map((subject) => (
            <div
              key={subject.id}
              className="bg-white p-4 rounded-xl border border-gray-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">
                      {getMilestoneIcon(subject.progressPercentage)}
                    </span>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {subject.subjectName}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {subject.grade}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {subject.completedLessons} of {subject.totalLessons} lessons completed
                  </p>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(subject.status)}`}>
                  {getStatusIcon(subject.status)}
                  <span className="capitalize">{subject.status}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                  style={{ width: `${subject.progressPercentage}%` }}
                />
                {/* Milestone markers */}
                <div className="absolute top-0 left-1/4 w-0.5 h-full bg-white/50" />
                <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white/50" />
                <div className="absolute top-0 left-3/4 w-0.5 h-full bg-white/50" />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-indigo-600">
                    {Math.round(subject.progressPercentage)}%
                  </span>
                  <div className="flex gap-1">
                    <span className={subject.progressPercentage >= 25 ? "text-green-500" : "text-gray-300"}>25%</span>
                    <span className={subject.progressPercentage >= 50 ? "text-green-500" : "text-gray-300"}>50%</span>
                    <span className={subject.progressPercentage >= 75 ? "text-green-500" : "text-gray-300"}>75%</span>
                    <span className={subject.progressPercentage >= 100 ? "text-green-500" : "text-gray-300"}>100%</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <FiCalendar className="w-3 h-3" />
                  <span>
                    Est: {new Date(subject.estimatedCompletionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {subjects.length > 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Overall Progress:</span>
            <span className="font-bold text-indigo-600">
              {Math.round(
                subjects.reduce((sum, s) => sum + s.progressPercentage, 0) /
                  subjects.length
              )}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Upcoming Deadlines Widget
export function UpcomingDeadlinesWidget({
  deadlines,
}: {
  deadlines: DeadlineItem[];
}) {
  const getDeadlineIcon = (type: string) => {
    switch (type) {
      case "scheme": return "📋";
      case "assessment": return "📝";
      case "report": return "📊";
      default: return "📅";
    }
  };

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil <= 3) return "bg-red-50 border-red-200 text-red-700";
    if (daysUntil <= 7) return "bg-amber-50 border-amber-200 text-amber-700";
    return "bg-blue-50 border-blue-200 text-blue-700";
  };

  const sortedDeadlines = [...deadlines].sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="glass-card bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FiCalendar className="w-5 h-5 text-indigo-600" />
          📅 Upcoming Deadlines
        </h3>
        <span className="text-xs text-gray-500">
          {sortedDeadlines.filter(d => d.daysUntil <= 14).length} this month
        </span>
      </div>

      <div className="space-y-2">
        {sortedDeadlines.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiCalendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No upcoming deadlines</p>
          </div>
        ) : (
          sortedDeadlines.slice(0, 5).map((deadline) => (
            <div
              key={deadline.id}
              className={`p-3 rounded-xl border-2 ${getUrgencyColor(deadline.daysUntil)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getDeadlineIcon(deadline.type)}</span>
                  <div>
                    <h4 className="font-semibold text-sm">{deadline.title}</h4>
                    <p className="text-xs opacity-75">
                      {new Date(deadline.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {deadline.daysUntil === 0 ? "Today" : 
                     deadline.daysUntil === 1 ? "Tomorrow" :
                     `${deadline.daysUntil}d`}
                  </div>
                  {deadline.daysUntil <= 3 && (
                    <div className="text-xs font-semibold">Urgent!</div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {sortedDeadlines.length > 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
          <p className="text-xs text-gray-600 text-center">
            🔔 {sortedDeadlines.filter(d => d.daysUntil <= 7).length} deadlines in the next week
          </p>
        </div>
      )}
    </div>
  );
}

// Teaching Insights/Analytics Widget
export function TeachingInsightsWidget({
  insights,
}: {
  insights: TeachingInsight;
}) {
  const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

  return (
    <div className="glass-card bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FiPieChart className="w-5 h-5 text-indigo-600" />
          Teaching Insights
        </h3>
        <span className="text-xs text-gray-500">This Month</span>
      </div>

      {/* Most Taught Subjects - Pie Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Subject Distribution</h4>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="40%" height={120}>
            <PieChart>
              <Pie
                data={insights.mostTaughtSubjects}
                dataKey="count"
                nameKey="subject"
                cx="50%"
                cy="50%"
                outerRadius={50}
                label={false}
              >
                {insights.mostTaughtSubjects.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-1">
            {insights.mostTaughtSubjects.slice(0, 4).map((subject, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: subject.color || COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-gray-700">{subject.subject}</span>
                </div>
                <span className="font-semibold text-gray-900">{subject.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <FiClock className="w-4 h-4 text-indigo-600" />
            <span className="text-xs text-gray-600">Avg Duration</span>
          </div>
          <p className="text-2xl font-bold text-indigo-600">
            {insights.averageLessonDuration} min
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <FiTarget className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-gray-600">Peak Hour</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {insights.peakTeachingHours[0]?.hour || "N/A"}
          </p>
        </div>
      </div>

      {/* Peak Teaching Hours - Bar Chart */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Peak Teaching Hours</h4>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={insights.peakTeachingHours.slice(0, 5)}>
            <XAxis dataKey="hour" style={{ fontSize: "10px" }} />
            <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
        <p className="text-xs text-gray-600 text-center">
          📈 {insights.mostTaughtSubjects.reduce((sum, s) => sum + s.count, 0)} lessons taught this month
        </p>
      </div>
    </div>
  );
}
