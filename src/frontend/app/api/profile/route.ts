import { getSession } from '@auth0/nextjs-auth0'
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { profileUpdateSchema } from '@/lib/validators'

export async function GET() {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = await getDb()
    const user = await db.collection('users').findOne({ auth0_id: session.user.sub })

    if (!user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      auth0_id: user.auth0_id,
      email: user.email,
      name: user.name || '',
      school: user.school || '',
      program: user.program || '',
      gpa: user.gpa ?? null,
      province: user.province || '',
      citizenship: user.citizenship || '',
      ethnicity: user.ethnicity || '',
      interests: user.interests || [],
      demographics: user.demographics || {},
      updated_at: user.updated_at,
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ error: 'Profile updates are managed via onboarding' }, { status: 405 })
}

export async function PATCH(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await request.json()
  const parsed = profileUpdateSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const db = await getDb()
    const now = new Date()
    await db.collection('users').updateOne(
      { auth0_id: session.user.sub },
      { $set: { ...parsed.data, updated_at: now } }
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error saving profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
