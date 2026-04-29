import { embedModel } from './client'

export async function embedText(text: string): Promise<number[]> {
  const result = await embedModel.embedContent(text)
  return result.embedding.values
}
