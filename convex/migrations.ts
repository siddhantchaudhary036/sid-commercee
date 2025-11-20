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

/**
 * Migration: Remove overengineered fields from customers table
 * 
 * This migration removes unnecessary fields that are either redundant, 
 * too granular, or belong in separate tables.
 * 
 * Run this migration with: npx convex run migrations:removeOverengineeredFields
 */
export const removeOverengineeredFields = internalMutation({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect();
    
    const fieldsToRemove = [
      'addressLine2',
      'stateCode',
      'countryCode',
      'totalRefunds',
      'refundAmount',
      'lastProductViewed',
      'lastProductPurchased',
      'abandonedCartCount',
      'abandonedCartValue',
      'engagementScore',
      'churnRisk',
      'supportTicketsCount',
      'lastSupportTicketDate',
      'netPromoterScore',
      'lastEmailOpenDate',
      'lastEmailClickDate',
    ];
    
    let updatedCount = 0;
    
    for (const customer of customers) {
      const customerData = customer as any;
      let hasFieldsToRemove = false;
      
      // Check if any of the fields exist
      for (const field of fieldsToRemove) {
        if (field in customerData) {
          hasFieldsToRemove = true;
          break;
        }
      }
      
      if (hasFieldsToRemove) {
        // Create new object without the deprecated fields
        const cleanedCustomer = { ...customerData };
        fieldsToRemove.forEach(field => {
          delete cleanedCustomer[field];
        });
        
        cleanedCustomer.updatedAt = new Date().toISOString();
        
        await ctx.db.replace(customer._id, cleanedCustomer);
        updatedCount++;
      }
    }
    
    return {
      success: true,
      message: `Migration completed: Removed ${fieldsToRemove.length} fields from ${updatedCount} customer records`,
      totalCustomers: customers.length,
      updatedCustomers: updatedCount,
      fieldsRemoved: fieldsToRemove,
    };
  },
});

/**
 * Migration: Remove additional unnecessary fields from customers table
 * 
 * This migration removes: tags, suppressionStatus, timezone, websiteVisitsCount,
 * referralCount, loyaltyPointsBalance, engagementScore, churnRisk
 * 
 * Run this migration with: npx convex run migrations:removeAdditionalFields
 */
export const removeAdditionalFields = internalMutation({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect();
    
    const fieldsToRemove = [
      'suppressionStatus',
      'timezone',
      'websiteVisitsCount',
      'referralCount',
      'loyaltyPointsBalance',
      'engagementScore',
      'churnRisk',
    ];
    
    let updatedCount = 0;
    
    for (const customer of customers) {
      const customerData = customer as any;
      let hasFieldsToRemove = false;
      
      // Check if any of the fields exist
      for (const field of fieldsToRemove) {
        if (field in customerData) {
          hasFieldsToRemove = true;
          break;
        }
      }
      
      // Also handle tags - convert to empty array if it exists
      const needsTagsUpdate = 'tags' in customerData;
      
      if (hasFieldsToRemove || needsTagsUpdate) {
        // Create new object without the deprecated fields
        const cleanedCustomer = { ...customerData };
        fieldsToRemove.forEach(field => {
          delete cleanedCustomer[field];
        });
        
        // Remove tags field
        if ('tags' in cleanedCustomer) {
          delete cleanedCustomer.tags;
        }
        
        cleanedCustomer.updatedAt = new Date().toISOString();
        
        await ctx.db.replace(customer._id, cleanedCustomer);
        updatedCount++;
      }
    }
    
    return {
      success: true,
      message: `Migration completed: Removed ${fieldsToRemove.length + 1} fields (including tags) from ${updatedCount} customer records`,
      totalCustomers: customers.length,
      updatedCustomers: updatedCount,
      fieldsRemoved: [...fieldsToRemove, 'tags'],
    };
  },
});
