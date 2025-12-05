# Agent Workflow System

## Overview

The CommerceOS agent system uses a **router-based orchestration** pattern where the main router agent plans and executes multi-step workflows by calling specialist agents in sequence.

## Architecture

### Router Agent (`app/api/agent/route.ts`)

The router is the entry point for all agent requests. It:

1. **Plans the workflow** - Analyzes the user request and creates a sequential plan
2. **Executes steps** - Calls specialist agents in order
3. **Passes context** - Shares data between agents (segmentId, customerCount, etc.)
4. **Generates summary** - Creates a user-friendly response

### Specialist Agents

Each specialist handles a specific domain:

- **customer_analyst** - Query and analyze customer data
- **segments** - Create customer segments
- **emails** - Generate email content
- **campaigns** - Create email campaigns
- **flows** - Build automation sequences

## Workflow Examples

### Simple Request (Single Agent)

**User**: "Show me VIP customers"

**Workflow**:
```json
{
  "steps": [
    {
      "agent": "customer_analyst",
      "instruction": "Query VIP customers with high LTV",
      "extractData": []
    }
  ]
}
```

### Complex Request (Multiple Agents)

**User**: "Create a campaign for inactive high-value customers"

**Workflow**:
```json
{
  "steps": [
    {
      "agent": "customer_analyst",
      "instruction": "Analyze inactive customers with high LTV",
      "extractData": ["inactiveCount", "avgLtv"]
    },
    {
      "agent": "segments",
      "instruction": "Create segment for inactive high-LTV customers",
      "extractData": ["segmentId", "segmentName", "customerCount"]
    },
    {
      "agent": "emails",
      "instruction": "Write win-back email for high-value customers",
      "extractData": ["subject", "emailBody"]
    },
    {
      "agent": "campaigns",
      "instruction": "Create campaign using segment {{segmentId}} with generated email",
      "extractData": ["campaignId"]
    }
  ]
}
```

## Context Passing

Data flows between agents using:

1. **extractData** - Fields to extract from agent response
2. **Placeholders** - `{{fieldName}}` in instructions
3. **Shared context** - Object passed through workflow

Example:
```typescript
// Step 1: Segments agent creates segment
extractData: ["segmentId", "customerCount"]

// Step 2: Campaigns agent uses the data
instruction: "Create campaign for segment {{segmentId}} with {{customerCount}} customers"
```

## Benefits

- **Flexibility** - Router can create any workflow combination
- **Reusability** - Specialist agents remain focused and simple
- **Maintainability** - Easy to add new agents or modify workflows
- **Transparency** - Clear execution log for debugging

## Migration from Orchestrator

The old orchestrator agent (`app/api/agents/orchestrator/`) has been deprecated. It was rigid and couldn't adapt workflows dynamically. The new router-based system provides:

- Dynamic workflow planning based on user intent
- Better error handling per step
- Clearer separation of concerns
- More flexible agent combinations
