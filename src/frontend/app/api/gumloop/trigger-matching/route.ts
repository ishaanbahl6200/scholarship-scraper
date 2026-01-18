import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { getDb } from '@/lib/db'
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
 * Re-match User with All Scholarships
 * Called when a user updates their profile or manually requests matching
 * Uses embedding-based cosine similarity for matching
 */
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const auth0UserId = session.user.sub

  try {
    const db = await getDb()
    const usersCollection = db.collection('users')
    const scholarshipsCollection = db.collection('scholarships')
    const matchesCollection = db.collection('matches')

    // Get user with embedding
    const user = await usersCollection.findOne({ auth0_id: auth0UserId })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please complete your profile first.' },
        { status: 404 }
      )
    }

    if (!user.profile_embedding) {
      return NextResponse.json(
        { error: 'User profile embedding not found. Please update your profile.' },
        { status: 400 }
      )
    }

    // Get all scholarships with embeddings
    const scholarships = await scholarshipsCollection
      .find({ description_embedding: { $exists: true, $ne: null } })
      .toArray()

    const matchThreshold = 0.7 // Minimum similarity score
    let matchesCreated = 0
    let matchesUpdated = 0

    // Match user with all scholarships
    for (const scholarship of scholarships) {
      if (!scholarship.description_embedding) continue

      try {
        const similarity = cosineSimilarity(
          user.profile_embedding,
          scholarship.description_embedding
        )

        if (similarity >= matchThreshold) {
          // Check if match already exists
          const existingMatch = await matchesCollection.findOne({
            user_id: user._id,
            scholarship_id: scholarship._id,
          })

          if (existingMatch) {
            // Update existing match
            await matchesCollection.updateOne(
              { _id: existingMatch._id },
              {
                $set: {
                  match_score: similarity,
                  reason: `Matched by embedding similarity (${Math.round(similarity * 100)}%)`,
                  updated_at: new Date(),
                },
              }
            )
            matchesUpdated++
          } else {
            // Create new match
            await matchesCollection.insertOne({
              user_id: user._id,
              scholarship_id: scholarship._id,
              match_score: similarity,
              reason: `Matched by embedding similarity (${Math.round(similarity * 100)}%)`,
              application_status: 'Not Started',
              created_at: new Date(),
              updated_at: new Date(),
            })
            matchesCreated++
          }
        }
      } catch (error) {
        console.error(`Error matching scholarship ${scholarship._id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Matching completed successfully',
      matches_created: matchesCreated,
      matches_updated: matchesUpdated,
      total_matches: matchesCreated + matchesUpdated,
      scholarships_checked: scholarships.length,
    })
  } catch (error) {
    console.error('Error matching user:', error)
    return NextResponse.json(
      { error: 'Failed to match scholarships' },
      { status: 500 }
    )
  }
}
