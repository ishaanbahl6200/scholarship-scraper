import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/**
 * Bulk Import Scholarships from Gumloop
 * Used when Gumloop scrapes multiple scholarships at once
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { scholarships } = body

    if (!Array.isArray(scholarships) || scholarships.length === 0) {
      return NextResponse.json(
        { error: 'Invalid payload: scholarships array is required' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const scholarshipsCollection = db.collection('scholarships')

    // Prepare documents
    const docs = scholarships.map((scholarship: any) => ({
      title: scholarship.title,
      amount: scholarship.amount || 0,
      deadline: scholarship.deadline ? new Date(scholarship.deadline) : undefined,
      description: scholarship.description || '',
      eligibility: scholarship.eligibility || [],
      source: scholarship.source || '',
      description_embedding: scholarship.description_embedding || undefined,
      created_at: new Date(),
      updated_at: new Date(),
    }))

    // Insert all scholarships
    const result = await scholarshipsCollection.insertMany(docs)

    // Trigger matching workflow for all users after new scholarships are added
    // This runs asynchronously so it doesn't block the response
    const gumloopApiKey = process.env.GUMLOOP_API_KEY
    const gumloopMatchingWorkflowId = process.env.GUMLOOP_MATCHING_WORKFLOW_ID
    const gumloopUserId = process.env.GUMLOOP_USER_ID

    if (gumloopApiKey && gumloopMatchingWorkflowId && gumloopUserId) {
      // Get all users and trigger matching for each
      const usersCollection = db.collection('users')
      const users = await usersCollection.find({}).toArray()
      
      // Trigger matching workflow for each user (fire and forget)
      users.forEach(async (user) => {
        try {
          await fetch(
            `https://api.gumloop.com/api/v1/start_pipeline?user_id=${gumloopUserId}&saved_item_id=${gumloopMatchingWorkflowId}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${gumloopApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                auth0_user_id: user.auth0_id,
                trigger: 'new_scholarships_added',
              }),
            }
          )
        } catch (error) {
          console.error(`Failed to trigger matching for user ${user.auth0_id}:`, error)
          // Don't fail the whole request if matching trigger fails
        }
      })
    }

    return NextResponse.json({
      success: true,
      count: result.insertedCount,
      scholarship_ids: Object.values(result.insertedIds).map(id => id.toString()),
      matching_triggered: gumloopApiKey && gumloopMatchingWorkflowId && gumloopUserId,
    })
  } catch (error) {
    console.error('Gumloop bulk import error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get all scholarships (for Gumloop to check existing ones)
 */
export async function GET(request: NextRequest) {
  try {
    const webhookSecret = request.headers.get('x-gumloop-secret')
    const expectedSecret = process.env.GUMLOOP_WEBHOOK_SECRET
    
    if (expectedSecret && webhookSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = await getDb()
    const scholarshipsCollection = db.collection('scholarships')

    const scholarships = await scholarshipsCollection
      .find({})
      .sort({ created_at: -1 })
      .limit(100)
      .toArray()

    return NextResponse.json({
      count: scholarships.length,
      scholarships: scholarships.map(s => ({
        id: s._id.toString(),
        title: s.title,
        amount: s.amount || 0,
        deadline: s.deadline ? s.deadline.toISOString() : undefined,
        description: s.description || '',
        eligibility: s.eligibility || [],
        source: s.source || '',
        description_embedding: s.description_embedding || undefined,
        created_at: s.created_at ? s.created_at.toISOString() : undefined,
      })),
    })
  } catch (error) {
    console.error('Error fetching scholarships:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
