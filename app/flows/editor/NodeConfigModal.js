import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useReactFlow } from "@xyflow/react";
import { X } from "lucide-react";

export default function NodeConfigModal({ nodeId, nodeType, nodeData, onClose }) {
  const { setNodes } = useReactFlow();
  const [config, setConfig] = useState(nodeData);

  // Fetch segments for trigger configuration
  const segments = useQuery(api.segments.list, 
    nodeType === "trigger" && config.userId 
      ? { userId: config.userId } 
      : "skip"
  );

  const handleSave = () => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === nodeId ? { ...node, data: config } : node
      )
    );
    onClose();
  };

  const renderTriggerConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Trigger Type
        </label>
        <select
          value={config.triggerType || "segment_added"}
          onChange={(e) =>
            setConfig({ ...config, triggerType: e.target.value })
          }
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="segment_added">Customer Added to Segment</option>
          <option value="tag_added">Tag Added to Customer</option>
          <option value="date">Specific Date/Time</option>
          <option value="manual">Manual Trigger</option>
        </select>
      </div>

      {config.triggerType === "segment_added" && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Select Segment
          </label>
          <select
            value={config.segmentId || ""}
            onChange={(e) =>
              setConfig({
                ...config,
                segmentId: e.target.value,
                segmentName:
                  segments?.find((s) => s._id === e.target.value)?.name || "",
              })
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Choose a segment...</option>
            {segments?.map((segment) => (
              <option key={segment._id} value={segment._id}>
                {segment.name} ({segment.customerCount || 0} customers)
              </option>
            ))}
          </select>
        </div>
      )}

      {config.triggerType === "tag_added" && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Tag Name
          </label>
          <input
            type="text"
            value={config.tagName || ""}
            onChange={(e) => setConfig({ ...config, tagName: e.target.value })}
            placeholder="e.g., VIP"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      )}

      {config.triggerType === "date" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={config.triggerDate || ""}
              onChange={(e) =>
                setConfig({ ...config, triggerDate: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Time
            </label>
            <input
              type="time"
              value={config.triggerTime || ""}
              onChange={(e) =>
                setConfig({ ...config, triggerTime: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderEmailConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Email Subject *
        </label>
        <input
          type="text"
          value={config.subject || ""}
          onChange={(e) => setConfig({ ...config, subject: e.target.value })}
          placeholder="e.g., Welcome to our store!"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Email Content *
        </label>
        <textarea
          value={config.content || ""}
          onChange={(e) => setConfig({ ...config, content: e.target.value })}
          placeholder="Hi {{firstName}},&#10;&#10;Welcome to our store!&#10;&#10;Best regards,&#10;The Team"
          rows={8}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono"
        />
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="text-xs font-medium text-gray-700 mb-2">
          Available Variables:
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            "{{firstName}}",
            "{{lastName}}",
            "{{email}}",
            "{{totalSpent}}",
            "{{totalOrders}}",
          ].map((variable) => (
            <button
              key={variable}
              onClick={() =>
                setConfig({
                  ...config,
                  content: (config.content || "") + " " + variable,
                })
              }
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 font-mono"
            >
              {variable}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Send From
        </label>
        <input
          type="email"
          value={config.fromEmail || ""}
          onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
          placeholder="your@email.com"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>
    </div>
  );

  const renderDelayConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Delay Type
        </label>
        <select
          value={config.delayType || "duration"}
          onChange={(e) => setConfig({ ...config, delayType: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="duration">Wait for duration</option>
          <option value="until">Wait until specific time</option>
        </select>
      </div>

      {config.delayType === "duration" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Duration *
            </label>
            <input
              type="number"
              value={config.duration || ""}
              onChange={(e) =>
                setConfig({ ...config, duration: parseInt(e.target.value) })
              }
              min="1"
              placeholder="1"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Unit *
            </label>
            <select
              value={config.unit || "days"}
              onChange={(e) => setConfig({ ...config, unit: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
            </select>
          </div>
        </div>
      )}

      {config.delayType === "until" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={config.untilDate || ""}
              onChange={(e) =>
                setConfig({ ...config, untilDate: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Time *
            </label>
            <input
              type="time"
              value={config.untilTime || ""}
              onChange={(e) =>
                setConfig({ ...config, untilTime: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderConditionConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Condition Type
        </label>
        <select
          value={config.conditionType || "email_opened"}
          onChange={(e) =>
            setConfig({ ...config, conditionType: e.target.value })
          }
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="email_opened">Opened Previous Email?</option>
          <option value="email_clicked">Clicked Link in Email?</option>
          <option value="made_purchase">Made a Purchase?</option>
          <option value="custom_field">Custom Customer Field</option>
        </select>
      </div>

      {config.conditionType === "custom_field" && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Field
            </label>
            <select
              value={config.field || ""}
              onChange={(e) => setConfig({ ...config, field: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">Select field...</option>
              <option value="totalSpent">Total Spent</option>
              <option value="totalOrders">Total Orders</option>
              <option value="averageOrderValue">Average Order Value</option>
              <option value="daysSinceLastOrder">Days Since Last Order</option>
              <option value="engagementScore">Engagement Score</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Operator
              </label>
              <select
                value={config.operator || ">"}
                onChange={(e) =>
                  setConfig({ ...config, operator: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value=">">Greater than</option>
                <option value="<">Less than</option>
                <option value=">=">Greater than or equal</option>
                <option value="<=">Less than or equal</option>
                <option value="=">Equals</option>
                <option value="!=">Not equals</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Value
              </label>
              <input
                type="number"
                value={config.value || ""}
                onChange={(e) =>
                  setConfig({ ...config, value: parseFloat(e.target.value) })
                }
                placeholder="100"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  const getTitle = () => {
    switch (nodeType) {
      case "trigger":
        return "Configure Trigger";
      case "email":
        return "Configure Email";
      case "delay":
        return "Configure Delay";
      case "condition":
        return "Configure Condition";
      default:
        return "Configure Node";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">{getTitle()}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {nodeType === "trigger" && renderTriggerConfig()}
        {nodeType === "email" && renderEmailConfig()}
        {nodeType === "delay" && renderDelayConfig()}
        {nodeType === "condition" && renderConditionConfig()}

        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
