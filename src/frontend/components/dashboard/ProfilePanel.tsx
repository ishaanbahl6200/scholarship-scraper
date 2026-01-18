'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileUpdateSchema, ProfileUpdateInput } from '@/lib/validators'
import { TypingAnimation } from '@/components/ui/typing-animation'
import { SavedScholarship, UserProfile } from '@/lib/types'
import { ChevronDown, X } from 'lucide-react'

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

const schoolOptions = [
  { value: 'University of Toronto', label: 'University of Toronto', group: 'Ontario' },
  { value: 'McMaster University', label: 'McMaster University', group: 'Ontario' },
  { value: 'University of Waterloo', label: 'University of Waterloo', group: 'Ontario' },
  { value: 'Western University', label: 'Western University', group: 'Ontario' },
  { value: "Queen's University", label: "Queen's University", group: 'Ontario' },
  { value: 'University of Ottawa', label: 'University of Ottawa', group: 'Ontario' },
  { value: 'York University', label: 'York University', group: 'Ontario' },
  { value: 'University of Guelph', label: 'University of Guelph', group: 'Ontario' },
  { value: 'Carleton University', label: 'Carleton University', group: 'Ontario' },
  { value: 'Ryerson University', label: 'Ryerson University', group: 'Ontario' },
  { value: 'University of Windsor', label: 'University of Windsor', group: 'Ontario' },
  { value: 'Brock University', label: 'Brock University', group: 'Ontario' },
  { value: 'Trent University', label: 'Trent University', group: 'Ontario' },
  { value: 'Lakehead University', label: 'Lakehead University', group: 'Ontario' },
  { value: 'Laurentian University', label: 'Laurentian University', group: 'Ontario' },
  { value: 'Nipissing University', label: 'Nipissing University', group: 'Ontario' },
  { value: 'Ontario Tech University', label: 'Ontario Tech University', group: 'Ontario' },
  { value: 'University of Ontario Institute of Technology', label: 'University of Ontario Institute of Technology', group: 'Ontario' },
  { value: 'University of British Columbia', label: 'University of British Columbia', group: 'British Columbia' },
  { value: 'Simon Fraser University', label: 'Simon Fraser University', group: 'British Columbia' },
  { value: 'University of Victoria', label: 'University of Victoria', group: 'British Columbia' },
  { value: 'University of Northern British Columbia', label: 'University of Northern British Columbia', group: 'British Columbia' },
  { value: 'Thompson Rivers University', label: 'Thompson Rivers University', group: 'British Columbia' },
  { value: 'Vancouver Island University', label: 'Vancouver Island University', group: 'British Columbia' },
  { value: 'University of Alberta', label: 'University of Alberta', group: 'Alberta' },
  { value: 'University of Calgary', label: 'University of Calgary', group: 'Alberta' },
  { value: 'University of Lethbridge', label: 'University of Lethbridge', group: 'Alberta' },
  { value: 'Athabasca University', label: 'Athabasca University', group: 'Alberta' },
  { value: 'Mount Royal University', label: 'Mount Royal University', group: 'Alberta' },
  { value: 'McGill University', label: 'McGill University', group: 'Quebec' },
  { value: 'Université de Montréal', label: 'Université de Montréal', group: 'Quebec' },
  { value: 'Université Laval', label: 'Université Laval', group: 'Quebec' },
  { value: 'Concordia University', label: 'Concordia University', group: 'Quebec' },
  { value: 'Université du Québec', label: 'Université du Québec', group: 'Quebec' },
  { value: "Bishop's University", label: "Bishop's University", group: 'Quebec' },
  { value: 'University of Manitoba', label: 'University of Manitoba', group: 'Manitoba' },
  { value: 'University of Winnipeg', label: 'University of Winnipeg', group: 'Manitoba' },
  { value: 'Brandon University', label: 'Brandon University', group: 'Manitoba' },
  { value: 'University of Saskatchewan', label: 'University of Saskatchewan', group: 'Saskatchewan' },
  { value: 'University of Regina', label: 'University of Regina', group: 'Saskatchewan' },
  { value: 'Dalhousie University', label: 'Dalhousie University', group: 'Nova Scotia' },
  { value: "Saint Mary's University", label: "Saint Mary's University", group: 'Nova Scotia' },
  { value: 'Acadia University', label: 'Acadia University', group: 'Nova Scotia' },
  { value: 'Mount Saint Vincent University', label: 'Mount Saint Vincent University', group: 'Nova Scotia' },
  { value: 'St. Francis Xavier University', label: 'St. Francis Xavier University', group: 'Nova Scotia' },
  { value: 'Cape Breton University', label: 'Cape Breton University', group: 'Nova Scotia' },
  { value: 'University of New Brunswick', label: 'University of New Brunswick', group: 'New Brunswick' },
  { value: 'Mount Allison University', label: 'Mount Allison University', group: 'New Brunswick' },
  { value: 'St. Thomas University', label: 'St. Thomas University', group: 'New Brunswick' },
  { value: 'Memorial University of Newfoundland', label: 'Memorial University of Newfoundland', group: 'Newfoundland and Labrador' },
  { value: 'University of Prince Edward Island', label: 'University of Prince Edward Island', group: 'Prince Edward Island' },
  { value: 'Other', label: 'Other', group: '' },
]

