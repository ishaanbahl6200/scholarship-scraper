import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import OnboardingForm from '@/components/onboarding/OnboardingForm'
import { getDb } from '@/lib/db'

async function getProfile(auth0Id: string) {
  try {
    const db = await getDb()
    const user = await db.collection('users').findOne({ auth0_id: auth0Id })
    return user
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

function isOnboardingComplete(user: any): boolean {
  if (!user) return false
  // Check if all required fields are present
  return !!(
    user.name &&
    user.school &&
    user.program &&
    user.province &&
    user.citizenship &&
    user.ethnicity &&
    Array.isArray(user.interests) &&
    user.interests.length > 0
  )
}

export default async function OnboardPage() {
  const session = await getSession()

  if (!session) {
    redirect('/api/auth/login')
  }

  // Load existing profile data
  const existingProfile = await getProfile(session.user.sub)

  // If onboarding is already complete, redirect to dashboard
  if (existingProfile && isOnboardingComplete(existingProfile)) {
    redirect('/dashboard')
  }

  // Pre-fill form with existing data or Auth0 data
  // If no profile exists, create a basic user record first
  if (!existingProfile) {
    try {
      const db = await getDb()
      const now = new Date()
      await db.collection('users').insertOne({
        auth0_id: session.user.sub,
        email: session.user.email,
        created_at: now,
        updated_at: now,
      })
    } catch (error) {
      console.error('Error creating user record:', error)
    }
  }

  const defaultValues = {
    name: existingProfile?.name || session.user.name || '',
    school: existingProfile?.school || '',
    program: existingProfile?.program || '',
    gpa: existingProfile?.gpa ?? 0,
    province: existingProfile?.province || '',
    citizenship: existingProfile?.citizenship || '',
    ethnicity: existingProfile?.ethnicity || '',
    interests: existingProfile?.interests || [],
    demographics: existingProfile?.demographics 
      ? (typeof existingProfile.demographics === 'string' 
          ? existingProfile.demographics 
          : JSON.stringify(existingProfile.demographics))
      : '',
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
          <OnboardingForm defaultValues={defaultValues} />
        </div>
      </div>
    </div>
  )
}
