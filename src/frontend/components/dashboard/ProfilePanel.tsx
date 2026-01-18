'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileUpdateSchema, ProfileUpdateInput } from '@/lib/validators'
import { TypingAnimation } from '@/components/ui/typing-animation'
import { SavedScholarship, UserProfile } from '@/lib/types'

const emptyProfile: UserProfile = {
  auth0_id: '',
  email: '',
  name: '',
  school: '',
  program: '',
  gpa: null,
  province: '',
  citizenship: '',
  ethnicity: '',
  interests: [],
  demographics: {},
}

export default function ProfilePanel() {
  const [profile, setProfile] = useState<UserProfile>(emptyProfile)
  const [saved, setSaved] = useState<SavedScholarship[]>([])
  const [completed, setCompleted] = useState<SavedScholarship[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {},
  })

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, savedRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/saved'),
        ])

        if (profileRes.ok) {
          const data = (await profileRes.json()) as UserProfile
          setProfile(data)
          form.reset({
            name: data.name,
            school: data.school,
            program: data.program,
            gpa: data.gpa ?? undefined,
            province: data.province,
            citizenship: data.citizenship,
            ethnicity: data.ethnicity,
            interests: data.interests,
          })
        }

        if (savedRes.ok) {
          const data = (await savedRes.json()) as SavedScholarship[]
          setSaved(data.filter((item) => item.status !== 'applied'))
          setCompleted(data.filter((item) => item.status === 'applied'))
        }
      } catch (error) {
        console.error('Error loading profile panel:', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [form])

  const onSubmit = async (values: ProfileUpdateInput) => {
    setSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (response.ok) {
        setProfile((prev) => ({ ...prev, ...values }))
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const removeSaved = async (id: string) => {
    await fetch(`/api/saved?scholarshipId=${id}`, { method: 'DELETE' })
    setSaved((prev) => prev.filter((item) => item.id !== id))
  }

  const markApplied = async (id: string) => {
    await fetch('/api/saved', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scholarshipId: id, status: 'applied' }),
    })
    const applied = saved.find((item) => item.id === id)
    if (applied) {
      setSaved((prev) => prev.filter((item) => item.id !== id))
      setCompleted((prev) => [...prev, { ...applied, status: 'applied' }])
    }
  }

  if (loading) {
    return (
      <section className="card">
        <p className="text-muted-foreground">Loading profile...</p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Profile</h2>
        <TypingAnimation
          text="Update your onboarding details and track progress."
          duration={30}
          className="text-sm md:text-base font-normal text-left text-muted-foreground leading-normal tracking-normal drop-shadow-none"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">User Info</h3>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Name</label>
              <input className="input-field" defaultValue={profile.name} {...form.register('name')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">School</label>
              <input className="input-field" defaultValue={profile.school} {...form.register('school')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Program</label>
              <input className="input-field" defaultValue={profile.program} {...form.register('program')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">GPA</label>
              <input type="number" step="0.01" className="input-field" {...form.register('gpa')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Province</label>
              <input className="input-field" defaultValue={profile.province} {...form.register('province')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Citizenship</label>
              <input className="input-field" defaultValue={profile.citizenship} {...form.register('citizenship')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Ethnicity</label>
              <input className="input-field" defaultValue={profile.ethnicity} {...form.register('ethnicity')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Interests</label>
              <input
                className="input-field"
                defaultValue={profile.interests.join(', ')}
                {...form.register('interests', {
                  setValueAs: (value) =>
                    typeof value === 'string'
                      ? value.split(',').map((item) => item.trim()).filter(Boolean)
                      : value,
                })}
              />
              <p className="text-xs text-muted-foreground mt-1">Comma-separated.</p>
            </div>
            <div className="md:col-span-2 flex items-center justify-center gap-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Saved</h3>
            {saved.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved scholarships yet.</p>
            ) : (
              saved.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span>{item.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => markApplied(item.id)} className="text-primary">
                      Mark applied
                    </button>
                    <button onClick={() => removeSaved(item.id)} className="text-muted-foreground">
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Completed</h3>
            {completed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed applications yet.</p>
            ) : (
              completed.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="text-green-500">Applied</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
