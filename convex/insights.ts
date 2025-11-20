import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * LAYER 1: DATA FETCHING
 * Pulls raw data from multiple sources for insights analysis
 */
export const fetchInsightsData = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // 1. Campaign Performance (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const campaignPerformance = await ctx.db
      .query("campaignPerformance")
      .filter((q) => q.eq(q.field("userId"), userId))
      .filter((q) => q.gte(q.field("createdAt"), ninetyDaysAgo))
      .collect();

    // 2. Flow Performance (last 90 days)
    const flowPerformance = await ctx.db
      .query("flowPerformance")
      .filter((q) => q.eq(q.field("userId"), userId))
      .filter((q) => q.gte(q.field("createdAt"), ninetyDaysAgo))
      .collect();

    // 3. Active Campaigns
    const campaigns = await ctx.db
      .query("campaigns")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // 4. Active Flows
    const flows = await ctx.db
      .query("flows")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // 5. Customer Segments
    const segments = await ctx.db
      .query("segments")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // 6. All Customers for summary stats
    const customers = await ctx.db
      .query("customers")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // 7. Analytics Snapshots (for trends) - last 12 periods
    const snapshots = await ctx.db
      .query("analyticsSnapshots")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .take(12);

    // Calculate customer summary stats
    const customersBySegment: Record<string, number> = {};
    let totalLTV = 0;

    for (const customer of customers) {
      const segment = customer.rfmSegment || "Unknown";
      customersBySegment[segment] = (customersBySegment[segment] || 0) + 1;
      totalLTV += customer.customerLifetimeValue || 0;
    }

    const customerSummary = {
      total: customers.length,
      bySegment: customersBySegment,
      avgLTV: customers.length > 0 ? totalLTV / customers.length : 0,
    };

    return {
      campaignPerformance,
      flowPerformance,
      campaigns,
      flows,
      segments,
      customerSummary,
      snapshots,
      fetchedAt: Date.now(),
    };
  },
});


/**
 * STORAGE: Store generated insights
 */
export const storeInsights = mutation({
  args: {
    userId: v.id("users"),
    insights: v.array(v.any()),
  },
  handler: async (ctx, { userId, insights }) => {
    // Delete old insights for this user
    const existing = await ctx.db
      .query("generatedInsights")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Store new insights (valid for 7 days)
    await ctx.db.insert("generatedInsights", {
      userId,
      insights,
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return { success: true };
  },
});

/**
 * STORAGE: Get stored insights
 */
export const getStoredInsights = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const stored = await ctx.db
      .query("generatedInsights")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!stored) {
      return null;
    }

    // Check if insights are still valid
    const now = new Date();
    const validUntil = new Date(stored.validUntil || 0);

    if (now > validUntil) {
      // Insights expired, return null (cleanup will happen on next store)
      return null;
    }

    return stored;
  },
});
