import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect('/api/auth/login')
  }

  return <DashboardClient user={session.user} />
}
