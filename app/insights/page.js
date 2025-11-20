"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Loader2, Sparkles, Lightbulb } from "lucide-react";
import { useState, useEffect } from "react";
import { extractFeatures } from "@/lib/insights/featureExtractor";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";

export default function InsightsPage() {
  const { user: clerkUser } = useUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState(null);
  const [lastGenerated, setLastGenerated] = useState(null);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Get Convex user ID from Clerk ID
  const convexUserId = useQuery(
    api.users.getConvexUserId,
    clerkUser ? { clerkId: clerkUser.id } : "skip"
  );

  // Fetch insights data for generation
  const insightsData = useQuery(
    api.insights.fetchInsightsData,
    convexUserId ? { userId: convexUserId } : "skip"
  );

  // Get stored insights
  const storedInsights = useQuery(
    api.insights.getStoredInsights,
    convexUserId ? { userId: convexUserId } : "skip"
  );

  // Store insights mutation
  const storeInsights = useMutation(api.insights.storeInsights);

  // Load stored insights on mount
  useEffect(() => {
    if (storedInsights) {
      setInsights(storedInsights.insights);
      setLastGenerated(storedInsights.generatedAt);
    }
  }, [storedInsights]);

  const handleGenerateInsights = async () => {
    if (!insightsData || !convexUserId) return;

    setIsGenerating(true);
    try {
      const features = extractFeatures(insightsData);

      const response = await fetch("/api/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features, userId: convexUserId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate insights");
      }

      const result = await response.json();

      await storeInsights({
        userId: convexUserId,
        insights: result.insights,
      });

      setInsights(result.insights);
      setLastGenerated(result.generatedAt);
      toast.success("Insights generated successfully!");
    } catch (error) {
      console.error("Error generating insights:", error);
      toast.error(error.message || "Failed to generate insights");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!clerkUser || insightsData === undefined || convexUserId === undefined) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const filteredInsights = insights
    ? insights.filter((insight) => {
        if (filter !== "all" && insight.priority !== filter) return false;
        if (typeFilter !== "all" && insight.type !== typeFilter) return false;
        return true;
      })
    : [];

  const groupedInsights = {
    high: filteredInsights.filter((i) => i.priority === "high"),
    medium: filteredInsights.filter((i) => i.priority === "medium"),
    low: filteredInsights.filter((i) => i.priority === "low"),
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Insights</h1>
          <p className="text-sm text-gray-600">
            AI-powered analysis of your marketing performance
          </p>
          {lastGenerated && (
            <p className="text-xs text-gray-500 mt-1">
              Last generated: {new Date(lastGenerated).toLocaleString()}
            </p>
          )}
        </div>
        <button
          onClick={handleGenerateInsights}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Insights
            </>
          )}
        </button>
      </div>

      {!insights && !isGenerating && (
        <EmptyState onGenerate={handleGenerateInsights} />
      )}

      {isGenerating && <LoadingState insightsData={insightsData} />}

      {insights && insights.length > 0 && (
        <>
          <div className="flex gap-3 mb-6">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="all">All Types</option>
              <option value="send_time">Send Time</option>
              <option value="subject_line">Subject Lines</option>
              <option value="segment_performance">Segments</option>
              <option value="flow_effectiveness">Flows</option>
              <option value="revenue_opportunity">Opportunities</option>
            </select>
          </div>

          {groupedInsights.high.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                High Priority
              </h2>
              <div className="space-y-4">
                {groupedInsights.high.map((insight, idx) => (
                  <InsightCard key={idx} insight={insight} />
                ))}
              </div>
            </div>
          )}

          {groupedInsights.medium.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Medium Priority
              </h2>
              <div className="space-y-4">
                {groupedInsights.medium.map((insight, idx) => (
                  <InsightCard key={idx} insight={insight} />
                ))}
              </div>
            </div>
          )}

          {groupedInsights.low.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Low Priority
              </h2>
              <div className="space-y-4">
                {groupedInsights.low.map((insight, idx) => (
                  <InsightCard key={idx} insight={insight} />
                ))}
              </div>
            </div>
          )}

          {filteredInsights.length === 0 && (
            <div className="border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-sm text-gray-600">
                No insights match your filters
              </p>
            </div>
          )}
        </>
      )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onGenerate }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
      <Lightbulb className="w-16 h-16 text-gray-400 mb-4" />
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        No Insights Yet
      </h3>
      <p className="text-sm text-gray-600 text-center max-w-md mb-6">
        Our AI will analyze your campaign and flow performance data to discover
        patterns and recommend improvements.
      </p>
      <button
        onClick={onGenerate}
        className="px-6 py-3 bg-black text-white rounded-lg text-sm hover:bg-gray-800"
      >
        Generate Your First Insights
      </button>
    </div>
  );
}

function LoadingState({ insightsData }) {
  const campaignCount = insightsData?.campaignPerformance?.length || 0;
  const flowCount = insightsData?.flowPerformance?.length || 0;

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-4" />
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        Analyzing Your Data...
      </h3>
      <p className="text-sm text-gray-600 text-center max-w-md mb-6">
        Our AI is reviewing your campaign performance, flow data, and customer
        segments to generate actionable insights.
      </p>
      <div className="space-y-2 text-sm text-gray-500">
        <p className="flex items-center gap-2">
          <span className="text-gray-400">✓</span>
          Analyzing {campaignCount} campaign records
        </p>
        <p className="flex items-center gap-2">
          <span className="text-gray-400">✓</span>
          Reviewing {flowCount} flow executions
        </p>
        <p className="flex items-center gap-2">
          <span className="text-gray-400">✓</span>
          Identifying patterns...
        </p>
      </div>
    </div>
  );
}

function InsightCard({ insight }) {
  const priorityStyles = {
    high: "bg-gray-900 text-white",
    medium: "bg-gray-200 text-gray-900",
    low: "bg-gray-100 text-gray-600",
  };

  const typeLabels = {
    send_time: "Send Time",
    subject_line: "Subject Line",
    segment_performance: "Segment Performance",
    flow_effectiveness: "Flow Effectiveness",
    revenue_opportunity: "Revenue Opportunity",
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                priorityStyles[insight.priority]
              }`}
            >
              {insight.priority.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">
              {typeLabels[insight.type] || insight.type}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">
            {insight.title}
          </h3>
        </div>
        <div className="text-sm font-semibold text-gray-900 ml-4">
          {insight.expectedImpact}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-gray-700 mb-1">Finding</p>
        <p className="text-sm text-gray-600">{insight.finding}</p>
      </div>

      <div className="mb-4 bg-gray-50 p-3 rounded">
        <p className="text-xs font-medium text-gray-700 mb-1">Evidence</p>
        <p className="text-xs text-gray-600">{insight.evidence}</p>
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-gray-700 mb-1">Why It Matters</p>
        <p className="text-sm text-gray-600">{insight.whyItMatters}</p>
      </div>

      <div className="bg-gray-50 p-4 rounded border border-gray-200">
        <p className="text-xs font-medium text-gray-700 mb-2">Recommendation</p>
        <p className="text-sm text-gray-900">{insight.recommendation}</p>
      </div>
    </div>
  );
}
