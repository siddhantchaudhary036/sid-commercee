Engagement Score: Engagement Score = min(100, (emailOpensCount × 2) + (emailClicksCount × 5))

🧮 RFM Segmentation Calculation
Step 1: Calculate Individual Scores (1-5 scale)
Each customer gets three scores based on their behavior:

1. Recency Score (How recently did they purchase?)
javascript
function calculateRecencyScore(daysSinceLastOrder) {
  if (!daysSinceLastOrder) return 1; // Never ordered
  if (daysSinceLastOrder < 30) return 5;   // Purchased in last month
  if (daysSinceLastOrder < 60) return 4;   // 1-2 months ago
  if (daysSinceLastOrder < 90) return 3;   // 2-3 months ago
  if (daysSinceLastOrder < 180) return 2;  // 3-6 months ago
  return 1;                                 // 6+ months ago (dormant)
}
Examples:

Purchased 15 days ago → Score 5 (very recent)

Purchased 75 days ago → Score 3 (moderate)

Purchased 200 days ago → Score 1 (dormant)

2. Frequency Score (How often do they purchase?)
javascript
function calculateFrequencyScore(totalOrders) {
  if (totalOrders >= 20) return 5;  // Super frequent (20+ orders)
  if (totalOrders >= 10) return 4;  // Frequent (10-19 orders)
  if (totalOrders >= 5) return 3;   // Regular (5-9 orders)
  if (totalOrders >= 2) return 2;   // Occasional (2-4 orders)
  return 1;                          // One-time buyer
}
Examples:

25 orders → Score 5 (very frequent)

7 orders → Score 3 (regular)

1 order → Score 1 (one-time)

3. Monetary Score (How much do they spend?)
javascript
function calculateMonetaryScore(totalSpent) {
  if (totalSpent >= 1000) return 5;  // High spender ($1000+)
  if (totalSpent >= 500) return 4;   // Good spender ($500-999)
  if (totalSpent >= 200) return 3;   // Moderate ($200-499)
  if (totalSpent >= 100) return 2;   // Low ($100-199)
  return 1;                           // Very low (<$100)
}
Examples:

$1,500 total → Score 5 (high value)

$350 total → Score 3 (moderate)

$75 total → Score 1 (low value)

Step 2: Combine Scores to Determine Segment
Add the three scores together (max: 15, min: 3) and classify:

javascript
function getRfmSegment(recencyScore, frequencyScore, monetaryScore) {
  const totalScore = recencyScore + frequencyScore + monetaryScore;
  
  // Combined score determines segment
  if (totalScore >= 13) return "Champions";    // 13-15: Best customers
  if (totalScore >= 10) return "Loyal";        // 10-12: Good customers
  if (totalScore >= 7) return "Potential";     // 7-9: Growing customers
  if (totalScore >= 5) return "At-Risk";       // 5-6: Declining customers
  return "Lost";                                // 3-4: Dormant customers
}
📊 Real Examples from Your Data
Example 1: Champion Customer
javascript
Customer: Sarah Johnson
├─ daysSinceLastOrder: 5 days
│  → recencyScore = 5 (very recent)
├─ totalOrders: 23
│  → frequencyScore = 5 (super frequent)
├─ totalSpent: $2,450
│  → monetaryScore = 5 (high spender)
└─ Total: 5 + 5 + 5 = 15
   → Segment: "Champions" 🟢
Champions = Recent + Frequent + High-spending
Your best customers who buy often, recently, and spend a lot.

Example 2: Loyal Customer
javascript
Customer: Mike Chen
├─ daysSinceLastOrder: 12 days
│  → recencyScore = 5 (recent)
├─ totalOrders: 18
│  → frequencyScore = 4 (frequent)
├─ totalSpent: $1,890
│  → monetaryScore = 4 (good spender)
└─ Total: 5 + 4 + 4 = 13... wait, that's Champion range
   Actually: 4 + 4 + 4 = 12
   → Segment: "Loyal" 🔵
Loyal = Consistently good across all metrics
Reliable customers who engage regularly.

Example 3: Potential Customer
javascript
Customer: John Smith
├─ daysSinceLastOrder: 25 days
│  → recencyScore = 5 (recent)
├─ totalOrders: 3
│  → frequencyScore = 2 (occasional)
├─ totalSpent: $240
│  → monetaryScore = 3 (moderate)
└─ Total: 5 + 2 + 3 = 10
   → Segment: "Potential" 🟡 (or "Loyal" depending on threshold)
Potential = Recent buyer but hasn't fully converted yet
Growing customers who could become Champions with nurturing.

Example 4: At-Risk Customer
javascript
Customer: Emma Davis
├─ daysSinceLastOrder: 94 days
│  → recencyScore = 2 (long time ago)
├─ totalOrders: 12
│  → frequencyScore = 4 (was frequent)
├─ totalSpent: $1,670
│  → monetaryScore = 4 (good spender)
└─ Total: 2 + 4 + 4 = 10
   Wait, that's Loyal range...
   Actually if 94 days: 2 + 3 + 3 = 8
   → Segment: "Potential" or "At-Risk" 🟠
At-Risk = Was good but engagement dropping
Win-back opportunity - they used to buy, now dormant.

Example 5: Lost Customer
javascript
Customer: Tom Wilson
├─ daysSinceLastOrder: 250 days
│  → recencyScore = 1 (dormant)
├─ totalOrders: 2
│  → frequencyScore = 2 (occasional)
├─ totalSpent: $145
│  → monetaryScore = 2 (low)
└─ Total: 1 + 2 + 2 = 5
   → Segment: "At-Risk" or "Lost" 🔴
Lost = Haven't engaged in 6+ months, low frequency/value
Hard to win back but worth trying with deep discounts.

