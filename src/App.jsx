import { useState, useRef } from 'react'

const NHTSA_BASE = 'https://api.nhtsa.dot.gov'

function parseVehicleInput(input) {
  const trimmed = input.trim()
  const yearMatch = trimmed.match(/\b(19|20)\d{2}\b/)
  if (!yearMatch) return null

  const year = yearMatch[0]
  const rest = trimmed.replace(year, '').trim()
  const words = rest.split(/\s+/).filter(Boolean)

  if (words.length < 2) return null

  const make = words[0].toLowerCase()
  const model = words.slice(1).join(' ').toLowerCase().replace(/[^a-z0-9\s-]/g, '')

  return { year, make, model }
}

async function fetchNHTSAData(year, make, model) {
  const [recallsRes, complaintsRes, modelsRes] = await Promise.all([
    fetch(`${NHTSA_BASE}/recalls/recallsByVehicle?make=${make}&model=${model}&modelYear=${year}`),
    fetch(`${NHTSA_BASE}/complaints/complaintsByVehicle?make=${make}&model=${model}&modelYear=${year}`),
    fetch(`${NHTSA_BASE}/products/vehicle/models?modelYear=${year}&make=${make}`),
  ])

  const [recalls, complaints, models] = await Promise.all([
    recallsRes.json(),
    complaintsRes.json(),
    modelsRes.json(),
  ])

  return { recalls, complaints, models }
}

const SYSTEM_PROMPT = `You are Car Recall Radar, a car safety assistant. You receive raw federal data from NHTSA — the US government's vehicle safety agency — for a specific make, model, and year.

Summarize this data clearly for a regular person shopping for a used car. Be direct and honest. Do not sugarcoat serious issues. Do not over-alarm for minor ones.

Your response must include these four sections with these exact headers:

RECALLS
How many total. How many are open vs resolved. What systems are affected (engine, brakes, airbags, etc.). If zero, say so plainly.

COMPLAINTS
Total complaint volume. Top 2-3 complaint categories and what they describe. Flag anything that appears frequently.

INVESTIGATIONS
Any active NHTSA safety investigations. If none, say so.

VERDICT
2-3 sentences. Plain English. Should answer: is this a safe used car buy from a federal safety standpoint? Clean, mixed, or concerning — and why.

Write in short paragraphs. No bullet points. No jargon. No hedging.`

function inferSentiment(text) {
  const lower = text.toLowerCase()
  if (lower.includes('concerning') || lower.includes('significant concern') || lower.includes('avoid') || lower.includes('serious')) return 'red'
  if (lower.includes('clean') || lower.includes('solid') || lower.includes('no major') || lower.includes('good shape')) return 'green'
  return 'yellow'
}

