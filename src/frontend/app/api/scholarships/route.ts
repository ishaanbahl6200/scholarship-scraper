import { getSession } from '@auth0/nextjs-auth0'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { ObjectId } from 'mongodb'

export async function GET() {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const auth0UserId = session.user.sub

  try {
    const db = await getDb()
    
    // Find user by auth0_id
    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ auth0_id: auth0UserId })
    
    if (!user) {
      // User doesn't exist yet, return empty array
      return NextResponse.json([])
    }

    // Find all matches for this user
    const matchesCollection = db.collection('matches')
    const matches = await matchesCollection
      .find({ user_id: user._id })
      .sort({ created_at: -1 })
      .toArray()

    if (matches.length === 0) {
      return NextResponse.json([])
    }

    // Get scholarship IDs from matches
    const scholarshipIds = matches.map(m => m.scholarship_id)

    // Fetch all matched scholarships
    const scholarshipsCollection = db.collection('scholarships')
    const scholarships = await scholarshipsCollection
      .find({ _id: { $in: scholarshipIds } })
      .toArray()

    // Create a map of scholarship_id to match data
    const matchMap = new Map()
    matches.forEach(match => {
      matchMap.set(match.scholarship_id.toString(), match)
    })

    // Combine scholarship data with match data
    const result = scholarships.map(scholarship => {
      const match = matchMap.get(scholarship._id.toString())
      return {
        scholarship_id: scholarship._id.toString(),
        scholarship_name: scholarship.title,
        award_amount: scholarship.amount || 0,
        match_score: match ? Math.round((match.match_score || 0.8) * 100) : 0, // Convert to percentage
        deadline: scholarship.deadline ? scholarship.deadline.toISOString() : null,
        application_url: scholarship.source || '',
        application_status: match?.application_status || 'Not Started',
        requirements: scholarship.eligibility || [],
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching scholarships:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
