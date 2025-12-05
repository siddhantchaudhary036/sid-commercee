# Customer Analyst Agent Improvements

## Problem

The customer analyst agent was labeling customers as "high risk" without explaining WHY they were high risk. This left users confused about what the labels meant and why they should care.

## Solution

Enhanced the agent to always explain the reasoning behind customer classifications.

## Changes Made

### 1. Enhanced System Prompt

Added detailed definitions and explanations for all customer classifications:

**Churn Risk Levels:**
- **HIGH RISK**: 90+ days inactive + 5+ previous orders
  - Why: Proven buyers who are becoming inactive
- **MEDIUM RISK**: 60-90 days inactive
  - Why: Early warning signs of disengagement  
- **LOW RISK**: Ordered within 60 days
  - Why: Recently active and engaged

**RFM Segments:**
- **Champions**: High recency, frequency, monetary (5,5,5)
  - Why: Best customers who buy often, recently, and spend a lot
- **Loyal**: High frequency/monetary, moderate recency
  - Why: Regular customers with consistent purchases
- **At-Risk**: Declining engagement
  - Why: Used to buy frequently but haven't purchased recently
- **Potential**: New or occasional customers
  - Why: Haven't established consistent patterns yet
- **Lost**: Very long time since purchase
  - Why: Likely churned, need aggressive win-back

### 2. Enriched Data Response

Added aggregate metrics to provide context:

```typescript
{
  total: 150,
  filters: {
    churnRisk: "High"
  },
  aggregates: {
    averageLifetimeValue: 850,      // Shows value at risk
    averageOrders: 8.5,              // Shows they're proven buyers
    averageDaysSinceLastOrder: 120   // Shows how long they've been inactive
  },
  customers: [...]
}
```

### 3. Added Insight Explanations

When fetching insights, now includes explanations:

```typescript
{
  highChurnRisk: {
    count: 150,
    customers: [...]
  },
  explanations: {
    highChurnRisk: "These customers haven't ordered in 90+ days but have 5+ previous orders. They're valuable customers showing signs of disengagement."
  }
}
```

## Example Responses

### Before (Bad)
```
User: "Show me high-risk customers"
Agent: "I found 150 high-risk customers."
```

### After (Good)
```
User: "Show me high-risk customers"
Agent: "I found 150 high-risk customers. These are customers who haven't 
ordered in 90+ days but have made 5 or more purchases in the past. They're 
considered high-risk because they've proven they're willing to buy from you, 
but something has caused them to stop. Their average lifetime value is $850, 
so re-engaging them could have significant revenue impact."
```

## Impact

Users now understand:
1. **What** the classification means (specific criteria)
2. **Why** it matters (business impact)
3. **What** they should do about it (implied action)

This makes the agent more educational and actionable, helping users make better marketing decisions.
