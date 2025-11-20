"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Search, Plus, Mail, Sparkles } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { TemplateCard, CreateTemplateModal } from "./components";

export default function EmailTemplatesPage() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const templates = useQuery(
    api.emailTemplates.list,
    convexUser
      ? {
          userId: convexUser._id,
          category: categoryFilter || undefined,
        }
      : "skip"
  );

  const stats = useQuery(
    api.emailTemplates.getStats,
    convexUser ? { userId: convexUser._id } : "skip"
  );

  if (!user || !convexUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  const filteredTemplates = templates?.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        {/* Header */}
        <div className="border-b border-gray-200">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900">
                Email Templates
              </h1>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 w-64"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">All Categories</option>
                  <option value="Welcome">Welcome</option>
                  <option value="Win-back">Win-back</option>
                  <option value="Promotional">Promotional</option>
                  <option value="Transactional">Transactional</option>
                  <option value="General">General</option>
                </select>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Template
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Templates"
              value={stats?.totalTemplates || 0}
              icon={<Mail className="w-4 h-4 text-gray-400" />}
            />
            <StatCard
              label="Custom Templates"
              value={stats?.customTemplates || 0}
            />
            <StatCard
              label="System Templates"
              value={stats?.systemTemplates || 0}
              icon={<Sparkles className="w-4 h-4 text-gray-400" />}
            />
            <StatCard
              label="Categories"
              value={Object.keys(stats?.categories || {}).length}
            />
          </div>

          {/* Templates Grid */}
          {!templates ? (
            <LoadingSkeleton />
          ) : filteredTemplates && filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template._id}
                  template={template}
                />
              ))}
            </div>
          ) : searchTerm || categoryFilter ? (
            <EmptySearchState
              searchTerm={searchTerm}
              categoryFilter={categoryFilter}
              onClear={() => {
                setSearchTerm("");
                setCategoryFilter("");
              }}
            />
          ) : (
            <EmptyState onCreateClick={() => setShowCreateModal(true)} />
          )}
        </div>

        {/* Create Template Modal */}
        {showCreateModal && (
          <CreateTemplateModal
            onClose={() => setShowCreateModal(false)}
          />
        )}
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

function EmptyState({ onCreateClick }) {
  return (
    <div className="text-center py-12 border border-gray-200 rounded-lg">
      <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        No email templates yet
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Create your first email template to use in campaigns and flows
      </p>
      <button
        onClick={onCreateClick}
        className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
      >
        Create Your First Template
      </button>
    </div>
  );
}

function EmptySearchState({ searchTerm, categoryFilter, onClear }) {
  return (
    <div className="text-center py-12 border border-gray-200 rounded-lg">
      <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        No templates found
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        {searchTerm && `No templates match "${searchTerm}"`}
        {searchTerm && categoryFilter && " in "}
        {categoryFilter && `category "${categoryFilter}"`}
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
        <div
          key={i}
          className="border border-gray-200 rounded-lg p-6 animate-pulse"
        >
          <div className="h-5 bg-gray-200 rounded w-48 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded w-full mb-4"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
