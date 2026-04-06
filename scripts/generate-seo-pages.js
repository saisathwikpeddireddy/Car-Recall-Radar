// Generates static SEO pages for top searched vehicles.
// Each page at /check/2019-honda-cr-v/index.html contains:
// - Pre-fetched NHTSA recall + complaint counts
// - Full SEO meta tags, Open Graph, structured data
// - The React app bundle for full interactivity on load
//
// Run: node scripts/generate-seo-pages.js
// Output: dist/check/{slug}/index.html (run after vite build)

import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, '..', 'dist')
const NHTSA_BASE = 'https://api.nhtsa.gov'

// Top 100 most searched used cars — covers the long tail of "2019 honda cr-v recalls" queries
const VEHICLES = [
  // Honda
  { year: '2019', make: 'honda', model: 'cr-v' },
  { year: '2020', make: 'honda', model: 'cr-v' },
  { year: '2018', make: 'honda', model: 'cr-v' },
  { year: '2017', make: 'honda', model: 'cr-v' },
  { year: '2019', make: 'honda', model: 'civic' },
  { year: '2020', make: 'honda', model: 'civic' },
  { year: '2018', make: 'honda', model: 'accord' },
  { year: '2019', make: 'honda', model: 'accord' },
  { year: '2020', make: 'honda', model: 'pilot' },
  { year: '2019', make: 'honda', model: 'hr-v' },
  // Toyota
  { year: '2019', make: 'toyota', model: 'camry' },
  { year: '2020', make: 'toyota', model: 'camry' },
  { year: '2021', make: 'toyota', model: 'camry' },
  { year: '2019', make: 'toyota', model: 'rav4' },
  { year: '2020', make: 'toyota', model: 'rav4' },
  { year: '2018', make: 'toyota', model: 'rav4' },
  { year: '2019', make: 'toyota', model: 'corolla' },
  { year: '2020', make: 'toyota', model: 'corolla' },
  { year: '2018', make: 'toyota', model: 'highlander' },
  { year: '2020', make: 'toyota', model: 'tacoma' },
  { year: '2019', make: 'toyota', model: '4runner' },
  // Ford
  { year: '2017', make: 'ford', model: 'f-150' },
  { year: '2018', make: 'ford', model: 'f-150' },
  { year: '2019', make: 'ford', model: 'f-150' },
  { year: '2020', make: 'ford', model: 'f-150' },
  { year: '2021', make: 'ford', model: 'f-150' },
  { year: '2019', make: 'ford', model: 'escape' },
  { year: '2020', make: 'ford', model: 'explorer' },
  { year: '2019', make: 'ford', model: 'edge' },
  { year: '2021', make: 'ford', model: 'bronco' },
  // Chevrolet
  { year: '2019', make: 'chevrolet', model: 'silverado 1500' },
  { year: '2020', make: 'chevrolet', model: 'silverado 1500' },
  { year: '2019', make: 'chevrolet', model: 'equinox' },
  { year: '2020', make: 'chevrolet', model: 'equinox' },
  { year: '2019', make: 'chevrolet', model: 'malibu' },
  { year: '2018', make: 'chevrolet', model: 'traverse' },
  // Jeep
  { year: '2020', make: 'jeep', model: 'wrangler' },
  { year: '2019', make: 'jeep', model: 'wrangler' },
  { year: '2018', make: 'jeep', model: 'wrangler' },
  { year: '2019', make: 'jeep', model: 'grand cherokee' },
  { year: '2020', make: 'jeep', model: 'grand cherokee' },
  { year: '2019', make: 'jeep', model: 'cherokee' },
  // Hyundai
  { year: '2019', make: 'hyundai', model: 'tucson' },
  { year: '2020', make: 'hyundai', model: 'tucson' },
  { year: '2019', make: 'hyundai', model: 'santa fe' },
  { year: '2020', make: 'hyundai', model: 'elantra' },
  { year: '2019', make: 'hyundai', model: 'sonata' },
  { year: '2020', make: 'hyundai', model: 'kona' },
  // Kia
  { year: '2019', make: 'kia', model: 'soul' },
  { year: '2020', make: 'kia', model: 'soul' },
  { year: '2019', make: 'kia', model: 'sportage' },
  { year: '2020', make: 'kia', model: 'forte' },
  { year: '2019', make: 'kia', model: 'sorento' },
  { year: '2020', make: 'kia', model: 'telluride' },
  // Nissan
  { year: '2019', make: 'nissan', model: 'altima' },
  { year: '2020', make: 'nissan', model: 'altima' },
  { year: '2019', make: 'nissan', model: 'rogue' },
  { year: '2020', make: 'nissan', model: 'rogue' },
  { year: '2019', make: 'nissan', model: 'sentra' },
  { year: '2018', make: 'nissan', model: 'pathfinder' },
  // Subaru
  { year: '2019', make: 'subaru', model: 'outback' },
  { year: '2020', make: 'subaru', model: 'outback' },
  { year: '2019', make: 'subaru', model: 'forester' },
  { year: '2020', make: 'subaru', model: 'crosstrek' },
  // Tesla
  { year: '2018', make: 'tesla', model: 'model 3' },
  { year: '2019', make: 'tesla', model: 'model 3' },
  { year: '2020', make: 'tesla', model: 'model 3' },
  { year: '2020', make: 'tesla', model: 'model y' },
  { year: '2021', make: 'tesla', model: 'model y' },
  // Ram
  { year: '2019', make: 'ram', model: '1500' },
  { year: '2020', make: 'ram', model: '1500' },
  // Mazda
  { year: '2019', make: 'mazda', model: 'cx-5' },
  { year: '2020', make: 'mazda', model: 'cx-5' },
  { year: '2019', make: 'mazda', model: 'mazda3' },
  // Volkswagen
  { year: '2019', make: 'volkswagen', model: 'jetta' },
  { year: '2019', make: 'volkswagen', model: 'tiguan' },
  // BMW
  { year: '2019', make: 'bmw', model: '3 series' },
  { year: '2018', make: 'bmw', model: 'x3' },
  // Mercedes
  { year: '2019', make: 'mercedes-benz', model: 'c-class' },
  { year: '2019', make: 'mercedes-benz', model: 'glc' },
  // Dodge
  { year: '2019', make: 'dodge', model: 'charger' },
  { year: '2019', make: 'dodge', model: 'challenger' },
  // GMC
  { year: '2019', make: 'gmc', model: 'sierra 1500' },
  { year: '2020', make: 'gmc', model: 'terrain' },
  // Lexus
  { year: '2019', make: 'lexus', model: 'rx 350' },
  { year: '2020', make: 'lexus', model: 'nx' },
  // Buick
  { year: '2019', make: 'buick', model: 'encore' },
  // Acura
  { year: '2019', make: 'acura', model: 'rdx' },
  // Audi
  { year: '2019', make: 'audi', model: 'q5' },
  // Volvo
  { year: '2020', make: 'volvo', model: 'xc60' },
  // Popular older models people search for
  { year: '2016', make: 'honda', model: 'cr-v' },
  { year: '2015', make: 'toyota', model: 'camry' },
  { year: '2016', make: 'ford', model: 'f-150' },
  { year: '2017', make: 'jeep', model: 'grand cherokee' },
  { year: '2016', make: 'chevrolet', model: 'silverado 1500' },
  { year: '2017', make: 'hyundai', model: 'tucson' },
  { year: '2017', make: 'nissan', model: 'rogue' },
  { year: '2016', make: 'subaru', model: 'outback' },
]

