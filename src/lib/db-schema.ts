import { ObjectId } from 'mongodb'

export interface User {
  _id: ObjectId
  auth0_id: string
  email: string
  school?: string
  program?: string
  gpa?: number
  location?: string
  ethnicity?: string
  profile_embedding?: number[]
  created_at?: Date
  updated_at?: Date
}

export interface Scholarship {
  _id: ObjectId
  title: string
  amount: number
  deadline?: Date
  description?: string
  eligibility?: string[]
  source?: string
  description_embedding?: number[]
  created_at?: Date
  updated_at?: Date
}

export interface SavedScholarship {
  _id: ObjectId
  user_id: ObjectId
  scholarship_id: ObjectId
  status?: string
  date_saved?: Date
}

export interface Match {
  _id: ObjectId
  user_id: ObjectId
  scholarship_id: ObjectId
  match_score: number
  reason?: string
  created_at?: Date
}

export interface LogEntry {
  _id: ObjectId
  user_id: ObjectId
  action: string
  timestamp: Date
  metadata?: Record<string, unknown>
}
