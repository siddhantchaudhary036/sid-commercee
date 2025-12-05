import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

// Increase timeout for long-running workflows (flows can take 30+ seconds)
export const maxDuration = 60; // 60 seconds

// Import agent handlers directly
import { handleCustomerAnalystRequest } from "../agents/customer-analyst/handler";
import { handleSegmentsRequest } from "../agents/segments/handler";
import { handleEmailsRequest } from "../agents/emails/handler";
import { handleCampaignsRequest } from "../agents/campaigns/handler";
import { handleFlowsRequest } from "../agents/flows/handler";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Agent routing types
type AgentType = "customer_analyst" | "segments" | "campaigns" | "flows" | "emails";

interface AgentStep {
  agent: AgentType;
  instruction: string;
  extractData?: string[]; // Fields to extract from response for next agent
}

interface WorkflowPlan {
  steps: AgentStep[];
  reasoning: string;
}

export async function POST(request: Request) {
  try {
    const { message, userId, conversationHistory, stream } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: "Message and userId are required" },
        { status: 400 }
      );
    }

    // Step 1: Plan the workflow
    console.log('🚀 [ROUTER] Received message:', message);
    const workflow = await planWorkflow(message, conversationHistory);
    console.log('🎯 [ROUTER] Workflow plan:', JSON.stringify(workflow, null, 2));
    
    // Step 2: Execute workflow with streaming if requested
    if (stream) {
      return streamWorkflow(workflow, message, userId, conversationHistory);
    }
    
    // Non-streaming execution
    const response = await executeWorkflow(workflow, message, userId, conversationHistory);

    console.log('✅ [ROUTER] Workflow completed, response length:', response.length, 'chars');
    
    return NextResponse.json({
      response,
      workflow: workflow.steps.map(s => s.agent),
      reasoning: workflow.reasoning
    });

  } catch (error) {
    console.error("❌ [ROUTER] Agent error:", error);
    console.error("❌ [ROUTER] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: "Failed to process request",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Stream workflow execution with real-time updates
async function streamWorkflow(
  workflow: WorkflowPlan,
  originalMessage: string,
  userId: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<Response> {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const sharedContext: Record<string, any> = {};
        
        // Send initial plan
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'plan',
          reasoning: workflow.reasoning,
          steps: workflow.steps.map(s => s.agent)
        })}\n\n`));
        
        // Execute each step
        for (let i = 0; i < workflow.steps.length; i++) {
          const step = workflow.steps[i];
          const stepNum = i + 1;
          
          // Send step start
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'step_start',
            step: stepNum,
            total: workflow.steps.length,
            agent: step.agent
          })}\n\n`));
          
          // Build instruction with context
          const instruction = buildInstructionWithContext(step.instruction, sharedContext);
          
          // Execute agent
          try {
            const agentResponse = await callAgent(step.agent, instruction, userId, conversationHistory);
            
            // Extract data for next steps
            if (step.extractData && step.extractData.length > 0) {
              const extracted = await extractDataFromResponse(agentResponse, step.extractData);
              Object.assign(sharedContext, extracted);
            }
            
            // Send step complete with response
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'step_complete',
              step: stepNum,
              agent: step.agent,
              response: agentResponse
            })}\n\n`));
            
          } catch (error) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'step_error',
              step: stepNum,
              agent: step.agent,
              error: error instanceof Error ? error.message : 'Unknown error'
            })}\n\n`));
            break;
          }
        }
        
        // Send completion
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'complete',
          context: sharedContext
        })}\n\n`));
        
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Router Agent - Plans workflow with sequential agent calls
async function planWorkflow(
  message: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<WorkflowPlan> {
  const planningModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  });

  const planningPrompt = buildPlanningPrompt(message, conversationHistory);
  const result = await planningModel.generateContent(planningPrompt);
  const text = result.response.text();
  
  console.log('🔀 [ROUTER] Raw planning response:', text);
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse workflow plan");
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  console.log('🔀 [ROUTER] Parsed workflow:', JSON.stringify(parsed, null, 2));
  
  return parsed;
}

// Execute workflow steps sequentially, passing context between agents
async function executeWorkflow(
  workflow: WorkflowPlan,
  originalMessage: string,
  userId: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> {
  const executionLog: string[] = [];
  const sharedContext: Record<string, any> = {};
  
  executionLog.push(`🎯 **Workflow Plan**: ${workflow.reasoning}\n`);
  executionLog.push(`📋 **Steps**: ${workflow.steps.map(s => s.agent).join(' → ')}\n`);
  
  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    const stepNum = i + 1;
    
    console.log(`\n🔄 [ROUTER] Executing step ${stepNum}/${workflow.steps.length}: ${step.agent}`);
    executionLog.push(`\n---\n\n### Step ${stepNum}: ${step.agent.toUpperCase()}\n`);
    
    // Build instruction with shared context
    const instruction = buildInstructionWithContext(step.instruction, sharedContext);
    console.log(`📝 [ROUTER] Instruction: ${instruction}`);
    
    // Execute agent
    let agentResponse: string;
    try {
      agentResponse = await callAgent(step.agent, instruction, userId, conversationHistory);
      console.log(`✅ [ROUTER] Agent ${step.agent} completed`);
      
      // Extract data for next steps
      if (step.extractData && step.extractData.length > 0) {
        const extracted = await extractDataFromResponse(agentResponse, step.extractData);
        Object.assign(sharedContext, extracted);
        console.log(`📦 [ROUTER] Extracted data:`, extracted);
      }
      
      executionLog.push(agentResponse);
      
    } catch (error) {
      console.error(`❌ [ROUTER] Error in step ${stepNum}:`, error);
      executionLog.push(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      break;
    }
  }
  
  // Generate final summary
  const summary = await generateWorkflowSummary(workflow, executionLog, sharedContext);
  
  return summary;
}