function App() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [followUp, setFollowUp] = useState('')
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [vehicleInfo, setVehicleInfo] = useState(null)
  const conversationRef = useRef([])

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim() || loading) return

    setError('')
    setResult('')
    setShowFollowUp(false)
    setLoading(true)

    const parsed = parseVehicleInput(query)
    if (!parsed) {
      setError('Could not parse vehicle info. Please enter a year, make, and model (e.g. "2019 Honda CR-V").')
      setLoading(false)
      return
    }

    setVehicleInfo(parsed)
    setStatus('Scanning federal database...')

    let nhtsaData
    try {
      nhtsaData = await fetchNHTSAData(parsed.year, parsed.make, parsed.model)
    } catch {
      setError('Failed to reach NHTSA database. Please check your connection and try again.')
      setLoading(false)
      setStatus('')
      return
    }

    const recallCount = nhtsaData.recalls?.results?.length ?? nhtsaData.recalls?.count ?? 0
    const complaintCount = nhtsaData.complaints?.results?.length ?? nhtsaData.complaints?.count ?? 0

    if (recallCount === 0 && complaintCount === 0) {
      const modelList = nhtsaData.models?.results || []
      if (modelList.length === 0) {
        setError('No federal records found. Try checking your spelling or use the full model name.')
        setLoading(false)
        setStatus('')
        return
      }
    }

    setStatus('Generating safety brief...')

    const userMessage = `Here is the raw NHTSA data for a ${parsed.year} ${parsed.make} ${parsed.model}:\n\nRecalls:\n${JSON.stringify(nhtsaData.recalls, null, 2)}\n\nComplaints:\n${JSON.stringify(nhtsaData.complaints, null, 2)}\n\nModel validation:\n${JSON.stringify(nhtsaData.models, null, 2)}`

    conversationRef.current = [{ role: 'user', content: userMessage }]

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: conversationRef.current,
        }),
      })

      if (!response.ok) throw new Error('Claude API request failed')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setResult(fullText)
      }

      conversationRef.current.push({ role: 'assistant', content: fullText })
      setShowFollowUp(true)
    } catch {
      setError('Failed to generate safety brief. Please try again.')
    }

    setLoading(false)
    setStatus('')
  }

  async function handleFollowUp(e) {
    e.preventDefault()
    if (!followUp.trim() || loading) return

    setLoading(true)
    setStatus('Thinking...')

    conversationRef.current.push({ role: 'user', content: followUp })

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: conversationRef.current,
        }),
      })

      if (!response.ok) throw new Error('Claude API request failed')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setResult((prev) => prev + '\n\n---\n\n' + fullText)
      }

      conversationRef.current.push({ role: 'assistant', content: fullText })
    } catch {
      setError('Failed to get follow-up response. Please try again.')
    }

    setFollowUp('')
    setLoading(false)
    setStatus('')
  }

  const sentiment = result ? inferSentiment(result) : null
  const sentimentColor = {
    green: 'border-emerald-500',
    yellow: 'border-amber-500',
    red: 'border-red-500',
  }

  function renderResult(text) {
    const sections = []
    const sectionHeaders = ['RECALLS', 'COMPLAINTS', 'INVESTIGATIONS', 'VERDICT']
    let remaining = text

    for (let i = 0; i < sectionHeaders.length; i++) {
      const header = sectionHeaders[i]
      const nextHeader = sectionHeaders[i + 1]
      const headerIdx = remaining.indexOf(header)
      if (headerIdx === -1) continue

      const startIdx = headerIdx + header.length
      let endIdx = remaining.length
      if (nextHeader) {
        const nextIdx = remaining.indexOf(nextHeader, startIdx)
        if (nextIdx !== -1) endIdx = nextIdx
      }

      // Check for follow-up separator
      const separatorIdx = remaining.indexOf('---', startIdx)
      if (separatorIdx !== -1 && separatorIdx < endIdx) {
        endIdx = separatorIdx
      }

      const content = remaining.substring(startIdx, endIdx).trim()
      sections.push({ header, content })
    }

    // Extract follow-up content after separator
    const separatorIdx = text.indexOf('---')
    let followUpContent = null
    if (separatorIdx !== -1) {
      followUpContent = text.substring(separatorIdx + 3).trim()
    }

    if (sections.length === 0) {
      return <p className="text-gray-300 whitespace-pre-wrap">{text}</p>
    }

    return (
      <>
        {sections.map(({ header, content }) => (
          <div
            key={header}
            className={`mb-6 ${header === 'VERDICT' ? `pl-4 border-l-4 ${sentimentColor[sentiment] || 'border-gray-500'}` : ''}`}
          >
            <h3 className="font-mono text-sm tracking-widest text-gray-400 mb-2">{header}</h3>
            {header === 'VERDICT' ? (
              <p className="text-lg text-gray-100 whitespace-pre-wrap">{content}</p>
            ) : (
              <p className="text-gray-300 whitespace-pre-wrap">{content}</p>
            )}
          </div>
        ))}
        {followUpContent && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-gray-300 whitespace-pre-wrap">{followUpContent}</p>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="font-mono text-4xl font-bold tracking-tight text-white mb-2">
            Car Recall Radar
          </h1>
          <p className="text-gray-500 text-sm tracking-wide">
            Federal safety data, in plain English.
          </p>
        </header>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try: 2017 Ford F-150 or 2019 Honda CR-V"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gray-500 font-mono text-sm"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-600 text-gray-200 px-6 py-3 rounded-lg font-mono text-sm tracking-wide transition-colors"
            >
              SCAN
            </button>
          </div>
        </form>

        {/* Status */}
        {status && (
          <div className="text-center mb-6">
            <p className="text-gray-500 font-mono text-sm animate-pulse">{status}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            {vehicleInfo && (
              <div className="mb-6 pb-4 border-b border-gray-800">
                <span className="font-mono text-xs tracking-widest text-gray-500">SAFETY BRIEF</span>
                <h2 className="text-xl text-white font-mono mt-1">
                  {vehicleInfo.year} {vehicleInfo.make.toUpperCase()} {vehicleInfo.model.toUpperCase()}
                </h2>
              </div>
            )}
            {renderResult(result)}
          </div>
        )}

        {/* Follow-up */}
        {showFollowUp && (
          <form onSubmit={handleFollowUp} className="mb-8">
            <div className="flex gap-3">
              <input
                type="text"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="Ask a follow-up question about this vehicle..."
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gray-500 text-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !followUp.trim()}
                className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-600 text-gray-200 px-5 py-3 rounded-lg text-sm transition-colors"
              >
                Ask
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <footer className="text-center mt-16">
          <p className="text-gray-700 text-xs font-mono">
            Data sourced from NHTSA — National Highway Traffic Safety Administration
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
