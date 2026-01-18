import { getSession } from '@auth0/nextjs-auth0'
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const auth0UserId = session.user.sub

  try {
    const client = await clientPromise
    const db = client.db('grantly')
    const students = db.collection('students')

    const profile = await students.findOne({ auth0_user_id: auth0UserId })
    
    if (!profile) {
      // Profile doesn't exist yet, return default
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
    }

    // Remove MongoDB _id field
    const { _id, ...profileData } = profile
    return NextResponse.json(profileData)
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
    const client = await clientPromise
    const db = client.db('grantly')
    const students = db.collection('students')

    const profileData = {
      ...profile,
      auth0_user_id: auth0UserId,
      updated_at: new Date(),
      profile_completed_at: profile.profile_completed_at || new Date(),
    }

    // Upsert: update if exists, insert if not
    const result = await students.findOneAndUpdate(
      { auth0_user_id: auth0UserId },
      { 
        $set: profileData,
        $setOnInsert: { created_at: new Date() }
      },
      { 
        upsert: true,
        returnDocument: 'after'
      }
    )

    // Remove MongoDB _id field
    const { _id, ...updatedProfile } = result.value || profileData
    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Error saving profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
