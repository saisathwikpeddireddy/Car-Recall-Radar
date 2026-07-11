// Generates static content pages (legal + editorial guides) as real HTML.
// These are crawlable without JavaScript — important for AdSense review and SEO.
//
// Output: dist/{about,privacy,contact,terms}/index.html
//         dist/guides/index.html + dist/guides/{slug}/index.html
//
// Run after `vite build` (chained in package.json build script).

import { mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, '..', 'dist')
const ORIGIN = 'https://car-recall-radar.vercel.app'
const ADSENSE = 'ca-pub-1372753112558797'
const CONTACT_EMAIL = 'peddireddy.saisathwik@gmail.com'
const UPDATED = 'February 2026'

// --- Shared layout -----------------------------------------------------------

const NAV = [
  { href: '/', label: 'Recall Checker' },
  { href: '/guides/', label: 'Guides' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
]

const FOOTER_LINKS = [
  { href: '/about/', label: 'About' },
  { href: '/guides/', label: 'Guides' },
  { href: '/privacy/', label: 'Privacy Policy' },
  { href: '/terms/', label: 'Terms & Disclaimer' },
  { href: '/contact/', label: 'Contact' },
]

function layout({ path, title, description, body }) {
  const url = `${ORIGIN}${path}`
  const nav = NAV.map(l => `<a href="${l.href}">${l.label}</a>`).join('')
  const footer = FOOTER_LINKS.map(l => `<a href="${l.href}">${l.label}</a>`).join('')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:site_name" content="Car Recall Checker" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE}" crossorigin="anonymous"></script>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body { margin: 0; background: #030712; color: #d1d5db; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height: 1.7; }
      a { color: #93c5fd; text-decoration: none; }
      a:hover { text-decoration: underline; }
      header.site { border-bottom: 1px solid #1f2937; }
      .wrap { max-width: 720px; margin: 0 auto; padding: 0 20px; }
      nav.site { display: flex; gap: 20px; flex-wrap: wrap; align-items: center; padding: 16px 0; }
      nav.site .brand { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 700; color: #fff; margin-right: auto; font-size: 15px; }
      nav.site a { color: #9ca3af; font-size: 13px; }
      nav.site a:hover { color: #fff; text-decoration: none; }
      main { padding: 40px 0 24px; }
      h1 { color: #fff; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 1.9rem; line-height: 1.25; margin: 0 0 8px; }
      h2 { color: #fff; font-size: 1.25rem; margin: 34px 0 10px; }
      h3 { color: #e5e7eb; font-size: 1.02rem; margin: 24px 0 6px; }
      p, li { color: #cbd5e1; font-size: 15px; }
      ul, ol { padding-left: 22px; }
      li { margin: 6px 0; }
      .lede { color: #9ca3af; font-size: 15px; margin: 0 0 20px; }
      .card { background: #0b1220; border: 1px solid #1f2937; border-radius: 12px; padding: 18px 20px; margin: 20px 0; }
      .muted { color: #6b7280; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
      th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #1f2937; vertical-align: top; }
      th { color: #9ca3af; font-weight: 600; }
      footer.site { border-top: 1px solid #1f2937; margin-top: 40px; }
      footer.site .links { display: flex; gap: 16px; flex-wrap: wrap; padding: 20px 0 6px; }
      footer.site .links a { color: #9ca3af; font-size: 13px; }
      footer.site .fine { color: #6b7280; font-size: 12px; padding-bottom: 28px; }
    </style>
  </head>
  <body>
    <header class="site">
      <div class="wrap">
        <nav class="site">
          <a class="brand" href="/">Car Recall Checker</a>
          ${nav}
        </nav>
      </div>
    </header>
    <main>
      <div class="wrap">
${body}
      </div>
    </main>
    <footer class="site">
      <div class="wrap">
        <div class="links">${footer}</div>
        <p class="fine">Car Recall Checker uses public data from the National Highway Traffic Safety Administration (NHTSA). This site is independent and is not affiliated with, endorsed by, or sponsored by NHTSA or any vehicle manufacturer. &copy; ${new Date().getFullYear()} Car Recall Checker.</p>
      </div>
    </footer>
  </body>
</html>`
}

// --- Page bodies -------------------------------------------------------------

const aboutBody = `
<h1>About Car Recall Checker</h1>
<p class="lede">A free, independent tool that turns raw federal vehicle-safety records into a plain-English report you can actually use before buying a used car.</p>

<p>Car Recall Checker was built to answer one simple question that every used-car shopper eventually asks: <strong>"Is this specific car safe, and has anything serious ever gone wrong with it?"</strong> The information needed to answer that already exists in public government databases — but it is scattered across recall notices, complaint filings, and investigation records that are hard to read and harder to interpret. We pull it together and explain it.</p>

<h2>What we do</h2>
<p>Enter a year, make, and model — or paste a 17-character VIN — and we retrieve the full safety record for that vehicle directly from the National Highway Traffic Safety Administration (NHTSA), the U.S. government agency responsible for vehicle safety. For each vehicle we show:</p>
<ul>
  <li><strong>Recalls</strong> — official manufacturer-initiated repairs, what component they cover, the risk they address, and the free remedy.</li>
  <li><strong>Complaints</strong> — reports filed by real owners, including whether a crash, fire, injury, or death was involved.</li>
  <li><strong>Investigations</strong> — open safety probes NHTSA is actively conducting.</li>
  <li><strong>A plain-English verdict</strong> — a balanced summary that puts the numbers in context, because a popular car naturally accumulates more recalls and complaints simply due to how many were sold.</li>
</ul>

<h2>Where our data comes from</h2>
<p>All safety data is sourced from NHTSA's public recall, complaint, and investigation APIs and the vPIC VIN-decoding service. These are the same federal records that power NHTSA.gov. We do not alter the underlying data — we organize it, summarize it, and compare a vehicle against a couple of close competitors so the numbers have meaning.</p>

<h2>How the verdict is written</h2>
<p>The written safety verdict is generated by summarizing the federal data for that exact vehicle. It is intentionally balanced: it does not catastrophize a normal number of recalls, and it does not hide a genuinely dangerous pattern. Recalls are, in most cases, a <em>good</em> sign — they mean a defect was identified and a free fix was made available. What matters more is whether serious, unresolved problems keep recurring.</p>

<h2>Why it's free</h2>
<p>The tool is free to use, requires no account, and asks for no payment. The site is supported by advertising. We believe basic safety information should never sit behind a paywall when you are about to spend thousands of dollars on a vehicle that will carry your family.</p>

<div class="card">
  <p style="margin:0"><strong>Independent, not official.</strong> We are not NHTSA and not a manufacturer. For the official recall status of your exact car, always confirm the VIN at <a href="https://www.nhtsa.gov/recalls" rel="nofollow noopener">NHTSA.gov/recalls</a>. See our <a href="/terms/">Terms &amp; Disclaimer</a> for details.</p>
</div>

<p>Questions, corrections, or feedback? We read every message — <a href="/contact/">get in touch</a>.</p>
`

const privacyBody = `
<h1>Privacy Policy</h1>
<p class="lede">Last updated: ${UPDATED}</p>

<p>This Privacy Policy explains what information Car Recall Checker ("we", "us", or "this site") collects when you use <strong>${ORIGIN.replace('https://', '')}</strong>, how it is used, and the choices you have. By using the site you agree to this policy.</p>

<h2>Information we collect</h2>
<h3>Information you enter</h3>
<p>To look up a vehicle you may type a year, make, and model, or paste a Vehicle Identification Number (VIN). We use this information only to retrieve that vehicle's safety record from NHTSA and to generate your report. We do not require you to create an account, and we do not ask for your name, address, or payment details. A VIN does not, by itself, identify a person to us.</p>

<h3>Information collected automatically</h3>
<p>Like most websites, our hosting provider and analytics may automatically log standard technical information such as your IP address, browser type, device type, referring page, and the pages you visit. This is used to keep the site secure, reliable, and to understand aggregate usage.</p>

<h3>Cookies</h3>
<p>We and our partners use cookies and similar technologies to operate the site, remember preferences, measure traffic, and serve advertising. You can control or delete cookies through your browser settings; disabling some cookies may affect how the site functions.</p>

<h2>Advertising and third-party vendors</h2>
<p>This site displays ads served by <strong>Google AdSense</strong>. To provide these ads:</p>
<ul>
  <li>Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this and other websites.</li>
  <li>Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the Internet.</li>
  <li>You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" rel="nofollow noopener">Google Ads Settings</a>. You can also opt out of some third-party vendors' use of cookies for personalized advertising at <a href="https://www.aboutads.info/choices/" rel="nofollow noopener">aboutads.info/choices</a>.</li>
  <li>For more on how Google uses data from sites that use its services, see <a href="https://policies.google.com/technologies/partner-sites" rel="nofollow noopener">policies.google.com/technologies/partner-sites</a>.</li>
</ul>

<h2>Third-party services we rely on</h2>
<p>When you run a lookup, the vehicle details you enter are sent to the National Highway Traffic Safety Administration (NHTSA) public APIs to retrieve recall, complaint, and investigation data, and to generate the written summary. These services have their own privacy practices, which we do not control.</p>

<h2>How we use information</h2>
<ul>
  <li>To retrieve and display the safety record for the vehicle you request.</li>
  <li>To operate, maintain, secure, and improve the site.</li>
  <li>To display advertising that supports the free service.</li>
  <li>To respond to messages you send us.</li>
</ul>

<h2>Data retention</h2>
<p>We do not maintain user accounts or profiles. Standard server and analytics logs are retained only as long as needed for security and operational purposes.</p>

<h2>Children's privacy</h2>
<p>This site is intended for a general audience and is not directed to children under 13. We do not knowingly collect personal information from children.</p>

<h2>Your choices</h2>
<ul>
  <li>Adjust or block cookies in your browser.</li>
  <li>Opt out of personalized ads via the links above.</li>
  <li>Contact us with any question about your data.</li>
</ul>

<h2>Changes to this policy</h2>
<p>We may update this Privacy Policy from time to time. Material changes will be reflected by updating the "Last updated" date above.</p>

<h2>Contact</h2>
<p>Questions about this policy? Email <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> or use our <a href="/contact/">contact page</a>.</p>
`

const contactBody = `
<h1>Contact Us</h1>
<p class="lede">We read every message — questions, corrections, and feedback are all welcome.</p>

<p>Car Recall Checker is an independent project. Whether you have found a data issue, want to suggest a vehicle we should cover, have a question about how the tool works, or need to reach us about advertising or privacy, here is how to get in touch.</p>

<div class="card">
  <h3 style="margin-top:0">Email</h3>
  <p style="margin:0 0 6px"><a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
  <p class="muted" style="margin:0">We typically reply within a few business days.</p>
</div>

<h2>What to reach out about</h2>
<ul>
  <li><strong>Data corrections</strong> — if a recall count or summary looks wrong, tell us the vehicle and what you expected. Note that our numbers come straight from NHTSA and update as their records change.</li>
  <li><strong>Feature requests</strong> — a make, model, or year you would like us to add.</li>
  <li><strong>Privacy questions</strong> — see our <a href="/privacy/">Privacy Policy</a>, or email us directly.</li>
  <li><strong>General feedback</strong> — anything that would make the tool more useful.</li>
</ul>

<div class="card">
  <p style="margin:0"><strong>Need the official recall status of your car right now?</strong> The fastest source is NHTSA's own VIN lookup at <a href="https://www.nhtsa.gov/recalls" rel="nofollow noopener">NHTSA.gov/recalls</a>. We are an independent tool and cannot change or close a recall on your vehicle.</p>
</div>
`

const termsBody = `
<h1>Terms of Use &amp; Disclaimer</h1>
<p class="lede">Last updated: ${UPDATED}</p>

<p>By using Car Recall Checker you agree to these terms. If you do not agree, please do not use the site.</p>

<h2>Informational use only</h2>
<p>Car Recall Checker provides general information about vehicle recalls, complaints, and investigations for research and educational purposes. It is <strong>not</strong> professional, legal, mechanical, or safety advice, and it is not a substitute for a professional inspection or the official recall status of your specific vehicle.</p>

<h2>Accuracy of data</h2>
<p>All safety data is sourced from the National Highway Traffic Safety Administration (NHTSA) and related public services. This data may be incomplete, delayed, or updated after you view it. Complaint reports are unverified statements submitted by the public and do not represent findings by any government agency or by us. We make no warranty that the information is accurate, current, or complete.</p>

<h2>Always verify by VIN</h2>
<p>Recalls apply to specific vehicles by VIN. A model may show recalls that were never issued for your exact car, or that have already been repaired. Before making any decision, confirm the official, VIN-specific recall status at <a href="https://www.nhtsa.gov/recalls" rel="nofollow noopener">NHTSA.gov/recalls</a> and have the vehicle inspected by a qualified mechanic.</p>

<h2>No affiliation</h2>
<p>This site is independent. It is not affiliated with, endorsed by, or sponsored by NHTSA, the U.S. government, or any vehicle manufacturer, dealer, or brand mentioned on the site. All trademarks belong to their respective owners.</p>

<h2>Limitation of liability</h2>
<p>The site is provided "as is" without warranties of any kind. To the fullest extent permitted by law, we are not liable for any loss or damage arising from your use of, or reliance on, information provided by this site, including any decision to buy, sell, keep, or repair a vehicle.</p>

<h2>Advertising</h2>
<p>The site is supported by advertising, including Google AdSense. See our <a href="/privacy/">Privacy Policy</a> for how advertising cookies are used.</p>

<h2>Changes</h2>
<p>We may update these terms at any time. Continued use of the site after changes constitutes acceptance of the revised terms.</p>

<h2>Contact</h2>
<p>Questions about these terms? Email <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
`

// --- Guides -------------------------------------------------------------------

const GUIDES = [
  {
    slug: 'how-to-check-car-recalls',
    title: 'How to Check for Car Recalls (Free, Step by Step)',
    description: 'A step-by-step guide to checking recalls on any car by VIN or by year, make, and model — and how to tell whether a recall has actually been fixed.',
    body: `
<h1>How to Check for Car Recalls</h1>
<p class="lede">Checking recalls takes about two minutes and costs nothing. Here is exactly how to do it, and how to read what you find.</p>

<p>A recall means a manufacturer or NHTSA has determined that a vehicle — or a part in it — has a safety defect or fails to meet a federal safety standard. When that happens, the manufacturer must notify owners and repair the problem <strong>for free</strong>. The catch: recalls are only useful if you know they exist and confirm they were actually completed. Here is how to check.</p>

<h2>Method 1: Check by VIN (most accurate)</h2>
<p>The VIN — Vehicle Identification Number — is the 17-character code unique to one specific car. Because recalls are issued for specific VIN ranges, a VIN check is the only way to know whether a recall applies to <em>your</em> car and whether it has already been repaired.</p>
<ol>
  <li><strong>Find the VIN.</strong> Look at the base of the windshield on the driver's side, inside the driver's door jamb, or on your registration and insurance card.</li>
  <li><strong>Enter it here or at NHTSA.gov.</strong> Paste the 17 characters into <a href="/">Car Recall Checker</a> for a plain-English report, or use NHTSA's official lookup for the authoritative repair status.</li>
  <li><strong>Read the result.</strong> A VIN lookup will tell you whether there are open (unrepaired) recalls specific to that car.</li>
</ol>

<h2>Method 2: Check by year, make, and model</h2>
<p>If you do not have the VIN yet — for example, you are researching a car before you go see it — search by year, make, and model instead, such as "2019 Honda CR-V." This shows every recall issued for that model year, plus the complaint and investigation history. It will not tell you whether a specific car was repaired, but it is perfect for spotting patterns before you shop.</p>

<h2>How to tell if a recall was actually fixed</h2>
<p>This is the step most buyers skip. A recall on record does not mean the car is dangerous today — it may have been repaired years ago. To confirm:</p>
<ul>
  <li>Run the <strong>VIN</strong> through NHTSA's lookup, which flags only <em>open</em> (unrepaired) recalls.</li>
  <li>Ask the seller or dealer for <strong>recall completion records</strong> or service history.</li>
  <li>Any franchised dealer for that brand can confirm and perform outstanding recall repairs for free, even if you are not the original owner.</li>
</ul>

<h2>What the numbers actually mean</h2>
<p>Do not panic at a high recall count. Popular, high-volume vehicles almost always have more recalls simply because there are more of them on the road and manufacturers are proactive. What matters is the <em>nature</em> of the problems and whether serious ones remain unresolved:</p>
<table>
  <tr><th>Signal</th><th>How to read it</th></tr>
  <tr><td>Many recalls, all repairable and mostly completed</td><td>Usually fine — shows the maker is fixing issues.</td></tr>
  <tr><td>Recalls for airbags, brakes, steering, or fire risk</td><td>Confirm these specific ones are repaired before buying.</td></tr>
  <tr><td>Open recall that is still unrepaired</td><td>Get it fixed for free before or right after purchase.</td></tr>
  <tr><td>Repeated complaints about the same failure</td><td>Worth a closer look and a mechanic's inspection.</td></tr>
</table>

<div class="card">
  <p style="margin:0"><strong>Try it now.</strong> <a href="/">Check any car's recalls free</a> by VIN or by year, make, and model — no account needed.</p>
</div>

<p class="muted">Related reading: <a href="/guides/what-to-do-if-your-car-is-recalled/">What to do if your car is recalled</a> &middot; <a href="/guides/recalls-complaints-investigations-explained/">Recalls vs. complaints vs. investigations</a></p>
`,
  },
  {
    slug: 'what-to-do-if-your-car-is-recalled',
    title: 'What to Do If Your Car Is Recalled',
    description: 'Recall repairs are free. Here is exactly what to do when your vehicle is under recall, how long it takes, and what your rights are as an owner.',
    body: `
<h1>What to Do If Your Car Is Recalled</h1>
<p class="lede">A recall is not a reason to panic — it is a free repair the manufacturer is legally required to provide. Here is how to handle it.</p>

<p>If you have learned your vehicle is under recall, the single most important fact is this: <strong>recall repairs are free</strong>, regardless of the car's age or whether you are the original owner, as long as the vehicle is within the eligibility window (generally recalls issued in the last 15 years for most vehicles). Here is the process.</p>

<h2>Step 1: Confirm it applies to your exact car</h2>
<p>Recalls target specific VIN ranges. Enter your 17-character VIN into <a href="/">Car Recall Checker</a> or NHTSA's official lookup to confirm the recall is open for your vehicle and has not already been repaired by a previous owner.</p>

<h2>Step 2: Read what the recall covers</h2>
<p>Each recall notice describes three things you should understand:</p>
<ul>
  <li><strong>The defect</strong> — the component and what can go wrong.</li>
  <li><strong>The consequence</strong> — the safety risk (for example, loss of braking, fire, or airbag failure).</li>
  <li><strong>The remedy</strong> — the free fix, and whether parts are currently available.</li>
</ul>
<p>If the consequence is severe — fire risk, sudden loss of control, or airbag danger — treat the repair as urgent.</p>

<h2>Step 3: Contact a dealer and schedule the free repair</h2>
<p>Call any franchised dealer for your vehicle's brand, give them your VIN and the recall campaign number, and schedule the repair. You do not have to return to the dealer you bought from. If parts are on backorder, ask to be notified when they arrive and whether interim measures are recommended.</p>

<h2>Step 4: Know your rights while you wait</h2>
<ul>
  <li>The repair, including parts and labor, must be provided at no cost.</li>
  <li>If a remedy is not yet available, the manufacturer must notify you again when it is.</li>
  <li>In some cases the manufacturer may offer a loaner or reimbursement — ask.</li>
  <li>For a serious safety recall with no available fix, consider limiting use of the vehicle until it is repaired.</li>
</ul>

<h2>Buying a used car that has an open recall</h2>
<p>An open recall is not automatically a dealbreaker on a used car — but you should get it repaired promptly, and it is fair to raise during price negotiation, especially if the fix is inconvenient or parts are delayed. Franchised dealers can complete outstanding recalls for free after you buy.</p>

<div class="card">
  <p style="margin:0"><strong>Not sure if you have an open recall?</strong> <a href="/">Check your car by VIN</a> in under a minute.</p>
</div>

<p class="muted">Related reading: <a href="/guides/how-to-check-car-recalls/">How to check for car recalls</a> &middot; <a href="/guides/recalls-complaints-investigations-explained/">Recalls vs. complaints vs. investigations</a></p>
`,
  },
  {
    slug: 'recalls-complaints-investigations-explained',
    title: 'Recalls vs. Complaints vs. Investigations: What NHTSA Data Means',
    description: 'NHTSA reports recalls, complaints, and investigations — three very different things. Learn what each one means and how to weigh them when buying a car.',
    body: `
<h1>Recalls, Complaints, and Investigations Explained</h1>
<p class="lede">These three types of NHTSA records look similar but mean very different things. Knowing the difference is the key to reading a safety report correctly.</p>

<p>When you look up a vehicle's safety record, you will see three categories of data from the National Highway Traffic Safety Administration. Treating them as interchangeable is the most common mistake used-car shoppers make. Here is what each one actually is.</p>

<h2>Recalls: official, and usually a good sign</h2>
<p>A recall is a formal action — issued by the manufacturer or ordered by NHTSA — when a vehicle has a safety defect or fails a federal safety standard. The maker must fix it for free. Recalls are <strong>verified</strong> and carry a required free remedy.</p>
<p>Counterintuitively, recalls are often a positive signal: they mean a problem was identified and a fix exists. A car with several fully repaired recalls can be safer than a car with none, because the known issues have already been addressed. What matters is whether any recall is still <em>open</em> (unrepaired) and how serious it is.</p>

<h2>Complaints: unverified, but useful for spotting patterns</h2>
<p>A complaint is a report filed by an owner describing a problem they experienced. Complaints are <strong>not verified</strong> by NHTSA — they are raw, first-hand reports, and they can be emotional or one-off. Their value is in <em>volume and pattern</em>, not in any single entry.</p>
<p>When reading complaints, look for:</p>
<ul>
  <li><strong>Clustering</strong> — many reports about the same component (transmission, brakes, electrical) suggest a real trend.</li>
  <li><strong>Severity flags</strong> — whether reports mention crashes, fires, or injuries.</li>
  <li><strong>Context of volume</strong> — a best-selling model will always have more complaints simply because millions were sold. Compare against similar vehicles, not against rare cars.</li>
</ul>

<h2>Investigations: NHTSA is actively looking into it</h2>
<p>An investigation means NHTSA has opened a formal inquiry into a potential defect, usually after a pattern of complaints. Investigations sit between complaints and recalls: no fix is required yet, but the government considers the issue serious enough to examine. An open investigation on a component you care about is worth watching, as it can lead to a future recall.</p>

<h2>How to weigh all three together</h2>
<table>
  <tr><th>Record type</th><th>Verified?</th><th>Free fix?</th><th>How to weigh it</th></tr>
  <tr><td>Recall</td><td>Yes</td><td>Yes</td><td>Confirm open ones are repaired; most are routine.</td></tr>
  <tr><td>Complaint</td><td>No</td><td>No</td><td>Look for clusters and severity, not single reports.</td></tr>
  <tr><td>Investigation</td><td>In progress</td><td>Not yet</td><td>A signal to watch; may become a recall.</td></tr>
</table>

<p>The healthiest way to read a report: a high recall count with everything repaired is usually fine; a cluster of crash- or fire-related complaints about one system is a red flag worth a mechanic's inspection; and an open investigation is a reason to check back before you buy.</p>

<div class="card">
  <p style="margin:0"><strong>See all three for any car.</strong> <a href="/">Run a free safety report</a> that combines recalls, complaints, and investigations into one plain-English verdict.</p>
</div>

<p class="muted">Related reading: <a href="/guides/how-to-check-car-recalls/">How to check for car recalls</a> &middot; <a href="/guides/what-to-do-if-your-car-is-recalled/">What to do if your car is recalled</a></p>
`,
  },
]

function guidesIndexBody() {
  const items = GUIDES.map(g => `
  <div class="card">
    <h3 style="margin-top:0"><a href="/guides/${g.slug}/">${g.title}</a></h3>
    <p style="margin:0">${g.description}</p>
  </div>`).join('')

  return `
<h1>Car Safety &amp; Recall Guides</h1>
<p class="lede">Practical, plain-English guides to checking recalls, handling them, and understanding what federal vehicle-safety data really means.</p>
${items}
<div class="card">
  <p style="margin:0"><strong>Ready to check a specific car?</strong> <a href="/">Run a free recall report</a> by VIN or by year, make, and model.</p>
</div>
`
}

// --- Write --------------------------------------------------------------------

function writePage(path, html) {
  const dir = join(DIST, path)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)
  console.log(`  /${path}`)
}

function main() {
  console.log('Generating static content pages...')

  writePage('about', layout({ path: '/about/', title: 'About Car Recall Checker', description: 'Car Recall Checker is a free, independent tool that turns public NHTSA vehicle-safety data into a plain-English recall report for used-car buyers.', body: aboutBody }))
  writePage('privacy', layout({ path: '/privacy/', title: 'Privacy Policy — Car Recall Checker', description: 'How Car Recall Checker collects, uses, and protects information, including cookies and Google AdSense advertising.', body: privacyBody }))
  writePage('contact', layout({ path: '/contact/', title: 'Contact — Car Recall Checker', description: 'Get in touch with Car Recall Checker for data corrections, feature requests, privacy questions, or feedback.', body: contactBody }))
  writePage('terms', layout({ path: '/terms/', title: 'Terms of Use & Disclaimer — Car Recall Checker', description: 'Terms of use and disclaimer for Car Recall Checker, an independent tool based on public NHTSA vehicle-safety data.', body: termsBody }))

  writePage('guides', layout({ path: '/guides/', title: 'Car Safety & Recall Guides — Car Recall Checker', description: 'Plain-English guides on checking car recalls, what to do when your car is recalled, and understanding NHTSA safety data.', body: guidesIndexBody() }))
  for (const g of GUIDES) {
    writePage(`guides/${g.slug}`, layout({ path: `/guides/${g.slug}/`, title: `${g.title} — Car Recall Checker`, description: g.description, body: g.body }))
  }

  console.log('Done.')
}

main()

export { GUIDES }
