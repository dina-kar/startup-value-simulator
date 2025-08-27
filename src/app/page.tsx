'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/auth/AuthContext'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if user is authenticated (will redirect)
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Startup Value Simulator
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Model cap tables across funding rounds and instantly see how much each founder would make at exit. 
              Build scenarios, track dilution, and make informed decisions.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-3">
                  Get Started →
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">Cap Table Modeling</h3>
              <p className="text-gray-600">
                Model multiple funding rounds with SAFE notes and priced rounds. 
                See real-time dilution effects.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-3xl mb-4">💰</div>
              <h3 className="text-lg font-semibold mb-2">Exit Scenarios</h3>
              <p className="text-gray-600">
                Calculate exit value distribution across different valuation scenarios. 
                Know what everyone gets.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-3xl mb-4">👥</div>
              <h3 className="text-lg font-semibold mb-2">Founder Focus</h3>
              <p className="text-gray-600">
                Built specifically for founders to understand equity splits and 
                make informed funding decisions.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Ready to model your startup?</h2>
            <p className="text-gray-600 mb-6">
              Start with your founding team and ESOP pool, then add funding rounds to see the impact.
            </p>
            <Link href="/auth/signup">
              <Button size="lg">
                Create Your Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
