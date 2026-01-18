import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'

/**
 * Trigger Gumloop Matching Workflow
 * Called when a user updates their profile or manually requests matching
 * 
 * This endpoint can trigger a Gumloop workflow to:
 * 1. Re-match user with all scholarships
 * 2. Send email digest with new matches
 * 3. Update match scores
 */
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const auth0UserId = session.user.sub
  const gumloopApiKey = process.env.GUMLOOP_API_KEY
  const gumloopWorkflowId = process.env.GUMLOOP_MATCHING_WORKFLOW_ID
  const gumloopUserId = process.env.GUMLOOP_USER_ID

  if (!gumloopApiKey || !gumloopWorkflowId || !gumloopUserId) {
    return NextResponse.json(
      { error: 'Gumloop not configured. Missing GUMLOOP_API_KEY, GUMLOOP_MATCHING_WORKFLOW_ID, or GUMLOOP_USER_ID' },
      { status: 500 }
    )
  }

  try {
    // Trigger Gumloop matching workflow using webhook URL format
    // Format: https://api.gumloop.com/api/v1/start_pipeline?user_id=xxx&saved_item_id=xxx
    const response = await fetch(
      `https://api.gumloop.com/api/v1/start_pipeline?user_id=${gumloopUserId}&saved_item_id=${gumloopWorkflowId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${gumloopApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth0_user_id: auth0UserId,
          trigger: 'profile_update', // or 'manual_match_request'
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Gumloop API error: ${error}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      workflow_run_id: data.run_id,
      message: 'Matching workflow triggered successfully',
    })
  } catch (error) {
    console.error('Error triggering Gumloop workflow:', error)
    return NextResponse.json(
      { error: 'Failed to trigger matching workflow' },
      { status: 500 }
    )
  }
}
