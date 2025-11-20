import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function handleCampaignsRequest(
  message: string,
  userId: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    // Fetch product data for context
    const topProducts = await fetchQuery(api.products.getTopByRevenue, {
      userId: userId as any,
      limit: 3,
    });
    
    const productStats = await fetchQuery(api.products.getStats, {
      userId: userId as any,
    });

    const productContext = topProducts.length > 0 ? `
PRODUCT CONTEXT:
- Best Seller: ${productStats.topProduct?.name || 'N/A'} ($${productStats.topProduct?.revenue.toLocaleString() || 0} revenue)
- Top Products: ${topProducts.map((p: any) => `${p.name} ($${p.price})`).join(', ')}

When user mentions products in campaigns, reference these top products.
` : '';

    // System prompt for Campaigns Agent
    const systemPrompt = `You are an email campaign specialist. Create and manage email campaigns.

${productContext}

Available actions:
1. create_campaign - Create new campaign (draft status)
2. list_campaigns - List all campaigns with optional status filter
3. get_campaign_details - Get full campaign information
4. list_segments - Show available segments for targeting
5. get_campaign_stats - Overall campaign statistics

When you need to take an action, respond with JSON:
{
  "action": "create_campaign" | "list_campaigns" | "get_campaign_details" | "list_segments" | "get_campaign_stats",
  "parameters": {
    "name": "Campaign name",
    "segmentId": "segment ID",
    "subject": "Email subject",
    "content": "Email HTML content",
    "description": "Campaign description"
  },
  "reasoning": "Why you're taking this action"
}

Campaign Creation Workflow:
1. Identify target segment (ask user or suggest one)
2. Generate subject line (engaging, <60 chars)
3. Write email content OR select template
4. Create campaign as draft
5. Confirm with user before scheduling

Guidelines:
- Always create campaigns as "draft" first
- Mention segment size
- Subject lines should create urgency/curiosity
- Offer to preview before sending
- Suggest optimal send times (Tue-Thu, 10am-2pm)

If user wants to schedule/send, explain they should do that from campaigns page after reviewing.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt
    });

    const history = conversationHistory?.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    })) || [];

    const chat = model.startChat({ history });
    let result = await chat.sendMessage(message);
    let responseText = result.response.text();

    // Check for action request
    const jsonMatch = responseText.match(/\{[\s\S]*"action"[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        const actionRequest = JSON.parse(jsonMatch[0]);
        const data = await executeAction(actionRequest, userId);
        
        const dataMessage = `Here's the result:\n\n${JSON.stringify(data, null, 2)}\n\nNow provide a conversational response to the user.`;
        result = await chat.sendMessage(dataMessage);
        responseText = result.response.text();
      } catch (error) {
        console.error('Action execution error:', error);
      }
    }

    return responseText;

  } catch (error) {
    console.error("Campaigns agent error:", error);
    return "Sorry, I encountered an error processing your campaigns request. Please try again.";
  }
}

async function executeAction(actionRequest: any, userId: string) {
  const { action, parameters } = actionRequest;

  try {
    switch (action) {
      case "create_campaign":
        const campaignId = await fetchMutation(api.campaigns.create, {
          userId: userId as any,
          name: parameters.name,
          subject: parameters.subject,
          content: parameters.content,
          description: parameters.description,
          segmentId: parameters.segmentId as any,
          aiGenerated: true,
          aiPrompt: parameters.name
        });
        
        let segmentInfo = null;
        if (parameters.segmentId) {
          const segment = await fetchQuery(api.segments.getById, {
            id: parameters.segmentId as any
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
          message: `Campaign created as draft${segmentInfo ? ` targeting ${segmentInfo.customerCount} customers` : ''}`
        };

      case "list_campaigns":
        const campaigns = await fetchQuery(api.campaigns.list, {
          userId: userId as any,
          status: parameters?.status
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
          id: parameters.campaignId as any
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
        return await fetchQuery(api.campaigns.getStats, {
          userId: userId as any
        });

      default:
        return { error: `Unknown action: ${action}` };
    }
  } catch (error: any) {
    console.error(`Error executing ${action}:`, error);
    return { error: error.message || "Action execution failed" };
  }
}
