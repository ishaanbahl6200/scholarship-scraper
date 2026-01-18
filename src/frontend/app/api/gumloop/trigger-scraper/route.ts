import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'

/**
 * Trigger Gumloop Scraper Workflow
 * Called when a user clicks the "Scrape Scholarships" button
 * 
 * This endpoint triggers the Gumloop scraper workflow to:
 * 1. Scrape scholarships from various sources
 * 2. Extract and structure scholarship data
 * 3. POST scholarships to /api/gumloop/scholarships (bulk import)
 */
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const gumloopApiKey = process.env.GUMLOOP_API_KEY
  const gumloopScraperWorkflowId = process.env.GUMLOOP_SCRAPER_WORKFLOW_ID
  const gumloopUserId = process.env.GUMLOOP_USER_ID

  if (!gumloopApiKey || !gumloopScraperWorkflowId || !gumloopUserId) {
    return NextResponse.json(
      { error: 'Gumloop scraper not configured. Missing GUMLOOP_API_KEY, GUMLOOP_SCRAPER_WORKFLOW_ID, or GUMLOOP_USER_ID' },
      { status: 500 }
    )
  }

  try {
    // Trigger Gumloop scraper workflow using webhook URL format
    // Format: https://api.gumloop.com/api/v1/start_pipeline?user_id=xxx&saved_item_id=xxx
    // saved_item_id is the workflow ID (8fUk8L2eiZJMjKUdwi4qog in your case)
    const response = await fetch(
      `https://api.gumloop.com/api/v1/start_pipeline?user_id=${gumloopUserId}&saved_item_id=${gumloopScraperWorkflowId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${gumloopApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
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
      message: 'Scraper workflow triggered successfully',
    })
  } catch (error) {
    console.error('Error triggering Gumloop scraper workflow:', error)
    return NextResponse.json(
      { error: 'Failed to trigger scraper workflow' },
      { status: 500 }
    )
  }
}
