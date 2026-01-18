import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import OnboardingForm from '@/components/onboarding/OnboardingForm'

export default async function OnboardPage() {
  const session = await getSession()

  if (!session) {
    redirect('/api/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Complete your profile</h1>
          <p className="text-gray-600">
            Answer a few questions so we can match you with scholarships.
          </p>
        </div>
        <div className="card">
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
