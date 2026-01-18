'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { onboardingSchema, OnboardingInput } from '@/lib/validators'
import { SearchableSelect } from '@/components/ui/searchable-select'

const provinceOptions = [
  { value: 'Alberta', label: 'Alberta' },
  { value: 'British Columbia', label: 'British Columbia' },
  { value: 'Manitoba', label: 'Manitoba' },
  { value: 'New Brunswick', label: 'New Brunswick' },
  { value: 'Newfoundland and Labrador', label: 'Newfoundland and Labrador' },
  { value: 'Northwest Territories', label: 'Northwest Territories' },
  { value: 'Nova Scotia', label: 'Nova Scotia' },
  { value: 'Nunavut', label: 'Nunavut' },
  { value: 'Ontario', label: 'Ontario' },
  { value: 'Prince Edward Island', label: 'Prince Edward Island' },
  { value: 'Quebec', label: 'Quebec' },
  { value: 'Saskatchewan', label: 'Saskatchewan' },
  { value: 'Yukon', label: 'Yukon' },
]

const citizenshipOptions = [
  { value: 'Canadian Citizen', label: 'Canadian Citizen' },
  { value: 'Permanent Resident', label: 'Permanent Resident' },
  { value: 'International Student', label: 'International Student' },
  { value: 'Refugee', label: 'Refugee' },
  { value: 'Other', label: 'Other' },
]

const ethnicityOptions = [
  { value: 'Indigenous (First Nations, Métis, Inuit)', label: 'Indigenous (First Nations, Métis, Inuit)' },
  { value: 'Black/African Canadian', label: 'Black/African Canadian' },
  { value: 'East Asian', label: 'East Asian' },
  { value: 'South Asian', label: 'South Asian' },
  { value: 'Southeast Asian', label: 'Southeast Asian' },
  { value: 'Middle Eastern', label: 'Middle Eastern' },
  { value: 'Latin American', label: 'Latin American' },
  { value: 'White/Caucasian', label: 'White/Caucasian' },
  { value: 'Mixed/Multi-racial', label: 'Mixed/Multi-racial' },
  { value: 'Other', label: 'Other' },
]

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
  { value: 'Toronto Metropolitan University', label: 'Toronto Metropolitan University', group: 'Ontario' },
  { value: 'University of Windsor', label: 'University of Windsor', group: 'Ontario' },
  { value: 'Brock University', label: 'Brock University', group: 'Ontario' },
  { value: 'Trent University', label: 'Trent University', group: 'Ontario' },
  { value: 'Lakehead University', label: 'Lakehead University', group: 'Ontario' },
  { value: 'Laurentian University', label: 'Laurentian University', group: 'Ontario' },
  { value: 'Nipissing University', label: 'Nipissing University', group: 'Ontario' },
  { value: 'Ontario Tech University', label: 'Ontario Tech University', group: 'Ontario' },
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

type Step = 0 | 1 | 2 | 3

export default function OnboardingForm({ defaultValues }: { defaultValues: Partial<OnboardingInput> }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(0)
  const [interestInput, setInterestInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: '',
      school: '',
      program: '',
      gpa: 0,
      province: '',
      citizenship: '',
      ethnicity: '',
      interests: [],
      demographics: '',
      ...defaultValues,
    },
    mode: 'onBlur',
  })

  const fields = form.watch()

  const stepTitles = useMemo(() => ['Academic Info', 'Location', 'Demographics', 'Interests'], [])

  const addInterest = () => {
    const trimmed = interestInput.trim()
    if (!trimmed) {
      return
    }
    form.setValue('interests', [...(fields.interests || []), trimmed], { shouldValidate: true })
    setInterestInput('')
  }

  const removeInterest = (index: number) => {
    const next = [...(fields.interests || [])]
    next.splice(index, 1)
    form.setValue('interests', next, { shouldValidate: true })
  }

  const onSubmit = async (values: OnboardingInput) => {
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to submit onboarding')
      }
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const nextStep = async () => {
    const toValidate: Record<Step, (keyof OnboardingInput)[]> = {
      0: ['name', 'school', 'program', 'gpa'],
      1: ['province', 'citizenship'],
      2: ['ethnicity', 'demographics'],
      3: ['interests'],
    }
    const valid = await form.trigger(toValidate[step])
    if (valid && step < 3) {
      setStep((step + 1) as Step)
    }
  }

  const prevStep = () => {
    if (step > 0) {
      setStep((step - 1) as Step)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">{stepTitles[step]}</h2>
        <span className="text-sm text-gray-500">
          Step {step + 1} of {stepTitles.length}
        </span>
      </div>

      {step === 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input className="input-field" {...form.register('name')} />
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.name?.message}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">School</label>
            <SearchableSelect
              options={schoolOptions}
              value={form.watch('school') || ''}
              onChange={(value) => form.setValue('school', value, { shouldValidate: true, shouldDirty: true })}
              placeholder="Search or select school"
            />
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.school?.message}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
            <SearchableSelect
              options={programOptions}
              value={form.watch('program') || ''}
              onChange={(value) => form.setValue('program', value, { shouldValidate: true, shouldDirty: true })}
              placeholder="Search or select program"
            />
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.program?.message}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">GPA</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="4"
              className="input-field"
              {...form.register('gpa', { valueAsNumber: true })}
            />
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.gpa?.message}</p>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
            <select className="input-field" {...form.register('province')}>
              <option value="">Select province</option>
              {provinceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.province?.message}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Citizenship</label>
            <select className="input-field" {...form.register('citizenship')}>
              <option value="">Select citizenship</option>
              {citizenshipOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.citizenship?.message}</p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ethnicity</label>
            <select className="input-field" {...form.register('ethnicity')}>
              <option value="">Select ethnicity</option>
              {ethnicityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.ethnicity?.message}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Demographics (optional)
            </label>
            <textarea className="input-field min-h-[120px]" {...form.register('demographics')} />
            <p className="text-xs text-gray-500 mt-1">
              Add extra details like community involvement, awards, or financial need.
            </p>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              className="input-field flex-1"
              placeholder="Add an interest (e.g., STEM, volunteer, athletics)"
              value={interestInput}
              onChange={(event) => setInterestInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addInterest()
                }
              }}
            />
            <button type="button" className="btn-primary" onClick={addInterest}>
              Add
            </button>
          </div>
          <p className="text-sm text-red-600">{form.formState.errors.interests?.message as string}</p>
          <div className="flex flex-wrap gap-2">
            {fields.interests?.map((interest, index) => (
              <span key={`${interest}-${index}`} className="badge bg-primary-100 text-primary-800">
                {interest}
                <button
                  type="button"
                  className="ml-2 text-primary-600"
                  onClick={() => removeInterest(index)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between">
        <button type="button" onClick={prevStep} className="btn-secondary" disabled={step === 0}>
          Back
        </button>
        {step < 3 ? (
          <button type="button" onClick={nextStep} className="btn-primary">
            Continue
          </button>
        ) : (
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Finish'}
          </button>
        )}
      </div>
    </form>
  )
}
