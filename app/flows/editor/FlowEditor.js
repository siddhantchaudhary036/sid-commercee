"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowLeft,
  Save,
  Settings,
  ChevronDown,
  ChevronUp,
  Mail,
  Clock,
  GitBranch,
  Zap,
  Tag,
  Calendar,
  X,
} from "lucide-react";
import CustomNode from "./CustomNode";

const nodeTypes = {
  trigger: CustomNode,
  email: CustomNode,
  delay: CustomNode,
  condition: CustomNode,
};

export default function FlowEditor({ flow, userId, isNew, onBack }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    flow.flowDefinition.nodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    flow.flowDefinition.edges
  );
  const [flowName, setFlowName] = useState(flow.name);
  const [flowDescription, setFlowDescription] = useState(
    flow.description || ""
  );
  const [flowStatus, setFlowStatus] = useState(flow.status);
  const [showSettings, setShowSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showTestMode, setShowTestMode] = useState(false);

  const createFlow = useMutation(api.flows.create);
  const updateFlow = useMutation(api.flows.update);

  const saveTimeoutRef = useRef(null);

  // Validate flow in real-time
  useEffect(() => {
    const errors = validateFlow();
    setValidationErrors(errors);
  }, [nodes, edges]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (!isNew && flow._id) {
        handleAutoSave();
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [nodes, edges, flowName, flowDescription, flowStatus]);

  const handleAutoSave = async () => {
    try {
      await updateFlow({
        id: flow._id,
        name: flowName,
        description: flowDescription,
        status: flowStatus,
        flowDefinition: { nodes, edges },
      });
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: "#000" },
          },
          eds
        )
      ),
    [setEdges]
  );

  const validateFlow = () => {
    const errors = [];

    // Check for trigger node
    const triggerNodes = nodes.filter((n) => n.type === "trigger");
    if (triggerNodes.length === 0) {
      errors.push("⚠️ Missing trigger node - every flow needs a trigger");
    } else if (triggerNodes.length > 1) {
      errors.push("⚠️ Only one trigger node is allowed per flow");
    }

    // Check for at least one email node
    const emailNodes = nodes.filter((n) => n.type === "email");
    if (emailNodes.length === 0) {
      errors.push("⚠️ Flow must have at least one email node");
    }

    // Check for orphaned nodes (not connected)
    nodes.forEach((node) => {
      if (node.type === "trigger") return; // Trigger doesn't need input

      const hasInput = edges.some((edge) => edge.target === node.id);
      if (!hasInput) {
        errors.push(`⚠️ "${node.data.label}" is not connected`);
      }
    });

    // Check condition nodes have both paths
    const conditionNodes = nodes.filter((n) => n.type === "condition");
    conditionNodes.forEach((node) => {
      const yesPath = edges.some(
        (edge) => edge.source === node.id && edge.sourceHandle === "yes"
      );
      const noPath = edges.some(
        (edge) => edge.source === node.id && edge.sourceHandle === "no"
      );

      if (!yesPath || !noPath) {
        errors.push(
          `⚠️ Condition "${node.data.label}" needs both Yes and No paths`
        );
      }
    });

    // Check for circular loops (basic check)
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (nodeId) => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = edges.filter((e) => e.source === nodeId);
      for (const edge of outgoingEdges) {
        if (hasCycle(edge.target)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    if (triggerNodes.length > 0 && hasCycle(triggerNodes[0].id)) {
      errors.push("⚠️ Flow contains a circular loop");
    }

    return errors;
  };

  const handleSave = async () => {
    if (!flowName.trim()) {
      alert("Please provide a flow name");
      return;
    }

    // Run validation
    const errors = validateFlow();
    if (errors.length > 0) {
      alert(
        "Cannot save flow with validation errors:\n\n" + errors.join("\n")
      );
      return;
    }

    // Get trigger node config
    const triggerNode = nodes.find((n) => n.type === "trigger");
    const triggerType = triggerNode?.data?.triggerType || "segment_added";
    const triggerConfig = {
      segmentId: triggerNode?.data?.segmentId,
      segmentName: triggerNode?.data?.segmentName,
      tagName: triggerNode?.data?.tagName,
      triggerDate: triggerNode?.data?.triggerDate,
      triggerTime: triggerNode?.data?.triggerTime,
    };

    setIsSaving(true);
    try {
      if (isNew) {
        const flowId = await createFlow({
          userId,
          name: flowName.trim(),
          description: flowDescription.trim() || undefined,
          triggerType,
          triggerConfig,
          flowDefinition: { nodes, edges },
        });
        alert("✓ Flow created successfully!");
        window.location.href = `/flows/${flowId}/edit`;
      } else {
        await updateFlow({
          id: flow._id,
          name: flowName.trim(),
          description: flowDescription.trim() || undefined,
          status: flowStatus,
          triggerType,
          triggerConfig,
          flowDefinition: { nodes, edges },
        });
        alert("✓ Flow saved successfully!");
      }
    } catch (error) {
      console.error("Error saving flow:", error);
      alert("Failed to save flow: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      // Only allow one trigger node
      if (type === "trigger" && nodes.some((n) => n.type === "trigger")) {
        alert("Only one trigger node is allowed per flow");
        return;
      }

      const position = {
        x: event.clientX - 300,
        y: event.clientY - 100,
      };

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position: type === "trigger" ? { x: 100, y: 100 } : position,
        data: {
          label: type.charAt(0).toUpperCase() + type.slice(1),
          nodeType: type,
          userId: userId, // Pass userId for fetching segments
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, nodes, userId]
  );

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Flows
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Flow Editor</h1>
        </div>

        {/* Node Library */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-600 uppercase mb-3">
              Node Library
            </h2>
            <div className="space-y-2">
              <NodeLibraryItem
                type="trigger"
                label="Trigger"
                icon={<Zap className="w-4 h-4" />}
                description="Start the flow"
              />
              <NodeLibraryItem
                type="email"
                label="Send Email"
                icon={<Mail className="w-4 h-4" />}
                description="Send an email"
              />
              <NodeLibraryItem
                type="delay"
                label="Delay"
                icon={<Clock className="w-4 h-4" />}
                description="Wait before continuing"
              />
              <NodeLibraryItem
                type="condition"
                label="Condition"
                icon={<GitBranch className="w-4 h-4" />}
                description="Branch based on condition"
              />
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-gray-600 uppercase mb-3">
                Validation Errors
              </h2>
              <div className="space-y-2">
                {validationErrors.map((error, index) => (
                  <div
                    key={index}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800"
                  >
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flow Settings */}
          <div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center justify-between w-full text-xs font-semibold text-gray-600 uppercase mb-3"
            >
              <span>Flow Settings</span>
              {showSettings ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showSettings && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Flow Name *
                  </label>
                  <input
                    type="text"
                    value={flowName}
                    onChange={(e) => setFlowName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={flowDescription}
                    onChange={(e) => setFlowDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={flowStatus}
                    onChange={(e) => setFlowStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative">
        {/* Action Buttons */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          <button
            onClick={() => setShowTestMode(true)}
            disabled={validationErrors.length > 0}
            className="px-4 py-2 text-sm border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Test Flow
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || validationErrors.length > 0}
            className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Flow"}
          </button>
        </div>

        {/* React Flow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
        >
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case "trigger":
                  return "#fbbf24";
                case "email":
                  return "#60a5fa";
                case "delay":
                  return "#a78bfa";
                case "condition":
                  return "#34d399";
                default:
                  return "#9ca3af";
              }
            }}
          />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>

      {/* Test Mode Modal */}
      {showTestMode && (
        <TestModeModal
          nodes={nodes}
          edges={edges}
          userId={userId}
          onClose={() => setShowTestMode(false)}
        />
      )}
    </div>
  );
}

function TestModeModal({ nodes, edges, userId, onClose }) {
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const customers = useQuery(
    api.customers.list,
    userId ? { userId, limit: 50 } : "skip"
  );

  const runSimulation = () => {
    if (!selectedCustomer) {
      alert("Please select a test customer");
      return;
    }

    setIsSimulating(true);

    // Simulate flow execution
    setTimeout(() => {
      const customer = customers?.customers.find(
        (c) => c._id === selectedCustomer
      );
      if (!customer) return;

      const triggerNode = nodes.find((n) => n.type === "trigger");
      if (!triggerNode) return;

      const path = [];
      const emails = [];
      let totalDays = 0;

      // Traverse the flow
      let currentNodeId = triggerNode.id;
      const visited = new Set();

      while (currentNodeId && !visited.has(currentNodeId)) {
        visited.add(currentNodeId);
        const node = nodes.find((n) => n.id === currentNodeId);
        if (!node) break;

        path.push(node);

        if (node.type === "email") {
          emails.push({
            subject: node.data.subject || "Email",
            content: node.data.content || "",
          });
        }

        if (node.type === "delay") {
          const duration = node.data.duration || 1;
          const unit = node.data.unit || "days";
          const daysMap = { minutes: 0, hours: 0, days: 1, weeks: 7 };
          totalDays += duration * (daysMap[unit] || 1);
        }

        // Find next node
        let nextEdge;
        if (node.type === "condition") {
          // Simulate condition evaluation
          const conditionMet = Math.random() > 0.5;
          nextEdge = edges.find(
            (e) =>
              e.source === currentNodeId &&
              e.sourceHandle === (conditionMet ? "yes" : "no")
          );
        } else {
          nextEdge = edges.find((e) => e.source === currentNodeId);
        }

        currentNodeId = nextEdge?.target;
      }

      setSimulationResult({
        customer,
        path,
        emails,
        totalDays,
      });
      setIsSimulating(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Test Flow</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Select Test Customer
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">Choose a customer...</option>
              {customers?.customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.firstName} {customer.lastName} ({customer.email})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={runSimulation}
            disabled={!selectedCustomer || isSimulating}
            className="w-full px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {isSimulating ? "Running Simulation..." : "Run Simulation"}
          </button>
        </div>

        {simulationResult && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Simulation Result
            </h3>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-900 mb-2">
                  Customer would receive {simulationResult.emails.length} email
                  {simulationResult.emails.length !== 1 ? "s" : ""} over{" "}
                  {simulationResult.totalDays} day
                  {simulationResult.totalDays !== 1 ? "s" : ""}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-600 uppercase mb-2">
                  Flow Path
                </div>
                <div className="space-y-2">
                  {simulationResult.path.map((node, index) => (
                    <div
                      key={node.id}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div>
                        {node.data.label}
                        {node.type === "email" && node.data.subject && (
                          <span className="text-gray-500">
                            {" "}
                            - "{node.data.subject}"
                          </span>
                        )}
                        {node.type === "delay" && node.data.duration && (
                          <span className="text-gray-500">
                            {" "}
                            - Wait {node.data.duration} {node.data.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {simulationResult.emails.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-600 uppercase mb-2">
                    Emails to be Sent
                  </div>
                  <div className="space-y-2">
                    {simulationResult.emails.map((email, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {email.subject}
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-2">
                          {email.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function NodeLibraryItem({ type, label, icon, description }) {
  const onDragStart = (event) => {
    event.dataTransfer.setData("application/reactflow", type);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="p-3 border border-gray-200 rounded-lg bg-white hover:border-gray-400 cursor-move transition"
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded text-gray-600">
          {icon}
        </div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
      </div>
      <div className="text-xs text-gray-500 ml-11">{description}</div>
    </div>
  );
}
