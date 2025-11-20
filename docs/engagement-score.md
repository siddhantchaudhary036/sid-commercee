# Engagement Score Calculation

## Overview

The **Engagement Score** is a metric (0-100) that quantifies how actively a customer interacts with your email marketing campaigns. It combines email opens and clicks into a single, actionable score.

## Formula

```
Engagement Score = min(100, (emailOpensCount × 2) + (emailClicksCount × 5))
```

### Components

1. **Email Opens Count** (`emailOpensCount`)
   - Total number of emails the customer has opened
   - Weight: **2 points per open**
   - Rationale: Opens indicate basic interest

2. **Email Clicks Count** (`emailClicksCount`)
   - Total number of email links the customer has clicked
   - Weight: **5 points per click**
   - Rationale: Clicks indicate strong intent and engagement

3. **Maximum Cap**: **100 points**
   - Prevents score inflation for extremely active users
   - Ensures scores remain comparable across customers

## Examples

### Low Engagement Customer
```
emailOpensCount: 2
emailClicksCount: 0

Score = min(100, (2 × 2) + (0 × 5))
Score = min(100, 4)
Score = 4
```

### Medium Engagement Customer
```
emailOpensCount: 15
emailClicksCount: 5

Score = min(100, (15 × 2) + (5 × 5))
Score = min(100, 30 + 25)
Score = min(100, 55)
Score = 55
```

### High Engagement Customer
```
emailOpensCount: 50
emailClicksCount: 20

Score = min(100, (50 × 2) + (20 × 5))
Score = min(100, 100 + 100)
Score = min(100, 200)
Score = 100 (capped)
```

## Score Interpretation

| Score Range | Engagement Level | Description |
|-------------|------------------|-------------|
| 0-20        | Very Low         | Rarely opens emails, almost never clicks |
| 21-40       | Low              | Occasional opens, few clicks |
| 41-60       | Medium           | Regular opens, some clicks |
| 61-80       | High             | Frequent opens, regular clicks |
| 81-100      | Very High        | Highly engaged, clicks frequently |

## Use Cases

### 1. Segmentation
Create segments based on engagement levels:
- **Highly Engaged**: Score > 60 → Send more frequent campaigns
- **At Risk**: Score < 20 → Win-back campaigns
- **Medium Engaged**: Score 20-60 → Standard cadence

### 2. Churn Prediction
Low engagement scores combined with other factors (e.g., `daysSinceLastOrder`) can predict churn risk.

### 3. Campaign Targeting
Prioritize high-engagement customers for:
- New product launches
- Exclusive offers
- Beta testing opportunities

### 4. Performance Tracking
Monitor engagement score trends over time to measure:
- Campaign effectiveness
- Content quality
- Send frequency optimization

## Implementation

### In Seed Data Generator (`convex/seed.ts`)

```typescript
// Generate engagement metrics based on engagement level
const engagementLevel = faker.helpers.weightedArrayElement([
  { weight: 20, value: 'high' },
  { weight: 50, value: 'medium' },
  { weight: 30, value: 'low' }
]);

let emailOpensCount, emailClicksCount;
if (engagementLevel === 'high') {
  emailOpensCount = faker.number.int({ min: 30, max: 100 });
  emailClicksCount = faker.number.int({ min: 10, max: Math.floor(emailOpensCount * 0.4) });
} else if (engagementLevel === 'medium') {
  emailOpensCount = faker.number.int({ min: 5, max: 30 });
  emailClicksCount = faker.number.int({ min: 1, max: Math.floor(emailOpensCount * 0.3) });
} else {
  emailOpensCount = faker.number.int({ min: 0, max: 5 });
  emailClicksCount = faker.number.int({ min: 0, max: 2 });
}

// Calculate engagement score
const engagementScore = Math.min(100, (emailOpensCount * 2) + (emailClicksCount * 5));
```

### In Real-Time Updates

When a customer opens or clicks an email:

```typescript
// After email open
const newOpensCount = customer.emailOpensCount + 1;
const newEngagementScore = Math.min(
  100, 
  (newOpensCount * 2) + (customer.emailClicksCount * 5)
);

await updateCustomer({
  emailOpensCount: newOpensCount,
  engagementScore: newEngagementScore,
  lastEmailOpenDate: new Date().toISOString()
});

// After email click
const newClicksCount = customer.emailClicksCount + 1;
const newEngagementScore = Math.min(
  100, 
  (customer.emailOpensCount * 2) + (newClicksCount * 5)
);

await updateCustomer({
  emailClicksCount: newClicksCount,
  engagementScore: newEngagementScore,
  lastEmailClickDate: new Date().toISOString()
});
```

## Why This Formula?

### 1. Weighted Actions
- **Clicks are 2.5x more valuable than opens** (5 points vs 2 points)
- Clicks indicate stronger intent and engagement
- Opens are easier to achieve, so they're weighted lower

### 2. Simple & Interpretable
- Easy to understand and explain
- No complex calculations or normalization
- Directly correlates with customer actions

### 3. Actionable
- Clear thresholds for segmentation
- Easy to set rules and automations
- Comparable across all customers

### 4. Scalable
- Works for customers with 0 interactions
- Works for highly active customers (capped at 100)
- No need for recalculation as database grows

## Future Enhancements

Potential additions to the formula:
- **Recency decay**: Reduce score for old interactions
- **Unsubscribe penalty**: Negative points for unsubscribes
- **Purchase boost**: Bonus points for purchases after clicks
- **Time-weighted**: Recent actions worth more than old ones

## Related Metrics

- **Churn Risk**: Uses engagement score + `daysSinceLastOrder`
- **RFM Score**: Independent metric based on purchase behavior
- **Customer Lifetime Value**: Predicted value based on engagement + spending

---

**Last Updated**: November 19, 2024  
**Version**: 1.0
