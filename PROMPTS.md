# NextGR.com — Phase-wise Build Prompts

Copy these prompts into any AI coding assistant, in order, to rebuild, extend or clone NextGR. Each phase builds on the previous one and ends with a clear acceptance check. The site in this repo is the output of Phases 0–11.

---

## Phase 0 — Strategy & research
```
You are a senior product strategist for monetized content websites. Domain: NextGR.com ("Next Generation").
Position it as the Next-Gen Opportunity Hub: scholarships, internships, competitions, fellowships, startup funding and AI/future-skills courses for 16–30-year-olds.
1) Analyse at least 25 world-class sites in this niche (Scholarships.com, Fastweb, Bold.org, Scholarships360, Going Merry, Unigo, Niche, Opportunity Desk, YouthOp, Unstop, Internshala, Devpost, Kaggle, MLH, Handshake, Wellfound, Coursera, edX, Codecademy, Khan Academy, freeCodeCamp, TED-Ed, JA, Global Citizen, Product Hunt, GoFundMe, Buy Me a Coffee, Patreon, Topcoder, 99designs).
2) For each site, extract: key sections, forms and fields, lead-gen mechanics, monetization and trust elements.
3) Output a must-have feature list, the top 10 conversion patterns, a ranked revenue stack (lead gen, sponsorship, featured listings, affiliate, AdSense, YouTube, donations) and a revenue model at 100k pageviews/month with stated assumptions.
Acceptance: a STRATEGY.md with a comparison table, a feature→page mapping and a risk list.
```

## Phase 1 — Architecture & design system
```
Create a static, dependency-free website that runs on GitHub Pages' free plan (no server, no build required to serve).
Structure: src/site.json (single config: domain, AdSense ID + slots, GA4, form endpoint, donation links, YouTube videos, socials, prize amount), src/pages/*.html (page bodies), src/build.py (wraps bodies in a shared head/header/footer; outputs static HTML to the repo root; generates config.js, sitemap.xml, robots.txt, ads.txt).
Use relative URLs everywhere so the site works at username.github.io/Next-gr/ and at a custom domain.
Design system in assets/css/style.css:
- CSS variables for colours, with a light and a dark theme (toggle saved to localStorage)
- Brand gradient violet→indigo→cyan with an amber accent; Inter + Space Grotesk fonts
- Components: buttons, cards, pills, chips, forms, a multi-step form, countdowns, pricing cards, FAQ, toasts, modal, cookie bar
- Mobile-first, no horizontal scroll at 360px, respects reduced motion
Acceptance: the build runs; every page shares the header and footer; the mobile menu works.
```

## Phase 2 — Global layout & conversion chrome
```
Build the shared header and footer.
Header:
- Announcement topbar promoting the monthly no-essay scholarship
- Sticky header: logo, nav (Opportunities, Contests, Skills, Videos, Hire Talent, Tools, Blog, More ▾), dark-mode toggle, Donate button and a "Get Matched" CTA
Footer:
- Newsletter band (email + interest select), a footer ad slot, 4-column links, legal links, cookie settings
Global scripts:
- Cookie consent that requests non-personalised ads when "Essential only" is chosen
- Desktop exit-intent email modal, shown at most once per 7 days
- Floating "Get matched" CTA after 700px of scroll
- UTM/referrer/ref capture stored in localStorage and attached to every lead
- SEO: JSON-LD (WebSite + SearchAction, Organization, Article, FAQPage), canonical, Open Graph/Twitter tags, web manifest
Acceptance: Lighthouse SEO ≥ 95; no console errors.
```

