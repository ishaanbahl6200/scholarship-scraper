import { describe, it, expect, vi } from 'vitest'

describe('db', () => {
  it('throws when MONGODB_URI is missing', async () => {
    const original = process.env.MONGODB_URI
    delete process.env.MONGODB_URI

    vi.resetModules()
    await expect(import('../db')).rejects.toThrow('Missing MONGODB_URI')

    if (original) {
      process.env.MONGODB_URI = original
    }
  })
})
