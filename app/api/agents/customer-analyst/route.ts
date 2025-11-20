import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { message, userId, conversationHistory } = await request.json();

    // System prompt for Customer Analyst Agent
    const systemPrompt = `You are a customer data analyst. Answer questions about customer data.

Available actions you can take:
1. query_customers - Filter customers by segment, state, churnRisk, minLtv, maxLtv
2. get_customer_stats - Get overall statistics
3. get_segment_distribution - Get breakdown by RFM segment
4. get_customer_insights - Get actionable insights
5. search_customers - Search by name or email

When you need data, respond with JSON in this format:
{
  "action": "query_customers" | "get_customer_stats" | "get_segment_distribution" | "get_customer_insights" | "search_customers",
  "parameters": { /* action-specific parameters */ },
  "reasoning": "Why you're taking this action"
}

After receiving data, provide a conversational response with insights.

Guidelines:
- Format numbers nicely (use commas, dollar signs)
- Provide context and comparisons
- Be conversational and insightful
- If asked about campaign/flow performance, redirect to Insights page`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt
    });

    // Build conversation history
    const history = conversationHistory?.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    })) || [];

    const chat = model.startChat({ history });

    // Send message
    let result = await chat.sendMessage(message);
    let responseText = result.response.text();

    // Check if response contains an action request
    const jsonMatch = responseText.match(/\{[\s\S]*"action"[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        const actionRequest = JSON.parse(jsonMatch[0]);
        const data = await executeAction(actionRequest, userId);
        
        // Send data back to model for final response
        const dataMessage = `Here's the data you requested:\n\n${JSON.stringify(data, null, 2)}\n\nNow provide a conversational response to the user.`;
        result = await chat.sendMessage(dataMessage);
        responseText = result.response.text();
      } catch (error) {
        console.error('Action execution error:', error);
      }
    }

    return NextResponse.json({
      response: responseText
    });

  } catch (error) {
    console.error("Customer analyst agent error:", error);
    return NextResponse.json(
      { error: "Failed to process customer analyst request" },
      { status: 500 }
    );
  }
}

async function executeAction(actionRequest: any, userId: string) {
  const { action, parameters } = actionRequest;

  try {
    switch (action) {
      case "query_customers":
        const customers = await fetchQuery(api.customers.listWithFilters, {
          userId: userId as any,
          segment: parameters?.segment,
          state: parameters?.state,
          churnRisk: parameters?.churnRisk,
          minLtv: parameters?.minLtv,
          maxLtv: parameters?.maxLtv,
          limit: parameters?.limit || 50
        });
        
        return {
          total: customers.total,
          customers: customers.customers.slice(0, 10).map((c: any) => ({
            name: `${c.firstName} ${c.lastName}`,
            email: c.email,
            state: c.state,
            totalSpent: c.totalSpent,
            totalOrders: c.totalOrders,
            rfmSegment: c.rfmSegment,
            daysSinceLastOrder: c.daysSinceLastOrder
          }))
        };

      case "get_customer_stats":
        return await fetchQuery(api.customers.getStats, {
          userId: userId as any
        });

      case "get_segment_distribution":
        const distribution = await fetchQuery(api.customers.getSegmentDistribution, {
          userId: userId as any
        });
        return { distribution };

      case "get_customer_insights":
        return await fetchQuery(api.customers.getInsights, {
          userId: userId as any
        });

      case "search_customers":
        const searchResults = await fetchQuery(api.customers.search, {
          searchTerm: parameters?.searchTerm || "",
          limit: parameters?.limit || 50
        });
        
        return {
          count: searchResults.length,
          customers: searchResults.slice(0, 10).map((c: any) => ({
            name: `${c.firstName} ${c.lastName}`,
            email: c.email,
            totalSpent: c.totalSpent,
            totalOrders: c.totalOrders
          }))
        };

      default:
        return { error: `Unknown action: ${action}` };
    }
  } catch (error: any) {
    console.error(`Error executing ${action}:`, error);
    return { error: error.message || "Action execution failed" };
  }
}