## Phase 3 — Opportunity engine
```
Create assets/js/data.js with 35+ real programs (scholarships, competitions, fellowships, internships, grants, free courses).
Each program has these fields: id, title, org, type, amount, value, level[], region, field[], deadlineMonth (1–12, "monthly" or null for rolling), noEssay, tags[], url, desc and optional featured.
Compute the next deadline from deadlineMonth. Colour-code the pills: red ≤ 21 days, amber ≤ 60, otherwise month/year.
Build opportunities.html with:
- Type chips, keyword search, level/region filters, sort (deadline / value / A–Z), no-essay and saved-only toggles
- URL-synced filters and share button, save-to-favourites (localStorage)
- An in-feed ad after the 6th card
- Sidebar: match CTA, ad, "submit an opportunity", scam red flags
Show homepage rails for "closing soon" and "featured".
Acceptance: filters combine correctly; ?type=Scholarship&q=ai deep-links work.
```

## Phase 4 — Dedicated lead-generation funnel (highest priority)
```
Build match.html: a 4-step matching quiz with a progress bar.
- Step 1: level (auto-advances).
- Step 2: goals (multi-select).
- Step 3: interests plus target region and home country.
- Step 4: a teaser: "N opportunities worth up to $X", with 3 blurred preview cards. Then ask for first name, email, graduation year and optional phone/WhatsApp.
Consent: a required email consent; a SEPARATE optional partner-contact consent (TCPA/GDPR-safe); a required age/parental checkbox.
Score every program: +3 goal type match, +3 level match (−4 on mismatch), +2 field match, +2 featured, +1 no-essay, +1 region.
Lead delivery: POST to a configurable endpoint (Formspree / Web3Forms / Google Apps Script → Google Sheet). Always also save to localStorage. Honeypot anti-spam. Fire a GA4 generate_lead event.
After submitting, reveal the full ranked results plus next-step cards (planner, skills, talent pool).
Acceptance: an end-to-end test yields ranked matches and a stored lead payload that includes attribution fields.
```

## Phase 5 — Contests, prizes & virality
```
Build contests.html:
- A hero for the monthly No-Essay Scholarship with a live countdown to the end of the month
- 4 contest cards (scholarship, creator video challenge, AI-for-Good mini-hackathon, young founder pitch). Each shows prize, cadence, a countdown (monthly / quarterly / bi-annual), audience, entry method, judging and a CTA.
- One universal entry form: the contest select is pre-filled from the card clicked. Team fields appear for the hackathon/pitch; a submission link field appears for skill contests.
- After entry, generate a referral link (?ref=code) for bonus entries, with a copy button.
- A Hall of Fame grid (empty until real winners exist)
Also add official contest rules (no purchase necessary, eligibility, random draw, notification, taxes, void where prohibited) to terms.html.
Acceptance: the referral link appears after a valid entry.
```

## Phase 6 — Donations & sponsorship
```
Build donate.html:
- One-time/monthly toggle; tiers $10/$25/$100/$1,000 plus a custom amount; a live impact sentence
- Optional name/email/dedication/anonymous fields and a "direct my gift to" select (scholarships, prizes, outreach/marketing, hiring talent, operations)
- Payment buttons driven by config: PayPal, Stripe Payment Link, Buy Me a Coffee, Ko-fi, GitHub Sponsors. Hide any button whose config value is empty; log a donation-intent lead on click.
- Goal progress bar and an allocation bar chart
- Corporate giving CTA, non-monetary ways to help, founding supporter wall
Build advertise.html:
- Audience segments
- 4 packages: Featured Listing $99/30d, Sponsored Contest $2,500+, Named Scholarship $1,000+ plus 15% admin, CPL lead generation
- Partnership inquiry form (org type, interests, budget, timeline, goals)
Acceptance: every payment button opens the configured provider; the sponsor form stores a lead.
```

## Phase 7 — Talent & hiring marketplace
```
Build hire.html:
- Employer value props
- A job/internship/gig posting form (company, role, type, location, required pay range, deadline, skills, description, contact, Free vs. Featured $99 plan, "introduce me to contest winners")
- A student talent-profile form (skills, portfolio, level, looking for, availability, résumé, required sharing consent)
- Internship listings
Build careers.html: NextGR's own roles (campus ambassador, researcher/writer, video creator, front-end intern, moderator, partnerships associate on commission). Clicking "Apply" on a role pre-selects it in the application form.
Acceptance: both forms validate and store leads.
```

