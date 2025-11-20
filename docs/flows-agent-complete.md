# Flows Agent - Complete Implementation

## Overview

The Flows Agent can now automatically build multi-email automation sequences based on natural language requests.

## What It Does

The agent:
1. **Analyzes the request** to understand flow type, number of emails, timing, and target audience
2. **Creates a segment** for the trigger (if needed)
3. **Generates email templates** for each step in the sequence
4. **Builds the flow definition** with nodes (trigger, emails, delays) and edges
5. **Saves the complete flow** ready for review and activation

## Example Requests

```
"Build a 3-email welcome series"
"Create a win-back flow for inactive customers"
"Make a post-purchase follow-up sequence"
"Build a nurture campaign with 5 emails over 2 weeks"
```

## Flow Types Supported

- **Welcome Series**: For new customers (0 orders)
- **Win-back**: For inactive customers (90+ days, 3+ orders)
- **Post-Purchase**: For recent buyers (within 7 days)
- **Nurture**: For email subscribers
- **Custom**: Based on user description

## What Gets Created

### 1. Segment (if needed)
- Auto-generated targeting criteria based on flow type
- Linked to flow trigger

### 2. Email Templates
- One template per email in the sequence
- AI-generated subject lines and HTML content
- Includes personalization variables ({{firstName}}, {{totalSpent}})
- Categorized by flow type

### 3. Flow Definition
- **Trigger Node**: Links to segment or manual trigger
- **Email Nodes**: Reference the created templates
- **Delay Nodes**: Time gaps between emails
- **Edges**: Connect all nodes in sequence

## Architecture

```
User Request
    ↓
Gemini Analysis (flow planning)
    ↓
Create Segment → Create Email Templates → Build Flow Definition
    ↓
Save Flow (draft status)
```

## Files Created

- `app/api/agents/flows/handler.ts` - Main flow building logic
- `app/api/agents/flows/route.ts` - API endpoint
- Updated `app/api/agent/route.ts` - Router integration

## Usage

The agent is automatically invoked when users ask about:
- Building flows
- Creating email sequences
- Automation series
- Multi-step campaigns

## Next Steps for Users

After the agent creates a flow:
1. Visit `/flows` to see the new flow
2. Click "Edit" to open the visual flow builder
3. Review and customize emails/timing
4. Activate the flow when ready

## Technical Details

### Flow Definition Structure

```typescript
{
  nodes: [
    {
      id: "trigger-1",
      type: "trigger",
      data: { segmentId, segmentName, triggerType },
      position: { x, y }
    },
    {
      id: "email-1",
      type: "email",
      data: { emailTemplateId, subject, name },
      position: { x, y }
    },
    {
      id: "delay-1",
      type: "delay",
      data: { delayDays, delayHours, name },
      position: { x, y }
    }
  ],
  edges: [
    { id, source, target }
  ]
}
```

### Trigger Configuration

```typescript
{
  triggerType: "segment_added" | "manual",
  triggerConfig: {
    segmentId: "...",
    segmentName: "..."
  }
}
```

## Benefits

- **Speed**: Creates complete flows in seconds
- **Quality**: AI-generated email content with proper structure
- **Flexibility**: Users can edit everything in the visual builder
- **Integration**: Works with existing segments and templates system
