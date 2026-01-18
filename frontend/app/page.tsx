import Link from 'next/link'
import { Award, ArrowRight, User } from 'lucide-react'
import dynamic from 'next/dynamic'

const DotScreenShader = dynamic(() => import('@/components/ui/dot-shader-background').then(mod => ({ default: mod.DotScreenShader })), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#121212]" />
})

export default async function Home() {
  return (
    <div className="min-h-screen w-screen flex flex-col relative overflow-hidden">
      {/* Dot Shader Background - Full page coverage */}
      <div className="fixed inset-0 z-0">
        <DotScreenShader />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 pointer-events-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Award className="h-6 w-6 text-white" />
              <span className="text-lg font-light tracking-tight text-white">Grantly.</span>
            </div>
            <div className="flex items-center">
              <Link 
                href="/api/auth/login" 
                className="p-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
                aria-label="User account"
              >
                <User className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center relative z-10 px-4 sm:px-6 lg:px-8 min-h-[80vh]">
        <div className="max-w-5xl mx-auto text-center space-y-8 w-full">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-light tracking-tight text-white mix-blend-exclusion pointer-events-none select-none">
            Find Your Perfect
            <span className="block mt-2">Scholarship Match</span>
          </h1>
          
          <p className="text-lg md:text-xl font-light text-white/90 mix-blend-exclusion max-w-2xl mx-auto leading-relaxed pointer-events-none select-none">
            AI-powered matching connects you with scholarships tailored to your profile. 
            Save time and never miss an opportunity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 pointer-events-auto">
            <Link 
              href="/api/auth/login"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-light text-sm hover:bg-white/90 transition-all"
            >
              Get Started
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="#how-it-works"
              className="text-sm font-light text-white/80 hover:text-white transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </main>

      {/* Features Section - Minimalist */}
      <section id="how-it-works" className="relative z-10 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-16">
            <div className="text-center space-y-4 pointer-events-none select-none">
              <div className="text-4xl font-light text-white/60 mb-4">01</div>
              <h3 className="text-xl font-light text-white mb-3">Smart Matching</h3>
              <p className="text-sm font-light text-white/70 leading-relaxed">
                AI analyzes your profile and matches you with scholarships that fit your qualifications.
              </p>
            </div>

            <div className="text-center space-y-4 pointer-events-none select-none">
              <div className="text-4xl font-light text-white/60 mb-4">02</div>
              <h3 className="text-xl font-light text-white mb-3">Weekly Updates</h3>
              <p className="text-sm font-light text-white/70 leading-relaxed">
                Get personalized email digests with new opportunities every week.
              </p>
            </div>

            <div className="text-center space-y-4 pointer-events-none select-none">
              <div className="text-4xl font-light text-white/60 mb-4">03</div>
              <h3 className="text-xl font-light text-white mb-3">Track Everything</h3>
              <p className="text-sm font-light text-white/70 leading-relaxed">
                Keep track of applications, deadlines, and status in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Minimalist */}
      <footer className="relative z-10 border-t border-white/10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pointer-events-none select-none">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Award className="h-5 w-5 text-white/60" />
            <span className="text-sm font-light text-white/60">grantly</span>
          </div>
          <p className="text-xs font-light text-white/40 pointer-events-none">
            © 2024 grantly. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
