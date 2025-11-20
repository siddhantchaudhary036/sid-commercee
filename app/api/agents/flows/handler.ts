import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function handleFlowsRequest(
  message: string,
  userId: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    // Use Gemini to understand the flow request
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `You are a flow automation specialist. Analyze this request and determine what type of email flow to build:

"${message}"

Identify:
1. Flow type (welcome series, abandoned cart, win-back, nurture, post-purchase)
2. Number of emails in the sequence
3. Timing between emails (delays)
4. Target audience/trigger
5. Key messages for each email

Respond in JSON format:
{
  "flowType": "welcome|abandoned_cart|winback|nurture|post_purchase",
  "flowName": "descriptive name",
  "description": "what this flow does",
  "triggerType": "segment_added|tag_added|date|manual",
  "targetAudience": "who should receive this",
  "emails": [
    {
      "sequence": 1,
      "delayDays": 0,
      "subject": "email subject",
      "purpose": "what this email accomplishes",
      "keyMessage": "main message",
      "cta": "call to action"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    console.log('🔄 [FLOWS AGENT] Raw AI response:', text);
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return "I need more information to build this flow. Could you describe:\n- What type of email sequence? (welcome, win-back, etc.)\n- How many emails?\n- Who should receive it?";
    }
    
    const plan = JSON.parse(jsonMatch[0]);
    console.log('🔄 [FLOWS AGENT] Parsed plan:', JSON.stringify(plan, null, 2));
    
    return await buildFlow(plan, message, userId);

  } catch (error) {
    console.error("Flows agent error:", error);
    return "Sorry, I encountered an error building your flow. Please try again.";
  }
}

async function buildFlow(
  plan: any,
  originalMessage: string,
  userId: string
): Promise<string> {
  const steps: string[] = [];
  
  try {
    steps.push(`🔄 **Building ${plan.flowType} Flow**`);
    steps.push(`Flow: "${plan.flowName}"`);
    steps.push(`Emails: ${plan.emails.length} in sequence`);
    steps.push('');

    // Step 1: Create or find segment for trigger
    steps.push(`🎯 **Step 1: Setting Up Trigger**`);
    
    let segmentId;
    let segmentName;
    
    if (plan.triggerType === 'segment_added') {
      // Create a segment for the target audience
      segmentName = `${plan.flowName} - Target Audience`;
      
      // Determine segment conditions based on flow type
      let conditions = [];
      
      if (plan.flowType === 'welcome') {
        conditions = [
          { field: 'emailOptIn', operator: '=', value: true },
          { field: 'totalOrders', operator: '<=', value: 1 }
        ];
        console.log('🎯 [FLOWS AGENT] Creating welcome segment with conditions:', JSON.stringify(conditions, null, 2));
        steps.push(`✓ Trigger: New customers (1 or fewer orders, email subscribers)`);
      } else if (plan.flowType === 'winback') {
        conditions = [
          { field: 'daysSinceLastOrder', operator: '>=', value: 90 },
          { field: 'totalOrders', operator: '>=', value: 3 },
          { field: 'emailOptIn', operator: '=', value: true }
        ];
        steps.push(`✓ Trigger: Inactive customers (90+ days, 3+ orders)`);
      } else if (plan.flowType === 'post_purchase') {
        conditions = [
          { field: 'daysSinceLastOrder', operator: '<=', value: 7 },
          { field: 'emailOptIn', operator: '=', value: true }
        ];
        steps.push(`✓ Trigger: Recent purchasers (within 7 days)`);
      } else {
        // Default: email subscribers
        conditions = [
          { field: 'emailOptIn', operator: '=', value: true }
        ];
        steps.push(`✓ Trigger: Email subscribers`);
      }
      
      console.log('💾 [FLOWS AGENT] Creating segment with params:', {
        segmentName,
        conditions,
        userId
      });
      
      segmentId = await fetchMutation(api.segments.create, {
        userId: userId as any,
        name: segmentName,
        description: `Auto-generated segment for ${plan.flowName}`,
        conditions,
        aiGenerated: true,
        aiPrompt: originalMessage
      });
      
      console.log('✅ [FLOWS AGENT] Segment created with ID:', segmentId);
      
      steps.push(`✓ Created segment: "${segmentName}"`);
    } else {
      segmentName = 'Manual Trigger';
      steps.push(`✓ Trigger: Manual activation`);
    }
    
    steps.push('');

    // Step 2: Generate email templates for each step
    steps.push(`✍️ **Step 2: Writing Email Sequence**`);
    
    const emailTemplateIds = [];
    
    for (const email of plan.emails) {
      const emailModel = genAI.getGenerativeModel({
        model: "gemini-2.5-flash"
      });

      const emailPrompt = `Write email ${email.sequence} of ${plan.emails.length} for a ${plan.flowType} flow.

Context:
- Flow: ${plan.flowName}
- Email purpose: ${email.purpose}
- Key message: ${email.keyMessage}
- Call to action: ${email.cta}
- Target: ${plan.targetAudience}

Requirements:
1. Subject line: ${email.subject || 'Create an engaging subject line'}
2. Email body with:
   - Personalized greeting: "Hi {{firstName}},"
   - ${email.keyMessage}
   - Clear CTA: ${email.cta}
   - Professional signature
3. Use HTML with inline styles for email compatibility
4. Include personalization variables: {{firstName}}, {{totalSpent}}

Format:
SUBJECT: [subject line]

BODY:
[Complete HTML email with inline CSS]`;

      const emailResult = await emailModel.generateContent(emailPrompt);
      const emailContent = emailResult.response.text();
      
      // Extract subject and body
      const subjectMatch = emailContent.match(/SUBJECT:\s*(.+)/i);
      const subject = subjectMatch ? subjectMatch[1].trim() : email.subject;
      
      const bodyMatch = emailContent.match(/BODY:\s*([\s\S]+)/i);
      const body = bodyMatch ? bodyMatch[1].trim() : emailContent;
      
      // Create email template
      console.log(`📧 [FLOWS AGENT] Creating email template ${email.sequence}:`, {
        name: `${plan.flowName} - Email ${email.sequence}`,
        subject
      });
      
      const templateId = await fetchMutation(api.emailTemplates.create, {
        userId: userId as any,
        name: `${plan.flowName} - Email ${email.sequence}`,
        subject,
        content: body,
        category: plan.flowType,
        description: email.purpose
      });
      
      console.log(`✅ [FLOWS AGENT] Email template ${email.sequence} created with ID:`, templateId);
      
      emailTemplateIds.push({
        templateId,
        subject,
        delayDays: email.delayDays,
        sequence: email.sequence
      });
      
      steps.push(`✓ Email ${email.sequence}: "${subject}"`);
      if (email.delayDays > 0) {
        steps.push(`  → Send ${email.delayDays} day${email.delayDays > 1 ? 's' : ''} after previous email`);
      }
    }
    
    steps.push('');

    // Step 3: Build flow definition (nodes and edges)
    steps.push(`🔧 **Step 3: Assembling Flow**`);
    
    const nodes = [];
    const edges = [];
    
    // Trigger node
    const triggerNode = {
      id: 'trigger-1',
      type: 'trigger',
      data: {
        name: 'Flow Trigger',
        triggerType: plan.triggerType,
        segmentId: segmentId || null,
        segmentName: segmentName || 'Manual'
      },
      position: { x: 250, y: 50 }
    };
    nodes.push(triggerNode);
    
    let previousNodeId = 'trigger-1';
    let yPosition = 200;
    
    // Create email and delay nodes
    for (let i = 0; i < emailTemplateIds.length; i++) {
      const emailData = emailTemplateIds[i];
      
      // Add delay node if needed (except before first email)
      if (i > 0 && emailData.delayDays > 0) {
        const delayNodeId = `delay-${i}`;
        nodes.push({
          id: delayNodeId,
          type: 'delay',
          data: {
            name: `Wait ${emailData.delayDays} day${emailData.delayDays > 1 ? 's' : ''}`,
            delayDays: emailData.delayDays,
            delayHours: 0
          },
          position: { x: 250, y: yPosition }
        });
        
        edges.push({
          id: `edge-${previousNodeId}-${delayNodeId}`,
          source: previousNodeId,
          target: delayNodeId
        });
        
        previousNodeId = delayNodeId;
        yPosition += 150;
      }
      
      // Add email node
      const emailNodeId = `email-${i + 1}`;
      nodes.push({
        id: emailNodeId,
        type: 'email',
        data: {
          name: `Email ${emailData.sequence}`,
          emailTemplateId: emailData.templateId,
          subject: emailData.subject
        },
        position: { x: 250, y: yPosition }
      });
      
      edges.push({
        id: `edge-${previousNodeId}-${emailNodeId}`,
        source: previousNodeId,
        target: emailNodeId
      });
      
      previousNodeId = emailNodeId;
      yPosition += 150;
    }
    
    steps.push(`✓ Created ${nodes.length} nodes (1 trigger, ${emailTemplateIds.length} emails, ${nodes.length - emailTemplateIds.length - 1} delays)`);
    steps.push(`✓ Connected ${edges.length} steps`);
    steps.push('');

    // Step 4: Create the flow
    steps.push(`💾 **Step 4: Saving Flow**`);
    
    console.log('🔧 [FLOWS AGENT] Creating flow with definition:', {
      name: plan.flowName,
      triggerType: plan.triggerType,
      nodeCount: nodes.length,
      edgeCount: edges.length
    });
    
    const flowId = await fetchMutation(api.flows.create, {
      userId: userId as any,
      name: plan.flowName,
      description: plan.description,
      triggerType: plan.triggerType,
      triggerConfig: {
        segmentId: segmentId || null,
        segmentName: segmentName || 'Manual'
      },
      flowDefinition: {
        nodes,
        edges
      }
    });
    
    console.log('✅ [FLOWS AGENT] Flow created with ID:', flowId);
    
    steps.push(`✓ Flow created: "${plan.flowName}"`);
    steps.push(`✓ Status: Draft (ready for review)`);
    steps.push('');

    // Final summary
    steps.push(`✅ **Flow Complete!**`);
    steps.push('');
    steps.push(`**📧 Email Sequence:**`);
    emailTemplateIds.forEach((email, i) => {
      if (i === 0) {
        steps.push(`• Email 1: "${email.subject}" (immediately)`);
      } else {
        steps.push(`• Email ${email.sequence}: "${email.subject}" (${email.delayDays} day${email.delayDays > 1 ? 's' : ''} later)`);
      }
    });
    steps.push('');
    steps.push(`**🎯 Trigger:**`);
    steps.push(`• Type: ${plan.triggerType === 'segment_added' ? 'When customer added to segment' : 'Manual'}`);
    if (segmentName) {
      steps.push(`• Segment: "${segmentName}"`);
    }
    steps.push('');
    steps.push(`**Next Steps:**`);
    steps.push(`1. Visit /flows to review the flow`);
    steps.push(`2. Click "Edit" to see the visual flow builder`);
    steps.push(`3. Activate the flow when ready`);
    steps.push('');
    steps.push(`💡 *Tip: You can edit email templates and timing in the flow editor*`);

    return steps.join('\n');

  } catch (error) {
    console.error('Flow building error:', error);
    return steps.join('\n') + '\n\n❌ An error occurred while building the flow. Please try again.';
  }
}
