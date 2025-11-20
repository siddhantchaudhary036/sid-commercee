import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import type { ExtractedFeatures } from "@/lib/insights/featureExtractor";

export async function POST(request: Request) {
  try {
    const { features, userId } = await request.json();

    if (!features || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: features and userId" },
        { status: 400 }
      );
    }

    // Initialize Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Construct prompt with features
    const prompt = buildInsightPrompt(features);

    // Generate insights
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON response from Gemini
    let insights;
    try {
      // Remove markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      insights = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      return NextResponse.json(
        { error: "Failed to parse AI response", rawResponse: text },
        { status: 500 }
      );
    }

    // Note: Insights are stored on the client side after successful generation
    // This keeps the API route stateless and allows client to handle Convex mutations

    return NextResponse.json({
      success: true,
      insights: insights.insights || [],
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Insight generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

function buildInsightPrompt(features: ExtractedFeatures): string {
  const { sendTimeAnalysis, subjectLinePatterns, segmentPerformance, flowEffectiveness, revenueOpportunities, trends } = features;

  return `You are an expert email marketing analyst. Analyze the following performance data and generate 3-5 actionable insights.

# Performance Data

## Send Time Analysis
Best Day: ${sendTimeAnalysis.bestDay?.day || 'N/A'} (${sendTimeAnalysis.bestDay?.campaigns || 0} campaigns, $${sendTimeAnalysis.bestDay?.avgRevenue?.toFixed(2) || '0.00'} avg revenue, ${sendTimeAnalysis.bestDay?.avgOpenRate?.toFixed(1) || '0.0'}% open rate)
Best Hour: ${sendTimeAnalysis.bestHour?.hour || 'N/A'}:00 (${sendTimeAnalysis.bestHour?.campaigns || 0} campaigns, $${sendTimeAnalysis.bestHour?.avgRevenue?.toFixed(2) || '0.00'} avg revenue, ${sendTimeAnalysis.bestHour?.avgOpenRate?.toFixed(1) || '0.0'}% open rate)

All Days Performance:
${Object.entries(sendTimeAnalysis.byDayOfWeek).map(([day, stats]) => 
  `- ${day}: ${stats.campaigns} campaigns, $${stats.avgRevenue.toFixed(2)} avg revenue, ${stats.avgOpenRate.toFixed(1)}% open rate`
).join('\n')}

## Subject Line Patterns
- With Questions (?): ${subjectLinePatterns.withQuestions.count} campaigns, ${subjectLinePatterns.withQuestions.avgOpenRate.toFixed(1)}% open rate
- With Numbers: ${subjectLinePatterns.withNumbers.count} campaigns, ${subjectLinePatterns.withNumbers.avgOpenRate.toFixed(1)}% open rate
- With Emoji: ${subjectLinePatterns.withEmoji.count} campaigns, ${subjectLinePatterns.withEmoji.avgOpenRate.toFixed(1)}% open rate
- Average Length: ${Math.round(subjectLinePatterns.avgLength)} characters

## Segment Performance
${segmentPerformance.slice(0, 5).map(seg => 
  `- ${seg.name}: $${seg.revenuePerRecipient.toFixed(2)} per recipient (${seg.campaigns} campaigns, ${seg.avgOpenRate.toFixed(1)}% open rate)`
).join('\n')}

## Flow Effectiveness
${Object.entries(flowEffectiveness.byStepCount).map(([steps, stats]) => 
  `- ${steps}-email flows: ${stats.avgCompletion.toFixed(1)}% completion rate (${stats.count} flows)`
).join('\n')}
- Average drop-off: Day ${Math.round(flowEffectiveness.avgDropOffDay)}
${flowEffectiveness.bestPerformingFlow ? `- Best performing flow: ${flowEffectiveness.bestPerformingFlow}` : ''}

## Revenue Opportunities
${revenueOpportunities.map(opp => 
  `- ${opp.type.replace(/_/g, ' ')}: ${opp.count} customers, $${Math.round(opp.potentialRevenue).toLocaleString()} potential revenue`
).join('\n')}

## Trends
- Revenue growth: ${trends.revenueGrowth > 0 ? '+' : ''}${trends.revenueGrowth}%
- Open rate trend: ${trends.openRateTrend > 0 ? '+' : ''}${trends.openRateTrend}%
- Customer growth: ${trends.customerGrowth > 0 ? '+' : ''}${trends.customerGrowth}%

# Instructions

Generate 3-5 insights in the following JSON format. Each insight must include:
- type: One of ["send_time", "subject_line", "segment_performance", "flow_effectiveness", "revenue_opportunity"]
- priority: "high" (expected impact >$1000), "medium" ($200-1000), or "low" (<$200)
- title: Short, compelling headline (max 60 chars)
- finding: What pattern you discovered (2-3 sentences)
- evidence: Specific data points supporting this (with numbers)
- whyItMatters: Business impact explanation (1-2 sentences)
- recommendation: Specific action to take (1-2 sentences)
- expectedImpact: Quantified outcome (e.g., "+$1,200/month" or "+10% open rate")

Focus on:
1. Statistically significant patterns (sample size >5)
2. Actionable recommendations (user can implement immediately)
3. Quantified impacts (always include numbers)
4. Prioritize high-impact insights

Return ONLY valid JSON with no markdown formatting:
{
  "insights": [
    {
      "type": "send_time",
      "priority": "high",
      "title": "...",
      "finding": "...",
      "evidence": "...",
      "whyItMatters": "...",
      "recommendation": "...",
      "expectedImpact": "..."
    }
  ]
}`;
}
