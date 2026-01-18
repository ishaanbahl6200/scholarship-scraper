import Link from 'next/link'
import { ArrowRight, User } from 'lucide-react'
import dynamic from 'next/dynamic'

const DotScreenShader = dynamic(() => import('../components/ui/dot-shader-background').then(mod => ({ default: mod.DotScreenShader })), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#121212]" />
})

export default async function Home() {
  return (
    <div className="min-h-screen w-screen flex flex-col relative overflow-hidden">
      {/* Dot Shader Background - Full page coverage */}
      <div className="fixed inset-0 z-0 pointer-events-auto">
        <DotScreenShader />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 pointer-events-auto">
              <span className="text-2xl font-light tracking-tight text-white">Grantly.</span>
            </div>
            <div className="flex items-center pointer-events-auto">
              <Link 
                href="/api/auth/login" 
                className="p-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
                aria-label="User account"
              >
                <User className="h-7 w-7" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center relative z-10 px-4 sm:px-6 lg:px-8 min-h-[80vh] pointer-events-none">
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
          </div>
        </div>
      </main>
    </div>
  )
}
