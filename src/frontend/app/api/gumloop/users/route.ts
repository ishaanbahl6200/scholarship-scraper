import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/**
 * Get User Profile for Gumloop Matching
 * Gumloop can call this to get user profile data for matching
 */
export async function GET(request: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = request.headers.get('x-gumloop-secret')
    const expectedSecret = process.env.GUMLOOP_WEBHOOK_SECRET
    
    if (expectedSecret && webhookSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const auth0UserId = searchParams.get('auth0_user_id')

    if (!auth0UserId) {
      return NextResponse.json(
        { error: 'auth0_user_id is required' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const usersCollection = db.collection('users')

    const user = await usersCollection.findOne({ auth0_id: auth0UserId })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user profile for matching
    return NextResponse.json({
      auth0_id: user.auth0_id,
      email: user.email,
      school: user.school,
      program: user.program,
      gpa: user.gpa,
      location: user.location,
      ethnicity: user.ethnicity,
      profile_embedding: user.profile_embedding,
    })
  } catch (error) {
    console.error('Error fetching user for Gumloop:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
