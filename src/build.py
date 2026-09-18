#!/usr/bin/env python3
"""NextGR static site builder.

Wraps every body file in src/pages/ with the shared <head>, header and footer,
then writes plain static HTML to the repo root (GitHub Pages serves it as-is).
Also generates assets/js/config.js, sitemap.xml, robots.txt and ads.txt.

Usage:  python3 src/build.py
"""
import json, os, datetime, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
S = json.load(open(os.path.join(SRC, "site.json")))
YEAR = datetime.date.today().year

# (output path, source body, title, description, active nav key, schema type)
PAGES = [
    ("index.html", "home.html", "NextGR — Scholarships, AI Skills, Contests & Careers for the Next Generation",
     "Find scholarships, internships, competitions, AI courses and career opportunities matched to you. Free for students, forever.", "home", "WebSite"),
    ("opportunities.html", "opportunities.html", "Opportunities — Scholarships, Internships, Fellowships & Competitions | NextGR",
     "Browse curated scholarships, fellowships, internships, competitions, grants and free courses. Filter by deadline, level, field and region.", "opps", "CollectionPage"),
    ("match.html", "match.html", "Get Matched — Free Scholarship & Opportunity Matching | NextGR",
     "Answer 5 quick questions and get scholarships, programs, contests and courses matched to your profile. Free, takes 60 seconds.", "match", "WebPage"),
    ("contests.html", "contests.html", "Contests & Prizes — Win Scholarships, Cash & Recognition | NextGR",
     "Enter NextGR contests: the monthly no-essay scholarship, creator challenge, AI-for-good hackathon and young founder pitch.", "contests", "WebPage"),
    ("skills.html", "skills.html", "Future Skills Academy — Learn AI, Code, Create & Build | NextGR",
     "Curated learning paths for AI, coding, data, design, content creation and entrepreneurship — free and certified courses.", "skills", "WebPage"),
    ("videos.html", "videos.html", "Videos — Learn, Get Inspired & Level Up | NextGR",
     "Watch hand-picked videos on AI, careers, mindset and entrepreneurship for the next generation.", "videos", "CollectionPage"),
    ("hire.html", "hire.html", "Hire Next-Gen Talent & Join the Talent Pool | NextGR",
     "Employers: post internships, jobs and gigs and hire proven young talent. Students: join the NextGR talent pool.", "hire", "WebPage"),
    ("tools.html", "tools.html", "Free Tools — Career Quiz, Skill ROI Calculator & Deadline Planner | NextGR",
     "Free interactive tools: future-career quiz, course ROI calculator and scholarship deadline planner with calendar export.", "tools", "WebPage"),
    ("donate.html", "donate.html", "Support NextGR — Donate & Fund the Next Generation | NextGR",
     "Your donation funds scholarships, contest prizes, free tools and outreach to students worldwide. One-time or monthly.", "donate", "DonateAction"),
    ("advertise.html", "advertise.html", "Advertise, Sponsor & Partner with NextGR",
     "Reach ambitious students and young professionals: sponsored listings, sponsored contests, brand-funded scholarships and newsletter sponsorships.", "advertise", "WebPage"),
    ("submit.html", "submit.html", "Submit an Opportunity — Free Listing | NextGR",
     "List your scholarship, internship, competition or program on NextGR for free. Optional promotion to reach more applicants.", "submit", "WebPage"),
    ("careers.html", "careers.html", "Work With Us — Ambassadors, Creators & Builders | NextGR",
     "Join the NextGR team: campus ambassadors, writers, video creators, developers and community moderators.", "careers", "WebPage"),
    ("blog.html", "blog.html", "Blog — Guides on Scholarships, AI Careers & Winning Competitions | NextGR",
     "Actionable guides for students: find scholarships, build AI skills, win hackathons and launch a career.", "blog", "Blog"),
    ("about.html", "about.html", "About NextGR — Built for the Next Generation",
     "NextGR helps students and young builders find opportunities, learn future skills and get funded.", "about", "AboutPage"),
    ("contact.html", "contact.html", "Contact NextGR", "Get in touch with the NextGR team.", "contact", "ContactPage"),
    ("privacy.html", "privacy.html", "Privacy Policy | NextGR", "How NextGR collects, uses and protects your data.", "", "WebPage"),
    ("terms.html", "terms.html", "Terms, Contest Rules & Disclaimer | NextGR", "Terms of use, official contest rules and disclaimers.", "", "WebPage"),
    ("404.html", "404.html", "Page not found | NextGR", "This page does not exist.", "", "WebPage"),
    ("blog/ai-careers-next-generation.html", "post-ai-careers.html", "12 AI Careers the Next Generation Should Prepare For | NextGR",
     "The AI-era roles growing fastest, the skills they need and free ways to start learning them today.", "blog", "Article"),
    ("blog/how-to-win-scholarships.html", "post-scholarships.html", "How to Win Scholarships: A Step-by-Step System | NextGR",
     "A repeatable system to find, prioritise and win scholarships — including no-essay awards and how to avoid scams.", "blog", "Article"),
    ("blog/how-to-win-hackathons.html", "post-hackathons.html", "How to Win Your First Hackathon: A Playbook | NextGR",
     "Team, idea, build, demo: the practical playbook for winning hackathons and student competitions.", "blog", "Article"),
]

