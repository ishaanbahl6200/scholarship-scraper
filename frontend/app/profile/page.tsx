import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/api/auth/login')
  }

  return <ProfileClient user={session.user} />
}
