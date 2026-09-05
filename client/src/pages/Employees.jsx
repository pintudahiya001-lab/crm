import {
  useCallback,
  useEffect,
  useState,
} from "react";
import api from "../services/api";

function Employees() {
  const [employees, setEmployees] = useState([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

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
  const [editingEmployee, setEditingEmployee] =
    useState(null);
  const [actionLoading, setActionLoading] =
    useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // ===============================
  // RESET FORM
  // ===============================

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
    });
  };

  // ===============================
  // FETCH EMPLOYEES
  // ===============================

  const fetchEmployees = useCallback(
    async (currentSearch, currentPage) => {
      try {
        setError("");
        setLoading(true);

        const response = await api.get(
          "/employees",
          {
            params: {
              search: currentSearch.trim(),
              page: currentPage,
              limit,
            },
          }
        );

        const employeeList =
          response.data?.employees || [];

        setEmployees(employeeList);

        setPagination(
          response.data?.pagination || {
            page: currentPage,
            limit,
            total: employeeList.length,
            pages: 1,
          }
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
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [limit]
  );

  // ===============================
  // SEARCH + PAGINATION
  // DEBOUNCED
  // ===============================

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees(search, page);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, page, fetchEmployees]);

  // ===============================
  // SEARCH CHANGE
  // ===============================

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
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
  // OPEN ADD MODAL
  // ===============================

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    resetForm();
    setError("");
    setShowModal(true);
  };

  // ===============================
  // OPEN EDIT MODAL
  // ===============================

  const handleOpenEditModal = (employee) => {
    setEditingEmployee(employee);

    setFormData({
      name: employee.name || "",
      email: employee.email || "",
      password: "",
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
    setEditingEmployee(null);
    resetForm();
    setError("");
  };

  // ===============================
  // SUBMIT EMPLOYEE
  // ===============================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (editingEmployee) {
        const updateData = {
          name: formData.name.trim(),
          email: formData.email.trim(),
        };

        if (formData.password.trim()) {
          updateData.password =
            formData.password.trim();
        }

        await api.put(
          `/employees/${editingEmployee._id}`,
          updateData
        );
      } else {
        await api.post("/employees", {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        });
      }

      // Close/reset modal directly after success
      setShowModal(false);
      setEditingEmployee(null);
      resetForm();
      setError("");

      await fetchEmployees(search, page);
    } catch (error) {
      console.error(
        "Employee Save Error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to save employee."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ===============================
  // TOGGLE EMPLOYEE STATUS
  // ===============================

  const handleToggleStatus = async (
    employee
  ) => {
    if (actionLoading) {
      return;
    }

    const action =
      employee.status === "active"
        ? "deactivate"
        : "activate";

    setActionLoading(employee._id);
    setError("");

    try {
      await api.patch(
        `/employees/${employee._id}/${action}`
      );

      await fetchEmployees(search, page);
    } catch (error) {
      console.error(
        `${action} Employee Error:`,
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.message ||
          `Failed to ${action} employee.`
      );
    } finally {
      setActionLoading(null);
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
  // INITIAL LOADING
  // ===============================

  if (initialLoading) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="rounded-2xl bg-white px-8 py-6 text-center shadow-md">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-sm font-medium text-slate-600">
            Loading Employees...
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
              Employees
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage your employees
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            + Add Employee
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 rounded-xl bg-white p-4 shadow-md">
          <label
            htmlFor="employee-search"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Search Employees
          </label>

          <div className="relative">
            <input
              id="employee-search"
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by Employee ID, name or email..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              </div>
            )}
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

        {/* Employees Table */}
        <div className="overflow-hidden rounded-xl bg-white shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full min-w-225 text-left">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Employee ID
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Name
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Email
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Role
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Status
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {employees.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      {search
                        ? "No employees found for this search."
                        : "No employees found."}
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr
                      key={employee._id}
                      className="transition hover:bg-gray-50"
                    >
                      {/* Employee ID */}
                      <td className="px-6 py-4">
                        <p className="max-w-xs break-all font-mono text-xs text-gray-600">
                          {employee._id}
                        </p>
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800">
                          {employee.name}
                        </p>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {employee.email}
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 capitalize">
                          {employee.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            employee.status ===
                            "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {employee.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenEditModal(
                                employee
                              )
                            }
                            disabled={
                              actionLoading ===
                              employee._id
                            }
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStatus(
                                employee
                              )
                            }
                            disabled={
                              actionLoading ===
                              employee._id
                            }
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              employee.status ===
                              "active"
                                ? "border border-red-200 text-red-600 hover:bg-red-50"
                                : "border border-green-200 text-green-600 hover:bg-green-50"
                            }`}
                          >
                            {actionLoading ===
                            employee._id
                              ? "Updating..."
                              : employee.status ===
                                "active"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </div>
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
                {employees.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-700">
                {pagination.total}
              </span>{" "}
              employees
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePreviousPage}
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
                onClick={handleNextPage}
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

      {/* Add / Edit Employee Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="employee-modal-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2
                  id="employee-modal-title"
                  className="text-xl font-bold text-gray-800"
                >
                  {editingEmployee
                    ? "Edit Employee"
                    : "Add Employee"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingEmployee
                    ? "Update employee details"
                    : "Create a new employee"}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
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
                className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
              >
                {error}
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="p-6"
            >
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label
                    htmlFor="employee-name"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Name
                  </label>

                  <input
                    id="employee-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter employee name"
                    required
                    disabled={submitting}
                    autoComplete="name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="employee-email"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>

                  <input
                    id="employee-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter employee email"
                    required
                    disabled={submitting}
                    autoComplete="email"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="employee-password"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>

                  <input
                    id="employee-password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={
                      editingEmployee
                        ? "Leave blank to keep current"
                        : "Enter password"
                    }
                    required={!editingEmployee}
                    disabled={submitting}
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
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
                    ? editingEmployee
                      ? "Updating..."
                      : "Creating..."
                    : editingEmployee
                    ? "Update Employee"
                    : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;