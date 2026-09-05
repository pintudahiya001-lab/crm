import {
  LayoutDashboard,
  Users,
  UserRoundCog,
  Ticket,
  Bell,
  ClipboardList,
  LogOut,
} from "lucide-react";
import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { useState } from "react";
import api from "../services/api";

function DashboardLayout() {
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] =
    useState(false);

  // ===============================
  // GET LOGGED-IN USER
  // ===============================

  const storedUser =
    localStorage.getItem("user");

  let currentUser = null;

  try {
    currentUser = storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch (error) {
    console.log(
      "User Data Parse Error:",
      error.message
    );

    currentUser = null;
  }

  const userName =
    currentUser?.name || "User";

  const userEmail =
    currentUser?.email || "";

  const userRole =
    currentUser?.role || "employee";

  const userInitial =
    userName.charAt(0).toUpperCase();

  const displayRole =
    userRole === "admin"
      ? "Administrator"
      : "Employee";

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Customers",
      path: "/customers",
      icon: Users,
    },
    {
      name: "Employees",
      path: "/employees",
      icon: UserRoundCog,
    },
    {
      name: "Tickets",
      path: "/tickets",
      icon: Ticket,
    },
    {
      name: "Notifications",
      path: "/notifications",
      icon: Bell,
    },
    {
      name: "Activity Logs",
      path: "/activity-logs",
      icon: ClipboardList,
    },
  ];

  // ===============================
  // LOGOUT
  // ===============================

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      // Revoke refresh token on server
      await api.post("/auth/logout");
    } catch (error) {
      console.log(
        "Logout Error:",
        error.response?.data ||
          error.message
      );
    } finally {
      // Clear access token
      localStorage.removeItem("token");

      // Clear logged-in user
      localStorage.removeItem("user");

      // Redirect to login
      navigate("/login", {
        replace: true,
      });

      setLoggingOut(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-100">
      <div className="flex h-full">

        {/* Sidebar */}
        <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-gray-900 text-white">

          {/* Logo */}
          <div className="border-b border-gray-800 px-6 py-5">
            <h1 className="text-2xl font-bold tracking-wide">
              CRM
            </h1>

            <p className="mt-1 text-xs text-gray-400">
              Customer Management
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Main Menu
            </p>

            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon =
                  item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({
                      isActive,
                    }) =>
                      `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`
                    }
                  >
                    <Icon
                      size={20}
                      strokeWidth={2}
                    />

                    <span>
                      {item.name}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </nav>

          {/* Logout */}
          <div className="border-t border-gray-800 p-4">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut
                size={20}
                strokeWidth={2}
              />

              <span>
                {loggingOut
                  ? "Logging out..."
                  : "Logout"}
              </span>
            </button>
          </div>
        </aside>

        {/* Right Side */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Top Navbar */}
          <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">

              {/* Left */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  CRM Management
                </h2>

                <p className="text-sm text-gray-500">
                  Manage your CRM system
                </p>
              </div>

              {/* User */}
              <div className="flex items-center gap-3">

                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                  {userInitial}
                </div>

                {/* User Details */}
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800">
                    {userName}
                  </p>

                  <p className="text-xs text-gray-500">
                    {userEmail}
                  </p>

                  <p className="mt-0.5 text-xs font-medium capitalize text-blue-600">
                    {displayRole}
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;