import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  console.warn('GEMINI_API_KEY is not set. Embeddings will be skipped.')
}

const client = apiKey ? new GoogleGenerativeAI(apiKey) : null

export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!client) {
    console.error('[Gemini] Client not initialized. GEMINI_API_KEY is missing.')
    return null
  }

  if (!text || !text.trim()) {
    console.error('[Gemini] Cannot generate embedding for empty text')
    return null
  }

  try {
    const model = client.getGenerativeModel({ model: 'text-embedding-004' })
    const result = await model.embedContent(text)
    
    if (!result || !result.embedding || !result.embedding.values) {
      console.error('[Gemini] Invalid response from embedding API')
      return null
    }
    
    return result.embedding.values
  } catch (error) {
    console.error('[Gemini] Error generating embedding:', error)
    if (error instanceof Error) {
      console.error('[Gemini] Error message:', error.message)
      console.error('[Gemini] Error stack:', error.stack)
    }
    throw error // Re-throw so caller can handle it
  }
}
