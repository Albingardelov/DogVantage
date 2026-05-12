import { GoogleGenerativeAI } from '@google/generative-ai'

export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash'
export const GEMINI_PLAN_MODEL = 'gemini-2.5-flash-lite'

let _genAI: GoogleGenerativeAI | null = null
let _embedModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null
let _textModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null
let _planModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null

function requireEnv(name: string, value: string | undefined): string {
  if (value && value.length > 0) return value
  throw new Error(`Missing ${name}`)
}

function getGenAI(): GoogleGenerativeAI {
  if (_genAI) return _genAI
  const apiKey = requireEnv('GOOGLE_AI_API_KEY', process.env.GOOGLE_AI_API_KEY)
  _genAI = new GoogleGenerativeAI(apiKey)
  return _genAI
}

export function getEmbedModel() {
  if (_embedModel) return _embedModel
  _embedModel = getGenAI().getGenerativeModel({ model: 'gemini-embedding-001' })
  return _embedModel
}

export function getGeminiTextModel() {
  if (_textModel) return _textModel
  _textModel = getGenAI().getGenerativeModel({ model: GEMINI_TEXT_MODEL })
  return _textModel
}

export function getGeminiPlanModel() {
  if (_planModel) return _planModel
  _planModel = getGenAI().getGenerativeModel({ model: GEMINI_PLAN_MODEL })
  return _planModel
}

export function jsonGenConfig(temperature: number, maxOutputTokens: number) {
  return {
    temperature,
    maxOutputTokens,
    responseMimeType: 'application/json' as const,
    thinkingConfig: { thinkingBudget: 0 },
  }
}
