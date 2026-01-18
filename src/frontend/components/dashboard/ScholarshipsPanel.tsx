'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, RefreshCw } from 'lucide-react'
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
  const [matching, setMatching] = useState(false)
  const [matchProgress, setMatchProgress] = useState(0)
  const [lastScrapeTime, setLastScrapeTime] = useState<string | null>(null)

  const loadScholarships = async () => {
    setLoading(true)
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

  const handleMatching = async () => {
    setMatching(true)
    setMatchProgress(0)
    
    // Simulate progress (matching typically takes 5-15 seconds)
    const matchProgressInterval = setInterval(() => {
      setMatchProgress((prev) => {
        if (prev >= 90) return prev // Stop at 90% until completion
        return prev + Math.random() * 10 // Increment by 0-10%
      })
    }, 500)

    try {
      const response = await fetch('/api/gumloop/trigger-matching', {
        method: 'POST',
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Wait for matching to complete (typically 5-15 seconds)
        setTimeout(() => {
          clearInterval(matchProgressInterval)
          setMatchProgress(100)
          
          // Wait a bit more for processing
          setTimeout(() => {
            setMatching(false)
            setMatchProgress(0)
          }, 1000)
        }, 10000) // 10 seconds estimate
      } else {
        clearInterval(matchProgressInterval)
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error(`Failed to update matches: ${errorData.error || 'Please try again.'}`)
        setMatching(false)
        setMatchProgress(0)
      }
    } catch (error) {
      clearInterval(matchProgressInterval)
      console.error('Error triggering matching:', error)
      setMatching(false)
      setMatchProgress(0)
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
          // Trigger matching after scrape completes
          setMatching(true)
          setMatchProgress(0)
          const matchInterval = setInterval(() => {
            setMatchProgress((prev) => {
              if (prev >= 90) return prev
              return prev + Math.random() * 10
            })
          }, 500)
          try {
            const matchResponse = await fetch('/api/gumloop/trigger-matching', { method: 'POST' })
            if (matchResponse.ok) {
              setTimeout(() => {
                clearInterval(matchInterval)
                setMatchProgress(100)
                setTimeout(() => {
                  setMatching(false)
                  setMatchProgress(0)
                }, 1000)
              }, 10000)
            } else {
              clearInterval(matchInterval)
              setMatching(false)
              setMatchProgress(0)
            }
          } catch {
            clearInterval(matchInterval)
            setMatching(false)
            setMatchProgress(0)
          }
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
          
          // Now trigger matching
          await handleMatching()
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
            disabled={scraping || matching}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            title="Refresh scholarships and update matches"
          >
            <RefreshCw className={`h-5 w-5 ${scraping || matching ? 'animate-spin' : ''}`} />
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
        {matching && (
          <div className="w-full">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${matchProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Updating matches... {Math.round(matchProgress)}%
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
