import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { message, userId, conversationHistory } = await request.json();

    // Define tools for Emails Agent
    // @ts-ignore - Gemini SDK types are overly strict
    const tools = [{
      functionDeclarations: [
        {
          name: "generate_email_content",
          description: "Generate complete email content including subject line and body",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              emailType: {
                type: SchemaType.STRING,
                description: "Type of email: promotional, welcome, winback, transactional, nurture"
              },
              audience: {
                type: SchemaType.STRING,
                description: "Target audience description (e.g., 'VIP customers', 'new subscribers')"
              },
              tone: {
                type: SchemaType.STRING,
                description: "Email tone: friendly, professional, urgent, casual"
              },
              includeDiscount: {
                type: SchemaType.BOOLEAN,
                description: "Whether to include a discount offer"
              },
              discountAmount: {
                type: SchemaType.STRING,
                description: "Discount amount if applicable (e.g., '20%', '$50')"
              },
              keyMessage: {
                type: SchemaType.STRING,
                description: "Main message or value proposition"
              }
            },
            required: ["emailType", "audience"]
          }
        },
        {
          name: "generate_subject_lines",
          description: "Generate multiple subject line options for A/B testing",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              campaignType: {
                type: SchemaType.STRING,
                description: "Type of campaign (e.g., 'Black Friday sale', 'product launch')"
              },
              count: {
                type: SchemaType.NUMBER,
                description: "Number of subject lines to generate (default: 5)"
              },
              includeEmoji: {
                type: SchemaType.BOOLEAN,
                description: "Whether to include emoji in some options"
              }
            },
            required: ["campaignType"]
          }
        },
        {
          name: "improve_email_content",
          description: "Improve existing email content with specific enhancements",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              originalContent: {
                type: SchemaType.STRING,
                description: "The original email content to improve"
              },
              improvements: {
                type: SchemaType.ARRAY,
                description: "List of improvements to make",
                items: {
                  type: SchemaType.STRING
                }
              }
            },
            required: ["originalContent", "improvements"]
          }
        }
      ]
    }];

    // System prompt for Emails Agent
    const systemPrompt = `You are an expert email copywriter specializing in e-commerce marketing. Write compelling email content that drives engagement and conversions.

Email Writing Guidelines:
- Keep subject lines under 60 characters
- Use personalization variables: {{firstName}}, {{totalSpent}}, {{lastOrderDate}}
- Include clear CTA (Call-to-Action)
- Write in brand-appropriate tone
- Use HTML formatting for structure

Email Structure:
1. Subject Line: Attention-grabbing, under 60 chars
2. Preheader: Complements subject (40-50 chars)
3. Greeting: "Hi {{firstName}},"
4. Hook: Grab attention in first sentence
5. Value Prop: What's in it for them?
6. CTA: Clear button/link
7. Signature: Professional sign-off

Tone Guidelines:
- Promotional: Exciting, urgent, benefit-focused
- Welcome: Warm, helpful, onboarding-oriented
- Win-back: Apologetic, generous, incentive-heavy
- Transactional: Clear, informative, professional
- Nurture: Educational, value-driven, relationship-building

Subject Line Best Practices:
- Use questions (41% higher open rate)
- Include numbers ("5 ways to...", "Save 20%")
- Create urgency ("Today only", "Last chance")
- Personalize when possible
- Test with/without emoji

Always generate multiple options for subject lines so the user can choose.`;

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
        const response = await executeFunction(call);
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
    console.error("Emails agent error:", error);
    return NextResponse.json(
      { error: "Failed to process emails request" },
      { status: 500 }
    );
  }
}

async function executeFunction(call: any) {
  try {
    const contentModel = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp"
    });

    switch (call.name) {
      case "generate_email_content":
        const emailPrompt = `Generate a ${call.args.emailType} email for ${call.args.audience}.
Tone: ${call.args.tone || 'professional'}
${call.args.includeDiscount ? `Include discount: ${call.args.discountAmount}` : ''}
${call.args.keyMessage ? `Key message: ${call.args.keyMessage}` : ''}

Generate:
1. Subject line (under 60 chars)
2. Preheader text (40-50 chars)
3. Email body in HTML format with:
   - Personalized greeting
   - Engaging opening
   - Clear value proposition
   - Strong CTA button
   - Professional signature

Use personalization variables like {{firstName}}, {{totalSpent}} where appropriate.
Format as HTML with inline styles for email compatibility.`;

        const emailResult = await contentModel.generateContent(emailPrompt);
        const emailContent = emailResult.response.text();
        
        return {
          content: emailContent,
          type: call.args.emailType
        };

      case "generate_subject_lines":
        const count = call.args.count || 5;
        const subjectPrompt = `Generate ${count} compelling subject lines for a ${call.args.campaignType} email campaign.

Requirements:
- Each under 60 characters
- Mix of styles: question, urgency, benefit-focused, curiosity
${call.args.includeEmoji ? '- Include emoji in 2-3 options' : '- No emoji'}
- Optimized for high open rates

Format as numbered list.`;

        const subjectResult = await contentModel.generateContent(subjectPrompt);
        const subjectLines = subjectResult.response.text();
        
        return {
          subjectLines,
          count
        };

      case "improve_email_content":
        const improvements = call.args.improvements.join(', ');
        const improvePrompt = `Improve this email content with these enhancements: ${improvements}

Original content:
${call.args.originalContent}

Provide the improved version maintaining the same structure but applying the requested improvements.`;

        const improveResult = await contentModel.generateContent(improvePrompt);
        const improvedContent = improveResult.response.text();
        
        return {
          improvedContent,
          improvements: call.args.improvements
        };

      default:
        return { error: `Unknown function: ${call.name}` };
    }
  } catch (error: any) {
    console.error(`Error executing ${call.name}:`, error);
    return { error: error.message || "Function execution failed" };
  }
}
