'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { GraduationCap } from 'lucide-react'
import Link from 'next/link'

interface Profile {
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

export default function ProfileClient({ user }: { user: any }) {
  const { user: authUser } = useUser()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile>({
    auth0_id: '',
    email: authUser?.email || user?.email || '',
    name: authUser?.name || user?.name || '',
    school: '',
    program: '',
    gpa: null,
    province: '',
    citizenship: '',
    ethnicity: '',
    interests: [],
    demographics: {},
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">ScholarshipFinder</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-primary-600 font-medium">
                Dashboard
              </Link>
              <Link href="/api/auth/logout" className="text-gray-700 hover:text-primary-600 font-medium">
                Logout
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
          <p className="text-gray-600">Profile details submitted during onboarding</p>
        </div>

        <div className="space-y-6">
          <div className="card p-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <p className="text-gray-900">{profile.name || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <p className="text-gray-900">{profile.email || '—'}</p>
                <p className="text-xs text-gray-500 mt-1">Email managed by Auth0</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Academic Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current GPA</label>
                <p className="text-gray-900">{profile.gpa ?? '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Major/Field of Study</label>
                <p className="text-gray-900">{profile.program || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School</label>
                <p className="text-gray-900">{profile.school || '—'}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Demographics</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
                <p className="text-gray-900">{profile.province || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Citizenship Status</label>
                <p className="text-gray-900">{profile.citizenship || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ethnicity</label>
                <p className="text-gray-900">{profile.ethnicity || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Demographics</label>
                <p className="text-gray-900">
                  {Object.keys(profile.demographics || {}).length
                    ? JSON.stringify(profile.demographics)
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {profile.interests.length === 0 && (
                <span className="text-sm text-gray-500">No interests provided.</span>
              )}
              {profile.interests.map((interest, index) => (
                <span
                  key={index}
                  className="badge bg-primary-100 text-primary-800 flex items-center gap-2"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← Back to Dashboard
            </Link>
            <Link href="/onboard" className="btn-primary inline-flex items-center gap-2">
              Update via Onboarding
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
