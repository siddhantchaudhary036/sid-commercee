import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { message, userId, conversationHistory } = await request.json();

    // Define tools for Segments Agent
    // @ts-ignore - Gemini SDK types are overly strict
    const tools = [{
      functionDeclarations: [
        {
          name: "create_segment",
          description: "Create a new customer segment with filtering conditions",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              name: {
                type: SchemaType.STRING,
                description: "Descriptive segment name (e.g., 'High-Value Customers')"
              },
              description: {
                type: SchemaType.STRING,
                description: "Brief description of the segment purpose"
              },
              conditions: {
                type: SchemaType.ARRAY,
                description: "Array of filter conditions to match customers",
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    field: {
                      type: SchemaType.STRING,
                      description: "Customer field to filter on (e.g., 'totalSpent', 'state', 'rfmSegment')"
                    },
                    operator: {
                      type: SchemaType.STRING,
                      description: "Comparison operator: '=', '!=', '>', '<', '>=', '<=', 'contains', 'in'"
                    },
                    value: {
                      type: SchemaType.STRING,
                      description: "Value to compare against"
                    }
                  },
                  required: ["field", "operator", "value"]
                }
              }
            },
            required: ["name", "conditions"]
          }
        },
        {
          name: "get_segment_preview",
          description: "Preview how many customers match given conditions before creating segment",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              conditions: {
                type: SchemaType.ARRAY,
                description: "Array of filter conditions",
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    field: { type: SchemaType.STRING },
                    operator: { type: SchemaType.STRING },
                    value: { type: SchemaType.STRING }
                  }
                }
              }
            },
            required: ["conditions"]
          }
        },
        {
          name: "list_segments",
          description: "List all existing segments for the user",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {}
          }
        },
        {
          name: "get_segment_details",
          description: "Get full details of a specific segment including customer list",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              segmentId: {
                type: SchemaType.STRING,
                description: "The segment ID"
              }
            },
            required: ["segmentId"]
          }
        }
      ]
    }];

    // System prompt for Segments Agent
    const systemPrompt = `You are a customer segmentation expert. Create segments based on user requirements.

Guidelines:
- Always preview segments before creating (use get_segment_preview)
- Suggest segment names that are descriptive and actionable
- Explain the conditions in plain English
- Recommend minimum segment size (>20 customers for campaigns)
- Multiple conditions use AND logic (all must match)

Available customer fields:
- Demographics: state, city, gender, birthday
- Purchase: totalSpent, totalOrders, averageOrderValue, daysSinceLastOrder
- Engagement: emailOpensCount, emailClicksCount, emailOptIn
- Segmentation: rfmSegment (Champions/Loyal/Potential/At-Risk/Lost), churnRisk, loyaltyTier, customerLifetimeValue

Common operators:
- Numeric fields: >, <, >=, <=, =
- Text fields: =, !=, contains, startsWith, endsWith
- Arrays: in, contains

Example workflow:
User: "Create a segment for high-value customers"
You:
1. Call get_segment_preview with conditions: [{field: "totalSpent", operator: ">", value: "1000"}]
2. Report: "Found 234 customers who have spent over $1,000"
3. Call create_segment with name "High-Value Customers" and description
4. Respond: "I've created the 'High-Value Customers' segment with 234 customers. You can now use this segment for targeted campaigns."

Be conversational and helpful. If the user's request is unclear, ask clarifying questions.`;

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
    console.error("Segments agent error:", error);
    return NextResponse.json(
      { error: "Failed to process segments request" },
      { status: 500 }
    );
  }
}

async function executeFunction(call: any, userId: string) {
  try {
    switch (call.name) {
      case "create_segment":
        const segmentId = await fetchMutation(api.segments.create, {
          userId: userId as any,
          name: call.args.name,
          description: call.args.description || "",
          conditions: call.args.conditions,
          aiGenerated: true,
          aiPrompt: call.args.name
        });
        
        // Get the created segment details
        const segment = await fetchQuery(api.segments.getById, {
          id: segmentId as any
        });
        
        return {
          success: true,
          segmentId,
          customerCount: segment?.customerCount || 0,
          message: `Segment created successfully with ${segment?.customerCount || 0} customers`
        };

      case "get_segment_preview":
        const preview = await fetchQuery(api.segments.previewSegment, {
          userId: userId as any,
          conditions: call.args.conditions
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
          id: call.args.segmentId as any
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
        return { error: `Unknown function: ${call.name}` };
    }
  } catch (error: any) {
    console.error(`Error executing ${call.name}:`, error);
    return { error: error.message || "Function execution failed" };
  }
}
