"use client";

import { useUser, useClerk } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState, useRef, useEffect } from 'react';
import { Sparkles, Users, Mail, Workflow, Settings, Info, X, Bot, User as UserIcon, LogOut } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [showInsightInfo, setShowInsightInfo] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  
  const saveConversation = useMutation(api.aiConversations.saveConversation);
  
  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);
  
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
  
  const conversationHistoryList = useQuery(
    api.dashboard.getConversationHistory,
    convexUserId ? { userId: convexUserId } : "skip"
  );
  
  const handlePromptClick = (prompt) => {
    setMessage(prompt);
  };
  
  const handleSendMessage = async () => {
    if (!message.trim() || !convexUserId || isLoading) return;
    
    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);
    
    // Add user message to history
    const now = new Date().toISOString();
    const newHistory = [
      ...conversationHistory,
      { role: 'user', content: userMessage, timestamp: now }
    ];
    setConversationHistory(newHistory);
    
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          userId: convexUserId,
          conversationHistory: conversationHistory.slice(-6), // Last 3 exchanges
          stream: true
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let finalResponse = '';
      let workflowSteps = [];
      
      // Add a placeholder message that we'll update
      setConversationHistory([
        ...newHistory,
        { 
          role: 'assistant', 
          content: 'Planning workflow...',
          timestamp: new Date().toISOString()
        }
      ]);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'plan') {
                workflowSteps = data.steps;
                const stepsList = data.steps.join(' → ');
                finalResponse = `**Executing workflow:** ${stepsList}\n\n`;
                setConversationHistory([
                  ...newHistory,
                  { 
                    role: 'assistant', 
                    content: finalResponse,
                    timestamp: new Date().toISOString()
                  }
                ]);
              } else if (data.type === 'step_start') {
                finalResponse += `\n**Step ${data.step}/${data.total}:** Running ${data.agent}...`;
                setConversationHistory([
                  ...newHistory,
                  { 
                    role: 'assistant', 
                    content: finalResponse,
                    timestamp: new Date().toISOString()
                  }
                ]);
              } else if (data.type === 'step_complete') {
                finalResponse += ` ✅\n`;
                setConversationHistory([
                  ...newHistory,
                  { 
                    role: 'assistant', 
                    content: finalResponse,
                    timestamp: new Date().toISOString()
                  }
                ]);
              } else if (data.type === 'complete') {
                finalResponse += '\n\n---\n\n**All steps completed successfully!**';
              }
            } catch (e) {
              console.error('Error parsing SSE:', e);
            }
          }
        }
      }
      
      // Final update
      const updatedHistory = [
        ...newHistory,
        { 
          role: 'assistant', 
          content: finalResponse || 'Workflow completed.',
          timestamp: new Date().toISOString()
        }
      ];
      setConversationHistory(updatedHistory);
      
      // Save conversation to database
      const conversationId = await saveConversation({
        userId: convexUserId,
        conversationId: currentConversationId,
        messages: updatedHistory,
        conversationType: "general",
        status: "active"
      });
      
      // Set conversation ID if this is a new conversation
      if (!currentConversationId) {
        setCurrentConversationId(conversationId);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to get response. Please try again.');
      setConversationHistory([
        ...newHistory,
        { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-right" />
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
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
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
                <Workflow className="w-4 h-4" />
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
              {conversationHistory.length === 0 ? (
                <>
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
                      <Users className="w-5 h-5 text-gray-400 mb-4" />
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
                  </div>
                  
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
                      Complex Tasks (Orchestrator)
                    </div>
                    <div className="space-y-3">
                      <button
                        onClick={() => handlePromptClick("Create a win-back campaign for high-value customers who haven't purchased in 90 days")}
                        className="w-full border border-gray-200 rounded-lg p-4 text-left hover:border-gray-300 transition-colors"
                      >
                        <div className="text-xs text-gray-900 leading-relaxed">
                          Create a win-back campaign for high-value customers who haven't purchased in 90 days
                        </div>
                      </button>
                      <button
                        onClick={() => handlePromptClick("Build a Black Friday campaign for my loyal customers with 25% off")}
                        className="w-full border border-gray-200 rounded-lg p-4 text-left hover:border-gray-300 transition-colors"
                      >
                        <div className="text-xs text-gray-900 leading-relaxed">
                          Build a Black Friday campaign for my loyal customers with 25% off
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  {conversationHistory.map((msg, idx) => (
                    <div key={idx} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                      <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-black text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'} rounded-lg p-4`}>
                        {msg.role === 'user' ? (
                          <div className="flex items-start gap-3">
                            <UserIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </div>
                          </div>
                        ) : (
                          <>
                            {msg.agent && (
                              <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                                <Bot className="w-3 h-3" />
                                <span className="font-medium">
                                  {msg.agent === 'customer_analyst' && 'Customer Analyst'}
                                  {msg.agent === 'segments' && 'Segments Specialist'}
                                  {msg.agent === 'campaigns' && 'Campaign Manager'}
                                  {msg.agent === 'emails' && 'Email Copywriter'}
                                  {msg.agent === 'flows' && 'Flow Builder'}
                                  {msg.agent === 'orchestrator' && 'Task Orchestrator'}
                                </span>
                              </div>
                            )}
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                          <span>Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t border-gray-200 p-6">
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isLoading || !message.trim()}
                  className="px-5 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
              {conversationHistory.length > 0 && (
                <button
                  onClick={() => {
                    setConversationHistory([]);
                    setCurrentConversationId(null);
                  }}
                  className="mt-3 text-xs text-gray-500 hover:text-gray-700"
                >
                  New conversation
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Sidebar - Chat History */}
        <div className="w-64 border-l border-gray-200 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
              Chat History
            </h3>
            
            <div className="space-y-2">
              {conversationHistoryList && conversationHistoryList.length > 0 ? (
                conversationHistoryList.map((conv) => {
                  const isActive = currentConversationId === conv._id;
                  return (
                    <button
                      key={conv._id}
                      onClick={async () => {
                        // Load conversation
                        const fullConv = await fetch(`/api/conversations/${conv._id}`).then(r => r.json());
                        if (fullConv.messages) {
                          setConversationHistory(fullConv.messages);
                          setCurrentConversationId(conv._id);
                        }
                      }}
                      className={`w-full text-left border rounded-lg p-3 hover:border-gray-300 hover:bg-gray-50 transition-colors ${
                        isActive ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="text-xs text-gray-900 mb-2 line-clamp-2 leading-relaxed">
                        {conv.preview}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {conv.messageCount} messages
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(conv.updatedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-xs text-gray-400 text-center py-8">
                  No conversations yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
