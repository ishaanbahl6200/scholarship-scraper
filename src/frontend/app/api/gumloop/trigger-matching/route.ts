import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { getDb } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { generateEmbedding } from '@/lib/gemini'

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
 * Check if scholarship matches user's program of study
 * This is a priority check - scholarships that don't match the program should be excluded
 */
function matchesProgramOfStudy(scholarship: any, user: any): boolean {
  if (!user.program || !user.program.trim()) {
    // If user hasn't specified a program, allow all scholarships
    return true
  }

  const userProgram = user.program.toLowerCase()
  const title = (scholarship.title || '').toLowerCase()
  const description = (scholarship.description || '').toLowerCase()
  const eligibility = Array.isArray(scholarship.eligibility) 
    ? scholarship.eligibility.join(' ').toLowerCase()
    : (scholarship.eligibility || '').toLowerCase()
  
  const combinedText = `${title} ${description} ${eligibility}`

  // Normalize program names for matching
  const programVariations: Record<string, string[]> = {
    'computer science': ['computer science', 'cs', 'computing', 'software', 'programming', 'computer engineering', 'software engineering'],
    'engineering': ['engineering', 'engineer'],
    'business': ['business', 'commerce', 'finance', 'accounting', 'marketing', 'management'],
    'medicine': ['medicine', 'medical', 'health', 'healthcare'],
    'law': ['law', 'legal', 'jurisprudence'],
    'education': ['education', 'teaching', 'pedagogy'],
    'arts': ['arts', 'art', 'fine arts', 'humanities'],
    'science': ['science', 'biology', 'chemistry', 'physics', 'mathematics'],
  }

  // Check if scholarship explicitly mentions the program or related terms
  const programKeywords = programVariations[userProgram] || [userProgram]
  const hasProgramMatch = programKeywords.some(keyword => combinedText.includes(keyword))

  // Also check for exclusion keywords - if scholarship mentions a different field, exclude it
  // This is stricter: if scholarship explicitly mentions fields that don't match, exclude it
  const exclusionKeywords: Record<string, string[]> = {
    'computer science': ['law', 'legal', 'jurisprudence', 'environmental', 'ecology', 'biology', 'chemistry', 'physics', 'medicine', 'nursing', 'education', 'teaching'],
    'engineering': ['law', 'legal', 'jurisprudence', 'medicine', 'nursing', 'education', 'teaching', 'arts', 'fine arts'],
    'business': ['law', 'legal', 'jurisprudence', 'medicine', 'engineering', 'computer science'],
    'medicine': ['law', 'legal', 'jurisprudence', 'engineering', 'computer science', 'arts'],
    'law': ['computer science', 'engineering', 'medicine', 'nursing'],
  }

  const exclusions = exclusionKeywords[userProgram] || []
  
  // Check if any exclusion keyword appears in the scholarship text
  // Be strict: even one mention in eligibility/description is enough to exclude
  const hasExclusion = exclusions.some(keyword => {
    // Check if exclusion keyword appears anywhere in the text
    return combinedText.includes(keyword)
  })

  // If scholarship explicitly mentions excluded fields and doesn't mention user's program, exclude it
  if (hasExclusion && !hasProgramMatch) {
    console.log(`[Program Check] ❌ Excluding "${scholarship.title}" - mentions excluded fields for "${user.program}" program`)
    return false
  }
  
  // Additional check: if scholarship has specific field requirements that don't match
  // Look for patterns like "Field of Study: Law" or "for Law students"
  const fieldOfStudyPatterns = [
    /field of study[:\s]+([^,;]+)/i,
    /for\s+([^,;]+)\s+students/i,
    /open to\s+([^,;]+)\s+students/i,
  ]
  
  for (const pattern of fieldOfStudyPatterns) {
    const match = combinedText.match(pattern)
    if (match) {
      const mentionedField = match[1].toLowerCase()
      // Check if mentioned field is in exclusions
      if (exclusions.some(exclusion => mentionedField.includes(exclusion) || exclusion.includes(mentionedField))) {
        if (!hasProgramMatch) {
          console.log(`[Program Check] ❌ Excluding "${scholarship.title}" - explicitly for "${mentionedField}" which doesn't match "${user.program}"`)
          return false
        }
      }
    }
  }

  // First check if scholarship is universal (open to all) - if so, allow it regardless of program
  const isUniversal = combinedText.includes('all students') || 
                     combinedText.includes('any student') || 
                     combinedText.includes('open to all') ||
                     combinedText.includes('no requirements') ||
                     combinedText.includes('any field') ||
                     combinedText.includes('all fields') ||
                     combinedText.includes('open to everyone')

  if (isUniversal) {
    console.log(`[Program Check] ✅ Universal scholarship: "${scholarship.title}" - open to all programs`)
    return true // Universal scholarships match all programs
  }

  // If scholarship mentions specific programs/fields, check if user's program matches
  if (hasProgramMatch) {
    console.log(`[Program Check] ✅ Program match: "${scholarship.title}" matches "${user.program}"`)
    return true
  }

  // If scholarship has exclusion keywords and is NOT universal, exclude it
  if (hasExclusion) {
    console.log(`[Program Check] ❌ Excluding "${scholarship.title}" - has exclusion keywords for "${user.program}" and is not universal`)
    return false
  }

  // If no program keywords found and not universal, be conservative and allow it
  // (some scholarships might not explicitly mention programs)
  console.log(`[Program Check] ⚠️ No explicit program match for "${scholarship.title}" with "${user.program}" - allowing (may be general scholarship)`)
  return true
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

    // Generate embedding if missing
    if (!user.profile_embedding) {
      console.log(`[Matching] Profile embedding missing for user ${auth0UserId}, generating now...`)
      
      const profileText = [
        user.name || '',
        user.school || '',
        user.program || '',
        user.gpa ? `GPA: ${user.gpa}` : '',
        user.province ? `Province: ${user.province}` : '',
        user.citizenship ? `Citizenship: ${user.citizenship}` : '',
        user.ethnicity ? `Ethnicity: ${user.ethnicity}` : '',
        Array.isArray(user.interests) ? user.interests.join(', ') : '',
        user.demographics ? JSON.stringify(user.demographics) : '',
      ]
        .filter(Boolean)
        .join('\n')
      
      if (!profileText.trim()) {
        return NextResponse.json(
          { error: 'User profile is incomplete. Please complete your profile first.' },
          { status: 400 }
        )
      }
      
      try {
        console.log(`[Matching] Generating embedding for profile text (length: ${profileText.length}):`, profileText.substring(0, 200))
        
        // Check if GEMINI_API_KEY is configured
        if (!process.env.GEMINI_API_KEY) {
          console.error(`[Matching] GEMINI_API_KEY is not configured in environment variables`)
          return NextResponse.json(
            { 
              error: 'Embedding service not configured. GEMINI_API_KEY is missing. Please contact support.',
              details: 'The embedding generation service requires a Gemini API key to be configured.'
            },
            { status: 500 }
          )
        }
        
        const embedding = await generateEmbedding(profileText)
        if (embedding && Array.isArray(embedding) && embedding.length > 0) {
          // Update user with generated embedding
          await usersCollection.updateOne(
            { auth0_id: auth0UserId },
            { $set: { profile_embedding: embedding } }
          )
          user.profile_embedding = embedding
          console.log(`[Matching] Successfully generated and saved profile embedding (${embedding.length} dimensions) for user ${auth0UserId}`)
        } else {
          console.error(`[Matching] Embedding generation returned null or empty array. API key configured: ${!!process.env.GEMINI_API_KEY}`)
          return NextResponse.json(
            { 
              error: 'Failed to generate profile embedding. The embedding service returned no data.',
              details: embedding === null ? 'Embedding service returned null. Check if GEMINI_API_KEY is valid.' : 'Embedding array is empty.'
            },
            { status: 500 }
          )
        }
      } catch (error) {
        console.error(`[Matching] Failed to generate embedding:`, error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const errorDetails = error instanceof Error ? error.stack : String(error)
        console.error(`[Matching] Error details:`, errorDetails)
        
        return NextResponse.json(
          { 
            error: 'Failed to generate profile embedding.',
            details: errorMessage,
            suggestion: 'Please check if GEMINI_API_KEY is correctly configured in your environment variables.'
          },
          { status: 500 }
        )
      }
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

    const matchThreshold = 0.5 // Match scholarships with at least 50% similarity
    let matchesCreated = 0
    let matchesUpdated = 0
    
    // Track all similarities to ensure at least one match
    const allSimilarities: Array<{ scholarship: any; similarity: number }> = []

    // Match user with all scholarships
    for (const scholarship of scholarships) {
      try {
        // Priority check: Program of study match (most important)
        if (!matchesProgramOfStudy(scholarship, user)) {
          console.log(`[Matching] Skipping "${scholarship.title}" - doesn't match program of study`)
          continue // Skip this scholarship entirely
        }

        // Check for universal matches (scholarships open to all Canadian students)
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
        } else if (user.profile_embedding && !scholarship.description_embedding) {
          // Scholarship has no embedding - skip it (can't calculate similarity)
          console.log(`[Matching] ⚠️ Skipping "${scholarship.title}" - no embedding available`)
          continue
        } else {
          // Skip if user has no profile embedding
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
    
    // Log summary of matching results
    if (allSimilarities.length === 0) {
      console.log(`[Matching] No similarities calculated - this shouldn't happen if scholarships have embeddings`)
    } else if (matchesCreated === 0 && matchesUpdated === 0) {
      // Log the best available match for debugging, but don't force it
      allSimilarities.sort((a, b) => b.similarity - a.similarity)
      const bestMatch = allSimilarities[0]
      console.log(`[Matching] No matches above ${matchThreshold * 100}% threshold. Best available: ${Math.round(bestMatch.similarity * 100)}% for scholarship: ${bestMatch.scholarship.title}`)
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
