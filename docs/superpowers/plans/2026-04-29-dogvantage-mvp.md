# DogVantage MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a PWA for breed-specific dog training with AI-driven weekly tasks and free chat, grounded in breed club PDF documents via RAG with Google Gemini 2.0 Flash.

**Architecture:** Next.js 15 App Router, Tailwind CSS. Pure business logic in `src/lib/` (dog profile, age, AI/RAG) is fully decoupled from UI. Supabase stores pgvector embeddings and caches AI responses per breed/week. No auth in MVP — dog profile persists in localStorage. AI layer is isolated behind a thin interface so providers can be swapped later.

**Tech Stack:** Next.js 15, TypeScript 5, Tailwind CSS, @serwist/next 9, supabase-js 2, @google/generative-ai, pdf-parse, Vitest 2

---

## File Map

**Types & Lib:**
- `src/types/index.ts` — shared types (DogProfile, Breed, ChunkMatch, TrainingResult, SessionLog)
- `src/lib/dog/age.ts` — age-in-weeks calculation (pure function)
- `src/lib/dog/profile.ts` — localStorage CRUD for DogProfile
- `src/lib/supabase/client.ts` — Supabase singleton
- `src/lib/supabase/breed-chunks.ts` — pgvector similarity search via RPC
- `src/lib/supabase/training-cache.ts` — read/write training_cache
- `src/lib/supabase/session-logs.ts` — save + fetch recent session logs
- `src/lib/ai/client.ts` — Gemini 2.0 Flash singleton
- `src/lib/ai/embed.ts` — text-embedding-004 wrapper (returns number[])
- `src/lib/ai/rag.ts` — RAG query: embed → search → generate (accepts optional session logs)
- `src/lib/ai/ingest.ts` — PDF → chunks → embeddings → Supabase insert

**API Routes:**
- `src/app/api/training/route.ts` — GET `/api/training?breed=&week=` (fetches recent logs, passes to RAG)
- `src/app/api/chat/route.ts` — POST `/api/chat` `{ breed, message }`
- `src/app/api/ingest/route.ts` — POST `/api/ingest` (multipart, admin only)
- `src/app/api/logs/route.ts` — POST `/api/logs` `{ breed, week_number, notes }`

**Pages:**
- `src/app/page.tsx` — landing page
- `src/app/onboarding/page.tsx` — dog registration
- `src/app/dashboard/page.tsx` — weekly training view
- `src/app/chat/page.tsx` — free chat
- `src/app/admin/ingest/page.tsx` — PDF upload UI
- `src/app/manifest.ts` — PWA manifest (Next.js format)
- `src/app/sw.ts` — service worker entry (serwist)

**Components:**
- `src/components/ProfileGuard.tsx` — client component: checks localStorage, redirects to /onboarding if missing
- `src/components/DogProfileForm.tsx` — registration form (client component)
- `src/components/TrainingCard.tsx` — weekly task + source citation
- `src/components/ChatInterface.tsx` — chat UI with message history

**Config:**
- `vitest.config.ts`
- `vitest.setup.ts`
- `next.config.ts`
- `.env.example` — template (no secrets)

**Tests:**
- `src/lib/dog/age.test.ts`
- `src/lib/dog/profile.test.ts`
- `src/lib/ai/rag.test.ts`

---

### Task 1: Initialize Next.js project

**Files:**
- Create: project root via `create-next-app`
- Create: `.env.example`

- [ ] **Step 1: Scaffold the app**

```bash
cd /home/albin/Documents/Kod/DogVantage
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint --no-turbopack
```

When prompted, accept all defaults.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @supabase/supabase-js @google/generative-ai @serwist/next serwist pdf-parse
npm install -D vitest @vitest/coverage-v8 @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @types/pdf-parse
```

- [ ] **Step 3: Create `.env.example`**

```bash
cat > .env.example << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
ADMIN_SECRET=choose_a_random_secret
EOF
```

Create `.env.local` from this template and fill in real values (do not commit).

- [ ] **Step 4: Create `.gitignore` entry**

Make sure `.env.local` is in `.gitignore` (create-next-app adds it automatically — verify it's there).

```bash
grep ".env.local" .gitignore
```

Expected: `.env.local`

- [ ] **Step 5: Initial commit**

```bash
git init
git remote add origin https://github.com/Albingardelov/DogVantage.git
git branch -M main
git add .
git commit -m "chore: initialize Next.js 15 project with Tailwind and dependencies"
git push -u origin main
```

---

### Task 2: Configure Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json` (add test script)

