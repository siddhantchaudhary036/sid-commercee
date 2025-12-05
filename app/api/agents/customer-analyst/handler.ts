import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function handleCustomerAnalystRequest(
  message: string,
  userId: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> {
  const systemPrompt = `You are a customer data analyst. Answer questions about customer data with clear explanations.

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

CRITICAL: When discussing customer segments or risk levels, ALWAYS EXPLAIN WHY:

Churn Risk Definitions:
- HIGH RISK: Customers who haven't ordered in 90+ days AND have 5+ previous orders
  → Why it matters: These are valuable customers (proven buyers) who are becoming inactive
- MEDIUM RISK: Customers who haven't ordered in 60-90 days
  → Why it matters: Early warning signs of disengagement
- LOW RISK: Customers who ordered within the last 60 days
  → Why it matters: Recently active and engaged

RFM Segments Explained:
- Champions: High recency, frequency, and monetary scores (5,5,5 or similar)
  → Best customers who buy often, recently, and spend a lot
- Loyal: High frequency and monetary, but may not be super recent
  → Regular customers who consistently purchase
- At-Risk: Previously good customers showing declining engagement
  → Used to buy frequently but haven't purchased recently
- Potential: New or occasional customers with growth opportunity
  → Haven't established consistent buying patterns yet
- Lost: Haven't purchased in a very long time
  → Likely churned, need aggressive win-back

Guidelines:
- ALWAYS explain WHY a customer is in a certain category
- Include the specific criteria (e.g., "90+ days inactive with 5+ orders")
- Explain what the metrics mean for the business
- Format numbers nicely (use commas, dollar signs)
- Provide context and comparisons
- Be conversational and insightful
- If asked about campaign/flow performance, redirect to Insights page

Example good response:
"I found 150 high-risk customers. These are customers who haven't ordered in 90+ days but have made 5 or more purchases in the past. They're considered high-risk because they've proven they're willing to buy from you, but something has caused them to stop. Their average lifetime value is $850, so re-engaging them could have significant revenue impact."`;

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

  // Check if response contains an action request
  const jsonMatch = responseText.match(/\{[\s\S]*"action"[\s\S]*\}/);
  
  if (jsonMatch) {
    try {
      const actionRequest = JSON.parse(jsonMatch[0]);
      const data = await executeAction(actionRequest, userId);
      
      const dataMessage = `Here's the data you requested:\n\n${JSON.stringify(data, null, 2)}\n\nNow provide a conversational response to the user.`;
      result = await chat.sendMessage(dataMessage);
      responseText = result.response.text();
    } catch (error) {
      console.error('Action execution error:', error);
    }
  }

  return responseText;
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
        
        // Calculate aggregate metrics for context
        const avgLtv = customers.customers.length > 0
          ? customers.customers.reduce((sum: number, c: any) => sum + (c.totalSpent || 0), 0) / customers.customers.length
          : 0;
        
        const avgOrders = customers.customers.length > 0
          ? customers.customers.reduce((sum: number, c: any) => sum + (c.totalOrders || 0), 0) / customers.customers.length
          : 0;
        
        const avgDaysSinceOrder = customers.customers.length > 0
          ? customers.customers.reduce((sum: number, c: any) => sum + (c.daysSinceLastOrder || 0), 0) / customers.customers.length
          : 0;
        
        return {
          total: customers.total,
          filters: {
            segment: parameters?.segment,
            state: parameters?.state,
            churnRisk: parameters?.churnRisk,
            minLtv: parameters?.minLtv,
            maxLtv: parameters?.maxLtv
          },
          aggregates: {
            averageLifetimeValue: Math.round(avgLtv),
            averageOrders: Math.round(avgOrders * 10) / 10,
            averageDaysSinceLastOrder: Math.round(avgDaysSinceOrder)
          },
          customers: customers.customers.slice(0, 10).map((c: any) => ({
            name: `${c.firstName} ${c.lastName}`,
            email: c.email,
            state: c.state,
            totalSpent: c.totalSpent,
            totalOrders: c.totalOrders,
            rfmSegment: c.rfmSegment,
            daysSinceLastOrder: c.daysSinceLastOrder,
            customerLifetimeValue: c.customerLifetimeValue
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
        const insights = await fetchQuery(api.customers.getInsights, {
          userId: userId as any
        });
        
        // Add explanations to insights
        return {
          ...insights,
          explanations: {
            highChurnRisk: "These customers haven't ordered in 90+ days but have 5+ previous orders. They're valuable customers showing signs of disengagement.",
            highValueLowEngagement: "Customers with high lifetime value but low recent activity. They've spent a lot historically but may be at risk of churning.",
            newCustomers: "Customers who made their first purchase recently. Focus on converting them into repeat buyers.",
            champions: "Your best customers - they buy frequently, recently, and spend the most. Reward and retain them.",
            atRisk: "Previously good customers who are becoming less engaged. Act now before they churn completely."
          }
        };

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
