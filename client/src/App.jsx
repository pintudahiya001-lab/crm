import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Customers from "./pages/Customers.jsx";
import Employees from "./pages/Employees.jsx";
import Tickets from "./pages/Tickets.jsx";
import Notifications from "./pages/Notifications.jsx";
import ActivityLogs from "./pages/ActivityLogs.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <p className="text-6xl font-bold text-blue-600">
          404
        </p>

        <h1 className="mt-4 text-2xl font-bold text-slate-800">
          Page Not Found
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          The page you are looking for does not exist.
        </p>

        <a
          href="/dashboard"
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Root Route */}
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      {/* Public Route */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/customers"
            element={<Customers />}
          />

          <Route
            path="/employees"
            element={<Employees />}
          />

          <Route
            path="/tickets"
            element={<Tickets />}
          />

          <Route
            path="/notifications"
            element={<Notifications />}
          />

          <Route
            path="/activity-logs"
            element={<ActivityLogs />}
          />
        </Route>
      </Route>

      {/* Unknown Routes */}
      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  );
}

export default App;