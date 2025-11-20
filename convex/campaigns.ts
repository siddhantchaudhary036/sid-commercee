import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * List all campaigns for a user
 */
export const list = query({
  args: {
    userId: v.id("users"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    const campaigns = await query.order("desc").collect();

    // Filter by status if provided
    if (args.status) {
      return campaigns.filter((c) => c.status === args.status);
    }

    return campaigns;
  },
});

/**
 * Get a single campaign by ID
 */
export const getById = query({
  args: {
    id: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Create a new campaign
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    emailTemplateId: v.optional(v.id("emailTemplates")),
    subject: v.optional(v.string()),
    content: v.optional(v.string()),
    segmentId: v.optional(v.id("segments")),
    description: v.optional(v.string()),
    aiGenerated: v.optional(v.boolean()),
    aiPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // If template is provided but no subject/content, fetch from template
    let subject = args.subject || "";
    let content = args.content || "";
    
    if (args.emailTemplateId && (!args.subject || !args.content)) {
      const template = await ctx.db.get(args.emailTemplateId);
      if (template) {
        subject = args.subject || template.subject;
        content = args.content || template.content;
      }
    }

    const campaignId = await ctx.db.insert("campaigns", {
      userId: args.userId,
      name: args.name,
      emailTemplateId: args.emailTemplateId,
      subject,
      content,
      segmentId: args.segmentId,
      description: args.description,
      status: "draft",
      aiGenerated: args.aiGenerated ?? false,
      aiPrompt: args.aiPrompt,
      createdAt: now,
      updatedAt: now,
    });

    return campaignId;
  },
});

/**
 * Update an existing campaign
 */
export const update = mutation({
  args: {
    id: v.id("campaigns"),
    name: v.optional(v.string()),
    emailTemplateId: v.optional(v.id("emailTemplates")),
    subject: v.optional(v.string()),
    content: v.optional(v.string()),
    description: v.optional(v.string()),
    segmentId: v.optional(v.id("segments")),
    status: v.optional(v.string()),
    scheduledAt: v.optional(v.string()),
    sentAt: v.optional(v.string()),
    sentCount: v.optional(v.number()),
    openedCount: v.optional(v.number()),
    clickedCount: v.optional(v.number()),
    openRate: v.optional(v.number()),
    clickRate: v.optional(v.number()),
    conversionRate: v.optional(v.number()),
    attributedRevenue: v.optional(v.number()),
    attributedOrders: v.optional(v.number()),
    revenuePerRecipient: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Campaign not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return id;
  },
});

/**
 * Delete a campaign
 */
export const deleteCampaign = mutation({
  args: {
    id: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.id);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Only allow deleting drafts
    if (campaign.status !== "draft") {
      throw new Error("Can only delete draft campaigns");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Duplicate a campaign
 */
export const duplicate = mutation({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.campaignId);
    if (!original) {
      throw new Error("Campaign not found");
    }

    const now = new Date().toISOString();

    const newCampaignId = await ctx.db.insert("campaigns", {
      userId: original.userId,
      name: `${original.name} (Copy)`,
      emailTemplateId: original.emailTemplateId,
      subject: original.subject,
      content: original.content,
      description: original.description,
      segmentId: original.segmentId,
      status: "draft",
      aiGenerated: false, // Duplicates are manual
      createdAt: now,
      updatedAt: now,
    });

    return newCampaignId;
  },
});

/**
 * Get campaign statistics
 */
export const getStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalCampaigns = campaigns.length;
    const sentCampaigns = campaigns.filter((c) => c.status === "sent");
    
    // Calculate this month's sent campaigns
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const sentThisMonth = sentCampaigns.filter(
      (c) => c.sentAt && c.sentAt >= firstDayOfMonth
    ).length;

    // Calculate average open rate
    const campaignsWithOpenRate = sentCampaigns.filter((c) => c.openRate !== undefined);
    const avgOpenRate =
      campaignsWithOpenRate.length > 0
        ? campaignsWithOpenRate.reduce((sum, c) => sum + (c.openRate || 0), 0) /
          campaignsWithOpenRate.length
        : 0;

    // Calculate total revenue
    const totalRevenue = sentCampaigns.reduce(
      (sum, c) => sum + (c.attributedRevenue || 0),
      0
    );

    return {
      totalCampaigns,
      sentThisMonth,
      avgOpenRate: Math.round(avgOpenRate * 10) / 10, // Round to 1 decimal
      totalRevenue,
    };
  },
});