- [ ] **Step 1: Write `vitest.config.ts`**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 2: Write `vitest.setup.ts`**

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
```

- [ ] **Step 3: Add test script to `package.json`**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Smoke test**

```bash
npm test
```

Expected: "No test files found" (exit 0 or Vitest warning — not a failure).

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts vitest.setup.ts package.json
git commit -m "chore: configure Vitest with jsdom and localStorage mock"
```

---

### Task 3: Shared types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Write types**

```typescript
// src/types/index.ts

export type Breed = 'labrador' | 'italian_greyhound' | 'braque_francais'

export interface DogProfile {
  name: string
  breed: Breed
  birthdate: string // ISO 8601, e.g. "2024-10-15"
}

export interface ChunkMatch {
  id: string
  content: string
  source: string
  similarity: number
}

export interface TrainingResult {
  content: string
  source: string
}

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

export interface SessionLog {
  id: string
  breed: Breed
  week_number: number
  notes: string
  created_at: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

### Task 4: Dog age calculation

**Files:**
- Create: `src/lib/dog/age.ts`
- Create: `src/lib/dog/age.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/dog/age.test.ts
import { describe, it, expect } from 'vitest'
import { getAgeInWeeks } from './age'

describe('getAgeInWeeks', () => {
  it('returns 0 for a dog born today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(getAgeInWeeks(today)).toBe(0)
  })

  it('returns 8 for a dog born exactly 56 days ago', () => {
    const birthdate = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    expect(getAgeInWeeks(birthdate)).toBe(8)
  })

  it('returns 12 for a dog born 84 days ago', () => {
    const birthdate = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    expect(getAgeInWeeks(birthdate)).toBe(12)
  })

  it('floors partial weeks', () => {
    const birthdate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    expect(getAgeInWeeks(birthdate)).toBe(1)
  })
})
```

- [ ] **Step 2: Run — verify it fails**

```bash
npm test src/lib/dog/age.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: Implement**

```typescript
// src/lib/dog/age.ts
export function getAgeInWeeks(birthdate: string): number {
  const birth = new Date(birthdate).getTime()
  const now = Date.now()
  const days = Math.floor((now - birth) / (1000 * 60 * 60 * 24))
  return Math.floor(days / 7)
}
```

- [ ] **Step 4: Run — verify it passes**

```bash
npm test src/lib/dog/age.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/dog/age.ts src/lib/dog/age.test.ts
git commit -m "feat: add dog age-in-weeks calculation with tests"
```

---

### Task 5: Dog profile (localStorage)

**Files:**
- Create: `src/lib/dog/profile.ts`
- Create: `src/lib/dog/profile.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/dog/profile.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { getDogProfile, saveDogProfile, clearDogProfile } from './profile'
import type { DogProfile } from '@/types'

const mockProfile: DogProfile = {
  name: 'Rex',
  breed: 'labrador',
  birthdate: '2024-10-15',
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('getDogProfile', () => {
  it('returns null when no profile is stored', () => {
    expect(getDogProfile()).toBeNull()
  })

  it('returns the stored profile', () => {
    localStorage.setItem('dogProfile', JSON.stringify(mockProfile))
    expect(getDogProfile()).toEqual(mockProfile)
  })
})

describe('saveDogProfile', () => {
  it('stores the profile in localStorage', () => {
    saveDogProfile(mockProfile)
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'dogProfile',
      JSON.stringify(mockProfile)
    )
  })
})

describe('clearDogProfile', () => {
  it('removes the profile from localStorage', () => {
    clearDogProfile()
    expect(localStorage.removeItem).toHaveBeenCalledWith('dogProfile')
  })
})
```

- [ ] **Step 2: Run — verify it fails**

```bash
npm test src/lib/dog/profile.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: Implement**

```typescript
// src/lib/dog/profile.ts
import type { DogProfile } from '@/types'

const KEY = 'dogProfile'

export function getDogProfile(): DogProfile | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as DogProfile
  } catch {
    return null
  }
}

export function saveDogProfile(profile: DogProfile): void {
  localStorage.setItem(KEY, JSON.stringify(profile))
}

export function clearDogProfile(): void {
  localStorage.removeItem(KEY)
}
```

- [ ] **Step 4: Run — verify it passes**

```bash
npm test src/lib/dog/profile.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/dog/profile.ts src/lib/dog/profile.test.ts
git commit -m "feat: add dog profile localStorage CRUD with tests"
```

---

### Task 6: Supabase database schema

**Files:** (Supabase dashboard SQL — no local files except the migration doc)
- Create: `docs/supabase-schema.sql`

- [ ] **Step 1: Write schema file**

```sql
-- docs/supabase-schema.sql
-- Run this in the Supabase SQL editor for your project

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Breed chunks: RAG source data from breed club PDFs
CREATE TABLE IF NOT EXISTS breed_chunks (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed     text NOT NULL,
  source    text NOT NULL,
  content   text NOT NULL,
  embedding vector(768) NOT NULL
);

