import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  console.warn('GEMINI_API_KEY is not set. Embeddings will be skipped.')
}

const client = apiKey ? new GoogleGenerativeAI(apiKey) : null

export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!client) {
    return null
  }

  const model = client.getGenerativeModel({ model: 'text-embedding-004' })
  const result = await model.embedContent(text)
  return result.embedding.values
}
