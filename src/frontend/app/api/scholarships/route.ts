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
      return NextResponse.json(allScholarships)
    }

    const user = await db.collection('users').findOne({ auth0_id: session.user.sub })

    if (!user) {
      return NextResponse.json([])
    }

    const matches = await db
      .collection('matches')
      .find({ user_id: user._id })
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
    }

    return NextResponse.json(scholarships)
  } catch (error) {
    console.error('Error fetching scholarships:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
