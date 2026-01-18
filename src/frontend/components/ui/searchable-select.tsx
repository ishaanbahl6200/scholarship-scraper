'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'

interface SearchableSelectProps {
  options: Array<{ value: string; label: string; group?: string }>
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchableSelect({ options, value, onChange, placeholder = 'Search...', className = '' }: SearchableSelectProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  const filteredOptions = searchQuery
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.group?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery('')
  }

  // Group options by group if they have groups
  const groupedOptions = filteredOptions.reduce((acc, option) => {
    const group = option.group || 'Other'
    if (!acc[group]) {
      acc[group] = []
    }
    acc[group].push(option)
    return acc
  }, {} as Record<string, typeof filteredOptions>)

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className="input-field flex items-center justify-between cursor-pointer"
        onClick={() => {
          setIsOpen(!isOpen)
          inputRef.current?.focus()
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchQuery : (selectedOption?.label || '')}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedOption ? undefined : placeholder}
          className="flex-1 bg-transparent border-none outline-none"
        />
        <div className="flex items-center gap-1">
          {value && isOpen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
                setSearchQuery('')
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No results found</div>
          ) : (
            Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
              <div key={groupName}>
                {groupName !== 'Other' && (
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground sticky top-0 bg-background border-b">
                    {groupName}
                  </div>
                )}
                {groupOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-muted ${
                      value === option.value ? 'bg-primary/10 text-primary' : ''
                    }`}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
