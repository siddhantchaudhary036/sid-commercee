import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * List all email templates for a user
 */
export const list = query({
  args: {
    userId: v.id("users"),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let templates = await ctx.db
      .query("emailTemplates")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Filter by category if provided
    if (args.category) {
      templates = templates.filter((t) => t.category === args.category);
    }

    return templates;
  },
});

/**
 * Get a single email template by ID
 */
export const getById = query({
  args: {
    id: v.id("emailTemplates"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Create a new email template
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    subject: v.string(),
    content: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const templateId = await ctx.db.insert("emailTemplates", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      subject: args.subject,
      content: args.content,
      category: args.category || "General",
      isSystem: false,
      createdAt: now,
    });

    return templateId;
  },
});

/**
 * Update an existing email template
 */
export const update = mutation({
  args: {
    id: v.id("emailTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    subject: v.optional(v.string()),
    content: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Email template not found");
    }

    // Don't allow editing system templates
    if (existing.isSystem) {
      throw new Error("Cannot edit system templates");
    }

    await ctx.db.patch(id, updates);

    return id;
  },
});

/**
 * Delete an email template
 */
export const deleteTemplate = mutation({
  args: {
    id: v.id("emailTemplates"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) {
      throw new Error("Email template not found");
    }

    // Don't allow deleting system templates
    if (template.isSystem) {
      throw new Error("Cannot delete system templates");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Duplicate an email template
 */
export const duplicate = mutation({
  args: {
    templateId: v.id("emailTemplates"),
  },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.templateId);
    if (!original) {
      throw new Error("Email template not found");
    }

    const now = new Date().toISOString();

    const newTemplateId = await ctx.db.insert("emailTemplates", {
      userId: original.userId,
      name: `${original.name} (Copy)`,
      description: original.description,
      subject: original.subject,
      content: original.content,
      category: original.category,
      isSystem: false,
      createdAt: now,
    });

    return newTemplateId;
  },
});

/**
 * Get template statistics
 */
export const getStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query("emailTemplates")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalTemplates = templates.length;
    const customTemplates = templates.filter((t) => !t.isSystem).length;
    const systemTemplates = templates.filter((t) => t.isSystem).length;

    // Count by category
    const categories = templates.reduce((acc, t) => {
      const cat = t.category || "General";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTemplates,
      customTemplates,
      systemTemplates,
      categories,
    };
  },
});
