/**
 * LAYER 2: FEATURE EXTRACTION
 * Transforms raw data into analyzable features for AI insights
 */

interface CampaignPerformance {
  campaignId: any;
  segmentName: string;
  subject: string;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
  revenuePerRecipient: number;
  dayOfWeek: string;
  hourOfDay: number;
  segmentSize: number;
}

interface FlowPerformance {
  flowId: any;
  flowName: string;
  triggerType: string;
  numberOfSteps: number;
  completionRate: number;
  totalRevenue: number;
  revenuePerRecipient: number;
  averageTimeToComplete: number;
  dropOffPoint: string;
}

interface AnalyticsSnapshot {
  snapshotDate: string;
  metrics: {
    totalRevenue: number;
    avgCampaignOpenRate: number;
    totalCustomers: number;
    activeCustomers: number;
  };
}

interface RawInsightsData {
  campaignPerformance: CampaignPerformance[];
  flowPerformance: FlowPerformance[];
  campaigns: any[];
  flows: any[];
  segments: any[];
  customerSummary: {
    total: number;
    bySegment: Record<string, number>;
    avgLTV: number;
  };
  snapshots: AnalyticsSnapshot[];
}

export interface ExtractedFeatures {
  sendTimeAnalysis: SendTimeAnalysis;
  subjectLinePatterns: SubjectLinePatterns;
  segmentPerformance: SegmentPerformance[];
  flowEffectiveness: FlowEffectiveness;
  revenueOpportunities: RevenueOpportunity[];
  trends: TrendAnalysis;
}

interface SendTimeAnalysis {
  byDayOfWeek: Record<string, DayStats>;
  byHourOfDay: Record<number, HourStats>;
  bestDay: { day: string; avgRevenue: number; campaigns: number; avgOpenRate: number } | null;
  bestHour: { hour: number; avgRevenue: number; campaigns: number; avgOpenRate: number } | null;
}

interface DayStats {
  totalRevenue: number;
  campaigns: number;
  avgRevenue: number;
  avgOpenRate: number;
}

interface HourStats {
  totalRevenue: number;
  campaigns: number;
  avgRevenue: number;
  avgOpenRate: number;
}

interface SubjectLinePatterns {
  withQuestions: { count: number; avgOpenRate: number };
  withNumbers: { count: number; avgOpenRate: number };
  withEmoji: { count: number; avgOpenRate: number };
  avgLength: number;
}

interface SegmentPerformance {
  name: string;
  revenuePerRecipient: number;
  campaigns: number;
  avgOpenRate: number;
}

interface FlowEffectiveness {
  byStepCount: Record<number, { avgCompletion: number; count: number }>;
  avgDropOffDay: number;
  bestPerformingFlow: string | null;
}

interface RevenueOpportunity {
  type: string;
  count: number;
  potentialRevenue: number;
}

interface TrendAnalysis {
  revenueGrowth: number;
  openRateTrend: number;
  customerGrowth: number;
}

export function extractFeatures(rawData: RawInsightsData): ExtractedFeatures {
  return {
    sendTimeAnalysis: analyzeSendTimes(rawData.campaignPerformance),
    subjectLinePatterns: analyzeSubjectLines(rawData.campaignPerformance),
    segmentPerformance: analyzeSegments(rawData.campaignPerformance),
    flowEffectiveness: analyzeFlows(rawData.flowPerformance),
    revenueOpportunities: findOpportunities(rawData),
    trends: analyzeTrends(rawData.snapshots),
  };
}

/**
 * Analyze send times to find optimal days and hours
 */
