'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { GraduationCap, Save, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Profile {
  auth0_user_id: string
  email: string
  name: string
  current_gpa: number
  major: string
  year: string
  location_state: string
  age: number
  citizenship_status: string
  financial_need_level: string
  interests: string[]
  extracurriculars: string[]
  scholarship_preferences: {
    min_amount: number
    max_amount: number
  }
}

export default function ProfileClient({ user }: { user: any }) {
  const { user: authUser } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState<Profile>({
    auth0_user_id: '',
    email: authUser?.email || user?.email || '',
    name: authUser?.name || user?.name || '',
    current_gpa: 0,
    major: '',
    year: '',
    location_state: '',
    age: 0,
    citizenship_status: '',
    financial_need_level: '',
    interests: [],
    extracurriculars: [],
    scholarship_preferences: {
      min_amount: 0,
      max_amount: 0,
    },
  })

  const [interestInput, setInterestInput] = useState('')
  const [extracurricularInput, setExtracurricularInput] = useState('')

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

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const addInterest = () => {
    if (interestInput.trim()) {
      setProfile({
        ...profile,
        interests: [...profile.interests, interestInput.trim()],
      })
      setInterestInput('')
    }
  }

  const removeInterest = (index: number) => {
    setProfile({
      ...profile,
      interests: profile.interests.filter((_, i) => i !== index),
    })
  }

  const addExtracurricular = () => {
    if (extracurricularInput.trim()) {
      setProfile({
        ...profile,
        extracurriculars: [...profile.extracurriculars, extracurricularInput.trim()],
      })
      setExtracurricularInput('')
    }
  }

  const removeExtracurricular = (index: number) => {
    setProfile({
      ...profile,
      extracurriculars: profile.extracurriculars.filter((_, i) => i !== index),
    })
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
          <p className="text-gray-600">Update your information to get better scholarship matches</p>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" value={profile.email} disabled className="input-field bg-gray-50" />
                <p className="text-xs text-gray-500 mt-1">Email managed by Auth0</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Academic Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current GPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.0"
                  value={profile.current_gpa}
                  onChange={(e) =>
                    setProfile({ ...profile, current_gpa: parseFloat(e.target.value) || 0 })
                  }
                  className="input-field"
                  placeholder="3.75"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Major/Field of Study</label>
                <input
                  type="text"
                  value={profile.major}
                  onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                  className="input-field"
                  placeholder="Computer Science"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year in School</label>
                <select
                  value={profile.year}
                  onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select year</option>
                  <option value="Freshman">Freshman</option>
                  <option value="Sophomore">Sophomore</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                  <option value="Graduate">Graduate Student</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Demographics</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location/Province</label>
                <input
                  type="text"
                  value={profile.location_state}
                  onChange={(e) => setProfile({ ...profile, location_state: e.target.value })}
                  className="input-field"
                  placeholder="Ontario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                <input
                  type="number"
                  min="16"
                  max="100"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Citizenship Status</label>
                <select
                  value={profile.citizenship_status}
                  onChange={(e) => setProfile({ ...profile, citizenship_status: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select status</option>
                  <option value="Canadian Citizen">Canadian Citizen</option>
                  <option value="Permanent Resident">Permanent Resident</option>
                  <option value="International Student">International Student</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Financial Need Level</label>
                <select
                  value={profile.financial_need_level}
                  onChange={(e) => setProfile({ ...profile, financial_need_level: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select level</option>
                  <option value="High Need">High Need</option>
                  <option value="Moderate Need">Moderate Need</option>
                  <option value="Low Need">Low Need</option>
                  <option value="No Need">No Need</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Interests</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                className="input-field flex-1"
                placeholder="Add an interest (e.g., Sports, Arts, STEM)"
              />
              <button onClick={addInterest} className="btn-primary">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, index) => (
                <span
                  key={index}
                  className="badge bg-primary-100 text-primary-800 flex items-center gap-2"
                >
                  {interest}
                  <button onClick={() => removeInterest(index)} className="hover:text-primary-600">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Extracurriculars</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={extracurricularInput}
                onChange={(e) => setExtracurricularInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addExtracurricular()}
                className="input-field flex-1"
                placeholder="Add an activity (e.g., Student Council, Robotics Club)"
              />
              <button onClick={addExtracurricular} className="btn-primary">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.extracurriculars.map((activity, index) => (
                <span key={index} className="badge bg-green-100 text-green-800 flex items-center gap-2">
                  {activity}
                  <button onClick={() => removeExtracurricular(index)} className="hover:text-green-600">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Scholarship Preferences</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={profile.scholarship_preferences.min_amount}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      scholarship_preferences: {
                        ...profile.scholarship_preferences,
                        min_amount: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="input-field"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={profile.scholarship_preferences.max_amount || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      scholarship_preferences: {
                        ...profile.scholarship_preferences,
                        max_amount: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="input-field"
                  placeholder="No limit"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← Back to Dashboard
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary inline-flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
