'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bookmark } from 'lucide-react'
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

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/scholarships')
        if (!response.ok) {
          return
        }
        const data = (await response.json()) as ApiScholarship[]
        setItems(data.map(mapScholarship))
      } catch (error) {
        console.error('Error loading matches:', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

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

  const cards = useMemo(() => items, [items])

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Matches</h2>
        <TypingAnimation
          text="our top picks, tailored for you..."
          duration={30}
          className="text-sm md:text-base font-normal text-left text-muted-foreground leading-normal tracking-normal drop-shadow-none"
        />
      </div>

      {loading ? (
        <div className="card">Loading matches...</div>
      ) : cards.length === 0 ? (
        <div className="card">No matches yet. Complete onboarding to get recommendations.</div>
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
