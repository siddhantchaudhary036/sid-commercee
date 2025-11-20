import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  MoreVertical,
  Eye,
  Edit,
  Play,
  Pause,
  Trash2,
  Mail,
  Clock,
  GitBranch,
  Zap,
  AlertTriangle,
  X,
} from "lucide-react";

export function FlowCard({ flow, userId }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const toggleStatus = useMutation(api.flows.toggleStatus);
  const [isToggling, setIsToggling] = useState(false);

  const statusColors = {
    active: "bg-green-100 text-green-800 border-green-300",
    paused: "bg-yellow-100 text-yellow-800 border-yellow-300",
    draft: "bg-gray-100 text-gray-700 border-gray-300",
  };

  const triggerTypeLabels = {
    segment_added: "Customer added to segment",
    tag_added: "Tag added to customer",
    date: "Specific date/time",
    manual: "Manual trigger",
  };

  const getTriggerDescription = () => {
    const label = triggerTypeLabels[flow.triggerType] || flow.triggerType;
    if (flow.triggerConfig?.segmentId) {
      return `${label}: "${flow.triggerConfig.segmentName || "Unknown Segment"}"`;
    }
    return label;
  };

  const getNodeIcon = (nodeType) => {
    switch (nodeType) {
      case "trigger":
        return <Zap className="w-4 h-4" />;
      case "email":
        return <Mail className="w-4 h-4" />;
      case "delay":
        return <Clock className="w-4 h-4" />;
      case "condition":
        return <GitBranch className="w-4 h-4" />;
      default:
        return <div className="w-4 h-4" />;
    }
  };

  const handleToggleStatus = async () => {
    setIsToggling(true);
    try {
      await toggleStatus({ id: flow._id });
      window.location.reload();
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("Failed to toggle status: " + error.message);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-sm transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            {flow.name}
          </h3>
          <span
            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
              statusColors[flow.status] || statusColors.draft
            }`}
          >
            {flow.status.charAt(0).toUpperCase() + flow.status.slice(1)}
          </span>
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
                  window.location.href = `/flows/${flow._id}/analytics`;
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Analytics
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  window.location.href = `/flows/${flow._id}/edit`;
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Flow
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleToggleStatus();
                }}
                disabled={isToggling}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                {flow.status === "active" ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Activate
                  </>
                )}
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

      {/* Trigger Description */}
      <div className="text-xs text-gray-600 mb-4">
        <span className="font-medium">Triggers:</span> {getTriggerDescription()}
      </div>

      {/* Flow Preview - Mini Node Diagram */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 overflow-x-auto">
          {flow.flowDefinition.nodes.map((node, index) => (
            <div key={node.id} className="flex items-center gap-2">
              <div
                className="flex items-center justify-center w-8 h-8 bg-white border border-gray-300 rounded text-gray-600"
                title={node.type}
              >
                {getNodeIcon(node.type)}
              </div>
              {index < flow.flowDefinition.nodes.length - 1 && (
                <div className="text-gray-400">→</div>
              )}
            </div>
          ))}
          {flow.flowDefinition.nodes.length === 0 && (
            <div className="text-xs text-gray-500">No steps configured</div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="flex items-center gap-4 text-xs text-gray-600 mb-4">
        <div>
          <span className="font-medium text-gray-900">
            {flow.totalRecipients || 0}
          </span>{" "}
          recipients
        </div>
        <div>
          <span className="font-medium text-gray-900">
            {Math.round((flow.completionRate || 0) * 100)}%
          </span>{" "}
          complete
        </div>
        <div>
          <span className="font-medium text-gray-900">
            ${(flow.totalRevenue || 0).toLocaleString()}
          </span>{" "}
          revenue
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() =>
            (window.location.href = `/flows/${flow._id}/analytics`)
          }
          className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          View Analytics
        </button>
        <button
          onClick={() => (window.location.href = `/flows/${flow._id}/edit`)}
          className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Edit
        </button>
        <button
          onClick={handleToggleStatus}
          disabled={isToggling}
          className={`px-3 py-1.5 text-xs rounded-lg ${
            flow.status === "active"
              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
              : "bg-green-100 text-green-800 hover:bg-green-200"
          } disabled:opacity-50`}
        >
          {isToggling
            ? "..."
            : flow.status === "active"
            ? "Pause"
            : "Activate"}
        </button>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteFlowModal
          flow={flow}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}

// Delete Flow Modal
function DeleteFlowModal({ flow, onClose }) {
  const deleteFlow = useMutation(api.flows.deleteFlow);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;

    setIsDeleting(true);
    try {
      await deleteFlow({ id: flow._id });
      alert("✓ Flow deleted successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting flow:", error);
      alert("Failed to delete flow: " + error.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Delete Flow?
        </h2>

        <p className="text-sm text-gray-700 mb-4">
          Are you sure you want to delete{" "}
          <span className="font-medium">{flow.name}</span>?
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-xs text-red-800 font-medium mb-2">
            This action cannot be undone.
          </p>
          <p className="text-xs text-red-700">
            All flow data and analytics will be permanently removed.
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
