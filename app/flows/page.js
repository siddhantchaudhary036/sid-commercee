"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Search, Plus, TrendingUp, Activity, DollarSign, Zap } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { FlowCard } from "./components";

export default function FlowsPage() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const flows = useQuery(
    api.flows.list,
    convexUser
      ? {
          userId: convexUser._id,
          status: statusFilter || undefined,
        }
      : "skip"
  );

  const stats = useQuery(
    api.flows.getStats,
    convexUser ? { userId: convexUser._id } : "skip"
  );

  if (!user || !convexUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  const filteredFlows = flows?.filter((flow) =>
    flow.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        {/* Header */}
        <div className="border-b border-gray-200">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900">Flows</h1>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search flows..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="draft">Draft</option>
                </select>
                <button
                  onClick={() => (window.location.href = "/flows/new")}
                  className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Flow
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Flows"
              value={stats?.totalFlows || 0}
              icon={<Zap className="w-4 h-4 text-gray-400" />}
            />
            <StatCard
              label="Active Flows"
              value={stats?.activeFlows || 0}
              icon={<Activity className="w-4 h-4 text-gray-400" />}
            />
            <StatCard
              label="Avg Completion Rate"
              value={`${stats?.avgCompletionRate || 0}%`}
              icon={<TrendingUp className="w-4 h-4 text-gray-400" />}
            />
            <StatCard
              label="Total Revenue"
              value={`$${(stats?.totalRevenue || 0).toLocaleString()}`}
              icon={<DollarSign className="w-4 h-4 text-gray-400" />}
            />
          </div>

          {/* Flows Grid */}
          {!flows ? (
            <LoadingSkeleton />
          ) : filteredFlows && filteredFlows.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredFlows.map((flow) => (
                <FlowCard key={flow._id} flow={flow} userId={convexUser._id} />
              ))}
            </div>
          ) : searchTerm || statusFilter ? (
            <EmptySearchState
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              onClear={() => {
                setSearchTerm("");
                setStatusFilter("");
              }}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-600">{label}</div>
        {icon}
      </div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 border border-gray-200 rounded-lg">
      <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-sm font-semibold text-gray-900 mb-2">No flows yet</h3>
      <p className="text-sm text-gray-600 mb-6">
        Create your first automated flow to engage customers
      </p>
      <button
        onClick={() => (window.location.href = "/flows/new")}
        className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
      >
        Create Your First Flow
      </button>
    </div>
  );
}

function EmptySearchState({ searchTerm, statusFilter, onClear }) {
  return (
    <div className="text-center py-12 border border-gray-200 rounded-lg">
      <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-sm font-semibold text-gray-900 mb-2">No flows found</h3>
      <p className="text-sm text-gray-600 mb-6">
        {searchTerm && `No flows match "${searchTerm}"`}
        {searchTerm && statusFilter && " with "}
        {statusFilter && `status "${statusFilter}"`}
      </p>
      <button
        onClick={onClear}
        className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
      >
        Clear Filters
      </button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-6 animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="h-5 bg-gray-200 rounded w-48"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="flex gap-2 mb-4">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="flex gap-4 mb-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
