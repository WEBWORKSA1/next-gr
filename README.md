# NextGR.com — The Next Generation Opportunity Hub

Scholarships · AI & future skills · Contests & prizes · Internships & hiring · Donations & sponsorship.

A fast, responsive, interactive **static** website (HTML + CSS + vanilla JS, zero dependencies) that runs free on **GitHub Pages**.

**Live:** https://webworksa1.github.io/next-gr/ · **Target domain:** https://nextgr.com

- [STRATEGY.md](STRATEGY.md): the niche choice, analysis of 32 competitor sites, revenue model and risks
- [PROMPTS.md](PROMPTS.md): phase-wise prompts to rebuild or extend the site

## What's included (21 pages)

| Area | Pages / features |
|---|---|
| Lead generation | `match.html`: a 4-step matching funnel with a match-count teaser, blurred preview, email unlock and separate optional partner consent. Also the newsletter band, exit-intent modal and UTM/ref capture on every lead |
| Opportunities | `opportunities.html`: 37 real programs with search, type/level/region filters, sort, no-essay filter, saved items and deadline countdown pills |
| Contests | `contests.html`: monthly no-essay scholarship, 3 skill contests with live countdowns, a universal entry form, referral links for bonus entries, Hall of Fame, official rules |
| Donations | `donate.html`: tiers, one-time/monthly, impact line, fund allocation, PayPal / Stripe / Buy Me a Coffee / Ko-fi / GitHub Sponsors |
| Sponsors & ads | `advertise.html`: 4 packages and a partner inquiry form. `submit.html`: free listing with a paid Featured upsell |
| Hiring | `hire.html`: employer job/internship form and student talent pool. `careers.html`: NextGR's own open roles |
| Skills & video | `skills.html` (6 learning paths, courses, cohort waitlist), `videos.html` (lite YouTube embeds, category tabs) |
| Tools | `tools.html`: career quiz, skill ROI calculator, deadline planner with calendar `.ics` export |
| Content & SEO | Blog with 3 pillar guides, JSON-LD, Open Graph tags, sitemap, robots.txt, manifest, 404 page |
| Legal | Privacy (AdSense cookie disclosure), terms, contest rules, affiliate disclosure |

## Editing

All settings live in **`src/site.json`**. Page bodies live in `src/pages/`. After editing, rebuild:

```bash
python3 src/build.py
```

Listings, contests, learning paths, open roles and blog cards live in **`assets/js/data.js`**. No rebuild is needed after editing that file.

## Go-live checklist

1. **Forms (receive leads).** Pick one and set `forms` in `site.json`:
   - **Formspree:** `"type":"formspree","endpoint":"https://formspree.io/f/XXXX"`
   - **Web3Forms:** `"type":"web3forms","web3formsKey":"YOUR-KEY"`
   - **Google Sheets, free and unlimited:** `"type":"apps-script","endpoint":"<web app URL>"`. Create a Sheet, open Extensions → Apps Script, paste the code below, then Deploy → Web app → access: Anyone.
     ```js
     function doPost(e){var d=JSON.parse(e.postData.contents);var s=SpreadsheetApp.getActive().getSheetByName(d.form)||SpreadsheetApp.getActive().insertSheet(d.form);
     var k=Object.keys(d);if(s.getLastRow()==0)s.appendRow(k);var h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0];
     k.forEach(function(x){if(h.indexOf(x)<0){h.push(x);s.getRange(1,h.length).setValue(x);}});
     s.appendRow(h.map(function(x){var v=d[x];return Array.isArray(v)?v.join(", "):v||"";}));return ContentService.createTextOutput("ok");}
     ```
2. **AdSense.** Set `adsense.client` to `ca-pub-…` and fill in the slot IDs, then rebuild. `ads.txt` is generated automatically.
3. **Donations.** Paste your PayPal donate URL, Stripe Payment Link and Buy Me a Coffee / Ko-fi handles into `donate`.
4. **YouTube.** Set `youtube.channelUrl` and replace `videos` with your own video IDs.
5. **Social share image.** Upload a 1200×630 `assets/img/og.png` (a ready-made one is included with the launch notes).
6. **Prize.** Fund the monthly scholarship, or change `scholarshipPrize`.
7. **Custom domain.**
   - Add a file named `CNAME` containing `nextgr.com`.
   - At your registrar, point the apex A records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`, and add a CNAME `www` → `webworksa1.github.io`.
   - In repo Settings → Pages, enable Enforce HTTPS.
   - Set `baseUrl` to `https://nextgr.com`, then rebuild.

## Deploying

GitHub Pages serves the repo root from the `gh-pages` branch, which mirrors `main`. To publish changes, push to `main`, then update `gh-pages`:

```bash
git push origin main && git push origin main:gh-pages
```

You can also switch Settings → Pages to deploy from `main` / root.
