import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============ USER MANAGEMENT ============
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    
    // Onboarding
    onboardingCompleted: v.boolean(),
    dataGenerated: v.boolean(), // Has seed data been created?
    
    // Subscription
    plan: v.optional(v.string()), // "free", "pro"
    
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // ============ CORE DATA ============
  customers: defineTable({
    // IDENTITY
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    
    // ADDRESS
    addressLine1: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    
    // DEMOGRAPHICS
    birthday: v.optional(v.string()),
    gender: v.optional(v.string()),
    languagePreference: v.optional(v.string()),
    
    // MARKETING PREFERENCES
    emailOptIn: v.boolean(),
    smsOptIn: v.boolean(),
    marketingConsent: v.boolean(),
    emailVerified: v.boolean(),
    source: v.optional(v.string()), // "Website", "Facebook", "Instagram", "In-Store"
    
    // PURCHASE METRICS (Observable - from order history)
    totalOrders: v.number(),
    totalSpent: v.number(),
    averageOrderValue: v.number(),
    firstOrderDate: v.optional(v.string()),
    lastOrderDate: v.optional(v.string()),
    lastOrderAmount: v.optional(v.number()),
    daysSinceLastOrder: v.optional(v.number()),
    
    // RFM SEGMENTATION (Computed scores)
    recencyScore: v.optional(v.number()), // 1-5
    frequencyScore: v.optional(v.number()), // 1-5
    monetaryScore: v.optional(v.number()), // 1-5
    rfmSegment: v.optional(v.string()), // "Champions", "At-Risk", "Loyal", "Potential", "Lost"
    customerLifetimeValue: v.optional(v.number()),
    
    // ENGAGEMENT METRICS (Observable - from email interactions)
    lastWebsiteVisit: v.optional(v.string()),
    emailOpensCount: v.optional(v.number()),
    emailClicksCount: v.optional(v.number()),
    lastEmailOpenDate: v.optional(v.string()),
    lastEmailClickDate: v.optional(v.string()),
    
    // METADATA
    userId: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"])
    .index("by_ltv", ["customerLifetimeValue"])
    .index("by_last_order", ["lastOrderDate"])
    .searchIndex("search_customers", {
      searchField: "email",
      filterFields: ["userId", "state"],
    }),

  // ============ PRODUCTS ============
  products: defineTable({
    // IDENTITY
    name: v.string(),
    description: v.optional(v.string()),
    sku: v.string(), // Unique product identifier
    
    // PRICING
    price: v.number(),
    compareAtPrice: v.optional(v.number()), // Original price for discounts
    cost: v.optional(v.number()), // Cost of goods
    
    // CATEGORIZATION
    category: v.string(),
    tags: v.array(v.string()),
    
    // INVENTORY
    stockQuantity: v.number(),
    lowStockThreshold: v.optional(v.number()),
    
    // SALES METRICS
    totalSales: v.number(), // Total units sold
    totalRevenue: v.number(), // Total revenue generated
    averageRating: v.optional(v.number()), // 1-5 stars
    reviewCount: v.optional(v.number()),
    
    // STATUS
    status: v.string(), // "active", "draft", "archived"
    featured: v.boolean(),
    
    // METADATA
    userId: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_sku", ["sku"])
    .searchIndex("search_products", {
      searchField: "name",
      filterFields: ["userId", "category", "status"],
    }),

  // ============ SEGMENTATION ============
  segments: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    
    // SEGMENT DEFINITION (How to find matching customers)
    // Conditions are AND-ed together: (state = TX) AND (totalSpent > 500)
    conditions: v.array(
      v.object({
        field: v.string(),
        operator: v.string(), // "=", ">", "<", ">=", "<=", "!=", "contains", "in"
        value: v.union(
          v.string(),
          v.number(),
          v.boolean(),
          v.array(v.string()),
          v.array(v.number())
        ),
      })
    ),
    
    // METADATA
    customerCount: v.optional(v.number()), // Cached - updated periodically
    
    // AI METADATA
    aiGenerated: v.boolean(),
    aiPrompt: v.optional(v.string()),
    
    userId: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_ai_generated", ["aiGenerated"]),

  // ============ CAMPAIGNS ============
  campaigns: defineTable({
    name: v.string(),
    
    // EMAIL CONTENT (Snapshot from template)
    emailTemplateId: v.optional(v.id("emailTemplates")), // Reference to original template
    subject: v.string(), // Copied from template (can be customized)
    content: v.string(), // Copied from template (snapshot at creation)
    
    description: v.optional(v.string()), // Internal notes
    
    // TARGETING
    segmentId: v.optional(v.id("segments")), // Who receives this
    
    // SCHEDULING
    status: v.string(), // "draft", "scheduled", "sending", "sent", "paused"
    scheduledAt: v.optional(v.string()),
    sentAt: v.optional(v.string()),
    
    // PERFORMANCE METRICS (Fake data for AI analysis)
    sentCount: v.optional(v.number()),
    openedCount: v.optional(v.number()),
    clickedCount: v.optional(v.number()),
    openRate: v.optional(v.number()), // Percentage: opens / sent
    clickRate: v.optional(v.number()), // Percentage: clicks / sent
    conversionRate: v.optional(v.number()),
    
    // REVENUE ATTRIBUTION (Fake data for insights)
    attributedRevenue: v.optional(v.number()),
    attributedOrders: v.optional(v.number()),
    revenuePerRecipient: v.optional(v.number()),
    
    // A/B TESTING
    isAbTest: v.optional(v.boolean()),
    abTestVariants: v.optional(
      v.array(
        v.object({
          name: v.string(),
          subject: v.string(),
          content: v.string(),
          percentage: v.number(), // 0-100
          sentCount: v.optional(v.number()),
          openRate: v.optional(v.number()),
          clickRate: v.optional(v.number()),
          conversionRate: v.optional(v.number()),
        })
      )
    ),
    
    // AI METADATA
    aiGenerated: v.boolean(),
    aiPrompt: v.optional(v.string()),
    
    userId: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_segment", ["segmentId"]),

  // ============ FLOWS ============
  flows: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    status: v.string(), // "draft", "active", "paused"
    
    // SIMULATED PERFORMANCE (Fake metrics for AI insights)
    totalRecipients: v.optional(v.number()), // How many people "went through"
    completionRate: v.optional(v.number()), // Percentage who finished flow
    dropOffNodeId: v.optional(v.string()), // Where most people stopped
    averageRevenue: v.optional(v.number()), // Revenue per person in flow
    totalRevenue: v.optional(v.number()), // Total from this flow
    
    userId: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Flow nodes - discriminated union for type safety
  flowNodes: defineTable({
    flowId: v.id("flows"),
    nodeId: v.string(), // Unique within flow (e.g., "trigger-1", "email-2")
    
    // Node type discriminator
    type: v.string(), // "trigger", "email", "delay", "condition"
    
    // Type-specific data (discriminated union)
    // TRIGGER NODE
    triggerType: v.optional(v.string()), // "segment_added", "manual", "date"
    segmentId: v.optional(v.id("segments")),
    segmentName: v.optional(v.string()),
    
    // EMAIL NODE
    emailTemplateId: v.optional(v.id("emailTemplates")),
    emailSubject: v.optional(v.string()),
    emailName: v.optional(v.string()), // Display name in flow
    
    // DELAY NODE
    delayDays: v.optional(v.number()),
    delayHours: v.optional(v.number()),
    delayName: v.optional(v.string()),
    
    // CONDITION NODE
    conditionType: v.optional(v.string()), // "email_opened", "email_clicked", "purchased"
    conditionName: v.optional(v.string()),
    
    // React Flow positioning
    positionX: v.float64(),
    positionY: v.float64(),
    
    // React Flow internal state (optional)
    width: v.optional(v.float64()),
    height: v.optional(v.float64()),
    
    userId: v.id("users"),
    createdAt: v.string(),
  })
    .index("by_flow", ["flowId"])
    .index("by_flow_and_node", ["flowId", "nodeId"]),

  // Flow edges - connections between nodes
  flowEdges: defineTable({
    flowId: v.id("flows"),
    edgeId: v.string(), // Unique within flow
    
    sourceNodeId: v.string(), // References flowNodes.nodeId
    targetNodeId: v.string(), // References flowNodes.nodeId
    
    // For condition nodes: which branch ("yes", "no")
    sourceHandle: v.optional(v.string()),
    
    // Styling (optional, for React Flow)
    animated: v.optional(v.boolean()),
    label: v.optional(v.string()),
    
    userId: v.id("users"),
    createdAt: v.string(),
  })
    .index("by_flow", ["flowId"])
    .index("by_source", ["flowId", "sourceNodeId"])
    .index("by_target", ["flowId", "targetNodeId"]),

  // ============ EMAIL TEMPLATES ============
  emailTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    subject: v.string(),
    content: v.string(), // With {{variables}} like {{firstName}}
    category: v.optional(v.string()), // "Welcome", "Win-back", "Promotional"
    isSystem: v.boolean(), // Pre-built vs user-created
    
    userId: v.id("users"),
    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_category", ["category"]),

  // ============ ANALYTICS & INSIGHTS ============
  
  // Historical performance tracking (time-series data for AI)
  analyticsSnapshots: defineTable({
    userId: v.id("users"),
    snapshotDate: v.string(), // "2025-11-15"
    snapshotType: v.string(), // "daily", "weekly", "monthly"
    
    metrics: v.object({
      // Customer metrics
      totalCustomers: v.number(),
      activeCustomers: v.number(),
      churnedCustomers: v.number(),
      
      // Revenue metrics
      totalRevenue: v.number(),
      averageOrderValue: v.number(),
      
      // Campaign metrics
      campaignsSent: v.number(),
      avgCampaignOpenRate: v.number(),
      avgCampaignRevenue: v.number(),
      
      // Flow metrics
      activeFlows: v.number(),
      avgFlowCompletionRate: v.number(),
      avgFlowRevenue: v.number(),
      
      // Segment breakdown
      championCount: v.number(),
      loyalCount: v.number(),
      atRiskCount: v.number(),
      
      customMetrics: v.optional(
        v.object({
          // Extensible metrics with known types
          productCategoryRevenue: v.optional(v.array(
            v.object({
              category: v.string(),
              revenue: v.number(),
            })
          )),
          topProducts: v.optional(v.array(
            v.object({
              productId: v.string(),
              name: v.string(),
              sales: v.number(),
            })
          )),
          geographicBreakdown: v.optional(v.array(
            v.object({
              region: v.string(),
              customerCount: v.number(),
              revenue: v.number(),
            })
          )),
        })
      ),
    }),
    
    createdAt: v.string(),
  })
    .index("by_user_and_date", ["userId", "snapshotDate"])
    .index("by_user_and_type", ["userId", "snapshotType"]),

  // Detailed campaign history for AI pattern analysis
  campaignPerformance: defineTable({
    userId: v.id("users"),
    campaignId: v.id("campaigns"),
    
    // SNAPSHOT (Performance at time of send)
    segmentName: v.string(),
    segmentSize: v.number(),
    subject: v.string(), // For subject line analysis
    
    // PERFORMANCE
    openRate: v.number(),
    clickRate: v.number(),
    conversionRate: v.number(),
    revenue: v.number(),
    revenuePerRecipient: v.number(),
    
    // TIMING (For send time analysis)
    sentAt: v.string(),
    dayOfWeek: v.string(), // "Monday", "Tuesday", etc.
    hourOfDay: v.number(), // 10 for 10 AM
    
    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_campaign", ["campaignId"])
    .index("by_day_of_week", ["dayOfWeek"]),

  // Flow history for AI pattern analysis
  flowPerformance: defineTable({
    userId: v.id("users"),
    flowId: v.id("flows"),
    
    // SNAPSHOT
    flowName: v.string(),
    triggerType: v.string(),
    numberOfSteps: v.number(), // Count of email nodes
    
    // PERFORMANCE
    totalRecipients: v.number(),
    completionRate: v.number(),
    dropOffPoint: v.string(), // "After email 2" or node ID
    averageTimeToComplete: v.number(), // Days
    totalRevenue: v.number(),
    revenuePerRecipient: v.number(),
    
    // TIMING
    periodStart: v.string(),
    periodEnd: v.string(),
    
    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_flow", ["flowId"]),

  // AI analysis cache
  generatedInsights: defineTable({
    userId: v.id("users"),
    
    insights: v.array(
      v.object({
        type: v.string(), // "send_time", "subject_line", "segment_performance"
        priority: v.string(), // "high", "medium", "low"
        title: v.string(),
        finding: v.string(),
        evidence: v.string(),
        whyItMatters: v.string(),
        recommendation: v.string(),
        expectedImpact: v.string(),
      })
    ),
    
    generatedAt: v.string(),
    validUntil: v.optional(v.string()), // Cache expiry
  })
    .index("by_user", ["userId"]),

  // ============ AI CONVERSATIONS ============
  aiConversations: defineTable({
    userId: v.id("users"),
    conversationType: v.string(), // "campaign_generation", "analytics", "general"
    
    messages: v.array(
      v.object({
        role: v.string(), // "user", "assistant"
        content: v.string(),
        timestamp: v.string(),
        reasoning: v.optional(v.string()), // AI reasoning for workflow steps
        functionCalls: v.optional(
          v.array(
            v.object({
              name: v.string(),
              result: v.union(
                v.string(),
                v.number(),
                v.boolean(),
                v.null(),
                v.object({
                  success: v.boolean(),
                  message: v.optional(v.string()),
                  data: v.optional(v.string()), // JSON stringified data
                })
              ),
            })
          )
        ),
      })
    ),
    
    // Links to created resources
    artifactsCreated: v.optional(
      v.object({
        segments: v.array(v.id("segments")),
        campaigns: v.array(v.id("campaigns")),
        flows: v.array(v.id("flows")),
      })
    ),
    
    status: v.string(), // "active", "completed"
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["conversationType"]),
});
