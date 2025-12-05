import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Helper function to check if a value is in an array
 */
function isValueInArray(
  fieldValue: unknown,
  conditionValue: string | number | boolean | string[] | number[]
): boolean {
  if (!Array.isArray(conditionValue)) return false;
  
  // Check if fieldValue matches any element in the array
  return conditionValue.some((val) => val === fieldValue);
}

/**
 * List all segments for a user
 */
export const list = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const segments = await ctx.db
      .query("segments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return segments;
  },
});

/**
 * Get a single segment by ID
 */
export const getById = query({
  args: {
    id: v.id("segments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Preview segment - get matching customers in real-time
 */
export const previewSegment = query({
  args: {
    userId: v.id("users"),
    conditions: v.array(
      v.object({
        field: v.string(),
        operator: v.string(),
        value: v.union(
          v.string(),
          v.number(),
          v.boolean(),
          v.array(v.string()),
          v.array(v.number())
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (args.conditions.length === 0) {
      return [];
    }

    let customers = await ctx.db
      .query("customers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Apply each condition (AND logic)
    for (const condition of args.conditions) {
      customers = customers.filter((customer) => {
        const fieldValue = customer[condition.field as keyof typeof customer];
        const conditionValue = condition.value;

        switch (condition.operator) {
          case "=":
            return fieldValue === conditionValue;
          case "!=":
            return fieldValue !== conditionValue;
          case ">":
            return Number(fieldValue) > Number(conditionValue);
          case "<":
            return Number(fieldValue) < Number(conditionValue);
          case ">=":
            return Number(fieldValue) >= Number(conditionValue);
          case "<=":
            return Number(fieldValue) <= Number(conditionValue);
          case "contains":
            if (Array.isArray(fieldValue)) {
              return fieldValue.includes(conditionValue as any);
            }
            return String(fieldValue)
              .toLowerCase()
              .includes(String(conditionValue).toLowerCase());
          case "startsWith":
            return String(fieldValue)
              .toLowerCase()
              .startsWith(String(conditionValue).toLowerCase());
          case "endsWith":
            return String(fieldValue)
              .toLowerCase()
              .endsWith(String(conditionValue).toLowerCase());
          case "in":
            return isValueInArray(fieldValue, conditionValue);
          default:
            return true;
        }
      });
    }

    // Sort by LTV descending
    return customers
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
  },
});

/**
 * Create a new segment
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    conditions: v.array(
      v.object({
        field: v.string(),
        operator: v.string(),
        value: v.union(
          v.string(),
          v.number(),
          v.boolean(),
          v.array(v.string()),
          v.array(v.number())
        ),
      })
    ),
    aiGenerated: v.optional(v.boolean()),
    aiPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Calculate initial customer count
    const preview = await ctx.runQuery(api.segments.previewSegment, {
      userId: args.userId,
      conditions: args.conditions,
    });

    const segmentId = await ctx.db.insert("segments", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      conditions: args.conditions,
      customerCount: preview.length,
      aiGenerated: args.aiGenerated ?? false,
      aiPrompt: args.aiPrompt,
      createdAt: now,
      updatedAt: now,
    });

    return segmentId;
  },
});

/**
 * Update an existing segment
 */
export const update = mutation({
  args: {
    id: v.id("segments"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    conditions: v.optional(
      v.array(
        v.object({
          field: v.string(),
          operator: v.string(),
          value: v.union(
            v.string(),
            v.number(),
            v.boolean(),
            v.array(v.string()),
            v.array(v.number())
          ),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Segment not found");
    }

    // Recalculate customer count if conditions changed
    let customerCount = existing.customerCount;
    if (updates.conditions) {
      const preview = await ctx.runQuery(api.segments.previewSegment, {
        userId: existing.userId,
        conditions: updates.conditions,
      });
      customerCount = preview.length;
    }

    await ctx.db.patch(id, {
      ...updates,
      customerCount,
      updatedAt: new Date().toISOString(),
    });

    return id;
  },
});

/**
 * Delete a segment
 */
export const deleteSegment = mutation({
  args: {
    id: v.id("segments"),
  },
  handler: async (ctx, args) => {
    const segment = await ctx.db.get(args.id);
    if (!segment) {
      throw new Error("Segment not found");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Get all customers in a segment (no limit)
 * Used by campaigns when targeting a segment
 */
export const getCustomersInSegment = query({
  args: {
    segmentId: v.id("segments"),
  },
  handler: async (ctx, args) => {
    const segment = await ctx.db.get(args.segmentId);
    if (!segment) {
      throw new Error("Segment not found");
    }

    let customers = await ctx.db
      .query("customers")
      .withIndex("by_user", (q) => q.eq("userId", segment.userId))
      .collect();

    // Apply each condition (AND logic)
    for (const condition of segment.conditions) {
      customers = customers.filter((customer) => {
        const fieldValue = customer[condition.field as keyof typeof customer];
        const conditionValue = condition.value;

        switch (condition.operator) {
          case "=":
            return fieldValue === conditionValue;
          case "!=":
            return fieldValue !== conditionValue;
          case ">":
            return Number(fieldValue) > Number(conditionValue);
          case "<":
            return Number(fieldValue) < Number(conditionValue);
          case ">=":
            return Number(fieldValue) >= Number(conditionValue);
          case "<=":
            return Number(fieldValue) <= Number(conditionValue);
          case "contains":
            if (Array.isArray(fieldValue)) {
              return fieldValue.includes(conditionValue as any);
            }
            return String(fieldValue)
              .toLowerCase()
              .includes(String(conditionValue).toLowerCase());
          case "startsWith":
            return String(fieldValue)
              .toLowerCase()
              .startsWith(String(conditionValue).toLowerCase());
          case "endsWith":
            return String(fieldValue)
              .toLowerCase()
              .endsWith(String(conditionValue).toLowerCase());
          case "in":
            return isValueInArray(fieldValue, conditionValue);
          default:
            return true;
        }
      });
    }

    // Return all matching customers (no limit)
    return customers;
  },
});

/**
 * Get segment statistics
 */
export const getStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const segments = await ctx.db
      .query("segments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalSegments = segments.length;
    const aiGenerated = segments.filter((s) => s.aiGenerated).length;
    const avgSize =
      totalSegments > 0
        ? Math.round(
            segments.reduce((sum, s) => sum + (s.customerCount || 0), 0) /
              totalSegments
          )
        : 0;

    const largestSegment = segments.reduce(
      (max, s) => ((s.customerCount || 0) > (max?.customerCount || 0) ? s : max),
      segments[0]
    );

    return {
      totalSegments,
      aiGenerated,
      avgSize,
      largestSegment: largestSegment
        ? {
            name: largestSegment.name,
            count: largestSegment.customerCount || 0,
          }
        : null,
    };
  },
});
