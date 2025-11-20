"use client";

import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import { Sparkles, TrendingUp, Users, Mail, Workflow, Settings, Info, X } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useUser();
  const [message, setMessage] = useState('');
  const [showInsightInfo, setShowInsightInfo] = useState(null);
  
  const convexUserId = useQuery(
    api.users.getConvexUserId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  
  const stats = useQuery(
    api.dashboard.getOverviewStats,
    convexUserId ? { userId: convexUserId } : "skip"
  );
  
  const insights = useQuery(
    api.dashboard.getInsightsPreview,
    convexUserId ? { userId: convexUserId } : "skip"
  );
  
  const activities = useQuery(
    api.dashboard.getRecentActivity,
    convexUserId ? { userId: convexUserId } : "skip"
  );
  
  const handlePromptClick = (prompt) => {
    setMessage(prompt);
  };
  
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black rounded" />
            <span className="text-sm font-semibold text-gray-900">CommerceOS</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">
              {user?.emailAddresses[0]?.emailAddress}
            </span>
          </div>
        </div>
      </header>
      
      {/* Main Content - 3 Column Layout */}
      <div className="flex h-[calc(100vh-57px)]">
        {/* Left Sidebar - Navigation */}
        <div className="w-48 border-r border-gray-200">
          <nav className="p-6">
            <div className="space-y-1">
              <a
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg"
              >
                <TrendingUp className="w-4 h-4" />
                Dashboard
              </a>
              
              <a
                href="/campaigns"
                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Mail className="w-4 h-4" />
                Campaigns
              </a>
              
              <a
                href="/flows"
                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Workflow className="w-4 h-4" />
                Flows
              </a>
              
              <a
                href="/segments"
                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Users className="w-4 h-4" />
                Segments
              </a>
              
              <a
                href="/customers"
                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Users className="w-4 h-4" />
                Customers
              </a>
              
              <a
                href="/emails"
                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Mail className="w-4 h-4" />
                Emails
              </a>
              
              <a
                href="/insights"
                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Insights
              </a>
              
              <a
                href="/settings"
                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </a>
            </div>
          </nav>
        </div>
        
        {/* Center - AI Chat Interface */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-12">
            <div className="max-w-2xl mx-auto">
              <div className="mb-16">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  What would you like to do today?
                </h2>
                <p className="text-sm text-gray-500">
                  Ask me anything about your customers, campaigns, or performance
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handlePromptClick("Show me customers at high churn risk")}
                  className="border border-gray-200 rounded-lg p-6 text-left hover:border-gray-300 transition-colors"
                >
                  <Users className="w-5 h-5 text-gray-400 mb-4" />
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    Analyze Customers
                  </div>
                  <div className="text-xs text-gray-500 leading-relaxed">
                    Show me customers at high churn risk
                  </div>
                </button>
                
                <button
                  onClick={() => handlePromptClick("Create a segment for VIP customers")}
                  className="border border-gray-200 rounded-lg p-6 text-left hover:border-gray-300 transition-colors"
                >
                  <TrendingUp className="w-5 h-5 text-gray-400 mb-4" />
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    Create Segment
                  </div>
                  <div className="text-xs text-gray-500 leading-relaxed">
                    Create a segment for VIP customers
                  </div>
                </button>
                
                <button
                  onClick={() => handlePromptClick("Create a win-back campaign")}
                  className="border border-gray-200 rounded-lg p-6 text-left hover:border-gray-300 transition-colors"
                >
                  <Mail className="w-5 h-5 text-gray-400 mb-4" />
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    Design Campaign
                  </div>
                  <div className="text-xs text-gray-500 leading-relaxed">
                    Create a win-back campaign
                  </div>
                </button>
                
                <button
                  onClick={() => handlePromptClick("Build a 3-email welcome series")}
                  className="border border-gray-200 rounded-lg p-6 text-left hover:border-gray-300 transition-colors"
                >
                  <Workflow className="w-5 h-5 text-gray-400 mb-4" />
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    Build Flow
                  </div>
                  <div className="text-xs text-gray-500 leading-relaxed">
                    Build a 3-email welcome series
                  </div>
                </button>
                
                <button
                  onClick={() => handlePromptClick("What's working best right now?")}
                  className="border border-gray-200 rounded-lg p-6 text-left hover:border-gray-300 transition-colors"
                >
                  <Sparkles className="w-5 h-5 text-gray-400 mb-4" />
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    Get Insights
                  </div>
                  <div className="text-xs text-gray-500 leading-relaxed">
                    What's working best right now?
                  </div>
                </button>
                
                <button
                  onClick={() => handlePromptClick("How many customers in California?")}
                  className="border border-gray-200 rounded-lg p-6 text-left hover:border-gray-300 transition-colors"
                >
                  <TrendingUp className="w-5 h-5 text-gray-400 mb-4" />
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    Ask Questions
                  </div>
                  <div className="text-xs text-gray-500 leading-relaxed">
                    How many customers in California?
                  </div>
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 p-6">
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask anything..."
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <button className="px-5 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Sidebar - Overview Panel */}
        <div className="w-64 border-l border-gray-200 overflow-y-auto">
          <div className="p-8 border-b border-gray-200">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-6">
              Overview
            </h3>
            
            <div className="space-y-6">
              <div>
                <div className="text-2xl font-semibold text-gray-900 mb-1">
                  {stats?.totalCustomers?.toLocaleString() || '—'}
                </div>
                <div className="text-xs text-gray-500">Customers</div>
              </div>
              
              <div>
                <div className="text-2xl font-semibold text-gray-900 mb-1">
                  ${stats?.totalRevenue?.toLocaleString() || '—'}
                </div>
                <div className="text-xs text-gray-500">Total Revenue</div>
              </div>
              
             
            </div>
          </div>
          
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-4 h-4 text-gray-400" />
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                AI Discovered
              </h3>
            </div>
            
            <div className="space-y-4">
              {insights && insights.length > 0 ? (
                insights.map((insight, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 relative">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="text-sm font-medium text-gray-900">
                        {insight.title}
                      </div>
                      <button
                        onClick={() => setShowInsightInfo(showInsightInfo === idx ? null : idx)}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    {showInsightInfo === idx && (
                      <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 leading-relaxed">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="font-medium text-gray-900">How this was calculated</div>
                          <button
                            onClick={() => setShowInsightInfo(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        {insight.type === 'send_time' ? (
                          <div className="space-y-2">
                            <p>We analyzed 25 historical campaign performance records from your account.</p>
                            <p>Each campaign has a send date, day of week, and revenue generated.</p>
                            <p>We grouped campaigns by day of week and calculated the average revenue for each day.</p>
                            <p className="font-medium text-gray-900">
                              Result: {insight.title.split(' ')[0]} had the highest average revenue per campaign.
                            </p>
                          </div>
                        ) : insight.type === 'segment_opportunity' ? (
                          <div className="space-y-2">
                            <p>We queried all customers in your database with high churn risk.</p>
                            <p>High churn risk = customers who have made 5+ orders but haven't ordered in 90+ days.</p>
                            <p className="font-medium text-gray-900">
                              Found: {insight.title.split(' ')[0]} customers matching this criteria.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-600 mb-3 leading-relaxed">
                      {insight.description}
                    </div>
                    <button
                      onClick={() => handlePromptClick(`Tell me more about ${insight.title.toLowerCase()}`)}
                      className="text-xs text-gray-700 hover:text-black font-medium"
                    >
                      Ask AI →
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-400">
                  No insights yet
                </div>
              )}
            </div>
          </div>
          
          <div className="p-8">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-6">
              Recent Activity
            </h3>
            
            <div className="space-y-5">
              {activities && activities.length > 0 ? (
                activities.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900">
                        {activity.title}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-1">
                        {activity.description}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatTimestamp(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-400">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
