import Anthropic from '@anthropic-ai/sdk'
import { createServer } from 'http'
import { readFileSync } from 'fs'

const client = new Anthropic()

const server = createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = ''
    for await (const chunk of req) body += chunk

    const { system, messages } = JSON.parse(body)

    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    })

    try {
      const stream = await client.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
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
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})

const PORT = 3001
server.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
