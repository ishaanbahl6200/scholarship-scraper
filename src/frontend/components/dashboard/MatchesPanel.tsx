'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bookmark, RefreshCw } from 'lucide-react'
import { TypingAnimation } from '@/components/ui/typing-animation'
import { ScholarshipCard } from '@/lib/types'

type ApiScholarship = {
  scholarship_id: string
  scholarship_name: string
  award_amount: number
  match_score: number | null
  deadline: string | null
  application_url: string
  requirements: string[]
}

function mapScholarship(item: ApiScholarship): ScholarshipCard {
  const safeTags = Array.isArray(item.requirements) ? item.requirements : []
  return {
    id: item.scholarship_id,
    name: item.scholarship_name,
    amount: item.award_amount,
    deadline: item.deadline,
    tags: safeTags.slice(0, 2),
    matchScore: item.match_score ?? null,
    applicationUrl: item.application_url,
  }
}

export default function MatchesPanel() {
  const [items, setItems] = useState<ScholarshipCard[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [hasScholarships, setHasScholarships] = useState(false)

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
      setItems(data.map(mapScholarship))
    } catch (error) {
      console.error('Error loading matches:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMatches()
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
    try {
      const response = await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scholarshipId: id }),
      })
      if (response.ok) {
        setSavedIds(new Set([...savedIds, id]))
      }
    } catch (error) {
      console.error('Error saving scholarship:', error)
    }
  }

  const refreshMatches = async () => {
    setLoading(true)
    // Just reload matches - matching happens automatically when scholarships are scraped
    await loadMatches()
  }

  const cards = useMemo(() => items, [items])

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h2 className="text-2xl font-semibold text-foreground">Matches</h2>
          <TypingAnimation
            text="our top picks, tailored for you..."
            duration={30}
            className="text-sm md:text-base font-normal text-center text-muted-foreground leading-normal tracking-normal drop-shadow-none"
          />
        </div>
        {onboardingComplete && (
          <button
            onClick={refreshMatches}
            disabled={loading}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            title="Refresh matches"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

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
        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <div key={card.id} className="card card-result space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{card.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {card.amount ? `$${card.amount.toLocaleString()}` : 'Amount TBD'} ·{' '}
                    {card.deadline ? `Deadline ${new Date(card.deadline).toLocaleDateString()}` : 'Deadline TBD'}
                  </p>
                </div>
                {card.matchScore !== null && (
                  <span className="badge bg-primary/10 text-primary">{card.matchScore}%</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {card.tags.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No tags provided</span>
                ) : (
                  card.tags.map((tag) => (
                    <span key={tag} className="badge bg-muted text-muted-foreground">
                      {tag}
                    </span>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between">
                {card.applicationUrl ? (
                  <a
                    href={card.applicationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    View details
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">No link provided</span>
                )}
                <button
                  onClick={() => saveScholarship(card.id)}
                  className="btn-secondary flex items-center gap-2 text-sm"
                  disabled={savedIds.has(card.id)}
                >
                  <Bookmark className="h-4 w-4" />
                  {savedIds.has(card.id) ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
