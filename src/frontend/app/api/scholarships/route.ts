import { getSession } from '@auth0/nextjs-auth0'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const auth0UserId = session.user.sub

  try {
    // TODO: Connect to database (MongoDB will be added by partner)
    // For now, return empty array
    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching scholarships:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
