import { getEmbedModel } from './client'

export async function embedText(text: string): Promise<number[]> {
  const result = await getEmbedModel().embedContent(text)
  return result.embedding.values
}
