import { getSession } from '@auth0/nextjs-auth0'
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { onboardingSchema } from '@/lib/validators'
import { generateEmbedding } from '@/lib/gemini'

function parseDemographics(input?: string): Record<string, unknown> | undefined {
  if (!input?.trim()) {
    return undefined
  }

  try {
    return JSON.parse(input)
  } catch {
    return { note: input }
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await request.json()
  const parsed = onboardingSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const db = await getDb()
  const now = new Date()
  const demographics = parseDemographics(parsed.data.demographics)

  const profileText = [
    parsed.data.name,
    parsed.data.school,
    parsed.data.program,
    `GPA: ${parsed.data.gpa}`,
    `Province: ${parsed.data.province}`,
    `Citizenship: ${parsed.data.citizenship}`,
    `Ethnicity: ${parsed.data.ethnicity}`,
    parsed.data.interests.join(', '),
    demographics ? JSON.stringify(demographics) : null,
  ]
    .filter(Boolean)
    .join('\n')

  let embedding: number[] | null = null
  try {
    embedding = await generateEmbedding(profileText)
  } catch (error) {
    console.error('Failed to generate embedding:', error)
  }

  await db.collection('users').updateOne(
    { auth0_id: session.user.sub },
    {
      $set: {
        auth0_id: session.user.sub,
        email: session.user.email,
        name: parsed.data.name,
        school: parsed.data.school,
        program: parsed.data.program,
        gpa: parsed.data.gpa,
        province: parsed.data.province,
        citizenship: parsed.data.citizenship,
        ethnicity: parsed.data.ethnicity,
        interests: parsed.data.interests,
        demographics,
        profile_embedding: embedding ?? undefined,
        updated_at: now,
      },
      $setOnInsert: {
        created_at: now,
      },
    },
    { upsert: true }
  )

  if (process.env.GUMLOOP_WEBHOOK_URL) {
    fetch(process.env.GUMLOOP_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth0_id: session.user.sub,
        email: session.user.email,
      }),
    }).catch((error) => console.error('Gumloop webhook failed:', error))
  } else {
    console.log('Gumloop webhook not configured; skipping trigger.')
  }

  return NextResponse.json({ ok: true })
}
