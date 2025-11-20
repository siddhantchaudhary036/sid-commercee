"use client";

import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  // Get user data from Convex
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );
  
  // Redirect if not authenticated or onboarding not complete
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/');
    } else if (convexUser !== undefined) {
      // If user doesn't exist in Convex or hasn't completed onboarding, redirect
      if (!convexUser || !convexUser.onboardingCompleted) {
        router.push('/onboarding');
      }
    }
  }, [isLoaded, user, convexUser, router]);
  
  // Show loading while checking auth
  if (!isLoaded || !user || convexUser === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-md" />
            <span className="text-xl font-semibold text-gray-900">CommerceOS</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.emailAddresses[0]?.emailAddress}
            </span>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-gray-100 rounded-lg mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Dashboard Coming Soon
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Your data has been generated successfully! The dashboard interface 
            will be built in the next phase.
          </p>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-left">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              What's been created:
            </h3>
            
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                1,000 customers with RFM segmentation
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                5 customer segments (VIP, At-Risk, Champions, etc.)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                4 email campaigns with performance metrics
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                2 multi-step email flows
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                30 days of analytics snapshots
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                Historical campaign and flow performance data
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
