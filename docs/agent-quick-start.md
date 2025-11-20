# Dashboard AI Agent - Quick Start Guide

## 🚀 Get Started in 2 Minutes

### 1. Start the System

```bash
# Terminal 1: Start Convex
npx convex dev

# Terminal 2: Start Next.js
npm run dev
```

### 2. Open Dashboard

Navigate to: `http://localhost:3000/dashboard`

### 3. Try Example Queries

Click any example prompt card or type your own!

## 📝 Example Queries by Agent

### Customer Analyst
```
"Show me customers from California"
"How many VIP customers do I have?"
"Who is at risk of churning?"
"What's my average customer lifetime value?"
```

### Segments
```
"Create a segment for high-value customers"
"Show me all my segments"
"Build a segment of inactive customers"
```

### Emails
```
"Write a welcome email for new customers"
"Generate 5 subject lines for Black Friday"
"Create a win-back email with 20% discount"
```

### Campaigns
```
"Create a promotional campaign"
"Show me my draft campaigns"
"List all sent campaigns this month"
```

### Orchestrator (Complex Tasks)
```
"Create a win-back campaign for high-value customers who haven't purchased in 90 days"

"Build a Black Friday campaign for loyal customers with 25% off"

"Target inactive customers with a special offer"
```

## 🎯 What Each Agent Does

| Agent | Purpose | Example |
|-------|---------|---------|
| **Customer Analyst** | Query & analyze data | "Show me Texas customers" |
| **Segments** | Create customer groups | "Create VIP segment" |
| **Emails** | Write content | "Write welcome email" |
| **Campaigns** | Manage campaigns | "Create promo campaign" |
| **Orchestrator** | Complex multi-step tasks | "Build complete campaign" |

## 💡 Pro Tips

1. **Be Specific:** "Create a segment for customers who spent over $500" works better than "Create a segment"

2. **Use Natural Language:** The AI understands conversational requests

3. **Complex Tasks:** For multi-step tasks, use the orchestrator with detailed requests

4. **Review Before Sending:** All campaigns are created as drafts - review them in the Campaigns page

## 🔍 What Happens Behind the Scenes

### Simple Query
```
You: "Show me VIP customers"
  ↓
Router: Classifies as "customer_analyst"
  ↓
Customer Analyst: Queries database
  ↓
Response: "Found 89 VIP customers..."
```

### Complex Task
```
You: "Create a win-back campaign for inactive customers"
  ↓
Router: Classifies as "orchestrator"
  ↓
Orchestrator:
  1. Finds inactive customers (45 found)
  2. Creates segment "Winback - inactive"
  3. Generates email content
  4. Creates draft campaign
  5. Estimates impact ($5,738 potential)
  ↓
Response: Complete summary with next steps
```

## ✅ Success Indicators

You'll know it's working when you see:

1. **Agent Badge:** Shows which specialist is handling your request
2. **Formatted Response:** Clear, structured answers
3. **Action Confirmation:** "Created segment with 45 customers"
4. **Next Steps:** Guidance on what to do next

## 🐛 Troubleshooting

**No response?**
- Check Convex is running (`npx convex dev`)
- Check browser console for errors
- Verify GEMINI_API_KEY in `.env.local`

**Wrong agent selected?**
- Try being more specific in your request
- Use keywords like "create", "show", "write", "build"

**Error message?**
- Check the toast notification for details
- Try rephrasing your request
- Check Convex dashboard for data issues

## 📚 Learn More

- **Full Documentation:** `/docs/agent-system-complete.md`
- **Step-by-Step Guide:** `/docs/agent-step1-router-complete.md`
- **Architecture Details:** `/docs/agent-steps-3-4-complete.md`

## 🎉 You're Ready!

Start chatting with your AI marketing assistant and watch it create segments, campaigns, and emails automatically!
