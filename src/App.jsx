import { useState, useRef, useEffect } from 'react'

const NHTSA_BASE = 'https://api.nhtsa.gov'

const SUGGESTIONS = [
  { label: '2019 Honda CR-V', year: '2019', make: 'honda', model: 'cr-v' },
  { label: '2017 Ford F-150', year: '2017', make: 'ford', model: 'f-150' },
  { label: '2020 Jeep Wrangler', year: '2020', make: 'jeep', model: 'wrangler' },
  { label: '2019 Kia Soul', year: '2019', make: 'kia', model: 'soul' },
  { label: '2021 Toyota Camry', year: '2021', make: 'toyota', model: 'camry' },
  { label: '2018 Tesla Model 3', year: '2018', make: 'tesla', model: 'model 3' },
]

const COMPETITORS = {
  honda: { 'cr-v': [{ make: 'toyota', model: 'rav4' }, { make: 'mazda', model: 'cx-5' }] },
  toyota: { camry: [{ make: 'honda', model: 'accord' }, { make: 'nissan', model: 'altima' }], rav4: [{ make: 'honda', model: 'cr-v' }, { make: 'mazda', model: 'cx-5' }] },
  ford: { 'f-150': [{ make: 'chevrolet', model: 'silverado 1500' }, { make: 'ram', model: '1500' }] },
  jeep: { wrangler: [{ make: 'ford', model: 'bronco' }, { make: 'toyota', model: '4runner' }] },
  kia: { soul: [{ make: 'honda', model: 'hr-v' }, { make: 'hyundai', model: 'kona' }] },
  tesla: { 'model 3': [{ make: 'chevrolet', model: 'bolt ev' }, { make: 'nissan', model: 'leaf' }] },
  chevrolet: { 'silverado 1500': [{ make: 'ford', model: 'f-150' }, { make: 'ram', model: '1500' }] },
  nissan: { altima: [{ make: 'toyota', model: 'camry' }, { make: 'honda', model: 'accord' }] },
  hyundai: { tucson: [{ make: 'toyota', model: 'rav4' }, { make: 'honda', model: 'cr-v' }] },
}

async function fetchBenchmark(year, make, model) {
  const comps = COMPETITORS[make]?.[model]
  if (!comps) return null

  const results = await Promise.all(
    comps.map(async (c) => {
      try {
        const [recallsRes, complaintsRes] = await Promise.all([
          fetch(`${NHTSA_BASE}/recalls/recallsByVehicle?make=${c.make}&model=${c.model}&modelYear=${year}`),
          fetch(`${NHTSA_BASE}/complaints/complaintsByVehicle?make=${c.make}&model=${c.model}&modelYear=${year}`),
        ])
        const [recalls, complaints] = await Promise.all([recallsRes.json(), complaintsRes.json()])
        return {
          make: c.make,
          model: c.model,
          recalls: recalls?.Count ?? recalls?.results?.length ?? 0,
          complaints: complaints?.count ?? complaints?.results?.length ?? 0,
        }
      } catch {
        return null
      }
    })
  )

  return results.filter(Boolean)
}

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