const programOptions = [
  { value: 'Computer Engineering', label: 'Computer Engineering', group: 'Engineering' },
  { value: 'Software Engineering', label: 'Software Engineering', group: 'Engineering' },
  { value: 'Electrical Engineering', label: 'Electrical Engineering', group: 'Engineering' },
  { value: 'Mechanical Engineering', label: 'Mechanical Engineering', group: 'Engineering' },
  { value: 'Civil Engineering', label: 'Civil Engineering', group: 'Engineering' },
  { value: 'Chemical Engineering', label: 'Chemical Engineering', group: 'Engineering' },
  { value: 'Biomedical Engineering', label: 'Biomedical Engineering', group: 'Engineering' },
  { value: 'Aerospace Engineering', label: 'Aerospace Engineering', group: 'Engineering' },
  { value: 'Environmental Engineering', label: 'Environmental Engineering', group: 'Engineering' },
  { value: 'Industrial Engineering', label: 'Industrial Engineering', group: 'Engineering' },
  { value: 'Business Administration', label: 'Business Administration', group: 'Business & Commerce' },
  { value: 'Commerce', label: 'Commerce', group: 'Business & Commerce' },
  { value: 'Finance', label: 'Finance', group: 'Business & Commerce' },
  { value: 'Accounting', label: 'Accounting', group: 'Business & Commerce' },
  { value: 'Marketing', label: 'Marketing', group: 'Business & Commerce' },
  { value: 'Management', label: 'Management', group: 'Business & Commerce' },
  { value: 'Entrepreneurship', label: 'Entrepreneurship', group: 'Business & Commerce' },
  { value: 'Economics', label: 'Economics', group: 'Business & Commerce' },
  { value: 'Computer Science', label: 'Computer Science', group: 'Science' },
  { value: 'Mathematics', label: 'Mathematics', group: 'Science' },
  { value: 'Physics', label: 'Physics', group: 'Science' },
  { value: 'Chemistry', label: 'Chemistry', group: 'Science' },
  { value: 'Biology', label: 'Biology', group: 'Science' },
  { value: 'Biochemistry', label: 'Biochemistry', group: 'Science' },
  { value: 'Environmental Science', label: 'Environmental Science', group: 'Science' },
  { value: 'Statistics', label: 'Statistics', group: 'Science' },
  { value: 'Data Science', label: 'Data Science', group: 'Science' },
  { value: 'Medicine', label: 'Medicine', group: 'Health Sciences' },
  { value: 'Nursing', label: 'Nursing', group: 'Health Sciences' },
  { value: 'Pharmacy', label: 'Pharmacy', group: 'Health Sciences' },
  { value: 'Kinesiology', label: 'Kinesiology', group: 'Health Sciences' },
  { value: 'Public Health', label: 'Public Health', group: 'Health Sciences' },
  { value: 'Health Sciences', label: 'Health Sciences', group: 'Health Sciences' },
  { value: 'Biomedical Sciences', label: 'Biomedical Sciences', group: 'Health Sciences' },
  { value: 'English', label: 'English', group: 'Arts & Humanities' },
  { value: 'History', label: 'History', group: 'Arts & Humanities' },
  { value: 'Philosophy', label: 'Philosophy', group: 'Arts & Humanities' },
  { value: 'Psychology', label: 'Psychology', group: 'Arts & Humanities' },
  { value: 'Sociology', label: 'Sociology', group: 'Arts & Humanities' },
  { value: 'Political Science', label: 'Political Science', group: 'Arts & Humanities' },
  { value: 'International Relations', label: 'International Relations', group: 'Arts & Humanities' },
  { value: 'Communications', label: 'Communications', group: 'Arts & Humanities' },
  { value: 'Journalism', label: 'Journalism', group: 'Arts & Humanities' },
  { value: 'Education', label: 'Education', group: 'Education' },
  { value: 'Early Childhood Education', label: 'Early Childhood Education', group: 'Education' },
  { value: 'Special Education', label: 'Special Education', group: 'Education' },
  { value: 'Fine Arts', label: 'Fine Arts', group: 'Fine Arts' },
  { value: 'Music', label: 'Music', group: 'Fine Arts' },
  { value: 'Theatre', label: 'Theatre', group: 'Fine Arts' },
  { value: 'Film Studies', label: 'Film Studies', group: 'Fine Arts' },
  { value: 'Design', label: 'Design', group: 'Fine Arts' },
  { value: 'Architecture', label: 'Architecture', group: 'Other' },
  { value: 'Law', label: 'Law', group: 'Other' },
  { value: 'Social Work', label: 'Social Work', group: 'Other' },
  { value: 'Criminology', label: 'Criminology', group: 'Other' },
  { value: 'Agriculture', label: 'Agriculture', group: 'Other' },
  { value: 'Forestry', label: 'Forestry', group: 'Other' },
  { value: 'Other', label: 'Other', group: '' },
]

