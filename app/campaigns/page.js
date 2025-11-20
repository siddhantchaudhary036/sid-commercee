"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Sidebar from "../components/Sidebar";
import Link from "next/link";

export default function CampaignsPage() {
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser, user ? { clerkId: user.id } : "skip");
  const campaigns = useQuery(api.campaigns.list, currentUser ? { userId: currentUser._id } : "skip");
  const stats = useQuery(api.campaigns.getStats, currentUser ? { userId: currentUser._id } : "skip");

  if (!currentUser || !campaigns || !stats) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 mb-1">Campaigns</h1>
              <p className="text-sm text-gray-600">
                Create and manage your email campaigns
              </p>
            </div>
            <Link
              href="/campaigns/new"
              className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
            >
              + Create Campaign
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Total Campaigns</div>
              <div className="text-2xl font-semibold text-gray-900">
                {stats.totalCampaigns}
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Sent This Month</div>
              <div className="text-2xl font-semibold text-gray-900">
                {stats.sentThisMonth}
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Avg Open Rate</div>
              <div className="text-2xl font-semibold text-gray-900">
                {stats.avgOpenRate}%
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Total Revenue</div>
              <div className="text-2xl font-semibold text-gray-900">
                ${stats.totalRevenue.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Campaigns List */}
          {campaigns.length === 0 ? (
            <div className="border border-gray-200 rounded-lg p-12 text-center">
              <div className="text-sm text-gray-600 mb-4">
                No campaigns yet. Create your first campaign to get started.
              </div>
              <Link
                href="/campaigns/new"
                className="inline-block px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
              >
                + Create Campaign
              </Link>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Campaign
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Recipients
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Performance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr
                      key={campaign._id}
                      onClick={() => {
                        if (campaign.status === "draft") {
                          window.location.href = `/campaigns/new?id=${campaign._id}`;
                        } else {
                          window.location.href = `/campaigns/${campaign._id}`;
                        }
                      }}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {campaign.aiGenerated && (
                            <span className="text-xs">✨</span>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {campaign.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {campaign.subject}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            campaign.status === "draft"
                              ? "bg-gray-100 text-gray-600"
                              : campaign.status === "scheduled"
                              ? "bg-blue-100 text-blue-700"
                              : campaign.status === "sent"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {campaign.sentCount || 0}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {campaign.status === "sent" ? (
                          <div className="text-xs text-gray-600">
                            <div>{campaign.openRate || 0}% opens</div>
                            <div className="font-medium text-gray-900">
                              ${(campaign.attributedRevenue || 0).toLocaleString()}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">—</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs text-gray-600">
                          {campaign.sentAt
                            ? new Date(campaign.sentAt).toLocaleDateString()
                            : new Date(campaign.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
