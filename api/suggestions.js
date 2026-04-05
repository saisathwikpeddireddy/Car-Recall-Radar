import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.VITE_ANTHROPIC_API_KEY,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end('Method not allowed')
    return
  }

  const { vehicle, verdict } = req.body

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      system: 'Return exactly 4 short follow-up questions a used car buyer would ask about this vehicle\'s safety data. Each question should be specific to the vehicle and its issues. Return ONLY a JSON array of 4 strings, nothing else.',
      messages: [{ role: 'user', content: `Vehicle: ${vehicle}\nVerdict summary: ${verdict}` }],
    })

    const text = response.content[0].text
    res.status(200).json(JSON.parse(text))
  } catch {
    res.status(200).json([
      'What are the most serious recalls?',
      'Are these issues common for this model?',
      'What should I inspect before buying?',
      'Is this vehicle safe for daily driving?',
    ])
  }
}
