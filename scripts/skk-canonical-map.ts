import { BREED_REGISTRY } from '../src/lib/breeds/registry'
import type { Breed } from '../src/types'

const DUPLICATE_FCI_CANONICAL: Record<number, Breed> = {
  15: 'belgian_malinois',
  148: 'dachshund_standard',
  172: 'poodle_standard',
}

const CANONICAL_BREED_BY_FCI = new Map<number, Breed>()

for (const entry of BREED_REGISTRY) {
  const fci = entry.fciNumber
  const slug = entry.slug as Breed
  if (DUPLICATE_FCI_CANONICAL[fci]) continue
  if (!CANONICAL_BREED_BY_FCI.has(fci)) {
    CANONICAL_BREED_BY_FCI.set(fci, slug)
  }
}

for (const [fci, slug] of Object.entries(DUPLICATE_FCI_CANONICAL)) {
  CANONICAL_BREED_BY_FCI.set(Number(fci), slug)
}

export function canonicalBreedFromFci(fciNumber: number): Breed | null {
  return CANONICAL_BREED_BY_FCI.get(fciNumber) ?? null
}