function getCarImageUrl(make, model, year) {
  const cleanModel = model.replace(/\s+/g, '-')
  return `https://cdn.imagin.studio/getimage?customer=hrjavascript-mastery&make=${make}&modelFamily=${cleanModel}&modelYear=${year}&angle=9`
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

function summarizeNHTSAData(nhtsaData) {
  const recalls = nhtsaData.recalls?.results || []
  const recallSummary = recalls.map((r) => ({
    campaign: r.NHTSACampaignNumber,
    component: r.Component,
    summary: r.Summary,
    consequence: r.Consequence,
    remedy: r.Remedy,
    date: r.ReportReceivedDate,
  }))

  const complaints = nhtsaData.complaints?.results || []
  const complaintCount = nhtsaData.complaints?.count || complaints.length
  const componentCounts = {}
  let crashes = 0
  let fires = 0
  let injuries = 0
  let deaths = 0

  complaints.forEach((c) => {
    const comp = c.components || 'UNKNOWN'
    componentCounts[comp] = (componentCounts[comp] || 0) + 1
    if (c.crash) crashes++
    if (c.fire) fires++
    injuries += c.numberOfInjuries || 0
    deaths += c.numberOfDeaths || 0
  })

  const topComponents = Object.entries(componentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([component, count]) => ({ component, count }))

  const sampleComplaints = complaints.slice(0, 5).map((c) => ({
    component: c.components,
    summary: c.summary?.substring(0, 300),
    date: c.dateComplaintFiled,
    crash: c.crash,
    fire: c.fire,
  }))

  const yearlyComplaints = {}
  complaints.forEach((c) => {
    const yr = c.dateComplaintFiled?.split('/')[2]
    if (yr) yearlyComplaints[yr] = (yearlyComplaints[yr] || 0) + 1
  })

  return {
    recalls: { total: recalls.length, details: recallSummary },
    complaints: {
      total: complaintCount,
      crashes,
      fires,
      injuries,
      deaths,
      topComponents,
      sampleComplaints,
      yearlyTrend: yearlyComplaints,
    },
    modelValidation: {
      modelsFound: (nhtsaData.models?.results || []).map((m) => m.vehicleModel),
    },
  }
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

NEXT STEPS
3-4 specific, actionable things the buyer should do before purchasing this vehicle. Tailor these to the actual recalls and complaints found. Examples: "Ask the dealer for recall completion records for campaigns X and Y", "Have a mechanic inspect the fuel system", "Check NHTSA.gov/recalls with the VIN". Be concrete, not generic.

Write in short paragraphs. No bullet points. No jargon. No hedging.

IMPORTANT: You ONLY discuss vehicle safety, recalls, complaints, NHTSA data, and car buying from a safety perspective. If the user asks about anything unrelated to vehicle safety or car purchasing, politely redirect them back to the vehicle safety topic.`

const FOLLOW_UP_SYSTEM_PROMPT = `You are Car Recall Radar, answering a follow-up question about a vehicle's safety record. You have the full NHTSA data context from earlier in the conversation.

Rules:
- Keep your answer to ONE short paragraph (3-5 sentences max).
- Be specific and direct.
- Only discuss vehicle safety, recalls, complaints, and car buying from a safety perspective.
- If the user asks about anything unrelated (politics, weather, coding, etc.), respond with: "I can only help with vehicle safety questions. Try asking about this vehicle's recalls, complaints, or what to check before buying."
- No bullet points. No headers. No lists.`

function inferSentiment(text) {
  const lower = text.toLowerCase()
  if (lower.includes('concerning') || lower.includes('significant concern') || lower.includes('avoid') || lower.includes('serious')) return 'red'
  if (lower.includes('clean') || lower.includes('solid') || lower.includes('no major') || lower.includes('good shape')) return 'green'
  return 'yellow'
}

function ComplaintChart({ topComponents }) {
  if (!topComponents || topComponents.length === 0) return null
  const max = topComponents[0].count
  const top5 = topComponents.slice(0, 5)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
      <h3 className="font-mono text-xs tracking-widest text-gray-500 mb-4">COMPLAINT BREAKDOWN</h3>
      <div className="space-y-3">
        {top5.map(({ component, count }) => {
          const pct = Math.round((count / max) * 100)
          const label = component.length > 35 ? component.substring(0, 35) + '...' : component
          return (
            <div key={component}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400 truncate mr-2">{label}</span>
                <span className="text-gray-500 font-mono shrink-0">{count}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500/60 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatsBar({ complaints }) {
  if (!complaints) return null
  const stats = [
    { label: 'Complaints', value: complaints.total, color: 'text-gray-100' },
    { label: 'Crashes', value: complaints.crashes, color: complaints.crashes > 0 ? 'text-red-400' : 'text-gray-400' },
    { label: 'Fires', value: complaints.fires, color: complaints.fires > 0 ? 'text-orange-400' : 'text-gray-400' },
    { label: 'Injuries', value: complaints.injuries, color: complaints.injuries > 0 ? 'text-amber-400' : 'text-gray-400' },
    { label: 'Deaths', value: complaints.deaths, color: complaints.deaths > 0 ? 'text-red-500' : 'text-gray-400' },
  ]

  return (
    <div className="grid grid-cols-5 gap-2 mb-6">
      {stats.map(({ label, value, color }) => (
        <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
          <div className={`font-mono text-lg font-bold ${color}`}>{value}</div>
          <div className="text-gray-500 text-xs mt-1">{label}</div>
        </div>
      ))}
    </div>
  )
}

function renderSections(text, sentimentColor, sentiment) {
  const sections = []
  const sectionHeaders = ['RECALLS', 'COMPLAINTS', 'INVESTIGATIONS', 'VERDICT', 'NEXT STEPS']
  const remaining = text

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

    const content = remaining.substring(startIdx, endIdx).trim().replace(/\*\*/g, '')
    sections.push({ header, content })
  }

  if (sections.length === 0) {
    return <p className="text-gray-300 whitespace-pre-wrap">{text}</p>
  }

  return sections.map(({ header, content }) => {
    const isVerdict = header === 'VERDICT'
    const isNextSteps = header === 'NEXT STEPS'
    let className = 'mb-6'
    if (isVerdict) className += ` pl-4 border-l-4 ${sentimentColor[sentiment] || 'border-gray-500'}`
    if (isNextSteps) className += ' pl-4 border-l-4 border-blue-500/60 bg-blue-950/20 rounded-r-lg p-4'

    return (
      <div key={header} className={className}>
        <h3 className="font-mono text-sm tracking-widest text-gray-400 mb-2">{header}</h3>
        {isVerdict ? (
          <p className="text-lg text-gray-100 whitespace-pre-wrap">{content}</p>
        ) : (
          <p className="text-gray-300 whitespace-pre-wrap">{content}</p>
        )}
      </div>
    )
  })
}

function BenchmarkBar({ vehicleInfo, nhtsaSummary, benchmarks }) {
  if (!benchmarks || benchmarks.length === 0 || !nhtsaSummary) return null

  const all = [
    { make: vehicleInfo.make, model: vehicleInfo.model, recalls: nhtsaSummary.recalls.total, complaints: nhtsaSummary.complaints.total, current: true },
    ...benchmarks.map((b) => ({ ...b, current: false })),
  ]

  const maxComplaints = Math.max(...all.map((v) => v.complaints), 1)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
      <h3 className="font-mono text-xs tracking-widest text-gray-500 mb-4">VS COMPETITORS ({vehicleInfo.year})</h3>
      <div className="space-y-3">
        {all.map((v) => {
          const pct = Math.round((v.complaints / maxComplaints) * 100)
          return (
            <div key={`${v.make}-${v.model}`}>
              <div className="flex justify-between text-xs mb-1">
                <span className={`truncate mr-2 ${v.current ? 'text-white font-bold' : 'text-gray-400'}`}>
                  {v.make.toUpperCase()} {v.model.toUpperCase()}
                </span>
                <span className="text-gray-500 font-mono shrink-0">{v.recalls}R / {v.complaints}C</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${v.current ? 'bg-amber-500/70' : 'bg-gray-600/50'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-gray-600 text-xs mt-3 font-mono">R = recalls, C = complaints</p>
    </div>
  )
}

function AdUnit({ slot, format = 'auto', className = '' }) {
  const adRef = useRef(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (adRef.current && !pushed.current) {
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        pushed.current = true
      } catch {
        // AdSense not loaded or blocked
      }
    }
  }, [])

  return (
    <div className={`ad-container my-4 text-center ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-1372753112558797"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        ref={adRef}
      />
    </div>
  )
}

