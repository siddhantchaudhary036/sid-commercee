"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Search, Plus, Sparkles } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { SegmentCard, CreateSegmentModal } from "./components";

export default function SegmentsPage() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const segments = useQuery(
    api.segments.list,
    convexUser ? { userId: convexUser._id } : "skip"
  );

  const stats = useQuery(
    api.segments.getStats,
    convexUser ? { userId: convexUser._id } : "skip"
  );

  if (!user || !convexUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  const filteredSegments = segments?.filter((segment) =>
    segment.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        {/* Header */}
        <div className="border-b border-gray-200">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900">Segments</h1>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search segments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 w-64"
                  />
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Segment
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Segments"
              value={stats?.totalSegments || 0}
            />
            <StatCard label="Avg Size" value={stats?.avgSize || 0} />
            <StatCard
              label="AI-Generated"
              value={stats?.aiGenerated || 0}
              icon={<Sparkles className="w-4 h-4 text-gray-400" />}
            />
            <StatCard
              label="Largest Segment"
              value={
                stats?.largestSegment
                  ? `${stats.largestSegment.name} (${stats.largestSegment.count})`
                  : "None"
              }
              small
            />
          </div>

          {/* Segments List */}
          {!segments ? (
            <LoadingSkeleton />
          ) : filteredSegments && filteredSegments.length > 0 ? (
            <div className="space-y-4">
              {filteredSegments.map((segment) => (
                <SegmentCard
                  key={segment._id}
                  segment={segment}
                  userId={convexUser._id}
                />
              ))}
            </div>
          ) : debouncedSearch ? (
            <EmptySearchState searchTerm={debouncedSearch} onClear={() => setSearchTerm("")} />
          ) : (
            <EmptyState onCreateClick={() => setShowCreateModal(true)} />
          )}
        </div>

        {/* Create Segment Modal */}
        {showCreateModal && (
          <CreateSegmentModal
            userId={convexUser._id}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, small }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-600">{label}</div>
        {icon}
      </div>
      <div className={`${small ? "text-sm" : "text-2xl"} font-semibold text-gray-900`}>
        {value}
      </div>
    </div>
  );
}

function EmptyState({ onCreateClick }) {
  return (
    <div className="text-center py-12 border border-gray-200 rounded-lg">
      <div className="text-4xl mb-4">🎯</div>
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        No segments yet
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Create your first segment to organize and target customers
      </p>
      <button
        onClick={onCreateClick}
        className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
      >
        Create Your First Segment
      </button>
    </div>
  );
}

function EmptySearchState({ searchTerm, onClear }) {
  return (
    <div className="text-center py-12 border border-gray-200 rounded-lg">
      <div className="text-4xl mb-4">🔍</div>
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        No segments found
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        No segments match "{searchTerm}"
      </p>
      <button
        onClick={onClear}
        className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
      >
        Clear Search
      </button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-6 animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="h-5 bg-gray-200 rounded w-48"></div>
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-3 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
