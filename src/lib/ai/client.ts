import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'

// Groq for text generation (free tier, fast)
export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
export const GROQ_MODEL = 'llama-3.3-70b-versatile'

// Google for embeddings (gemini-embedding-001 works on free tier)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
export const embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })
