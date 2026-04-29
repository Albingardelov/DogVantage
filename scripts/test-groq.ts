import 'dotenv/config'
import Groq from 'groq-sdk'

async function main() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  const r = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: 'Säg hej på svenska' }],
  })
  console.log(r.choices[0].message.content)
}

main().catch(console.error)
