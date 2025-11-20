import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Save or update a conversation
export const saveConversation = mutation({
  args: {
    userId: v.id("users"),
    conversationId: v.union(v.id("aiConversations"), v.null()),
    messages: v.array(v.any()), // Use v.any() to accept flexible message structure
    conversationType: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Clean messages to match schema (remove extra fields not in schema)
    const cleanedMessages = args.messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      functionCalls: msg.functionCalls,
    }));
    
    // If conversationId provided, update existing
    if (args.conversationId) {
      await ctx.db.patch(args.conversationId, {
        messages: cleanedMessages,
        status: args.status || "active",
        updatedAt: now,
      });
      return args.conversationId;
    }
    
    // Otherwise create new conversation
    const conversationId = await ctx.db.insert("aiConversations", {
      userId: args.userId,
      conversationType: args.conversationType || "general",
      messages: cleanedMessages,
      status: args.status || "active",
      createdAt: now,
      updatedAt: now,
    });
    
    return conversationId;
  },
});