CREATE INDEX IF NOT EXISTS breed_chunks_breed_idx ON breed_chunks (breed);
CREATE INDEX IF NOT EXISTS breed_chunks_embedding_idx
  ON breed_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Training cache: stores AI-generated weekly tasks per breed+week
CREATE TABLE IF NOT EXISTS training_cache (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed       text NOT NULL,
  week_number int  NOT NULL,
  content     text NOT NULL,
  source      text NOT NULL DEFAULT '',
  created_at  timestamptz DEFAULT now(),
  UNIQUE(breed, week_number)
);

-- RPC function for similarity search
CREATE OR REPLACE FUNCTION match_breed_chunks(
  query_embedding vector(768),
  match_breed     text,
  match_count     int DEFAULT 5
)
RETURNS TABLE(id uuid, content text, source text, similarity float)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bc.id,
    bc.content,
    bc.source,
    (1 - (bc.embedding <=> query_embedding))::float AS similarity
  FROM breed_chunks bc
  WHERE bc.breed = match_breed
  ORDER BY bc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

- [ ] **Step 2: Run schema in Supabase**

1. Open your Supabase project → SQL Editor
2. Paste the contents of `docs/supabase-schema.sql`
3. Click "Run"
4. Verify tables `breed_chunks` and `training_cache` appear in the Table Editor

- [ ] **Step 3: Commit**

```bash
git add docs/supabase-schema.sql
git commit -m "feat: add Supabase schema with pgvector and match_breed_chunks RPC"
```

---

### Task 7: Supabase client + breed-chunks module

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/breed-chunks.ts`

- [ ] **Step 1: Create Supabase singleton**

```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key)
```

- [ ] **Step 2: Create breed-chunks similarity search**

```typescript
// src/lib/supabase/breed-chunks.ts
import { supabase } from './client'
import type { ChunkMatch, Breed } from '@/types'

export async function searchBreedChunks(
  queryEmbedding: number[],
  breed: Breed,
  matchCount = 5
): Promise<ChunkMatch[]> {
  const { data, error } = await supabase.rpc('match_breed_chunks', {
    query_embedding: queryEmbedding,
    match_breed: breed,
    match_count: matchCount,
  })

  if (error) throw new Error(`Chunk search failed: ${error.message}`)

  return (data as ChunkMatch[]) ?? []
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/client.ts src/lib/supabase/breed-chunks.ts
git commit -m "feat: add Supabase client and breed-chunks similarity search"
```

---

### Task 8: Training cache

**Files:**
- Create: `src/lib/supabase/training-cache.ts`

- [ ] **Step 1: Create Supabase service-role client for writes**

Add to `src/lib/supabase/client.ts`:

```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient(url, anonKey)

// Server-side only — never expose to client
export const supabaseAdmin = serviceKey
  ? createClient(url, serviceKey)
  : supabase
```

- [ ] **Step 2: Create training-cache module**

```typescript
// src/lib/supabase/training-cache.ts
import { supabaseAdmin } from './client'
import type { TrainingResult, Breed } from '@/types'

export async function getCachedTraining(
  breed: Breed,
  weekNumber: number
): Promise<TrainingResult | null> {
  const { data, error } = await supabaseAdmin
    .from('training_cache')
    .select('content, source')
    .eq('breed', breed)
    .eq('week_number', weekNumber)
    .single()

  if (error || !data) return null
  return { content: data.content, source: data.source }
}

export async function setCachedTraining(
  breed: Breed,
  weekNumber: number,
  result: TrainingResult
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('training_cache')
    .upsert({ breed, week_number: weekNumber, ...result })

  if (error) throw new Error(`Cache write failed: ${error.message}`)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/client.ts src/lib/supabase/training-cache.ts
git commit -m "feat: add training cache read/write with Supabase"
```

---

### Task 9: Google AI client + embeddings

**Files:**
- Create: `src/lib/ai/client.ts`
- Create: `src/lib/ai/embed.ts`

- [ ] **Step 1: Create Gemini client singleton**

```typescript
// src/lib/ai/client.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export const gemini = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

export const embedModel = genAI.getGenerativeModel({
  model: 'text-embedding-004',
})
```

- [ ] **Step 2: Create embed wrapper**

```typescript
// src/lib/ai/embed.ts
import { embedModel } from './client'

export async function embedText(text: string): Promise<number[]> {
  const result = await embedModel.embedContent(text)
  return result.embedding.values
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/client.ts src/lib/ai/embed.ts
git commit -m "feat: add Google AI Gemini and text-embedding-004 clients"
```

---

### Task 10: RAG query pipeline

**Files:**
- Create: `src/lib/ai/rag.ts`
- Create: `src/lib/ai/rag.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/ai/rag.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ChunkMatch, TrainingResult } from '@/types'

vi.mock('@/lib/ai/embed', () => ({
  embedText: vi.fn().mockResolvedValue(new Array(768).fill(0.1)),
}))

vi.mock('@/lib/supabase/breed-chunks', () => ({
  searchBreedChunks: vi.fn().mockResolvedValue([
    {
      id: 'abc',
      content: 'Labradors bör tränas dagligen med positiv förstärkning.',
      source: 'RAS_labrador_2023.pdf',
      similarity: 0.92,
    },
  ] satisfies ChunkMatch[]),
}))

vi.mock('@/lib/ai/client', () => ({
  gemini: {
    generateContent: vi.fn().mockResolvedValue({
      response: {
        text: () =>
          'Vecka 8: Träna grundläggande lydnad i lugn miljö 10 min/dag.',
      },
    }),
  },
}))

describe('queryRAG', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns content and source', async () => {
    const { queryRAG } = await import('./rag')
    const result: TrainingResult = await queryRAG(
      'Vad ska jag träna vecka 8?',
      'labrador'
    )
    expect(result.content).toBe(
      'Vecka 8: Träna grundläggande lydnad i lugn miljö 10 min/dag.'
    )
    expect(result.source).toBe('RAS_labrador_2023.pdf')
  })

  it('includes breed in system prompt', async () => {
    const { gemini } = await import('@/lib/ai/client')
    const { queryRAG } = await import('./rag')
    await queryRAG('Vad ska jag träna?', 'labrador')
    const call = vi.mocked(gemini.generateContent).mock.calls[0][0] as string
    expect(call).toContain('labrador')
  })

  it('includes session logs in prompt when provided', async () => {
    const { gemini } = await import('@/lib/ai/client')
    const { queryRAG } = await import('./rag')
    await queryRAG('Vad ska jag träna?', 'labrador', [
      'Vecka 7: tappade fokus efter 15 min',
    ])
    const call = vi.mocked(gemini.generateContent).mock.calls[0][0] as string
    expect(call).toContain('tappade fokus efter 15 min')
  })
})
```

- [ ] **Step 2: Run — verify it fails**

```bash
npm test src/lib/ai/rag.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: Implement**

