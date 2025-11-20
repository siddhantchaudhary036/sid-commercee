"use client";

import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function SettingsPage() {
  const { user } = useUser();
  
  const convexUserId = useQuery(
    api.users.getConvexUserId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-lg font-semibold text-gray-900 mb-8">Settings</h1>
        
        {/* Account Information */}
        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-6">Account Information</h2>
          
          <div className="space-y-6">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
                Email Address
              </label>
              <div className="text-sm text-gray-900">
                {user?.emailAddresses[0]?.emailAddress || '—'}
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
                Full Name
              </label>
              <div className="text-sm text-gray-900">
                {user?.fullName || convexUser?.name || '—'}
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
                User ID
              </label>
              <div className="text-sm text-gray-500 font-mono">
                {convexUserId || '—'}
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
                Date Joined
              </label>
              <div className="text-sm text-gray-900">
                {formatDate(convexUser?.createdAt)}
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
                Onboarding Status
              </label>
              <div className="text-sm text-gray-900">
                {convexUser?.onboardingCompleted ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-900 rounded-full" />
                    Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full" />
                    Pending
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
                Data Generated
              </label>
              <div className="text-sm text-gray-900">
                {convexUser?.dataGenerated ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-900 rounded-full" />
                    Yes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full" />
                    No
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
                Plan
              </label>
              <div className="text-sm text-gray-900">
                {convexUser?.plan || 'Free'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Preferences */}
        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-6">Preferences</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Email Notifications
                </div>
                <div className="text-xs text-gray-500">
                  Receive updates about your campaigns
                </div>
              </div>
              <button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Configure
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  AI Suggestions
                </div>
                <div className="text-xs text-gray-500">
                  Enable proactive AI recommendations
                </div>
              </div>
              <button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Configure
              </button>
            </div>
          </div>
        </div>
        
        {/* Danger Zone */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-6">Danger Zone</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Delete All Data
                </div>
                <div className="text-xs text-gray-500">
                  Permanently delete all customers, campaigns, and flows
                </div>
              </div>
              <button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Delete
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Delete Account
                </div>
                <div className="text-xs text-gray-500">
                  Permanently delete your account and all data
                </div>
              </div>
              <button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
