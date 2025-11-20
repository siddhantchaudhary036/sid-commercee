"use client";

import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sparkles, TrendingUp, Zap, Users, Mail, BarChart3, Target, Workflow } from "lucide-react";

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
    <div className="min-h-screen bg-white relative overflow-hidden">
      <SmokeAnimation />
      
      {/* Header */}
      <header className="border-b border-gray-200 relative z-10 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-md" />
            <span className="text-lg font-semibold text-gray-900">CommerceOS</span>
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
      <main className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center pt-20 pb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-8">
            <Sparkles className="w-3 h-3 text-gray-600" />
            <span className="text-xs font-medium text-gray-600">AI-Powered Marketing Platform</span>
          </div>

          <h1 className="text-5xl font-bold text-gray-900 tracking-tight max-w-4xl mb-6">
            Marketing Automation
            <br />
            <span className="text-gray-500">That Actually Works</span>
          </h1>

          <p className="text-lg text-gray-600 max-w-2xl mb-12 leading-relaxed">
            Build intelligent customer segments, create automated flows, and launch campaigns 
            that drive revenue—all powered by AI that learns from your data.
          </p>

          <div className="flex items-center gap-4">
            <SignUpButton mode="modal">
              <button className="px-8 py-3 text-sm font-semibold text-white bg-black rounded-lg hover:bg-gray-800 transition-colors">
                Get Started Free
              </button>
            </SignUpButton>
            <button className="px-8 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                View Demo
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            No credit card required • Free forever plan available
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-16 border-t border-gray-200">
          <FeatureCard
            icon={<Users className="w-5 h-5 text-gray-600" />}
            title="Smart Segments"
            description="AI-powered customer segmentation based on behavior, purchase history, and engagement patterns."
          />
          <FeatureCard
            icon={<Workflow className="w-5 h-5 text-gray-600" />}
            title="Automated Flows"
            description="Build sophisticated multi-step workflows with triggers, delays, and conditional logic."
          />
          <FeatureCard
            icon={<Mail className="w-5 h-5 text-gray-600" />}
            title="Campaign Manager"
            description="Design, schedule, and track email campaigns with built-in A/B testing and analytics."
          />
          <FeatureCard
            icon={<BarChart3 className="w-5 h-5 text-gray-600" />}
            title="Revenue Insights"
            description="Track revenue attribution, conversion rates, and ROI for every campaign and flow."
          />
        </div>

        {/* Key Features Section */}
        <div className="py-16 border-t border-gray-200">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              A complete marketing platform designed for modern ecommerce businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <DetailedFeature
              icon={<Sparkles className="w-5 h-5 text-gray-600" />}
              title="AI Agent Assistant"
              description="Natural language interface for creating segments, campaigns, and flows. Just describe what you want, and our AI builds it for you."
              features={[
                "Multi-step workflow automation",
                "Context-aware suggestions",
                "Learns from your preferences"
              ]}
            />
            <DetailedFeature
              icon={<Target className="w-5 h-5 text-gray-600" />}
              title="Advanced Segmentation"
              description="Create precise customer segments using behavioral data, purchase history, and custom attributes."
              features={[
                "Dynamic segment updates",
                "Nested conditions",
                "AI-discovered segments"
              ]}
            />
            <DetailedFeature
              icon={<TrendingUp className="w-5 h-5 text-gray-600" />}
              title="Performance Analytics"
              description="Real-time insights into campaign performance, customer engagement, and revenue impact."
              features={[
                "Revenue attribution tracking",
                "Engagement scoring",
                "Predictive analytics"
              ]}
            />
            <DetailedFeature
              icon={<Zap className="w-5 h-5 text-gray-600" />}
              title="Email Templates"
              description="Professional email templates with drag-and-drop editing and dynamic content blocks."
              features={[
                "Responsive designs",
                "Personalization tokens",
                "Template library"
              ]}
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 border-t border-gray-200">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Marketing?
            </h2>
            <p className="text-sm text-gray-600 mb-8">
              Join hundreds of ecommerce brands using CommerceOS to drive revenue through intelligent automation.
            </p>
            <SignUpButton mode="modal">
              <button className="px-8 py-3 text-sm font-semibold text-white bg-black rounded-lg hover:bg-gray-800 transition-colors">
                Start Free Trial
              </button>
            </SignUpButton>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-black rounded-md" />
              <span className="text-sm font-semibold text-gray-900">CommerceOS</span>
            </div>
            <p className="text-xs text-gray-500">
              © 2024 CommerceOS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description }) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
      <div className="mb-3">{icon}</div>
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

// Detailed Feature Component
function DetailedFeature({ icon, title, description, features }) {
  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="mt-1">{icon}</div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-1 h-1 bg-gray-400 rounded-full" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Smoke Animation Component
function SmokeAnimation() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 60 + 40;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.opacity = Math.random() * 0.3 + 0.1;
        this.life = 1;
        this.decay = Math.random() * 0.005 + 0.002;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        this.opacity = this.life * 0.15;
        this.size += 0.3;
      }

      draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, 'rgba(156, 163, 175, 0.4)');
        gradient.addColorStop(0.5, 'rgba(156, 163, 175, 0.2)');
        gradient.addColorStop(1, 'rgba(156, 163, 175, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      
      // Create particles at mouse position
      for (let i = 0; i < 2; i++) {
        particlesRef.current.push(new Particle(e.clientX, e.clientY));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.update();
        particle.draw(ctx);
        return particle.life > 0;
      });

      // Limit particle count
      if (particlesRef.current.length > 100) {
        particlesRef.current = particlesRef.current.slice(-100);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