```typescript
// src/lib/ai/rag.ts
import { embedText } from './embed'
import { gemini } from './client'
import { searchBreedChunks } from '@/lib/supabase/breed-chunks'
import type { Breed, TrainingResult } from '@/types'

export async function queryRAG(
  query: string,
  breed: Breed,
  recentLogs: string[] = []
): Promise<TrainingResult> {
  const embedding = await embedText(query)
  const chunks = await searchBreedChunks(embedding, breed)

  const context = chunks.map((c) => c.content).join('\n\n')
  const primarySource = chunks[0]?.source ?? 'okänd källa'

  const logsSection =
    recentLogs.length > 0
      ? `\nTidigare träningspass för denna hund:\n${recentLogs.map((l) => `- ${l}`).join('\n')}\n\nAnpassa rekommendationen utifrån hundens faktiska prestation ovan.`
      : ''

  const prompt = `Du är en expert på hundträning specialiserad på ${breed}.
Basera ditt svar ENBART på följande källdokument från rasklubben.
Om svaret inte finns i källorna, säg det tydligt.
Svara på svenska.

Källdokument:
${context}
${logsSection}
Fråga: ${query}`

  const result = await gemini.generateContent(prompt)
  const content = result.response.text()

  return { content, source: primarySource }
}
```

- [ ] **Step 4: Run — verify it passes**

```bash
npm test src/lib/ai/rag.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/rag.ts src/lib/ai/rag.test.ts
git commit -m "feat: add RAG query pipeline with tests"
```

---

### Task 11: Ingestion pipeline

**Files:**
- Create: `src/lib/ai/ingest.ts`

- [ ] **Step 1: Implement**

```typescript
// src/lib/ai/ingest.ts
import pdfParse from 'pdf-parse'
import { embedText } from './embed'
import { supabaseAdmin } from '@/lib/supabase/client'
import type { Breed } from '@/types'

const CHUNK_SIZE = 2000   // chars ≈ 500 tokens
const CHUNK_OVERLAP = 200 // chars ≈ 50 tokens overlap

function chunkText(text: string): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length)
    chunks.push(text.slice(start, end).trim())
    start += CHUNK_SIZE - CHUNK_OVERLAP
  }
  return chunks.filter((c) => c.length > 50) // drop tiny trailing chunks
}

export async function ingestPDF(
  buffer: Buffer,
  breed: Breed,
  filename: string
): Promise<{ chunksInserted: number }> {
  const { text } = await pdfParse(buffer)
  const chunks = chunkText(text)

  let inserted = 0
  for (const content of chunks) {
    const embedding = await embedText(content)
    const { error } = await supabaseAdmin.from('breed_chunks').insert({
      breed,
      source: filename,
      content,
      embedding,
    })
    if (error) throw new Error(`Insert failed: ${error.message}`)
    inserted++
  }

  return { chunksInserted: inserted }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/ingest.ts
git commit -m "feat: add PDF ingestion pipeline (chunk + embed + insert)"
```

