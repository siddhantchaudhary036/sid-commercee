import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { message, userId, conversationHistory } = await request.json();

    // Define tools for Customer Analyst Agent
    // @ts-ignore - Gemini SDK types are overly strict
    const tools = [{
      functionDeclarations: [
        {
          name: "query_customers",
          description: "Query customers with filters and get matching results",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              segment: {
                type: SchemaType.STRING,
                description: "RFM segment filter: Champions, Loyal, Potential, At-Risk, Lost"
              },
              state: {
                type: SchemaType.STRING,
                description: "US state filter (e.g., 'California', 'Texas')"
              },
              churnRisk: {
                type: SchemaType.STRING,
                description: "Churn risk level: High, Medium, Low"
              },
              minLtv: {
                type: SchemaType.NUMBER,
                description: "Minimum customer lifetime value"
              },
              maxLtv: {
                type: SchemaType.NUMBER,
                description: "Maximum customer lifetime value"
              },
              limit: {
                type: SchemaType.NUMBER,
                description: "Maximum number of results to return (default: 50)"
              }
            }
          }
        },
        {
          name: "get_customer_stats",
          description: "Get overall customer statistics and metrics",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {}
          }
        },
        {
          name: "get_segment_distribution",
          description: "Get breakdown of customers by RFM segment with counts and revenue",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {}
          }
        },
        {
          name: "get_customer_insights",
          description: "Get actionable insights about customer behavior (churn risk, upsell opportunities, etc.)",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {}
          }
        },
        {
          name: "search_customers",
          description: "Search for specific customers by name or email",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              searchTerm: {
                type: SchemaType.STRING,
                description: "Name or email to search for"
              },
              limit: {
                type: SchemaType.NUMBER,
                description: "Maximum results (default: 50)"
              }
            },
            required: ["searchTerm"]
          }
        }
      ]
    }];

    // System prompt for Customer Analyst Agent
    const systemPrompt = `You are a customer data analyst. Answer questions about customer data using the available functions.

Guidelines:
- Use query_customers for filtering ("Show me customers from Texas")
- Use get_customer_stats for overall statistics ("How many customers do I have?")
- Use get_segment_distribution for segment breakdowns ("How many VIP customers?")
- Use get_customer_insights for actionable insights ("Who is at risk of churning?")
- Use search_customers for finding specific people ("Find John Smith")
- Always provide context with your answers (totals, percentages, comparisons)
- Format numbers nicely (use commas, dollar signs)
- Be conversational and insightful

If asked about campaign/flow performance, say: "For performance analysis, please visit the Insights page where our AI analyzes campaign and flow effectiveness."

Example responses:
- "You have 1,234 customers with a total lifetime value of $456,789. Your average customer is worth $370."
- "I found 89 customers in California. The top 5 by spending are: [list]. Would you like to create a segment for them?"
- "You have 45 customers at high churn risk - they've ordered 5+ times but haven't purchased in 90+ days. I recommend creating a win-back campaign."`;

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
    console.error("Customer analyst agent error:", error);
    return NextResponse.json(
      { error: "Failed to process customer analyst request" },
      { status: 500 }
    );
  }
}

async function executeFunction(call: any, userId: string) {
  try {
    switch (call.name) {
      case "query_customers":
        const customers = await fetchQuery(api.customers.listWithFilters, {
          userId: userId as any,
          segment: call.args.segment,
          state: call.args.state,
          churnRisk: call.args.churnRisk,
          minLtv: call.args.minLtv,
          maxLtv: call.args.maxLtv,
          limit: call.args.limit || 50
        });
        
        return {
          total: customers.total,
          customers: customers.customers.map((c: any) => ({
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
        const stats = await fetchQuery(api.customers.getStats, {
          userId: userId as any
        });
        
        return stats;

      case "get_segment_distribution":
        const distribution = await fetchQuery(api.customers.getSegmentDistribution, {
          userId: userId as any
        });
        
        return { distribution };

      case "get_customer_insights":
        const insights = await fetchQuery(api.customers.getInsights, {
          userId: userId as any
        });
        
        return insights;

      case "search_customers":
        const searchResults = await fetchQuery(api.customers.search, {
          searchTerm: call.args.searchTerm,
          limit: call.args.limit || 50
        });
        
        return {
          count: searchResults.length,
          customers: searchResults.map((c: any) => ({
            name: `${c.firstName} ${c.lastName}`,
            email: c.email,
            totalSpent: c.totalSpent,
            totalOrders: c.totalOrders
          }))
        };

      default:
        return { error: `Unknown function: ${call.name}` };
    }
  } catch (error: any) {
    console.error(`Error executing ${call.name}:`, error);
    return { error: error.message || "Function execution failed" };
  }
}
