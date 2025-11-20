import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Agent routing types
type AgentType = "customer_analyst" | "segments" | "campaigns" | "flows" | "emails" | "orchestrator";

interface RoutingResult {
  agent: AgentType;
  reasoning: string;
}

export async function POST(request: Request) {
  try {
    const { message, userId, conversationHistory } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: "Message and userId are required" },
        { status: 400 }
      );
    }

    // Step 1: Route to appropriate agent
    const routing = await routeToAgent(message, conversationHistory);
    
    // Step 2: Call specialist agent
    let response;
    switch (routing.agent) {
      case "customer_analyst":
        response = await handleCustomerAnalyst(message, userId, conversationHistory);
        break;
      case "segments":
        response = await handleSegments(message, userId, conversationHistory);
        break;
      case "campaigns":
        response = await handleCampaigns(message, userId, conversationHistory);
        break;
      case "flows":
        response = await handleFlows(message, userId, conversationHistory);
        break;
      case "emails":
        response = await handleEmails(message, userId, conversationHistory);
        break;
      case "orchestrator":
        response = await handleOrchestrator(message, userId, conversationHistory);
        break;
      default:
        response = "I'm not sure how to help with that.";
    }

    return NextResponse.json({
      response,
      agent: routing.agent,
      reasoning: routing.reasoning
    });

  } catch (error) {
    console.error("Agent error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// Router Agent - Classifies intent and routes to specialist
async function routeToAgent(
  message: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<RoutingResult> {
  const routingModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp"
  });

  const routingPrompt = buildRoutingPrompt(message, conversationHistory);
  const result = await routingModel.generateContent(routingPrompt);
  const text = result.response.text();
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse routing response");
  }
  
  return JSON.parse(jsonMatch[0]);
}

function buildRoutingPrompt(
  message: string,
  conversationHistory?: Array<{ role: string; content: string }>
): string {
  const historyContext = conversationHistory && conversationHistory.length > 0
    ? `\n\nConversation History:\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`
    : '';

  return `You are a routing agent for a marketing automation platform. Analyze the user's request and determine which specialist agent should handle it.

User Request: "${message}"${historyContext}

Available Agents:
- customer_analyst: Questions about customer data, analytics, queries about customer behavior
- segments: Creating or modifying customer segments
- campaigns: Creating one-time email campaigns
- flows: Building automated email sequences (multi-step)
- emails: Writing email content only (subject lines, body copy)
- orchestrator: Complex multi-step tasks requiring multiple agents

Rules:
1. customer_analyst: Use for data queries ("Show me...", "How many...", "Who are...")
2. segments: Use for segment creation ("Create a segment...", "Build a group...")
3. campaigns: Use for single campaign creation ("Send an email...", "Create a campaign...")
4. flows: Use for automation sequences ("Build a flow...", "Create a welcome series...")
5. emails: Use ONLY for writing content ("Write an email...", "Generate subject lines...")
6. orchestrator: Use for complex tasks requiring multiple steps

Examples:
- "Show me customers from Texas" → customer_analyst
- "Create a segment for VIP customers" → segments
- "Send a Black Friday campaign" → orchestrator (needs segment + campaign + email)
- "Build a welcome flow" → flows
- "Write a win-back email" → emails
- "Find high-value customers and create a campaign for them" → orchestrator

Respond with JSON only:
{
  "agent": "customer_analyst" | "segments" | "campaigns" | "flows" | "emails" | "orchestrator",
  "reasoning": "Brief explanation of why you chose this agent"
}`;
}

// Specialist agent handlers - Call dedicated agent endpoints
async function handleCustomerAnalyst(
  message: string,
  userId: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> {
  return await callAgentEndpoint('/api/agents/customer-analyst', message, userId, conversationHistory);
}

async function handleSegments(
  message: string,
  userId: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> {
  return await callAgentEndpoint('/api/agents/segments', message, userId, conversationHistory);
}

async function handleCampaigns(
  message: string,
  userId: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> {
  return await callAgentEndpoint('/api/agents/campaigns', message, userId, conversationHistory);
}

async function handleFlows(
  message: string,
  userId: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> {
  return await callAgentEndpoint('/api/agents/flows', message, userId, conversationHistory);
}

async function handleEmails(
  message: string,
  userId: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> {
  return await callAgentEndpoint('/api/agents/emails', message, userId, conversationHistory);
}

async function handleOrchestrator(
  message: string,
  userId: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> {
  return await callAgentEndpoint('/api/agents/orchestrator', message, userId, conversationHistory);
}

// Helper function to call agent endpoints
async function callAgentEndpoint(
  endpoint: string,
  message: string,
  userId: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, userId, conversationHistory })
    });

    if (!response.ok) {
      throw new Error(`Agent endpoint failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    return `I encountered an error processing your request. Please try again.`;
  }
}
