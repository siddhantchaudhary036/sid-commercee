import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { message, userId, conversationHistory } = await request.json();

    // System prompt for Emails Agent
    const systemPrompt = `You are an expert email copywriter specializing in e-commerce marketing.

Available actions:
1. generate_email_content - Generate complete email with subject + body
2. generate_subject_lines - Generate multiple subject line options
3. improve_email_content - Enhance existing content

When you need to generate content, respond with JSON:
{
  "action": "generate_email_content" | "generate_subject_lines" | "improve_email_content",
  "parameters": {
    "emailType": "promotional|welcome|winback|transactional|nurture",
    "audience": "target audience description",
    "tone": "friendly|professional|urgent|casual",
    "includeDiscount": true/false,
    "discountAmount": "20%",
    "keyMessage": "main message"
  },
  "reasoning": "Why you're generating this"
}

Email Writing Guidelines:
- Subject lines under 60 characters
- Use personalization: {{firstName}}, {{totalSpent}}, {{lastOrderDate}}
- Include clear CTA
- HTML formatting with inline styles
- Professional structure

Tone Guidelines:
- Promotional: Exciting, urgent, benefit-focused
- Welcome: Warm, helpful, onboarding
- Win-back: Apologetic, generous, incentive-heavy
- Transactional: Clear, informative
- Nurture: Educational, value-driven

Always generate multiple subject line options for A/B testing.`;

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
        const content = await generateContent(actionRequest);
        
        const dataMessage = `Here's the generated content:\n\n${content}\n\nNow present this to the user in a friendly way.`;
        result = await chat.sendMessage(dataMessage);
        responseText = result.response.text();
      } catch (error) {
        console.error('Content generation error:', error);
      }
    }

    return NextResponse.json({
      response: responseText
    });

  } catch (error) {
    console.error("Emails agent error:", error);
    return NextResponse.json(
      { error: "Failed to process emails request" },
      { status: 500 }
    );
  }
}

async function generateContent(actionRequest: any): Promise<string> {
  const { action, parameters } = actionRequest;
  const contentModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  });

  try {
    switch (action) {
      case "generate_email_content":
        const emailPrompt = `Generate a ${parameters.emailType || 'promotional'} email for ${parameters.audience || 'customers'}.

Tone: ${parameters.tone || 'professional'}
${parameters.includeDiscount ? `Include discount: ${parameters.discountAmount || '20%'}` : ''}
${parameters.keyMessage ? `Key message: ${parameters.keyMessage}` : ''}

Generate:
1. Subject line (under 60 chars)
2. Preheader text (40-50 chars)
3. Email body in HTML format with:
   - Personalized greeting with {{firstName}}
   - Engaging opening
   - Clear value proposition
   - Strong CTA button
   - Professional signature

Use inline CSS styles for email compatibility.
Format as:

SUBJECT: [subject line]
PREHEADER: [preheader text]

BODY:
[HTML email body]`;

        const emailResult = await contentModel.generateContent(emailPrompt);
        return emailResult.response.text();

      case "generate_subject_lines":
        const count = parameters.count || 5;
        const subjectPrompt = `Generate ${count} compelling subject lines for a ${parameters.campaignType || 'promotional'} email campaign.

Requirements:
- Each under 60 characters
- Mix of styles: question, urgency, benefit-focused, curiosity
${parameters.includeEmoji ? '- Include emoji in 2-3 options' : '- No emoji'}
- Optimized for high open rates

Format as numbered list.`;

        const subjectResult = await contentModel.generateContent(subjectPrompt);
        return subjectResult.response.text();

      case "improve_email_content":
        const improvements = Array.isArray(parameters.improvements) 
          ? parameters.improvements.join(', ') 
          : parameters.improvements;
        const improvePrompt = `Improve this email content with these enhancements: ${improvements}

Original content:
${parameters.originalContent}

Provide the improved version maintaining the same structure.`;

        const improveResult = await contentModel.generateContent(improvePrompt);
        return improveResult.response.text();

      default:
        return `Unknown action: ${action}`;
    }
  } catch (error: any) {
    console.error(`Error generating content:`, error);
    return `Error: ${error.message || "Content generation failed"}`;
  }
}
