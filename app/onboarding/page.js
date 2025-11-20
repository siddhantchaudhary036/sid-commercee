"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function OnboardingPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState('');
  const router = useRouter();
  const { user, isLoaded } = useUser();
  
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const seedDatabase = useMutation(api.seed.seedDatabase);
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  
  // Check if user already completed onboarding
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );
  
  // Redirect if not authenticated or already completed onboarding
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/');
    } else if (convexUser !== undefined && convexUser?.onboardingCompleted) {
      router.push('/dashboard');
    }
  }, [isLoaded, user, convexUser, router]);
  
  const handleGenerateData = async () => {
    if (!user || isSeeding) return;
    
    setIsSeeding(true);
    
    try {
      setProgress('Setting up your account...');
      
      // Get or create user in Convex
      const convexUserId = await getOrCreateUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        name: user.fullName || undefined,
      });
      
      setProgress('Generating 1,000 customers...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress('Creating segments and campaigns...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress('Building email flows...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress('Generating performance data...');
      
      // Generate all the fake data
      await seedDatabase({
        userId: convexUserId,
        customerCount: 1000,
      });
      
      setProgress('Finalizing setup...');
      
      // Mark onboarding as complete
      await completeOnboarding({ userId: convexUserId });
      
      setProgress('All done! Redirecting...');
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
      
    } catch (error) {
      console.error('Seed error:', error);
      setProgress('Error generating data. Please try again.');
      setIsSeeding(false);
    }
  };
  
  // Show loading while checking auth and Convex user data
  // Note: convexUser can be null (user doesn't exist in Convex yet) or undefined (still loading)
  if (!isLoaded || !user) {
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
  
  // If user is authenticated and convexUser loaded (even if null), show onboarding
  // This allows new users who don't exist in Convex yet to proceed
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        {/* Header */}

        {/* Demo Notice */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                This is a Demo Application
              </h3>
              
              <p className="text-gray-600 mb-4 leading-relaxed">
                CommerceOS is not production-ready. This demo uses simulated data to showcase 
                the platform's AI-native capabilities for email marketing automation.
              </p>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium text-gray-900">In production:</span> We would integrate 
                  with your Shopify store to sync real customer data, orders, and product information.
                </p>
                <p className="text-sm text-gray-600">
                  For this demo, we'll generate realistic fake data so you can explore all features immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* What We'll Generate */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            What we'll generate for you:
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900 mb-1">3</div>
              <div className="text-sm text-gray-600">Products in your catalog</div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900 mb-1">1,000</div>
              <div className="text-sm text-gray-600">Customers with purchase history</div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900 mb-1">5</div>
              <div className="text-sm text-gray-600">Pre-built customer segments</div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900 mb-1">4</div>
              <div className="text-sm text-gray-600">Sample email campaigns</div>
            </div>
          </div>
        </div>
        
        {/* Action Button */}
        {!isSeeding ? (
          <button
            onClick={handleGenerateData}
            className="px-8 py-4 text-base font-semibold text-white bg-black rounded-lg hover:bg-gray-800 transition-colors w-full"
          >
            Generate Fake Data
          </button>
        ) : (
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-black h-full rounded-full transition-all duration-300" style={{ width: '100%' }} />
            </div>
            
            <p className="text-center text-sm text-gray-700 font-medium">
              {progress}
            </p>
            
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            This will take approximately 15-20 seconds
          </p>
        </div>
      </div>
    </div>
  );
}
