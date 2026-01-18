import { getSession } from '@auth0/nextjs-auth0'
import { NextRequest, NextResponse } from 'next/server'
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

    const saved = await db
      .collection('saved_scholarships')
      .find({ user_id: user._id })
      .toArray()

    if (saved.length === 0) {
      return NextResponse.json([])
    }

    const scholarshipIds = saved.map((item) => item.scholarship_id as ObjectId)
    const scholarships = await db
      .collection('scholarships')
      .find({ _id: { $in: scholarshipIds } })
      .toArray()

    const statusMap = new Map(
      saved.map((item) => [item.scholarship_id.toString(), item.status || 'saved'])
    )

    const response = scholarships.map((doc) => ({
      id: doc._id.toString(),
      name: doc.title,
      amount: doc.amount,
      deadline: doc.deadline ?? null,
      applicationUrl: doc.source || null,
      status: statusMap.get(doc._id.toString()) || 'saved',
    }))

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching saved scholarships:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { scholarshipId } = await request.json()

  if (!scholarshipId) {
    return NextResponse.json({ error: 'Missing scholarshipId' }, { status: 400 })
  }

  try {
    const db = await getDb()
    const user = await db.collection('users').findOne({ auth0_id: session.user.sub })

    if (!user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    await db.collection('saved_scholarships').updateOne(
      { user_id: user._id, scholarship_id: new ObjectId(scholarshipId) },
      { $set: { status: 'saved', updated_at: new Date() } },
      { upsert: true }
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error saving scholarship:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { scholarshipId, status } = await request.json()

  if (!scholarshipId || !status) {
    return NextResponse.json({ error: 'Missing scholarshipId or status' }, { status: 400 })
  }

  try {
    const db = await getDb()
    const user = await db.collection('users').findOne({ auth0_id: session.user.sub })

    if (!user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    await db.collection('saved_scholarships').updateOne(
      { user_id: user._id, scholarship_id: new ObjectId(scholarshipId) },
      { $set: { status, updated_at: new Date() } },
      { upsert: true }
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error updating saved status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const scholarshipId = searchParams.get('scholarshipId')

  if (!scholarshipId) {
    return NextResponse.json({ error: 'Missing scholarshipId' }, { status: 400 })
  }

  try {
    const db = await getDb()
    const user = await db.collection('users').findOne({ auth0_id: session.user.sub })

    if (!user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    await db.collection('saved_scholarships').deleteOne({
      user_id: user._id,
      scholarship_id: new ObjectId(scholarshipId),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error removing saved scholarship:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
