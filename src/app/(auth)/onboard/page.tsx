import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Award } from 'lucide-react'
import OnboardingForm from '@/components/onboarding/OnboardingForm'

export default async function OnboardPage() {
  const session = await getSession()

  if (!session) {
    redirect('/api/auth/login')
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.12),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(242,212,146,0.08),transparent_40%)]" />
      <div className="relative max-w-3xl mx-auto px-4 py-10">
        <Link
          href="/"
          className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full p-2 text-white/90 hover:text-white transition-colors"
          aria-label="Back to landing page"
        >
          <Award className="h-5 w-5" />
          <span className="text-lg font-light tracking-tight">Grantly.</span>
        </Link>
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white">Complete your profile</h1>
          <p className="text-white/70">
            Answer a few questions so we can match you with scholarships.
          </p>
        </div>
        <div className="card bg-white/5 border border-[#D4AF37]/40 backdrop-blur-xl shadow-[0_0_30px_rgba(212,175,55,0.15)]">
          <OnboardingForm
            defaultValues={{
              name: session.user.name || '',
            }}
          />
        </div>
      </div>
    </div>
  )
}
