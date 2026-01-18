'use client'

import { useState } from 'react'
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
  { value: 'Algonquin College', label: 'Algonquin College', group: 'Colleges - Ontario' },
  { value: 'Seneca College', label: 'Seneca College', group: 'Colleges - Ontario' },
  { value: 'Humber College', label: 'Humber College', group: 'Colleges - Ontario' },
  { value: 'George Brown College', label: 'George Brown College', group: 'Colleges - Ontario' },
  { value: 'Centennial College', label: 'Centennial College', group: 'Colleges - Ontario' },
  { value: 'Sheridan College', label: 'Sheridan College', group: 'Colleges - Ontario' },
  { value: 'Fanshawe College', label: 'Fanshawe College', group: 'Colleges - Ontario' },
  { value: 'Conestoga College', label: 'Conestoga College', group: 'Colleges - Ontario' },
  { value: 'Mohawk College', label: 'Mohawk College', group: 'Colleges - Ontario' },
  { value: 'St. Lawrence College', label: 'St. Lawrence College', group: 'Colleges - Ontario' },
  { value: 'Lambton College', label: 'Lambton College', group: 'Colleges - Ontario' },
  { value: 'Niagara College', label: 'Niagara College', group: 'Colleges - Ontario' },
  { value: 'Durham College', label: 'Durham College', group: 'Colleges - Ontario' },
  { value: 'Fleming College', label: 'Fleming College', group: 'Colleges - Ontario' },
  { value: 'Loyalist College', label: 'Loyalist College', group: 'Colleges - Ontario' },
  { value: 'Sault College', label: 'Sault College', group: 'Colleges - Ontario' },
  { value: 'Cambrian College', label: 'Cambrian College', group: 'Colleges - Ontario' },
  { value: 'Northern College', label: 'Northern College', group: 'Colleges - Ontario' },
  { value: 'Confederation College', label: 'Confederation College', group: 'Colleges - Ontario' },
  { value: 'Canadore College', label: 'Canadore College', group: 'Colleges - Ontario' },
  { value: 'Georgian College', label: 'Georgian College', group: 'Colleges - Ontario' },
  { value: 'BCIT', label: 'British Columbia Institute of Technology', group: 'Colleges - British Columbia' },
  { value: 'Langara College', label: 'Langara College', group: 'Colleges - British Columbia' },
  { value: 'Douglas College', label: 'Douglas College', group: 'Colleges - British Columbia' },
  { value: 'Kwantlen Polytechnic University', label: 'Kwantlen Polytechnic University', group: 'Colleges - British Columbia' },
  { value: 'Camosun College', label: 'Camosun College', group: 'Colleges - British Columbia' },
  { value: 'Capilano University', label: 'Capilano University', group: 'Colleges - British Columbia' },
  { value: 'Northern Alberta Institute of Technology', label: 'Northern Alberta Institute of Technology (NAIT)', group: 'Colleges - Alberta' },
  { value: 'Southern Alberta Institute of Technology', label: 'Southern Alberta Institute of Technology (SAIT)', group: 'Colleges - Alberta' },
  { value: 'Bow Valley College', label: 'Bow Valley College', group: 'Colleges - Alberta' },
  { value: 'Red River College', label: 'Red River College', group: 'Colleges - Manitoba' },
  { value: 'Saskatchewan Polytechnic', label: 'Saskatchewan Polytechnic', group: 'Colleges - Saskatchewan' },
  { value: 'Nova Scotia Community College', label: 'Nova Scotia Community College (NSCC)', group: 'Colleges - Nova Scotia' },
  { value: 'New Brunswick Community College', label: 'New Brunswick Community College (NBCC)', group: 'Colleges - New Brunswick' },
  { value: 'College of the North Atlantic', label: 'College of the North Atlantic', group: 'Colleges - Newfoundland and Labrador' },
  { value: 'Holland College', label: 'Holland College', group: 'Colleges - Prince Edward Island' },
  { value: 'Cégep', label: 'Cégep (Quebec)', group: 'Colleges - Quebec' },
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

export default function OnboardingForm({
  defaultValues,
  onBack,
}: {
  defaultValues: Partial<OnboardingInput>
  onBack: () => void
}) {
  const router = useRouter()
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c9031b23-9f97-4d5f-a63f-0506ad990180',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D',location:'components/onboarding/OnboardingForm.tsx:208',message:'Finish submit triggered',data:{hasValues:!!values},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log
    console.log('finish clicked', values)
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

  const onError = (errors: typeof form.formState.errors) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c9031b23-9f97-4d5f-a63f-0506ad990180',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'E',location:'components/onboarding/OnboardingForm.tsx:248',message:'Form submit blocked by validation',data:{errorKeys:Object.keys(errors)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log
    console.log('submit blocked', Object.keys(errors))
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, onError)}
      className="space-y-6 p-6 w-full max-w-3xl mx-auto"
    >
      <div className="max-h-[70vh] overflow-y-auto pr-6 space-y-10 simple-scrollbar">
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Academic Info</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Full Name <span className="text-white">*</span>
              </label>
              <input className="input-field" {...form.register('name')} />
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.name?.message}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                School <span className="text-white">*</span>
              </label>
              <SearchableSelect
                options={schoolOptions}
                value={form.watch('school') || ''}
                onChange={(value) => form.setValue('school', value, { shouldValidate: true, shouldDirty: true })}
                placeholder="Search or select school"
              />
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.school?.message}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Program <span className="text-white">*</span>
              </label>
              <SearchableSelect
                options={programOptions}
                value={form.watch('program') || ''}
                onChange={(value) => form.setValue('program', value, { shouldValidate: true, shouldDirty: true })}
                placeholder="Search or select program"
              />
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.program?.message}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                GPA <span className="text-white">*</span>
              </label>
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
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Location</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Province <span className="text-white">*</span>
              </label>
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
              <label className="block text-sm font-medium text-white/80 mb-2">
                Citizenship <span className="text-white">*</span>
              </label>
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
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Demographics</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Ethnicity <span className="text-white">*</span>
              </label>
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
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Interests <span className="text-white">*</span>
          </h2>
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
        </section>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between">
        <button
          type="button"
          className="input-field w-auto px-8 py-3 bg-black border-white/10 text-white/80 hover:bg-[#1f1f1f] hover:text-white transition"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="submit"
          className="input-field w-auto px-8 py-3 bg-black border-white/10 text-white/80 hover:bg-[#1f1f1f] hover:text-white transition"
          disabled={submitting}
          onClick={() => {
            const trimmed = interestInput.trim()
            if (trimmed) {
              const current = form.getValues('interests') || []
              form.setValue('interests', [...current, trimmed], { shouldValidate: true })
              setInterestInput('')
            }
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/c9031b23-9f97-4d5f-a63f-0506ad990180',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F',location:'components/onboarding/OnboardingForm.tsx:293',message:'Finish button clicked',data:{disabled:submitting},timestamp:Date.now()})}).catch(()=>{});
            // #endregion agent log
            console.log('finish button clicked', { disabled: submitting })
          }}
        >
          {submitting ? 'Submitting...' : 'Finish'}
        </button>
      </div>
    </form>
  )
}
