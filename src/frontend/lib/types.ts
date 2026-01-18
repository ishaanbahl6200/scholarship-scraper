export interface ScholarshipCard {
  id: string
  name: string
  amount?: number | null
  deadline?: string | null
  tags: string[]
  matchScore?: number | null
  matchReason?: string | null
  applicationUrl?: string | null
  status?: string | null
}

export interface UserProfile {
  auth0_id: string
  email: string
  name: string
  school: string
  program: string
  gpa: number | null
  province: string
  citizenship: string
  ethnicity: string
  interests: string[]
  demographics: Record<string, unknown>
}

export interface SavedScholarship {
  id: string
  name: string
  amount?: number | null
  deadline?: string | null
  applicationUrl?: string | null
  status: string
}
