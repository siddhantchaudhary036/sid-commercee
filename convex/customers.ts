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
    addressLine1: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    birthday: v.optional(v.string()),
    languagePreference: v.optional(v.string()),
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
      addressLine1: args.addressLine1,
      city: args.city,
      state: args.state,
      country: args.country,
      zipCode: args.zipCode,
      birthday: args.birthday,
      languagePreference: args.languagePreference,
      
      // Marketing preferences - defaults
      emailOptIn: true,
      smsOptIn: false,
      marketingConsent: true,
      emailVerified: false,
      
      // Purchase metrics - defaults
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      
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
    addressLine1: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    zipCode: v.optional(v.string()),
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
    const highValueCustomers = customers.filter(
      (c) => (c.customerLifetimeValue ?? 0) > 1000
    ).length;
    
    // Calculate at-risk customers based on days since last order
    const atRiskCustomers = customers.filter(
      (c) => c.daysSinceLastOrder && c.daysSinceLastOrder > 90 && c.totalOrders > 5
    ).length;

    return {
      totalCustomers,
      totalRevenue,
      avgLifetimeValue,
      highValueCustomers,
      atRiskCustomers,
    };
  },
});

/**
 * Get segment distribution for analytics
 */
export const getSegmentDistribution = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const distribution: Record<string, { count: number; revenue: number }> = {
      Champions: { count: 0, revenue: 0 },
      Loyal: { count: 0, revenue: 0 },
      Potential: { count: 0, revenue: 0 },
      "At-Risk": { count: 0, revenue: 0 },
      Lost: { count: 0, revenue: 0 },
    };

    customers.forEach((customer) => {
      const segment = customer.rfmSegment || "Potential";
      if (distribution[segment]) {
        distribution[segment].count++;
        distribution[segment].revenue += customer.totalSpent;
      }
    });

    return Object.entries(distribution).map(([segment, data]) => ({
      segment,
      count: data.count,
      revenue: data.revenue,
      percentage: customers.length > 0 ? (data.count / customers.length) * 100 : 0,
    }));
  },
});

/**
 * Get actionable insights for customers
 */
export const getInsights = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // High churn risk customers (90+ days since last order, 5+ orders)
    const highChurnRisk = customers.filter(
      (c) => c.daysSinceLastOrder && c.daysSinceLastOrder > 90 && c.totalOrders > 5
    );

    // High value but low engagement (high LTV, low email engagement)
    const highValueLowEngagement = customers.filter(
      (c) =>
        (c.customerLifetimeValue ?? 0) > 500 && 
        (c.emailOpensCount ?? 0) < 5
    );

    // Ready for upsell (5+ orders, growing AOV)
    const readyForUpsell = customers.filter(
      (c) => c.totalOrders >= 5 && c.averageOrderValue > 80
    );

    return {
      highChurnRisk: {
        count: highChurnRisk.length,
        customers: highChurnRisk.slice(0, 5),
      },
      highValueLowEngagement: {
        count: highValueLowEngagement.length,
        customers: highValueLowEngagement.slice(0, 5),
      },
      readyForUpsell: {
        count: readyForUpsell.length,
        customers: readyForUpsell.slice(0, 5),
      },
    };
  },
});

/**
 * List customers with filters and pagination
 */
export const listWithFilters = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    segment: v.optional(v.string()),
    state: v.optional(v.string()),
    churnRisk: v.optional(v.string()),
    minLtv: v.optional(v.number()),
    maxLtv: v.optional(v.number()),
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const offset = args.offset ?? 0;

    let customers = await ctx.db
      .query("customers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Apply filters
    if (args.segment) {
      customers = customers.filter((c) => c.rfmSegment === args.segment);
    }

    if (args.state) {
      customers = customers.filter((c) => c.state === args.state);
    }

    if (args.churnRisk) {
      // Calculate churn risk on the fly
      if (args.churnRisk === "High") {
        customers = customers.filter(
          (c) => c.daysSinceLastOrder && c.daysSinceLastOrder > 90 && c.totalOrders > 5
        );
      } else if (args.churnRisk === "Medium") {
        customers = customers.filter(
          (c) => c.daysSinceLastOrder && c.daysSinceLastOrder > 60 && c.daysSinceLastOrder <= 90
        );
      } else if (args.churnRisk === "Low") {
        customers = customers.filter(
          (c) => !c.daysSinceLastOrder || c.daysSinceLastOrder <= 60
        );
      }
    }

    if (args.minLtv !== undefined) {
      customers = customers.filter(
        (c) => (c.customerLifetimeValue ?? 0) >= args.minLtv!
      );
    }

    if (args.maxLtv !== undefined) {
      customers = customers.filter(
        (c) => (c.customerLifetimeValue ?? 0) <= args.maxLtv!
      );
    }

    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      customers = customers.filter((c) => {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        const emailMatch = c.email.toLowerCase().includes(searchLower);
        const nameMatch = fullName.includes(searchLower);
        return emailMatch || nameMatch;
      });
    }

    // Sort by last order date (most recent first)
    customers.sort((a, b) => {
      const dateA = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
      const dateB = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
      return dateB - dateA;
    });

    const total = customers.length;
    const paginatedCustomers = customers.slice(offset, offset + limit);

    return {
      customers: paginatedCustomers,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  },
});
