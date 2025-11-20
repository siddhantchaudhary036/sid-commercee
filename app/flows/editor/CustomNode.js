import { memo, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { Mail, Clock, GitBranch, Zap, Settings } from "lucide-react";
import NodeConfigModal from "./NodeConfigModal";

function CustomNode({ id, data, isConnectable }) {
  const [showConfig, setShowConfig] = useState(false);

  const getNodeIcon = (type) => {
    switch (type) {
      case "trigger":
        return <Zap className="w-4 h-4" />;
      case "email":
        return <Mail className="w-4 h-4" />;
      case "delay":
        return <Clock className="w-4 h-4" />;
      case "condition":
        return <GitBranch className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getNodeColor = (type) => {
    switch (type) {
      case "trigger":
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "email":
        return "bg-blue-100 border-blue-300 text-blue-800";
      case "delay":
        return "bg-purple-100 border-purple-300 text-purple-800";
      case "condition":
        return "bg-green-100 border-green-300 text-green-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getNodePreview = () => {
    const nodeType = data.nodeType || "trigger";
    
    switch (nodeType) {
      case "trigger":
        return data.segmentName || data.triggerType || "Click to configure";
      case "email":
        if (data.templateName) {
          return `📧 ${data.templateName}`;
        }
        return data.subject || "Click to select template";
      case "delay":
        return data.duration
          ? `Wait ${data.duration} ${data.unit || "days"}`
          : "Click to configure delay";
      case "condition":
        return data.conditionType || "Click to configure condition";
      default:
        return data.label;
    }
  };

  const nodeType = data.nodeType || "trigger";

  return (
    <>
      <div
        className={`px-4 py-3 shadow-md rounded-lg border-2 min-w-[200px] hover:shadow-lg transition ${getNodeColor(
          nodeType
        )}`}
      >
        {/* Input Handle (except for trigger) */}
        {nodeType !== "trigger" && (
          <Handle
            type="target"
            position={Position.Top}
            isConnectable={isConnectable}
            className="w-3 h-3 !bg-gray-600"
          />
        )}

        <div 
          onClick={() => setShowConfig(true)}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              {getNodeIcon(nodeType)}
              <div className="font-medium text-sm">{data.label}</div>
            </div>
            <Settings className="w-3 h-3 opacity-50" />
          </div>

          <div className="text-xs opacity-75 truncate">{getNodePreview()}</div>
        </div>

        {/* Output Handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className="w-3 h-3 !bg-gray-600"
        />

        {/* Condition node has two outputs */}
        {nodeType === "condition" && (
          <>
            <Handle
              type="source"
              position={Position.Right}
              id="yes"
              isConnectable={isConnectable}
              className="w-3 h-3 !bg-green-600"
              style={{ top: "50%" }}
            />
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full ml-2 text-xs font-medium text-green-600"
              style={{ pointerEvents: "none" }}
            >
              Yes
            </div>
            <Handle
              type="source"
              position={Position.Left}
              id="no"
              isConnectable={isConnectable}
              className="w-3 h-3 !bg-red-600"
              style={{ top: "50%" }}
            />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full mr-2 text-xs font-medium text-red-600"
              style={{ pointerEvents: "none" }}
            >
              No
            </div>
          </>
        )}
      </div>

      {showConfig && (
        <NodeConfigModal
          nodeId={id}
          nodeType={nodeType}
          nodeData={data}
          onClose={() => setShowConfig(false)}
        />
      )}
    </>
  );
}

export default memo(CustomNode);
