import { v } from "convex/values";
import { query } from "./_generated/server";

// Get dashboard overview stats
export const getOverviewStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get total customers
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    
    // Get active campaigns
    const activeCampaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.neq(q.field("status"), "draft"))
      .collect();
    
    // Get active flows
    const activeFlows = await ctx.db
      .query("flows")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    return {
      totalCustomers,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      activeCampaigns: activeCampaigns.length,
      activeFlows: activeFlows.length,
    };
  },
});

// Get top insights preview
export const getInsightsPreview = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get at-risk customers
    const atRiskCustomers = await ctx.db
      .query("customers")
      .withIndex("by_churn_risk", (q) => q.eq("churnRisk", "High"))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    // Get campaign performance data for insights
    const campaignPerformance = await ctx.db
      .query("campaignPerformance")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Calculate best day of week
    const dayStats: Record<string, { revenue: number; count: number }> = {};
    campaignPerformance.forEach((cp) => {
      if (!dayStats[cp.dayOfWeek]) {
        dayStats[cp.dayOfWeek] = { revenue: 0, count: 0 };
      }
      dayStats[cp.dayOfWeek].revenue += cp.revenue;
      dayStats[cp.dayOfWeek].count += 1;
    });
    
    let bestDay = "";
    let bestAvgRevenue = 0;
    Object.entries(dayStats).forEach(([day, stats]) => {
      const avg = stats.revenue / stats.count;
      if (avg > bestAvgRevenue) {
        bestAvgRevenue = avg;
        bestDay = day;
      }
    });
    
    const insights = [];
    
    // Insight 1: Best send day
    if (bestDay && campaignPerformance.length > 5) {
      insights.push({
        type: "send_time",
        priority: "high",
        title: `${bestDay} sends perform best`,
        description: `Campaigns sent on ${bestDay} generate $${Math.round(bestAvgRevenue)} average revenue`,
        action: "Schedule next campaign",
      });
    }
    
    // Insight 2: At-risk customers
    if (atRiskCustomers.length > 0) {
      insights.push({
        type: "segment_opportunity",
        priority: "medium",
        title: `${atRiskCustomers.length} at-risk customers detected`,
        description: "High-value customers who haven't ordered recently",
        action: "Create win-back campaign",
      });
    }
    
    return insights.slice(0, 2); // Return top 2 insights
  },
});

// Get recent activity
export const getRecentActivity = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const activities = [];
    
    // Get recent segments
    const recentSegments = await ctx.db
      .query("segments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(2);
    
    for (const segment of recentSegments) {
      activities.push({
        type: "segment",
        icon: "🎯",
        title: segment.aiGenerated ? "AI created segment" : "Segment created",
        description: `"${segment.name}"`,
        timestamp: segment.createdAt,
        id: segment._id,
      });
    }
    
    // Get recent campaigns
    const recentCampaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(2);
    
    for (const campaign of recentCampaigns) {
      if (campaign.status === "sent") {
        activities.push({
          type: "campaign",
          icon: "📧",
          title: "Campaign sent",
          description: `"${campaign.name}" • ${campaign.sentCount || 0} emails`,
          timestamp: campaign.sentAt || campaign.createdAt,
          id: campaign._id,
        });
      }
    }
    
    // Get recent flows
    const recentFlows = await ctx.db
      .query("flows")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(1);
    
    for (const flow of recentFlows) {
      if (flow.status === "active") {
        activities.push({
          type: "flow",
          icon: "🌊",
          title: "Flow activated",
          description: `"${flow.name}"`,
          timestamp: flow.createdAt,
          id: flow._id,
        });
      }
    }
    
    // Sort by timestamp
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return activities.slice(0, 5);
  },
});
