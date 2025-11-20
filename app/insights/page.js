"use client";

import Sidebar from "../components/Sidebar";

export default function InsightsPage() {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Insights</h1>
          <p className="text-sm text-gray-500">
            AI performance insights coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
