import { internalMutation } from "./_generated/server";

/**
 * Migration: Remove favoriteCategory field from customers table
 * 
 * This migration removes the deprecated favoriteCategory field from all customer records.
 * Run this migration with: npx convex run migrations:removeFavoriteCategory
 */
export const removeFavoriteCategory = internalMutation({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect();
    
    let updatedCount = 0;
    
    for (const customer of customers) {
      // Check if the field exists on this customer record
      if ("favoriteCategory" in customer) {
        // Remove the field by patching without it
        const { favoriteCategory, ...customerWithoutFavoriteCategory } = customer as any;
        
        await ctx.db.replace(customer._id, {
          ...customerWithoutFavoriteCategory,
          updatedAt: new Date().toISOString(),
        });
        
        updatedCount++;
      }
    }
    
    return {
      success: true,
      message: `Migration completed: Removed favoriteCategory from ${updatedCount} customer records`,
      totalCustomers: customers.length,
      updatedCustomers: updatedCount,
    };
  },
});
