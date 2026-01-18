'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bookmark } from 'lucide-react'
import { TypingAnimation } from '@/components/ui/typing-animation'
import { ScholarshipCard } from '@/lib/types'

type ApiScholarship = {
  scholarship_id: string
  scholarship_name: string
  award_amount: number | string
  match_score: number | null
  deadline: string | null
  application_url: string
  requirements: string[]
  match_reason?: string | null
}

function mapScholarship(item: ApiScholarship): ScholarshipCard {
  const safeTags = Array.isArray(item.requirements) ? item.requirements : []
  
  // Normalize amount - handle if it's a string with dollar sign or number
  let normalizedAmount: number | null = null
  if (item.award_amount) {
    if (typeof item.award_amount === 'number') {
      normalizedAmount = item.award_amount > 0 ? item.award_amount : null
    } else if (typeof item.award_amount === 'string') {
      // Remove dollar signs, commas, and extract number
      const cleaned = item.award_amount.replace(/[^0-9.]/g, '')
      const parsed = parseFloat(cleaned)
      normalizedAmount = parsed > 0 ? parsed : null
    }
  }
  
  return {
    id: item.scholarship_id,
    name: item.scholarship_name,
    amount: normalizedAmount,
    deadline: item.deadline,
    tags: safeTags.slice(0, 2),
    matchScore: item.match_score ?? null,
    applicationUrl: item.application_url,
  }
}