NAV = [
    ("opps", "opportunities.html", "Opportunities"),
    ("contests", "contests.html", "Contests"),
    ("skills", "skills.html", "Skills"),
    ("videos", "videos.html", "Videos"),
    ("hire", "hire.html", "Hire Talent"),
    ("tools", "tools.html", "Tools"),
    ("blog", "blog.html", "Blog"),
]
MORE = [
    ("advertise.html", "Advertise & Sponsor"),
    ("submit.html", "Submit an Opportunity"),
    ("careers.html", "Work With Us"),
    ("about.html", "About"),
    ("contact.html", "Contact"),
]


def head(title, desc, path, schema_type, r):
    canonical = S["domain"] + "/" + ("" if path == "index.html" else path)
    ads = ""
    if S["adsense"]["client"]:
        ads = ('<meta name="google-adsense-account" content="%s">\n'
               '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=%s" crossorigin="anonymous"></script>'
               % (S["adsense"]["client"], S["adsense"]["client"]))
    ga = ""
    if S["analytics"]["ga4"]:
        g = S["analytics"]["ga4"]
        ga = ('<script async src="https://www.googletagmanager.com/gtag/js?id=%s"></script>'
              '<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","%s");</script>' % (g, g))
    schema = {
        "@context": "https://schema.org",
        "@type": schema_type if schema_type != "DonateAction" else "WebPage",
        "name": title, "description": desc, "url": canonical,
        "publisher": {"@type": "Organization", "name": S["name"], "url": S["domain"],
                      "logo": S["domain"] + "/assets/img/logo.svg",
                      "sameAs": [v for v in S["social"].values() if v]},
    }
    if schema_type == "Article":
        schema.update({"headline": title.split(" | ")[0], "author": {"@type": "Organization", "name": "NextGR Editorial"},
                       "datePublished": "2026-09-18", "dateModified": "2026-09-18",
                       "image": S["domain"] + "/assets/img/og.png"})
    if schema_type == "WebSite":
        schema["potentialAction"] = {"@type": "SearchAction", "target": S["domain"] + "/opportunities.html?q={q}", "query-input": "required name=q"}
    return f"""<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{canonical}">
<meta name="theme-color" content="#6d28d9">
<meta property="og:type" content="{'article' if schema_type == 'Article' else 'website'}">
<meta property="og:site_name" content="NextGR">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{S['domain']}/assets/img/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{r}assets/img/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="{r}manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{r}assets/css/style.css">
<script>try{{var t=localStorage.getItem('ngr-theme');if(t)document.documentElement.dataset.theme=t;else if(matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.dataset.theme='dark'}}catch(e){{}}</script>
<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>
{ads}
{ga}
</head>"""


