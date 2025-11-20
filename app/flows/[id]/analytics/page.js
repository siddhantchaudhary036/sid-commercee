"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  Edit,
  Copy,
  Mail,
  GitBranch,
  Zap,
} from "lucide-react";
import Sidebar from "@/app/components/Sidebar";

export default function FlowAnalyticsPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const flowId = params.id;

  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const analytics = useQuery(
    api.flows.getAnalytics,
    flowId ? { flowId } : "skip"
  );

  const duplicateFlow = useMutation(api.flows.duplicate);

  if (!user || !convexUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-gray-500">Loading analytics...</div>
        </div>
      </div>
    );
  }

  const { flow, overview, stepBreakdown, historicalPerformance } = analytics;

  const handleDuplicate = async () => {
    try {
      const newFlowId = await duplicateFlow({ flowId: flow._id });
      alert("✓ Flow duplicated successfully!");
      router.push(`/flows/${newFlowId}/edit`);
    } catch (error) {
      console.error("Error duplicating flow:", error);
      alert("Failed to duplicate flow: " + error.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        {/* Header */}
        <div className="border-b border-gray-200">
          <div className="px-8 py-6">
            <button
              onClick={() => router.push("/flows")}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Flows
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-gray-900 mb-2">
                  {flow.name}
                </h1>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                      flow.status === "active"
                        ? "bg-green-100 text-green-800 border-green-300"
                        : flow.status === "paused"
                        ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                        : "bg-gray-100 text-gray-700 border-gray-300"
                    }`}
                  >
                    {flow.status.charAt(0).toUpperCase() + flow.status.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    Created {new Date(flow.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDuplicate}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <button
                  onClick={() => router.push(`/flows/${flow._id}/edit`)}
                  className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Flow
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Performance Overview */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Performance Overview
            </h2>
            <div className="grid grid-cols-5 gap-4">
              <MetricCard
                label="Total Recipients"
                value={overview.totalRecipients.toLocaleString()}
                icon={<Users className="w-4 h-4 text-gray-400" />}
              />
              <MetricCard
                label="Completion Rate"
                value={`${Math.round(overview.completionRate * 100)}%`}
                icon={<TrendingUp className="w-4 h-4 text-gray-400" />}
                trend={overview.completionRate > 0.5 ? "up" : "down"}
              />
              <MetricCard
                label="Total Revenue"
                value={`$${overview.totalRevenue.toLocaleString()}`}
                icon={<DollarSign className="w-4 h-4 text-gray-400" />}
              />
              <MetricCard
                label="Revenue / Recipient"
                value={`$${overview.revenuePerRecipient.toFixed(2)}`}
                icon={<DollarSign className="w-4 h-4 text-gray-400" />}
              />
              <MetricCard
                label="Avg Time to Complete"
                value={`${overview.avgTimeToComplete.toFixed(1)} days`}
                icon={<Clock className="w-4 h-4 text-gray-400" />}
              />
            </div>
          </div>

          {/* Step-by-Step Breakdown */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Step-by-Step Breakdown
            </h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase">
                  <div className="col-span-5">Step</div>
                  <div className="col-span-3">Recipients</div>
                  <div className="col-span-4">Progress</div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {stepBreakdown.map((step, index) => (
                  <StepRow
                    key={step.nodeId}
                    step={step}
                    index={index}
                    totalRecipients={overview.totalRecipients}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Historical Performance */}
          {historicalPerformance.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Historical Performance
              </h2>
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="space-y-3">
                  {historicalPerformance.map((record, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="text-gray-600">
                        {new Date(record.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-6">
                        <div>
                          <span className="text-gray-600">Recipients:</span>{" "}
                          <span className="font-medium text-gray-900">
                            {record.recipients}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Completion:</span>{" "}
                          <span className="font-medium text-gray-900">
                            {Math.round(record.completionRate * 100)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Revenue:</span>{" "}
                          <span className="font-medium text-gray-900">
                            ${record.revenue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Drop-off Warning */}
          {overview.dropOffNodeId && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-orange-900 mb-1">
                  High Drop-off Detected
                </h3>
                <p className="text-xs text-orange-800">
                  Most users are dropping off at step "
                  {stepBreakdown.find((s) => s.nodeId === overview.dropOffNodeId)
                    ?.name || "Unknown"}
                  ". Consider reviewing this step to improve completion rates.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, trend }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-600">{label}</div>
        {icon}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-2xl font-semibold text-gray-900">{value}</div>
        {trend === "up" && <TrendingUp className="w-4 h-4 text-green-600" />}
        {trend === "down" && <TrendingDown className="w-4 h-4 text-red-600" />}
      </div>
    </div>
  );
}

function StepRow({ step, index, totalRecipients }) {
  const getStepIcon = (type) => {
    switch (type) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "delay":
        return <Clock className="w-4 h-4" />;
      case "condition":
        return <GitBranch className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={`px-6 py-4 ${
        step.isDropOffPoint ? "bg-orange-50" : "hover:bg-gray-50"
      }`}
    >
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-5 flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-white border border-gray-300 rounded text-gray-600">
            {getStepIcon(step.type)}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{step.name}</div>
            <div className="text-xs text-gray-500 capitalize">{step.type}</div>
          </div>
          {step.isDropOffPoint && (
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          )}
        </div>
        <div className="col-span-3">
          <div className="text-sm font-medium text-gray-900">
            {step.recipients.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            {step.percentage}% of total
          </div>
        </div>
        <div className="col-span-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                step.isDropOffPoint ? "bg-orange-500" : "bg-gray-900"
              }`}
              style={{ width: `${step.percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
