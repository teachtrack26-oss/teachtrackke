"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiBook,
  FiUsers,
  FiUpload,
  FiDatabase,
  FiSettings,
  FiArrowRight,
  FiClock,
} from "react-icons/fi";

interface CurriculumTemplate {
  id: number;
  subject: string;
  grade: string;
  education_level: string;
  is_active: boolean;
  updated_at?: string;
}

interface User {
  id: number;
  email: string;
  full_name: string;
  role: "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER";
}

interface PricingPlanConfig {
  label: string;
  price_kes: number;
  duration_label: string;
}

interface PricingConfig {
  currency: string;
  termly: PricingPlanConfig;
  yearly: PricingPlanConfig;
}

interface PaymentUser {
  id: number;
  email: string;
  full_name?: string | null;
}

interface PaymentItem {
  id: number;
  amount: number;
  phone_number: string;
  transaction_code?: string | null;
  checkout_request_id: string;
  status: string;
  reference?: string | null;
  created_at: string;
  user: PaymentUser;
}

interface PaymentStats {
  total_revenue: number;
  revenue_today: number;
  revenue_this_month: number;
  total_completed: number;
  total_pending: number;
  total_failed: number;
  total_cancelled: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [templates, setTemplates] = useState<CurriculumTemplate[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(
    null
  );
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingSaving, setPricingSaving] = useState(false);

  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<PaymentItem[]>([]);

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  useEffect(() => {
    // Get current user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);

      // Check if user has admin access
      if (user.role !== "SUPER_ADMIN" && user.role !== "SCHOOL_ADMIN") {
        toast.error("Access denied. Admin privileges required.");
        router.push("/dashboard");
        return;
      }
    } else {
      toast.error("Please log in to access admin features");
      router.push("/login");
      return;
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      // Fetch templates
      const templatesRes = await axios.get("/api/v1/curriculum-templates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const templatesData = Array.isArray(templatesRes.data)
        ? templatesRes.data
        : templatesRes.data.templates || [];
      setTemplates(templatesData);

      // Fetch platform pricing (Super Admin only)
      if (parsedUser?.role === "SUPER_ADMIN") {
        try {
          setPricingLoading(true);
          const pricingRes = await axios.get("/api/v1/admin/pricing-config", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setPricingConfig(pricingRes.data);
        } catch (e) {
          console.error("Failed to fetch pricing config:", e);
        } finally {
          setPricingLoading(false);
        }

        // Fetch payments overview (Super Admin only)
        try {
          const [statsRes, paymentsRes] = await Promise.all([
            axios.get("/api/v1/admin/payments/stats", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get("/api/v1/admin/payments", {
              headers: { Authorization: `Bearer ${token}` },
              params: { page: 1, limit: 5 },
            }),
          ]);

          setPaymentStats(statsRes.data);
          setRecentPayments(paymentsRes.data?.items || []);
        } catch (e) {
          console.error("Failed to fetch payments overview:", e);
        }
      }

      // Fetch users (if endpoint exists, otherwise mock or skip)
      // For now we'll just keep the empty array or try to fetch if there's an endpoint
      // Assuming there might be a users endpoint, but if not we handle gracefully
      try {
        // Placeholder for user fetch if needed, or keep existing logic
        // const usersRes = await axios.get("/api/v1/users", ...);
        // setUsers(usersRes.data);
      } catch (e) {
        // Ignore user fetch error
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      toast.error("Failed to load admin data");
      setLoading(false);
    }
  };

  const savePricingConfig = async () => {
    if (!pricingConfig) return;
    const token = localStorage.getItem("accessToken");

    // Basic validation
    if (!pricingConfig.termly?.label || !pricingConfig.yearly?.label) {
      toast.error("Plan labels are required");
      return;
    }
    if (
      pricingConfig.termly.price_kes < 0 ||
      pricingConfig.yearly.price_kes < 0 ||
      Number.isNaN(pricingConfig.termly.price_kes) ||
      Number.isNaN(pricingConfig.yearly.price_kes)
    ) {
      toast.error("Prices must be valid numbers");
      return;
    }

    try {
      setPricingSaving(true);
      await axios.put("/api/v1/admin/pricing-config", pricingConfig, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Pricing updated. /pricing will reflect changes.");
    } catch (e: any) {
      console.error("Failed to save pricing config:", e);
      toast.error(e?.response?.data?.detail || "Failed to save pricing");
    } finally {
      setPricingSaving(false);
    }
  };

  // Get 5 most recently updated templates
  const recentTemplates = useMemo(() => {
    return [...templates]
      .sort((a, b) => {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [templates]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            {isSuperAdmin
              ? "System overview and management"
              : "School management overview"}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => router.push("/admin/school-settings")}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-white text-left"
          >
            <FiSettings className="w-8 h-8 mb-2" />
            <h3 className="font-semibold">School Settings</h3>
            <p className="text-sm text-indigo-100 mt-1">
              Configure school details
            </p>
          </button>

          <button
            onClick={() => router.push("/admin/users")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <FiUsers className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900">User Management</h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage teachers & roles
            </p>
          </button>

          {/* Curriculum Management - Super Admin Only */}
          {isSuperAdmin && (
            <button
              onClick={() => router.push("/admin/curriculum")}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
            >
              <FiBook className="w-8 h-8 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900">
                Curriculum Management
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage learning areas
              </p>
            </button>
          )}

          <button
            onClick={() => router.push("/admin/analytics")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <FiDatabase className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-600 mt-1">View usage metrics</p>
          </button>

          {/* Import Curriculum - Super Admin Only */}
          {isSuperAdmin && (
            <button
              onClick={() => router.push("/admin/import-curriculum")}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
            >
              <FiUpload className="w-8 h-8 text-indigo-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Import Curriculum</h3>
              <p className="text-sm text-gray-600 mt-1">Upload JSON files</p>
            </button>
          )}

          {/* Payments - Super Admin Only */}
          {isSuperAdmin && (
            <button
              onClick={() => router.push("/admin/payments")}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
            >
              <FiDatabase className="w-8 h-8 text-emerald-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Payments</h3>
              <p className="text-sm text-gray-600 mt-1">
                Track revenue & transactions
              </p>
            </button>
          )}

          <button
            onClick={() => router.push("/admin/lessons-config")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <FiSettings className="w-8 h-8 text-orange-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Lessons Per Week</h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure lesson frequency
            </p>
          </button>

          {/* Curriculum stats - All Admins */}
          <div className="bg-white p-6 rounded-lg shadow">
            <FiBook className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900">{templates.length}</h3>
            <p className="text-sm text-gray-600 mt-1">Curriculum Templates</p>
          </div>

          {/* Active templates stat - All Admins */}
          <div className="bg-white p-6 rounded-lg shadow">
            <FiDatabase className="w-8 h-8 text-purple-600 mb-2" />
            <h3 className="font-semibold text-gray-900">
              {templates.reduce((sum, t) => sum + (t.is_active ? 1 : 0), 0)}
            </h3>
            <p className="text-sm text-gray-600 mt-1">Active Templates</p>
          </div>
        </div>

        {/* Payments Overview - Super Admin Only */}
        {isSuperAdmin && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Payments Overview
                </h2>
                <p className="text-sm text-gray-500">
                  Recent transactions and revenue.
                </p>
              </div>
              <button
                onClick={() => router.push("/admin/payments")}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
              >
                View All <FiArrowRight className="ml-1" />
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500">Total Revenue</div>
                  <div className="text-xl font-bold text-gray-900">
                    KES{" "}
                    {Number(paymentStats?.total_revenue || 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500">Today</div>
                  <div className="text-xl font-bold text-gray-900">
                    KES{" "}
                    {Number(paymentStats?.revenue_today || 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500">Completed</div>
                  <div className="text-xl font-bold text-gray-900">
                    {paymentStats?.total_completed ?? 0}
                  </div>
                </div>
              </div>

              {recentPayments.length === 0 ? (
                <div className="text-sm text-gray-600">No payments yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                          User
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                            {new Date(p.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            <div className="font-medium">
                              {p.user?.full_name || "(No name)"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {p.user?.email}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm font-semibold text-gray-900 whitespace-nowrap">
                            KES {Number(p.amount || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-sm whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                p.status === "COMPLETED"
                                  ? "bg-green-100 text-green-800"
                                  : p.status === "PENDING"
                                  ? "bg-amber-100 text-amber-800"
                                  : p.status === "FAILED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing Control - Super Admin Only */}
        {isSuperAdmin && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Pricing Control
                </h2>
                <p className="text-sm text-gray-500">
                  Update prices shown on the public pricing page.
                </p>
              </div>
              <button
                onClick={savePricingConfig}
                disabled={pricingLoading || pricingSaving || !pricingConfig}
                className={`px-4 py-2 rounded-md text-sm font-semibold text-white ${
                  pricingLoading || pricingSaving || !pricingConfig
                    ? "bg-gray-400"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {pricingSaving ? "Saving..." : "Save"}
              </button>
            </div>

            <div className="px-6 py-6">
              {pricingLoading ? (
                <div className="text-sm text-gray-600">Loading pricing...</div>
              ) : !pricingConfig ? (
                <div className="text-sm text-gray-600">
                  Pricing config not available (check backend + DB migration).
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Termly</h3>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={pricingConfig.termly.label}
                      onChange={(e) =>
                        setPricingConfig({
                          ...pricingConfig,
                          termly: {
                            ...pricingConfig.termly,
                            label: e.target.value,
                          },
                        })
                      }
                    />

                    <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
                      Price (KES)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={pricingConfig.termly.price_kes}
                      onChange={(e) =>
                        setPricingConfig({
                          ...pricingConfig,
                          termly: {
                            ...pricingConfig.termly,
                            price_kes: Number(e.target.value),
                          },
                        })
                      }
                    />

                    <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
                      Duration Label
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={pricingConfig.termly.duration_label}
                      onChange={(e) =>
                        setPricingConfig({
                          ...pricingConfig,
                          termly: {
                            ...pricingConfig.termly,
                            duration_label: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Yearly</h3>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={pricingConfig.yearly.label}
                      onChange={(e) =>
                        setPricingConfig({
                          ...pricingConfig,
                          yearly: {
                            ...pricingConfig.yearly,
                            label: e.target.value,
                          },
                        })
                      }
                    />

                    <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
                      Price (KES)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={pricingConfig.yearly.price_kes}
                      onChange={(e) =>
                        setPricingConfig({
                          ...pricingConfig,
                          yearly: {
                            ...pricingConfig.yearly,
                            price_kes: Number(e.target.value),
                          },
                        })
                      }
                    />

                    <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
                      Duration Label
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={pricingConfig.yearly.duration_label}
                      onChange={(e) =>
                        setPricingConfig({
                          ...pricingConfig,
                          yearly: {
                            ...pricingConfig.yearly,
                            duration_label: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Activity Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Curriculum Updates
            </h2>
            <button
              onClick={() => router.push("/admin/curriculum")}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
            >
              View All <FiArrowRight className="ml-1" />
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {recentTemplates.length > 0 ? (
              recentTemplates.map((template) => (
                <div
                  key={template.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {template.subject}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {template.grade} • {template.education_level}
                    </p>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <FiClock className="mr-1.5 text-gray-400" />
                    {template.updated_at
                      ? new Date(template.updated_at).toLocaleDateString()
                      : "Unknown date"}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No recent updates found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
