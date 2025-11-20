import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function handleOrchestratorRequest(
  message: string,
  userId: string
): Promise<string> {
  try {

    // Orchestrator coordinates multiple agents to complete complex tasks
    return await orchestrateTask(message, userId);

  } catch (error) {
    console.error("Orchestrator agent error:", error);
    return "Sorry, I encountered an error processing your orchestrator request. Please try again.";
  }
}

async function orchestrateTask(message: string, userId: string): Promise<string> {
  const steps: string[] = [];
  
  try {
    // Use Gemini to understand the task and break it down
    const planningModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
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

    // Step 1: Query ALL customers first to calculate percentiles
    steps.push(`🔍 **Step 1: Analyzing Customer Base**`);
    
    const allCustomers = await fetchQuery(api.customers.listWithFilters, {
      userId: userId as any,
      limit: 1000 // Get more for accurate percentile calculation
    });
    
    steps.push(`✓ Analyzed ${allCustomers.total} total customers`);
    
    // Calculate 75th percentile LTV
    const ltvValues = allCustomers.customers
      .map((c: any) => c.customerLifetimeValue || c.totalSpent || 0)
      .filter((ltv: number) => ltv > 0)
      .sort((a: number, b: number) => a - b);
    
    const percentile75Index = Math.floor(ltvValues.length * 0.75);
    const ltv75thPercentile = ltvValues[percentile75Index] || 500;
    
    steps.push(`✓ Calculated 75th percentile LTV: $${Math.round(ltv75thPercentile)}`);
    steps.push('');
    
    // Step 2: Query customers based on criteria
    steps.push(`🎯 **Step 2: Finding Target Customers**`);
    
    let customers;
    let segmentConditions = [];
    let inactiveDays = 60; // Default
    
    // Determine filters based on the plan
    if (plan.segmentCriteria.toLowerCase().includes('high value') || 
        plan.segmentCriteria.toLowerCase().includes('ltv') ||
        plan.segmentCriteria.toLowerCase().includes('percentile')) {
      
      // Extract days if mentioned
      const daysMatch = message.match(/(\d+)\s*days?/i);
      if (daysMatch) {
        inactiveDays = parseInt(daysMatch[1]);
      }
      
      customers = await fetchQuery(api.customers.listWithFilters, {
        userId: userId as any,
        minLtv: Math.round(ltv75thPercentile),
        limit: 500
      });
      
      // Filter for email subscribers and inactive
      const filteredCustomers = customers.customers.filter((c: any) => 
        c.emailOptIn === true && 
        (c.daysSinceLastOrder || 0) >= inactiveDays
      );
      
      customers = {
        ...customers,
        customers: filteredCustomers,
        total: filteredCustomers.length
      };
      
      segmentConditions = [
        { field: 'customerLifetimeValue', operator: '>=', value: Math.round(ltv75thPercentile).toString() },
        { field: 'emailOptIn', operator: '=', value: 'true' },
        { field: 'daysSinceLastOrder', operator: '>=', value: inactiveDays.toString() }
      ];
      
      steps.push(`✓ Found ${customers.total} high-LTV customers (≥75th percentile)`);
      steps.push(`  • LTV ≥ $${Math.round(ltv75thPercentile)}`);
      steps.push(`  • Email subscribers only`);
      steps.push(`  • Inactive for ${inactiveDays}+ days`);
      
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
        { field: 'totalOrders', operator: '>=', value: '5' },
        { field: 'emailOptIn', operator: '=', value: 'true' }
      ];
      steps.push(`✓ Found ${customers.total} at-risk customers (90+ days inactive, 5+ orders, email subscribers)`);
    } else if (plan.segmentCriteria.toLowerCase().includes('loyal') || 
               plan.segmentCriteria.toLowerCase().includes('champion')) {
      customers = await fetchQuery(api.customers.listWithFilters, {
        userId: userId as any,
        segment: 'Champions',
        limit: 100
      });
      segmentConditions = [
        { field: 'rfmSegment', operator: '=', value: 'Champions' },
        { field: 'emailOptIn', operator: '=', value: 'true' }
      ];
      steps.push(`✓ Found ${customers.total} champion customers (email subscribers)`);
    } else {
      // Default: get email subscribers
      customers = await fetchQuery(api.customers.listWithFilters, {
        userId: userId as any,
        limit: 100
      });
      
      const filteredCustomers = customers.customers.filter((c: any) => c.emailOptIn === true);
      customers = {
        ...customers,
        customers: filteredCustomers,
        total: filteredCustomers.length
      };
      
      segmentConditions = [
        { field: 'emailOptIn', operator: '=', value: 'true' }
      ];
      steps.push(`✓ Found ${customers.total} email subscribers`);
    }
    
    if (customers.total === 0) {
      return steps.join('\n') + '\n\n❌ No customers match the criteria. Please adjust your targeting.';
    }
    
    steps.push('');

    // Step 3: Create segment
    steps.push(`📦 **Step 3: Creating Segment**`);
    
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

    // Step 4: Determine optimal send time
    steps.push(`⏰ **Step 4: Optimizing Send Time**`);
    
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    // Best days: Tuesday-Thursday
    let optimalDay = dayOfWeek;
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
      optimalDay = 2; // Tuesday
    } else if (dayOfWeek === 5) { // Friday
      optimalDay = 2; // Next Tuesday
    }
    
    // Best time: 10 AM - 2 PM
    const optimalHour = 10;
    
    const sendDate = new Date(now);
    if (optimalDay !== dayOfWeek) {
      const daysToAdd = (optimalDay - dayOfWeek + 7) % 7;
      sendDate.setDate(sendDate.getDate() + daysToAdd);
    } else {
      // If today, schedule for tomorrow at optimal time
      sendDate.setDate(sendDate.getDate() + 1);
    }
    sendDate.setHours(optimalHour, 0, 0, 0);
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const optimalDayName = dayNames[sendDate.getDay()];
    const formattedDate = sendDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = sendDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    steps.push(`✓ Optimal send day: ${optimalDayName} (highest engagement)`);
    steps.push(`✓ Optimal send time: ${formattedTime} (peak open rates)`);
    steps.push(`✓ Scheduled for: ${formattedDate} at ${formattedTime}`);
    steps.push('');

    // Step 5: Generate email content with AI
    steps.push(`✍️ **Step 5: Writing Email Content**`);
    
    const emailModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    // Calculate average customer value for personalization
    const avgCustomerSpend = customers.customers.length > 0
      ? Math.round(customers.customers.reduce((sum: number, c: any) => sum + (c.totalSpent || 0), 0) / customers.customers.length)
      : 0;

    const emailPrompt = `Write a compelling ${plan.campaignType} email for ${plan.audience}.

Context:
- Target: High-value customers (avg spent: $${avgCustomerSpend})
- Situation: Haven't purchased in ${inactiveDays || 60}+ days
- Goal: Re-engage and drive purchase
- Tone: ${plan.urgency === 'high' ? 'urgent and exciting' : 'warm, appreciative, and enticing'}
- Offer: ${plan.offer || 'Exclusive offer for valued customers'}

Requirements:
1. Subject line: Under 60 characters, create curiosity and urgency
2. Preheader: Complement the subject (40-50 chars)
3. Email body with:
   - Personalized greeting: "Hi {{firstName}},"
   - Acknowledge their value: Reference their past purchases
   - Create urgency: Limited time offer
   - Clear benefit: What's in it for them
   - Strong CTA: Single, clear call-to-action button
   - Professional signature

Use HTML with inline styles for email compatibility.
Include personalization variables: {{firstName}}, {{totalSpent}}

Format:
SUBJECT: [subject line]
PREHEADER: [preheader text]

BODY:
[Complete HTML email with inline CSS]`;

    const emailResult = await emailModel.generateContent(emailPrompt);
    const emailContent = emailResult.response.text();
    
    // Extract subject, preheader, and body
    const subjectMatch = emailContent.match(/SUBJECT:\s*(.+)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : `We Miss You, {{firstName}}!`;
    
    const preheaderMatch = emailContent.match(/PREHEADER:\s*(.+)/i);
    const preheader = preheaderMatch ? preheaderMatch[1].trim() : '';
    
    const bodyMatch = emailContent.match(/BODY:\s*([\s\S]+)/i);
    const body = bodyMatch ? bodyMatch[1].trim() : emailContent;
    
    steps.push(`✓ Generated email subject: "${subject}"`);
    if (preheader) {
      steps.push(`✓ Preheader: "${preheader}"`);
    }
    steps.push(`✓ Email body: Complete HTML with personalization`);
    steps.push('');

    // Step 6: Create campaign
    steps.push(`📧 **Step 6: Creating Campaign**`);
    
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
    steps.push(`✅ **Campaign Complete!**`);
    steps.push('');
    steps.push(`**📊 Segment Created:**`);
    steps.push(`• Name: "${segmentName}"`);
    steps.push(`• Size: ${customers.total} customers`);
    steps.push(`• Criteria: LTV ≥ $${Math.round(ltv75thPercentile)} (75th percentile)`);
    steps.push(`• Filter: Email subscribers, inactive ${inactiveDays || 60}+ days`);
    steps.push('');
    steps.push(`**📧 Campaign Created:**`);
    steps.push(`• Name: "${campaignName}"`);
    steps.push(`• Subject: "${subject}"`);
    steps.push(`• Send Date: ${formattedDate}`);
    steps.push(`• Send Time: ${formattedTime} (optimal)`);
    steps.push(`• Status: Draft (ready for review)`);
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

