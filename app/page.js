"use client";

import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  // Get user data from Convex if authenticated
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );
  
  // Redirect authenticated users
  useEffect(() => {
    if (isLoaded && user && convexUser !== undefined) {
      // convexUser can be null (new user) or an object (existing user)
      if (convexUser?.onboardingCompleted) {
        router.push('/dashboard');
      } else {
        // New user or user who hasn't completed onboarding
        router.push('/onboarding');
      }
    }
  }, [isLoaded, user, convexUser, router]);
  
  // Show loading state while checking auth
  if (!isLoaded || (user && convexUser === undefined)) {
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
  
  // Only show landing page to unauthenticated users
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-md" />
            <span className="text-xl font-semibold text-gray-900">CommerceOS</span>
          </div>
          
          <div className="flex items-center gap-3">
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-5 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors">
                Sign Up
              </button>
            </SignUpButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center pt-24 pb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-8">
            <span className="text-xs font-medium text-gray-600">AI-Native Platform</span>
          </div>

          <h1 className="text-6xl font-bold text-gray-900 tracking-tight max-w-4xl mb-6">
            Email Marketing OS
            <br />
            <span className="text-gray-500">Built for Ecommerce</span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mb-12 leading-relaxed">
            The first AI-native customer data platform that doesn't just send emails—it learns what works, 
            tracks revenue, and optimizes your campaigns autonomously.
          </p>

          <div className="flex items-center gap-4">
            <SignUpButton mode="modal">
              <button className="px-8 py-4 text-base font-semibold text-white bg-black rounded-lg hover:bg-gray-800 transition-colors">
                Get Started Free
              </button>
            </SignUpButton>
            <button className="px-8 py-4 text-base font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Watch Demo
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-8">
            No credit card required • 1,000 free contacts
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-24 border-t border-gray-200">
          <div className="flex flex-col">
            <div className="w-12 h-12 bg-gray-900 rounded-lg mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Agentic AI Interface</h3>
            <p className="text-gray-600 leading-relaxed">
              Create segments, design campaigns, and build flows through natural language. 
              Our AI handles multi-step workflows autonomously.
            </p>
          </div>

          <div className="flex flex-col">
            <div className="w-12 h-12 bg-gray-900 rounded-lg mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Revenue Attribution</h3>
            <p className="text-gray-600 leading-relaxed">
              Know exactly which campaigns drive sales. Track revenue per recipient, 
              conversion rates, and ROI for every email sent.
            </p>
          </div>

          <div className="flex flex-col">
            <div className="w-12 h-12 bg-gray-900 rounded-lg mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Performance Intelligence</h3>
            <p className="text-gray-600 leading-relaxed">
              AI analyzes patterns across campaigns and provides proactive recommendations 
              to optimize send times, content, and targeting.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
