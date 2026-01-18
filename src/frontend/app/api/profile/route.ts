import { getSession } from '@auth0/nextjs-auth0'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const auth0UserId = session.user.sub

  try {
    // TODO: Connect to database (MongoDB will be added by partner)
    // For now, return default profile
    return NextResponse.json({
      auth0_user_id: auth0UserId,
      email: session.user.email,
      name: session.user.name || '',
      current_gpa: 0,
      major: '',
      year: '',
      location_state: '',
      age: 0,
      citizenship_status: '',
      financial_need_level: '',
      interests: [],
      extracurriculars: [],
      scholarship_preferences: {
        min_amount: 0,
        max_amount: 0,
      },
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const auth0UserId = session.user.sub
  const profile = await request.json()

  try {
    // TODO: Connect to database (MongoDB will be added by partner)
    // For now, just return the profile data
    const profileData = {
      ...profile,
      auth0_user_id: auth0UserId,
      updated_at: new Date().toISOString(),
      profile_completed_at: profile.profile_completed_at || new Date().toISOString(),
    }

    return NextResponse.json(profileData)
  } catch (error) {
    console.error('Error saving profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
