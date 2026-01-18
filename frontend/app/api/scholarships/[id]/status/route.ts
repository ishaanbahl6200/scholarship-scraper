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
    // TODO: Connect to database (MongoDB will be added by partner)
    // For now, just return success
    return NextResponse.json({ 
      scholarship_id: scholarshipId,
      application_status: status,
      auth0_user_id: auth0UserId
    })
  } catch (error) {
    console.error('Error updating status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
