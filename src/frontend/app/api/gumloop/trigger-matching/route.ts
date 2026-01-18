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
 * Check if scholarship should be a universal match for Canadian students
 * Based on eligibility criteria and description
 */
function isUniversalCanadianMatch(scholarship: any, user: any): boolean {
  // Check if user is Canadian (citizenship or province indicates Canada)
  const isCanadian = 
    user.citizenship?.toLowerCase().includes('canadian') ||
    user.citizenship?.toLowerCase().includes('permanent resident') ||
    user.province // If they have a province, they're likely Canadian

  if (!isCanadian) {
    console.log(`[Universal Match] User is not Canadian - citizenship: ${user.citizenship}, province: ${user.province}`)
    return false
  }

  // Check scholarship title/description for universal eligibility keywords
  const title = (scholarship.title || '').toLowerCase()
  const description = (scholarship.description || '').toLowerCase()
  const eligibility = Array.isArray(scholarship.eligibility) 
    ? scholarship.eligibility.join(' ').toLowerCase()
    : (scholarship.eligibility || '').toLowerCase()
  
  const combinedText = `${title} ${description} ${eligibility}`

  console.log(`[Universal Match] Checking scholarship: "${scholarship.title}"`)
  console.log(`[Universal Match] Combined text: ${combinedText.substring(0, 200)}...`)

  // Keywords that indicate universal eligibility for Canadian students
  const universalKeywords = [
    'all students in canada',
    'all canadian students',
    'open to all students',
    'all students',
    'any student',
    'every student',
    'no requirements',
    'no eligibility',
    'open to everyone',
    'all post-secondary students',
    'any canadian student',
  ]

  // Check if scholarship mentions it's open to all
  const hasUniversalKeyword = universalKeywords.some(keyword => {
    const found = combinedText.includes(keyword)
    if (found) {
      console.log(`[Universal Match] Found universal keyword: "${keyword}"`)
    }
    return found
  })

  // Also check for scholarships that say "no grades", "no essay", "random draw" etc.
  const easyEntryKeywords = [
    'no grades',
    'no essay',
    'random draw',
    'randomly selected',
    'luckiest',
    'easy',
    'free to enter',
  ]

  const hasEasyEntry = easyEntryKeywords.some(keyword => {
    const found = combinedText.includes(keyword)
    if (found) {
      console.log(`[Universal Match] Found easy entry keyword: "${keyword}"`)
    }
    return found
  })

  // Special case: If title contains "luckiest" and (contains "canada" OR source is from studentawards.com), it's universal
  const hasLuckiest = title.includes('luckiest')
  const hasCanada = combinedText.includes('canada') || (scholarship.source || '').toLowerCase().includes('studentawards.com')
  
  if (hasLuckiest && hasCanada) {
    console.log(`[Universal Match] Special case: "luckiest" + "canada" detected`)
    return true
  }

  const result = hasUniversalKeyword || (hasEasyEntry && hasCanada)
  console.log(`[Universal Match] Result for "${scholarship.title}": ${result} (hasUniversal: ${hasUniversalKeyword}, hasEasyEntry: ${hasEasyEntry}, hasCanada: ${hasCanada})`)
  
  return result
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

    // Get all scholarships (including those without embeddings for universal matching)
    const scholarships = await scholarshipsCollection.find({}).toArray()

    console.log(`[Matching] Found ${scholarships.length} total scholarships for user ${auth0UserId}`)

    if (scholarships.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No scholarships found in database',
        matches_created: 0,
        matches_updated: 0,
        total_matches: 0,
        scholarships_checked: 0,
        warning: 'No scholarships available for matching. Please scrape scholarships first.',
      })
    }

    const matchThreshold = 0 // Set to 0 for testing - will match all scholarships regardless of similarity
    let matchesCreated = 0
    let matchesUpdated = 0
    
    // Track all similarities to ensure at least one match
    const allSimilarities: Array<{ scholarship: any; similarity: number }> = []

    // Match user with all scholarships
    for (const scholarship of scholarships) {
      try {
        // Check for universal matches first (scholarships open to all Canadian students)
        const isUniversalMatch = isUniversalCanadianMatch(scholarship, user)
        
        let similarity = 0
        let shouldMatch = false
        let matchReason = ''

        if (isUniversalMatch) {
          // Universal match - give it a high score (0.95) and match it
          similarity = 0.95
          shouldMatch = true
          matchReason = 'Universal match - open to all Canadian students'
          console.log(`[Matching] ✅ Universal match found: "${scholarship.title}" for user ${auth0UserId}`)
        } else if (scholarship.description_embedding && user.profile_embedding) {
          // Use embedding-based matching
          similarity = cosineSimilarity(
            user.profile_embedding,
            scholarship.description_embedding
          )
          shouldMatch = similarity >= matchThreshold
          matchReason = `Matched by embedding similarity (${Math.round(similarity * 100)}%)`
          if (shouldMatch) {
            console.log(`[Matching] ✅ Embedding match: "${scholarship.title}" - ${Math.round(similarity * 100)}% similarity`)
          } else {
            console.log(`[Matching] ❌ Embedding match below threshold: "${scholarship.title}" - ${Math.round(similarity * 100)}% similarity (threshold: ${matchThreshold})`)
          }
        } else {
          // Skip if no embedding available and not a universal match
          if (!scholarship.description_embedding) {
            console.log(`[Matching] ⚠️ Skipping "${scholarship.title}" - no embedding available and not a universal match`)
          }
          if (!user.profile_embedding) {
            console.log(`[Matching] ⚠️ Skipping "${scholarship.title}" - user has no profile embedding`)
          }
          continue
        }
        
        // Track all similarities
        allSimilarities.push({ scholarship, similarity })

        if (shouldMatch) {
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
                  reason: matchReason,
                  updated_at: new Date(),
                },
              }
            )
            matchesUpdated++
          } else {
            // Create new match using upsert to prevent duplicates
            const upsertResult = await matchesCollection.updateOne(
              {
                user_id: user._id,
                scholarship_id: scholarship._id,
              },
              {
                $set: {
                  match_score: similarity,
                  reason: matchReason,
                  application_status: 'Not Started',
                  updated_at: new Date(),
                },
                $setOnInsert: {
                  created_at: new Date(),
                },
              },
              { upsert: true }
            )
            if (upsertResult.upsertedCount > 0) {
              matchesCreated++
            } else {
              matchesUpdated++
            }
          }
        }
      } catch (error) {
        console.error(`Error matching scholarship ${scholarship._id}:`, error)
      }
    }
    
    // If no matches were created, force at least one match (the best one)
    // But only if we actually didn't create any matches (not just because threshold is 0)
    if (matchesCreated === 0 && matchesUpdated === 0 && allSimilarities.length > 0) {
      // Sort by similarity descending and take the best match
      allSimilarities.sort((a, b) => b.similarity - a.similarity)
      const bestMatch = allSimilarities[0]
      
      console.log(`[Matching] No matches above threshold. Best similarity: ${Math.round(bestMatch.similarity * 100)}% for scholarship: ${bestMatch.scholarship.title}`)
      
      // Check if this match already exists (double-check to prevent duplicates)
      const existingMatch = await matchesCollection.findOne({
        user_id: user._id,
        scholarship_id: bestMatch.scholarship._id,
      })
      
      if (!existingMatch) {
        // Use upsert to prevent duplicates
        await matchesCollection.updateOne(
          {
            user_id: user._id,
            scholarship_id: bestMatch.scholarship._id,
          },
          {
            $set: {
              match_score: bestMatch.similarity,
              reason: `Best available match (${Math.round(bestMatch.similarity * 100)}% similarity) - forced match`,
              application_status: 'Not Started',
              updated_at: new Date(),
            },
            $setOnInsert: {
              created_at: new Date(),
            },
          },
          { upsert: true }
        )
        matchesCreated++
        console.log(`[Matching] Forced match created: ${bestMatch.scholarship.title} with ${Math.round(bestMatch.similarity * 100)}% similarity`)
      } else {
        console.log(`[Matching] Best match already exists for scholarship: ${bestMatch.scholarship.title}`)
      }
    } else if (allSimilarities.length === 0) {
      console.log(`[Matching] No similarities calculated - this shouldn't happen if scholarships have embeddings`)
    }

    const response = {
      success: true,
      message: 'Matching completed successfully',
      matches_created: matchesCreated,
      matches_updated: matchesUpdated,
      total_matches: matchesCreated + matchesUpdated,
      scholarships_checked: scholarships.length,
      user_has_embedding: !!user.profile_embedding,
      best_similarity: allSimilarities.length > 0 
        ? Math.round(Math.max(...allSimilarities.map(s => s.similarity)) * 100) 
        : null,
    }

    console.log(`[Matching] Completed for user ${auth0UserId}:`, response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error matching user:', error)
    return NextResponse.json(
      { error: 'Failed to match scholarships' },
      { status: 500 }
    )
  }
}
