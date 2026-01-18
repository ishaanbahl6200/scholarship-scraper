import { describe, it, expect } from 'vitest'

describe('auth route', () => {
  it('exports a GET handler', async () => {
    const route = await import('./route')
    expect(typeof route.GET).toBe('function')
  })
})
