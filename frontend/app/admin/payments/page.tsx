"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { FiArrowLeft, FiSearch } from "react-icons/fi";

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
  merchant_request_id?: string | null;
  status: string;
  description?: string | null;
  reference?: string | null;
  result_desc?: string | null;
  mpesa_metadata?: Record<string, any> | null;
  created_at: string;
  user: PaymentUser;
}

interface PaymentsResponse {
  items: PaymentItem[];
  page: number;
  limit: number;
  total: number;
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

export default function AdminPaymentsPage() {
  const router = useRouter();

  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const [items, setItems] = useState<PaymentItem[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);

  const [status, setStatus] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(
    null
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      toast.error("Please log in to access admin features");
      router.push("/login");
      return;
    }

    const user = JSON.parse(storedUser);
    setCurrentUserRole(user?.role || null);

    if (user?.role !== "SUPER_ADMIN") {
      toast.error("Super Admin access required");
      router.push("/dashboard");
      return;
    }

    // initial load
    void fetchAll(1, status, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = async (
    nextPage: number,
    nextStatus: string,
    nextQ: string
  ) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      const [statsRes, listRes] = await Promise.all([
        axios.get("/api/v1/admin/payments/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/v1/admin/payments", {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page: nextPage,
            limit,
            status: nextStatus || undefined,
            q: nextQ || undefined,
          },
        }),
      ]);

      setStats(statsRes.data);
      const data: PaymentsResponse = listRes.data;
      setItems(data.items || []);
      setPage(data.page || nextPage);
      setTotal(data.total || 0);
    } catch (e: any) {
      console.error("Failed to load payments:", e);
      toast.error(e?.response?.data?.detail || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const fmtKes = (value: number) => {
    try {
      return `KES ${Number(value || 0).toLocaleString()}`;
    } catch {
      return `KES ${value}`;
    }
  };

  if (currentUserRole !== "SUPER_ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
            >
              <FiArrowLeft /> Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-sm text-gray-500">Total Revenue</div>
            <div className="text-xl font-bold text-gray-900">
              {fmtKes(stats?.total_revenue || 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-sm text-gray-500">Today</div>
            <div className="text-xl font-bold text-gray-900">
              {fmtKes(stats?.revenue_today || 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-sm text-gray-500">This Month</div>
            <div className="text-xl font-bold text-gray-900">
              {fmtKes(stats?.revenue_this_month || 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-sm text-gray-500">Completed</div>
            <div className="text-xl font-bold text-gray-900">
              {stats?.total_completed ?? 0}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="PENDING">PENDING</option>
                <option value="FAILED">FAILED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Phone, Mpesa code, checkout id, email, name..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={() => fetchAll(1, status, q)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Transactions
            </h2>
            <div className="text-sm text-gray-500">
              {total.toLocaleString()} total
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center text-gray-600">
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-600">
              No payments found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Mpesa Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        <div className="font-medium">
                          {p.user?.full_name || "(No name)"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {p.user?.email}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {p.phone_number}
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {fmtKes(p.amount)}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {p.reference || "-"}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {p.transaction_code || "-"}
                      </td>
                      <td className="px-6 py-3 text-sm whitespace-nowrap">
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
                      <td className="px-6 py-3 text-sm whitespace-nowrap">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchAll(Math.max(1, page - 1), status, q)}
                disabled={page <= 1 || loading}
                className={`px-3 py-2 rounded-md text-sm font-semibold ${
                  page <= 1 || loading
                    ? "bg-gray-100 text-gray-400"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Prev
              </button>
              <button
                onClick={() =>
                  fetchAll(Math.min(totalPages, page + 1), status, q)
                }
                disabled={page >= totalPages || loading}
                className={`px-3 py-2 rounded-md text-sm font-semibold ${
                  page >= totalPages || loading
                    ? "bg-gray-100 text-gray-400"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          Tip: Search by M-Pesa code, phone number, user email, or checkout ID.
        </div>

        {/* Details Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Payment Details
                </h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Transaction Code
                    </label>
                    <div className="mt-1 text-sm text-gray-900 font-mono">
                      {selectedPayment.transaction_code || "N/A"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Amount
                    </label>
                    <div className="mt-1 text-sm text-gray-900 font-semibold">
                      {fmtKes(selectedPayment.amount)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Status
                    </label>
                    <div className="mt-1">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          selectedPayment.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : selectedPayment.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : selectedPayment.status === "FAILED"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {selectedPayment.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Date
                    </label>
                    <div className="mt-1 text-sm text-gray-900">
                      {new Date(selectedPayment.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      User
                    </label>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedPayment.user?.full_name} (
                      {selectedPayment.user?.email})
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Phone
                    </label>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedPayment.phone_number}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    M-Pesa Result
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700">
                    {selectedPayment.result_desc ||
                      "No result description available."}
                  </div>
                </div>

                {selectedPayment.mpesa_metadata && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Metadata
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-md overflow-x-auto">
                      <pre className="text-xs text-gray-700">
                        {JSON.stringify(
                          selectedPayment.mpesa_metadata,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Technical Details
                  </h4>
                  <div className="grid grid-cols-1 gap-2 text-xs text-gray-500">
                    <div>
                      Checkout Request ID: {selectedPayment.checkout_request_id}
                    </div>
                    <div>
                      Merchant Request ID:{" "}
                      {selectedPayment.merchant_request_id || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
