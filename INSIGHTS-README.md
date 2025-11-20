# Insights Page - Quick Reference

## What It Does
AI-powered analysis of your marketing performance that generates actionable recommendations with quantified impacts.

## How to Use
1. Navigate to `/insights`
2. Click "Generate Insights" button
3. Wait 5-10 seconds for AI analysis
4. Review insights grouped by priority
5. Implement recommendations in your campaigns

## Features
- ✅ AI-powered pattern detection
- ✅ Quantified impact estimates
- ✅ Priority-based recommendations
- ✅ 7-day insight caching
- ✅ Filter by priority and type
- ✅ Clean, minimal design
- ✅ Polished empty state
- ✅ Informative loading state

## Architecture

### Three Layers
1. **Data Fetching** (`convex/insights.ts`)
   - Pulls raw data from 7 sources
   - Last 90 days of performance

2. **Feature Extraction** (`lib/insights/featureExtractor.ts`)
   - Analyzes send times, subject lines, segments, flows
   - Identifies opportunities and trends

3. **AI Generation** (`app/api/insights/generate/route.ts`)
   - Uses Gemini 2.0 Flash
   - Generates 3-5 actionable insights

### Storage
- Insights stored in Convex (`generatedInsights` table)
- Auto-expires after 7 days
- One-click regeneration

## Insight Types
1. **Send Time** - Optimal days/hours for campaigns
2. **Subject Line** - Patterns that drive opens
3. **Segment Performance** - Most valuable customer groups
4. **Flow Effectiveness** - Automation optimization
5. **Revenue Opportunity** - Untapped revenue sources

## Priority Levels
- **High**: Expected impact > $1,000/month
- **Medium**: Expected impact $200-$1,000/month
- **Low**: Expected impact < $200/month

## Files
```
convex/
  insights.ts                    # Data + storage
lib/
  insights/
    featureExtractor.ts          # Analysis helpers
app/
  api/
    insights/
      generate/
        route.ts                 # AI generation
  insights/
    page.js                      # UI
docs/
  insights-final-complete.md     # Full documentation
  insights-quick-start.md        # User guide
```

## Environment
Required in `.env.local`:
```
GEMINI_API_KEY=your_api_key_here
```

## Dependencies
```json
{
  "@google/generative-ai": "^0.21.0",
  "react-hot-toast": "^2.4.1"
}
```

## Cost
~$0.0004 per insight generation (very affordable!)

## Testing
1. Visit `/insights`
2. Click "Generate Insights"
3. Verify insights display
4. Test filters
5. Regenerate to confirm storage works

## Support
See full documentation in `docs/insights-final-complete.md`
