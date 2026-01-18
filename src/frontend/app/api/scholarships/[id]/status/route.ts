import { getSession } from '@auth0/nextjs-auth0'
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { ObjectId } from 'mongodb'

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
    const db = await getDb()
    
    // Find user by auth0_id
    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ auth0_id: auth0UserId })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update the match record with the new status
    const matchesCollection = db.collection('matches')
    const result = await matchesCollection.updateOne(
      { 
        user_id: user._id,
        scholarship_id: new ObjectId(scholarshipId)
      },
      { 
        $set: { 
          application_status: status,
          updated_at: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      scholarship_id: scholarshipId,
      application_status: status,
      success: true
    })
  } catch (error) {
    console.error('Error updating status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
