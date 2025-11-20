import { faker } from '@faker-js/faker';
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedDatabase = mutation({
  args: {
    userId: v.id("users"),
    customerCount: v.optional(v.number()),
  },
  handler: async (ctx, { userId, customerCount = 1000 }) => {
    
    faker.seed(123); // Reproducible data
    
    console.log(`🌱 Starting seed for user ${userId}...`);
    
    // 1. Generate Products
    console.log(`📦 Generating products...`);
    const productIds = await seedProducts(ctx, userId);
    
    // 2. Generate Customers
    console.log(`📊 Generating ${customerCount} customers...`);
    const customerIds = await seedCustomers(ctx, userId, customerCount);
    
    // 3. Generate Segments
    console.log(`🎯 Generating segments...`);
    const segmentIds = await seedSegments(ctx, userId);
    
    // 4. Generate Email Templates
    console.log(`📧 Generating email templates...`);
    const templateIds = await seedEmailTemplates(ctx, userId);
    
    // 5. Generate Campaigns with Performance
    console.log(`📢 Generating campaigns...`);
    const campaignIds = await seedCampaigns(ctx, userId, segmentIds);
    
    // 6. Generate Campaign Performance History
    console.log(`📈 Generating campaign performance history...`);
    await seedCampaignPerformanceHistory(ctx, userId, campaignIds, segmentIds);
    
    // 7. Generate Flows with Performance
    console.log(`🔄 Generating flows...`);
    const flowIds = await seedFlows(ctx, userId, segmentIds);
    
    // 8. Generate Flow Performance History
    console.log(`📊 Generating flow performance history...`);
    await seedFlowPerformanceHistory(ctx, userId, flowIds);
    
    // 9. Generate Analytics Snapshots
    console.log(`📸 Generating analytics snapshots...`);
    await seedAnalyticsSnapshots(ctx, userId);
    
    console.log(`✅ Seed complete!`);
    
    return {
      success: true,
      productsCreated: productIds.length,
      customersCreated: customerIds.length,
      segmentsCreated: segmentIds.length,
      campaignsCreated: campaignIds.length,
      flowsCreated: flowIds.length,
    };
  }
});

// ============ 1. PRODUCTS ============
async function seedProducts(ctx: any, userId: any) {
  const productIds = [];
  
  const products = [
    {
      name: "Premium Wireless Headphones",
      description: "High-quality noise-canceling wireless headphones with 30-hour battery life",
      category: "Electronics",
      price: 299.99,
      compareAtPrice: 399.99,
      cost: 120.00,
      tags: ["audio", "wireless", "premium"],
    },
    {
      name: "Organic Cotton T-Shirt",
      description: "Soft, breathable organic cotton t-shirt in multiple colors",
      category: "Clothing",
      price: 29.99,
      compareAtPrice: 39.99,
      cost: 8.50,
      tags: ["clothing", "organic", "casual"],
    },
    {
      name: "Smart Home Security Camera",
      description: "1080p HD security camera with night vision and motion detection",
      category: "Home & Garden",
      price: 149.99,
      compareAtPrice: 199.99,
      cost: 60.00,
      tags: ["smart-home", "security", "electronics"],
    },
  ];
  
  for (const product of products) {
    const totalSales = faker.number.int({ min: 50, max: 500 });
    const totalRevenue = Math.round(totalSales * product.price * 100) / 100;
    
    const productId = await ctx.db.insert("products", {
      ...product,
      sku: `SKU-${faker.string.alphanumeric(8).toUpperCase()}`,
      stockQuantity: faker.number.int({ min: 10, max: 500 }),
      lowStockThreshold: 20,
      totalSales,
      totalRevenue,
      averageRating: faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 1 }),
      reviewCount: faker.number.int({ min: 10, max: 200 }),
      status: "active",
      featured: faker.datatype.boolean({ probability: 0.3 }),
      userId,
      createdAt: faker.date.past({ years: 1 }).toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    productIds.push(productId);
  }
  
  console.log(`   ✓ Created ${productIds.length} products`);
  return productIds;
}

