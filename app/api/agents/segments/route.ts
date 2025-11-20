import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { message, userId, conversationHistory } = await request.json();

    // System prompt for Segments Agent
    const systemPrompt = `You are a customer segmentation expert. Create segments based on user requirements.

Available actions:
1. create_segment - Create new segment with name, description, and conditions
2. get_segment_preview - Preview customer count before creating
3. list_segments - List all existing segments
4. get_segment_details - Get full segment information

When you need to take an action, respond with JSON:
{
  "action": "create_segment" | "get_segment_preview" | "list_segments" | "get_segment_details",
  "parameters": { /* action-specific parameters */ },
  "reasoning": "Why you're taking this action"
}

Segment conditions format:
[
  { "field": "totalSpent", "operator": ">", "value": 1000 },
  { "field": "state", "operator": "=", "value": "California" }
]

AVAILABLE CUSTOMER FIELDS:

Identity:
- email (string) - Customer email address
- firstName (string) - First name
- lastName (string) - Last name

Location:
- state (string) - State code (e.g., "CA", "TX", "NY", "FL", "IL")
- city (string) - City name
- zipCode (string) - ZIP code

Purchase Metrics:
- totalSpent (number) - Total amount spent by customer
- totalOrders (number) - Number of orders placed
- averageOrderValue (number) - Average order value
- daysSinceLastOrder (number) - Days since last purchase
- lastOrderAmount (number) - Amount of most recent order

RFM Segmentation:
- recencyScore (number 1-5) - How recently they purchased (5=most recent)
- frequencyScore (number 1-5) - How often they purchase (5=most frequent)
- monetaryScore (number 1-5) - How much they spend (5=highest)
- rfmSegment (string) - RFM category: "Champions", "Loyal", "Potential", "At-Risk", "Lost"
- customerLifetimeValue (number) - Predicted lifetime value

Engagement:
- emailOptIn (boolean) - Opted in to email marketing
- smsOptIn (boolean) - Opted in to SMS marketing
- emailOpensCount (number) - Total email opens
- emailClicksCount (number) - Total email clicks
- marketingConsent (boolean) - General marketing consent

Demographics:
- gender (string) - Gender
- languagePreference (string) - Preferred language code (e.g., "en", "es")

Available operators:
- For strings: =, !=, contains, startsWith, endsWith
- For numbers: =, !=, >, <, >=, <=
- For booleans: =
- For enums: =, !=

IMPORTANT NOTES:
- Use "state" field with 2-letter state codes (e.g., "CA", "TX", "NY", "FL", "IL")
- For numeric values, do NOT use quotes (e.g., 1000 not "1000")
- For boolean values, use true/false (not "true"/"false")
- For string values, use quotes (e.g., "CA", "Champions")
- Multiple conditions use AND logic
- Always preview segments before creating to verify match count

Guidelines:
- Always preview segments before creating
- Suggest descriptive names based on the criteria
- Explain conditions in plain English
- Recommend minimum 20 customers for effective campaigns
- Consider using RFM segments for behavioral targeting
- Combine location + spending for geo-targeted campaigns
- Use engagement metrics to identify active vs inactive customers

EXAMPLE SEGMENTS:

1. VIP Customers:
   [{ "field": "customerLifetimeValue", "operator": ">", "value": 500 }]

2. At-Risk Customers:
   [
     { "field": "daysSinceLastOrder", "operator": ">", "value": 90 },
     { "field": "totalOrders", "operator": ">", "value": 3 }
   ]

3. High-Value California:
   [
     { "field": "state", "operator": "=", "value": "CA" },
     { "field": "totalSpent", "operator": ">", "value": 500 }
   ]

4. Champions (Best Customers):
   [{ "field": "rfmSegment", "operator": "=", "value": "Champions" }]

5. Engaged Email Subscribers:
   [
     { "field": "emailOptIn", "operator": "=", "value": true },
     { "field": "emailOpensCount", "operator": ">", "value": 10 }
   ]

6. New Customers:
   [{ "field": "totalOrders", "operator": "<=", "value": 1 }]

7. Frequent Buyers:
   [
     { "field": "totalOrders", "operator": ">=", "value": 10 },
     { "field": "daysSinceLastOrder", "operator": "<", "value": 60 }
   ]`;

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

    return NextResponse.json({
      response: responseText
    });

  } catch (error) {
    console.error("Segments agent error:", error);
    return NextResponse.json(
      { error: "Failed to process segments request" },
      { status: 500 }
    );
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
