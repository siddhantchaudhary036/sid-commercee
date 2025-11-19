# CommerceOS: AI-Native Email Marketing Platform
## Complete Implementation Guide

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [Application Structure](#application-structure)
5. [AI Agent Architecture](#ai-agent-architecture)
6. [Core Features](#core-features)
7. [Data Generation Strategy](#data-generation-strategy)
8. [Implementation Checklist](#implementation-checklist)

---

## 🎯 Project Overview

### What We're Building
CommerceOS is an **AI-native customer data platform (CDP)** and email marketing automation tool for e-commerce businesses. Unlike traditional platforms where AI is a feature, our AI is the **primary interface** - users accomplish tasks through natural language conversations with autonomous agents.

### Core Value Proposition
Traditional email marketing platforms require manual work: creating segments, writing campaigns, building flows. CommerceOS uses AI to automate these tasks while also providing **closed-loop intelligence** - tracking revenue attribution and automatically learning what works to optimize future campaigns.

### Key Differentiators
1. **Agentic AI Interface**: Multi-step autonomous workflows (not just chat)
2. **Revenue Attribution Tracking**: Know exactly which campaigns drive sales
3. **Performance Intelligence**: AI learns patterns and provides proactive recommendations
4. **Unified Platform**: Customers → Segments → Campaigns → Flows in one place

### Interview Requirements Met
✅ Customer information storage with rich properties
✅ UI to showcase customers + CRUD operations
✅ Customer segments with CRUD operations
✅ Multi-step email flows with delays
✅ AI agent for segment and campaign generation
✅ **BONUS**: Revenue attribution, performance insights, closed-loop learning

### Time Constraint: 3-5 Hours
This guide prioritizes features by implementation time:
- **Must Have** (3 hours): Core CRUD, basic AI agent, flow builder
- **Should Have** (4 hours): Revenue tracking, insights page
- **Nice to Have** (5 hours): A/B testing visualization, advanced analytics

---

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI components
- **Flow Builder**: React Flow (@xyflow/react) for visual flow creation
- **State Management**: Convex React hooks (built-in)
- **Forms**: React Hook Form + Zod validation

### Backend
- **Database**: Convex (serverless, real-time)
- **API Routes**: Next.js API routes (app/api/*)
- **Authentication**: Clerk (optional) or Convex built-in auth
- **File Storage**: Convex file storage (for CSV uploads)

### AI & Intelligence
- **Primary Model**: Google Gemini 2.5 Flash
- **Function Calling**: Native Gemini function calling API
- **Agent Architecture**: Router + Specialist pattern
- **Data Generation**: Faker.js for realistic seed data

### Why These Choices?

**Convex over traditional databases**:
- Real-time subscriptions out-of-box
- Zero-config deployment
- TypeScript-first with automatic type generation
- Built-in functions (no separate API layer needed)
- Perfect for rapid prototyping

**Gemini 2.5 Flash over GPT-4**:
- 2M token context window (massive)
- Native function calling support
- Structured output (JSON mode)
- Cost-effective ($0.075 per 1M input tokens)
- Fast response times

**React Flow for flow builder**:
- Production-ready drag-and-drop
- Node/edge state management included
- Customizable node types
- Perfect for Make.com/N8N-style UIs

---

## 🗄 Database Schema

### Complete Convex Schema (convex/schema.ts)

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
// ============ USER MANAGEMENT ============

users: defineTable({
clerkId: v.optional(v.string()),
email: v.string(),
name: v.optional(v.string()),

text
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
// Identity
email: v.string(),
firstName: v.string(),
lastName: v.string(),
phone: v.optional(v.string()),

text
// Address
addressLine1: v.optional(v.string()),
addressLine2: v.optional(v.string()),
city: v.optional(v.string()),
state: v.optional(v.string()),
stateCode: v.optional(v.string()),
country: v.optional(v.string()),
countryCode: v.optional(v.string()),
zipCode: v.optional(v.string()),

// Demographics
birthday: v.optional(v.string()),
gender: v.optional(v.string()),
languagePreference: v.optional(v.string()),
timezone: v.optional(v.string()),

// Marketing Preferences
emailOptIn: v.boolean(),
smsOptIn: v.boolean(),
marketingConsent: v.boolean(),
emailVerified: v.boolean(),
source: v.optional(v.string()),

// Purchase Metrics
totalOrders: v.number(),
totalSpent: v.number(),
averageOrderValue: v.number(),
firstOrderDate: v.optional(v.string()),
lastOrderDate: v.optional(v.string()),
lastOrderAmount: v.optional(v.number()),
daysSinceLastOrder: v.optional(v.number()),
totalRefunds: v.optional(v.number()),
refundAmount: v.optional(v.number()),

// RFM Segmentation
recencyScore: v.optional(v.number()), // 1-5
frequencyScore: v.optional(v.number()), // 1-5
monetaryScore: v.optional(v.number()), // 1-5
rfmSegment: v.optional(v.string()), // "Champions", "At-Risk", etc.
customerLifetimeValue: v.optional(v.number()),

// Engagement Metrics
websiteVisitsCount: v.optional(v.number()),
lastWebsiteVisit: v.optional(v.string()),
emailOpensCount: v.optional(v.number()),
emailClicksCount: v.optional(v.number()),
lastEmailOpenDate: v.optional(v.string()),
lastEmailClickDate: v.optional(v.string()),
engagementScore: v.optional(v.number()),
churnRisk: v.optional(v.string()), // "Low", "Medium", "High"

// Product Preferences
favoriteCategory: v.optional(v.string()),
lastProductViewed: v.optional(v.string()),
lastProductPurchased: v.optional(v.string()),
abandonedCartCount: v.optional(v.number()),
abandonedCartValue: v.optional(v.number()),

// Support & Satisfaction
supportTicketsCount: v.optional(v.number()),
lastSupportTicketDate: v.optional(v.string()),
customerSatisfactionScore: v.optional(v.number()),
netPromoterScore: v.optional(v.number()),

// Loyalty
loyaltyPointsBalance: v.optional(v.number()),
loyaltyTier: v.optional(v.string()),
referralCount: v.optional(v.number()),

// Tags & Custom
tags: v.array(v.string()),
customAttributes: v.optional(v.any()),

// Email Validation
emailValid: v.optional(v.boolean()),
suppressionStatus: v.optional(v.string()),

// Metadata
userId: v.id("users"),
createdAt: v.string(),
updatedAt: v.string(),
})
.index("by_user", ["userId"])
.index("by_email", ["email"])
.index("by_ltv", ["customerLifetimeValue"])
.index("by_last_order", ["lastOrderDate"])
.index("by_churn_risk", ["churnRisk"])
.searchIndex("search_customers", {
searchField: "email",
filterFields: ["userId", "state"],
}),

// ============ SEGMENTATION ============

segments: defineTable({
name: v.string(),
description: v.optional(v.string()),

text
// Segment definition
conditions: v.array(
  v.object({
    field: v.string(),
    operator: v.string(),
    value: v.any(),
  })
),

// Cached metrics
customerCount: v.optional(v.number()),

// AI metadata
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
subject: v.string(),
content: v.string(),

text
// Targeting
segmentId: v.optional(v.id("segments")),

// Scheduling
status: v.string(), // "draft", "scheduled", "sending", "sent", "paused"
scheduledAt: v.optional(v.string()),
sentAt: v.optional(v.string()),

// Performance Metrics
sentCount: v.optional(v.number()),
openedCount: v.optional(v.number()),
clickedCount: v.optional(v.number()),
openRate: v.optional(v.number()),
clickRate: v.optional(v.number()),
conversionRate: v.optional(v.number()),

// REVENUE ATTRIBUTION (KEY FEATURE)
attributedRevenue: v.optional(v.number()),
attributedOrders: v.optional(v.number()),
revenuePerRecipient: v.optional(v.number()),

// A/B Testing
isAbTest: v.optional(v.boolean()),
abTestVariants: v.optional(v.array(v.any())),

// AI metadata
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

text
status: v.string(), // "draft", "active", "paused"

// Trigger configuration
triggerType: v.string(),
triggerConfig: v.any(),

// Flow definition (React Flow nodes/edges)
flowDefinition: v.object({
  nodes: v.array(
    v.object({
      id: v.string(),
      type: v.string(),
      data: v.any(),
      position: v.object({ x: v.number(), y: v.number() }),
    })
  ),
  edges: v.array(
    v.object({
      id: v.string(),
      source: v.string(),
      target: v.string(),
    })
  ),
}),

// Performance
totalExecutions: v.optional(v.number()),
activeExecutions: v.optional(v.number()),

userId: v.id("users"),
createdAt: v.string(),
updatedAt: v.string(),
})
.index("by_user", ["userId"])
.index("by_status", ["status"]),

flowExecutions: defineTable({
flowId: v.id("flows"),
customerId: v.id("customers"),

text
currentNodeId: v.string(),
status: v.string(), // "running", "completed", "failed"

executionData: v.any(),
nextExecutionAt: v.optional(v.string()),

startedAt: v.string(),
completedAt: v.optional(v.string()),

userId: v.id("users"),
})
.index("by_flow", ["flowId"])
.index("by_customer", ["customerId"])
.index("by_status", ["status"])
.index("by_next_execution", ["nextExecutionAt"]),

// ============ EMAIL TEMPLATES ============

emailTemplates: defineTable({
name: v.string(),
description: v.optional(v.string()),
subject: v.string(),
content: v.string(),
category: v.optional(v.string()),

text
isSystem: v.boolean(),

userId: v.id("users"),
createdAt: v.string(),
})
.index("by_user", ["userId"])
.index("by_category", ["category"]),

// ============ CAMPAIGN SENDS (Email Queue) ============

campaignSends: defineTable({
campaignId: v.id("campaigns"),
customerId: v.id("customers"),

text
status: v.string(), // "queued", "sending", "sent", "delivered", "bounced", "failed"
statusDetails: v.optional(v.string()),

scheduledAt: v.string(),
sentAt: v.optional(v.string()),
deliveredAt: v.optional(v.string()),
openedAt: v.optional(v.string()),
clickedAt: v.optional(v.string()),

providerMessageId: v.optional(v.string()),
bounceReason: v.optional(v.string()),

retryCount: v.optional(v.number()),

userId: v.id("users"),
})
.index("by_campaign", ["campaignId"])
.index("by_customer", ["customerId"])
.index("by_status", ["status"])
.index("by_scheduled", ["scheduledAt"]),

// ============ REVENUE ATTRIBUTION ============

purchases: defineTable({
customerId: v.id("customers"),
orderId: v.string(),
amount: v.number(),
products: v.array(v.string()),

text
// Attribution
attributedToCampaignId: v.optional(v.id("campaigns")),
attributedToFlowId: v.optional(v.id("flows")),
attributionMethod: v.optional(v.string()),

clickedEmailAt: v.optional(v.string()),
purchasedAt: v.string(),

userId: v.id("users"),
})
.index("by_campaign", ["attributedToCampaignId"])
.index("by_customer", ["customerId"])
.index("by_user", ["userId"]),

// ============ ANALYTICS & INSIGHTS ============

analyticsSnapshots: defineTable({
userId: v.id("users"),

text
snapshotDate: v.string(),
snapshotType: v.string(), // "daily", "weekly", "monthly"

metrics: v.object({
  totalCustomers: v.number(),
  totalRevenue: v.number(),
  averageOrderValue: v.number(),
  activeCustomers: v.number(),
  churnedCustomers: v.number(),
  customMetrics: v.optional(v.any()),
}),

createdAt: v.string(),
})
.index("by_user_and_date", ["userId", "snapshotDate"])
.index("by_user_and_type", ["userId", "snapshotType"]),

generatedInsights: defineTable({
userId: v.id("users"),

text
insights: v.array(v.any()),

generatedAt: v.string(),
})
.index("by_user", ["userId"]),

// ============ AI CONVERSATIONS ============

aiConversations: defineTable({
userId: v.id("users"),

text
conversationType: v.string(),

messages: v.array(
  v.object({
    role: v.string(),
    content: v.string(),
    timestamp: v.string(),
    functionCall: v.optional(v.any()),
    functionResult: v.optional(v.any()),
  })
),

generatedSegmentId: v.optional(v.id("segments")),
generatedCampaignId: v.optional(v.id("campaigns")),

status: v.string(),

createdAt: v.string(),
updatedAt: v.string(),
})
.index("by_user", ["userId"]),
});

text

---

## 🏗 Application Structure

### File Structure
commerceos/
├── app/
│ ├── (auth)/
│ │ ├── sign-in/
│ │ └── sign-up/
│ ├── (dashboard)/
│ │ ├── dashboard/
│ │ │ └── page.tsx # Main dashboard with AI chat
│ │ ├── customers/
│ │ │ ├── page.tsx # Customer list + CRUD
│ │ │ └── [id]/
│ │ │ └── page.tsx # Customer detail
│ │ ├── segments/
│ │ │ ├── page.tsx # Segments list
│ │ │ └── [id]/
│ │ │ └── page.tsx # Segment builder/editor
│ │ ├── campaigns/
│ │ │ ├── page.tsx # Campaigns list
│ │ │ └── [id]/
│ │ │ └── page.tsx # Campaign detail + performance
│ │ ├── flows/
│ │ │ ├── page.tsx # Flows list
│ │ │ └── [id]/
│ │ │ └── page.tsx # React Flow builder
│ │ ├── emails/
│ │ │ ├── page.tsx # Email templates
│ │ │ └── [id]/
│ │ │ └── edit/
│ │ │ └── page.tsx # Email editor
│ │ ├── insights/
│ │ │ └── page.tsx # AI Performance Insights
│ │ ├── analytics/
│ │ │ └── page.tsx # Analytics chat interface
│ │ └── settings/
│ │ └── page.tsx # Settings (coming soon)
│ ├── onboarding/
│ │ └── page.tsx # Data generation flow
│ ├── api/
│ │ ├── agent/
│ │ │ └── route.ts # ROUTER AGENT (main entry)
│ │ ├── agents/
│ │ │ ├── segments/
│ │ │ │ └── route.ts # Segment specialist agent
│ │ │ ├── campaigns/
│ │ │ │ └── route.ts # Campaign specialist agent
│ │ │ ├── analytics/
│ │ │ │ └── route.ts # Analytics specialist agent
│ │ │ └── insights/
│ │ │ └── route.ts # Insights generator
│ │ └── seed-data/
│ │ └── route.ts # Trigger seed function
│ └── layout.tsx
├── convex/
│ ├── schema.ts # Database schema
│ ├── customers.ts # Customer CRUD functions
│ ├── segments.ts # Segment operations
│ ├── campaigns.ts # Campaign operations
│ ├── flows.ts # Flow operations
│ ├── analytics.ts # Analytics queries
│ ├── seed.ts # Data generation
│ └── insights.ts # Insights generation
├── components/
│ ├── ui/ # Shadcn components
│ ├── dashboard/
│ │ └── ai-chat.tsx # Main AI chat interface
│ ├── flows/
│ │ ├── flow-builder.tsx # React Flow canvas
│ │ ├── nodes/
│ │ │ ├── EmailNode.tsx
│ │ │ ├── DelayNode.tsx
│ │ │ └── TriggerNode.tsx
│ │ └── sidebar.tsx # Draggable node sidebar
│ └── customers/
│ └── customer-table.tsx # Customer data table
├── lib/
│ └── utils.ts
└── package.json

text

### Navigation Structure

**Left Sidebar** (app/(dashboard)/layout.tsx):
const navigation = [
{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
{ name: 'Customers', href: '/customers', icon: Users },
{ name: 'Segments', href: '/segments', icon: Filter },
{ name: 'Campaigns', href: '/campaigns', icon: Mail },
{ name: 'Flows', href: '/flows', icon: Workflow },
{ name: 'Email Templates', href: '/emails', icon: FileText },
{ name: 'Insights', href: '/insights', icon: Sparkles },
{ name: 'Analytics', href: '/analytics', icon: BarChart },
{ name: 'Settings', href: '/settings', icon: Settings },
];

text

---

## 🤖 AI Agent Architecture

### Overview
We use a **Router + Specialist pattern** to avoid overwhelming Gemini with too many functions.

User Message
↓
┌─────────────────────────────────────────┐
│ ROUTER AGENT │
│ (app/api/agent/route.ts) │
│ │
│ Functions (4): │
│ - handle_segment_request │
│ - handle_campaign_request │
│ - handle_analytics_request │
│ - plan_multi_step_workflow │
└─────────────────────────────────────────┘
↓
Routes to specialist
↓
┌──────────────┬──────────────┬──────────────┐
│ SEGMENTS │ CAMPAIGNS │ ANALYTICS │
│ AGENT │ AGENT │ AGENT │
│ │ │ │
│ 6 functions │ 8 functions │ 7 functions │
└──────────────┴──────────────┴──────────────┘

text

### Model Choice: Gemini 2.5 Flash

**Why Gemini 2.5 Flash?**
- **2M token context**: Can handle large data summaries
- **Fast**: ~500ms response time
- **Cheap**: $0.075 per 1M input tokens
- **Native function calling**: No wrapper libraries needed
- **Structured output**: Built-in JSON mode
- **Good at tables**: Research shows 40% better performance with tabular data

### Router Agent Implementation

**File**: `app/api/agent/route.ts`

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const routerTools = [{
functionDeclarations: [
{
name: "handle_segment_request",
description: "For creating, analyzing, or managing customer segments",
parameters: {
type: "object",
properties: {
userIntent: { type: "string" }
}
}
},
{
name: "handle_campaign_request",
description: "For creating, sending, or managing email campaigns and flows",
parameters: {
type: "object",
properties: {
userIntent: { type: "string" }
}
}
},
{
name: "handle_analytics_request",
description: "For analyzing customer data and generating reports",
parameters: {
type: "object",
properties: {
userIntent: { type: "string" }
}
}
},
{
name: "plan_multi_step_workflow",
description: "Break down complex requests into ordered steps",
parameters: {
type: "object",
properties: {
plan: {
type: "array",
items: {
type: "object",
properties: {
specialist: { type: "string", enum: ["segments", "campaigns", "analytics"] },
task: { type: "string" },
needsContextFrom: { type: "array", items: { type: "number" } }
}
}
}
}
}
}
]
}];

export async function POST(req: Request) {
const { message, conversationHistory } = await req.json();

const model = genAI.getGenerativeModel({
model: "gemini-2.0-flash-exp",
tools: routerTools
});

const result = await model.generateContent({
contents: [{ role: "user", parts: [{ text: message }] }]
});

const functionCall = result.response.candidates?.?.content?.parts?.?.functionCall;

// Single specialist routing
if (functionCall.name.startsWith("handle_")) {
const specialist = functionCall.name.replace("handle_", "").replace("_request", "");
return await callSpecialist(specialist, message, conversationHistory);
}

// Multi-step orchestration
if (functionCall.name === "plan_multi_step_workflow") {
return await executeWorkflow(functionCall.args.plan, message);
}

return Response.json({ answer: result.response.text() });
}

async function executeWorkflow(plan: any[], originalMessage: string) {
const context = {};
const results = [];

// JavaScript loop executes steps sequentially
for (let i = 0; i < plan.length; i++) {
const step = plan[i];

text
let stepPrompt = step.task;

// Add context from previous steps
if (step.needsContextFrom) {
  const contextData = step.needsContextFrom.map(n => context[n]);
  stepPrompt += `\n\nContext: ${JSON.stringify(contextData)}`;
}

// Call specialist
const result = await fetch(`/api/agents/${step.specialist}`, {
  method: 'POST',
  body: JSON.stringify({ message: stepPrompt, orchestrationMode: true })
}).then(r => r.json());

context[i + 1] = result.data;
results.push(result);
}

return {
answer: generateSummary(results),
orchestrationSteps: results,
artifacts: context
};
}

text

### Specialist Agent Example

**File**: `app/api/agents/segments/route.ts`

const segmentTools = [{
functionDeclarations: [
{
name: "create_segment",
description: "Create a new customer segment",
parameters: {
type: "object",
properties: {
name: { type: "string" },
conditions: { type: "array" }
}
}
},
{
name: "list_segments",
description: "Get all segments",
parameters: { type: "object", properties: {} }
},
// ... 4 more segment-specific functions
]
}];

export async function POST(req: Request) {
const { message } = await req.json();

const model = genAI.getGenerativeModel({
model: "gemini-2.0-flash-exp",
tools: segmentTools
});

const result = await model.generateContent({
contents: [{ role: "user", parts: [{ text: message }] }]
});

const functionCall = result.response.candidates?.?.content?.parts?.?.functionCall;

if (functionCall) {
// Execute actual Convex function
const functionResult = await executeSegmentFunction(
functionCall.name,
functionCall.args
);

text
// Get natural language response
const finalResult = await model.generateContent({
  contents: [
    { role: "user", parts: [{ text: message }] },
    { role: "model", parts: [{ functionCall }] },
    { role: "function", parts: [{ functionResponse: { 
      name: functionCall.name, 
      response: functionResult 
    }}]}
  ]
});

return Response.json({
  answer: finalResult.response.text(),
  data: functionResult
});
}

return Response.json({ answer: result.response.text() });
}

text

### Key Points

**Gemini only plans, JavaScript executes**:
- Gemini returns JSON describing what to do
- Your code actually calls Convex functions
- This ensures reliable, sequential execution

**Context passing**:
- Multi-step workflows pass results between specialists
- Each step can use data from previous steps
- Enables complex workflows like "create segment → create campaign → schedule send"

**Token efficiency**:
- Each specialist sees max 8 functions (not 30+)
- Router uses ~500 tokens, specialists use ~1000 tokens
- Total cost per complex request: < $0.01

---

## 🎨 Core Features

### 1. Dashboard with AI Chat

**Location**: `app/(dashboard)/dashboard/page.tsx`

**What It Does**:
- Primary interface for all AI interactions
- Chat-style interface similar to ChatGPT
- Handles all three specialist types (segments, campaigns, analytics)
- Shows suggested prompts when empty
- Displays created resources with links

**Key UI Elements**:
<div className="flex h-screen"> {/* Left: KPI Cards */} <div className="w-1/3 p-6"> <KPICard title="Total Customers" value="1,247" /> <KPICard title="Total Revenue" value="$45,870" /> <KPICard title="Active Campaigns" value="3" /> </div>
{/* Right: AI Chat */}

<div className="w-2/3"> <AIChatInterface /> </div> </div> ```
Example Prompts:

"Create a segment for high-value Texas customers"

"Design a win-back campaign for churned customers"

"Show me customers who haven't ordered in 90 days"

"Build a 3-email welcome flow for new signups"

2. Customers Page (CRUD)
Location: app/(dashboard)/customers/page.tsx

Requirements Met: #1 (storage) + #2 (UI + CRUD)

Features:

Sortable, filterable table with all customer fields

Search by name/email

Bulk actions (export, delete, add tags)

Click row → opens detail drawer

Inline editing for quick updates

Add customer button → form modal

Table Columns:

Name, Email, Location, LTV, Last Order, Churn Risk, Tags

All sortable and filterable

CRUD Operations:

text
// Create
const createCustomer = useMutation(api.customers.create);
await createCustomer({ email, firstName, lastName, ... });

// Read
const customers = useQuery(api.customers.list, { userId });

// Update
const updateCustomer = useMutation(api.customers.update);
await updateCustomer({ id, updates: { ... } });

// Delete
const deleteCustomer = useMutation(api.customers.delete);
await deleteCustomer({ id });
3. Segments Page (CRUD)
Location: app/(dashboard)/segments/page.tsx

Requirements Met: #3 (segment CRUD)

Features:

List all segments with customer counts

Create segment button → /segments/new

Click segment → /segments/[id] for editing

Filter builder UI (field + operator + value)

Real-time customer count preview

AI-generated segments marked with ✨ icon

Segment Builder UI (/segments/[id]):

text
<SegmentBuilder>
  <ConditionRow>
    <Select field="state" />
    <Select operator="=" />
    <Input value="TX" />
    <Button remove />
  </ConditionRow>
  
  <ConditionRow>
    <Select field="totalSpent" />
    <Select operator=">" />
    <Input value="500" type="number" />
    <Button remove />
  </ConditionRow>
  
  <Button addCondition />
  
  <PreviewPanel>
    47 customers match this segment
  </PreviewPanel>
</SegmentBuilder>
4. Campaigns Page
Location: app/(dashboard)/campaigns/page.tsx

Features:

List all campaigns (Draft, Scheduled, Sent)

Status badges with colors

Performance preview (open rate, revenue)

Create campaign button → /campaigns/new

Click campaign → /campaigns/[id] for details

Campaign Detail Page (/campaigns/[id]):

Tabs:

Overview: Subject, content preview, segment, schedule

Performance: Opens, clicks, conversions, revenue (KEY)

Edit: Modify campaign details

Performance Section (The Differentiator):

text
<PerformanceMetrics>
  <MetricCard>
    <Label>Sent</Label>
    <Value>1,247</Value>
  </MetricCard>
  
  <MetricCard>
    <Label>Opened</Label>
    <Value>412 (33.0%)</Value>
  </MetricCard>
  
  <MetricCard>
    <Label>Clicked</Label>
    <Value>89 (7.1%)</Value>
  </MetricCard>
  
  <MetricCard highlight>
    <Label>Revenue</Label>
    <Value>$4,870</Value>
    <Subtext>$3.90 per recipient</Subtext>
  </MetricCard>
  
  <MetricCard>
    <Label>Conversions</Label>
    <Value>23 (25.8%)</Value>
  </MetricCard>
</PerformanceMetrics>

<RevenueBreakdown>
  <h3>Top Converting Customers</h3>
  <Table>
    <Row>Sarah Johnson - $450</Row>
    <Row>Mike Chen - $320</Row>
    <Row>Emma Davis - $280</Row>
  </Table>
</RevenueBreakdown>
5. Flows Page (Visual Builder)
Location: app/(dashboard)/flows/[id]/page.tsx

Requirements Met: #4 (multi-step email flows)

Technology: React Flow (@xyflow/react)

Features:

Drag-and-drop node-based editor

Node types: Trigger, Email, Delay, Condition

Left sidebar with draggable nodes

Canvas with zoom/pan

Save flow → stores as JSON in Convex

Activate/pause flows

Node Types:

Trigger Node: What starts the flow

Segment added

Tag added

Date/time

Manual

Email Node: Send an email

Select template or write inline

Subject line

Preview

Delay Node: Wait period

Days, hours, minutes

Specific date/time

Condition Node: Branching logic

"Opened email?" → Yes/No paths

"Purchased?" → Yes/No paths

Flow Example:

text
[Trigger: Customer Added to "VIP"] 
    → [Email: Welcome Message]
    → [Delay: 2 days]
    → [Condition: Opened Email?]
        → YES: [Email: Product Recommendations]
        → NO: [Email: Different Subject Line]
Implementation:

text
import { ReactFlow, Background, Controls } from '@xyflow/react';

const nodeTypes = {
  trigger: TriggerNode,
  email: EmailNode,
  delay: DelayNode,
  condition: ConditionNode,
};

<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
>
  <Background />
  <Controls />
</ReactFlow>
6. Insights Page (AI Performance Intelligence)
Location: app/(dashboard)/insights/page.tsx

The Killer Feature - Closed-loop learning system

What It Does:

Analyzes all sent campaigns

Identifies performance patterns

Generates actionable recommendations

Quantifies expected impact

How It Works:

User visits /insights

Convex aggregates campaign data into summary tables

AI agent analyzes summaries (not raw data)

Gemini generates 3-5 insights with evidence

Displays insights with "Apply" buttons

Insight Card Structure:

text
<InsightCard priority="high">
  <Title>Send Time Optimization</Title>
  
  <Finding>
    Campaigns sent on Tuesday 10-11 AM have 2.3x higher 
    conversion rates and generate $180 more revenue per 
    100 recipients.
  </Finding>
  
  <Evidence>
    -  8 campaigns sent Tue 10am → avg $890 revenue
    -  12 campaigns sent Fri 3pm → avg $310 revenue
  </Evidence>
  
  <WhyItMatters>
    Optimal timing can significantly increase campaign ROI 
    without any content changes.
  </WhyItMatters>
  
  <Recommendation>
    Schedule your next 3 campaigns for Tuesday mornings. 
    Expected additional revenue: +$1,200
  </Recommendation>
  
  <Actions>
    <Button>Apply to Next Campaign</Button>
    <Button variant="outline">Learn More</Button>
  </Actions>
</InsightCard>
Types of Insights Generated:

Send time optimization (day/time patterns)

Subject line patterns (questions vs statements)

Segment performance comparisons

Content length analysis

Frequency recommendations

7. Analytics Chat
Location: app/(dashboard)/analytics/page.tsx

What It Does:

Natural language queries about customer data

"Show me customers from Texas with LTV > $500"

"What's my average order value?"

"How many VIP customers are at churn risk?"

How It Works:

User types question

Analytics specialist agent receives message

Gemini calls appropriate database query function

Results formatted as table + natural language

Displays both answer and data

Example Interaction:

text
User: "Show me top 10 customers by revenue"

AI: "Here are your top 10 customers by lifetime value:

[DATA TABLE]
Name              | Email              | LTV
Sarah Johnson     | sarah@email.com    | $2,450
Mike Chen         | mike@email.com     | $1,890
Emma Davis        | emma@email.com     | $1,670
...

These 10 customers represent $15,240 in total revenue, 
which is 33% of your total revenue from just 0.8% of 
customers."
8. Email Templates
Location: app/(dashboard)/emails/page.tsx

Features:

Template library (system + user-created)

Categories (Welcome, Win-back, Promotional, etc.)

Rich text editor

Variable insertion ({{firstName}}, {{productName}})

Preview mode

Used by campaigns and flows

Editor (/emails/[id]/edit):

text
<EmailEditor>
  <SubjectLine>
    <Input placeholder="Email subject" />
  </SubjectLine>
  
  <PreheaderText>
    <Input placeholder="Preview text" />
  </PreheaderText>
  
  <RichTextEditor>
    <!-- Tiptap or similar -->
  </RichTextEditor>
  
  <VariableInserter>
    <Button>{{ firstName }}</Button>
    <Button>{{ totalSpent }}</Button>
    <Button>{{ loyaltyTier }}</Button>
  </VariableInserter>
  
  <PreviewPanel device="desktop|mobile" />
</EmailEditor>
📊 Data Generation Strategy
Why NOT CSV?
Creating a CSV with 50+ fields for 1000 customers = nightmare.

Solution: Programmatic Seed with Faker.js
Install:

text
npm install @faker-js/faker
Implementation: convex/seed.ts

text
import { faker } from '@faker-js/faker';
import { internalMutation } from "./_generated/server";

export const seedDatabase = internalMutation({
  handler: async (ctx, { userId, customerCount = 1000 }) => {
    
    faker.seed(123); // Reproducible data
    
    for (let i = 0; i < customerCount; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName });
      
      const totalOrders = faker.number.int({ min: 0, max: 50 });
      const avgOrderValue = faker.number.float({ min: 20, max: 500 });
      const totalSpent = totalOrders * avgOrderValue;
      
      const createdAt = faker.date.past({ years: 2 });
      const lastOrderDate = totalOrders > 0 
        ? faker.date.between({ from: createdAt, to: new Date() })
        : null;
      
      const daysSinceLastOrder = lastOrderDate
        ? Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      const recencyScore = calculateRecencyScore(daysSinceLastOrder);
      const frequencyScore = calculateFrequencyScore(totalOrders);
      const monetaryScore = calculateMonetaryScore(totalSpent);
      const rfmSegment = getRfmSegment(recencyScore, frequencyScore, monetaryScore);
      
      const churnRisk = daysSinceLastOrder > 90 ? "High" 
        : daysSinceLastOrder > 45 ? "Medium" : "Low";
      
      await ctx.db.insert("customers", {
        email,
        firstName,
        lastName,
        phone: faker.phone.number(),
        
        addressLine1: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        country: "United States",
        countryCode: "US",
        zipCode: faker.location.zipCode(),
        
        birthday: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toISOString(),
        gender: faker.helpers.arrayElement(["Male", "Female", "Other"]),
        
        emailOptIn: faker.datatype.boolean({ probability: 0.8 }),
        smsOptIn: faker.datatype.boolean({ probability: 0.4 }),
        marketingConsent: faker.datatype.boolean({ probability: 0.75 }),
        emailVerified: faker.datatype.boolean({ probability: 0.9 }),
        source: faker.helpers.arrayElement(["Website", "Facebook", "Instagram", "In-Store"]),
        
        totalOrders,
        totalSpent,
        averageOrderValue: avgOrderValue,
        firstOrderDate: totalOrders > 0 ? createdAt.toISOString() : undefined,
        lastOrderDate: lastOrderDate?.toISOString(),
        daysSinceLastOrder,
        
        recencyScore,
        frequencyScore,
        monetaryScore,
        rfmSegment,
        customerLifetimeValue: totalSpent * 1.2,
        
        emailOpensCount: faker.number.int({ min: 0, max: 100 }),
        emailClicksCount: faker.number.int({ min: 0, max: 50 }),
        engagementScore: faker.number.int({ min: 0, max: 100 }),
        churnRisk,
        
        favoriteCategory: faker.helpers.arrayElement(["Electronics", "Clothing", "Home"]),
        abandonedCartCount: faker.number.int({ min: 0, max: 10 }),
        
        loyaltyPointsBalance: faker.number.int({ min: 0, max: 5000 }),
        loyaltyTier: faker.helpers.arrayElement(["Bronze", "Silver", "Gold", "Platinum"]),
        
        tags: faker.helpers.arrayElements(
          ["VIP", "Newsletter", "Early Adopter", "Discount Hunter"],
          { min: 0, max: 3 }
        ),
        
        userId,
        createdAt: createdAt.toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      if (i % 100 === 0) console.log(`Seeded ${i} customers...`);
    }
    
    console.log(`✅ Seeded ${customerCount} customers!`);
  }
});

function calculateRecencyScore(days: number | null): number {
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
Onboarding Flow
User Journey:

Sign up → redirect to /onboarding

Show: "Welcome! We'll generate realistic data for you"

Click "Generate Sample Data" button

Loading spinner: "Creating 1,000 customers..." (15 seconds)

Redirect to /dashboard with fully populated data

Onboarding Page:

text
// app/onboarding/page.tsx
const handleGenerateData = async () => {
  setIsSeeding(true);
  
  await fetch('/api/seed-data', {
    method: 'POST',
    body: JSON.stringify({ userId, customerCount: 1000 })
  });
  
  router.push('/dashboard');
};

return (
  <div>
    <h1>Welcome to CommerceOS!</h1>
    <p>We'll generate 1,000 realistic customers so you can explore features immediately.</p>
    
    <Button onClick={handleGenerateData} disabled={isSeeding}>
      {isSeeding ? "Generating..." : "Generate Sample Data"}
    </Button>
  </div>
);
Benefits:

Professional, realistic data in 15 seconds

No manual CSV creation

Reproducible (same seed = same data)

Easy to customize (change customerCount)

✅ Implementation Checklist
Phase 1: Foundation (60 min)
 Initialize Next.js + Convex project

 Set up Convex schema (copy from above)

 Install dependencies (Gemini, Faker, React Flow, Shadcn)

 Create basic layout with left sidebar navigation

 Set up authentication (Clerk or simple Convex auth)

 Create seed.ts and test with 100 customers

Phase 2: Core CRUD (45 min)
 Customers page: table with sorting/filtering

 Customer detail drawer with all fields

 Add/edit/delete customer functionality

 Segments page: list view

 Segment builder UI with condition rows

 Segment create/edit/delete

Phase 3: Campaigns (45 min)
 Campaigns page: list view with status badges

 Campaign create form (name, subject, content, segment)

 Campaign detail page with tabs

 Email template editor (basic rich text)

 Campaign performance metrics (opens, clicks)

Phase 4: AI Agent (60 min)
 Router agent (app/api/agent/route.ts)

 Segments specialist agent

 Campaigns specialist agent

 Analytics specialist agent

 Dashboard AI chat interface

 Test multi-step orchestration

Phase 5: Flows (45 min)
 Install React Flow

 Create node components (Email, Delay, Trigger)

 Flow builder canvas

 Draggable sidebar

 Save/load flow to Convex

 Flows list page

Phase 6: Revenue Attribution (30 min)
 Add revenue fields to campaigns table

 Create purchases table

 Display revenue on campaign performance page

 Add "Top Converting Customers" section

Phase 7: Insights (45 min)
 Create analytics aggregation queries (Convex)

 Insights specialist agent

 Insights page UI with cards

 Generate 2-3 sample insights

Phase 8: Polish (30 min)
 Analytics chat page

 Loading states and error handling

 Responsive design tweaks

 Demo data generation button

 Settings page placeholder

Total Estimated Time: 4.5-5 hours

🎯 Demo Script
When presenting to the evaluator:

1. Onboarding (30 sec)
"First, I'll generate realistic sample data"

Click button → 15 seconds → Dashboard loads with 1,000 customers

2. Show Manual CRUD (30 sec)
Navigate to Customers page

Show sortable table

Click customer → detail drawer

Edit a field inline

3. AI Agent - Simple Request (45 sec)
Type: "Show me customers from Texas with LTV over $500"

AI responds with answer + data table

Point out: "This is the analytics specialist agent"

4. AI Agent - Complex Workflow (90 sec)
Type: "Create a segment for high-value Texas customers and send them a win-back campaign"

Show orchestration in action:

"Creating segment 'High-Value Texas'... ✓"

"Generating campaign subject and content... ✓"

"Campaign created for 47 customers"

Navigate to segments → show new segment

Navigate to campaigns → show new campaign

5. Flow Builder (45 sec)
Navigate to Flows

Show existing flow with visual nodes

Drag new email node onto canvas

"This is like Make.com but for email marketing"

6. The Differentiator - Revenue Intelligence (90 sec)
Navigate to Campaigns

Click on sent campaign

Point out revenue metrics: "$4,870 attributed revenue, $3.90 per recipient"

Navigate to Insights page

Show AI-generated insight: "Tuesday 10 AM sends perform 2.3x better"

Say: "This is a closed-loop system - it tracks results, learns patterns, and optimizes future campaigns autonomously"

7. Close
"Unlike traditional CDPs that just send emails, mine tells you if they worked and how to improve"

"The AI isn't just a chatbot - it's an autonomous system that creates segments, campaigns, and learns from results"

💡 Independent Thinking Elements (For Evaluation)
When the evaluator asks "What did you add beyond requirements?":

1. Revenue Attribution System
"I built closed-loop revenue tracking because marketing isn't about sending emails - it's about driving sales. My platform attributes purchases back to campaigns and shows ROI metrics."

2. Performance Intelligence
"I added an AI insights system that analyzes campaign patterns and proactively recommends optimizations. It's not just reactive - it learns and improves autonomously."

3. Email Send Queue
"I implemented a proper send queue system with status tracking (queued → sending → sent → delivered) because you can't send 10,000 emails instantly. This shows I understand production constraints."

4. Agentic Orchestration
"Instead of simple chat, I built multi-step autonomous workflows. The AI can create a segment, generate campaign content, and schedule sends in one request - true agentic behavior."

5. Router Pattern
"I used a router + specialist architecture instead of one mega-agent because Gemini's performance degrades with 30+ functions. This shows systems design thinking."

6. Data Aggregation for AI
"Instead of feeding raw campaign data to Gemini (expensive, slow), I pre-aggregate into summary tables. This is how production AI analytics work - summaries, not raw data."

🚀 Getting Started Commands
text
# Initialize project
npx create-next-app@latest commerceos --typescript --tailwind --app
cd commerceos

# Install Convex
npm install convex
npx convex dev

# Install dependencies
npm install @google/generative-ai
npm install @faker-js/faker
npm install @xyflow/react
npm install @clerk/nextjs  # optional

# Add Shadcn components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add table
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select

# Set up environment variables
# .env.local:
# GEMINI_API_KEY=your_key_here
# NEXT_PUBLIC_CONVEX_URL=your_convex_url
# CONVEX_DEPLOYMENT=your_deployment
📝 Key Design Decisions
Why Convex?
Real-time updates without WebSockets setup

TypeScript-first with auto-generated types

Functions replace traditional REST APIs

Perfect for rapid prototyping

Zero DevOps (deployed automatically)

Why Gemini 2.5 Flash?
2M token context (can handle large summaries)

Native function calling (no wrappers)

Structured output built-in

Cost-effective for demos

Fast enough for good UX

Why Router + Specialist?
Avoids overwhelming LLM with too many functions

Each specialist has clear domain

Enables complex multi-step workflows

Better accuracy (focused context)

Easier to maintain and extend

Why Revenue Attribution?
Differentiates from basic email tools

Shows business understanding

Enables closed-loop learning

Measurable ROI demonstration

Production-grade thinking

🎓 Learning Resources
If you need help during implementation:

Convex:

Docs: https://docs.convex.dev

Schema guide: https://docs.convex.dev/database/schemas

React hooks: https://docs.convex.dev/client/react

Gemini Function Calling:

Official guide: https://ai.google.dev/gemini-api/docs/function-calling

Structured output: https://ai.google.dev/gemini-api/docs/structured-output

React Flow:

Docs: https://reactflow.dev

Examples: https://reactflow.dev/examples

Faker.js:

API reference: https://fakerjs.dev/api/

🏁 Final Notes
Time Management
Hour 1: Set up + schema + seed data

Hour 2: Customers + Segments CRUD

Hour 3: AI agent (router + 2 specialists)

Hour 4: Campaigns + Flows

Hour 5: Revenue tracking + Insights

If Running Out of Time
Priority 1 (Must have):

Customers CRUD

Segments CRUD

Basic AI chat (even just segments specialist)

Flow builder UI (can fake execution)

Priority 2 (Should have):

Campaign performance page

Revenue metrics

Multi-step orchestration

Priority 3 (Nice to have):

Insights page

Analytics chat

A/B testing UI

The Secret Weapon
Your insights page and revenue attribution are what set you apart. Even if other features are basic, these show you understand:

Marketing is about ROI, not just sending emails

AI should learn and improve, not just assist

Production systems need closed-loop feedback

Remember
You're not just building features - you're demonstrating:

Technical skill: Convex, Gemini, React Flow

Product thinking: Revenue attribution, insights

Systems design: Router pattern, data aggregation

Independent thinking: Went beyond requirements

Good luck! 🚀

text

This comprehensive guide covers everything needed to build the project. Copy this entire markdown content and use it with Cursor's AI coding assistant. The guide is structured to be both a reference and a step-by-step implementation plan.