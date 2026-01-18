import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { generateEmbedding } from '@/lib/gemini'
import { ObjectId } from 'mongodb'

/**
 * Calculate cosine similarity between two embeddings
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-gumloop-secret',
    },
  })
}

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
    
    // Handle different payload formats
    let scholarships: any[] = []
    if (Array.isArray(body)) {
      // If body is directly an array
      scholarships = body
    } else if (body.scholarships && Array.isArray(body.scholarships)) {
      // If body has scholarships key
      scholarships = body.scholarships
    } else if (body.scholarship) {
      // If single scholarship object
      scholarships = [body.scholarship]
    }

    if (!Array.isArray(scholarships) || scholarships.length === 0) {
      return NextResponse.json(
        { error: 'Invalid payload: scholarships array is required. Received:', body: JSON.stringify(body).substring(0, 200) },
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

    // Generate embeddings for scholarships that don't have them
    const scholarshipsWithEmbeddings = await Promise.all(
      docs.map(async (doc, index) => {
        if (!doc.description_embedding && doc.description) {
          try {
            const embedding = await generateEmbedding(
              `${doc.title} ${doc.description} ${Array.isArray(doc.eligibility) ? doc.eligibility.join(' ') : doc.eligibility || ''}`
            )
            if (embedding) {
              doc.description_embedding = embedding
            }
          } catch (error) {
            console.error(`Failed to generate embedding for scholarship ${index}:`, error)
          }
        }
        return doc
      })
    )

    // Check for duplicates and only insert new scholarships
    // Duplicate = same title AND same source URL
    const scholarshipsToInsert: any[] = []
    const existingScholarships = await scholarshipsCollection
      .find({
        $or: scholarshipsWithEmbeddings.map(doc => ({
          title: doc.title,
          source: doc.source,
        }))
      })
      .toArray()

    // Create a Set of existing scholarship keys (title + source) for fast lookup
    const existingKeys = new Set(
      existingScholarships.map(s => `${s.title}|||${s.source}`)
    )

    // Filter out duplicates
    for (const doc of scholarshipsWithEmbeddings) {
      const key = `${doc.title}|||${doc.source}`
      if (!existingKeys.has(key)) {
        scholarshipsToInsert.push(doc)
      }
    }

    // Insert only new scholarships
    let result: { insertedIds: Record<number, ObjectId>, insertedCount: number }
    if (scholarshipsToInsert.length > 0) {
      result = await scholarshipsCollection.insertMany(scholarshipsToInsert)
    } else {
      // No new scholarships to insert
      result = { insertedIds: {}, insertedCount: 0 }
    }

    // Automatically match new scholarships with all users using embeddings
    // This runs asynchronously so it doesn't block the response
    const matchThreshold = 0.7 // Minimum similarity score to create a match
    const usersCollection = db.collection('users')
    const matchesCollection = db.collection('matches')
    
    // Get all users with embeddings
    const users = await usersCollection
      .find({ profile_embedding: { $exists: true, $ne: null } })
      .toArray()

    // Match asynchronously (fire and forget) - only for newly inserted scholarships
    Promise.all(
      Object.values(result.insertedIds).map(async (scholarshipId, index) => {
        const scholarship = scholarshipsToInsert[index]
        if (!scholarship || !scholarship.description_embedding) return

        for (const user of users) {
          if (!user.profile_embedding) continue

          try {
            const similarity = cosineSimilarity(
              user.profile_embedding,
              scholarship.description_embedding
            )

            if (similarity >= matchThreshold) {
              // Check if match already exists
              const existingMatch = await matchesCollection.findOne({
                user_id: user._id,
                scholarship_id: scholarshipId,
              })

              if (!existingMatch) {
                await matchesCollection.insertOne({
                  user_id: user._id,
                  scholarship_id: scholarshipId,
                  match_score: similarity,
                  reason: `Matched by embedding similarity (${Math.round(similarity * 100)}%)`,
                  application_status: 'Not Started',
                  created_at: new Date(),
                  updated_at: new Date(),
                })
              }
            }
          } catch (error) {
            console.error(`Error matching user ${user.auth0_id} with scholarship:`, error)
          }
        }
      })
    ).catch(error => {
      console.error('Error in matching process:', error)
      // Don't fail the request if matching fails
    })

    return NextResponse.json({
      success: true,
      count: result.insertedCount,
      duplicates_skipped: scholarshipsWithEmbeddings.length - scholarshipsToInsert.length,
      scholarship_ids: Object.values(result.insertedIds).map(id => id.toString()),
      matching_triggered: true,
      users_matched: users.length,
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