// Call individual agent with instruction
async function callAgent(
  agent: AgentType,
  instruction: string,
  userId: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> {
  switch (agent) {
    case "customer_analyst":
      return await handleCustomerAnalystRequest(instruction, userId, conversationHistory);
    case "segments":
      return await handleSegmentsRequest(instruction, userId, conversationHistory);
    case "campaigns":
      return await handleCampaignsRequest(instruction, userId, conversationHistory);
    case "flows":
      return await handleFlowsRequest(instruction, userId, conversationHistory);
    case "emails":
      return await handleEmailsRequest(instruction, userId, conversationHistory);
    default:
      throw new Error(`Unknown agent: ${agent}`);
  }
}

// Build instruction with context from previous steps
function buildInstructionWithContext(instruction: string, context: Record<string, any>): string {
  let enrichedInstruction = instruction;
  
  // Replace placeholders with actual values
  for (const [key, value] of Object.entries(context)) {
    enrichedInstruction = enrichedInstruction.replace(`{{${key}}}`, String(value));
  }
  
  // Add context as additional information
  if (Object.keys(context).length > 0) {
    enrichedInstruction += `\n\nContext from previous steps:\n${JSON.stringify(context, null, 2)}`;
  }
  
  return enrichedInstruction;
}

// Extract specific data from agent response
async function extractDataFromResponse(
  response: string,
  fieldsToExtract: string[]
): Promise<Record<string, any>> {
  const extractionModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  });

  const extractionPrompt = `Extract the following information from this agent response:

Fields to extract: ${fieldsToExtract.join(', ')}

Agent response:
${response}

Return ONLY a JSON object with the extracted values. If a field is not found, use null.
Example: {"segmentId": "abc123", "segmentName": "VIP Customers", "customerCount": 150}`;

  const result = await extractionModel.generateContent(extractionPrompt);
  const text = result.response.text();
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {};
  }
  
  return JSON.parse(jsonMatch[0]);
}

// Generate final summary of workflow execution
async function generateWorkflowSummary(
  workflow: WorkflowPlan,
  executionLog: string[],
  context: Record<string, any>
): Promise<string> {
  const summaryModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  });

  const summaryPrompt = `Create a concise, user-friendly summary of this multi-step workflow execution.

Workflow: ${workflow.reasoning}
Steps executed: ${workflow.steps.map(s => s.agent).join(' → ')}

Execution details:
${executionLog.join('\n')}

Context data:
${JSON.stringify(context, null, 2)}

Create a summary that:
1. Explains what was accomplished
2. Shows key metrics (customer counts, IDs, etc.)
3. Provides next steps for the user
4. Is conversational and easy to understand
5. Uses markdown formatting for readability

Keep it concise but informative.`;

  const result = await summaryModel.generateContent(summaryPrompt);
  return result.response.text();
}

