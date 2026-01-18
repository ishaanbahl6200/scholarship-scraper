import Link from 'next/link'
import { GraduationCap, Sparkles, Target, Zap } from 'lucide-react'

export default async function Home() {
  // Auth0 check is optional - page works without it
  // Uncomment when Auth0 is configured:
  // const session = await getSession()
  // if (session) {
  //   redirect('/dashboard')
  // }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">ScholarshipFinder</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/api/auth/login" className="text-gray-700 hover:text-primary-600 font-medium">
                Log In
              </Link>
              <Link href="/api/auth/login" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-bold mb-6">
              Find Scholarships That
              <span className="block text-primary-200">Match You Perfectly</span>
            </h1>
            <p className="text-xl sm:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
              AI-powered matching connects you with scholarships tailored to your profile. 
              Save time and never miss an opportunity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/api/auth/login" className="btn-primary bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4">
                Start Finding Scholarships
              </Link>
              <Link href="#features" className="btn-secondary border-white text-white hover:bg-white/10 text-lg px-8 py-4">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We use AI to match you with scholarships based on your unique profile
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Matching</h3>
              <p className="text-gray-600">
                Our AI analyzes your profile and matches you with scholarships that fit your qualifications, interests, and goals.
              </p>
            </div>

            <div className="card text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Weekly Updates</h3>
              <p className="text-gray-600">
                Get personalized email digests every week with new scholarship opportunities that match your profile.
              </p>
            </div>

            <div className="card text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Track Applications</h3>
              <p className="text-gray-600">
                Keep track of all your scholarship applications, deadlines, and status in one organized dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Find Your Perfect Scholarship?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of students who are finding scholarships that match their unique profiles.
          </p>
          <Link href="/api/auth/login" className="btn-primary bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4 inline-block">
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <GraduationCap className="h-6 w-6 text-primary-400" />
              <span className="text-lg font-semibold text-white">ScholarshipFinder</span>
            </div>
            <p className="text-sm">
              © 2024 ScholarshipFinder. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
