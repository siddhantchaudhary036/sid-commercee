import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { message, userId } = await request.json();

    // Orchestrator coordinates multiple agents to complete complex tasks
    const result = await orchestrateTask(message, userId);

    return NextResponse.json({
      response: result
    });

  } catch (error) {
    console.error("Orchestrator agent error:", error);
    return NextResponse.json(
      { error: "Failed to process orchestrator request" },
      { status: 500 }
    );
  }
}

async function orchestrateTask(message: string, userId: string): Promise<string> {
  const steps: string[] = [];
  
  try {
    // Use Gemini to understand the task and break it down
    const planningModel = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp"
    });

    const planningPrompt = `Analyze this marketing task and determine what needs to be done:

"${message}"

Identify:
1. Target audience (who should receive this?)
2. Campaign type (promotional, winback, welcome, etc.)
3. Key message or offer
4. Urgency level

Respond in JSON format:
{
  "audience": "description of target audience",
  "campaignType": "promotional|winback|welcome|nurture",
  "offer": "discount or key message",
  "urgency": "high|medium|low",
  "segmentCriteria": "how to identify the target customers"
}`;

    const planResult = await planningModel.generateContent(planningPrompt);
    const planText = planResult.response.text();
    
    // Extract JSON from response
    const jsonMatch = planText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return "I need more information to complete this task. Could you provide more details about your target audience and campaign goals?";
    }
    
    const plan = JSON.parse(jsonMatch[0]);
    
    steps.push(`🎯 **Task Analysis**`);
    steps.push(`Target: ${plan.audience}`);
    steps.push(`Type: ${plan.campaignType}`);
    steps.push(`Offer: ${plan.offer || 'None'}`);
    steps.push('');

    // Step 1: Query customers based on criteria
    steps.push(`🔍 **Step 1: Finding Target Customers**`);
    
    let customers;
    let segmentConditions = [];
    
    // Determine filters based on the plan
    if (plan.segmentCriteria.toLowerCase().includes('high value') || 
        plan.segmentCriteria.toLowerCase().includes('ltv') ||
        plan.segmentCriteria.toLowerCase().includes('vip')) {
      customers = await fetchQuery(api.customers.listWithFilters, {
        userId: userId as any,
        minLtv: 500,
        limit: 100
      });
      segmentConditions = [
        { field: 'customerLifetimeValue', operator: '>=', value: '500' }
      ];
      steps.push(`✓ Found ${customers.total} high-value customers (LTV ≥ $500)`);
    } else if (plan.segmentCriteria.toLowerCase().includes('inactive') || 
               plan.segmentCriteria.toLowerCase().includes('churn') ||
               plan.campaignType === 'winback') {
      customers = await fetchQuery(api.customers.listWithFilters, {
        userId: userId as any,
        churnRisk: 'High',
        limit: 100
      });
      segmentConditions = [
        { field: 'daysSinceLastOrder', operator: '>', value: '90' },
        { field: 'totalOrders', operator: '>=', value: '5' }
      ];
      steps.push(`✓ Found ${customers.total} at-risk customers (90+ days inactive, 5+ orders)`);
    } else if (plan.segmentCriteria.toLowerCase().includes('loyal') || 
               plan.segmentCriteria.toLowerCase().includes('champion')) {
      customers = await fetchQuery(api.customers.listWithFilters, {
        userId: userId as any,
        segment: 'Champions',
        limit: 100
      });
      segmentConditions = [
        { field: 'rfmSegment', operator: '=', value: 'Champions' }
      ];
      steps.push(`✓ Found ${customers.total} champion customers`);
    } else {
      // Default: get all customers
      customers = await fetchQuery(api.customers.listWithFilters, {
        userId: userId as any,
        limit: 100
      });
      segmentConditions = [];
      steps.push(`✓ Found ${customers.total} customers`);
    }
    
    if (customers.total === 0) {
      return steps.join('\n') + '\n\n❌ No customers match the criteria. Please adjust your targeting.';
    }
    
    steps.push('');

    // Step 2: Create segment
    steps.push(`📦 **Step 2: Creating Segment**`);
    
    const segmentName = `${plan.campaignType.charAt(0).toUpperCase() + plan.campaignType.slice(1)} - ${plan.audience.substring(0, 30)}`;
    const segmentDescription = `Auto-generated segment for: ${message.substring(0, 100)}`;
    
    const segmentId = await fetchMutation(api.segments.create, {
      userId: userId as any,
      name: segmentName,
      description: segmentDescription,
      conditions: segmentConditions.length > 0 ? segmentConditions : [
        { field: 'emailOptIn', operator: '=', value: 'true' }
      ],
      aiGenerated: true,
      aiPrompt: message
    });
    
    steps.push(`✓ Created segment: "${segmentName}"`);
    steps.push(`✓ Segment size: ${customers.total} customers`);
    steps.push('');

    // Step 3: Generate email content
    steps.push(`✍️ **Step 3: Writing Email Content**`);
    
    const emailModel = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp"
    });

    const emailPrompt = `Write a ${plan.campaignType} email for ${plan.audience}.

Requirements:
- Tone: ${plan.urgency === 'high' ? 'urgent and exciting' : 'friendly and professional'}
- Include: ${plan.offer || 'value proposition'}
- Target: ${plan.audience}
- Keep subject line under 60 characters
- Use personalization: {{firstName}}, {{totalSpent}}
- Include clear CTA

Format:
SUBJECT: [subject line]

BODY:
[HTML email body with inline styles]`;

    const emailResult = await emailModel.generateContent(emailPrompt);
    const emailContent = emailResult.response.text();
    
    // Extract subject and body
    const subjectMatch = emailContent.match(/SUBJECT:\s*(.+)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : `${plan.campaignType} Campaign`;
    
    const bodyMatch = emailContent.match(/BODY:\s*([\s\S]+)/i);
    const body = bodyMatch ? bodyMatch[1].trim() : emailContent;
    
    steps.push(`✓ Generated email with subject: "${subject}"`);
    steps.push('');

    // Step 4: Create campaign
    steps.push(`📧 **Step 4: Creating Campaign**`);
    
    const campaignName = segmentName;
    
    const campaignId = await fetchMutation(api.campaigns.create, {
      userId: userId as any,
      name: campaignName,
      subject,
      content: body,
      description: `Auto-generated campaign: ${message.substring(0, 100)}`,
      segmentId: segmentId as any,
      aiGenerated: true,
      aiPrompt: message
    });
    
    steps.push(`✓ Created campaign: "${campaignName}"`);
    steps.push(`✓ Status: Draft (ready for review)`);
    steps.push('');

    // Calculate potential impact
    const avgLtv = customers.customers.reduce((sum: number, c: any) => sum + (c.totalSpent || 0), 0) / customers.customers.length;
    const estimatedConversionRate = plan.campaignType === 'winback' ? 0.15 : 0.25;
    const potentialRevenue = Math.round(customers.total * estimatedConversionRate * avgLtv);
    
    // Final summary
    steps.push(`✅ **Campaign Ready!**`);
    steps.push('');
    steps.push(`**What I Created:**`);
    steps.push(`• Segment: "${segmentName}" (${customers.total} customers)`);
    steps.push(`• Campaign: "${campaignName}"`);
    steps.push(`• Email: ${subject}`);
    steps.push(`• Status: Draft`);
    steps.push('');
    steps.push(`**Estimated Impact:**`);
    steps.push(`• Target audience: ${customers.total} customers`);
    steps.push(`• Avg customer value: $${Math.round(avgLtv)}`);
    steps.push(`• Est. conversion: ${Math.round(estimatedConversionRate * 100)}%`);
    steps.push(`• Potential revenue: $${potentialRevenue.toLocaleString()}`);
    steps.push('');
    steps.push(`**Next Steps:**`);
    steps.push(`1. Visit the Campaigns page to review`);
    steps.push(`2. Preview the email content`);
    steps.push(`3. Schedule or send when ready`);
    steps.push('');
    steps.push(`💡 *Tip: Test with a small segment first to optimize performance*`);

    return steps.join('\n');

  } catch (error) {
    console.error('Orchestration error:', error);
    return steps.join('\n') + '\n\n❌ An error occurred during orchestration. Please try again or break down the task into smaller steps.';
  }
}

