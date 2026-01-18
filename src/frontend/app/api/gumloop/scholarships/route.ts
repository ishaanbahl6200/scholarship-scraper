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
 */
function isUniversalCanadianMatch(scholarship: any, user: any): boolean {
  const isCanadian = 
    user.citizenship?.toLowerCase().includes('canadian') ||
    user.citizenship?.toLowerCase().includes('permanent resident') ||
    user.province

  if (!isCanadian) return false

  const title = (scholarship.title || '').toLowerCase()
  const description = (scholarship.description || '').toLowerCase()
  const eligibility = Array.isArray(scholarship.eligibility) 
    ? scholarship.eligibility.join(' ').toLowerCase()
    : (scholarship.eligibility || '').toLowerCase()
  
  const combinedText = `${title} ${description} ${eligibility}`

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

  const hasUniversalKeyword = universalKeywords.some(keyword => 
    combinedText.includes(keyword)
  )

  const easyEntryKeywords = [
    'no grades',
    'no essay',
    'random draw',
    'randomly selected',
    'luckiest',
    'easy',
    'free to enter',
  ]

  const hasEasyEntry = easyEntryKeywords.some(keyword => 
    combinedText.includes(keyword)
  )

  // Special case: If title contains "luckiest" and (contains "canada" OR source is from studentawards.com), it's universal
  const hasLuckiest = title.includes('luckiest')
  const hasCanada = combinedText.includes('canada') || (scholarship.source || '').toLowerCase().includes('studentawards.com')
  
  if (hasLuckiest && hasCanada) {
    return true
  }

  return hasUniversalKeyword || (hasEasyEntry && hasCanada)
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
    const usersCollection = db.collection('users')
    const matchesCollection = db.collection('matches')

    // Prepare documents
    const docs = scholarships.map((scholarship: any) => {
      // Normalize amount - handle if it's a string with dollar sign or number
      let normalizedAmount = 0
      if (scholarship.amount) {
        if (typeof scholarship.amount === 'number') {
          normalizedAmount = scholarship.amount > 0 ? scholarship.amount : 0
        } else if (typeof scholarship.amount === 'string') {
          // Remove dollar signs, commas, and extract number
          const cleaned = scholarship.amount.replace(/[^0-9.]/g, '')
          const parsed = parseFloat(cleaned)
          normalizedAmount = parsed > 0 ? parsed : 0
        }
      }
      
      return {
        title: scholarship.title,
        amount: normalizedAmount,
        deadline: scholarship.deadline ? new Date(scholarship.deadline) : undefined,
        description: scholarship.description || '',
        eligibility: scholarship.eligibility || [],
        source: scholarship.source || '',
        description_embedding: scholarship.description_embedding || undefined,
        created_at: new Date(),
        updated_at: new Date(),
      }
    })

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

    // Automatically trigger full re-matching for ALL users with ALL scholarships
    // This runs asynchronously so it doesn't block the response
    // This ensures matches are always up-to-date after scraping
    
    // Get all users and all scholarships for full re-matching
    Promise.all([
      usersCollection.find({}).toArray(),
      scholarshipsCollection.find({}).toArray(),
    ]).then(([users, allScholarships]) => {
      console.log(`[Auto-Matching] Starting full re-match for ${users.length} users with ${allScholarships.length} scholarships`)
      
      const matchThreshold = 0.5
      
      // Match each user with all scholarships
      return Promise.all(
        users.map(async (user) => {
          if (!user.profile_embedding) {
            console.log(`[Auto-Matching] Skipping user ${user.auth0_id} - no profile embedding`)
            return
          }
          
          let matchesCreated = 0
          let matchesUpdated = 0
          
          for (const scholarship of allScholarships) {
            try {
              // Priority check: Program of study match
              if (!matchesProgramOfStudy(scholarship, user)) {
                continue
              }
              
              // Check for universal matches
              const isUniversalMatch = isUniversalCanadianMatch(scholarship, user)
              
              let similarity = 0
              let shouldMatch = false
              let matchReason = ''
              
              if (isUniversalMatch) {
                similarity = 1.0
                shouldMatch = true
                matchReason = 'Universal match - open to all Canadian students'
              } else if (scholarship.description_embedding && user.profile_embedding) {
                similarity = cosineSimilarity(
                  user.profile_embedding,
                  scholarship.description_embedding
                )
                shouldMatch = similarity >= matchThreshold
                matchReason = `Matched by embedding similarity (${Math.round(similarity * 100)}%)`
              } else {
                continue
              }
              
              if (shouldMatch) {
                const existingMatch = await matchesCollection.findOne({
                  user_id: user._id,
                  scholarship_id: scholarship._id,
                })
                
                if (existingMatch) {
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
                  await matchesCollection.updateOne(
                    { user_id: user._id, scholarship_id: scholarship._id },
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
                  matchesCreated++
                }
              }
            } catch (error) {
              console.error(`Error matching scholarship ${scholarship._id} for user ${user.auth0_id}:`, error)
            }
          }
          
          console.log(`[Auto-Matching] User ${user.auth0_id}: ${matchesCreated} created, ${matchesUpdated} updated`)
        })
      )
    }).then(() => {
      console.log(`[Auto-Matching] Full re-matching completed`)
    }).catch(error => {
      console.error('Error in full matching process:', error)
      // Don't fail the request if matching fails
    })

    return NextResponse.json({
      success: true,
      count: result.insertedCount,
      duplicates_skipped: scholarshipsWithEmbeddings.length - scholarshipsToInsert.length,
      scholarship_ids: Object.values(result.insertedIds).map(id => id.toString()),
      matching_triggered: true,
      message: 'Scholarships imported and full re-matching triggered for all users',
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