export default function MatchesPanel() {
  const [items, setItems] = useState<ApiScholarship[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [hasScholarships, setHasScholarships] = useState(false)
  const [matching, setMatching] = useState(false)
  const [matchProgress, setMatchProgress] = useState(0)

  const loadMatches = async () => {
    try {
      // Check if onboarding is complete by fetching profile
      const profileResponse = await fetch('/api/profile')
      if (profileResponse.ok) {
        const profile = await profileResponse.json()
        // Check if all required fields are present
        const isComplete = !!(
          profile.name &&
          profile.school &&
          profile.program &&
          profile.province &&
          profile.citizenship &&
          profile.ethnicity &&
          Array.isArray(profile.interests) &&
          profile.interests.length > 0
        )
        setOnboardingComplete(isComplete)
      }

      // Check if there are any scholarships in the database
      const scholarshipsResponse = await fetch('/api/scholarships?scope=all')
      if (scholarshipsResponse.ok) {
        const allScholarships = await scholarshipsResponse.json()
        setHasScholarships(Array.isArray(allScholarships) && allScholarships.length > 0)
      }

      // Load matched scholarships
      const response = await fetch('/api/scholarships')
      if (!response.ok) {
        return
      }
      const data = (await response.json()) as ApiScholarship[]
      console.log('Loaded matches:', data.length, data)
      setItems(data)
    } catch (error) {
      console.error('Error loading matches:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMatches()
  }, [])

  useEffect(() => {
    const matchStartTime = localStorage.getItem('matchStartTime')
    const matchInProgress = localStorage.getItem('matchInProgress')
    if (!matchStartTime || !matchInProgress) {
      return
    }

    const startTime = parseInt(matchStartTime, 10)
    if (Number.isNaN(startTime)) {
      localStorage.removeItem('matchStartTime')
      localStorage.removeItem('matchInProgress')
      return
    }

    const durationSeconds = 10
    const completionDelaySeconds = 1
    const elapsed = (Date.now() - startTime) / 1000

    if (elapsed >= durationSeconds + completionDelaySeconds) {
      localStorage.removeItem('matchStartTime')
      localStorage.removeItem('matchInProgress')
      return
    }

    setMatching(true)
    setMatchProgress(Math.min(90, (elapsed / durationSeconds) * 90))

    const progressInterval = setInterval(() => {
      setMatchProgress((prev) => {
        if (prev >= 90) return prev
        return prev + Math.random() * 10
      })
    }, 500)

    const remainingTime = Math.max(0, durationSeconds - elapsed)
    let finalizeTimeout: ReturnType<typeof setTimeout> | null = null
    const completeTimeout = setTimeout(() => {
      clearInterval(progressInterval)
      setMatchProgress(100)
      finalizeTimeout = setTimeout(() => {
        setMatching(false)
        setMatchProgress(0)
        localStorage.removeItem('matchStartTime')
        localStorage.removeItem('matchInProgress')
      }, completionDelaySeconds * 1000)
    }, remainingTime * 1000)

    return () => {
      clearInterval(progressInterval)
      clearTimeout(completeTimeout)
      if (finalizeTimeout) {
        clearTimeout(finalizeTimeout)
      }
    }
  }, [])

  // Refresh matches periodically if no matches found
  useEffect(() => {
    if (items.length === 0 && !loading) {
      const interval = setInterval(() => {
        loadMatches()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [items.length, loading])

  const saveScholarship = async (id: string) => {
    const isSaved = savedIds.has(id)
    try {
      if (isSaved) {
        // Unsave
        const response = await fetch(`/api/saved?scholarshipId=${id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          const newSavedIds = new Set(savedIds)
          newSavedIds.delete(id)
          setSavedIds(newSavedIds)
        }
      } else {
        // Save
        const response = await fetch('/api/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scholarshipId: id }),
        })
        if (response.ok) {
          const newSavedIds = new Set(savedIds)
          newSavedIds.add(id)
          setSavedIds(newSavedIds)
        }
      }
    } catch (error) {
      console.error('Error toggling saved scholarship:', error)
    }
  }


  const cards = useMemo(() => items.map(mapScholarship), [items])

  return (
    <section className="space-y-4">
      <div className="flex flex-col items-center gap-4 mb-8">
        <h2 className="text-4xl md:text-5xl font-semibold text-foreground text-center">Matches</h2>
        <div className="text-center">
          <TypingAnimation
            text="Our top picks, tailored for you..."
            duration={30}
            className="text-lg md:text-xl font-normal text-center text-muted-foreground leading-normal tracking-normal drop-shadow-none"
          />
        </div>
      </div>

      {matching && (
        <div className="w-full">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 transition-all duration-300 ease-out"
              style={{ width: `${matchProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Updating matches... {Math.round(matchProgress)}%
          </p>
        </div>
      )}

      {loading ? (
        <div className="card">Loading matches...</div>
      ) : cards.length === 0 ? (
        <div className="card space-y-3">
          {!onboardingComplete ? (
            <>
              <p className="font-medium text-foreground">No matches yet.</p>
              <p className="text-sm text-muted-foreground">
                Complete onboarding to get personalized scholarship recommendations.
              </p>
            </>
          ) : !hasScholarships ? (
            <>
              <p className="font-medium text-foreground">No good matches available.</p>
              <p className="text-sm text-muted-foreground">
                We haven't found any scholarships in our database yet. Try refreshing the scholarships list to scrape new opportunities.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-foreground">No good matches available.</p>
              <p className="text-sm text-muted-foreground">
                We couldn't find any scholarships that match your profile well enough. This could be because:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                <li>Your profile criteria are very specific</li>
                <li>The available scholarships don't align with your qualifications</li>
                <li>More scholarships may be added soon - check back later</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                Try refreshing the scholarships list to scrape new opportunities, update your profile, or check the "Scholarships" tab to browse all available opportunities.
              </p>
            </>
          )}
        </div>
      ) : (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 w-full">
          {cards.map((card, index) => {
            const item = items[index]
            return (
            <div
              key={card.id}
              className="card card-result space-y-4 cursor-pointer"
              style={{ height: '99.32px' }}
              onClick={() => {
                if (card.applicationUrl) {
                  window.open(card.applicationUrl, '_blank', 'noopener,noreferrer')
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{card.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {card.amount && card.amount > 0 && (
                      <>
                        ${card.amount.toLocaleString()}
                        {card.deadline && ' · '}
                      </>
                    )}
                    {card.deadline && `Deadline ${new Date(card.deadline).toLocaleDateString()}`}
                  </p>
                  {item?.match_reason && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      {item.match_reason}
                    </p>
                  )}
                </div>
                {card.matchScore !== null && (
                  <span className="badge bg-primary/10 text-primary ml-4">{card.matchScore}%</span>
                )}
              </div>

              {card.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {card.tags.map((tag) => (
                    <span key={tag} className="badge bg-muted text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    saveScholarship(card.id)
                  }}
                  className={`btn-secondary flex items-center gap-2 text-sm ${savedIds.has(card.id) ? 'bg-primary/10 text-primary' : ''}`}
                >
                  <Bookmark className={`h-4 w-4 ${savedIds.has(card.id) ? 'fill-current' : ''}`} />
                  {savedIds.has(card.id) ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
