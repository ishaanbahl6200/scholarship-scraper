'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { onboardingSchema, OnboardingInput } from '@/lib/validators'

const provinces = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Nova Scotia',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Northwest Territories',
  'Nunavut',
  'Yukon',
]

const citizenshipOptions = ['Canadian Citizen', 'Permanent Resident', 'International Student']

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
            <input className="input-field" {...form.register('school')} />
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.school?.message}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
            <input className="input-field" {...form.register('program')} />
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
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.province?.message}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Citizenship</label>
            <select className="input-field" {...form.register('citizenship')}>
              <option value="">Select status</option>
              {citizenshipOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
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
            <input className="input-field" {...form.register('ethnicity')} />
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
