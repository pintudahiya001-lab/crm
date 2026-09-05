import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      setError("");
      setLoading(true);

      const response = await api.get("/dashboard");

      if (!response.data) {
        throw new Error("Dashboard data was not received.");
      }

      setDashboard(response.data);
    } catch (error) {
      console.error(
        "Dashboard Error:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="rounded-2xl bg-white px-8 py-6 text-center shadow-md">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-sm font-medium text-slate-600">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl font-bold text-red-600">
            !
          </div>

          <h1 className="mt-4 text-xl font-bold text-slate-800">
            Unable to Load Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchDashboard}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              CRM Dashboard
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Overview of your CRM system
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDashboard}
            className="self-start rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total Customers */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-sm font-medium text-gray-500">
              Total Customers
            </p>

            <h2 className="mt-3 text-4xl font-bold text-blue-600">
              {dashboard?.customers?.total ?? 0}
            </h2>
          </div>

          {/* Total Employees */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-sm font-medium text-gray-500">
              Total Employees
            </p>

            <h2 className="mt-3 text-4xl font-bold text-green-600">
              {dashboard?.employees?.total ?? 0}
            </h2>
          </div>

          {/* Total Tickets */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-sm font-medium text-gray-500">
              Total Tickets
            </p>

            <h2 className="mt-3 text-4xl font-bold text-purple-600">
              {dashboard?.tickets?.total ?? 0}
            </h2>
          </div>

          {/* Active Customers */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-sm font-medium text-gray-500">
              Active Customers
            </p>

            <h2 className="mt-3 text-4xl font-bold text-emerald-600">
              {dashboard?.customers?.active ?? 0}
            </h2>
          </div>

          {/* Inactive Customers */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-sm font-medium text-gray-500">
              Inactive Customers
            </p>

            <h2 className="mt-3 text-4xl font-bold text-red-600">
              {dashboard?.customers?.inactive ?? 0}
            </h2>
          </div>

          {/* Active Employees */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-sm font-medium text-gray-500">
              Active Employees
            </p>

            <h2 className="mt-3 text-4xl font-bold text-emerald-600">
              {dashboard?.employees?.active ?? 0}
            </h2>
          </div>

          {/* Inactive Employees */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-sm font-medium text-gray-500">
              Inactive Employees
            </p>

            <h2 className="mt-3 text-4xl font-bold text-red-600">
              {dashboard?.employees?.inactive ?? 0}
            </h2>
          </div>

          {/* Open Tickets */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-sm font-medium text-gray-500">
              Open Tickets
            </p>

            <h2 className="mt-3 text-4xl font-bold text-blue-600">
              {dashboard?.tickets?.status?.open ?? 0}
            </h2>
          </div>

          {/* In Progress Tickets */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-sm font-medium text-gray-500">
              In Progress Tickets
            </p>

            <h2 className="mt-3 text-4xl font-bold text-yellow-600">
              {dashboard?.tickets?.status?.["in-progress"] ?? 0}
            </h2>
          </div>

          {/* Resolved Tickets */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-sm font-medium text-gray-500">
              Resolved Tickets
            </p>

            <h2 className="mt-3 text-4xl font-bold text-green-600">
              {dashboard?.tickets?.status?.resolved ?? 0}
            </h2>
          </div>

          {/* Closed Tickets */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-sm font-medium text-gray-500">
              Closed Tickets
            </p>

            <h2 className="mt-3 text-4xl font-bold text-gray-600">
              {dashboard?.tickets?.status?.closed ?? 0}
            </h2>
          </div>

          {/* Low Priority */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-sm font-medium text-gray-500">
              Low Priority
            </p>

            <h2 className="mt-3 text-4xl font-bold text-slate-600">
              {dashboard?.tickets?.priority?.low ?? 0}
            </h2>
          </div>

          {/* Medium Priority */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-sm font-medium text-gray-500">
              Medium Priority
            </p>

            <h2 className="mt-3 text-4xl font-bold text-yellow-600">
              {dashboard?.tickets?.priority?.medium ?? 0}
            </h2>
          </div>

          {/* High Priority */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-sm font-medium text-gray-500">
              High Priority
            </p>

            <h2 className="mt-3 text-4xl font-bold text-orange-600">
              {dashboard?.tickets?.priority?.high ?? 0}
            </h2>
          </div>

          {/* Urgent Priority */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-sm font-medium text-gray-500">
              Urgent Priority
            </p>

            <h2 className="mt-3 text-4xl font-bold text-red-600">
              {dashboard?.tickets?.priority?.urgent ?? 0}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;