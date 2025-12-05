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
 * Get a single flow by ID with its nodes and edges
 */
export const getById = query({
  args: {
    id: v.id("flows"),
  },
  handler: async (ctx, args) => {
    const flow = await ctx.db.get(args.id);
    if (!flow) return null;

    // Get all nodes for this flow
    const nodes = await ctx.db
      .query("flowNodes")
      .withIndex("by_flow", (q) => q.eq("flowId", args.id))
      .collect();

    // Get all edges for this flow
    const edges = await ctx.db
      .query("flowEdges")
      .withIndex("by_flow", (q) => q.eq("flowId", args.id))
      .collect();

    return {
      ...flow,
      nodes,
      edges,
    };
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
 * Create a new flow with nodes and edges
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    nodes: v.array(
      v.object({
        nodeId: v.string(),
        type: v.string(),
        // Trigger node fields
        triggerType: v.optional(v.string()),
        segmentId: v.optional(v.id("segments")),
        segmentName: v.optional(v.string()),
        // Email node fields
        emailTemplateId: v.optional(v.id("emailTemplates")),
        emailSubject: v.optional(v.string()),
        emailName: v.optional(v.string()),
        // Delay node fields
        delayDays: v.optional(v.number()),
        delayHours: v.optional(v.number()),
        delayName: v.optional(v.string()),
        // Condition node fields
        conditionType: v.optional(v.string()),
        conditionName: v.optional(v.string()),
        // Position
        positionX: v.float64(),
        positionY: v.float64(),
        width: v.optional(v.float64()),
        height: v.optional(v.float64()),
      })
    ),
    edges: v.array(
      v.object({
        edgeId: v.string(),
        sourceNodeId: v.string(),
        targetNodeId: v.string(),
        sourceHandle: v.optional(v.string()),
        animated: v.optional(v.boolean()),
        label: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Create the flow
    const flowId = await ctx.db.insert("flows", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      status: "draft",
      totalRecipients: 0,
      completionRate: 0,
      totalRevenue: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Create all nodes
    for (const node of args.nodes) {
      await ctx.db.insert("flowNodes", {
        flowId,
        nodeId: node.nodeId,
        type: node.type,
        triggerType: node.triggerType,
        segmentId: node.segmentId,
        segmentName: node.segmentName,
        emailTemplateId: node.emailTemplateId,
        emailSubject: node.emailSubject,
        emailName: node.emailName,
        delayDays: node.delayDays,
        delayHours: node.delayHours,
        delayName: node.delayName,
        conditionType: node.conditionType,
        conditionName: node.conditionName,
        positionX: node.positionX,
        positionY: node.positionY,
        width: node.width,
        height: node.height,
        userId: args.userId,
        createdAt: now,
      });
    }

    // Create all edges
    for (const edge of args.edges) {
      await ctx.db.insert("flowEdges", {
        flowId,
        edgeId: edge.edgeId,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        sourceHandle: edge.sourceHandle,
        animated: edge.animated,
        label: edge.label,
        userId: args.userId,
        createdAt: now,
      });
    }

    return flowId;
  },
});

/**
 * Update an existing flow (metadata only)
 */
export const update = mutation({
  args: {
    id: v.id("flows"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
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
 * Update flow nodes and edges (for visual editor)
 */
export const updateNodesAndEdges = mutation({
  args: {
    flowId: v.id("flows"),
    nodes: v.array(
      v.object({
        nodeId: v.string(),
        type: v.string(),
        triggerType: v.optional(v.string()),
        segmentId: v.optional(v.id("segments")),
        segmentName: v.optional(v.string()),
        emailTemplateId: v.optional(v.id("emailTemplates")),
        emailSubject: v.optional(v.string()),
        emailName: v.optional(v.string()),
        delayDays: v.optional(v.number()),
        delayHours: v.optional(v.number()),
        delayName: v.optional(v.string()),
        conditionType: v.optional(v.string()),
        conditionName: v.optional(v.string()),
        positionX: v.float64(),
        positionY: v.float64(),
        width: v.optional(v.float64()),
        height: v.optional(v.float64()),
      })
    ),
    edges: v.array(
      v.object({
        edgeId: v.string(),
        sourceNodeId: v.string(),
        targetNodeId: v.string(),
        sourceHandle: v.optional(v.string()),
        animated: v.optional(v.boolean()),
        label: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const flow = await ctx.db.get(args.flowId);
    if (!flow) {
      throw new Error("Flow not found");
    }

    const now = new Date().toISOString();

    // Delete existing nodes and edges
    const existingNodes = await ctx.db
      .query("flowNodes")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .collect();
    
    for (const node of existingNodes) {
      await ctx.db.delete(node._id);
    }

    const existingEdges = await ctx.db
      .query("flowEdges")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .collect();
    
    for (const edge of existingEdges) {
      await ctx.db.delete(edge._id);
    }

    // Insert new nodes
    for (const node of args.nodes) {
      await ctx.db.insert("flowNodes", {
        flowId: args.flowId,
        nodeId: node.nodeId,
        type: node.type,
        triggerType: node.triggerType,
        segmentId: node.segmentId,
        segmentName: node.segmentName,
        emailTemplateId: node.emailTemplateId,
        emailSubject: node.emailSubject,
        emailName: node.emailName,
        delayDays: node.delayDays,
        delayHours: node.delayHours,
        delayName: node.delayName,
        conditionType: node.conditionType,
        conditionName: node.conditionName,
        positionX: node.positionX,
        positionY: node.positionY,
        width: node.width,
        height: node.height,
        userId: flow.userId,
        createdAt: now,
      });
    }

    // Insert new edges
    for (const edge of args.edges) {
      await ctx.db.insert("flowEdges", {
        flowId: args.flowId,
        edgeId: edge.edgeId,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        sourceHandle: edge.sourceHandle,
        animated: edge.animated,
        label: edge.label,
        userId: flow.userId,
        createdAt: now,
      });
    }

    // Update flow timestamp
    await ctx.db.patch(args.flowId, {
      updatedAt: now,
    });

    return args.flowId;
  },
});

/**
 * Delete a flow and all its nodes/edges
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

    // Delete all nodes
    const nodes = await ctx.db
      .query("flowNodes")
      .withIndex("by_flow", (q) => q.eq("flowId", args.id))
      .collect();
    
    for (const node of nodes) {
      await ctx.db.delete(node._id);
    }

    // Delete all edges
    const edges = await ctx.db
      .query("flowEdges")
      .withIndex("by_flow", (q) => q.eq("flowId", args.id))
      .collect();
    
    for (const edge of edges) {
      await ctx.db.delete(edge._id);
    }

    // Delete the flow
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

    // Get nodes for this flow
    const nodes = await ctx.db
      .query("flowNodes")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .collect();

    // Get historical performance records
    const historicalPerformance = await ctx.db
      .query("flowPerformance")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .order("desc")
      .take(10);

    // Calculate step-by-step breakdown
    const totalRecipients = flow.totalRecipients || 0;
    const steps = nodes
      .filter((n) => n.type !== "trigger")
      .map((node, index) => {
        // Simulate drop-off (in real app, this would come from tracking data)
        const dropOffRate = 0.1 + Math.random() * 0.15; // 10-25% drop-off per step
        const remainingPercentage = Math.pow(1 - dropOffRate, index + 1);
        const recipients = Math.round(totalRecipients * remainingPercentage);
        const percentage = totalRecipients > 0 ? (recipients / totalRecipients) * 100 : 0;

        return {
          nodeId: node.nodeId,
          type: node.type,
          name: node.emailName || node.delayName || node.conditionName || `${node.type} ${index + 1}`,
          recipients,
          percentage: Math.round(percentage),
          isDropOffPoint: node.nodeId === flow.dropOffNodeId,
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
 * Duplicate a flow with all its nodes and edges
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

    // Create new flow
    const newFlowId = await ctx.db.insert("flows", {
      userId: originalFlow.userId,
      name: `${originalFlow.name} (Copy)`,
      description: originalFlow.description,
      status: "draft",
      totalRecipients: 0,
      completionRate: 0,
      totalRevenue: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Copy all nodes
    const originalNodes = await ctx.db
      .query("flowNodes")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .collect();

    for (const node of originalNodes) {
      await ctx.db.insert("flowNodes", {
        flowId: newFlowId,
        nodeId: node.nodeId,
        type: node.type,
        triggerType: node.triggerType,
        segmentId: node.segmentId,
        segmentName: node.segmentName,
        emailTemplateId: node.emailTemplateId,
        emailSubject: node.emailSubject,
        emailName: node.emailName,
        delayDays: node.delayDays,
        delayHours: node.delayHours,
        delayName: node.delayName,
        conditionType: node.conditionType,
        conditionName: node.conditionName,
        positionX: node.positionX,
        positionY: node.positionY,
        width: node.width,
        height: node.height,
        userId: originalFlow.userId,
        createdAt: now,
      });
    }

    // Copy all edges
    const originalEdges = await ctx.db
      .query("flowEdges")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .collect();

    for (const edge of originalEdges) {
      await ctx.db.insert("flowEdges", {
        flowId: newFlowId,
        edgeId: edge.edgeId,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        sourceHandle: edge.sourceHandle,
        animated: edge.animated,
        label: edge.label,
        userId: originalFlow.userId,
        createdAt: now,
      });
    }

    return newFlowId;
  },
});
