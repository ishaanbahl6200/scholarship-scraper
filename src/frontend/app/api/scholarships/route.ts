import { getSession } from '@auth0/nextjs-auth0'
import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = await getDb()
    const user = await db.collection('users').findOne({ auth0_id: session.user.sub })

    if (!user) {
      return NextResponse.json([])
    }

    const matches = await db
      .collection('matches')
      .find({ user_id: user._id })
      .sort({ match_score: -1 })
      .toArray()

    let scholarships = []
    if (matches.length > 0) {
      const scholarshipIds = matches.map((match) => match.scholarship_id as ObjectId)
      const scholarshipDocs = await db
        .collection('scholarships')
        .find({ _id: { $in: scholarshipIds } })
        .toArray()

      const matchMap = new Map(
        matches.map((match) => [match.scholarship_id.toString(), match.match_score])
      )

      scholarships = scholarshipDocs.map((doc) => ({
        scholarship_id: doc._id.toString(),
        scholarship_name: doc.title,
        award_amount: doc.amount,
        match_score: matchMap.get(doc._id.toString()) ?? 0,
        deadline: doc.deadline ?? null,
        application_url: doc.source ?? '',
        application_status: 'Not Started',
        requirements: doc.eligibility ?? [],
      }))
    }

    return NextResponse.json(scholarships)
  } catch (error) {
    console.error('Error fetching scholarships:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