function slug(v) {
  return `${v.year}-${v.make}-${v.model.replace(/\s+/g, '-')}`
}

function titleCase(s) {
  return s.replace(/\b\w/g, c => c.toUpperCase())
}

async function fetchCounts(year, make, model) {
  try {
    const [recallsRes, complaintsRes] = await Promise.all([
      fetch(`${NHTSA_BASE}/recalls/recallsByVehicle?make=${make}&model=${model}&modelYear=${year}`),
      fetch(`${NHTSA_BASE}/complaints/complaintsByVehicle?make=${make}&model=${model}&modelYear=${year}`),
    ])
    const [recalls, complaints] = await Promise.all([recallsRes.json(), complaintsRes.json()])
    return {
      recalls: recalls?.Count ?? recalls?.results?.length ?? 0,
      complaints: complaints?.count ?? complaints?.results?.length ?? 0,
    }
  } catch {
    return { recalls: 0, complaints: 0 }
  }
}

function generateHTML(vehicle, counts, templateHTML) {
  const { year, make, model } = vehicle
  const displayName = `${year} ${titleCase(make)} ${titleCase(model)}`
  const s = slug(vehicle)
  const url = `https://car-recall-radar.vercel.app/check/${s}`

  const title = `${displayName} Recalls & Safety — Car Recall Checker`
  const description = `${displayName}: ${counts.recalls} recalls, ${counts.complaints} complaints on file with NHTSA. Get a free plain-English safety verdict before you buy.`

  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url,
    mainEntity: {
      '@type': 'Vehicle',
      name: displayName,
      manufacturer: titleCase(make),
      model: titleCase(model),
      vehicleModelDate: year,
    },
  })

  // Inject SEO meta into the template
  let html = templateHTML
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${description}" />`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${description}" />`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${title}" />`)
    .replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${description}" />`)

  // Add vehicle-specific structured data before closing </head>
  html = html.replace(
    '</head>',
    `<script type="application/ld+json">${structuredData}</script>\n</head>`
  )

  // Add static SEO content before the React root — visible to crawlers, hidden once React loads
  const seoContent = `
    <div id="seo-content" style="max-width:672px;margin:0 auto;padding:40px 16px;font-family:system-ui,sans-serif;color:#d1d5db;background:#030712;">
      <h1 style="font-family:monospace;font-size:2rem;color:#fff;margin-bottom:8px;">${displayName} Safety Report</h1>
      <p style="color:#9ca3af;margin-bottom:24px;">Free NHTSA recall and complaint lookup — Car Recall Checker</p>
      <div style="display:flex;gap:16px;margin-bottom:24px;">
        <div style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:16px;text-align:center;flex:1;">
          <div style="font-family:monospace;font-size:1.5rem;font-weight:bold;color:#fff;">${counts.recalls}</div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-top:4px;">Recalls</div>
        </div>
        <div style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:16px;text-align:center;flex:1;">
          <div style="font-family:monospace;font-size:1.5rem;font-weight:bold;color:#fff;">${counts.complaints}</div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-top:4px;">Complaints</div>
        </div>
      </div>
      <p style="color:#d1d5db;line-height:1.6;margin-bottom:16px;">
        The ${displayName} has ${counts.recalls} recall${counts.recalls !== 1 ? 's' : ''} and ${counts.complaints} consumer complaint${counts.complaints !== 1 ? 's' : ''} filed with the National Highway Traffic Safety Administration (NHTSA).
        ${counts.recalls > 5 ? 'This is a higher-than-average recall count — check which ones have been completed.' : ''}
        ${counts.complaints > 100 ? 'The complaint volume is significant — review the details before purchasing.' : ''}
      </p>
      <p style="color:#9ca3af;font-size:14px;">Loading full safety brief...</p>
    </div>`

  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${seoContent}</div>`
  )

  return html
}

async function main() {
  const templateHTML = readFileSync(join(DIST, 'index.html'), 'utf-8')

  console.log(`Generating SEO pages for ${VEHICLES.length} vehicles...`)

  // Process in batches of 10 to avoid overwhelming NHTSA
  const BATCH_SIZE = 10
  let generated = 0

  for (let i = 0; i < VEHICLES.length; i += BATCH_SIZE) {
    const batch = VEHICLES.slice(i, i + BATCH_SIZE)

    const results = await Promise.all(
      batch.map(async (v) => {
        const counts = await fetchCounts(v.year, v.make, v.model)
        return { vehicle: v, counts }
      })
    )

    for (const { vehicle, counts } of results) {
      const s = slug(vehicle)
      const dir = join(DIST, 'check', s)
      mkdirSync(dir, { recursive: true })
      const html = generateHTML(vehicle, counts, templateHTML)
      writeFileSync(join(dir, 'index.html'), html)
      generated++
      console.log(`  [${generated}/${VEHICLES.length}] /check/${s} — ${counts.recalls}R ${counts.complaints}C`)
    }

    // Small delay between batches
    if (i + BATCH_SIZE < VEHICLES.length) {
      await new Promise(r => setTimeout(r, 200))
    }
  }

  // Generate a sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://car-recall-radar.vercel.app</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
${VEHICLES.map(v => `  <url><loc>https://car-recall-radar.vercel.app/check/${slug(v)}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`).join('\n')}
</urlset>`

  writeFileSync(join(DIST, 'sitemap.xml'), sitemap)
  console.log(`\nGenerated ${generated} SEO pages + sitemap.xml`)
}

main().catch(console.error)
