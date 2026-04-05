import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.VITE_ANTHROPIC_API_KEY,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end('Method not allowed')
    return
  }

  const { system, messages, max_tokens } = req.body

  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache',
  })

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: max_tokens || 1024,
      system,
      messages,
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.text) {
        res.write(event.delta.text)
      }
    }
  } catch (err) {
    console.error('Anthropic API error:', err.message)
    if (!res.headersSent) {
      res.writeHead(500)
    }
    res.write('Error generating response.')
  }

  res.end()
}
