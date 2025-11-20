# Router Fixed - Better Orchestrator Detection ✅

## The Problem

Your prompt **"I want to improve revenue from high LTV customers that haven't purchased recently"** was being routed to the **customer_analyst** instead of the **orchestrator**.

The customer_analyst only queries data - it doesn't create segments or campaigns.

## The Fix

Updated the routing logic to better detect when a request needs orchestration.

### New Routing Rules

**Use ORCHESTRATOR when request:**
- ✅ Mentions improving/increasing revenue, sales, or metrics
- ✅ Wants to target AND take action
- ✅ Mentions creating campaigns for customer groups
- ✅ Includes action words: "improve", "increase", "drive", "boost", "re-engage", "win-back"
- ✅ Requires creating BOTH segment AND campaign
- ✅ Is a business goal, not just a data question

**Use CUSTOMER_ANALYST only when:**
- ❌ Pure data query with NO action
- ❌ Just wants to see/know information
- ❌ Examples: "Show me...", "How many...", "Who are..."

## Test Cases

### Should Route to ORCHESTRATOR ✅

```
"I want to improve revenue from high LTV customers that haven't purchased recently"
→ orchestrator (business goal + needs segment + campaign + email)

"Target inactive customers with a campaign"
→ orchestrator (needs segment + campaign)

"Send a Black Friday campaign to loyal customers"
→ orchestrator (needs segment + campaign + email)

"Re-engage customers who haven't purchased"
→ orchestrator (business goal + action)

"Increase sales from VIP customers"
→ orchestrator (business goal)

"Create a win-back campaign for churned customers"
→ orchestrator (needs segment + campaign + email)
```

### Should Route to CUSTOMER_ANALYST ✅

```
"Show me customers from Texas"
→ customer_analyst (just viewing data)

"How many VIP customers do I have?"
→ customer_analyst (just data)

"Who are my top spenders?"
→ customer_analyst (just data)

"What's my average customer LTV?"
→ customer_analyst (just data)
```

### Should Route to SEGMENTS ✅

```
"Create a segment for VIP customers"
→ segments (only creating segment, no campaign)

"Build a group of high-value customers"
→ segments (only segment)
```

## What Happens Now

When you say: **"I want to improve revenue from high LTV customers that haven't purchased recently"**

1. **Router** detects keywords: "improve revenue" → Routes to **orchestrator** ✅
2. **Orchestrator** executes full workflow:
   - Calculates 75th percentile LTV
   - Finds matching customers (high LTV + inactive + email subscribers)
   - Creates segment
   - Generates email content
   - Creates campaign
   - Estimates impact

## Try It Now!

Navigate to `/dashboard` and test these prompts:

**Should trigger orchestrator:**
- "I want to improve revenue from high LTV customers that haven't purchased recently"
- "Create a win-back campaign for inactive VIP customers"
- "Target customers who haven't ordered in 60 days"
- "Increase sales from my best customers"

**Should trigger customer_analyst:**
- "Show me my high LTV customers"
- "How many customers haven't purchased in 60 days?"
- "Who are my at-risk customers?"

The router should now correctly identify business goals and route them to the orchestrator! 🎯
