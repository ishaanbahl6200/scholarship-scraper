'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import {
  GraduationCap,
  Calendar,
  DollarSign,
  TrendingUp,
  Search,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

interface Scholarship {
  scholarship_id: string
  scholarship_name: string
  award_amount: number
  match_score: number
  deadline: string
  application_url: string
  application_status: string
  requirements: any
}

export default function DashboardClient({ user }: { user: any }) {
  const { user: authUser } = useUser()
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchScholarships()
  }, [])

  const fetchScholarships = async () => {
    try {
      const response = await fetch('/api/scholarships')
      if (response.ok) {
        const data = await response.json()
        setScholarships(data)
      }
    } catch (error) {
      console.error('Error fetching scholarships:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/scholarships/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchScholarships()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const filteredScholarships = scholarships.filter((scholarship) => {
    const matchesFilter = filter === 'all' || scholarship.application_status === filter
    const matchesSearch = scholarship.scholarship_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    total: scholarships.length,
    notStarted: scholarships.filter((s) => s.application_status === 'Not Started').length,
    inProgress: scholarships.filter((s) => s.application_status === 'In Progress').length,
    submitted: scholarships.filter((s) => s.application_status === 'Submitted').length,
    totalValue: scholarships.reduce((sum, s) => sum + (s.award_amount || 0), 0),
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      'Not Started': 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      Submitted: 'bg-blue-100 text-blue-800',
      Awarded: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">ScholarshipFinder</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/profile" className="text-gray-700 hover:text-primary-600 font-medium">
                Profile
              </Link>
              <Link href="/api/auth/logout" className="text-gray-700 hover:text-primary-600 font-medium">
                Logout
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {authUser?.name || user?.name || 'Student'}! 👋
          </h1>
          <p className="text-gray-600">Here are your matched scholarships</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Scholarships</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-primary-100 p-3 rounded-lg">
                <GraduationCap className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Value</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${stats.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Submitted</p>
                <p className="text-3xl font-bold text-gray-900">{stats.submitted}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search scholarships..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'Not Started', 'In Progress', 'Submitted'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === status
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading scholarships...</p>
          </div>
        ) : filteredScholarships.length === 0 ? (
          <div className="card text-center py-12">
            <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No scholarships found</h3>
            <p className="text-gray-600 mb-6">
              {scholarships.length === 0
                ? "We're finding scholarships that match your profile. Check back soon!"
                : 'Try adjusting your filters or search query.'}
            </p>
            {scholarships.length === 0 && (
              <Link href="/profile" className="btn-primary inline-block">
                Complete Your Profile
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredScholarships.map((scholarship) => {
              const daysUntil = getDaysUntil(scholarship.deadline)
              const isUrgent = daysUntil <= 7 && daysUntil > 0

              return (
                <div key={scholarship.scholarship_id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {scholarship.scholarship_name}
                          </h3>
                          <div className="flex items-center gap-4 mb-3">
                            <span className="text-2xl font-bold text-primary-600">
                              ${scholarship.award_amount?.toLocaleString()}
                            </span>
                            <span className={`badge ${getStatusBadge(scholarship.application_status)}`}>
                              {scholarship.application_status}
                            </span>
                            <span className="badge bg-primary-100 text-primary-800">
                              {scholarship.match_score}% Match
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Deadline: {formatDate(scholarship.deadline)}</span>
                          {isUrgent && (
                            <span className="text-red-600 font-semibold">({daysUntil} days left!)</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <a
                          href={scholarship.application_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2"
                        >
                          Apply Now
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <select
                          value={scholarship.application_status}
                          onChange={(e) => updateStatus(scholarship.scholarship_id, e.target.value)}
                          className="input-field text-sm py-2 px-4 w-auto"
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Submitted">Submitted</option>
                          <option value="Awarded">Awarded</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
