import {
  useCallback,
  useEffect,
  useState,
} from "react";
import api from "../services/api";

function ActivityLogs() {
  const [logs, setLogs] = useState([]);

  const [initialLoading, setInitialLoading] =
    useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [userId, setUserId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [users, setUsers] = useState([]);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
    totalLogs: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // ===============================
  // FETCH USERS
  // ===============================

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get(
        "/employees",
        {
          params: {
            limit: 100,
          },
        }
      );

      setUsers(
        response.data?.employees || []
      );
    } catch (error) {
      console.error(
        "Activity Log Users Error:",
        error.response?.data ||
          error.message
      );
    }
  }, []);

  // ===============================
  // FETCH ACTIVITY LOGS
  // ===============================

  const fetchActivityLogs = useCallback(
    async (
      page = 1,
      searchValue = "",
      actionValue = "",
      entityTypeValue = "",
      userIdValue = "",
      dateFromValue = "",
      dateToValue = ""
    ) => {
      try {
        setError("");
        setLoading(true);

        const response = await api.get(
          "/activity-logs",
          {
            params: {
              search: searchValue.trim(),
              action: actionValue,
              entityType: entityTypeValue,
              userId: userIdValue,
              dateFrom: dateFromValue,
              dateTo: dateToValue,
              page,
              limit: 10,
            },
          }
        );

        setLogs(response.data?.logs || []);

        setPagination(
          response.data?.pagination || {
            currentPage: page,
            limit: 10,
            totalLogs: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          }
        );
      } catch (error) {
        console.error(
          "Activity Logs Error:",
          error.response?.data ||
            error.message
        );

        setError(
          error.response?.data?.message ||
            "Failed to load activity logs."
        );

        setLogs([]);
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
    fetchUsers();

    fetchActivityLogs(
      1,
      "",
      "",
      "",
      "",
      "",
      ""
    );
  }, [fetchUsers, fetchActivityLogs]);

  // ===============================
  // SEARCH
  // ===============================

  const handleSearch = (event) => {
    const value = event.target.value;

    setSearch(value);

    fetchActivityLogs(
      1,
      value,
      action,
      entityType,
      userId,
      dateFrom,
      dateTo
    );
  };

  // ===============================
  // ACTION FILTER
  // ===============================

  const handleActionChange = (event) => {
    const value = event.target.value;

    setAction(value);

    fetchActivityLogs(
      1,
      search,
      value,
      entityType,
      userId,
      dateFrom,
      dateTo
    );
  };

  // ===============================
  // ENTITY FILTER
  // ===============================

  const handleEntityTypeChange = (
    event
  ) => {
    const value = event.target.value;

    setEntityType(value);

    fetchActivityLogs(
      1,
      search,
      action,
      value,
      userId,
      dateFrom,
      dateTo
    );
  };

  // ===============================
  // USER FILTER
  // ===============================

  const handleUserChange = (event) => {
    const value = event.target.value;

    setUserId(value);

    fetchActivityLogs(
      1,
      search,
      action,
      entityType,
      value,
      dateFrom,
      dateTo
    );
  };

  // ===============================
  // DATE FROM
  // ===============================

  const handleDateFromChange = (
    event
  ) => {
    const value = event.target.value;

    setDateFrom(value);

    fetchActivityLogs(
      1,
      search,
      action,
      entityType,
      userId,
      value,
      dateTo
    );
  };

  // ===============================
  // DATE TO
  // ===============================

  const handleDateToChange = (event) => {
    const value = event.target.value;

    setDateTo(value);

    fetchActivityLogs(
      1,
      search,
      action,
      entityType,
      userId,
      dateFrom,
      value
    );
  };

  // ===============================
  // CLEAR FILTERS
  // ===============================

  const handleClearFilters = () => {
    setSearch("");
    setAction("");
    setEntityType("");
    setUserId("");
    setDateFrom("");
    setDateTo("");

    fetchActivityLogs(
      1,
      "",
      "",
      "",
      "",
      "",
      ""
    );
  };

  // ===============================
  // REFRESH
  // ===============================

  const handleRefresh = () => {
    fetchActivityLogs(
      pagination.currentPage || 1,
      search,
      action,
      entityType,
      userId,
      dateFrom,
      dateTo
    );

    fetchUsers();
  };

  // ===============================
  // PREVIOUS PAGE
  // ===============================

  const handlePreviousPage = () => {
    if (
      !pagination.hasPreviousPage ||
      loading
    ) {
      return;
    }

    fetchActivityLogs(
      pagination.currentPage - 1,
      search,
      action,
      entityType,
      userId,
      dateFrom,
      dateTo
    );
  };

  // ===============================
  // NEXT PAGE
  // ===============================

  const handleNextPage = () => {
    if (
      !pagination.hasNextPage ||
      loading
    ) {
      return;
    }

    fetchActivityLogs(
      pagination.currentPage + 1,
      search,
      action,
      entityType,
      userId,
      dateFrom,
      dateTo
    );
  };

  // ===============================
  // LOADING
  // ===============================

  if (initialLoading) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="rounded-2xl bg-white px-8 py-6 text-center shadow-md">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-sm font-medium text-slate-600">
            Loading Activity Logs...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Activity Logs
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Track important CRM activities
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="self-start rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>
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

        {/* Search + Filters */}
        <div className="mb-6 rounded-xl bg-white p-5 shadow-md">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label
                htmlFor="activity-log-search"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Search Activity Logs
              </label>

              <div className="relative">
                <input
                  id="activity-log-search"
                  type="text"
                  value={search}
                  onChange={handleSearch}
                  placeholder="Search by action, entity or description..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                {loading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  </div>
                )}
              </div>
            </div>

            {/* Action */}
            <div>
              <label
                htmlFor="activity-log-action"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Action
              </label>

              <select
                id="activity-log-action"
                value={action}
                onChange={
                  handleActionChange
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  All Actions
                </option>

                <option value="create">
                  CREATE
                </option>

                <option value="update">
                  UPDATE
                </option>

                <option value="activate">
                  ACTIVATE
                </option>

                <option value="deactivate">
                  DEACTIVATE
                </option>
              </select>
            </div>

            {/* Entity */}
            <div>
              <label
                htmlFor="activity-log-entity"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Entity
              </label>

              <select
                id="activity-log-entity"
                value={entityType}
                onChange={
                  handleEntityTypeChange
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  All Entities
                </option>

                <option value="customer">
                  Customer
                </option>

                <option value="employee">
                  Employee
                </option>

                <option value="ticket">
                  Ticket
                </option>

                <option value="notification">
                  Notification
                </option>
              </select>
            </div>

            {/* User */}
            <div>
              <label
                htmlFor="activity-log-user"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                User
              </label>

              <select
                id="activity-log-user"
                value={userId}
                onChange={handleUserChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  All Users
                </option>

                {users.map((user) => (
                  <option
                    key={user._id}
                    value={user._id}
                  >
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label
                htmlFor="activity-log-date-from"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Date From
              </label>

              <input
                id="activity-log-date-from"
                type="date"
                value={dateFrom}
                onChange={
                  handleDateFromChange
                }
                max={dateTo || undefined}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Date To */}
            <div>
              <label
                htmlFor="activity-log-date-to"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Date To
              </label>

              <input
                id="activity-log-date-to"
                type="date"
                value={dateTo}
                onChange={handleDateToChange}
                min={dateFrom || undefined}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Filter Actions */}
          {(search ||
            action ||
            entityType ||
            userId ||
            dateFrom ||
            dateTo) && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleClearFilters}
                disabled={loading}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Logs Table */}
        <div className="overflow-hidden rounded-xl bg-white shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full min-w-250 text-left">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    User
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Action
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Entity
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Description
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      No activity logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log._id}
                      className="transition hover:bg-gray-50"
                    >
                      {/* User */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800">
                          {log.user?.name ||
                            "System"}
                        </p>

                        {log.user?.email && (
                          <p className="mt-1 text-xs text-gray-500">
                            {log.user.email}
                          </p>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase text-blue-700">
                          {log.action}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium capitalize text-gray-700">
                          {log.entityType}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="max-w-md px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {log.description}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {log.createdAt
                          ? new Date(
                              log.createdAt
                            ).toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-4 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
              {pagination.totalLogs > 0 ? (
                <>
                  Showing page{" "}
                  <span className="font-semibold text-gray-700">
                    {pagination.currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-700">
                    {pagination.totalPages}
                  </span>{" "}
                  • Total Logs:{" "}
                  <span className="font-semibold text-gray-700">
                    {pagination.totalLogs}
                  </span>
                </>
              ) : (
                "Total Logs: 0"
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={
                  handlePreviousPage
                }
                disabled={
                  !pagination.hasPreviousPage ||
                  loading
                }
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <span className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
                Page{" "}
                {pagination.currentPage}
              </span>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={
                  !pagination.hasNextPage ||
                  loading
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityLogs;