import {
  useCallback,
  useEffect,
  useState,
} from "react";
import api from "../services/api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);

  const [initialLoading, setInitialLoading] =
    useState(true);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] =
    useState(null);
  const [markAllLoading, setMarkAllLoading] =
    useState(false);

  // ===============================
  // FETCH NOTIFICATIONS
  // ===============================

  const fetchNotifications = useCallback(
    async () => {
      try {
        setError("");
        setLoading(true);

        const response = await api.get(
          "/notifications"
        );

        setNotifications(
          response.data?.notifications || []
        );
      } catch (error) {
        console.error(
          "Notifications Error:",
          error.response?.data ||
            error.message
        );

        setError(
          error.response?.data?.message ||
            "Failed to load notifications."
        );
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    []
  );

  // ===============================
  // INITIAL LOAD
  // ===============================

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ===============================
  // MARK ONE AS READ
  // ===============================

  const handleMarkAsRead = async (
    notification
  ) => {
    if (
      notification.isRead ||
      actionLoading ||
      markAllLoading
    ) {
      return;
    }

    setActionLoading(notification._id);
    setError("");

    try {
      await api.patch(
        `/notifications/${notification._id}/read`
      );

      setNotifications(
        (currentNotifications) =>
          currentNotifications.map((item) =>
            item._id === notification._id
              ? {
                  ...item,
                  isRead: true,
                }
              : item
          )
      );
    } catch (error) {
      console.error(
        "Mark Notification Read Error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to mark notification as read."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ===============================
  // MARK ALL AS READ
  // ===============================

  const handleMarkAllAsRead = async () => {
    const hasUnreadNotifications =
      notifications.some(
        (notification) =>
          !notification.isRead
      );

    if (
      !hasUnreadNotifications ||
      markAllLoading ||
      actionLoading
    ) {
      return;
    }

    setMarkAllLoading(true);
    setError("");

    try {
      await api.patch(
        "/notifications/read-all"
      );

      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (notification) => ({
              ...notification,
              isRead: true,
            })
          )
      );
    } catch (error) {
      console.error(
        "Mark All Notifications Read Error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to mark all notifications as read."
      );
    } finally {
      setMarkAllLoading(false);
    }
  };

  const hasUnreadNotifications =
    notifications.some(
      (notification) =>
        !notification.isRead
    );

  // ===============================
  // INITIAL LOADING
  // ===============================

  if (initialLoading) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="rounded-2xl bg-white px-8 py-6 text-center shadow-md">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-sm font-medium text-slate-600">
            Loading Notifications...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Notifications
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              View your notifications
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={fetchNotifications}
              disabled={
                loading ||
                markAllLoading ||
                !!actionLoading
              }
              className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={
                !hasUnreadNotifications ||
                markAllLoading ||
                loading ||
                !!actionLoading
              }
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {markAllLoading
                ? "Updating..."
                : "Mark All as Read"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
          >
            {error}
          </div>
        )}

        {/* Notifications */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="rounded-xl bg-white p-10 text-center shadow-md">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
                ✓
              </div>

              <p className="mt-4 font-medium text-gray-700">
                No notifications found.
              </p>

              <p className="mt-1 text-sm text-gray-400">
                You're all caught up.
              </p>
            </div>
          ) : (
            notifications.map(
              (notification) => (
                <div
                  key={notification._id}
                  className={`rounded-xl border p-5 shadow-sm ${
                    notification.isRead
                      ? "border-gray-200 bg-white"
                      : "border-blue-200 bg-blue-50/30"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Notification Content */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                        )}

                        <h2 className="font-semibold text-gray-800">
                          {notification.title}
                        </h2>
                      </div>

                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        {notification.message}
                      </p>

                      <p className="mt-2 text-xs text-gray-400">
                        Type:{" "}
                        {notification.type}
                      </p>
                    </div>

                    {/* Status + Action */}
                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          notification.isRead
                            ? "bg-gray-100 text-gray-600"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {notification.isRead
                          ? "Read"
                          : "Unread"}
                      </span>

                      {!notification.isRead && (
                        <button
                          type="button"
                          onClick={() =>
                            handleMarkAsRead(
                              notification
                            )
                          }
                          disabled={
                            actionLoading ===
                              notification._id ||
                            markAllLoading ||
                            loading
                          }
                          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionLoading ===
                          notification._id
                            ? "Updating..."
                            : "Mark as Read"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default Notifications;