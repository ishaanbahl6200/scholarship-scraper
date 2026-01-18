import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
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

export default async function DashboardPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/api/auth/login')
  }

  // Check if user has completed onboarding
  const userProfile = await getProfile(session.user.sub)
  
  if (!userProfile || !isOnboardingComplete(userProfile)) {
    redirect('/onboard')
  }

  return <DashboardClient user={session.user} />
}
