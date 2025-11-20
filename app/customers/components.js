import React from "react";
import { MoreVertical, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Customer Table Component
export function CustomerTable({ customers, expandedRow, setExpandedRow }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
              RFM Segment
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
              LTV
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
              Orders
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
              Last Order
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
              Risk
            </th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {customers.map((customer) => (
            <CustomerRow
              key={customer._id}
              customer={customer}
              isExpanded={expandedRow === customer._id}
              onToggle={() =>
                setExpandedRow(expandedRow === customer._id ? null : customer._id)
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Customer Row Component
function CustomerRow({ customer, isExpanded, onToggle }) {
  const segmentColors = {
    Champions: "bg-green-100 text-green-800 border-green-300",
    Loyal: "bg-blue-100 text-blue-800 border-blue-300",
    Potential: "bg-yellow-100 text-yellow-800 border-yellow-300",
    "At-Risk": "bg-orange-100 text-orange-800 border-orange-300",
    Lost: "bg-red-100 text-red-800 border-red-300",
  };

  // Calculate churn risk on the fly
  const getChurnRisk = (daysSinceLastOrder, totalOrders) => {
    if (!daysSinceLastOrder) return "Low";
    if (daysSinceLastOrder > 90 && totalOrders > 5) return "High";
    if (daysSinceLastOrder > 60) return "Medium";
    return "Low";
  };

  const churnRisk = getChurnRisk(customer.daysSinceLastOrder, customer.totalOrders);

  const churnRiskColors = {
    Low: "bg-gray-100 text-gray-700",
    Medium: "bg-yellow-100 text-yellow-800",
    High: "bg-red-100 text-red-800",
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const days = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  const segmentDot = {
    Champions: "bg-green-500",
    Loyal: "bg-blue-500",
    Potential: "bg-yellow-500",
    "At-Risk": "bg-orange-500",
    Lost: "bg-red-500",
  };

  return (
    <>
      <tr className="hover:bg-gray-50 cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                segmentDot[customer.rfmSegment] || "bg-gray-400"
              }`}
            />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {customer.firstName} {customer.lastName}
              </div>
              <div className="text-xs text-gray-500">{customer.email}</div>
              <div className="text-xs text-gray-400">
                {customer.state && `${customer.state} • `}
                {customer.phone}
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-4">
          <span
            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
              segmentColors[customer.rfmSegment] || "bg-gray-100 text-gray-800"
            }`}
          >
            {customer.rfmSegment || "Potential"}
          </span>
        </td>
        <td className="px-4 py-4">
          <span className="text-sm text-gray-900">
            ${(customer.customerLifetimeValue || 0).toLocaleString()}
          </span>
        </td>
        <td className="px-4 py-4">
          <span className="text-sm text-gray-900">{customer.totalOrders}</span>
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-900">
              {getRelativeTime(customer.lastOrderDate)}
            </span>
            {customer.daysSinceLastOrder > 90 && (
              <AlertTriangle className="w-3 h-3 text-orange-600" />
            )}
          </div>
        </td>
        <td className="px-4 py-4">
          <span
            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
              churnRiskColors[churnRisk] || "bg-gray-100 text-gray-700"
            }`}
          >
            {churnRisk}
          </span>
        </td>
        <td className="px-4 py-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan="7" className="px-4 py-6 bg-gray-50">
            <ExpandedCustomerDetails customer={customer} />
          </td>
        </tr>
      )}
    </>
  );
}

// Expanded Customer Details
function ExpandedCustomerDetails({ customer }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      <div className="grid grid-cols-3 gap-6 mb-4">
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="text-xs font-semibold text-gray-900 mb-3">Quick Stats</div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Created:</span>
            <span className="text-gray-900">
              {new Date(customer.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Source:</span>
            <span className="text-gray-900">{customer.source || "Website"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Loyalty Tier:</span>
            <span className="text-gray-900">
              {customer.loyaltyTier || "Bronze"}
            </span>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="text-xs font-semibold text-gray-900 mb-3">Engagement</div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Opens:</span>
            <span className="text-gray-900">{customer.emailOpensCount || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Clicks:</span>
            <span className="text-gray-900">{customer.emailClicksCount || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Last Visit:</span>
            <span className="text-gray-900">
              {customer.lastWebsiteVisit 
                ? new Date(customer.lastWebsiteVisit).toLocaleDateString()
                : "Never"}
            </span>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="text-xs font-semibold text-gray-900 mb-3">
          Purchase History
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Last Order:</span>
            <span className="text-gray-900">
              {customer.lastOrderDate
                ? new Date(customer.lastOrderDate).toLocaleDateString()
                : "Never"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="text-gray-900">
              ${(customer.lastOrderAmount || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Avg Order:</span>
            <span className="text-gray-900">
              ${customer.averageOrderValue.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div className="flex items-center gap-3 mt-4">
      <button
        onClick={() => setShowEditModal(true)}
        className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-white"
      >
        Edit Customer
      </button>
      <button
        onClick={() => setShowDeleteModal(true)}
        className="px-4 py-2 text-sm text-red-600 hover:text-red-700"
      >
        Delete Customer
      </button>
    </div>

      {showEditModal && (
        <EditCustomerModal
          customer={customer}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showDeleteModal && (
        <DeleteCustomerModal
          customer={customer}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}

// Pagination Component
export function Pagination({
  currentPage,
  totalPages,
  totalCustomers,
  itemsPerPage,
  onPageChange,
}) {
  return (
    <div className="mt-6 flex items-center justify-between">
      <div className="text-xs text-gray-500">
        Showing {(currentPage - 1) * itemsPerPage + 1}-
        {Math.min(currentPage * itemsPerPage, totalCustomers)} of {totalCustomers}
      </div>
      <div className="flex items-center gap-2">
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => onPageChange(i + 1)}
            className={`px-3 py-1 text-xs rounded ${
              currentPage === i + 1
                ? "bg-black text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

// Add Customer Modal
export function AddCustomerModal({ userId, onClose }) {
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    country: "United States",
    zipCode: "",
    birthday: "",
    languagePreference: "en",
  });
  const [error, setError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const createCustomer = useMutation(api.customers.create);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await createCustomer({
        userId,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        addressLine1: formData.addressLine1 || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        country: formData.country || undefined,
        zipCode: formData.zipCode || undefined,
        birthday: formData.birthday || undefined,
        languagePreference: formData.languagePreference || undefined,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Add Customer</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Address</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-2">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-800">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Customer"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// Edit Customer Modal
function EditCustomerModal({ customer, onClose }) {
  const updateCustomer = useMutation(api.customers.update);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone || "",
    city: customer.city || "",
    state: customer.state || "",
    country: customer.country || "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateCustomer({
        id: customer._id,
        ...formData,
      });
      onClose();
      window.location.reload(); // Refresh to show updated data
    } catch (error) {
      console.error("Error updating customer:", error);
      alert("Failed to update customer: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Customer</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Customer Modal
function DeleteCustomerModal({ customer, onClose }) {
  const deleteCustomer = useMutation(api.customers.deleteCustomer);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    
    setIsDeleting(true);
    try {
      await deleteCustomer({ id: customer._id });
      window.location.reload(); // Refresh to show updated list
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Failed to delete customer: " + error.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Delete Customer?
        </h2>
        
        <p className="text-sm text-gray-700 mb-4">
          Are you sure you want to delete{" "}
          <span className="font-medium">
            {customer.firstName} {customer.lastName}
          </span>{" "}
          ({customer.email})?
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-xs text-red-800 font-medium mb-2">This action cannot be undone.</p>
          <p className="text-xs text-red-700">
            All customer data, purchase history, and analytics will be permanently removed.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Type <span className="font-mono bg-gray-100 px-1">DELETE</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="DELETE"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={confirmText !== "DELETE" || isDeleting}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Delete Forever"}
          </button>
        </div>
      </div>
    </div>
  );
}
