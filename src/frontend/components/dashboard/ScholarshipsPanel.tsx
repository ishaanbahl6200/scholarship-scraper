'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { TypingAnimation } from '@/components/ui/typing-animation'
import { ScholarshipCard } from '@/lib/types'

type ApiScholarship = {
  scholarship_id: string
  scholarship_name: string
  award_amount: number
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
    applicationUrl: item.application_url,
  }
}

export default function ScholarshipsPanel() {
  const [items, setItems] = useState<ScholarshipCard[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/scholarships?scope=all')
        if (!response.ok) {
          return
        }
        const data = (await response.json()) as ApiScholarship[]
        setItems(data.map(mapScholarship))
      } catch (error) {
        console.error('Error loading scholarships:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const lower = query.toLowerCase()
    return items.filter((item) => item.name.toLowerCase().includes(lower))
  }, [items, query])

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Scholarships</h2>
          <TypingAnimation
            text="Browse scholarships collected from our top sources..."
            duration={30}
            className="text-sm md:text-base font-normal text-left text-muted-foreground leading-normal tracking-normal drop-shadow-none"
          />
        </div>
        <div className="relative w-full md:w-96 self-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search scholarships"
            className="input-field pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="card">Loading scholarships...</div>
      ) : filtered.length === 0 ? (
        <div className="card">No scholarships found yet.</div>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {filtered.map((card) => (
            <div key={card.id} className="card card-result space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{card.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {card.amount ? `$${card.amount.toLocaleString()}` : 'Amount TBD'} ·{' '}
                    {card.deadline ? `Deadline ${new Date(card.deadline).toLocaleDateString()}` : 'Deadline TBD'}
                  </p>
                </div>
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
                  <span className="text-xs text-muted-foreground">No link</span>
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
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