function buildPlanningPrompt(
  message: string,
  conversationHistory?: Array<{ role: string; content: string }>
): string {
  const historyContext = conversationHistory && conversationHistory.length > 0
    ? `\n\nConversation History:\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`
    : '';

  return `You are a workflow planning agent for a marketing automation platform. Analyze the user's request and create a sequential workflow plan.

User Request: "${message}"${historyContext}

Available Specialist Agents:
- customer_analyst: Query and analyze customer data
- segments: Create customer segments based on criteria
- emails: Write email content and subject lines
- campaigns: Create email campaigns
- flows: Build automation sequences

WORKFLOW PLANNING RULES:

1. SIMPLE REQUESTS (single agent):
   - "Show me VIP customers" → [customer_analyst]
   - "Create a segment for high spenders" → [segments]
   - "Write a welcome email" → [emails]
   - "Create a campaign" → [campaigns]

2. COMPLEX REQUESTS (multiple agents in sequence):
   - "Send campaign to VIP customers" → [customer_analyst, segments, emails, campaigns]
   - "Target inactive customers with win-back offer" → [customer_analyst, segments, emails, campaigns]
   - "Create campaign for high LTV customers" → [segments, emails, campaigns]
   - "Re-engage churned customers" → [customer_analyst, segments, emails, campaigns]

3. DATA FLOW BETWEEN AGENTS:
   - customer_analyst → provides customer insights
   - segments → creates segment, provides segmentId and customerCount
   - emails → generates email content (subject + body)
   - campaigns → uses segmentId and email content to create campaign

INSTRUCTION GUIDELINES:
- Be specific about what each agent should do
- Use {{placeholders}} for data from previous steps
- Extract necessary data (segmentId, customerCount, etc.) to pass forward

Examples:

Request: "Create a campaign for VIP customers"
Response:
{
  "steps": [
    {
      "agent": "segments",
      "instruction": "Create a segment for VIP customers with high lifetime value (LTV >= $500)",
      "extractData": ["segmentId", "segmentName", "customerCount"]
    },
    {
      "agent": "emails",
      "instruction": "Write a promotional email for VIP customers offering exclusive benefits",
      "extractData": ["subject", "emailBody"]
    },
    {
      "agent": "campaigns",
      "instruction": "Create a campaign using segment {{segmentId}} with subject '{{subject}}' and body '{{emailBody}}'",
      "extractData": ["campaignId"]
    }
  ],
  "reasoning": "Multi-step workflow: create segment → generate email → create campaign"
}

Request: "Show me customers from California"
Response:
{
  "steps": [
    {
      "agent": "customer_analyst",
      "instruction": "Query customers from California and provide insights",
      "extractData": []
    }
  ],
  "reasoning": "Simple data query, single agent sufficient"
}

Request: "Re-engage inactive customers"
Response:
{
  "steps": [
    {
      "agent": "customer_analyst",
      "instruction": "Analyze inactive customers (90+ days since last order) and provide insights",
      "extractData": ["inactiveCount"]
    },
    {
      "agent": "segments",
      "instruction": "Create a segment for inactive customers who haven't ordered in 90+ days",
      "extractData": ["segmentId", "segmentName", "customerCount"]
    },
    {
      "agent": "emails",
      "instruction": "Write a win-back email with a special offer to re-engage inactive customers",
      "extractData": ["subject", "emailBody"]
    },
    {
      "agent": "campaigns",
      "instruction": "Create a win-back campaign using segment {{segmentId}} with the generated email content",
      "extractData": ["campaignId"]
    }
  ],
  "reasoning": "Complex workflow: analyze → segment → email → campaign"
}

Respond with JSON only:
{
  "steps": [
    {
      "agent": "customer_analyst" | "segments" | "emails" | "campaigns" | "flows",
      "instruction": "Specific instruction for this agent",
      "extractData": ["field1", "field2"]
    }
  ],
  "reasoning": "Brief explanation of the workflow"
}`;
}
