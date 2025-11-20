# Agent Implementation Notes

## Architecture Change: JSON Mode Instead of Function Calling

### Why the Change?

The original implementation used Gemini's function calling feature, but we encountered TypeScript type compatibility issues with the SDK. The new approach uses **JSON mode** which is:

1. **More Reliable** - No TypeScript type conflicts
2. **Simpler** - Easier to understand and maintain
3. **More Flexible** - Easier to add new actions
4. **Just as Effective** - Gemini is excellent at generating structured JSON

### How It Works

**Old Approach (Function Calling):**
```typescript
// Define complex function declarations with strict types
const tools = [{
  functionDeclarations: [
    {
      name: "query_customers",
      parameters: { /* complex schema */ }
    }
  ]
}];

// Gemini calls functions automatically
const model = genAI.getGenerativeModel({ model, tools });
```

**New Approach (JSON Mode):**
```typescript
// Agent decides what action to take
const systemPrompt = `When you need data, respond with JSON:
{
  "action": "query_customers",
  "parameters": { "state": "California" },
  "reasoning": "User asked about California customers"
}`;

// We parse JSON and execute action
const jsonMatch = responseText.match(/\{[\s\S]*"action"[\s\S]*\}/);
if (jsonMatch) {
  const actionRequest = JSON.parse(jsonMatch[0]);
  const data = await executeAction(actionRequest, userId);
  // Send data back to model for final response
}
```

### Benefits

1. **No TypeScript Errors** - Simple JSON parsing, no complex type definitions
2. **Better Control** - We control when and how actions execute
3. **Easier Debugging** - Can log action requests and responses
4. **More Flexible** - Easy to add validation, rate limiting, etc.

### Agent Flow

```
User Message
     ↓
Agent analyzes request
     ↓
Agent responds with JSON action request
     ↓
We parse JSON and execute action
     ↓
We send data back to agent
     ↓
Agent provides conversational response
     ↓
User sees friendly response
```

### Example

**User:** "Show me customers from California"

**Agent's First Response:**
```json
{
  "action": "query_customers",
  "parameters": {
    "state": "California",
    "limit": 50
  },
  "reasoning": "User wants to see California customers"
}
```

**We Execute Action:**
```typescript
const data = await fetchQuery(api.customers.listWithFilters, {
  userId,
  state: "California",
  limit: 50
});
```

**We Send Data Back:**
```
Here's the data you requested:
{
  "total": 127,
  "customers": [...]
}

Now provide a conversational response to the user.
```

**Agent's Final Response:**
```
I found 127 customers from California! Here are the top 5 by spending:

1. John Smith - $2,450 (15 orders)
2. Jane Doe - $1,890 (12 orders)
...

Would you like to create a segment for these customers?
```

## Model Version

Using **gemini-2.5-flash** (latest production version):
- Best price-to-performance ratio
- Thinking capabilities
- Better at structured output
- More cost-effective than previous versions
- Excellent at JSON generation
- 1M+ token context window

## Error Handling

Each agent includes:
- Try-catch around main logic
- JSON parsing error handling
- Action execution error handling
- Graceful fallbacks

## Testing

All agents tested and working:
- ✅ Customer Analyst
- ✅ Segments
- ✅ Emails
- ✅ Campaigns
- ✅ Orchestrator

No TypeScript errors, all diagnostics clean.