## Phase 8 — Content, SEO & YouTube
```
Build blog.html plus 3 pillar articles (AI careers, winning scholarships, winning hackathons). Each has a table of contents, an in-article ad slot, callouts, internal links to tools/match/contests, a closing CTA band and Article JSON-LD.
Build videos.html with category tabs. Use lite YouTube embeds: a thumbnail first, then youtube-nocookie iframe on click (better Core Web Vitals, which helps both AdSense and SEO). Add a "subscribe" link from config and a "pitch your story to be featured" form.
Build skills.html:
- 6 learning paths (AI Builder, Full-Stack, Data Analyst, Creator/Marketer, Founder, Green-Tech); each step links to a real free resource
- Free course cards with an affiliate disclosure
- Cohort waitlist form
Acceptance: sitemap.xml lists every page; each page has a unique title and meta description.
```

## Phase 9 — Interactive tools (repeat-visit & link-bait)
```
Build tools.html with:
(1) A 6-question future-career quiz that maps answers to a learning path, with a share button.
(2) A Skill ROI calculator: cost, hours, hours/week and income before/after → time to finish, income gain, payback months, 5-year net and ROI %.
(3) A deadline planner: quick-add from listings; saved in localStorage; export to .ics with a 7-day VALARM.
Acceptance: all three work offline after the first load.
```

## Phase 10 — Monetization wiring & compliance
```
Wire AdSense:
- When adsense.client is set, inject the loader in <head> plus a google-adsense-account meta tag, render <ins class="adsbygoogle"> in every [data-ad] slot (header, inContent, sidebar, footer) and generate ads.txt.
- Otherwise show labelled placeholders.
Wire GA4 (optional).
Legal and compliance:
- Privacy policy: Google advertising cookies disclosure, children/COPPA, GDPR/CCPA/PIPEDA/DPDP rights, list of processors
- Terms: affiliate disclosure, listings disclaimer
- Label every sponsored placement
Acceptance: a policy review checklist is complete.
```

## Phase 11 — QA, performance & deployment (GitHub Pages, free plan)
```
Run a Playwright suite that checks:
- No broken internal links and no console errors on any page
- No horizontal overflow at 390px
- End-to-end runs of the match funnel, contest entry + referral, quiz, ROI calculator and donation impact
Then deploy:
- Push to github.com/WEBWORKSA1/Next-gr (public repo)
- Include .nojekyll and 404.html (with absolute URLs)
- Publish via GitHub Pages from the gh-pages branch (or main / root)
Custom domain:
- Add a CNAME file containing nextgr.com
- DNS: A records for the apex → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153; CNAME www → webworksa1.github.io
- Enable "Enforce HTTPS"
- Set baseUrl in site.json to https://nextgr.com and rebuild
Acceptance: the live URL returns 200 and every page renders.
```

## Phase 12 — Growth & expansion (post-launch)
```
1) Programmatic SEO: generate /scholarships/<field>/, /scholarships/<country>/, /competitions/<month>/ pages from data.js with unique intros and FAQ schema.
2) Weekly YouTube "Opportunity Roundup" + Shorts; embed the latest videos automatically from config.
3) Accounts & dashboards (Supabase/Firebase): saved items synced across devices, an employer dashboard, paid talent search.
4) Leads: move from a Google Sheet to a CRM with per-partner consent logs; build a CPL partner portal.
5) Contests: public voting pages, leaderboards and winner profiles (only real winners).
6) Localisation: India, Africa and LATAM editions (hreflang).
7) Email automation: welcome series, deadline reminders, win-back.
Acceptance: each feature ships behind config and keeps the site deployable on GitHub Pages.
```
