import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * List all customers with optional pagination
 * Returns customers sorted by creation date (newest first)
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const offset = args.offset ?? 0;

    const customers = await ctx.db
      .query("customers")
      .order("desc")
      .collect();

    const total = customers.length;
    const paginatedCustomers = customers.slice(offset, offset + limit);

    return {
      customers: paginatedCustomers,
      total,
      limit,
      offset,
    };
  },
});

/**
 * Get a single customer by ID
 */
export const getById = query({
  args: {
    id: v.id("customers"),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.id);
    return customer;
  },
});

/**
 * Get a customer by email
 */
export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customers")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    return customer;
  },
});

/**
 * Search customers by name or email
 */
export const search = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const searchLower = args.searchTerm.toLowerCase();

    const allCustomers = await ctx.db.query("customers").collect();

    const filtered = allCustomers.filter((customer) => {
      const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
      const nameMatch = fullName.includes(searchLower);
      const emailMatch = customer.email.toLowerCase().includes(searchLower);
      return nameMatch || emailMatch;
    });

    return filtered.slice(0, limit);
  },
});

/**
 * Create a new customer
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Check if customer with email already exists for this user
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existing) {
      throw new Error("Customer with this email already exists");
    }

    const now = new Date().toISOString();

    const customerId = await ctx.db.insert("customers", {
      userId: args.userId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      city: args.city,
      state: args.state,
      country: args.country,
      tags: args.tags ?? [],
      
      // Marketing preferences - defaults
      emailOptIn: true,
      smsOptIn: false,
      marketingConsent: true,
      emailVerified: false,
      
      // Purchase metrics - defaults
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      
      // Engagement defaults
      engagementScore: 50,
      churnRisk: "Low",
      
      createdAt: now,
      updatedAt: now,
    });

    return customerId;
  },
});

/**
 * Update an existing customer
 */
export const update = mutation({
  args: {
    id: v.id("customers"),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    emailOptIn: v.optional(v.boolean()),
    smsOptIn: v.optional(v.boolean()),
    marketingConsent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Check if customer exists
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Customer not found");
    }

    // If email is being updated, check for duplicates
    if (updates.email && updates.email !== existing.email) {
      const duplicate = await ctx.db
        .query("customers")
        .withIndex("by_user", (q) => q.eq("userId", existing.userId))
        .filter((q) => q.eq(q.field("email"), updates.email!))
        .first();

      if (duplicate) {
        throw new Error("Customer with this email already exists");
      }
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return id;
  },
});

/**
 * Delete a customer
 */
export const deleteCustomer = mutation({
  args: {
    id: v.id("customers"),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.id);
    if (!customer) {
      throw new Error("Customer not found");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Get customer statistics for a specific user
 */
export const getStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    const highValueCustomers = customers.filter((c) => (c.customerLifetimeValue ?? 0) > 1000).length;
    const atRiskCustomers = customers.filter((c) => c.churnRisk === "High").length;

    return {
      totalCustomers,
      totalRevenue,
      avgLifetimeValue,
      highValueCustomers,
      atRiskCustomers,
    };
  },
});
