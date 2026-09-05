import {
  useCallback,
  useEffect,
  useState,
} from "react";
import api from "../services/api";

function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingTicket, setEditingTicket] =
    useState(null);

  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "low",
    status: "open",
    reply: "",
    assignedTo: "",
  });

  // ===============================
  // RESET FORM
  // ===============================

  const resetForm = () => {
    setFormData({
      subject: "",
      description: "",
      priority: "low",
      status: "open",
      reply: "",
      assignedTo: "",
    });
  };

  // ===============================
  // FETCH TICKETS
  // ===============================

  const fetchTickets = useCallback(
    async (
      currentSearch,
      currentStatus,
      currentPriority,
      currentAssignedTo,
      currentPage
    ) => {
      try {
        setError("");
        setLoading(true);

        const params = {
          page: currentPage,
          limit,
        };

        if (currentSearch.trim()) {
          params.search = currentSearch.trim();
        }

        if (currentStatus) {
          params.status = currentStatus;
        }

        if (currentPriority) {
          params.priority = currentPriority;
        }

        if (currentAssignedTo) {
          params.assignedTo =
            currentAssignedTo;
        }

        const response = await api.get(
          "/tickets",
          { params }
        );

        const ticketList =
          response.data?.tickets || [];

        setTickets(ticketList);

        setPagination(
          response.data?.pagination || {
            page: currentPage,
            limit,
            total: ticketList.length,
            pages: 1,
          }
        );
      } catch (error) {
        console.error(
          "Tickets Error:",
          error.response?.data ||
            error.message
        );

        setError(
          error.response?.data?.message ||
            "Failed to load tickets."
        );
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [limit]
  );

  // ===============================
  // FETCH ACTIVE EMPLOYEES
  // ===============================

  const fetchEmployees = useCallback(
    async () => {
      try {
        setEmployeeLoading(true);

        const response = await api.get(
          "/employees",
          {
            params: {
              status: "active",
              page: 1,
              limit: 100,
            },
          }
        );

        setEmployees(
          response.data?.employees || []
        );
      } catch (error) {
        console.error(
          "Employees Error:",
          error.response?.data ||
            error.message
        );

        setError(
          error.response?.data?.message ||
            "Failed to load employees."
        );
      } finally {
        setEmployeeLoading(false);
      }
    },
    []
  );

  // ===============================
  // LOAD EMPLOYEES
  // ===============================

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // ===============================
  // SEARCH + FILTERS + PAGINATION
  // DEBOUNCED
  // ===============================

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTickets(
        search,
        status,
        priority,
        assignedTo,
        page
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [
    search,
    status,
    priority,
    assignedTo,
    page,
    fetchTickets,
  ]);

  // ===============================
  // FILTER CHANGES
  // ===============================

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const handlePriorityChange = (e) => {
    setPriority(e.target.value);
    setPage(1);
  };

  const handleAssignedToChange = (e) => {
    setAssignedTo(e.target.value);
    setPage(1);
  };

  // ===============================
  // FORM CHANGE
  // ===============================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  // ===============================
  // OPEN EDIT MODAL
  // ===============================

  const handleOpenEditModal = (ticket) => {
    setEditingTicket(ticket);

    setFormData({
      subject: ticket.subject || "",
      description:
        ticket.description || "",
      priority:
        ticket.priority || "low",
      status:
        ticket.status || "open",
      reply: ticket.reply || "",
      assignedTo:
        ticket.assignedTo?._id ||
        ticket.assignedTo ||
        "",
    });

    setError("");
    setShowModal(true);
  };

  // ===============================
  // CLOSE MODAL
  // ===============================

  const handleCloseModal = () => {
    if (submitting) {
      return;
    }

    setShowModal(false);
    setEditingTicket(null);
    resetForm();
    setError("");
  };

  // ===============================
  // SUBMIT TICKET
  // ===============================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingTicket || submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const updateData = {
        subject: formData.subject.trim(),
        description:
          formData.description.trim(),
        priority: formData.priority,
        status: formData.status,
        reply: formData.reply.trim(),
        assignedTo:
          formData.assignedTo || null,
      };

      await api.put(
        `/tickets/${editingTicket._id}`,
        updateData
      );

      // Close/reset modal directly after success
      setShowModal(false);
      setEditingTicket(null);
      resetForm();
      setError("");

      await fetchTickets(
        search,
        status,
        priority,
        assignedTo,
        page
      );
    } catch (error) {
      console.error(
        "Update Ticket Error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to update ticket."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ===============================
  // PREVIOUS PAGE
  // ===============================

  const handlePreviousPage = () => {
    if (page > 1 && !loading) {
      setPage(
        (previousPage) =>
          previousPage - 1
      );
    }
  };

  // ===============================
  // NEXT PAGE
  // ===============================

  const handleNextPage = () => {
    if (
      page < pagination.pages &&
      !loading
    ) {
      setPage(
        (previousPage) =>
          previousPage + 1
      );
    }
  };

  // ===============================
  // PRIORITY CLASS
  // ===============================

  const getPriorityClass = (
    ticketPriority
  ) => {
    switch (ticketPriority) {
      case "urgent":
        return "bg-red-100 text-red-700";

      case "high":
        return "bg-orange-100 text-orange-700";

      case "medium":
        return "bg-yellow-100 text-yellow-700";

      case "low":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ===============================
  // STATUS CLASS
  // ===============================

  const getStatusClass = (
    ticketStatus
  ) => {
    switch (ticketStatus) {
      case "open":
        return "bg-blue-100 text-blue-700";

      case "in-progress":
        return "bg-yellow-100 text-yellow-700";

      case "resolved":
        return "bg-green-100 text-green-700";

      case "closed":
        return "bg-gray-200 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ===============================
  // INITIAL LOADING
  // ===============================

  if (initialLoading) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="rounded-2xl bg-white px-8 py-6 text-center shadow-md">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-sm font-medium text-slate-600">
            Loading Tickets...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Tickets
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage support tickets
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-xl bg-white p-4 shadow-md">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label
                htmlFor="ticket-search"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Search Tickets
              </label>

              <div className="relative">
                <input
                  id="ticket-search"
                  type="text"
                  value={search}
                  onChange={
                    handleSearchChange
                  }
                  placeholder="Search by subject or description..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                {loading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="ticket-status"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Status
              </label>

              <select
                id="ticket-status"
                value={status}
                onChange={
                  handleStatusChange
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  All Statuses
                </option>
                <option value="open">
                  Open
                </option>
                <option value="in-progress">
                  In Progress
                </option>
                <option value="resolved">
                  Resolved
                </option>
                <option value="closed">
                  Closed
                </option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label
                htmlFor="ticket-priority"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Priority
              </label>

              <select
                id="ticket-priority"
                value={priority}
                onChange={
                  handlePriorityChange
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  All Priorities
                </option>
                <option value="low">
                  Low
                </option>
                <option value="medium">
                  Medium
                </option>
                <option value="high">
                  High
                </option>
                <option value="urgent">
                  Urgent
                </option>
              </select>
            </div>

            {/* Assignment */}
            <div>
              <label
                htmlFor="ticket-assigned"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Assignment
              </label>

              <select
                id="ticket-assigned"
                value={assignedTo}
                onChange={
                  handleAssignedToChange
                }
                disabled={employeeLoading}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">
                  {employeeLoading
                    ? "Loading employees..."
                    : "All Tickets"}
                </option>

                {!employeeLoading && (
                  <option value="unassigned">
                    Unassigned
                  </option>
                )}

                {employees.map(
                  (employee) => (
                    <option
                      key={employee._id}
                      value={employee._id}
                    >
                      {employee.name}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && !showModal && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
          >
            {error}
          </div>
        )}

        {/* Tickets Table */}
        <div className="overflow-hidden rounded-xl bg-white shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full min-w-275 text-left">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Subject
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Customer
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Priority
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Status
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Assigned To
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {tickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      {search ||
                      status ||
                      priority ||
                      assignedTo
                        ? "No tickets found for the selected filters."
                        : "No tickets found."}
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr
                      key={ticket._id}
                      className="transition hover:bg-gray-50"
                    >
                      {/* Subject */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800">
                          {ticket.subject}
                        </p>

                        <p className="mt-1 max-w-xs truncate text-sm text-gray-500">
                          {ticket.description}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {ticket.customer?.name ||
                          ticket.customer?.email ||
                          "N/A"}
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClass(
                            ticket.priority
                          )}`}
                        >
                          {ticket.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            ticket.status
                          )}`}
                        >
                          {ticket.status}
                        </span>
                      </td>

                      {/* Assigned To */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {ticket.assignedTo
                          ?.name ||
                          ticket.assignedTo
                            ?.email ||
                          "Unassigned"}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenEditModal(
                              ticket
                            )
                          }
                          disabled={submitting}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-4 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-700">
                {tickets.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-700">
                {pagination.total}
              </span>{" "}
              tickets
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={
                  handlePreviousPage
                }
                disabled={
                  page === 1 || loading
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <span className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
                Page {page} of{" "}
                {pagination.pages}
              </span>

              <button
                type="button"
                onClick={
                  handleNextPage
                }
                disabled={
                  page >=
                    pagination.pages ||
                  loading
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Ticket Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ticket-modal-title"
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2
                  id="ticket-modal-title"
                  className="text-xl font-bold text-gray-800"
                >
                  Edit Ticket
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Update ticket details
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleCloseModal
                }
                disabled={submitting}
                aria-label="Close modal"
                className="text-2xl leading-none text-gray-400 transition hover:text-gray-700 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {/* Modal Error */}
            {error && (
              <div
                role="alert"
                className="mx-6 mt-4 shrink-0 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
              >
                {error}
              </div>
            )}

            {/* Scrollable Form */}
            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto p-6"
            >
              <div className="space-y-5">
                {/* Subject */}
                <div>
                  <label
                    htmlFor="ticket-subject"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Subject
                  </label>

                  <input
                    id="ticket-subject"
                    type="text"
                    name="subject"
                    value={
                      formData.subject
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={submitting}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="ticket-description"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>

                  <textarea
                    id="ticket-description"
                    name="description"
                    value={
                      formData.description
                    }
                    onChange={
                      handleChange
                    }
                    rows="4"
                    required
                    disabled={submitting}
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label
                    htmlFor="ticket-form-priority"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Priority
                  </label>

                  <select
                    id="ticket-form-priority"
                    name="priority"
                    value={
                      formData.priority
                    }
                    onChange={
                      handleChange
                    }
                    disabled={submitting}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  >
                    <option value="low">
                      Low
                    </option>
                    <option value="medium">
                      Medium
                    </option>
                    <option value="high">
                      High
                    </option>
                    <option value="urgent">
                      Urgent
                    </option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label
                    htmlFor="ticket-form-status"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Status
                  </label>

                  <select
                    id="ticket-form-status"
                    name="status"
                    value={
                      formData.status
                    }
                    onChange={
                      handleChange
                    }
                    disabled={submitting}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  >
                    <option value="open">
                      Open
                    </option>
                    <option value="in-progress">
                      In Progress
                    </option>
                    <option value="resolved">
                      Resolved
                    </option>
                    <option value="closed">
                      Closed
                    </option>
                  </select>
                </div>

                {/* Assigned Employee */}
                <div>
                  <label
                    htmlFor="ticket-form-assigned"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Assign Employee
                  </label>

                  <select
                    id="ticket-form-assigned"
                    name="assignedTo"
                    value={
                      formData.assignedTo
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      employeeLoading ||
                      submitting
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  >
                    <option value="">
                      {employeeLoading
                        ? "Loading employees..."
                        : "Unassigned"}
                    </option>

                    {employees.map(
                      (employee) => (
                        <option
                          key={
                            employee._id
                          }
                          value={
                            employee._id
                          }
                        >
                          {employee.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Reply */}
                <div>
                  <label
                    htmlFor="ticket-reply"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Reply
                  </label>

                  <textarea
                    id="ticket-reply"
                    name="reply"
                    value={
                      formData.reply
                    }
                    onChange={
                      handleChange
                    }
                    rows="3"
                    placeholder="Enter ticket reply"
                    disabled={submitting}
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-6 flex shrink-0 justify-end gap-3">
                <button
                  type="button"
                  onClick={
                    handleCloseModal
                  }
                  disabled={submitting}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Updating..."
                    : "Update Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tickets;