def header(active, r):
    links = "".join(
        f'<a href="{r}{href}" class="nav-link{" active" if key == active else ""}">{label}</a>' for key, href, label in NAV)
    more = "".join(f'<a href="{r}{h}">{l}</a>' for h, l in MORE)
    return f"""
<a class="skip" href="#main">Skip to content</a>
<div class="topbar">🎓 <strong>The NextGR ${S['scholarshipPrize']:,} No-Essay Scholarship</strong> is open this month — <a href="{r}contests.html#scholarship">enter free in 60 seconds →</a></div>
<header class="site-header">
  <div class="container nav-wrap">
    <a href="{r}index.html" class="logo" aria-label="NextGR home"><img src="{r}assets/img/logo.svg" alt="" width="34" height="34"><span>Next<b>GR</b></span></a>
    <nav class="main-nav" id="mainNav" aria-label="Main">
      {links}
      <div class="dropdown"><button class="nav-link" aria-expanded="false">More ▾</button><div class="dropdown-menu">{more}</div></div>
    </nav>
    <div class="nav-actions">
      <button class="icon-btn" id="themeToggle" aria-label="Toggle dark mode">◐</button>
      <a href="{r}donate.html" class="btn btn-ghost btn-sm hide-sm">♥ Donate</a>
      <a href="{r}match.html" class="btn btn-primary btn-sm">Get Matched</a>
      <button class="icon-btn menu-btn" id="menuBtn" aria-label="Open menu" aria-controls="mainNav" aria-expanded="false">☰</button>
    </div>
  </div>
</header>
<main id="main">"""


def footer(r):
    so = S["social"]
    return f"""</main>
<section class="newsletter-band">
  <div class="container nl-grid">
    <div><h2>Never miss a deadline.</h2><p>One email a week: new scholarships, contests, internships and free courses — curated, verified, no spam.</p></div>
    <form class="nl-form" data-lead-form="newsletter" novalidate>
      <input type="email" name="email" placeholder="you@email.com" required aria-label="Email address">
      <select name="interest" aria-label="Main interest"><option value="all">Everything</option><option>Scholarships</option><option>AI &amp; Tech</option><option>Contests</option><option>Internships &amp; Jobs</option><option>Entrepreneurship</option></select>
      <button class="btn btn-accent" type="submit">Subscribe free</button>
      <p class="form-note">Join via <a href="{so['whatsapp']}" target="_blank" rel="noopener">WhatsApp channel</a> too. Unsubscribe anytime.</p>
    </form>
  </div>
</section>
<div class="container"><div class="ad-slot" data-ad="footer"></div></div>
<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      <a href="{r}index.html" class="logo"><img src="{r}assets/img/logo.svg" alt="" width="30" height="30"><span>Next<b>GR</b></span></a>
      <p>The Next Generation Opportunity Hub. Scholarships, skills, contests and careers — free for students, forever.</p>
      <div class="socials">
        <a href="{so['youtube']}" target="_blank" rel="noopener" aria-label="YouTube">▶</a>
        <a href="{so['instagram']}" target="_blank" rel="noopener" aria-label="Instagram">◎</a>
        <a href="{so['x']}" target="_blank" rel="noopener" aria-label="X">𝕏</a>
        <a href="{so['linkedin']}" target="_blank" rel="noopener" aria-label="LinkedIn">in</a>
      </div>
    </div>
    <div><h4>Discover</h4><a href="{r}opportunities.html?type=Scholarship">Scholarships</a><a href="{r}opportunities.html?type=Internship">Internships</a><a href="{r}opportunities.html?type=Competition">Competitions</a><a href="{r}opportunities.html?type=Fellowship">Fellowships</a><a href="{r}skills.html">Free courses</a></div>
    <div><h4>Get involved</h4><a href="{r}match.html">Get matched</a><a href="{r}contests.html">Contests &amp; prizes</a><a href="{r}hire.html#talent">Join talent pool</a><a href="{r}careers.html">Work with us</a><a href="{r}donate.html">Donate</a></div>
    <div><h4>Partners</h4><a href="{r}advertise.html">Advertise</a><a href="{r}advertise.html#packages">Sponsor a contest</a><a href="{r}hire.html#post">Post a job</a><a href="{r}submit.html">Submit opportunity</a><a href="{r}contact.html">Contact</a></div>
  </div>
  <div class="container footer-bottom">
    <p>© {YEAR} NextGR.com · <a href="{r}privacy.html">Privacy</a> · <a href="{r}terms.html">Terms &amp; Contest Rules</a> · <a href="{r}terms.html#disclosure">Affiliate disclosure</a> · <button class="linklike" id="cookieSettings">Cookie settings</button></p>
    <p class="muted">Listings are curated from official sources; always confirm details on the provider's website before applying.</p>
  </div>
</footer>
<div class="cookie" id="cookieBar" hidden>
  <p>We use cookies for analytics and ads to keep NextGR free. <a href="{r}privacy.html">Learn more</a></p>
  <div><button class="btn btn-ghost btn-sm" data-cookie="essential">Essential only</button><button class="btn btn-primary btn-sm" data-cookie="all">Accept all</button></div>
</div>
<div class="modal" id="exitModal" hidden role="dialog" aria-modal="true" aria-labelledby="exitTitle">
  <div class="modal-card">
    <button class="modal-close" data-close aria-label="Close">×</button>
    <p class="eyebrow">Before you go</p>
    <h3 id="exitTitle">Get 10 opportunities matched to you — free.</h3>
    <p>Tell us what you're into and we'll send hand-picked scholarships, contests and programs every week.</p>
    <form data-lead-form="exit-intent" class="stack" novalidate>
      <input type="email" name="email" placeholder="you@email.com" required aria-label="Email">
      <button class="btn btn-primary btn-block" type="submit">Send me opportunities</button>
    </form>
  </div>
</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<a href="{r}match.html" class="float-cta" id="floatCta">🎯 Get matched free</a>
<script>window.NGR_ROOT="{r}";</script>
<script src="{r}assets/js/config.js"></script>
<script src="{r}assets/js/data.js"></script>
<script src="{r}assets/js/main.js"></script>
</body>
</html>
"""


