import Anthropic from '@anthropic-ai/sdk'
import { createServer } from 'http'
import 'dotenv/config'

const client = new Anthropic({
  apiKey: process.env.VITE_ANTHROPIC_API_KEY,
})

const server = createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = ''
    for await (const chunk of req) body += chunk

    const { system, messages, max_tokens } = JSON.parse(body)

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
  } else if (req.method === 'POST' && req.url === '/api/suggestions') {
    let body = ''
    for await (const chunk of req) body += chunk

    const { vehicle, verdict } = JSON.parse(body)

    res.writeHead(200, { 'Content-Type': 'application/json' })

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: 'Return exactly 4 short follow-up questions a used car buyer would ask about this vehicle\'s safety data. Each question should be specific to the vehicle and its issues. Return ONLY a JSON array of 4 strings, nothing else.',
        messages: [{ role: 'user', content: `Vehicle: ${vehicle}\nVerdict summary: ${verdict}` }],
      })

      const text = response.content[0].text
      res.end(text)
    } catch {
      res.end(JSON.stringify([
        'What are the most serious recalls?',
        'Are these issues common for this model?',
        'What should I inspect before buying?',
        'Is this vehicle safe for daily driving?',
      ]))
    }
  } else if (req.method === 'POST' && req.url === '/api/extract-vin') {
    let body = ''
    for await (const chunk of req) body += chunk

    const { url } = JSON.parse(body)

    res.writeHead(200, { 'Content-Type': 'application/json' })

    try {
      const pageRes = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CarRecallChecker/1.0)' },
        redirect: 'follow',
      })
      const html = await pageRes.text()

      // Try multiple patterns to find VIN in page content
      const patterns = [
        /\bVIN[:\s#]*([A-HJ-NPR-Z0-9]{17})\b/i,
        /"vin"\s*:\s*"([A-HJ-NPR-Z0-9]{17})"/i,
        /vehicleIdentificationNumber["\s:]+([A-HJ-NPR-Z0-9]{17})/i,
        /data-vin="([A-HJ-NPR-Z0-9]{17})"/i,
        /vehicle\/([A-HJ-NPR-Z0-9]{17})/i,
      ]

      let vin = null
      for (const pattern of patterns) {
        const match = html.match(pattern)
        if (match) {
          vin = match[1].toUpperCase()
          break
        }
      }

      // Fallback: find any 17-char VIN-like string in the page
      if (!vin) {
        const allVins = html.match(/\b[A-HJ-NPR-Z0-9]{17}\b/gi)
        if (allVins && allVins.length > 0) {
          vin = allVins[0].toUpperCase()
        }
      }

      res.end(JSON.stringify({ vin }))
    } catch {
      res.end(JSON.stringify({ vin: null, error: 'Failed to fetch page' }))
    }
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})

const PORT = 3001
server.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
