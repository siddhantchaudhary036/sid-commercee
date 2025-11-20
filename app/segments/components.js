import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  MoreVertical,
  Sparkles,
  Eye,
  Edit,
  Copy,
  Trash2,
  Plus,
  X,
  AlertTriangle,
} from "lucide-react";

// Segment Card Component
export function SegmentCard({ segment, userId }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const formatCondition = (condition) => {
    const operatorMap = {
      "=": "equals",
      "!=": "not equals",
      ">": "greater than",
      "<": "less than",
      ">=": "greater than or equal to",
      "<=": "less than or equal to",
      contains: "contains",
      startsWith: "starts with",
      endsWith: "ends with",
      in: "is one of",
    };

    const fieldName = condition.field
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());

    return `${fieldName} ${operatorMap[condition.operator] || condition.operator} "${condition.value}"`;
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-sm transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {segment.aiGenerated && (
            <Sparkles className="w-5 h-5 text-yellow-500" />
          )}
          <h3 className="text-sm font-semibold text-gray-900">
            {segment.name}
          </h3>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  setShowMenu(false);
                  window.location.href = `/customers?segment=${segment._id}`;
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Customers
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowEditModal(true);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => setShowMenu(false)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
              <div className="border-t border-gray-200" />
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteModal(true);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <span className="font-medium text-gray-900">
          {segment.customerCount || 0} customers
        </span>
        <span>•</span>
        <span>{segment.aiGenerated ? "AI Generated" : "Manual"}</span>
        <span>•</span>
        <span>Updated {formatDate(segment.updatedAt)}</span>
      </div>

      {/* Description */}
      {segment.description && (
        <p className="text-sm text-gray-600 mb-4">{segment.description}</p>
      )}

      {/* Conditions Preview */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-gray-600 uppercase mb-2">
          Conditions
        </div>
        <div className="space-y-1">
          {segment.conditions.map((condition, idx) => (
            <div key={idx} className="text-xs text-gray-700">
              {idx > 0 && <span className="text-gray-500 mr-1">AND</span>}
              {formatCondition(condition)}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() =>
            (window.location.href = `/customers?segment=${segment._id}`)
          }
          className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          View Customers
        </button>
        <button
          onClick={() => setShowEditModal(true)}
          className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Edit
        </button>
        <button
          onClick={() =>
            (window.location.href = `/campaigns/new?segment=${segment._id}`)
          }
          className="px-3 py-1.5 text-xs bg-black text-white rounded-lg hover:bg-gray-800"
        >
          Create Campaign
        </button>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteSegmentModal
          segment={segment}
          onClose={() => setShowDeleteModal(false)}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditSegmentModal
          segment={segment}
          userId={userId}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}


// Create Segment Modal
export function CreateSegmentModal({ userId, onClose }) {
  const createSegment = useMutation(api.segments.create);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [conditions, setConditions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      { field: "", operator: "", value: "" },
    ]);
  };

  const handleUpdateCondition = (index, updatedCondition) => {
    const newConditions = [...conditions];
    newConditions[index] = updatedCondition;
    setConditions(newConditions);
  };

  const handleRemoveCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!name.trim()) {
      alert("Please provide a segment name");
      return;
    }
    
    if (conditions.length === 0) {
      alert("Please add at least one condition");
      return;
    }

    // Validate all conditions are complete
    const incomplete = conditions.some(
      (c) => !c.field || !c.operator || c.value === ""
    );
    if (incomplete) {
      alert("Please complete all conditions");
      return;
    }

    setIsSubmitting(true);
    try {
      await createSegment({
        userId,
        name: name.trim(),
        description: description.trim() || undefined,
        conditions,
      });
      alert("✓ Segment created successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error creating segment:", error);
      if (error.message.includes("duplicate") || error.message.includes("exists")) {
        alert("A segment with this name already exists. Please choose a different name.");
      } else {
        alert("Failed to create segment: " + error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex">
        {/* Left: Builder */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Create New Segment
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Segment Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., High-Value Texas Customers"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Conditions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-medium text-gray-700">
                  Conditions (All must match)
                </label>
              </div>

              {conditions.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-2xl mb-2">🎯</div>
                  <p className="text-sm text-gray-600 mb-4">
                    Add conditions to filter customers
                  </p>
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
                  >
                    Add Your First Condition
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {conditions.map((condition, index) => (
                    <ConditionRow
                      key={index}
                      condition={condition}
                      isFirst={index === 0}
                      onChange={(updated) =>
                        handleUpdateCondition(index, updated)
                      }
                      onRemove={() => handleRemoveCondition(index)}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="w-full px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Condition
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
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
                disabled={isSubmitting || conditions.length === 0}
                className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Segment"}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Preview */}
        <div className="w-96 bg-gray-50 p-6 border-l border-gray-200 overflow-y-auto">
          <SegmentPreview userId={userId} conditions={conditions} />
        </div>
      </div>
    </div>
  );
}


// Condition Row Component
function ConditionRow({ condition, isFirst, onChange, onRemove }) {
  const [field, setField] = useState(condition.field || "");
  const [operator, setOperator] = useState(condition.operator || "");
  const [value, setValue] = useState(condition.value || "");

  useEffect(() => {
    onChange({ field, operator, value });
  }, [field, operator, value]);

  const fieldGroups = {
    Identity: [
      { value: "email", label: "Email", type: "string" },
      { value: "firstName", label: "First Name", type: "string" },
      { value: "lastName", label: "Last Name", type: "string" },
    ],
    Location: [
      { value: "state", label: "State", type: "string" },
      { value: "stateCode", label: "State Code", type: "string" },
      { value: "city", label: "City", type: "string" },
      { value: "zipCode", label: "Zip Code", type: "string" },
    ],
    "Purchase Metrics": [
      { value: "totalSpent", label: "Total Spent", type: "number" },
      { value: "totalOrders", label: "Total Orders", type: "number" },
      { value: "averageOrderValue", label: "Average Order Value", type: "number" },
      { value: "daysSinceLastOrder", label: "Days Since Last Order", type: "number" },
    ],
    Segmentation: [
      {
        value: "rfmSegment",
        label: "RFM Segment",
        type: "enum",
        options: ["Champions", "Loyal", "Potential", "At-Risk", "Lost"],
      },
      {
        value: "churnRisk",
        label: "Churn Risk",
        type: "enum",
        options: ["Low", "Medium", "High"],
      },
    ],
    Engagement: [
      { value: "emailOptIn", label: "Email Opt-In", type: "boolean" },
      { value: "smsOptIn", label: "SMS Opt-In", type: "boolean" },
      { value: "emailOpensCount", label: "Email Opens", type: "number" },
      { value: "emailClicksCount", label: "Email Clicks", type: "number" },
      { value: "engagementScore", label: "Engagement Score", type: "number" },
    ],
  };

  const selectedFieldMeta = Object.values(fieldGroups)
    .flat()
    .find((f) => f.value === field);

  const getOperators = (fieldType) => {
    switch (fieldType) {
      case "string":
        return [
          { value: "=", label: "equals" },
          { value: "!=", label: "not equals" },
          { value: "contains", label: "contains" },
          { value: "startsWith", label: "starts with" },
          { value: "endsWith", label: "ends with" },
        ];
      case "number":
        return [
          { value: "=", label: "equals" },
          { value: "!=", label: "not equals" },
          { value: ">", label: "greater than" },
          { value: "<", label: "less than" },
          { value: ">=", label: "greater than or equal" },
          { value: "<=", label: "less than or equal" },
        ];
      case "boolean":
        return [{ value: "=", label: "is" }];
      case "enum":
        return [
          { value: "=", label: "is" },
          { value: "!=", label: "is not" },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
      {!isFirst && (
        <span className="text-xs font-semibold text-gray-500 uppercase">
          AND
        </span>
      )}

      {/* Field Selector */}
      <select
        value={field}
        onChange={(e) => {
          setField(e.target.value);
          setOperator("");
          setValue("");
        }}
        className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium min-w-[180px] focus:outline-none focus:ring-2 focus:ring-gray-900"
      >
        <option value="">Select field...</option>
        {Object.entries(fieldGroups).map(([group, fields]) => (
          <optgroup key={group} label={group}>
            {fields.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* Operator Selector */}
      {field && (
        <select
          value={operator}
          onChange={(e) => setOperator(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm min-w-[140px] focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Select operator...</option>
          {getOperators(selectedFieldMeta?.type).map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      )}

      {/* Value Input */}
      {field && operator && (
        <ValueInput
          fieldMeta={selectedFieldMeta}
          value={value}
          onChange={setValue}
        />
      )}

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Value Input Component
function ValueInput({ fieldMeta, value, onChange }) {
  // Safety check: if fieldMeta is undefined, return a fallback input
  if (!fieldMeta) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter value..."
        className="px-3 py-2 border border-gray-300 rounded-lg flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
    );
  }

  switch (fieldMeta.type) {
    case "string":
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${fieldMeta.label.toLowerCase()}...`}
          className="px-3 py-2 border border-gray-300 rounded-lg flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      );

    case "number":
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder="0"
          className="px-3 py-2 border border-gray-300 rounded-lg w-32 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      );

    case "boolean":
      return (
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={value === true}
              onChange={() => onChange(true)}
              className="w-4 h-4"
            />
            <span className="text-sm">True</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={value === false}
              onChange={() => onChange(false)}
              className="w-4 h-4"
            />
            <span className="text-sm">False</span>
          </label>
        </div>
      );

    case "enum":
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm min-w-[160px] focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Select {fieldMeta.label.toLowerCase()}...</option>
          {fieldMeta.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );

    default:
      return null;
  }
}

// Segment Preview Component
function SegmentPreview({ userId, conditions }) {
  const matchingCustomers = useQuery(
    api.segments.previewSegment,
    conditions.length > 0 &&
      conditions.every((c) => c.field && c.operator && c.value !== "")
      ? { userId, conditions }
      : "skip"
  );

  if (!conditions.length || conditions.some((c) => !c.field || !c.operator || c.value === "")) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">👀</div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Preview</h3>
        <p className="text-xs text-gray-500">
          Add conditions to see matching customers in real-time
        </p>
      </div>
    );
  }

  if (!matchingCustomers) {
    return (
      <div className="text-center py-8">
        <div className="text-sm text-gray-500">Loading preview...</div>
      </div>
    );
  }

  // Show empty state if no matches
  if (matchingCustomers.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border border-gray-200">
          <div className="text-4xl font-bold text-gray-900 mb-2">0</div>
          <div className="text-xs text-gray-700">customers match</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
            No Matches
          </div>
          <p className="text-xs text-gray-600">
            Try adjusting your conditions to match more customers
          </p>
        </div>
      </div>
    );
  }

  const totalLTV = matchingCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgLTV = matchingCustomers.length > 0 ? totalLTV / matchingCustomers.length : 0;
  const avgOrders =
    matchingCustomers.length > 0
      ? matchingCustomers.reduce((sum, c) => sum + c.totalOrders, 0) /
        matchingCustomers.length
      : 0;

  return (
    <div className="space-y-4">
      {/* Count Card */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
        <div className="text-4xl font-bold text-blue-900 mb-2">
          {matchingCustomers.length}
        </div>
        <div className="text-xs text-blue-700">
          customers match this segment
        </div>
      </div>

      {/* Aggregate Stats */}
      {matchingCustomers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
            Segment Insights
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Combined LTV:</span>
              <span className="font-semibold">${totalLTV.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg LTV:</span>
              <span className="font-semibold">${avgLTV.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Orders:</span>
              <span className="font-semibold">{avgOrders.toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Customers */}
      {matchingCustomers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
            Top Customers
          </div>
          <div className="space-y-2">
            {matchingCustomers.slice(0, 5).map((customer) => (
              <div key={customer._id} className="flex justify-between text-xs">
                <span className="text-gray-700 truncate">
                  {customer.firstName} {customer.lastName.charAt(0)}.
                </span>
                <span className="font-medium text-gray-900">
                  ${customer.totalSpent.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          {matchingCustomers.length > 5 && (
            <div className="text-xs text-gray-500 mt-3">
              +{matchingCustomers.length - 5} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// Edit Segment Modal (similar to Create but pre-filled)
function EditSegmentModal({ segment, userId, onClose }) {
  const updateSegment = useMutation(api.segments.update);
  const [name, setName] = useState(segment.name);
  const [description, setDescription] = useState(segment.description || "");
  const [conditions, setConditions] = useState(segment.conditions);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCondition = () => {
    setConditions([...conditions, { field: "", operator: "", value: "" }]);
  };

  const handleUpdateCondition = (index, updatedCondition) => {
    const newConditions = [...conditions];
    newConditions[index] = updatedCondition;
    setConditions(newConditions);
  };

  const handleRemoveCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!name.trim()) {
      alert("Please provide a segment name");
      return;
    }
    
    if (conditions.length === 0) {
      alert("Please add at least one condition");
      return;
    }

    const incomplete = conditions.some(
      (c) => !c.field || !c.operator || c.value === ""
    );
    if (incomplete) {
      alert("Please complete all conditions");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateSegment({
        id: segment._id,
        name: name.trim(),
        description: description.trim() || undefined,
        conditions,
      });
      alert("✓ Segment updated successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error updating segment:", error);
      alert("Failed to update segment: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex">
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Edit Segment</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Segment Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-3">
                Conditions (All must match)
              </label>
              <div className="space-y-3">
                {conditions.map((condition, index) => (
                  <ConditionRow
                    key={index}
                    condition={condition}
                    isFirst={index === 0}
                    onChange={(updated) => handleUpdateCondition(index, updated)}
                    onRemove={() => handleRemoveCondition(index)}
                  />
                ))}
                <button
                  type="button"
                  onClick={handleAddCondition}
                  className="w-full px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Condition
                </button>
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

        <div className="w-96 bg-gray-50 p-6 border-l border-gray-200 overflow-y-auto">
          <SegmentPreview userId={userId} conditions={conditions} />
        </div>
      </div>
    </div>
  );
}

// Delete Segment Modal
function DeleteSegmentModal({ segment, onClose }) {
  const deleteSegment = useMutation(api.segments.deleteSegment);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;

    setIsDeleting(true);
    try {
      await deleteSegment({ id: segment._id });
      alert("✓ Segment deleted successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting segment:", error);
      alert("Failed to delete segment: " + error.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Delete Segment?
        </h2>

        <p className="text-sm text-gray-700 mb-4">
          Are you sure you want to delete{" "}
          <span className="font-medium">{segment.name}</span>?
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-xs text-red-800 font-medium mb-2">
            This action cannot be undone.
          </p>
          <p className="text-xs text-red-700">
            The segment will be permanently removed. Any campaigns using this
            segment will need to be updated.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Type <span className="font-mono bg-gray-100 px-1">DELETE</span> to
            confirm:
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