function analyzeSendTimes(campaignPerformance: CampaignPerformance[]): SendTimeAnalysis {
  const byDay: Record<string, DayStats> = {};
  const byHour: Record<number, HourStats> = {};

  for (const campaign of campaignPerformance) {
    const day = campaign.dayOfWeek;
    const hour = campaign.hourOfDay;

    // Group by day
    if (!byDay[day]) {
      byDay[day] = { totalRevenue: 0, campaigns: 0, avgRevenue: 0, avgOpenRate: 0 };
    }
    byDay[day].totalRevenue += campaign.revenue;
    byDay[day].campaigns += 1;
    byDay[day].avgOpenRate += campaign.openRate;

    // Group by hour
    if (!byHour[hour]) {
      byHour[hour] = { totalRevenue: 0, campaigns: 0, avgRevenue: 0, avgOpenRate: 0 };
    }
    byHour[hour].totalRevenue += campaign.revenue;
    byHour[hour].campaigns += 1;
    byHour[hour].avgOpenRate += campaign.openRate;
  }

  // Calculate averages
  for (const day in byDay) {
    byDay[day].avgRevenue = byDay[day].totalRevenue / byDay[day].campaigns;
    byDay[day].avgOpenRate = byDay[day].avgOpenRate / byDay[day].campaigns;
  }

  for (const hour in byHour) {
    byHour[hour].avgRevenue = byHour[hour].totalRevenue / byHour[hour].campaigns;
    byHour[hour].avgOpenRate = byHour[hour].avgOpenRate / byHour[hour].campaigns;
  }

  // Find best times
  const bestDay = Object.entries(byDay)
    .sort(([, a], [, b]) => b.avgRevenue - a.avgRevenue)[0];

  const bestHour = Object.entries(byHour)
    .sort(([, a], [, b]) => b.avgRevenue - a.avgRevenue)[0];

  return {
    byDayOfWeek: byDay,
    byHourOfDay: byHour,
    bestDay: bestDay ? { day: bestDay[0], ...bestDay[1] } : null,
    bestHour: bestHour ? { hour: parseInt(bestHour[0]), ...bestHour[1] } : null,
  };
}

/**
 * Analyze subject line patterns
 */
function analyzeSubjectLines(campaignPerformance: CampaignPerformance[]): SubjectLinePatterns {
  let withQuestions = { count: 0, totalOpenRate: 0 };
  let withNumbers = { count: 0, totalOpenRate: 0 };
  let withEmoji = { count: 0, totalOpenRate: 0 };
  let totalLength = 0;

  for (const campaign of campaignPerformance) {
    const subject = campaign.subject;
    totalLength += subject.length;

    // Check for question marks
    if (subject.includes('?')) {
      withQuestions.count++;
      withQuestions.totalOpenRate += campaign.openRate;
    }

    // Check for numbers
    if (/\d/.test(subject)) {
      withNumbers.count++;
      withNumbers.totalOpenRate += campaign.openRate;
    }

    // Check for emoji (basic check)
    if (/[\u{1F300}-\u{1F9FF}]/u.test(subject)) {
      withEmoji.count++;
      withEmoji.totalOpenRate += campaign.openRate;
    }
  }

  return {
    withQuestions: {
      count: withQuestions.count,
      avgOpenRate: withQuestions.count > 0 ? withQuestions.totalOpenRate / withQuestions.count : 0,
    },
    withNumbers: {
      count: withNumbers.count,
      avgOpenRate: withNumbers.count > 0 ? withNumbers.totalOpenRate / withNumbers.count : 0,
    },
    withEmoji: {
      count: withEmoji.count,
      avgOpenRate: withEmoji.count > 0 ? withEmoji.totalOpenRate / withEmoji.count : 0,
    },
    avgLength: campaignPerformance.length > 0 ? totalLength / campaignPerformance.length : 0,
  };
}

/**
 * Analyze segment performance
 */
function analyzeSegments(campaignPerformance: CampaignPerformance[]): SegmentPerformance[] {
  const segmentMap: Record<string, { totalRevenue: number; totalRecipients: number; campaigns: number; totalOpenRate: number }> = {};

  for (const campaign of campaignPerformance) {
    const segment = campaign.segmentName;

    if (!segmentMap[segment]) {
      segmentMap[segment] = { totalRevenue: 0, totalRecipients: 0, campaigns: 0, totalOpenRate: 0 };
    }

    segmentMap[segment].totalRevenue += campaign.revenue;
    segmentMap[segment].totalRecipients += campaign.segmentSize;
    segmentMap[segment].campaigns += 1;
    segmentMap[segment].totalOpenRate += campaign.openRate;
  }

  return Object.entries(segmentMap)
    .map(([name, stats]) => ({
      name,
      revenuePerRecipient: stats.totalRecipients > 0 ? stats.totalRevenue / stats.totalRecipients : 0,
      campaigns: stats.campaigns,
      avgOpenRate: stats.campaigns > 0 ? stats.totalOpenRate / stats.campaigns : 0,
    }))
    .sort((a, b) => b.revenuePerRecipient - a.revenuePerRecipient);
}

