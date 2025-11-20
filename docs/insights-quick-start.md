# Insights Page - Quick Start Guide

## What Is It?

The Insights Page uses AI to analyze your marketing performance and generate actionable recommendations.

## How to Use

1. Navigate to `/insights` in your browser
2. Click "Generate Insights with AI" button
3. Wait 5-10 seconds for analysis
4. Review AI-generated insights with recommendations
5. Implement recommendations in your campaigns

## What You'll See

### High Priority Insights
- Expected impact > $1,000/month
- Most important to implement first
- Black badge

### Medium Priority Insights
- Expected impact $200-$1,000/month
- Good opportunities
- Gray badge

### Low Priority Insights
- Expected impact < $200/month
- Nice to have improvements
- Light gray badge

## Insight Types

1. **Send Time** - When to send campaigns for best results
2. **Subject Line** - What subject line patterns work best
3. **Segment Performance** - Which customer segments are most valuable
4. **Flow Effectiveness** - How to optimize your automation flows
5. **Revenue Opportunity** - Where to find untapped revenue

## Each Insight Includes

- **Finding**: What pattern was discovered
- **Evidence**: Specific data supporting the finding
- **Why It Matters**: Business impact explanation
- **Recommendation**: Specific action to take
- **Expected Impact**: Quantified outcome (e.g., "+$1,200/month")

## Example Use Case

### Insight Generated:
"Tuesday 10 AM drives 3x more revenue than average send times. Recommendation: Schedule all promotional campaigns for Tuesday 10 AM."

### How to Apply:
1. Go to `/campaigns/new`
2. Create your campaign
3. Schedule for Tuesday at 10:00 AM
4. Monitor results to validate the insight

## Technical Details

### Data Sources
- Last 90 days of campaign performance
- Last 90 days of flow performance
- Customer segments and RFM data
- Historical analytics snapshots

### AI Model
- Gemini 2.0 Flash (fast, cost-effective)
- Analyzes patterns across all data sources
- Generates 3-5 insights per analysis

### Regeneration
- Click button anytime to regenerate
- Useful after sending new campaigns
- Fresh data = fresh insights

## Troubleshooting

### No Insights Generated
- Check that you have campaign performance data
- Verify GEMINI_API_KEY is set in .env.local
- Check browser console for errors

### Insights Seem Generic
- Need more campaign data (>10 campaigns)
- Ensure campaigns have varied send times
- Try different segments for better patterns

### API Error
- Verify GEMINI_API_KEY is valid
- Check API quota limits
- Review server logs for details

## Files Reference

- **Data Fetching**: `convex/insights.ts`
- **Feature Extraction**: `lib/insights/featureExtractor.ts`
- **AI Generation**: `app/api/insights/generate/route.ts`
- **UI**: `app/insights/page.js`

## Environment Setup

Required in `.env.local`:
```
GEMINI_API_KEY=your_api_key_here
```

Get your API key from: https://aistudio.google.com/app/apikey

## Cost Estimate

Gemini 2.0 Flash pricing (as of Nov 2024):
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens

Typical insight generation:
- ~2,000 input tokens
- ~1,000 output tokens
- Cost: ~$0.0004 per generation

Very affordable for on-demand usage!
