import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'

export const GROQ_MODEL = 'llama-3.3-70b-versatile'

let _groq: Groq | null = null
let _embedModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null

function requireEnv(name: string, value: string | undefined): string {
  if (value && value.length > 0) return value
  throw new Error(`Missing ${name}`)
}

// Groq for text generation (free tier, fast)
export function getGroqClient(): Groq {
  if (_groq) return _groq
  const apiKey = requireEnv('GROQ_API_KEY', process.env.GROQ_API_KEY)
  _groq = new Groq({ apiKey })
  return _groq
}

// Google for embeddings (gemini-embedding-001 works on free tier)
export function getEmbedModel() {
  if (_embedModel) return _embedModel
  const apiKey = requireEnv('GOOGLE_AI_API_KEY', process.env.GOOGLE_AI_API_KEY)
  const genAI = new GoogleGenerativeAI(apiKey)
  _embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })
  return _embedModel
}
