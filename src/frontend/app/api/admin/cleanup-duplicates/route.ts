import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { getDb } from '@/lib/db'
import { ObjectId } from 'mongodb'

/**
 * Normalize text for comparison (remove special chars, normalize whitespace, etc.)
 */
function normalizeForComparison(text: string): string {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
}

/**
 * Get potential duplicates (for diagnostics)
 */
export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = await getDb()
    const scholarshipsCollection = db.collection('scholarships')

    const allScholarships = await scholarshipsCollection.find({}).toArray()

    // Group by normalized title (ignoring source for now to see all potential duplicates)
    const groups = new Map<string, typeof allScholarships>()
    
    for (const scholarship of allScholarships) {
      const normalizedTitle = normalizeForComparison(scholarship.title || '')
      const key = normalizedTitle
      
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(scholarship)
    }

    const duplicates: Array<{
      normalized_title: string
      count: number
      scholarships: Array<{ id: string; title: string; source: string; created_at: string | null }>
    }> = []

    for (const [key, group] of groups.entries()) {
      if (group.length > 1) {
        duplicates.push({
          normalized_title: key,
          count: group.length,
          scholarships: group.map(s => ({
            id: s._id.toString(),
            title: s.title || '',
            source: s.source || '',
            created_at: s.created_at ? s.created_at.toISOString() : null,
          })),
        })
      }
    }

    return NextResponse.json({
      total_scholarships: allScholarships.length,
      unique_titles: groups.size,
      duplicates_found: duplicates.length,
      duplicates: duplicates,
    })
  } catch (error) {
    console.error('Error finding duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to find duplicates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Cleanup Duplicate Scholarships
 * Removes duplicate scholarships from the database based on title + source
 * Keeps the oldest one (first created)
 */
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = await getDb()
    const scholarshipsCollection = db.collection('scholarships')
    const matchesCollection = db.collection('matches')
    const savedScholarshipsCollection = db.collection('saved_scholarships')

    // Get all scholarships
    const allScholarships = await scholarshipsCollection.find({}).toArray()
    
    // Get all saved scholarship IDs - these should never be deleted
    const savedScholarships = await savedScholarshipsCollection.find({}).toArray()
    const savedScholarshipIds = new Set(
      savedScholarships.map(s => s.scholarship_id.toString())
    )
    console.log(`[Cleanup] Found ${savedScholarshipIds.size} saved scholarships that will be protected from deletion`)

    // Group by normalized title (more aggressive normalization)
    // We'll match by title only, ignoring source, since same scholarship might come from different sources
    const groups = new Map<string, typeof allScholarships>()
    
    for (const scholarship of allScholarships) {
      const normalizedTitle = normalizeForComparison(scholarship.title || '')
      const key = normalizedTitle
      
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(scholarship)
    }

    let duplicatesRemoved = 0
    const duplicateIds: ObjectId[] = []

    // For each group with more than one scholarship, keep one and mark others for deletion
    // Priority: 1) Saved scholarships, 2) Oldest
    for (const [key, group] of groups.entries()) {
      if (group.length > 1) {
        // Sort by: saved first, then by created_at (oldest first)
        group.sort((a, b) => {
          const aIsSaved = savedScholarshipIds.has(a._id.toString())
          const bIsSaved = savedScholarshipIds.has(b._id.toString())
          
          // If one is saved and the other isn't, saved one comes first
          if (aIsSaved && !bIsSaved) return -1
          if (!aIsSaved && bIsSaved) return 1
          
          // If both saved or both not saved, sort by date (oldest first)
          const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
          const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
          return aDate - bDate
        })

        // Keep the first one (saved if any, otherwise oldest)
        const toKeep = group[0]
        const toDelete = group.slice(1)

        // All duplicates will be deleted (no duplicates should remain)
        // But we'll update saved_scholarships references to point to the kept one
        const savedToDelete = toDelete.filter(s => savedScholarshipIds.has(s._id.toString()))
        
        if (savedToDelete.length > 0) {
          console.log(`[Cleanup] Found ${savedToDelete.length} saved duplicate(s) in group "${toKeep.title}". Will merge saved references to kept scholarship.`)
        }

        console.log(`[Cleanup] Found ${group.length} duplicates for "${toKeep.title}". Keeping ${savedScholarshipIds.has(toKeep._id.toString()) ? 'saved' : 'oldest'}, removing ${toDelete.length} duplicates.`)

        // Mark all duplicates for deletion (we'll update references first)
        for (const duplicate of toDelete) {
          duplicateIds.push(duplicate._id)
          duplicatesRemoved++
        }
      }
    }

    if (duplicateIds.length > 0) {
      // Update matches to point to the kept scholarship
      // First, find which scholarships to keep for each duplicate (using same priority: saved first, then oldest)
      const duplicateMap = new Map<ObjectId, ObjectId>()
      
      for (const [key, group] of groups.entries()) {
        if (group.length > 1) {
          // Sort by: saved first, then by created_at (oldest first) - same logic as above
          group.sort((a, b) => {
            const aIsSaved = savedScholarshipIds.has(a._id.toString())
            const bIsSaved = savedScholarshipIds.has(b._id.toString())
            
            if (aIsSaved && !bIsSaved) return -1
            if (!aIsSaved && bIsSaved) return 1
            
            const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
            const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
            return aDate - bDate
          })
          const toKeep = group[0]._id
          for (const duplicate of group.slice(1)) {
            duplicateMap.set(duplicate._id, toKeep)
          }
        }
      }

      // Update matches to point to kept scholarships
      let matchesUpdated = 0
      for (const [duplicateId, keptId] of duplicateMap.entries()) {
        const result = await matchesCollection.updateMany(
          { scholarship_id: duplicateId },
          { $set: { scholarship_id: keptId } }
        )
        matchesUpdated += result.modifiedCount
      }

      // Update saved_scholarships to point to kept scholarships
      // This ensures saved scholarships remain accessible even after duplicates are deleted
      let savedUpdated = 0
      for (const [duplicateId, keptId] of duplicateMap.entries()) {
        // Check if the duplicate being deleted has saved references
        const savedCount = await savedScholarshipsCollection.countDocuments({
          scholarship_id: duplicateId
        })
        
        if (savedCount > 0) {
          // Update all saved references to point to the kept scholarship
          const result = await savedScholarshipsCollection.updateMany(
            { scholarship_id: duplicateId },
            { $set: { scholarship_id: keptId } }
          )
          savedUpdated += result.modifiedCount
          console.log(`[Cleanup] Updated ${result.modifiedCount} saved scholarship references from ${duplicateId} to ${keptId}`)
        }
      }

      // Delete duplicate scholarships
      const deleteResult = await scholarshipsCollection.deleteMany({
        _id: { $in: duplicateIds }
      })

      return NextResponse.json({
        success: true,
        duplicates_found: duplicateIds.length,
        duplicates_removed: deleteResult.deletedCount,
        matches_updated: matchesUpdated,
        saved_scholarships_updated: savedUpdated,
        message: `Removed ${deleteResult.deletedCount} duplicate scholarships, updated ${matchesUpdated} matches, and ${savedUpdated} saved scholarship references. Saved scholarships were protected from deletion.`,
      })
    } else {
      return NextResponse.json({
        success: true,
        duplicates_found: 0,
        duplicates_removed: 0,
        message: 'No duplicates found in the database.',
      })
    }
  } catch (error) {
    console.error('Error cleaning up duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup duplicates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