function App() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [mainResult, setMainResult] = useState('')
  const [followUpThread, setFollowUpThread] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [followUp, setFollowUp] = useState('')
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [vehicleInfo, setVehicleInfo] = useState(null)
  const [nhtsaSummary, setNhtsaSummary] = useState(null)
  const [imageError, setImageError] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const [activeView, setActiveView] = useState('home')
  const [benchmarks, setBenchmarks] = useState(null)
  const [contextualSuggestions, setContextualSuggestions] = useState([])
  const conversationRef = useRef([])

  async function streamClaude(messages, onChunk, { system, maxTokens } = {}) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: system || SYSTEM_PROMPT, messages, max_tokens: maxTokens }),
    })

    if (!response.ok) throw new Error('Claude API request failed')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      fullText += decoder.decode(value, { stream: true })
      onChunk(fullText)
    }
    return fullText
  }

  async function runSearch(parsed) {
    setError('')
    setMainResult('')
    setFollowUpThread([])
    setShowFollowUp(false)
    setNhtsaSummary(null)
    setBenchmarks(null)
    setContextualSuggestions([])
    setImageError(false)
    setLoading(true)
    setVehicleInfo(parsed)
    setActiveView('results')
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

    const recallCount = nhtsaData.recalls?.results?.length ?? nhtsaData.recalls?.Count ?? 0
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

    const summary = summarizeNHTSAData(nhtsaData)
    setNhtsaSummary(summary)
    setStatus('Generating safety brief...')

    const userMessage = `Here is the NHTSA federal safety data for a ${parsed.year} ${parsed.make} ${parsed.model}:\n\n${JSON.stringify(summary, null, 2)}`
    conversationRef.current = [{ role: 'user', content: userMessage }]

    try {
      const fullText = await streamClaude(conversationRef.current, (text) => setMainResult(text))
      conversationRef.current.push({ role: 'assistant', content: fullText })
      setShowFollowUp(true)

      const searchKey = `${parsed.year} ${parsed.make} ${parsed.model}`
      setSearchHistory((prev) => {
        const exists = prev.find((s) => s.key === searchKey)
        if (exists) return prev
        return [
          { key: searchKey, parsed, summary, result: fullText, conversation: [...conversationRef.current] },
          ...prev,
        ].slice(0, 10)
      })

      // Fetch benchmarks and contextual suggestions in parallel (non-blocking)
      fetchBenchmark(parsed.year, parsed.make, parsed.model).then((b) => setBenchmarks(b)).catch(() => {})
      fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle: `${parsed.year} ${parsed.make} ${parsed.model}`, verdict: fullText.substring(fullText.indexOf('VERDICT'), fullText.length).substring(0, 300) }),
      })
        .then((r) => r.json())
        .then((suggestions) => { if (Array.isArray(suggestions)) setContextualSuggestions(suggestions.slice(0, 4)) })
        .catch(() => {})
    } catch {
      setError('Failed to generate safety brief. Please try again.')
    }

    setLoading(false)
    setStatus('')
  }

  function handleSearch(e) {
    e.preventDefault()
    if (!query.trim() || loading) return

    const parsed = parseVehicleInput(query)
    if (!parsed) {
      setError('Please include a year, make, and model (e.g. "2019 Honda CR-V"). NHTSA requires a specific model year.')
      return
    }
    runSearch(parsed)
  }

  function handleSuggestion(s) {
    if (loading) return
    setQuery(s.label)
    runSearch({ year: s.year, make: s.make, model: s.model })
  }

  function loadFromHistory(entry) {
    setVehicleInfo(entry.parsed)
    setNhtsaSummary(entry.summary)
    setMainResult(entry.result)
    setFollowUpThread([])
    setShowFollowUp(true)
    setError('')
    setImageError(false)
    setBenchmarks(null)
    setContextualSuggestions([])
    setActiveView('results')
    conversationRef.current = [...entry.conversation]
    setQuery(`${entry.parsed.year} ${entry.parsed.make} ${entry.parsed.model}`)
  }

  function goHome() {
    setActiveView('home')
    setMainResult('')
    setFollowUpThread([])
    setShowFollowUp(false)
    setVehicleInfo(null)
    setNhtsaSummary(null)
    setError('')
    setStatus('')
    setImageError(false)
    setQuery('')
    setBenchmarks(null)
    setContextualSuggestions([])
  }

  async function submitFollowUp(question) {
    if (!question.trim() || loading) return

    setLoading(true)
    setStatus('Thinking...')
    setFollowUp('')

    conversationRef.current.push({ role: 'user', content: question })

    const threadIdx = followUpThread.length
    setFollowUpThread((prev) => [...prev, { question, answer: '' }])

    try {
      const fullText = await streamClaude(conversationRef.current, (text) => {
        const cleaned = text.replace(/\*\*/g, '')
        setFollowUpThread((prev) => {
          const updated = [...prev]
          updated[threadIdx] = { question, answer: cleaned }
          return updated
        })
      }, { system: FOLLOW_UP_SYSTEM_PROMPT, maxTokens: 300 })
      conversationRef.current.push({ role: 'assistant', content: fullText })

      const searchKey = vehicleInfo ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}` : null
      if (searchKey) {
        setSearchHistory((prev) =>
          prev.map((s) =>
            s.key === searchKey ? { ...s, conversation: [...conversationRef.current] } : s
          )
        )
      }
    } catch {
      setFollowUpThread((prev) => {
        const updated = [...prev]
        updated[threadIdx] = { question, answer: 'Failed to get response. Please try again.' }
        return updated
      })
    }

    setLoading(false)
    setStatus('')
  }

  function handleFollowUp(e) {
    e.preventDefault()
    submitFollowUp(followUp)
  }

  const sentiment = mainResult ? inferSentiment(mainResult) : null
  const sentimentColor = {
    green: 'border-emerald-500',
    yellow: 'border-amber-500',
    red: 'border-red-500',
  }

  const isHome = activeView === 'home'

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <header className="mb-8 text-center">
          <button onClick={goHome} className="inline-block">
            <h1 className="font-mono text-4xl font-bold tracking-tight text-white mb-2 hover:text-gray-300 transition-colors">
              Car Recall Radar
            </h1>
          </button>
          <p className="text-gray-500 text-sm tracking-wide">
            Federal safety data, in plain English.
          </p>
        </header>

        <form onSubmit={handleSearch} className="mb-4">
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

        {/* Home: suggestions + history */}
        {isHome && !loading && (
          <>
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSuggestion(s)}
                  className="text-xs text-gray-500 hover:text-gray-300 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-full px-3 py-1.5 transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>

            <AdUnit slot="1234567890" format="horizontal" className="mt-4" />

            {searchHistory.length > 0 && (
              <div className="mb-8">
                <h3 className="font-mono text-xs tracking-widest text-gray-500 mb-3 text-center">RECENT SEARCHES</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {searchHistory.map((entry) => (
                    <button
                      key={entry.key}
                      onClick={() => loadFromHistory(entry)}
                      className="text-xs text-gray-400 hover:text-gray-200 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-600 rounded-lg px-3 py-2 transition-colors font-mono"
                    >
                      {entry.parsed.year} {entry.parsed.make.toUpperCase()} {entry.parsed.model.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {status && (
          <div className="text-center mb-6">
            <p className="text-gray-500 font-mono text-sm animate-pulse">{status}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {vehicleInfo && activeView === 'results' && (mainResult || loading) && (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-4 flex items-center gap-5">
              {!imageError && (
                <img
                  src={getCarImageUrl(vehicleInfo.make, vehicleInfo.model, vehicleInfo.year)}
                  alt={`${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`}
                  className="w-48 h-28 object-contain shrink-0"
                  onError={() => setImageError(true)}
                />
              )}
              <div>
                <span className="font-mono text-xs tracking-widest text-gray-500">SAFETY BRIEF</span>
                <h2 className="text-2xl text-white font-mono mt-1">
                  {vehicleInfo.year} {vehicleInfo.make.toUpperCase()} {vehicleInfo.model.toUpperCase()}
                </h2>
                {nhtsaSummary && (
                  <p className="text-gray-500 text-xs mt-2 font-mono">
                    {nhtsaSummary.recalls.total} recalls &middot; {nhtsaSummary.complaints.total} complaints
                  </p>
                )}
              </div>
            </div>

            {nhtsaSummary && <StatsBar complaints={nhtsaSummary.complaints} />}
            {nhtsaSummary && <ComplaintChart topComponents={nhtsaSummary.complaints.topComponents} />}
            {vehicleInfo && nhtsaSummary && <BenchmarkBar vehicleInfo={vehicleInfo} nhtsaSummary={nhtsaSummary} benchmarks={benchmarks} />}
          </>
        )}

        {mainResult && activeView === 'results' && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            {renderSections(mainResult, sentimentColor, sentiment)}
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-800">
              <button
                onClick={() => window.print()}
                className="text-xs text-gray-500 hover:text-gray-300 font-mono tracking-wide transition-colors"
              >
                PRINT REPORT
              </button>
            </div>
          </div>
        )}

        {mainResult && activeView === 'results' && <AdUnit slot="0987654321" format="horizontal" />}

        {followUpThread.length > 0 && activeView === 'results' && (
          <div className="space-y-4 mb-6">
            {followUpThread.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-start gap-3 mb-2">
                  <span className="font-mono text-xs text-gray-500 bg-gray-800 rounded px-2 py-1 shrink-0 mt-0.5">Q</span>
                  <p className="text-gray-300 text-sm">{item.question}</p>
                </div>
                {item.answer && (
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 ml-8">
                    <p className="text-gray-300 whitespace-pre-wrap text-sm">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showFollowUp && activeView === 'results' && (
          <>
            {contextualSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 justify-center">
                {contextualSuggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => submitFollowUp(q)}
                    disabled={loading}
                    className="text-xs text-gray-500 hover:text-gray-300 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-full px-3 py-1.5 transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
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
          </>
        )}

        <footer className="text-center mt-16 space-y-2">
          <p className="text-gray-700 text-xs font-mono">
            Data sourced from NHTSA — National Highway Traffic Safety Administration
          </p>
          <p className="text-gray-800 text-xs">
            Free car recall lookup &middot; Used car safety check &middot; Vehicle complaint search
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
