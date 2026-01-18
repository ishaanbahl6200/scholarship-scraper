import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import OnboardClient from './OnboardClient'
import { getDb } from '@/lib/db'
import { GridPattern } from '@/components/ui/grid-pattern'

async function getProfile(auth0Id: string) {
  try {
    const db = await getDb()
    const user = await db.collection('users').findOne({ auth0_id: auth0Id })
    return user
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

function isOnboardingComplete(user: any): boolean {
  if (!user) return false
  // Check if all required fields are present
  return !!(
    user.name &&
    user.school &&
    user.program &&
    user.province &&
    user.citizenship &&
    user.ethnicity &&
    Array.isArray(user.interests) &&
    user.interests.length > 0
  )
}

export default async function OnboardPage() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c9031b23-9f97-4d5f-a63f-0506ad990180',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A',location:'app/(auth)/onboard/page.tsx:35',message:'OnboardPage entry env presence',data:{hasAuth0Secret:!!process.env.AUTH0_SECRET,hasAuth0BaseUrl:!!process.env.AUTH0_BASE_URL,hasAuth0Issuer:!!process.env.AUTH0_ISSUER_BASE_URL,hasAuth0ClientId:!!process.env.AUTH0_CLIENT_ID,hasAuth0ClientSecret:!!process.env.AUTH0_CLIENT_SECRET,cwd:process.cwd()},timestamp:Date.now()})}).catch(()=>{});
  // #endregion agent log
  let session
  try {
    session = await getSession()
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c9031b23-9f97-4d5f-a63f-0506ad990180',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B',location:'app/(auth)/onboard/page.tsx:40',message:'getSession success',data:{hasSession:!!session},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c9031b23-9f97-4d5f-a63f-0506ad990180',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C',location:'app/(auth)/onboard/page.tsx:44',message:'getSession error',data:{errorName:error instanceof Error ? error.name : 'unknown',errorMessage:error instanceof Error ? error.message : 'unknown'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log
    throw error
  }

  if (!session) {
    redirect('/api/auth/login')
  }

  // Load existing profile data
  const existingProfile = await getProfile(session.user.sub)

  // If onboarding is already complete, redirect to dashboard
  if (existingProfile && isOnboardingComplete(existingProfile)) {
    redirect('/dashboard')
  }

  // Pre-fill form with existing data or Auth0 data
  // If no profile exists, create a basic user record first
  if (!existingProfile) {
    try {
      const db = await getDb()
      const now = new Date()
      await db.collection('users').insertOne({
        auth0_id: session.user.sub,
        email: session.user.email,
        created_at: now,
        updated_at: now,
      })
    } catch (error) {
      console.error('Error creating user record:', error)
    }
  }

  const defaultValues = {
    name: existingProfile?.name || session.user.name || '',
    school: existingProfile?.school || '',
    program: existingProfile?.program || '',
    gpa: existingProfile?.gpa ?? 0,
    province: existingProfile?.province || '',
    citizenship: existingProfile?.citizenship || '',
    ethnicity: existingProfile?.ethnicity || '',
    interests: existingProfile?.interests || [],
    demographics: existingProfile?.demographics 
      ? (typeof existingProfile.demographics === 'string' 
          ? existingProfile.demographics 
          : JSON.stringify(existingProfile.demographics))
      : '',
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <GridPattern
        width={32}
        height={32}
        x={-1}
        y={-1}
        className="[mask-image:radial-gradient(900px_circle_at_center,white,transparent)] opacity-70"
      />
      <Link
        href="/"
        className="absolute left-8 top-8 z-10 inline-flex items-center gap-2 rounded-full p-2 text-white/90 hover:text-white transition-colors"
        aria-label="Back to landing page"
      >
        <span className="text-2xl font-light tracking-tight">Grantly.</span>
      </Link>
      <div className="relative max-w-5xl mx-auto px-4 py-10 min-h-screen flex items-center">
        <OnboardClient defaultValues={defaultValues} />
      </div>
    </div>
  )
}
