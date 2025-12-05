"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { X, Eye, Trash2 } from "lucide-react";
import { EmailTemplateSelector } from "@/app/components/EmailTemplateSelector";

function FlowRightPanel({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  onClose,
}) {
  const [config, setConfig] = useState(selectedNode?.data || {});

  useEffect(() => {
    if (selectedNode) {
      setConfig(selectedNode.data || {});
    }
  }, [selectedNode]);

  const segments = useQuery(
    api.segments.list,
    selectedNode?.type === "trigger" && config.userId
      ? { userId: config.userId }
      : "skip"
  );

  const selectedTemplate = useQuery(
    api.emailTemplates.getById,
    selectedNode?.type === "email" && config.emailTemplateId
      ? { id: config.emailTemplateId }
      : "skip"
  );

  useEffect(() => {
    if (selectedTemplate && selectedNode?.type === "email") {
      setConfig((prev) => ({
        ...prev,
        templateName: selectedTemplate.name,
        templateSubject: selectedTemplate.subject,
        subject: prev.customSubject || selectedTemplate.subject,
        content: selectedTemplate.content,
      }));
    }
  }, [selectedTemplate, selectedNode?.type]);

  const handleSave = () => {
    if (selectedNode) {
      onUpdateNode(selectedNode.id, config);
    }
  };

  const handleDelete = () => {
    if (selectedNode && confirm("Delete this node?")) {
      onDeleteNode(selectedNode.id);
      onClose();
    }
  };

  if (!selectedNode) {
    return (
      <div className="w-96 border-l border-gray-200 bg-white p-6">
        <div className="text-center text-sm text-gray-500 mt-12">
          Select a node to configure
        </div>
      </div>
    );
  }

  const nodeType = selectedNode.type;

  return (
    <div className="w-96 border-l border-gray-200 bg-white flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">
            {nodeType === "trigger" && "Configure Trigger"}
            {nodeType === "email" && "Configure Email"}
            {nodeType === "delay" && "Configure Delay"}
            {nodeType === "condition" && "Configure Condition"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {nodeType !== "trigger" && (
          <button
            onClick={handleDelete}
            className="w-full px-3 py-2 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-3 h-3" />
            Delete Node
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {nodeType === "trigger" && (
          <TriggerConfig
            config={config}
            setConfig={setConfig}
            segments={segments}
          />
        )}
        {nodeType === "email" && (
          <EmailConfig
            config={config}
            setConfig={setConfig}
            selectedTemplate={selectedTemplate}
          />
        )}
        {nodeType === "delay" && (
          <DelayConfig config={config} setConfig={setConfig} />
        )}
        {nodeType === "condition" && (
          <ConditionConfig config={config} setConfig={setConfig} />
        )}
      </div>

      <div className="p-6 border-t border-gray-200">
        <button
          onClick={handleSave}
          className="w-full px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}

function TriggerConfig({ config, setConfig, segments }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Trigger Type
        </label>
        <select
          value={config.triggerType || "segment_added"}
          onChange={(e) => setConfig({ ...config, triggerType: e.target.value })}
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
}

function EmailConfig({ config, setConfig, selectedTemplate }) {
  const segments = useQuery(
    api.segments.list,
    config.userId ? { userId: config.userId } : "skip"
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Node Name
        </label>
        <input
          type="text"
          value={config.nodeName || config.label || ""}
          onChange={(e) =>
            setConfig({ ...config, nodeName: e.target.value, label: e.target.value })
          }
          placeholder="e.g., Welcome Email"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Send to Segment <span className="text-gray-400">*</span>
        </label>
        {config.userId ? (
          <>
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
            <div className="text-xs text-gray-500 mt-1">
              Select which customer segment will receive this email
            </div>
          </>
        ) : (
          <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded border border-gray-200">
            Save the flow first to select a segment
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Email Template <span className="text-gray-400">*</span>
        </label>
        {config.userId ? (
          <EmailTemplateSelector
            selectedId={config.emailTemplateId}
            onSelect={(templateId) => {
              setConfig({ ...config, emailTemplateId: templateId });
            }}
            userId={config.userId}
            allowCreate={true}
          />
        ) : (
          <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded border border-gray-200">
            Save the flow first to select a template
          </div>
        )}
        <div className="text-xs text-gray-500 mt-1">
          Choose an email template from your library
        </div>
      </div>

      {config.emailTemplateId && selectedTemplate && (
        <>
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-700">
                Template Preview
              </label>
              <button
                onClick={() => {
                  window.open(
                    `/emails/editor?id=${config.emailTemplateId}`,
                    "_blank"
                  );
                }}
                className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                Edit Template
              </button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-900 mb-1">
                {selectedTemplate.name}
              </div>
              <div className="text-xs text-gray-600 mb-2">
                Subject: {selectedTemplate.subject}
              </div>
              <div className="text-xs text-gray-500">
                Category: {selectedTemplate.category}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Custom Subject <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={config.customSubject || ""}
              onChange={(e) =>
                setConfig({ ...config, customSubject: e.target.value })
              }
              placeholder={selectedTemplate.subject}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <div className="text-xs text-gray-500 mt-1">
              Leave blank to use template subject line
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DelayConfig({ config, setConfig }) {
  return (
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
}

function ConditionConfig({ config, setConfig }) {
  return (
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
}


export default FlowRightPanel;
