import { getSession } from '@auth0/nextjs-auth0'
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { profileUpdateSchema } from '@/lib/validators'
import { generateEmbedding } from '@/lib/gemini'

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
  console.log('Profile update payload:', payload)
  const parsed = profileUpdateSchema.safeParse(payload)

  if (!parsed.success) {
    console.error('Profile update validation failed:', parsed.error.flatten())
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  
  console.log('Profile update validated:', parsed.data)

  try {
    const db = await getDb()
    const now = new Date()
    
    // Get current user to merge with updated data
    const currentUser = await db.collection('users').findOne({ auth0_id: session.user.sub })
    
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Merge current data with updates
    const updatedData = {
      ...currentUser,
      ...parsed.data,
      updated_at: now,
    }
    
    // Regenerate embedding if profile data changed
    const profileText = [
      updatedData.name || '',
      updatedData.school || '',
      updatedData.program || '',
      updatedData.gpa ? `GPA: ${updatedData.gpa}` : '',
      updatedData.province ? `Province: ${updatedData.province}` : '',
      updatedData.citizenship ? `Citizenship: ${updatedData.citizenship}` : '',
      updatedData.ethnicity ? `Ethnicity: ${updatedData.ethnicity}` : '',
      Array.isArray(updatedData.interests) ? updatedData.interests.join(', ') : '',
      updatedData.demographics ? JSON.stringify(updatedData.demographics) : '',
    ]
      .filter(Boolean)
      .join('\n')
    
    let embedding: number[] | null = null
    if (profileText.trim()) {
      try {
        embedding = await generateEmbedding(profileText)
      } catch (error) {
        console.error('Failed to generate embedding:', error)
        // Continue without embedding if generation fails
      }
    }
    
    // Update user with new data and embedding
    const updateDoc: any = {
      ...parsed.data,
      updated_at: now,
    }
    
    if (embedding) {
      updateDoc.profile_embedding = embedding
    }
    
    const updateResult = await db.collection('users').updateOne(
      { auth0_id: session.user.sub },
      { $set: updateDoc }
    )
    
    console.log('Profile update result:', {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      updateDoc: Object.keys(updateDoc),
    })

    // Trigger scraper workflow after profile update (fire and forget)
    try {
      const gumloopApiKey = process.env.GUMLOOP_API_KEY
      const gumloopScraperWorkflowId = process.env.GUMLOOP_SCRAPER_WORKFLOW_ID
      const gumloopUserId = process.env.GUMLOOP_USER_ID

      if (gumloopApiKey && gumloopScraperWorkflowId && gumloopUserId) {
        // Trigger asynchronously (don't wait for response)
        fetch(
          `https://api.gumloop.com/api/v1/start_pipeline?user_id=${gumloopUserId}&saved_item_id=${gumloopScraperWorkflowId}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${gumloopApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          }
        ).catch(err => {
          console.error('Failed to trigger scraper after profile update:', err)
          // Don't fail the profile update if scraper trigger fails
        })
      }
    } catch (scraperError) {
      // Silently fail - profile update should still succeed
      console.error('Scraper trigger error:', scraperError)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error saving profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
