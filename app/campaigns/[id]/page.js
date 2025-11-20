"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Sidebar from "@/app/components/Sidebar";
import Link from "next/link";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser, user ? { clerkId: user.id } : "skip");
  const campaign = useQuery(
    api.campaigns.getById,
    params.id ? { id: params.id } : "skip"
  );
  const segment = useQuery(
    api.segments.getById,
    campaign?.segmentId ? { id: campaign.segmentId } : "skip"
  );
  const allCampaigns = useQuery(
    api.campaigns.list,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const duplicateCampaign = useMutation(api.campaigns.duplicate);

  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const handleDuplicate = async () => {
    if (!campaign) return;
    try {
      const newId = await duplicateCampaign({ campaignId: campaign._id });
      router.push(`/campaigns/new?id=${newId}`);
    } catch (error) {
      console.error("Error duplicating campaign:", error);
      alert("Failed to duplicate campaign");
    }
  };

  if (!currentUser || !campaign) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  const isDraft = campaign.status === "draft";
  const isScheduled = campaign.status === "scheduled";
  const isSent = campaign.status === "sent";

  // Calculate comparison metrics (vs average)
  const sentCampaigns = allCampaigns?.filter((c) => c.status === "sent") || [];
  const avgOpenRate =
    sentCampaigns.length > 0
      ? sentCampaigns.reduce((sum, c) => sum + (c.openRate || 0), 0) / sentCampaigns.length
      : 0;
  const avgClickRate =
    sentCampaigns.length > 0
      ? sentCampaigns.reduce((sum, c) => sum + (c.clickRate || 0), 0) / sentCampaigns.length
      : 0;

  const openRateDiff = campaign.openRate ? campaign.openRate - avgOpenRate : 0;
  const clickRateDiff = campaign.clickRate ? campaign.clickRate - avgClickRate : 0;

  // Generate fake top customers for demo
  const topCustomers = isSent
    ? [
        { name: "Sarah Johnson", revenue: 450, tier: "VIP" },
        { name: "Mike Chen", revenue: 320, tier: "Gold" },
        { name: "Emma Davis", revenue: 280, tier: "Silver" },
        { name: "John Smith", revenue: 245, tier: "Gold" },
        { name: "Lisa Brown", revenue: 220, tier: "Silver" },
      ]
    : [];

  const avgOrderValue =
    campaign.attributedOrders && campaign.attributedOrders > 0
      ? campaign.attributedRevenue / campaign.attributedOrders
      : 0;

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/campaigns"
              className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
            >
              ← Back to Campaigns
            </Link>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-gray-900">
                  {campaign.name}
                </h1>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    isDraft
                      ? "bg-gray-100 text-gray-600"
                      : isScheduled
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  {isSent && campaign.sentAt && (
                    <span className="ml-1">
                      • {new Date(campaign.sentAt).toLocaleDateString()}
                    </span>
                  )}
                </span>
                {campaign.aiGenerated && (
                  <span className="text-xs text-gray-500">✨ AI Generated</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEmailPreview(!showEmailPreview)}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {showEmailPreview ? "Hide" : "View"} Email
                </button>
                <button
                  onClick={handleDuplicate}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Duplicate
                </button>
                {isDraft && (
                  <Link
                    href={`/campaigns/new?id=${campaign._id}`}
                    className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
                  >
                    Edit Campaign
                  </Link>
                )}
              </div>
            </div>

            {/* Campaign Info Bar */}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div>
                <span className="text-gray-500">Subject:</span>{" "}
                <span className="text-gray-900">{campaign.subject}</span>
              </div>
              {segment && (
                <>
                  <div className="h-4 w-px bg-gray-300" />
                  <div>
                    <span className="text-gray-500">Segment:</span>{" "}
                    <Link
                      href={`/segments`}
                      className="text-gray-900 hover:underline"
                    >
                      {segment.name}
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Performance Overview (only for sent campaigns) */}
          {isSent && (
            <>
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Performance Overview
              </h2>
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="text-xs text-gray-600 mb-1">Sent</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {campaign.sentCount || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">recipients</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="text-xs text-gray-600 mb-1">Opened</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {campaign.openedCount || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ({campaign.openRate || 0}%)
                  </div>
                  {openRateDiff !== 0 && (
                    <div
                      className={`text-xs mt-1 ${
                        openRateDiff > 0 ? "text-green-600" : "text-orange-600"
                      }`}
                    >
                      {openRateDiff > 0 ? "▲" : "▼"} {Math.abs(openRateDiff).toFixed(1)}% vs avg
                    </div>
                  )}
                </div>
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="text-xs text-gray-600 mb-1">Clicked</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {campaign.clickedCount || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ({campaign.clickRate || 0}%)
                  </div>
                  {clickRateDiff !== 0 && (
                    <div
                      className={`text-xs mt-1 ${
                        clickRateDiff > 0 ? "text-green-600" : "text-orange-600"
                      }`}
                    >
                      {clickRateDiff > 0 ? "▲" : "▼"} {Math.abs(clickRateDiff).toFixed(1)}% vs avg
                    </div>
                  )}
                </div>
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="text-xs text-gray-600 mb-1">Revenue</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    ${(campaign.attributedRevenue || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ${(campaign.revenuePerRecipient || 0).toFixed(2)} per recipient
                  </div>
                </div>
              </div>

              {/* Revenue Attribution - THE DIFFERENTIATOR */}
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Revenue Attribution
              </h2>
              <div className="border border-gray-200 rounded-lg p-6 mb-8">
                <div className="mb-6">
                  <div className="text-xs text-gray-600 mb-2">
                    Total Attributed Revenue
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 mb-1">
                    ${(campaign.attributedRevenue || 0).toLocaleString()}
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-900"
                      style={{
                        width: `${Math.min(
                          ((campaign.attributedRevenue || 0) / 10000) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-6 pb-6 border-b border-gray-200">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Orders</div>
                    <div className="text-sm font-medium text-gray-900">
                      {campaign.attributedOrders || 0} orders attributed
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Avg Order Value</div>
                    <div className="text-sm font-medium text-gray-900">
                      ${avgOrderValue.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Conversion Rate</div>
                    <div className="text-sm font-medium text-gray-900">
                      {campaign.conversionRate || 0}% ({campaign.attributedOrders || 0}/
                      {campaign.sentCount || 0})
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-900 mb-3">
                    Top Converting Customers
                  </div>
                  <div className="space-y-2">
                    {topCustomers.map((customer, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-4">
                            {idx + 1}.
                          </span>
                          <span className="text-sm text-gray-900">
                            {customer.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {customer.tier} Tier
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          ${customer.revenue}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Insight */}
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 mb-8">
                <div className="flex items-start gap-3">
                  <div className="text-lg">💡</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900 mb-2">
                      AI Insight
                    </div>
                    <div className="text-sm text-gray-700 mb-3">
                      This campaign performed{" "}
                      <span className="font-medium">
                        {Math.abs(openRateDiff).toFixed(0)}%{" "}
                        {openRateDiff > 0 ? "better" : "worse"}
                      </span>{" "}
                      than your average campaign. Subject lines with numbers and
                      urgency tend to get higher open rates.
                    </div>
                    <div className="text-xs text-gray-600 mb-3">
                      <span className="font-medium text-gray-900">Recommendation:</span>{" "}
                      Use similar subject line structure for future promotional
                      campaigns targeting this segment.
                    </div>
                    <button className="text-xs text-gray-700 hover:text-gray-900 underline">
                      Apply to Next Campaign →
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Email Preview (Collapsible) */}
          {showEmailPreview && (
            <>
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Email Content
              </h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
                <div className="bg-gray-50 p-4 border-b border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">Subject</div>
                  <div className="text-sm font-medium text-gray-900">
                    {campaign.subject}
                  </div>
                  {campaign.preheader && (
                    <>
                      <div className="text-xs text-gray-600 mt-3 mb-1">
                        Preheader
                      </div>
                      <div className="text-sm text-gray-700">
                        {campaign.preheader}
                      </div>
                    </>
                  )}
                </div>
                <div className="p-6 bg-white">
                  <div className="text-sm text-gray-900 whitespace-pre-wrap">
                    {campaign.content || "No content"}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
