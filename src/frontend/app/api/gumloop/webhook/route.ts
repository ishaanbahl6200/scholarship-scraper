import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { ObjectId } from 'mongodb'

/**
 * Gumloop Webhook Endpoint
 * Receives scholarship data from Gumloop workflows
 * 
 * Expected payload from Gumloop:
 * {
 *   "scholarship": {
 *     "title": string,
 *     "amount": number,
 *     "deadline": string (ISO date),
 *     "description": string,
 *     "eligibility": string[],
 *     "source": string (URL),
 *     "description_embedding": number[] (optional)
 *   },
 *   "auth0_user_id": string (optional - if user-specific)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (optional but recommended)
    const webhookSecret = request.headers.get('x-gumloop-secret')
    const expectedSecret = process.env.GUMLOOP_WEBHOOK_SECRET
    
    if (expectedSecret && webhookSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { scholarship, auth0_user_id } = body

    if (!scholarship || !scholarship.title) {
      return NextResponse.json(
        { error: 'Invalid payload: scholarship title is required' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const scholarshipsCollection = db.collection('scholarships')

    // Check for duplicate (same title + source URL)
    const existingScholarship = await scholarshipsCollection.findOne({
      title: scholarship.title,
      source: scholarship.source || '',
    })

    let scholarshipId: ObjectId
    const isDuplicate = !!existingScholarship

    if (existingScholarship) {
      // Duplicate found - use existing scholarship ID
      scholarshipId = existingScholarship._id
    } else {
      // Prepare scholarship document
      const scholarshipDoc = {
        title: scholarship.title,
        amount: scholarship.amount || 0,
        deadline: scholarship.deadline ? new Date(scholarship.deadline) : undefined,
        description: scholarship.description || '',
        eligibility: scholarship.eligibility || [],
        source: scholarship.source || '',
        description_embedding: scholarship.description_embedding || undefined,
        created_at: new Date(),
        updated_at: new Date(),
      }

      // Insert new scholarship
      const result = await scholarshipsCollection.insertOne(scholarshipDoc)
      scholarshipId = result.insertedId
    }

    // If this is user-specific, create a match
    if (auth0_user_id) {
      const usersCollection = db.collection('users')
      const user = await usersCollection.findOne({ auth0_id: auth0_user_id })

      if (user) {
        const matchesCollection = db.collection('matches')
        // Check if match already exists
        const existingMatch = await matchesCollection.findOne({
          user_id: user._id,
          scholarship_id: scholarshipId,
        })

        if (!existingMatch) {
          await matchesCollection.insertOne({
            user_id: user._id,
            scholarship_id: scholarshipId,
            match_score: scholarship.match_score || 0.8, // Default match score
            reason: scholarship.match_reason || 'Matched by Gumloop workflow',
            created_at: new Date(),
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      scholarship_id: scholarshipId.toString(),
      is_duplicate: isDuplicate,
    })
  } catch (error) {
    console.error('Gumloop webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
