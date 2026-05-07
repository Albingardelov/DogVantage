import type { SessionLog } from '@/types'

export type HandlerDimension = 'timing' | 'consistency' | 'reading'

export interface HandlerFeedbackTip {
  id: string
  dimension: HandlerDimension
  title: string
  body: string
  learnArticleId: string
  averageScore: number
  sampleSize: number
}

const MIN_SAMPLES = 3
const LOW_THRESHOLD = 3.0

interface DimensionStats {
  avg: number
  count: number
}

function statsFor(
  logs: SessionLog[],
  picker: (log: SessionLog) => number | undefined
): DimensionStats | null {
  const values: number[] = []
  for (const log of logs) {
    const v = picker(log)
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) values.push(v)
  }
  if (values.length === 0) return null
  return {
    count: values.length,
    avg: values.reduce((a, b) => a + b, 0) / values.length,
  }
}

const DIMENSIONS: Array<{
  dim: HandlerDimension
  pick: (log: SessionLog) => number | undefined
  build: (
    avg: number,
    dogName: string
  ) => Pick<HandlerFeedbackTip, 'title' | 'body' | 'learnArticleId'>
}> = [
  {
    dim: 'timing',
    pick: (l) => l.handler_timing,
    build: (avg, dogName) => ({
      title: 'Din timing — det som ger störst utväxling',
      body: `Senaste passen har du själv skattat din timing till ${avg.toFixed(1)}/5. Att markera och belöna i exakt rätt ögonblick påverkar ${dogName}s inlärning mer än val av övning eller belöningstyp.`,
      learnArticleId: 'timing',
    }),
  },
  {
    dim: 'consistency',
    pick: (l) => l.handler_consistency,
    build: (avg, dogName) => ({
      title: 'Konsekvens — höj ett kriterium åt gången',
      body: `Du har rapporterat konsekvens på ${avg.toFixed(1)}/5 i snitt senaste passen. När kriterierna glider blir det svårt för ${dogName} att veta vad som gäller. Splitta, lumpa inte.`,
      learnArticleId: 'criteria',
    }),
  },
  {
    dim: 'reading',
    pick: (l) => l.handler_reading,
    build: (avg, dogName) => ({
      title: 'Att läsa hunden — tidiga stresssignaler',
      body: `Du har skattat ${avg.toFixed(1)}/5 på att läsa ${dogName} senaste passen. Att se gäspning, läpplick, bortvänt huvud innan hunden går över tröskeln är skillnaden mellan att avsluta i framgång och regression.`,
      learnArticleId: 'stress-signals',
    }),
  },
]

export function getHandlerFeedbackTip(
  logs: SessionLog[],
  dogName: string
): HandlerFeedbackTip | null {
  if (!logs.length) return null

  const candidates: HandlerFeedbackTip[] = []
  for (const def of DIMENSIONS) {
    const stats = statsFor(logs, def.pick)
    if (!stats || stats.count < MIN_SAMPLES) continue
    if (stats.avg >= LOW_THRESHOLD) continue
    const built = def.build(stats.avg, dogName)
    candidates.push({
      id: `handler-feedback-${def.dim}`,
      dimension: def.dim,
      averageScore: stats.avg,
      sampleSize: stats.count,
      ...built,
    })
  }
  if (!candidates.length) return null
  candidates.sort((a, b) => a.averageScore - b.averageScore)
  return candidates[0]
}
