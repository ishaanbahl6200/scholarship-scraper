'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, RefreshCw, Bookmark } from 'lucide-react'
import { TypingAnimation } from '@/components/ui/typing-animation'
import { ScholarshipCard } from '@/lib/types'

type ApiScholarship = {
  scholarship_id: string
  scholarship_name: string
  award_amount: number | string
  deadline: string | null
  application_url: string
  requirements: string[]
}

function mapScholarship(item: ApiScholarship): ScholarshipCard {
  const safeTags = Array.isArray(item.requirements) ? item.requirements : []
  
  // Normalize amount - handle if it's a string with dollar sign or number
  let normalizedAmount: number | null = null
  if (item.award_amount) {
    if (typeof item.award_amount === 'number') {
      normalizedAmount = item.award_amount > 0 ? item.award_amount : null
    } else if (typeof item.award_amount === 'string' && item.award_amount.trim()) {
      // Remove dollar signs, commas, and extract number
      const cleaned = String(item.award_amount).replace(/[^0-9.]/g, '')
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
          setSavedIds(new Set([...Array.from(savedIds), id]))
        }
      }
    } catch (error) {
      console.error('Error toggling saved scholarship:', error)
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
      {/* Top right controls - aligned with Grantly logo */}
      <div className="absolute right-6 top-6 z-30 flex items-center gap-3">
        {lastScrapeTime && (
          <p className="text-xs text-muted-foreground">
            Last scraped: {new Date(lastScrapeTime).toLocaleString()}
          </p>
        )}
        <button
          onClick={handleRefresh}
          disabled={scraping}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          title="Refresh scholarships"
        >
          <RefreshCw className={`h-5 w-5 ${scraping ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col items-center gap-4 mb-8">
          <h2 className="text-4xl md:text-5xl font-semibold text-foreground text-center">All Scholarships</h2>
          <div className="text-center">
            <TypingAnimation
              text="Browse scholarships collected from our top sources..."
              duration={30}
              className="text-lg md:text-xl font-normal text-center text-muted-foreground leading-normal tracking-normal drop-shadow-none"
            />
          </div>
        </div>
        {scraping && (
          <div className="w-full">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 transition-all duration-300 ease-out"
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
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 w-full">
          {filtered.map((card) => (
            <div
              key={card.id}
              className="card card-result space-y-3 cursor-pointer"
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
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      saveScholarship(card.id)
                    }}
                    className={`btn-secondary flex items-center gap-2 text-sm ${savedIds.has(card.id) ? 'bg-primary/10 text-primary' : ''}`}
                    title={savedIds.has(card.id) ? 'Click to unsave' : 'Click to save'}
                  >
                    <Bookmark className={`h-4 w-4 ${savedIds.has(card.id) ? 'fill-current' : ''}`} />
                    {savedIds.has(card.id) ? 'Saved' : 'Save'}
                  </button>
                </div>
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
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