// ============ 2. CUSTOMERS ============
async function seedCustomers(ctx: any, userId: any, count: number) {
  const customerIds = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    
    // PURCHASE BEHAVIOR (realistic variance)
    const totalOrders = faker.number.int({ min: 0, max: 50 });
    const hasOrdered = totalOrders > 0;
    
    // Customer type affects spending
    const customerType = faker.helpers.weightedArrayElement([
      { weight: 10, value: 'whale' },      // 10% high spenders
      { weight: 30, value: 'regular' },    // 30% regular
      { weight: 60, value: 'occasional' }  // 60% low spenders
    ]);
    
    let avgOrderValue;
    if (customerType === 'whale') {
      avgOrderValue = faker.number.float({ min: 200, max: 800, fractionDigits: 2 });
    } else if (customerType === 'regular') {
      avgOrderValue = faker.number.float({ min: 50, max: 200, fractionDigits: 2 });
    } else {
      avgOrderValue = faker.number.float({ min: 20, max: 80, fractionDigits: 2 });
    }
    
    const totalSpent = totalOrders * avgOrderValue;
    
    // DATES
    const createdAt = faker.date.past({ years: 2 });
    const firstOrderDate = hasOrdered 
      ? faker.date.between({ from: createdAt, to: new Date() })
      : undefined;
    const lastOrderDate = hasOrdered && firstOrderDate
      ? faker.date.between({ from: firstOrderDate, to: new Date() })
      : undefined;
    
    const daysSinceLastOrder = lastOrderDate
      ? Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;
    
    // RFM SCORES
    const recencyScore = calculateRecencyScore(daysSinceLastOrder);
    const frequencyScore = calculateFrequencyScore(totalOrders);
    const monetaryScore = calculateMonetaryScore(totalSpent);
    const rfmSegment = getRfmSegment(recencyScore, frequencyScore, monetaryScore);
    const churnRisk = getChurnRisk(daysSinceLastOrder, totalOrders);
    
    // EMAIL ENGAGEMENT
    const engagementLevel = faker.helpers.weightedArrayElement([
      { weight: 20, value: 'high' },
      { weight: 50, value: 'medium' },
      { weight: 30, value: 'low' }
    ]);
    
    let emailOpensCount, emailClicksCount;
    if (engagementLevel === 'high') {
      emailOpensCount = faker.number.int({ min: 30, max: 100 });
      emailClicksCount = faker.number.int({ min: 10, max: Math.floor(emailOpensCount * 0.4) });
    } else if (engagementLevel === 'medium') {
      emailOpensCount = faker.number.int({ min: 5, max: 30 });
      emailClicksCount = faker.number.int({ min: 1, max: Math.floor(emailOpensCount * 0.3) });
    } else {
      emailOpensCount = faker.number.int({ min: 0, max: 5 });
      emailClicksCount = faker.number.int({ min: 0, max: 2 });
    }
    
    const engagementScore = Math.min(100, (emailOpensCount * 2) + (emailClicksCount * 5));
    
    // STATE DISTRIBUTION (realistic US)
    const state = faker.helpers.weightedArrayElement([
      { weight: 12, value: 'CA' },
      { weight: 9, value: 'TX' },
      { weight: 6, value: 'FL' },
      { weight: 6, value: 'NY' },
      { weight: 4, value: 'IL' },
      { weight: 63, value: faker.location.state({ abbreviated: true }) }
    ]);
    
    const customerId = await ctx.db.insert("customers", {
      email,
      firstName,
      lastName,
      phone: faker.phone.number(),
      
      // Address
      city: faker.location.city(),
      state,
      stateCode: state,
      country: "United States",
      countryCode: "US",
      zipCode: faker.location.zipCode(),
      
      // Demographics
      birthday: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toISOString(),
      gender: faker.helpers.arrayElement(["Male", "Female", "Other", "Prefer not to say"]),
      
      // Marketing preferences
      emailOptIn: faker.datatype.boolean({ probability: 0.8 }),
      smsOptIn: faker.datatype.boolean({ probability: 0.3 }),
      marketingConsent: faker.datatype.boolean({ probability: 0.75 }),
      emailVerified: faker.datatype.boolean({ probability: 0.9 }),
      source: faker.helpers.arrayElement([
        "Website", "Facebook", "Instagram", "Google", "In-Store", "Referral"
      ]),
      
      // Purchase metrics
      totalOrders,
      totalSpent: Math.round(totalSpent * 100) / 100,
      averageOrderValue: Math.round(avgOrderValue * 100) / 100,
      firstOrderDate: firstOrderDate?.toISOString(),
      lastOrderDate: lastOrderDate?.toISOString(),
      daysSinceLastOrder,
      
      // RFM
      recencyScore,
      frequencyScore,
      monetaryScore,
      rfmSegment,
      customerLifetimeValue: Math.round(totalSpent * 1.2 * 100) / 100,
      
      // Engagement
      emailOpensCount,
      emailClicksCount,
      lastEmailOpenDate: emailOpensCount > 0 
        ? faker.date.recent({ days: 60 }).toISOString()
        : undefined,
      lastEmailClickDate: emailClicksCount > 0 
        ? faker.date.recent({ days: 60 }).toISOString()
        : undefined,
      engagementScore,
      churnRisk,
      
      // Tags
      tags: faker.helpers.arrayElements(
        ["VIP", "Newsletter", "Early Adopter", "Seasonal Buyer", "Discount Hunter", "Brand Loyal"],
        { min: 0, max: 3 }
      ),
      
      // Metadata
      userId,
      createdAt: createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    customerIds.push(customerId);
    
    if ((i + 1) % 100 === 0) {
      console.log(`   ✓ ${i + 1}/${count} customers`);
    }
  }
  
  return customerIds;
}

// ============ 3. SEGMENTS ============
async function seedSegments(ctx: any, userId: any) {
  const segments = [
    {
      name: "VIP Customers",
      description: "High-value customers with strong engagement",
      conditions: [
        { field: "customerLifetimeValue", operator: ">", value: 500 },
        { field: "emailOptIn", operator: "=", value: true }
      ]
    },
    {
      name: "At-Risk Customers",
      description: "Previously active customers who haven't ordered recently",
      conditions: [
        { field: "daysSinceLastOrder", operator: ">", value: 90 },
        { field: "totalOrders", operator: ">", value: 3 }
      ]
    },
    {
      name: "High-Value Texas",
      description: "Texas customers with high lifetime value",
      conditions: [
        { field: "stateCode", operator: "=", value: "TX" },
        { field: "totalSpent", operator: ">", value: 500 }
      ]
    },
    {
      name: "Champions",
      description: "Best customers - high recency, frequency, and monetary scores",
      conditions: [
        { field: "rfmSegment", operator: "=", value: "Champions" }
      ]
    },
    {
      name: "New Customers",
      description: "Customers who joined in the last 30 days",
      conditions: [
        { field: "totalOrders", operator: "<=", value: 1 }
      ]
    },
  ];
  
  const segmentIds = [];
  
  for (const segment of segments) {
    const id = await ctx.db.insert("segments", {
      ...segment,
      aiGenerated: false,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    segmentIds.push(id);
  }
  
  return segmentIds;
}

// ============ 4. EMAIL TEMPLATES ============
async function seedEmailTemplates(ctx: any, userId: any) {
  const templates = [
    {
      name: "Welcome Email",
      subject: "Welcome to our store, {{firstName}}!",
      content: "Hi {{firstName}},\n\nWelcome to our community! We're excited to have you.\n\nBest regards,\nThe Team",
      category: "Welcome",
      isSystem: true,
    },
    {
      name: "Win-Back Campaign",
      subject: "We miss you, {{firstName}}",
      content: "Hi {{firstName}},\n\nIt's been a while! Here's 20% off your next order.\n\nCome back soon!",
      category: "Win-back",
      isSystem: true,
    },
    {
      name: "Product Recommendation",
      subject: "Products picked just for you",
      content: "Hi {{firstName}},\n\nBased on your interests, we think you'll love these items.\n\nHappy shopping!",
      category: "Promotional",
      isSystem: true,
    },
  ];
  
  const templateIds = [];
  
  for (const template of templates) {
    const id = await ctx.db.insert("emailTemplates", {
      ...template,
      userId,
      createdAt: new Date().toISOString(),
    });
    templateIds.push(id);
  }
  
  return templateIds;
}

// ============ 5. CAMPAIGNS ============
async function seedCampaigns(ctx: any, userId: any, segmentIds: any[]) {
  const campaigns = [
    {
      name: "Black Friday Sale",
      subject: "🔥 Black Friday: 50% Off Everything!",
      content: "Don't miss our biggest sale of the year...",
      status: "sent",
    },
    {
      name: "Win-Back Campaign",
      subject: "We miss you! Here's 20% off",
      content: "It's been a while since your last order...",
      status: "sent",
    },
    {
      name: "New Product Launch",
      subject: "Introducing our latest collection",
      content: "Be the first to see our new arrivals...",
      status: "sent",
    },
    {
      name: "Holiday Special",
      subject: "Holiday gifts for everyone 🎁",
      content: "Find the perfect gift this season...",
      status: "draft",
    },
  ];
  
  const campaignIds = [];
  
  for (const campaign of campaigns) {
    const sentAt = campaign.status === "sent" 
      ? faker.date.recent({ days: 30 })
      : undefined;
    
    // Generate fake performance metrics
    const sentCount = campaign.status === "sent" 
      ? faker.number.int({ min: 500, max: 2000 })
      : undefined;
    
    const openRate = campaign.status === "sent"
      ? faker.number.float({ min: 15, max: 45, fractionDigits: 1 })
      : undefined;
    
    const clickRate = campaign.status === "sent"
      ? faker.number.float({ min: 2, max: 12, fractionDigits: 1 })
      : undefined;
    
    const conversionRate = campaign.status === "sent"
      ? faker.number.float({ min: 1, max: 8, fractionDigits: 1 })
      : undefined;
    
    let openedCount, clickedCount, attributedRevenue, attributedOrders, revenuePerRecipient;
    
    if (campaign.status === "sent" && sentCount && openRate && clickRate && conversionRate) {
      openedCount = Math.round(sentCount * (openRate / 100));
      clickedCount = Math.round(openedCount * (clickRate / openRate));
      attributedOrders = Math.round(clickedCount * (conversionRate / 100));
      attributedRevenue = Math.round(attributedOrders * faker.number.float({ min: 50, max: 300 }));
      revenuePerRecipient = Math.round((attributedRevenue / sentCount) * 100) / 100;
    }
    
    const id = await ctx.db.insert("campaigns", {
      ...campaign,
      segmentId: faker.helpers.arrayElement(segmentIds),
      sentAt: sentAt?.toISOString(),
      sentCount,
      openedCount,
      clickedCount,
      openRate,
      clickRate,
      conversionRate,
      attributedRevenue,
      attributedOrders,
      revenuePerRecipient,
      aiGenerated: false,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    campaignIds.push(id);
  }
  
  return campaignIds;
}

// ============ 6. CAMPAIGN PERFORMANCE HISTORY ============
async function seedCampaignPerformanceHistory(ctx: any, userId: any, campaignIds: any[], segmentIds: any[]) {
  const subjects = [
    "Ready for 20% off?",
    "New arrivals inside",
    "Your exclusive discount",
    "3 products picked for you",
    "Last chance: Sale ends tonight",
    "You're going to love this",
    "Special offer just for you",
    "Don't miss out on these deals",
  ];
  
  const segmentNames = ["VIP", "At-Risk", "New Customers", "Champions", "Loyal"];
  
  // Generate 25 historical records
  for (let i = 0; i < 25; i++) {
    const sentAt = faker.date.past({ years: 0.5 });
    const dayOfWeek = sentAt.toLocaleDateString('en-US', { weekday: 'long' });
    const hourOfDay = sentAt.getHours();
    
    const segmentSize = faker.number.int({ min: 200, max: 1500 });
    const openRate = faker.number.float({ min: 18, max: 42, fractionDigits: 1 });
    const clickRate = faker.number.float({ min: 3, max: 15, fractionDigits: 1 });
    const conversionRate = faker.number.float({ min: 1, max: 10, fractionDigits: 1 });
    
    const opens = Math.round(segmentSize * (openRate / 100));
    const clicks = Math.round(opens * (clickRate / openRate));
    const conversions = Math.round(clicks * (conversionRate / 100));
    const revenue = Math.round(conversions * faker.number.float({ min: 50, max: 300 }));
    const revenuePerRecipient = Math.round((revenue / segmentSize) * 100) / 100;
    
    await ctx.db.insert("campaignPerformance", {
      userId,
      campaignId: faker.helpers.arrayElement(campaignIds),
      segmentName: faker.helpers.arrayElement(segmentNames),
      segmentSize,
      subject: faker.helpers.arrayElement(subjects),
      openRate,
      clickRate,
      conversionRate,
      revenue,
      revenuePerRecipient,
      sentAt: sentAt.toISOString(),
      dayOfWeek,
      hourOfDay,
      createdAt: new Date().toISOString(),
    });
  }
}

// ============ 7. FLOWS ============
async function seedFlows(ctx: any, userId: any, segmentIds: any[]) {
  const flows = [
    {
      name: "Welcome Series",
      description: "3-email welcome sequence for new customers",
      status: "active",
      triggerType: "segment_added",
      flowDefinition: {
        nodes: [
          {
            id: "node-1",
            type: "trigger",
            data: { triggerType: "segment_added", segmentId: segmentIds[4] },
            position: { x: 100, y: 100 }
          },
          {
            id: "node-2",
            type: "email",
            data: { subject: "Welcome!", content: "Hi {{firstName}}..." },
            position: { x: 300, y: 100 }
          },
          {
            id: "node-3",
            type: "delay",
            data: { duration: 2, unit: "days" },
            position: { x: 500, y: 100 }
          },
          {
            id: "node-4",
            type: "email",
            data: { subject: "Getting started guide" },
            position: { x: 700, y: 100 }
          },
        ],
        edges: [
          { id: "e1-2", source: "node-1", target: "node-2" },
          { id: "e2-3", source: "node-2", target: "node-3" },
          { id: "e3-4", source: "node-3", target: "node-4" },
        ]
      },
    },
    {
      name: "Win-Back Flow",
      description: "Re-engage customers who haven't ordered in 90 days",
      status: "active",
      triggerType: "segment_added",
      flowDefinition: {
        nodes: [
          {
            id: "node-1",
            type: "trigger",
            data: { triggerType: "segment_added", segmentId: segmentIds[1] },
            position: { x: 100, y: 100 }
          },
          {
            id: "node-2",
            type: "email",
            data: { subject: "We miss you!" },
            position: { x: 300, y: 100 }
          },
          {
            id: "node-3",
            type: "delay",
            data: { duration: 7, unit: "days" },
            position: { x: 500, y: 100 }
          },
          {
            id: "node-4",
            type: "email",
            data: { subject: "Here's 20% off" },
            position: { x: 700, y: 100 }
          },
        ],
        edges: [
          { id: "e1-2", source: "node-1", target: "node-2" },
          { id: "e2-3", source: "node-2", target: "node-3" },
          { id: "e3-4", source: "node-3", target: "node-4" },
        ]
      },
    },
  ];
  
  const flowIds = [];
  
  for (const flow of flows) {
    const totalRecipients = faker.number.int({ min: 200, max: 1000 });
    const completionRate = faker.number.float({ min: 40, max: 85, fractionDigits: 1 });
    const averageRevenue = faker.number.float({ min: 50, max: 500, fractionDigits: 2 });
    const totalRevenue = Math.round(totalRecipients * averageRevenue);
    
    const id = await ctx.db.insert("flows", {
      ...flow,
      triggerConfig: { segmentId: flow.flowDefinition.nodes[0].data.segmentId },
      totalRecipients,
      completionRate,
      averageRevenue,
      totalRevenue,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    flowIds.push(id);
  }
  
  return flowIds;
}

// ============ 8. FLOW PERFORMANCE HISTORY ============
async function seedFlowPerformanceHistory(ctx: any, userId: any, flowIds: any[]) {
  const flowNames = ["Welcome Series", "Win-Back Flow", "VIP Nurture", "Product Education"];
  
  for (let i = 0; i < 10; i++) {
    const periodStart = faker.date.past({ years: 0.3 });
    const periodEnd = faker.date.between({ from: periodStart, to: new Date() });
    
    const totalRecipients = faker.number.int({ min: 150, max: 800 });
    const completionRate = faker.number.float({ min: 35, max: 80, fractionDigits: 1 });
    const averageTimeToComplete = faker.number.int({ min: 3, max: 21 });
    const revenuePerRecipient = faker.number.float({ min: 30, max: 400, fractionDigits: 2 });
    const totalRevenue = Math.round(totalRecipients * revenuePerRecipient);
    
    await ctx.db.insert("flowPerformance", {
      userId,
      flowId: faker.helpers.arrayElement(flowIds),
      flowName: faker.helpers.arrayElement(flowNames),
      triggerType: "segment_added",
      numberOfSteps: faker.number.int({ min: 2, max: 5 }),
      totalRecipients,
      completionRate,
      dropOffPoint: `After email ${faker.number.int({ min: 1, max: 3 })}`,
      averageTimeToComplete,
      totalRevenue,
      revenuePerRecipient,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      createdAt: new Date().toISOString(),
    });
  }
}

// ============ 9. ANALYTICS SNAPSHOTS ============
async function seedAnalyticsSnapshots(ctx: any, userId: any) {
  // Generate 30 days of daily snapshots
  for (let i = 0; i < 30; i++) {
    const snapshotDate = new Date();
    snapshotDate.setDate(snapshotDate.getDate() - i);
    
    await ctx.db.insert("analyticsSnapshots", {
      userId,
      snapshotDate: snapshotDate.toISOString().split('T')[0],
      snapshotType: "daily",
      metrics: {
        totalCustomers: faker.number.int({ min: 900, max: 1100 }),
        activeCustomers: faker.number.int({ min: 600, max: 800 }),
        churnedCustomers: faker.number.int({ min: 50, max: 150 }),
        totalRevenue: faker.number.int({ min: 30000, max: 60000 }),
        averageOrderValue: faker.number.int({ min: 70, max: 120 }),
        campaignsSent: faker.number.int({ min: 0, max: 3 }),
        avgCampaignOpenRate: faker.number.float({ min: 20, max: 35, fractionDigits: 1 }),
        avgCampaignRevenue: faker.number.int({ min: 500, max: 2000 }),
        activeFlows: faker.number.int({ min: 2, max: 5 }),
        avgFlowCompletionRate: faker.number.float({ min: 50, max: 75, fractionDigits: 1 }),
        avgFlowRevenue: faker.number.int({ min: 800, max: 1500 }),
        championCount: faker.number.int({ min: 80, max: 150 }),
        loyalCount: faker.number.int({ min: 200, max: 350 }),
        atRiskCount: faker.number.int({ min: 50, max: 120 }),
      },
      createdAt: new Date().toISOString(),
    });
  }
}

// ============ HELPER FUNCTIONS ============

function calculateRecencyScore(days: number | undefined): number {
  if (!days) return 1;
  if (days < 30) return 5;
  if (days < 60) return 4;
  if (days < 90) return 3;
  if (days < 180) return 2;
  return 1;
}

function calculateFrequencyScore(orders: number): number {
  if (orders >= 20) return 5;
  if (orders >= 10) return 4;
  if (orders >= 5) return 3;
  if (orders >= 2) return 2;
  return 1;
}

function calculateMonetaryScore(spent: number): number {
  if (spent >= 1000) return 5;
  if (spent >= 500) return 4;
  if (spent >= 200) return 3;
  if (spent >= 100) return 2;
  return 1;
}

function getRfmSegment(r: number, f: number, m: number): string {
  const score = r + f + m;
  if (score >= 13) return "Champions";
  if (score >= 10) return "Loyal";
  if (score >= 7) return "Potential";
  if (score >= 5) return "At-Risk";
  return "Lost";
}

function getChurnRisk(days: number | undefined, orders: number): string {
  if (!days) return "Low";
  if (days > 90 && orders > 5) return "High";
  if (days > 45 && orders > 2) return "Medium";
  return "Low";
}
