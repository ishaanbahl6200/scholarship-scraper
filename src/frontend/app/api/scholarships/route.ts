import { getSession } from '@auth0/nextjs-auth0'
import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const auth0UserId = session.user.sub

  try {
    const db = await getDb()
    const scope = request.nextUrl.searchParams.get('scope')

    if (scope === 'all') {
      const allDocs = await db.collection('scholarships').find({}).sort({ deadline: 1 }).toArray()
      const allScholarships = allDocs.map((doc) => ({
        scholarship_id: doc._id.toString(),
        scholarship_name: doc.title,
        award_amount: doc.amount,
        match_score: null,
        deadline: doc.deadline ?? null,
        application_url: doc.source ?? '',
        application_status: 'Not Started',
        requirements: doc.eligibility ?? [],
      }))
      
      // Remove duplicates by normalized title (more aggressive normalization)
      // Normalize function to handle special characters and whitespace
      const normalizeForComparison = (text: string): string => {
        return (text || '')
          .toLowerCase()
          .trim()
          .replace(/[^\w\s]/g, '') // Remove special characters
          .replace(/\s+/g, ' ') // Normalize whitespace
      }
      
      const seen = new Map<string, number>()
      const uniqueScholarships: typeof allScholarships = []
      
      for (const scholarship of allScholarships) {
        // Normalize title only (ignore source since same scholarship might have different sources)
        const normalizedTitle = normalizeForComparison(scholarship.scholarship_name || '')
        const key = normalizedTitle
        
        if (!seen.has(key)) {
          seen.set(key, uniqueScholarships.length)
          uniqueScholarships.push(scholarship)
        } else {
          // Duplicate found - log it for debugging
          const existingIndex = seen.get(key)!
          const existing = uniqueScholarships[existingIndex]
          console.log(`[Deduplication] Found duplicate: "${scholarship.scholarship_name}" (keeping first occurrence, existing: "${existing.scholarship_name}")`)
        }
      }
      
      console.log(`[Deduplication] Filtered ${allScholarships.length} scholarships to ${uniqueScholarships.length} unique entries`)
      
      return NextResponse.json(uniqueScholarships)
    }

    const user = await db.collection('users').findOne({ auth0_id: session.user.sub })

    if (!user) {
      return NextResponse.json([])
    }

    // Only get matches that meet the minimum threshold (50%)
    const matches = await db
      .collection('matches')
      .find({ 
        user_id: user._id,
        match_score: { $gte: 0.5 } // Only matches with at least 50% similarity
      })
      .sort({ match_score: -1 })
      .toArray()

    let scholarships: Array<{
      scholarship_id: string
      scholarship_name: string
      award_amount: number
      match_score: number
      deadline: string | null
      application_url: string
      application_status: string
      requirements: string[]
    }> = []
    if (matches.length > 0) {
      const scholarshipIds = matches.map((match) => match.scholarship_id as ObjectId)
      const scholarshipDocs = await db
        .collection('scholarships')
        .find({ _id: { $in: scholarshipIds } })
        .toArray()

      // Create a map of scholarship_id to match data (including application_status)
      const matchMap = new Map(
        matches.map((match) => [match.scholarship_id.toString(), match])
      )

      scholarships = scholarshipDocs.map((doc) => {
        const match = matchMap.get(doc._id.toString())
        return {
          scholarship_id: doc._id.toString(),
          scholarship_name: doc.title,
          award_amount: doc.amount || 0,
          match_score: match ? Math.round((match.match_score || 0.8) * 100) : 0, // Convert to percentage
          deadline: doc.deadline ? doc.deadline.toISOString() : null,
          application_url: doc.source || '',
          application_status: match?.application_status || 'Not Started',
          requirements: doc.eligibility || [],
        }
      })
      
      // Remove duplicates by scholarship_id (in case there are multiple matches for the same scholarship)
      const seen = new Set<string>()
      scholarships = scholarships.filter((scholarship) => {
        if (seen.has(scholarship.scholarship_id)) {
          return false
        }
        seen.add(scholarship.scholarship_id)
        return true
      })
    }

    return NextResponse.json(scholarships)
  } catch (error) {
    console.error('Error fetching scholarships:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
