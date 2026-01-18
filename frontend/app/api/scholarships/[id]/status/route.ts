import { getSession } from '@auth0/nextjs-auth0'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const auth0UserId = session.user.sub
  const { status } = await request.json()
  const scholarshipId = params.id

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // First verify the scholarship belongs to the user
    const verifyResponse = await fetch(
      `${supabaseUrl}/rest/v1/scholarships?scholarship_id=eq.${scholarshipId}&auth0_user_id=eq.${auth0UserId}&select=scholarship_id`,
      {
        headers: {
          apikey: supabaseKey!,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    )

    const verifyData = await verifyResponse.json()
    if (verifyData.length === 0) {
      return NextResponse.json({ error: 'Scholarship not found' }, { status: 404 })
    }

    // Update the status
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/scholarships?scholarship_id=eq.${scholarshipId}`,
      {
        method: 'PATCH',
        headers: {
          apikey: supabaseKey!,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ application_status: status }),
      }
    )

    if (!updateResponse.ok) {
      throw new Error('Failed to update status')
    }

    const data = await updateResponse.json()
    return NextResponse.json(data[0])
  } catch (error) {
    console.error('Error updating status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
