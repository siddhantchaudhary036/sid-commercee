import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { message, userId, conversationHistory } = await request.json();

    // Define tools for Campaigns Agent
    // @ts-ignore - Gemini SDK types are overly strict
    const tools = [{
      functionDeclarations: [
        {
          name: "create_campaign",
          description: "Create a new email campaign",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              name: {
                type: SchemaType.STRING,
                description: "Campaign name"
              },
              segmentId: {
                type: SchemaType.STRING,
                description: "Target segment ID (optional)"
              },
              subject: {
                type: SchemaType.STRING,
                description: "Email subject line"
              },
              content: {
                type: SchemaType.STRING,
                description: "Email HTML content"
              },
              description: {
                type: SchemaType.STRING,
                description: "Campaign description"
              }
            },
            required: ["name", "subject", "content"]
          }
        },
        {
          name: "list_campaigns",
          description: "List all campaigns, optionally filtered by status",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              status: {
                type: SchemaType.STRING,
                description: "Filter by status: draft, scheduled, sent"
              }
            }
          }
        },
        {
          name: "get_campaign_details",
          description: "Get full details of a specific campaign",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              campaignId: {
                type: SchemaType.STRING,
                description: "Campaign ID"
              }
            },
            required: ["campaignId"]
          }
        },
        {
          name: "list_segments",
          description: "List available segments for targeting",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {}
          }
        },
        {
          name: "get_campaign_stats",
          description: "Get overall campaign statistics",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {}
          }
        }
      ]
    }];

    // System prompt for Campaigns Agent
    const systemPrompt = `You are an email campaign specialist. Create and manage email campaigns.

Campaign Creation Workflow:
1. Identify target segment (ask user or suggest one)
2. Generate subject line (engaging, <60 chars)
3. Write email content OR select template
4. Create campaign as draft
5. Confirm with user before scheduling

Guidelines:
- Always create campaigns as "draft" first
- Mention segment size: "This will go to 234 customers"
- Subject lines should create urgency/curiosity
- Offer to preview before sending
- Suggest optimal send times (typically Tue-Thu, 10am-2pm)

Subject Line Best Practices:
- Use questions (41% higher open rate)
- Include numbers
- Keep under 60 characters
- Create urgency ("Today only", "Last chance")

When creating campaigns:
- Confirm the target audience
- Explain what the campaign will do
- Provide next steps (review, schedule, send)

If user wants to schedule or send immediately, explain they should do that from the campaigns page after reviewing.`;

    // Create model with tools
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      tools,
      systemInstruction: systemPrompt
    });

    // Build conversation history
    const history = conversationHistory?.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    })) || [];

    // Start chat
    const chat = model.startChat({ history });

    // Send message
    let result = await chat.sendMessage(message);

    // Handle function calls
    let iterationCount = 0;
    const maxIterations = 10;

    while (result.response.functionCalls() && iterationCount < maxIterations) {
      iterationCount++;
      const functionCalls = result.response.functionCalls();
      const functionResponses = [];

      for (const call of functionCalls) {
        console.log(`Executing function: ${call.name}`, call.args);
        const response = await executeFunction(call, userId);
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response
          }
        });
      }

      result = await chat.sendMessage(functionResponses);
    }

    return NextResponse.json({
      response: result.response.text()
    });

  } catch (error) {
    console.error("Campaigns agent error:", error);
    return NextResponse.json(
      { error: "Failed to process campaigns request" },
      { status: 500 }
    );
  }
}

async function executeFunction(call: any, userId: string) {
  try {
    switch (call.name) {
      case "create_campaign":
        const campaignId = await fetchMutation(api.campaigns.create, {
          userId: userId as any,
          name: call.args.name,
          subject: call.args.subject,
          content: call.args.content,
          description: call.args.description,
          segmentId: call.args.segmentId as any,
          aiGenerated: true,
          aiPrompt: call.args.name
        });
        
        // Get segment info if provided
        let segmentInfo = null;
        if (call.args.segmentId) {
          const segment = await fetchQuery(api.segments.getById, {
            id: call.args.segmentId as any
          });
          segmentInfo = {
            name: segment?.name,
            customerCount: segment?.customerCount
          };
        }
        
        return {
          success: true,
          campaignId,
          segmentInfo,
          message: `Campaign created successfully as draft${segmentInfo ? ` targeting ${segmentInfo.customerCount} customers` : ''}`
        };

      case "list_campaigns":
        const campaigns = await fetchQuery(api.campaigns.list, {
          userId: userId as any,
          status: call.args.status
        });
        
        return {
          campaigns: campaigns.map((c: any) => ({
            id: c._id,
            name: c.name,
            status: c.status,
            subject: c.subject,
            sentCount: c.sentCount,
            openRate: c.openRate,
            createdAt: c.createdAt
          }))
        };

      case "get_campaign_details":
        const campaign = await fetchQuery(api.campaigns.getById, {
          id: call.args.campaignId as any
        });
        
        if (!campaign) {
          return { error: "Campaign not found" };
        }
        
        return {
          id: campaign._id,
          name: campaign.name,
          status: campaign.status,
          subject: campaign.subject,
          content: campaign.content,
          segmentId: campaign.segmentId,
          sentCount: campaign.sentCount,
          openRate: campaign.openRate,
          clickRate: campaign.clickRate
        };

      case "list_segments":
        const segments = await fetchQuery(api.segments.list, {
          userId: userId as any
        });
        
        return {
          segments: segments.map((s: any) => ({
            id: s._id,
            name: s.name,
            customerCount: s.customerCount,
            description: s.description
          }))
        };

      case "get_campaign_stats":
        const stats = await fetchQuery(api.campaigns.getStats, {
          userId: userId as any
        });
        
        return stats;

      default:
        return { error: `Unknown function: ${call.name}` };
    }
  } catch (error: any) {
    console.error(`Error executing ${call.name}:`, error);
    return { error: error.message || "Function execution failed" };
  }
}
