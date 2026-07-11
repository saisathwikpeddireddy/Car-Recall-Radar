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

  // Add static SEO content before the React root — a full, unique, standalone
  // report so crawlers and AdSense reviewers see substantial content without JS.
  const r = counts.recalls
  const c = counts.complaints

  const recallReading = r === 0
    ? `No recalls are currently on file for the ${displayName}. That is a clean record, though you should still confirm by VIN, since records can update over time.`
    : r <= 3
      ? `${r} recall${r !== 1 ? 's are' : ' is'} on file — a typical, manageable number for a mainstream vehicle. Recalls are manufacturer-initiated repairs done for free, so having them addressed is a good thing. Confirm each one was completed on the specific car by VIN.`
      : r <= 8
        ? `${r} recalls are on file, which is on the higher side but common for popular, high-volume models. A high count alone does not make a car unsafe — what matters is whether the serious ones (brakes, airbags, steering, fire risk) have been repaired.`
        : `${r} recalls are on file — a high count. This is often seen on best-selling vehicles simply because so many were produced. Focus on whether any safety-critical recalls remain open, and get VIN-specific repair records before buying.`

  const complaintReading = c === 0
    ? `No consumer complaints are recorded, which is unusual and generally positive.`
    : c < 50
      ? `${c} consumer complaint${c !== 1 ? 's have' : ' has'} been filed. That is a low volume — complaints are unverified owner reports, so look for patterns rather than reacting to any single entry.`
      : c < 300
        ? `${c} consumer complaints have been filed. Remember that popular vehicles naturally accumulate more complaints because far more were sold — compare against similar models rather than in isolation.`
        : `${c} consumer complaints have been filed. High volume is expected for a top-selling model, but it is worth scanning which components appear most often and whether crashes or fires are mentioned.`

  const seoContent = `
    <div id="seo-content" style="max-width:720px;margin:0 auto;padding:32px 20px 48px;font-family:system-ui,-apple-system,sans-serif;color:#cbd5e1;background:#030712;line-height:1.7;">
      <nav style="display:flex;gap:18px;flex-wrap:wrap;align-items:center;padding-bottom:20px;border-bottom:1px solid #1f2937;margin-bottom:28px;font-size:13px;">
        <a href="/" style="font-family:ui-monospace,monospace;font-weight:700;color:#fff;text-decoration:none;margin-right:auto;">Car Recall Checker</a>
        <a href="/" style="color:#9ca3af;text-decoration:none;">Recall Checker</a>
        <a href="/guides/" style="color:#9ca3af;text-decoration:none;">Guides</a>
        <a href="/about/" style="color:#9ca3af;text-decoration:none;">About</a>
      </nav>
      <h1 style="font-family:ui-monospace,monospace;font-size:1.9rem;line-height:1.25;color:#fff;margin:0 0 8px;">${displayName} Recalls &amp; Safety Report</h1>
      <p style="color:#9ca3af;margin:0 0 24px;font-size:15px;">Free NHTSA recall, complaint, and investigation lookup — updated from federal data.</p>
      <div style="display:flex;gap:16px;margin-bottom:28px;">
        <div style="background:#0b1220;border:1px solid #1f2937;border-radius:12px;padding:16px;text-align:center;flex:1;">
          <div style="font-family:ui-monospace,monospace;font-size:1.6rem;font-weight:bold;color:#fff;">${r}</div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-top:4px;">Recalls</div>
        </div>
        <div style="background:#0b1220;border:1px solid #1f2937;border-radius:12px;padding:16px;text-align:center;flex:1;">
          <div style="font-family:ui-monospace,monospace;font-size:1.6rem;font-weight:bold;color:#fff;">${c}</div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-top:4px;">Complaints</div>
        </div>
      </div>

      <h2 style="color:#fff;font-size:1.2rem;margin:28px 0 8px;">Recall summary</h2>
      <p style="margin:0 0 16px;">The ${displayName} has <strong>${r} recall${r !== 1 ? 's' : ''}</strong> on record with the National Highway Traffic Safety Administration (NHTSA). ${recallReading}</p>

      <h2 style="color:#fff;font-size:1.2rem;margin:28px 0 8px;">Complaint summary</h2>
      <p style="margin:0 0 16px;">Owners have filed <strong>${c} complaint${c !== 1 ? 's' : ''}</strong> about the ${displayName}. ${complaintReading} Complaints can flag crashes, fires, and injuries, so it is worth reviewing which systems appear most often.</p>

      <h2 style="color:#fff;font-size:1.2rem;margin:28px 0 8px;">Before you buy a ${displayName}</h2>
      <ul style="padding-left:22px;margin:0 0 16px;">
        <li style="margin:6px 0;">Get the 17-character VIN and confirm whether any recall is still <em>open</em> (unrepaired) on that specific car.</li>
        <li style="margin:6px 0;">Ask the seller for recall completion records, especially for any brake, airbag, steering, or fire-related campaign.</li>
        <li style="margin:6px 0;">Have an independent mechanic inspect the systems that appear most in the complaint history.</li>
        <li style="margin:6px 0;">Remember: any franchised dealer will complete outstanding recall repairs for free, even for a used-car buyer.</li>
      </ul>

      <div style="background:#0b1220;border:1px solid #1f2937;border-radius:12px;padding:18px 20px;margin:24px 0;">
        <p style="margin:0;">Want the full breakdown — complaint categories, crash and fire counts, active investigations, and a plain-English verdict comparing this car to its competitors? The interactive report loads below.</p>
      </div>

      <h2 style="color:#fff;font-size:1.2rem;margin:28px 0 8px;">Frequently asked questions</h2>
      <h3 style="color:#e5e7eb;font-size:1rem;margin:18px 0 4px;">Is the ${displayName} safe to buy used?</h3>
      <p style="margin:0 0 14px;">With ${r} recall${r !== 1 ? 's' : ''} and ${c} complaint${c !== 1 ? 's' : ''} on file, the ${displayName} is a ${r > 8 || c > 300 ? 'higher-volume' : 'typical'} record for its class. Safety depends less on the totals and more on whether serious recalls are repaired — always verify by VIN.</p>
      <h3 style="color:#e5e7eb;font-size:1rem;margin:18px 0 4px;">How do I check recalls on a ${titleCase(make)} by VIN?</h3>
      <p style="margin:0 0 14px;">Find the VIN on the driver's door jamb, windshield, or registration, then paste it into <a href="/" style="color:#93c5fd;">Car Recall Checker</a> or NHTSA.gov to see recalls specific to that vehicle.</p>
      <h3 style="color:#e5e7eb;font-size:1rem;margin:18px 0 4px;">Are recall repairs free?</h3>
      <p style="margin:0 0 14px;">Yes. Manufacturers must repair safety recalls at no cost, regardless of whether you are the original owner.</p>

      <p style="margin:20px 0 0;font-size:14px;color:#9ca3af;">Learn more: <a href="/guides/how-to-check-car-recalls/" style="color:#93c5fd;">How to check car recalls</a> &middot; <a href="/guides/what-to-do-if-your-car-is-recalled/" style="color:#93c5fd;">What to do if your car is recalled</a> &middot; <a href="/guides/recalls-complaints-investigations-explained/" style="color:#93c5fd;">Recalls vs. complaints vs. investigations</a></p>

      <div style="border-top:1px solid #1f2937;margin-top:32px;padding-top:18px;display:flex;gap:16px;flex-wrap:wrap;">
        <a href="/about/" style="color:#9ca3af;font-size:13px;text-decoration:none;">About</a>
        <a href="/guides/" style="color:#9ca3af;font-size:13px;text-decoration:none;">Guides</a>
        <a href="/privacy/" style="color:#9ca3af;font-size:13px;text-decoration:none;">Privacy Policy</a>
        <a href="/terms/" style="color:#9ca3af;font-size:13px;text-decoration:none;">Terms &amp; Disclaimer</a>
        <a href="/contact/" style="color:#9ca3af;font-size:13px;text-decoration:none;">Contact</a>
      </div>
      <p style="color:#6b7280;font-size:12px;margin:14px 0 0;">Data from NHTSA. Independent tool, not affiliated with NHTSA or any manufacturer. Always confirm recall status by VIN at NHTSA.gov/recalls.</p>
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
  const CONTENT_PAGES = [
    'about', 'guides', 'contact', 'privacy', 'terms',
    'guides/how-to-check-car-recalls',
    'guides/what-to-do-if-your-car-is-recalled',
    'guides/recalls-complaints-investigations-explained',
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://car-recall-radar.vercel.app</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
${CONTENT_PAGES.map(p => `  <url><loc>https://car-recall-radar.vercel.app/${p}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`).join('\n')}
${VEHICLES.map(v => `  <url><loc>https://car-recall-radar.vercel.app/check/${slug(v)}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`).join('\n')}
</urlset>`

  writeFileSync(join(DIST, 'sitemap.xml'), sitemap)
  console.log(`\nGenerated ${generated} SEO pages + sitemap.xml`)
}

main().catch(console.error)
