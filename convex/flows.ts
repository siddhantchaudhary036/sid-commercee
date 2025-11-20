import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * List all flows for a user
 */
export const list = query({
  args: {
    userId: v.id("users"),
    status: v.optional(v.string()), // Filter by status
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("flows")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    const flows = await query.order("desc").collect();

    // Filter by status if provided
    if (args.status) {
      return flows.filter((f) => f.status === args.status);
    }

    return flows;
  },
});

/**
 * Get a single flow by ID
 */
export const getById = query({
  args: {
    id: v.id("flows"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get flow statistics for dashboard
 */
export const getStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const flows = await ctx.db
      .query("flows")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalFlows = flows.length;
    const activeFlows = flows.filter((f) => f.status === "active").length;

    // Calculate average completion rate
    const flowsWithRecipients = flows.filter((f) => (f.totalRecipients || 0) > 0);
    const avgCompletionRate =
      flowsWithRecipients.length > 0
        ? flowsWithRecipients.reduce(
            (sum, f) => sum + (f.completionRate || 0),
            0
          ) / flowsWithRecipients.length
        : 0;

    // Calculate total revenue
    const totalRevenue = flows.reduce((sum, f) => sum + (f.totalRevenue || 0), 0);

    return {
      totalFlows,
      activeFlows,
      avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
      totalRevenue,
    };
  },
});

/**
 * Create a new flow
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    triggerType: v.string(),
    triggerConfig: v.any(),
    flowDefinition: v.object({
      nodes: v.array(
        v.object({
          id: v.string(),
          type: v.string(),
          data: v.any(),
          position: v.object({ x: v.float64(), y: v.float64() }),
          measured: v.optional(v.object({ width: v.float64(), height: v.float64() })),
        })
      ),
      edges: v.array(
        v.object({
          id: v.string(),
          source: v.string(),
          target: v.string(),
          sourceHandle: v.optional(v.string()),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const flowId = await ctx.db.insert("flows", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      status: "draft",
      triggerType: args.triggerType,
      triggerConfig: args.triggerConfig,
      flowDefinition: args.flowDefinition,
      totalRecipients: 0,
      completionRate: 0,
      totalRevenue: 0,
      createdAt: now,
      updatedAt: now,
    });

    return flowId;
  },
});

/**
 * Update an existing flow
 */
export const update = mutation({
  args: {
    id: v.id("flows"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    triggerType: v.optional(v.string()),
    triggerConfig: v.optional(v.any()),
    flowDefinition: v.optional(
      v.object({
        nodes: v.array(
          v.object({
            id: v.string(),
            type: v.string(),
            data: v.any(),
            position: v.object({ x: v.float64(), y: v.float64() }),
            measured: v.optional(v.object({ width: v.float64(), height: v.float64() })),
          })
        ),
        edges: v.array(
          v.object({
            id: v.string(),
            source: v.string(),
            target: v.string(),
            sourceHandle: v.optional(v.string()),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Flow not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return id;
  },
});

/**
 * Delete a flow
 */
export const deleteFlow = mutation({
  args: {
    id: v.id("flows"),
  },
  handler: async (ctx, args) => {
    const flow = await ctx.db.get(args.id);
    if (!flow) {
      throw new Error("Flow not found");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Toggle flow status (activate/pause)
 */
export const toggleStatus = mutation({
  args: {
    id: v.id("flows"),
  },
  handler: async (ctx, args) => {
    const flow = await ctx.db.get(args.id);
    if (!flow) {
      throw new Error("Flow not found");
    }

    const newStatus = flow.status === "active" ? "paused" : "active";

    await ctx.db.patch(args.id, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    return { status: newStatus };
  },
});

/**
 * Get flow analytics with historical performance
 */
export const getAnalytics = query({
  args: {
    flowId: v.id("flows"),
  },
  handler: async (ctx, args) => {
    const flow = await ctx.db.get(args.flowId);
    if (!flow) {
      throw new Error("Flow not found");
    }

    // Get historical performance records
    const historicalPerformance = await ctx.db
      .query("flowPerformance")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .order("desc")
      .take(10);

    // Calculate step-by-step breakdown
    const totalRecipients = flow.totalRecipients || 0;
    const steps = flow.flowDefinition.nodes
      .filter((n) => n.type !== "trigger")
      .map((node, index) => {
        // Simulate drop-off (in real app, this would come from tracking data)
        // Each step loses some percentage of users
        const dropOffRate = 0.1 + Math.random() * 0.15; // 10-25% drop-off per step
        const remainingPercentage = Math.pow(1 - dropOffRate, index + 1);
        const recipients = Math.round(totalRecipients * remainingPercentage);
        const percentage = totalRecipients > 0 ? (recipients / totalRecipients) * 100 : 0;

        return {
          nodeId: node.id,
          type: node.type,
          name: node.data?.name || `${node.type} ${index + 1}`,
          recipients,
          percentage: Math.round(percentage),
          isDropOffPoint: node.id === flow.dropOffNodeId,
        };
      });

    // Calculate time to complete (average days)
    const avgTimeToComplete = 0; // TODO: Calculate from flow execution data

    // Revenue metrics
    const revenuePerRecipient =
      totalRecipients > 0 ? (flow.totalRevenue || 0) / totalRecipients : 0;
    const completers = Math.round(totalRecipients * (flow.completionRate || 0));
    const revenuePerCompleter =
      completers > 0 ? (flow.totalRevenue || 0) / completers : 0;

    return {
      flow,
      overview: {
        totalRecipients,
        completionRate: flow.completionRate || 0,
        totalRevenue: flow.totalRevenue || 0,
        revenuePerRecipient,
        revenuePerCompleter,
        avgTimeToComplete,
        dropOffNodeId: flow.dropOffNodeId,
      },
      stepBreakdown: steps,
      historicalPerformance: historicalPerformance.map((record) => ({
        date: record.periodEnd,
        recipients: record.totalRecipients,
        completionRate: record.completionRate,
        revenue: record.totalRevenue,
      })),
    };
  },
});

/**
 * Duplicate a flow
 */
export const duplicate = mutation({
  args: {
    flowId: v.id("flows"),
  },
  handler: async (ctx, args) => {
    const originalFlow = await ctx.db.get(args.flowId);
    if (!originalFlow) {
      throw new Error("Flow not found");
    }

    const now = new Date().toISOString();

    const newFlowId = await ctx.db.insert("flows", {
      userId: originalFlow.userId,
      name: `${originalFlow.name} (Copy)`,
      description: originalFlow.description,
      status: "draft",
      triggerType: originalFlow.triggerType,
      triggerConfig: originalFlow.triggerConfig,
      flowDefinition: originalFlow.flowDefinition,
      totalRecipients: 0,
      completionRate: 0,
      totalRevenue: 0,
      createdAt: now,
      updatedAt: now,
    });

    return newFlowId;
  },
});
