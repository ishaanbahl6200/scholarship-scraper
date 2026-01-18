'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, RefreshCw, Bookmark } from 'lucide-react'
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
  const [scraping, setScraping] = useState(false)
  const [scrapeProgress, setScrapeProgress] = useState(0)
  const [lastScrapeTime, setLastScrapeTime] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  const loadScholarships = async () => {
    setLoading(true)
    try {
      const [scholarshipsRes, savedRes] = await Promise.all([
        fetch('/api/scholarships?scope=all'),
        fetch('/api/saved'),
      ])
      
      if (scholarshipsRes.ok) {
        const data = (await scholarshipsRes.json()) as ApiScholarship[]
        setItems(data.map(mapScholarship))
      }
      
      if (savedRes.ok) {
        const saved = (await savedRes.json()) as Array<{ id: string }>
        setSavedIds(new Set(saved.map((item) => item.id)))
      }
    } catch (error) {
      console.error('Error loading scholarships:', error)
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    loadScholarships()
    
    // Check for ongoing scrape from localStorage
    const scrapeStartTime = localStorage.getItem('scrapeStartTime')
    const scrapeWorkflowId = localStorage.getItem('scrapeWorkflowId')
    const lastScrape = localStorage.getItem('lastScrapeTime')
    
    if (lastScrape) {
      setLastScrapeTime(lastScrape)
    }
    
    if (scrapeStartTime && scrapeWorkflowId) {
      const startTime = parseInt(scrapeStartTime)
      const elapsed = (Date.now() - startTime) / 1000 // seconds
      
      // If scrape started less than 60 seconds ago, continue showing progress
      if (elapsed < 60) {
        setScraping(true)
        setScrapeProgress(Math.min(90, (elapsed / 60) * 90))
        
        // Continue progress simulation
        const remainingTime = 60 - elapsed
        const progressInterval = setInterval(() => {
          setScrapeProgress((prev) => {
            if (prev >= 90) return prev
            return prev + Math.random() * 5
          })
        }, 1000)
        
        // Complete after remaining time
        const completeTimeout = setTimeout(async () => {
          clearInterval(progressInterval)
          setScrapeProgress(100)
          await new Promise(resolve => setTimeout(resolve, 2000))
          await loadScholarships()
          setScraping(false)
          setScrapeProgress(0)
          localStorage.removeItem('scrapeStartTime')
          localStorage.removeItem('scrapeWorkflowId')
          localStorage.setItem('lastScrapeTime', new Date().toISOString())
          setLastScrapeTime(new Date().toISOString())
          // Matching happens automatically when scholarships are added via /api/gumloop/scholarships
          // No need to manually trigger it here
        }, remainingTime * 1000)
        
        // Cleanup on unmount
        return () => {
          clearInterval(progressInterval)
          clearTimeout(completeTimeout)
        }
      } else {
        // Scrape should have completed, clean up
        localStorage.removeItem('scrapeStartTime')
        localStorage.removeItem('scrapeWorkflowId')
      }
    }
  }, [])

  const filtered = useMemo(() => {
    const lower = query.toLowerCase()
    return items.filter((item) => item.name.toLowerCase().includes(lower))
  }, [items, query])

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

  const handleRefresh = async () => {
    setScraping(true)
    setScrapeProgress(0)
    
    // Store scrape start time in localStorage so it persists across navigation
    const startTime = Date.now()
    localStorage.setItem('scrapeStartTime', startTime.toString())
    
    // Simulate progress (scraper typically takes 30-60 seconds)
    const scrapeProgressInterval = setInterval(() => {
      setScrapeProgress((prev) => {
        if (prev >= 90) return prev // Stop at 90% until completion
        return prev + Math.random() * 5 // Increment by 0-5%
      })
    }, 1000)

    try {
      const response = await fetch('/api/gumloop/trigger-scraper', {
        method: 'POST',
      })
      
      if (response.ok) {
        const data = await response.json()
        // Store workflow ID in case we need to check status
        if (data.workflow_run_id) {
          localStorage.setItem('scrapeWorkflowId', data.workflow_run_id)
        }
        
        // Wait for scraper to complete (poll or estimate time)
        // For now, we'll wait ~45 seconds then refresh
        setTimeout(async () => {
          clearInterval(scrapeProgressInterval)
          setScrapeProgress(100)
          
          // Wait a bit more for backend processing
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // Refresh the scholarships list
          await loadScholarships()
          setScraping(false)
          setScrapeProgress(0)
          
          // Clean up localStorage
          localStorage.removeItem('scrapeStartTime')
          localStorage.removeItem('scrapeWorkflowId')
          localStorage.setItem('lastScrapeTime', new Date().toISOString())
          setLastScrapeTime(new Date().toISOString())
          
          // Matching happens automatically when scholarships are added via /api/gumloop/scholarships
          // No need to manually trigger it here
        }, 45000) // 45 seconds estimate
      } else {
        clearInterval(scrapeProgressInterval)
        localStorage.removeItem('scrapeStartTime')
        localStorage.removeItem('scrapeWorkflowId')
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        alert(`Failed to start scraper: ${errorData.error || 'Please try again.'}`)
        setScraping(false)
        setScrapeProgress(0)
      }
    } catch (error) {
      clearInterval(scrapeProgressInterval)
      localStorage.removeItem('scrapeStartTime')
      localStorage.removeItem('scrapeWorkflowId')
      console.error('Error triggering scraper:', error)
      alert('Failed to start scraper. Please try again.')
      setScraping(false)
      setScrapeProgress(0)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-foreground">Scholarships</h2>
            <div>
              <TypingAnimation
                text="Browse scholarships collected from our top sources..."
                duration={30}
                className="text-sm md:text-base font-normal text-left text-muted-foreground leading-normal tracking-normal drop-shadow-none"
              />
              {lastScrapeTime && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last scraped: {new Date(lastScrapeTime).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={scraping}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            title="Refresh scholarships"
          >
            <RefreshCw className={`h-5 w-5 ${scraping ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {scraping && (
          <div className="w-full">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${scrapeProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Scraping scholarships... {Math.round(scrapeProgress)}%
            </p>
          </div>
        )}
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
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{card.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {card.amount ? `$${card.amount.toLocaleString()}` : 'Amount TBD'} ·{' '}
                    {card.deadline ? `Deadline ${new Date(card.deadline).toLocaleDateString()}` : 'Deadline TBD'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
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
                  <button
                    onClick={() => saveScholarship(card.id)}
                    className="btn-secondary flex items-center gap-2 text-sm"
                    disabled={savedIds.has(card.id)}
                    title={savedIds.has(card.id) ? 'Already saved' : 'Save scholarship'}
                  >
                    <Bookmark className={`h-4 w-4 ${savedIds.has(card.id) ? 'fill-current' : ''}`} />
                    {savedIds.has(card.id) ? 'Saved' : 'Save'}
                  </button>
                </div>
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