interface SearchableSelectProps {
  options: Array<{ value: string; label: string; group?: string }>
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

function SearchableSelect({ options, value, onChange, placeholder = 'Search...', className = '' }: SearchableSelectProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  const filteredOptions = searchQuery
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.group?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className="input-field flex items-center justify-between cursor-pointer"
        onClick={() => {
          setIsOpen(!isOpen)
          inputRef.current?.focus()
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchQuery : (selectedOption?.label || '')}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedOption ? undefined : placeholder}
          className="flex-1 bg-transparent border-none outline-none"
        />
        <div className="flex items-center gap-1">
          {value && isOpen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
                setSearchQuery('')
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No results found</div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-muted ${
                  value === option.value ? 'bg-primary/10 text-primary' : ''
                }`}
              >
                {option.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function ProfilePanel() {
  const [profile, setProfile] = useState<UserProfile>(emptyProfile)
  const [saved, setSaved] = useState<SavedScholarship[]>([])
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
      console.log('Submitting profile update:', values)
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      
      const responseData = await response.json().catch(() => ({ error: 'Failed to parse response' }))
      
      if (response.ok) {
        const updatedProfile = { ...profile, ...values } as UserProfile
        setProfile(updatedProfile)
        // Update form with saved values
        form.reset(values)
        console.log('Profile saved successfully')
        alert('Profile saved successfully!')
      } else {
        console.error('Profile save failed:', responseData)
        alert(`Error: ${responseData.error || 'Failed to save profile'}. ${responseData.details ? JSON.stringify(responseData.details) : ''}`)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert(`Failed to save profile: ${error instanceof Error ? error.message : 'Please try again.'}`)
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
    setSaved((prev) => prev.filter((item) => item.id !== id))
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
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground">Profile</h2>
        <TypingAnimation
          text="Update your onboarding details and track progress."
          duration={30}
          className="text-sm md:text-base font-normal text-center text-muted-foreground leading-normal tracking-normal drop-shadow-none"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2 space-y-4 p-3">
          <h3 className="text-lg font-semibold text-foreground">User Info</h3>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Name</label>
              <input className="input-field" {...form.register('name')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">School</label>
              <SearchableSelect
                options={schoolOptions}
                value={form.watch('school') || ''}
                onChange={(value) => form.setValue('school', value, { shouldValidate: true, shouldDirty: true })}
                placeholder="Search or select school"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Program</label>
              <SearchableSelect
                options={programOptions}
                value={form.watch('program') || ''}
                onChange={(value) => form.setValue('program', value, { shouldValidate: true, shouldDirty: true })}
                placeholder="Search or select program"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">GPA</label>
              <input type="number" step="0.01" min="0" max="4" className="input-field" {...form.register('gpa', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Province</label>
              <select className="input-field" {...form.register('province')}>
                <option value="">Select province</option>
                <option value="Alberta">Alberta</option>
                <option value="British Columbia">British Columbia</option>
                <option value="Manitoba">Manitoba</option>
                <option value="New Brunswick">New Brunswick</option>
                <option value="Newfoundland and Labrador">Newfoundland and Labrador</option>
                <option value="Northwest Territories">Northwest Territories</option>
                <option value="Nova Scotia">Nova Scotia</option>
                <option value="Nunavut">Nunavut</option>
                <option value="Ontario">Ontario</option>
                <option value="Prince Edward Island">Prince Edward Island</option>
                <option value="Quebec">Quebec</option>
                <option value="Saskatchewan">Saskatchewan</option>
                <option value="Yukon">Yukon</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Citizenship</label>
              <select className="input-field" {...form.register('citizenship')}>
                <option value="">Select citizenship</option>
                <option value="Canadian Citizen">Canadian Citizen</option>
                <option value="Permanent Resident">Permanent Resident</option>
                <option value="International Student">International Student</option>
                <option value="Refugee">Refugee</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Ethnicity</label>
              <select className="input-field" {...form.register('ethnicity')}>
                <option value="">Select ethnicity</option>
                <option value="Indigenous (First Nations, Métis, Inuit)">Indigenous (First Nations, Métis, Inuit)</option>
                <option value="Black/African Canadian">Black/African Canadian</option>
                <option value="East Asian">East Asian</option>
                <option value="South Asian">South Asian</option>
                <option value="Southeast Asian">Southeast Asian</option>
                <option value="Middle Eastern">Middle Eastern</option>
                <option value="Latin American">Latin American</option>
                <option value="White/Caucasian">White/Caucasian</option>
                <option value="Mixed/Multi-racial">Mixed/Multi-racial</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Interests</label>
              <input
                className="input-field"
                placeholder="e.g., Engineering, Business, Arts"
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

        </div>
      </div>
    </section>
  )
}
