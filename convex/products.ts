import { v } from "convex/values";
import { query } from "./_generated/server";

// Get all products for a user
export const list = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    return products;
  },
});

// Get top products by revenue
export const getTopByRevenue = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    // Sort by revenue descending
    const sorted = products.sort((a, b) => b.totalRevenue - a.totalRevenue);
    
    return sorted.slice(0, args.limit || 10);
  },
});

// Get top products by sales volume
export const getTopBySales = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    // Sort by total sales descending
    const sorted = products.sort((a, b) => b.totalSales - a.totalSales);
    
    return sorted.slice(0, args.limit || 10);
  },
});

// Get products by category
export const getByCategory = query({
  args: {
    userId: v.id("users"),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("status"), "active")
        )
      )
      .collect();
    
    return products;
  },
});

// Get product by ID
export const getById = query({
  args: {
    id: v.id("products"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get product stats summary
export const getStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    const totalRevenue = products.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalSales = products.reduce((sum, p) => sum + p.totalSales, 0);
    
    // Get top product
    const topProduct = products.sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
    
    // Get categories
    const categories = [...new Set(products.map(p => p.category))];
    
    return {
      totalProducts: products.length,
      totalRevenue,
      totalSales,
      topProduct: topProduct ? {
        name: topProduct.name,
        revenue: topProduct.totalRevenue,
        sales: topProduct.totalSales,
      } : null,
      categories,
    };
  },
});