/**
 * Analyze flow effectiveness
 */
function analyzeFlows(flowPerformance: FlowPerformance[]): FlowEffectiveness {
  const byStepCount: Record<number, { totalCompletion: number; count: number }> = {};
  let totalDropOffDays = 0;
  let bestFlow: { name: string; revenue: number } | null = null;

  for (const flow of flowPerformance) {
    const steps = flow.numberOfSteps;

    if (!byStepCount[steps]) {
      byStepCount[steps] = { totalCompletion: 0, count: 0 };
    }

    byStepCount[steps].totalCompletion += flow.completionRate;
    byStepCount[steps].count += 1;

    totalDropOffDays += flow.averageTimeToComplete;

    if (!bestFlow || flow.totalRevenue > bestFlow.revenue) {
      bestFlow = { name: flow.flowName, revenue: flow.totalRevenue };
    }
  }

  const byStepCountResult: Record<number, { avgCompletion: number; count: number }> = {};
  for (const [steps, stats] of Object.entries(byStepCount)) {
    byStepCountResult[parseInt(steps)] = {
      avgCompletion: stats.count > 0 ? stats.totalCompletion / stats.count : 0,
      count: stats.count,
    };
  }

  return {
    byStepCount: byStepCountResult,
    avgDropOffDay: flowPerformance.length > 0 ? totalDropOffDays / flowPerformance.length : 0,
    bestPerformingFlow: bestFlow?.name || null,
  };
}

/**
 * Find revenue opportunities
 */
function findOpportunities(rawData: RawInsightsData): RevenueOpportunity[] {
  const opportunities: RevenueOpportunity[] = [];

  // At-risk customers (Champions or Loyal who haven't ordered recently)
  const atRiskCount = rawData.customerSummary.bySegment['At-Risk'] || 0;
  if (atRiskCount > 0) {
    opportunities.push({
      type: 'at_risk_customers',
      count: atRiskCount,
      potentialRevenue: atRiskCount * rawData.customerSummary.avgLTV * 0.3, // 30% recovery estimate
    });
  }

  // Lost customers
  const lostCount = rawData.customerSummary.bySegment['Lost'] || 0;
  if (lostCount > 0) {
    opportunities.push({
      type: 'lost_customers',
      count: lostCount,
      potentialRevenue: lostCount * rawData.customerSummary.avgLTV * 0.15, // 15% recovery estimate
    });
  }

  // Potential loyalists (high frequency, lower monetary)
  const potentialCount = rawData.customerSummary.bySegment['Potential Loyalist'] || 0;
  if (potentialCount > 0) {
    opportunities.push({
      type: 'potential_loyalists',
      count: potentialCount,
      potentialRevenue: potentialCount * rawData.customerSummary.avgLTV * 0.5, // 50% upsell estimate
    });
  }

  return opportunities.sort((a, b) => b.potentialRevenue - a.potentialRevenue);
}

/**
 * Analyze trends from snapshots
 */
function analyzeTrends(snapshots: AnalyticsSnapshot[]): TrendAnalysis {
  if (snapshots.length < 2) {
    return {
      revenueGrowth: 0,
      openRateTrend: 0,
      customerGrowth: 0,
    };
  }

  // Sort by date (newest first, so reverse for oldest first)
  const sorted = [...snapshots].reverse();
  const oldest = sorted[0];
  const newest = sorted[sorted.length - 1];

  const revenueGrowth = oldest.metrics.totalRevenue > 0
    ? ((newest.metrics.totalRevenue - oldest.metrics.totalRevenue) / oldest.metrics.totalRevenue) * 100
    : 0;

  const openRateTrend = oldest.metrics.avgCampaignOpenRate > 0
    ? ((newest.metrics.avgCampaignOpenRate - oldest.metrics.avgCampaignOpenRate) / oldest.metrics.avgCampaignOpenRate) * 100
    : 0;

  const customerGrowth = oldest.metrics.totalCustomers > 0
    ? ((newest.metrics.totalCustomers - oldest.metrics.totalCustomers) / oldest.metrics.totalCustomers) * 100
    : 0;

  return {
    revenueGrowth: Math.round(revenueGrowth * 10) / 10,
    openRateTrend: Math.round(openRateTrend * 10) / 10,
    customerGrowth: Math.round(customerGrowth * 10) / 10,
  };
}
