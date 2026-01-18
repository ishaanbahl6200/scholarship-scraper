import { getSession } from '@auth0/nextjs-auth0'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const auth0UserId = session.user.sub

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const response = await fetch(
      `${supabaseUrl}/rest/v1/students?auth0_user_id=eq.${auth0UserId}`,
      {
        headers: {
          apikey: supabaseKey!,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch profile')
    }

    const data = await response.json()

    if (data.length === 0) {
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

    return NextResponse.json(data[0])
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/students?auth0_user_id=eq.${auth0UserId}&select=auth0_user_id`,
      {
        headers: {
          apikey: supabaseKey!,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    )

    const checkData = await checkResponse.json()
    const profileData = {
      ...profile,
      auth0_user_id: auth0UserId,
      updated_at: new Date().toISOString(),
      profile_completed_at: checkData.length === 0 ? new Date().toISOString() : undefined,
    }

    let response
    if (checkData.length === 0) {
      response = await fetch(`${supabaseUrl}/rest/v1/students`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey!,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(profileData),
      })
    } else {
      response = await fetch(
        `${supabaseUrl}/rest/v1/students?auth0_user_id=eq.${auth0UserId}`,
        {
          method: 'PATCH',
          headers: {
            apikey: supabaseKey!,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify(profileData),
        }
      )
    }

    if (!response.ok) {
      throw new Error('Failed to save profile')
    }

    const data = await response.json()
    return NextResponse.json(data[0])
  } catch (error) {
    console.error('Error saving profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
