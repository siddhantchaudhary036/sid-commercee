import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function handleSegmentsRequest(
  message: string,
  userId: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> {
  try {

    // System prompt for Segments Agent
    const systemPrompt = `You are a customer segmentation expert. Create segments based on user requirements.

Available actions:
1. create_segment - Create new segment with name, description, and conditions
2. get_segment_preview - Preview customer count before creating
3. list_segments - List all existing segments
4. get_segment_details - Get full segment information

CRITICAL: When you need to take an action, respond ONLY with JSON (no additional text):
{
  "action": "create_segment" | "get_segment_preview" | "list_segments" | "get_segment_details",
  "parameters": { /* action-specific parameters */ },
  "reasoning": "Why you're taking this action"
}

After the action is executed, you'll receive the results and should provide a conversational response WITHOUT any JSON.

Segment conditions format:
[
  { "field": "totalSpent", "operator": ">", "value": "1000" },
  { "field": "state", "operator": "=", "value": "California" }
]

Available fields: totalSpent, totalOrders, averageOrderValue, daysSinceLastOrder, state, city, rfmSegment, customerLifetimeValue, emailOptIn

Available operators: =, !=, >, <, >=, <=, contains, in

Guidelines:
- Always preview segments before creating (unless user explicitly confirms)
- Suggest descriptive names
- Explain conditions in plain English
- Recommend minimum 20 customers for campaigns
- Multiple conditions use AND logic
- When user says "make a segment" or "create a segment", go ahead and create it directly`;

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
        
        // Remove the JSON from the response
        responseText = responseText.replace(jsonMatch[0], '').trim();
        
        // If there's no text left (agent only returned JSON), ask for a conversational response
        if (!responseText || responseText.length < 20) {
          const dataMessage = `Action completed successfully. Result:\n\n${JSON.stringify(data, null, 2)}\n\nProvide a brief, conversational response to the user about what was created/done. Do NOT include any JSON.`;
          result = await chat.sendMessage(dataMessage);
          responseText = result.response.text();
        } else {
          // Agent provided text along with JSON, just use the text part
          responseText = responseText.trim();
        }
      } catch (error) {
        console.error('Action execution error:', error);
        return "I tried to create the segment but encountered an error. Please try again.";
      }
    }

    return responseText;

  } catch (error) {
    console.error("Segments agent error:", error);
    return "Sorry, I encountered an error processing your segments request. Please try again.";
  }
}

async function executeAction(actionRequest: any, userId: string) {
  const { action, parameters } = actionRequest;

  try {
    switch (action) {
      case "create_segment":
        const segmentId = await fetchMutation(api.segments.create, {
          userId: userId as any,
          name: parameters.name,
          description: parameters.description || "",
          conditions: parameters.conditions,
          aiGenerated: true,
          aiPrompt: parameters.name
        });
        
        const segment = await fetchQuery(api.segments.getById, {
          id: segmentId as any
        });
        
        return {
          success: true,
          segmentId,
          customerCount: segment?.customerCount || 0,
          message: `Segment created with ${segment?.customerCount || 0} customers`
        };

      case "get_segment_preview":
        const preview = await fetchQuery(api.segments.previewSegment, {
          userId: userId as any,
          conditions: parameters.conditions
        });
        
        return {
          matchCount: preview.length,
          sampleCustomers: preview.slice(0, 5).map((c: any) => ({
            name: `${c.firstName} ${c.lastName}`,
            email: c.email,
            totalSpent: c.totalSpent,
            totalOrders: c.totalOrders
          }))
        };

      case "list_segments":
        const segments = await fetchQuery(api.segments.list, {
          userId: userId as any
        });
        
        return {
          segments: segments.map((s: any) => ({
            id: s._id,
            name: s.name,
            description: s.description,
            customerCount: s.customerCount,
            aiGenerated: s.aiGenerated
          }))
        };

      case "get_segment_details":
        const segmentDetails = await fetchQuery(api.segments.getById, {
          id: parameters.segmentId as any
        });
        
        if (!segmentDetails) {
          return { error: "Segment not found" };
        }
        
        return {
          id: segmentDetails._id,
          name: segmentDetails.name,
          description: segmentDetails.description,
          customerCount: segmentDetails.customerCount,
          conditions: segmentDetails.conditions
        };

      default:
        return { error: `Unknown action: ${action}` };
    }
  } catch (error: any) {
    console.error(`Error executing ${action}:`, error);
    return { error: error.message || "Action execution failed" };
  }
}