---

### Task 12: API routes

**Files:**
- Create: `src/app/api/training/route.ts`
- Create: `src/app/api/chat/route.ts`
- Create: `src/app/api/ingest/route.ts`
- Create: `src/app/api/logs/route.ts`

- [ ] **Step 1: Create training route**

Hämtar de senaste loggarna och skickar dem med till RAG om de finns.

```typescript
// src/app/api/training/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { queryRAG } from '@/lib/ai/rag'
import { getCachedTraining, setCachedTraining } from '@/lib/supabase/training-cache'
import { getRecentLogs } from '@/lib/supabase/session-logs'
import type { Breed } from '@/types'

export async function GET(req: NextRequest) {
  const breed = req.nextUrl.searchParams.get('breed') as Breed | null
  const week = Number(req.nextUrl.searchParams.get('week'))

  if (!breed || isNaN(week)) {
    return NextResponse.json({ error: 'breed and week required' }, { status: 400 })
  }

  const recentLogs = await getRecentLogs(breed)

  // Only use cache if there are no recent logs (logs make each response adaptive)
  if (recentLogs.length === 0) {
    const cached = await getCachedTraining(breed, week)
    if (cached) return NextResponse.json(cached)
  }

  const logStrings = recentLogs.map((l) => `Vecka ${l.week_number}: ${l.notes}`)

  const result = await queryRAG(
    `Vad är lämplig träning för en ${breed} i vecka ${week} av sin uppväxt?`,
    breed,
    logStrings
  )

  // Cache only when no personal logs exist (generic baseline)
  if (recentLogs.length === 0) {
    await setCachedTraining(breed, week, result)
  }

  return NextResponse.json(result)
}
```

- [ ] **Step 2: Create chat route**

```typescript
// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { queryRAG } from '@/lib/ai/rag'
import type { Breed } from '@/types'

export async function POST(req: NextRequest) {
  const { breed, message } = (await req.json()) as {
    breed: Breed
    message: string
  }

  if (!breed || !message) {
    return NextResponse.json(
      { error: 'breed and message required' },
      { status: 400 }
    )
  }

  const result = await queryRAG(message, breed)
  return NextResponse.json(result)
}
```

- [ ] **Step 3: Create logs route**

