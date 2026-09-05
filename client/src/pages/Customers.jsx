import {
  useCallback,
  useEffect,
  useState,
} from "react";
import api from "../services/api";

function Customers() {
  const [customers, setCustomers] = useState([]);

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
  const [editingCustomer, setEditingCustomer] =
    useState(null);
  const [actionLoading, setActionLoading] =
    useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    company: "",
    address: "",
  });

  // ===============================
  // RESET FORM
  // ===============================

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      company: "",
      address: "",
    });
  };

  // ===============================
  // FETCH CUSTOMERS
  // ===============================

  const fetchCustomers = useCallback(async () => {
    try {
      setError("");
      setLoading(true);

      const response = await api.get("/customers", {
        params: {
          search: search.trim(),
          page,
          limit,
        },
      });

      const customerList =
        response.data?.customers || [];

      setCustomers(customerList);

      setPagination(
        response.data?.pagination || {
          page,
          limit,
          total: customerList.length,
          pages: 1,
        }
      );
    } catch (error) {
      console.error(
        "Customers Error:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to load customers."
      );
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [search, page, limit]);

  // ===============================
  // SEARCH + PAGINATION
  // DEBOUNCED
  // ===============================

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [fetchCustomers]);

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
    setEditingCustomer(null);
    resetForm();
    setError("");
    setShowModal(true);
  };

  // ===============================
  // OPEN EDIT MODAL
  // ===============================

  const handleOpenEditModal = (customer) => {
    setEditingCustomer(customer);

    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      password: "",
      phone: customer.phone || "",
      company: customer.company || "",
      address: customer.address || "",
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
    setEditingCustomer(null);
    resetForm();
    setError("");
  };

  // ===============================
  // SUBMIT CUSTOMER
  // ===============================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (editingCustomer) {
        const updateData = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          company: formData.company.trim(),
          address: formData.address.trim(),
        };

        if (formData.password.trim()) {
          updateData.password =
            formData.password.trim();
        }

        await api.put(
          `/customers/${editingCustomer._id}`,
          updateData
        );
      } else {
        await api.post("/customers", {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: formData.phone.trim(),
          company: formData.company.trim(),
          address: formData.address.trim(),
        });
      }

      // Close/reset modal directly after successful save
      setShowModal(false);
      setEditingCustomer(null);
      resetForm();
      setError("");

      await fetchCustomers();
    } catch (error) {
      console.error(
        "Customer Save Error:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to save customer."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ===============================
  // TOGGLE CUSTOMER STATUS
  // ===============================

  const handleToggleStatus = async (customer) => {
    if (actionLoading) {
      return;
    }

    const action =
      customer.status === "active"
        ? "deactivate"
        : "activate";

    const endpoint =
      `/customers/${customer._id}/${action}`;

    setActionLoading(customer._id);
    setError("");

    try {
      await api.patch(endpoint);

      await fetchCustomers();
    } catch (error) {
      console.error(
        `${action} Customer Error:`,
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          `Failed to ${action} customer.`
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
      setPage((previousPage) => previousPage - 1);
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
      setPage((previousPage) => previousPage + 1);
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
            Loading Customers...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Customers
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage your customers
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            + Add Customer
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 rounded-xl bg-white p-4 shadow-md">
          <label
            htmlFor="customer-search"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Search Customers
          </label>

          <div className="relative">
            <input
              id="customer-search"
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by name, email, phone or company..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              </div>
            )}
          </div>
        </div>

        {/* Page Error */}
        {error && !showModal && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
          >
            {error}
          </div>
        )}

        {/* Customers Table */}
        <div className="overflow-hidden rounded-xl bg-white shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full min-w-275 text-left">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Name
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Email
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Phone
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Company
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Address
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
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      {search
                        ? "No customers found for this search."
                        : "No customers found."}
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer._id}
                      className="transition hover:bg-gray-50"
                    >
                      {/* Name */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800">
                          {customer.name}
                        </p>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {customer.email}
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {customer.phone}
                      </td>

                      {/* Company */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {customer.company || "-"}
                      </td>

                      {/* Address */}
                      <td className="max-w-xs px-6 py-4 text-sm text-gray-600">
                        <p className="truncate">
                          {customer.address || "-"}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            customer.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {customer.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenEditModal(customer)
                            }
                            disabled={
                              actionLoading ===
                              customer._id
                            }
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStatus(customer)
                            }
                            disabled={
                              actionLoading ===
                              customer._id
                            }
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              customer.status === "active"
                                ? "border border-red-200 text-red-600 hover:bg-red-50"
                                : "border border-green-200 text-green-600 hover:bg-green-50"
                            }`}
                          >
                            {actionLoading ===
                            customer._id
                              ? "Updating..."
                              : customer.status ===
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
                {customers.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-700">
                {pagination.total}
              </span>{" "}
              customers
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
                Page {page} of {pagination.pages}
              </span>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={
                  page >= pagination.pages ||
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

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {editingCustomer
                    ? "Edit Customer"
                    : "Add Customer"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingCustomer
                    ? "Update customer details"
                    : "Create a new customer"}
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
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Name */}
                <div>
                  <label
                    htmlFor="customer-name"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Name
                  </label>

                  <input
                    id="customer-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    required
                    disabled={submitting}
                    autoComplete="name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="customer-email"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>

                  <input
                    id="customer-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    required
                    disabled={submitting}
                    autoComplete="email"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="customer-password"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>

                  <input
                    id="customer-password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={
                      editingCustomer
                        ? "Leave blank to keep current"
                        : "Enter password"
                    }
                    required={!editingCustomer}
                    disabled={submitting}
                    autoComplete={
                      editingCustomer
                        ? "new-password"
                        : "new-password"
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="customer-phone"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Phone
                  </label>

                  <input
                    id="customer-phone"
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone"
                    required
                    disabled={submitting}
                    autoComplete="tel"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>

                {/* Company */}
                <div>
                  <label
                    htmlFor="customer-company"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Company
                  </label>

                  <input
                    id="customer-company"
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Enter company"
                    disabled={submitting}
                    autoComplete="organization"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>

                {/* Address */}
                <div>
                  <label
                    htmlFor="customer-address"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Address
                  </label>

                  <input
                    id="customer-address"
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter address"
                    disabled={submitting}
                    autoComplete="street-address"
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
                    ? editingCustomer
                      ? "Updating..."
                      : "Creating..."
                    : editingCustomer
                    ? "Update Customer"
                    : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;