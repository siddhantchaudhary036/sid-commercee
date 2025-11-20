"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Sidebar from "@/app/components/Sidebar";
import { EmailTemplateSelector } from "@/app/components/EmailTemplateSelector";
import Link from "next/link";

export default function NewCampaignPage() {
  const router = useRouter();
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser, user ? { clerkId: user.id } : "skip");
  const segments = useQuery(api.segments.list, currentUser ? { userId: currentUser._id } : "skip");
  const createCampaign = useMutation(api.campaigns.create);
  const updateCampaign = useMutation(api.campaigns.update);

  // Check if editing existing campaign
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const editingId = urlParams?.get("id");
  const existingCampaign = useQuery(
    api.campaigns.getById,
    editingId ? { id: editingId } : "skip"
  );

  const [campaignId, setCampaignId] = useState(editingId || null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    segmentId: "",
    emailTemplateId: "",
    subject: "",
    content: "",
    scheduledDate: "",
    scheduledTime: "",
  });
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sendOption, setSendOption] = useState("immediate"); // "immediate" or "scheduled"
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Load existing campaign data
  useEffect(() => {
    if (existingCampaign && !isLoaded) {
      setFormData({
        name: existingCampaign.name || "",
        description: existingCampaign.description || "",
        segmentId: existingCampaign.segmentId || "",
        emailTemplateId: existingCampaign.emailTemplateId || "",
        subject: existingCampaign.subject || "",
        content: existingCampaign.content || "",
        scheduledDate: "",
        scheduledTime: "",
      });
      setIsLoaded(true);
    }
  }, [existingCampaign, isLoaded]);

  // Update selected segment when segmentId changes
  useEffect(() => {
    if (segments && formData.segmentId) {
      const segment = segments.find((s) => s._id === formData.segmentId);
      setSelectedSegment(segment || null);
    } else {
      setSelectedSegment(null);
    }
  }, [formData.segmentId, segments]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = async (field) => {
    // Auto-save on blur
    if (!currentUser) return;

    try {
      setIsSaving(true);
      
      if (!campaignId) {
        // Create new campaign
        const id = await createCampaign({
          userId: currentUser._id,
          name: formData.name || "Untitled Campaign",
          emailTemplateId: formData.emailTemplateId || undefined,
          subject: formData.subject || "",
          content: formData.content || "",
          segmentId: formData.segmentId || undefined,
        });
        setCampaignId(id);
      } else {
        // Update existing campaign
        await updateCampaign({
          id: campaignId,
          [field]: formData[field],
        });
      }
    } catch (error) {
      console.error("Error saving campaign:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Get selected template (for preview only)
  const selectedTemplate = useQuery(
    api.emailTemplates.getById,
    formData.emailTemplateId ? { id: formData.emailTemplateId } : "skip"
  );

  // When template is selected, copy its content
  useEffect(() => {
    if (selectedTemplate && !formData.subject && !formData.content) {
      setFormData((prev) => ({
        ...prev,
        subject: selectedTemplate.subject,
        content: selectedTemplate.content,
      }));
    }
  }, [selectedTemplate, formData.subject, formData.content]);

  // Validation
  const isValid = {
    name: formData.name.trim().length > 0,
    segment: formData.segmentId.length > 0,
    template: formData.emailTemplateId.length > 0,
    subject: formData.subject.trim().length > 0,
    content: formData.content.trim().length > 0,
  };
  const allValid = Object.values(isValid).every(Boolean);



  const handleSendCampaign = async () => {
    if (!allValid || !currentUser || !campaignId) return;

    try {
      setIsSending(true);
      
      const segmentSize = selectedSegment?.customerCount || 0;
      
      // Calculate fake performance metrics
      const openRate = Math.round(Math.random() * 15 + 20); // 20-35%
      const clickRate = Math.round(Math.random() * 8 + 8); // 8-16%
      const openedCount = Math.round(segmentSize * (openRate / 100));
      const clickedCount = Math.round(openedCount * (clickRate / 100));
      const revenue = Math.round(Math.random() * 4000 + 1000); // $1000-$5000
      const orders = Math.round(clickedCount * 0.3); // 30% of clickers convert
      const conversionRate = Math.round((orders / segmentSize) * 100 * 10) / 10;

      if (sendOption === "immediate") {
        // Send immediately
        await updateCampaign({
          id: campaignId,
          status: "sent",
          sentAt: new Date().toISOString(),
          sentCount: segmentSize,
          openedCount,
          clickedCount,
          openRate,
          clickRate,
          conversionRate,
          attributedRevenue: revenue,
          attributedOrders: orders,
          revenuePerRecipient: Math.round(revenue / segmentSize * 100) / 100,
        });
      } else {
        // Schedule for later
        const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
        await updateCampaign({
          id: campaignId,
          status: "scheduled",
          scheduledAt: scheduledDateTime.toISOString(),
        });
      }

      // Redirect to campaigns list
      router.push("/campaigns");
    } catch (error) {
      console.error("Error sending campaign:", error);
      alert("Failed to send campaign. Please try again.");
    } finally {
      setIsSending(false);
      setShowConfirmModal(false);
    }
  };

  if (!currentUser || !segments) {
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
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/campaigns"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Campaigns
              </Link>
              <div className="h-4 w-px bg-gray-300" />
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-gray-900">
                  {editingId ? (formData.name || "Edit Campaign") : "New Campaign"}
                </h1>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  Draft
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isSaving && (
                <span className="text-xs text-gray-500">Saving...</span>
              )}
            </div>
          </div>
        </div>

        {/* Split Layout */}
        <div className="flex-1 flex">
          {/* Left Panel - Editor (70%) */}
          <div className="w-[70%] border-r border-gray-200 overflow-y-auto">
            <div className="p-8 max-w-3xl">
              {/* Campaign Details */}
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">
                  Campaign Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">
                      Campaign Name <span className="text-gray-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      onBlur={() => handleBlur("name")}
                      placeholder="e.g., Black Friday Sale 2025"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">
                      Description <span className="text-gray-400">(optional)</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      onBlur={() => handleBlur("description")}
                      placeholder="Internal notes about this campaign..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Targeting */}
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">
                  Targeting
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">
                      Select Segment <span className="text-gray-400">*</span>
                    </label>
                    <select
                      value={formData.segmentId}
                      onChange={(e) => {
                        handleChange("segmentId", e.target.value);
                        handleBlur("segmentId");
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="">Choose a segment...</option>
                      {segments.map((segment) => (
                        <option key={segment._id} value={segment._id}>
                          {segment.name} ({segment.customerCount || 0} customers)
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedSegment && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">
                        This campaign will be sent to:
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {selectedSegment.customerCount || 0} customers
                      </div>
                      {selectedSegment.description && (
                        <div className="text-xs text-gray-500 mt-2">
                          {selectedSegment.description}
                        </div>
                      )}
                    </div>
                  )}

                  <Link
                    href="/segments/new"
                    className="inline-block text-xs text-gray-600 hover:text-gray-900"
                  >
                    + Create New Segment
                  </Link>
                </div>
              </div>

              {/* Email Template */}
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">
                  Email Template
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">
                      Select Template <span className="text-gray-400">*</span>
                    </label>
                    <EmailTemplateSelector
                      selectedId={formData.emailTemplateId}
                      onSelect={(templateId) => {
                        handleChange("emailTemplateId", templateId);
                        handleBlur("emailTemplateId");
                      }}
                      userId={currentUser._id}
                      allowCreate={true}
                    />
                    <div className="text-xs text-gray-500 mt-2">
                      Template content will be copied to this campaign
                    </div>
                  </div>

                  {/* Subject Line (editable after template selection) */}
                  {formData.emailTemplateId && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">
                          Subject Line <span className="text-gray-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.subject}
                          onChange={(e) => handleChange("subject", e.target.value)}
                          onBlur={() => handleBlur("subject")}
                          placeholder="Customize subject line..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {formData.subject.length} characters
                          {formData.subject.length >= 50 && formData.subject.length <= 60 && " (optimal)"}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs text-gray-600">
                            Email Content Preview
                          </label>
                          <button
                            onClick={() => {
                              if (formData.emailTemplateId) {
                                window.open(`/emails/editor?id=${formData.emailTemplateId}`, '_blank');
                              }
                            }}
                            className="text-xs text-gray-600 hover:text-gray-900"
                          >
                            Edit Template →
                          </button>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
                          <div
                            dangerouslySetInnerHTML={{ __html: formData.content }}
                            style={{
                              fontFamily: "system-ui, -apple-system, sans-serif",
                              lineHeight: "1.6",
                              fontSize: "12px",
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          This is a snapshot from the template. Changes to the template won't affect this campaign.
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Scheduling */}
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">
                  Scheduling
                </h2>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="sendOption"
                        value="immediate"
                        checked={sendOption === "immediate"}
                        onChange={(e) => setSendOption(e.target.value)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          Send Immediately
                        </div>
                        <div className="text-xs text-gray-600">
                          Email will be sent to {selectedSegment?.customerCount || 0} customers within 5 minutes
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="sendOption"
                        value="scheduled"
                        checked={sendOption === "scheduled"}
                        onChange={(e) => setSendOption(e.target.value)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          Schedule for Later
                        </div>
                        <div className="text-xs text-gray-600 mb-3">
                          Choose when to send this campaign
                        </div>
                        {sendOption === "scheduled" && (
                          <div className="flex gap-3">
                            <input
                              type="date"
                              value={formData.scheduledDate}
                              onChange={(e) => handleChange("scheduledDate", e.target.value)}
                              min={new Date().toISOString().split("T")[0]}
                              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                            />
                            <input
                              type="time"
                              value={formData.scheduledTime}
                              onChange={(e) => handleChange("scheduledTime", e.target.value)}
                              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                            />
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Final Review */}
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">
                  Review & Send
                </h2>
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={isValid.name ? "text-green-600" : "text-gray-400"}>
                        {isValid.name ? "✓" : "○"}
                      </span>
                      <span className={isValid.name ? "text-gray-900" : "text-gray-500"}>
                        Campaign name set
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={isValid.segment ? "text-green-600" : "text-gray-400"}>
                        {isValid.segment ? "✓" : "○"}
                      </span>
                      <span className={isValid.segment ? "text-gray-900" : "text-gray-500"}>
                        Segment selected ({selectedSegment?.customerCount || 0} recipients)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={isValid.template ? "text-green-600" : "text-gray-400"}>
                        {isValid.template ? "✓" : "○"}
                      </span>
                      <span className={isValid.template ? "text-gray-900" : "text-gray-500"}>
                        Email template selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={isValid.subject ? "text-green-600" : "text-gray-400"}>
                        {isValid.subject ? "✓" : "○"}
                      </span>
                      <span className={isValid.subject ? "text-gray-900" : "text-gray-500"}>
                        Subject line set
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={isValid.content ? "text-green-600" : "text-gray-400"}>
                        {isValid.content ? "✓" : "○"}
                      </span>
                      <span className={isValid.content ? "text-gray-900" : "text-gray-500"}>
                        Email content loaded
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push("/campaigns")}
                      className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        // Just navigate back - campaign is already saved as draft
                        router.push("/campaigns");
                      }}
                      className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={!allValid || isSending}
                      className={`flex-1 px-4 py-2 text-sm rounded-lg ${
                        allValid && !isSending
                          ? "bg-black text-white hover:bg-gray-800"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {isSending
                        ? "Sending..."
                        : sendOption === "immediate"
                        ? "Send Now"
                        : "Schedule Campaign"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview (30%) */}
          <div className="w-[30%] bg-gray-50 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xs font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                Inbox Preview
              </h3>

              {/* Mock Email Client */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Email Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-gray-600">
                        {currentUser.name?.[0] || "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {currentUser.name || "Your Store"}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {currentUser.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Content Preview */}
                <div className="p-4">
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-gray-900 mb-1">
                      {formData.subject || "Select a template to preview"}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-3 pb-3 border-b border-gray-200">
                    To: {selectedSegment?.name || "Select a segment"}
                    {selectedSegment && (
                      <span className="ml-1">
                        ({selectedSegment.customerCount || 0} recipients)
                      </span>
                    )}
                  </div>

                  {/* Email Body Preview */}
                  {formData.content && (
                    <div className="text-xs">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: formData.content.replace(
                            /\{\{(\w+)\}\}/g,
                            (match, variable) => {
                              const examples = {
                                firstName: "Sarah",
                                lastName: "Johnson",
                                totalSpent: "$1,234",
                                loyaltyTier: "Gold",
                                lastOrderDate: "Nov 15, 2025",
                              };
                              return examples[variable] || match;
                            }
                          ),
                        }}
                        style={{
                          fontFamily: "system-ui, -apple-system, sans-serif",
                          lineHeight: "1.6",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Info */}
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium text-gray-900">Draft</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recipients:</span>
                    <span className="font-medium text-gray-900">
                      {selectedSegment?.customerCount || 0}
                    </span>
                  </div>
                  {formData.emailTemplateId && (
                    <div className="flex justify-between">
                      <span>Template:</span>
                      <span className="font-medium text-gray-900">
                        {selectedTemplate?.name || "Selected"}
                      </span>
                    </div>
                  )}
                  {formData.subject && (
                    <div className="flex justify-between">
                      <span>Subject:</span>
                      <span className="font-medium text-gray-900 text-right truncate ml-2">
                        {formData.subject}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {sendOption === "immediate" ? "Send Campaign Now?" : "Schedule Campaign?"}
              </h3>
              <div className="text-sm text-gray-600 mb-6">
                {sendOption === "immediate" ? (
                  <>
                    This campaign will be sent to{" "}
                    <span className="font-medium text-gray-900">
                      {selectedSegment?.customerCount || 0} customers
                    </span>{" "}
                    immediately.
                  </>
                ) : (
                  <>
                    This campaign will be sent to{" "}
                    <span className="font-medium text-gray-900">
                      {selectedSegment?.customerCount || 0} customers
                    </span>{" "}
                    on{" "}
                    <span className="font-medium text-gray-900">
                      {formData.scheduledDate} at {formData.scheduledTime}
                    </span>
                    .
                  </>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSending}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendCampaign}
                  disabled={isSending}
                  className="flex-1 px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400"
                >
                  {isSending ? "Processing..." : "Yes, Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