```typescript
// src/app/api/logs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { saveSessionLog } from '@/lib/supabase/session-logs'
import type { Breed } from '@/types'

export async function POST(req: NextRequest) {
  const { breed, week_number, notes } = (await req.json()) as {
    breed: Breed
    week_number: number
    notes: string
  }

  if (!breed || !notes || week_number === undefined) {
    return NextResponse.json(
      { error: 'breed, week_number and notes required' },
      { status: 400 }
    )
  }

  await saveSessionLog(breed, week_number, notes)
  return NextResponse.json({ ok: true })
}
```
```

- [ ] **Step 3: Create ingest route**

```typescript
// src/app/api/ingest/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ingestPDF } from '@/lib/ai/ingest'
import type { Breed } from '@/types'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const breed = formData.get('breed') as Breed | null

  if (!file || !breed) {
    return NextResponse.json({ error: 'file and breed required' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const result = await ingestPDF(buffer, breed, file.name)
  return NextResponse.json(result)
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/
git commit -m "feat: add training, chat, and ingest API routes"
```

---

### Task 13: ProfileGuard component

**Files:**
- Create: `src/components/ProfileGuard.tsx`

This component wraps pages that require a dog profile. It checks localStorage client-side and redirects to `/onboarding` if no profile is found.

- [ ] **Step 1: Implement**

```typescript
// src/components/ProfileGuard.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getDogProfile } from '@/lib/dog/profile'
import type { DogProfile } from '@/types'

interface Props {
  children: (profile: DogProfile) => React.ReactNode
}

export function ProfileGuard({ children }: Props) {
  const router = useRouter()
  const [profile, setProfile] = useState<DogProfile | null | 'loading'>('loading')

  useEffect(() => {
    const p = getDogProfile()
    if (!p) {
      router.replace('/onboarding')
    } else {
      setProfile(p)
    }
  }, [router])

  if (profile === 'loading' || profile === null) return null
  return <>{children(profile)}</>
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ProfileGuard.tsx
git commit -m "feat: add ProfileGuard component with localStorage redirect"
```

---

### Task 14: Landing page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace default page**

```typescript
// src/app/page.tsx
import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">DogVantage</h1>
      <p className="text-lg text-gray-600 max-w-md">
        Personlig träning för din hund — baserad på rasklubbarnas egna
        riktlinjer, anpassad till din hunds exakta ålder.
      </p>
      <Link
        href="/onboarding"
        className="rounded-xl bg-black text-white px-8 py-3 text-lg font-medium hover:bg-gray-800 transition-colors"
      >
        Kom igång
      </Link>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add landing page"
```

---

### Task 15: Onboarding page

**Files:**
- Create: `src/app/onboarding/page.tsx`
- Create: `src/components/DogProfileForm.tsx`

- [ ] **Step 1: Create DogProfileForm**

```typescript
// src/components/DogProfileForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveDogProfile } from '@/lib/dog/profile'
import type { DogProfile, Breed } from '@/types'

const BREEDS: { value: Breed; label: string }[] = [
  { value: 'labrador', label: 'Labrador Retriever' },
  { value: 'italian_greyhound', label: 'Italiensk Vinthund' },
  { value: 'braque_francais', label: 'Braque Français' },
]

export function DogProfileForm() {
  const router = useRouter()
  const [form, setForm] = useState<DogProfile>({
    name: '',
    breed: 'labrador',
    birthdate: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    saveDogProfile(form)
    router.push('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <div className="flex flex-col gap-1">
        <label className="font-medium text-sm">Hundens namn</label>
        <input
          required
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Rex"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-medium text-sm">Ras</label>
        <select
          value={form.breed}
          onChange={(e) => setForm({ ...form, breed: e.target.value as Breed })}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
        >
          {BREEDS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-medium text-sm">Födelsedatum</label>
        <input
          required
          type="date"
          value={form.birthdate}
          onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>
      <button
        type="submit"
        className="mt-2 rounded-xl bg-black text-white py-3 font-medium hover:bg-gray-800 transition-colors"
      >
        Spara och fortsätt
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Create onboarding page**

```typescript
// src/app/onboarding/page.tsx
import { DogProfileForm } from '@/components/DogProfileForm'

export default function OnboardingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Berätta om din hund</h1>
      <DogProfileForm />
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/onboarding/ src/components/DogProfileForm.tsx
git commit -m "feat: add onboarding page and dog profile form"
```

---

### Task 16: TrainingCard component + Dashboard page

**Files:**
- Create: `src/components/TrainingCard.tsx`
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Create TrainingCard**

TrainingCard innehåller ett fritext-fält för att logga hur träningen gick. När användaren sparar skickas anteckningen till `/api/logs`.

```typescript
// src/components/TrainingCard.tsx
'use client'

import { useState } from 'react'
import type { Breed } from '@/types'

interface Props {
  content: string
  source: string
  weekNumber: number
  breed: Breed
}

export function TrainingCard({ content, source, weekNumber, breed }: Props) {
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!notes.trim()) return
    setSaving(true)
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ breed, week_number: weekNumber, notes }),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border p-6 max-w-lg w-full shadow-sm flex flex-col gap-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
          Vecka {weekNumber}
        </p>
        <p className="text-base leading-relaxed whitespace-pre-wrap">{content}</p>
        <p className="mt-3 text-xs text-gray-400">Källa: {source}</p>
      </div>

      <div className="border-t pt-4 flex flex-col gap-2">
        <label className="text-xs font-medium text-gray-500">
          Hur gick träningen?
        </label>
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setSaved(false) }}
          placeholder="T.ex. tappade fokus efter 15 min, ville leka istället…"
          rows={3}
          className="border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button
          onClick={handleSave}
          disabled={saving || saved || !notes.trim()}
          className="self-end text-sm bg-black text-white rounded-xl px-4 py-2 disabled:opacity-40"
        >
          {saved ? 'Sparat!' : saving ? 'Sparar…' : 'Spara notering'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create dashboard page**

```typescript
// src/app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProfileGuard } from '@/components/ProfileGuard'
import { TrainingCard } from '@/components/TrainingCard'
import { getAgeInWeeks } from '@/lib/dog/age'
import type { TrainingResult, Breed } from '@/types'

export default function DashboardPage() {
  return (
    <ProfileGuard>
      {(profile) => <Dashboard profile={profile} />}
    </ProfileGuard>
  )
}

function Dashboard({ profile }: { profile: { name: string; breed: string; birthdate: string } }) {
  const weekNumber = getAgeInWeeks(profile.birthdate)
  const [task, setTask] = useState<TrainingResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/training?breed=${profile.breed}&week=${weekNumber}`)
      .then((r) => r.json())
      .then(setTask)
      .catch(() => setError('Kunde inte hämta träningsuppgift.'))
      .finally(() => setLoading(false))
  }, [profile.breed, weekNumber])

  return (
    <main className="min-h-screen flex flex-col items-center gap-6 p-8 pt-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{profile.name}</h1>
        <p className="text-gray-500">{weekNumber} veckor gammal</p>
      </div>

      {loading && <p className="text-gray-400">Hämtar veckans uppgift…</p>}
      {error && <p className="text-red-500">{error}</p>}
      {task && (
        <TrainingCard
          content={task.content}
          source={task.source}
          weekNumber={weekNumber}
          breed={profile.breed as Breed}
        />
      )}

      <Link
        href="/chat"
        className="mt-4 text-sm text-gray-500 underline underline-offset-2"
      >
        Ställ en fråga om din hund →
      </Link>
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TrainingCard.tsx src/app/dashboard/
git commit -m "feat: add dashboard with weekly training card"
```

---

### Task 17: Chat page

**Files:**
- Create: `src/components/ChatInterface.tsx`
- Create: `src/app/chat/page.tsx`

- [ ] **Step 1: Create ChatInterface**

```typescript
// src/components/ChatInterface.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import type { ChatMessage, Breed } from '@/types'

interface Props {
  breed: Breed
  dogName: string
}

export function ChatInterface({ breed, dogName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: ChatMessage = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ breed, message: input }),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: `${data.content}\n\n*Källa: ${data.source}*` },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: 'Något gick fel. Försök igen.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] max-w-lg w-full mx-auto">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm text-center mt-8">
            Ställ en fråga om {dogName}
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-xl px-4 py-3 text-sm max-w-[85%] whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-black text-white self-end'
                : 'bg-gray-100 text-gray-900 self-start'
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-400 self-start">
            Tänker…
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={handleSend}
        className="border-t p-4 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Skriv en fråga…"
          className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white rounded-xl px-4 py-2 text-sm disabled:opacity-40"
        >
          Skicka
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Create chat page**

```typescript
// src/app/chat/page.tsx
'use client'

import Link from 'next/link'
import { ProfileGuard } from '@/components/ProfileGuard'
import { ChatInterface } from '@/components/ChatInterface'
import type { Breed } from '@/types'

export default function ChatPage() {
  return (
    <ProfileGuard>
      {(profile) => (
        <main className="min-h-screen flex flex-col">
          <header className="h-16 flex items-center justify-between px-6 border-b">
            <Link href="/dashboard" className="text-sm text-gray-500">
              ← Tillbaka
            </Link>
            <span className="font-semibold text-sm">{profile.name}</span>
            <div className="w-16" />
          </header>
          <ChatInterface breed={profile.breed as Breed} dogName={profile.name} />
        </main>
      )}
    </ProfileGuard>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ChatInterface.tsx src/app/chat/
git commit -m "feat: add chat page with RAG-powered chat interface"
```

---

### Task 18: Admin ingest page

**Files:**
- Create: `src/app/admin/ingest/page.tsx`

- [ ] **Step 1: Implement**

```typescript
// src/app/admin/ingest/page.tsx
'use client'

import { useState, useRef } from 'react'
import type { Breed } from '@/types'

const BREEDS: { value: Breed; label: string }[] = [
  { value: 'labrador', label: 'Labrador' },
  { value: 'italian_greyhound', label: 'Italiensk Vinthund' },
  { value: 'braque_francais', label: 'Braque Français' },
]

export default function AdminIngestPage() {
  const [breed, setBreed] = useState<Breed>('labrador')
  const [secret, setSecret] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setLoading(true)
    setStatus(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('breed', breed)

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'x-admin-secret': secret },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus(`Klart! ${data.chunksInserted} chunks inlagda.`)
    } catch (err) {
      setStatus(`Fel: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-xl font-bold">Ladda upp ras-dokument</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
        <select
          value={breed}
          onChange={(e) => setBreed(e.target.value as Breed)}
          className="border rounded-lg px-3 py-2"
        >
          {BREEDS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
        <input
          type="file"
          accept=".pdf"
          ref={fileRef}
          required
          className="border rounded-lg px-3 py-2"
        />
        <input
          type="password"
          placeholder="Admin-hemlighet"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          required
          className="border rounded-lg px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white rounded-xl py-3 font-medium disabled:opacity-40"
        >
          {loading ? 'Laddar upp…' : 'Ladda upp PDF'}
        </button>
        {status && <p className="text-sm text-center text-gray-600">{status}</p>}
      </form>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/
git commit -m "feat: add admin PDF ingestion page"
```

---

### Task 19: PWA configuration

**Files:**
- Create: `src/app/manifest.ts`
- Create: `src/app/sw.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Create PWA manifest**

```typescript
// src/app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DogVantage',
    short_name: 'DogVantage',
    description: 'Rasspecifik hundträning anpassad till din hunds ålder',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
```

- [ ] **Step 2: Create service worker entry**

```typescript
// src/app/sw.ts
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'
import { defaultCache } from '@serwist/next/worker'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()
```

- [ ] **Step 3: Update `next.config.ts`**

```typescript
// next.config.ts
import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
})

const nextConfig: NextConfig = {}

export default withSerwist(nextConfig)
```

- [ ] **Step 4: Add placeholder icons**

Add two placeholder PNG icons to `public/`:
- `public/icon-192.png` (192×192 px)
- `public/icon-512.png` (512×512 px)

Any placeholder image works for POC. Tools like [RealFaviconGenerator](https://realfavicongenerator.net/) can generate real icons later.

- [ ] **Step 5: Commit**

```bash
git add src/app/manifest.ts src/app/sw.ts next.config.ts public/
git commit -m "feat: configure PWA with serwist manifest and service worker"
```

---

### Task 21: Supabase session_logs schema

**Files:**
- Modify: `docs/supabase-schema.sql`

- [ ] **Step 1: Add table to schema file**

Lägg till i `docs/supabase-schema.sql`:

```sql
-- Session logs: fritext-noteringar per träningspass
CREATE TABLE IF NOT EXISTS session_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed       text NOT NULL,
  week_number int  NOT NULL,
  notes       text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS session_logs_breed_idx ON session_logs (breed, created_at DESC);
```

- [ ] **Step 2: Kör i Supabase SQL Editor**

Öppna Supabase → SQL Editor, klistra in ovanstående och kör.
Verifiera att `session_logs` visas i Table Editor.

- [ ] **Step 3: Commit**

```bash
git add docs/supabase-schema.sql
git commit -m "feat: add session_logs table to Supabase schema"
```

---

### Task 22: Session-logs Supabase-modul

**Files:**
- Create: `src/lib/supabase/session-logs.ts`

- [ ] **Step 1: Implement**

```typescript
// src/lib/supabase/session-logs.ts
import { supabaseAdmin } from './client'
import type { Breed, SessionLog } from '@/types'

export async function saveSessionLog(
  breed: Breed,
  weekNumber: number,
  notes: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('session_logs')
    .insert({ breed, week_number: weekNumber, notes })

  if (error) throw new Error(`Log save failed: ${error.message}`)
}

export async function getRecentLogs(
  breed: Breed,
  limit = 5
): Promise<SessionLog[]> {
  const { data, error } = await supabaseAdmin
    .from('session_logs')
    .select('id, breed, week_number, notes, created_at')
    .eq('breed', breed)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Log fetch failed: ${error.message}`)
  return (data as SessionLog[]) ?? []
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase/session-logs.ts
git commit -m "feat: add session-logs Supabase module (save + fetch recent)"
```

---

### Task 20: Run all tests + final push

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: PASS (all tests in `age.test.ts`, `profile.test.ts`, `rag.test.ts`)

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: successful build, no type errors.

- [ ] **Step 3: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 4: Verify on Vercel**

Connect the GitHub repo to Vercel (vercel.com → New Project → Import from GitHub).
Add environment variables from `.env.local` in the Vercel dashboard.
Trigger a deploy and confirm the landing page loads.

---

## Self-Review

**Spec coverage:**
- [x] PWA (manifest + serwist) — Task 19
- [x] Supabase auth skipped in MVP, localStorage used — Tasks 5, 13
- [x] Dog age in weeks — Task 4
- [x] Dashboard with weekly task — Task 16
- [x] RAG pipeline (embed → pgvector → Gemini) — Tasks 9, 10, 12
- [x] Chat — Tasks 17
- [x] Admin PDF ingestion — Tasks 11, 12, 18
- [x] 3 breeds (labrador, italian_greyhound, braque_francais) — Task 3
- [x] Training cache per breed+week — Tasks 8, 12
- [x] Source citation — Tasks 10, 16, 17
- [x] AI layer isolated for future swap — `src/lib/ai/`
- [x] Business logic separated from UI for future React Native — `src/lib/dog/`

**Type consistency:** `TrainingResult`, `DogProfile`, `Breed`, `ChunkMatch`, `ChatMessage` defined in `src/types/index.ts` and used consistently across all tasks.

**No placeholders found.**
