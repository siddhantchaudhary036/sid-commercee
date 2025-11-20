import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Import agent handlers directly
import { handleCustomerAnalystRequest } from "../agents/customer-analyst/handler";
import { handleSegmentsRequest } from "../agents/segments/handler";
import { handleEmailsRequest } from "../agents/emails/handler";
import { handleCampaignsRequest } from "../agents/campaigns/handler";
import { handleOrchestratorRequest } from "../agents/orchestrator/handler";

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
    
    // Step 2: Call specialist agent directly
    let response: string;
    switch (routing.agent) {
      case "customer_analyst":
        response = await handleCustomerAnalystRequest(message, userId, conversationHistory);
        break;
      case "segments":
        response = await handleSegmentsRequest(message, userId, conversationHistory);
        break;
      case "campaigns":
        response = await handleCampaignsRequest(message, userId, conversationHistory);
        break;
      case "flows":
        response = "Flows agent coming soon! I'll help you build automated email sequences.\n\nFor now, you can:\n- Visit /flows to create flows manually\n- Use the visual flow editor\n\nThis will be fully automated soon.";
        break;
      case "emails":
        response = await handleEmailsRequest(message, userId, conversationHistory);
        break;
      case "orchestrator":
        response = await handleOrchestratorRequest(message, userId);
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
    model: "gemini-2.5-flash"
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
- customer_analyst: ONLY for data queries and analytics questions (no actions)
- segments: ONLY for creating/editing segments (no campaigns)
- campaigns: ONLY for creating campaigns (no segments)
- flows: ONLY for building automation sequences
- emails: ONLY for writing email content
- orchestrator: For ANY task involving MULTIPLE actions or BUSINESS GOALS

CRITICAL ROUTING RULES:

Use ORCHESTRATOR when the request:
- Mentions improving/increasing revenue, sales, or business metrics
- Wants to target AND take action (e.g., "target X customers and send campaign")
- Mentions creating campaigns for specific customer groups
- Includes words like: "improve", "increase", "drive", "boost", "re-engage", "win-back"
- Requires creating BOTH segment AND campaign
- Is a business goal, not just a data question

Use CUSTOMER_ANALYST only when:
- Pure data query with NO action needed
- Just wants to see/know information
- Examples: "Show me...", "How many...", "Who are...", "What is..."

Examples:
- "Show me customers from Texas" → customer_analyst (just viewing data)
- "Create a segment for VIP customers" → segments (only creating segment)
- "I want to improve revenue from high LTV customers" → orchestrator (business goal + action)
- "Target inactive customers with a campaign" → orchestrator (segment + campaign)
- "Send a Black Friday campaign to loyal customers" → orchestrator (needs segment + campaign + email)
- "Build a welcome flow" → flows (automation only)
- "Write a win-back email" → emails (content only)
- "Re-engage customers who haven't purchased" → orchestrator (business goal + action)
- "Increase sales from VIP customers" → orchestrator (business goal)
- "How many VIP customers do I have?" → customer_analyst (just data)

Respond with JSON only:
{
  "agent": "customer_analyst" | "segments" | "campaigns" | "flows" | "emails" | "orchestrator",
  "reasoning": "Brief explanation of why you chose this agent"
}`;
}