def build():
    for out, src, title, desc, active, schema in PAGES:
        depth = out.count("/")
        r = "../" * depth
        if out == "404.html":  # served at any depth, so use absolute URLs
            r = S["baseUrl"].rstrip("/") + "/"
        body = open(os.path.join(SRC, "pages", src), encoding="utf-8").read()
        body = body.replace("{{R}}", r).replace("{{PRIZE}}", f"{S['scholarshipPrize']:,}")
        page = head(title, desc, out, schema, r) + f'\n<body data-page="{active or "misc"}">' + header(active, r) + body + footer(r)
        path = os.path.join(ROOT, out)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        open(path, "w", encoding="utf-8").write(page)

    cfg = {k: v for k, v in S.items() if k not in ("_comment",)}
    open(os.path.join(ROOT, "assets/js/config.js"), "w").write(
        "/* Generated by src/build.py from src/site.json — edit site.json, not this file. */\nwindow.NGR_CONFIG = " + json.dumps(cfg, indent=2, ensure_ascii=False) + ";\n")

    today = datetime.date.today().isoformat()
    urls = "".join(
        f"<url><loc>{S['domain']}/{'' if o == 'index.html' else o}</loc><lastmod>{today}</lastmod></url>\n"
        for o, *_ in PAGES if o != "404.html")
    open(os.path.join(ROOT, "sitemap.xml"), "w").write(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
    open(os.path.join(ROOT, "robots.txt"), "w").write(f"User-agent: *\nAllow: /\nDisallow: /src/\n\nSitemap: {S['domain']}/sitemap.xml\n")
    pub = S["adsense"]["client"].replace("ca-", "")
    open(os.path.join(ROOT, "ads.txt"), "w").write(
        f"google.com, {pub}, DIRECT, f08c47fec0942fa0\n" if pub else
        "# Add your AdSense line after approval, e.g.:\n# google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n")
    print(f"Built {len(PAGES)} pages.")


if __name__ == "__main__":
    build()
