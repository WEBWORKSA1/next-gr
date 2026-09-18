/* NextGR — core interactions. No build step, no dependencies. */
(function () {
  "use strict";
  var C = window.NGR_CONFIG || {}, D = window.NGR_DATA || {}, R = window.NGR_ROOT || "";
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  function toast(msg) { var t = $("#toast"); if (!t) return; t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("show"); }, 3200); }
  function track(name, params) { try { if (window.gtag) gtag("event", name, params || {}); } catch (e) {} }
  function href(u) { return /^https?:/.test(u) ? u : R + u; }
  window.NGR = { toast: toast, store: store, track: track };

  /* ---------- Theme, nav ---------- */
  var tt = $("#themeToggle");
  if (tt) tt.addEventListener("click", function () {
    var n = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = n; try { localStorage.setItem("ngr-theme", n); } catch (e) {}
  });
  var mb = $("#menuBtn"), nav = $("#mainNav");
  if (mb) mb.addEventListener("click", function () { var o = nav.classList.toggle("open"); mb.setAttribute("aria-expanded", o); mb.textContent = o ? "✕" : "☰"; });
  $$(".dropdown > button").forEach(function (b) { b.addEventListener("click", function () { var d = b.parentNode; d.classList.toggle("open"); b.setAttribute("aria-expanded", d.classList.contains("open")); }); });
  document.addEventListener("click", function (e) { $$(".dropdown.open").forEach(function (d) { if (!d.contains(e.target)) d.classList.remove("open"); }); });

  /* ---------- Reveal + floating CTA + counters ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: .12 });
    $$(".reveal").forEach(function (el) { io.observe(el); });
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var el = e.target, to = +el.dataset.count, pre = el.dataset.prefix || "", suf = el.dataset.suffix || "", t0 = null;
        function step(ts) { t0 = t0 || ts; var p = Math.min((ts - t0) / 1200, 1); el.textContent = pre + Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString() + suf; if (p < 1) requestAnimationFrame(step); }
        requestAnimationFrame(step);
      });
    });
    $$("[data-count]").forEach(function (el) { co.observe(el); });
  } else { $$(".reveal").forEach(function (el) { el.classList.add("in"); }); }
  var fc = $("#floatCta");
  if (fc) window.addEventListener("scroll", function () { fc.classList.toggle("show", window.scrollY > 700); }, { passive: true });

  /* ---------- UTM / referral capture (adds lead value) ---------- */
  (function () {
    var q = new URLSearchParams(location.search), a = store.get("ngr-attrib", {});
    ["utm_source", "utm_medium", "utm_campaign", "ref"].forEach(function (k) { if (q.get(k)) a[k] = q.get(k); });
    if (!a.landing) { a.landing = location.pathname; a.referrer = document.referrer || "direct"; }
    store.set("ngr-attrib", a);
  })();

  /* ---------- Cookie consent + AdSense ---------- */
  var consent = store.get("ngr-consent", null), bar = $("#cookieBar");
  if (!consent && bar) bar.hidden = false;
  $$("[data-cookie]").forEach(function (b) { b.addEventListener("click", function () { store.set("ngr-consent", b.dataset.cookie); bar.hidden = true; initAds(); }); });
  var cs = $("#cookieSettings"); if (cs) cs.addEventListener("click", function () { bar.hidden = false; });
  function initAds() {
    var client = C.adsense && C.adsense.client;
    $$("[data-ad]").forEach(function (slot) {
      if (slot.dataset.done) return;
      if (!client) { slot.textContent = "Advertisement"; return; }
      slot.dataset.done = 1; slot.classList.add("live");
      var id = (C.adsense.slots || {})[slot.dataset.ad] || "";
      slot.innerHTML = '<ins class="adsbygoogle" style="display:block" data-ad-client="' + esc(client) + '"' + (id ? ' data-ad-slot="' + esc(id) + '"' : "") + ' data-ad-format="auto" data-full-width-responsive="true"></ins>';
      try { window.adsbygoogle = window.adsbygoogle || []; if (store.get("ngr-consent") === "essential") adsbygoogle.requestNonPersonalizedAds = 1; adsbygoogle.push({}); } catch (e) {}
    });
  }
  initAds();

  /* ---------- Exit-intent (desktop, once per 7 days) ---------- */
  var ex = $("#exitModal");
  function closeModal(m) { m.hidden = true; }
  $$("[data-close]").forEach(function (b) { b.addEventListener("click", function () { closeModal(b.closest(".modal")); }); });
  $$(".modal").forEach(function (m) { m.addEventListener("click", function (e) { if (e.target === m) closeModal(m); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") $$(".modal").forEach(closeModal); });
  if (ex && matchMedia("(pointer:fine)").matches && document.body.dataset.page !== "match") {
    document.addEventListener("mouseout", function h(e) {
      if (e.relatedTarget || e.clientY > 10) return;
      var last = store.get("ngr-exit", 0);
      if (Date.now() - last < 7 * 864e5 || store.get("ngr-subscribed")) return;
      store.set("ngr-exit", Date.now()); ex.hidden = false; track("exit_intent_shown");
      document.removeEventListener("mouseout", h);
    });
  }

  /* ---------- Lead forms (the core of the business) ---------- */
  function validate(form) {
    var ok = true;
    $$("[required]", form).forEach(function (f) {
      var bad = f.type === "checkbox" ? !f.checked : !String(f.value).trim() || (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value));
      f.classList.toggle("invalid", bad); if (bad) ok = false;
    });
    return ok;
  }
  function serialize(form) {
    var o = {}, fd = new FormData(form);
    fd.forEach(function (v, k) { if (v instanceof File) { if (v.name) o[k] = v.name; return; } o[k] = o[k] ? [].concat(o[k], v) : v; });
    return o;
  }
  function sendLead(kind, data) {
    var payload = Object.assign({ form: kind, page: location.pathname, ts: new Date().toISOString() }, store.get("ngr-attrib", {}), data);
    var leads = store.get("ngr-leads", []); leads.push(payload); store.set("ngr-leads", leads.slice(-50));
    track("generate_lead", { form: kind });
    var f = C.forms || {};
    if (!f.endpoint && f.type !== "web3forms") return Promise.resolve(payload);
    var body;
    if (f.type === "web3forms") {
      body = JSON.stringify(Object.assign({ access_key: f.web3formsKey, subject: "NextGR lead: " + kind }, payload));
      return fetch("https://api.web3forms.com/submit", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: body }).then(function () { return payload; }).catch(function () { return payload; });
    }
    if (f.type === "apps-script") {
      return fetch(f.endpoint, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(payload) }).then(function () { return payload; }).catch(function () { return payload; });
    }
    return fetch(f.endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) }).then(function () { return payload; }).catch(function () { return payload; });
  }
  window.NGR.sendLead = sendLead;
  $$("form[data-lead-form]").forEach(function (form) {
    if (!$(".hp", form)) form.insertAdjacentHTML("beforeend", '<input class="hp" type="text" name="company_website" tabindex="-1" autocomplete="off" aria-hidden="true">');
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.dataset.custom) return; // handled by page script
      if (!validate(form)) { toast("Please complete the highlighted fields."); return; }
      var data = serialize(form); if (data.company_website) return; delete data.company_website;
      var btn = $("[type=submit]", form); if (btn) { btn.disabled = true; btn.dataset.t = btn.textContent; btn.textContent = "Sending…"; }
      sendLead(form.dataset.leadForm, data).then(function () {
        if (data.email) store.set("ngr-subscribed", true);
        var msg = form.dataset.success || "You're in! Check your inbox for a confirmation.";
        if (form.dataset.replace !== "false" && form.closest(".form-card, .modal-card")) {
          form.outerHTML = '<div class="success-box"><div class="big">🎉</div><h3>Thank you!</h3><p>' + esc(msg) + "</p></div>";
        } else { form.reset(); if (btn) { btn.disabled = false; btn.textContent = btn.dataset.t; } }
        toast(msg);
        if (form.closest("#exitModal")) setTimeout(function () { ex.hidden = true; }, 1600);
        document.dispatchEvent(new CustomEvent("ngr:lead", { detail: { kind: form.dataset.leadForm, data: data } }));
      });
    });
  });

  /* ---------- Deadlines ---------- */
  function nextDeadline(o) {
    var now = new Date(), y = now.getFullYear(), m = now.getMonth();
    if (o.deadlineMonth === "monthly") return new Date(y, m + 1, 0, 23, 59, 59);
    if (!o.deadlineMonth) return null;
    var d = new Date(y, o.deadlineMonth, 0, 23, 59, 59);
    if (d < now) d = new Date(y + 1, o.deadlineMonth, 0, 23, 59, 59);
    return d;
  }
  function daysLeft(d) { return d ? Math.ceil((d - new Date()) / 864e5) : null; }
  window.NGR.nextDeadline = nextDeadline;

  /* ---------- Opportunity cards ---------- */
  var saved = store.get("ngr-saved", []);
  function oppCard(o) {
    var d = nextDeadline(o), dl = daysLeft(d), isSaved = saved.indexOf(o.id) > -1;
    var dlPill = d === null ? '<span class="pill">Rolling</span>' :
      '<span class="pill ' + (dl <= 21 ? "hot" : dl <= 60 ? "warn" : "") + '" title="Typical deadline — confirm on official site">⏳ ' + (dl <= 60 ? dl + " days left" : d.toLocaleDateString(undefined, { month: "short", year: "numeric" })) + "</span>";
    return '<article class="card hover opp">' +
      '<div class="opp-top"><div><span class="pill brand">' + esc(o.type) + "</span> " + (o.noEssay ? '<span class="pill ok">No essay</span>' : "") + (o.featured ? ' <span class="pill solid">★ NextGR</span>' : "") + "</div>" +
      '<button class="save-btn' + (isSaved ? " saved" : "") + '" data-save="' + esc(o.id) + '" aria-label="Save ' + esc(o.title) + '">' + (isSaved ? "♥" : "♡") + "</button></div>" +
      "<h3>" + esc(o.title) + '</h3><div class="org">' + esc(o.org) + " · " + esc(o.region) + "</div>" +
      '<div class="amount">' + esc(o.amount) + "</div><p>" + esc(o.desc) + "</p>" +
      '<div class="opp-meta">' + o.level.map(function (l) { return '<span class="pill">' + esc(l) + "</span>"; }).join("") + "</div>" +
      '<div class="opp-foot">' + dlPill + '<a class="btn btn-sm btn-ghost" href="' + esc(href(o.url)) + '"' + (/^https?:/.test(o.url) ? ' target="_blank" rel="noopener nofollow"' : "") + ' data-out="' + esc(o.id) + '">View &amp; apply →</a></div></article>';
  }
  window.NGR.oppCard = oppCard;
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-save]"); if (b) {
      var id = b.dataset.save, i = saved.indexOf(id);
      if (i > -1) saved.splice(i, 1); else saved.push(id);
      store.set("ngr-saved", saved); b.classList.toggle("saved", i < 0); b.textContent = i < 0 ? "♥" : "♡";
      toast(i < 0 ? "Saved. Get deadline reminders — join the newsletter below." : "Removed from saved.");
      var sc = $("#savedCount"); if (sc) sc.textContent = saved.length;
    }
    var o = e.target.closest("[data-out]"); if (o) track("outbound_opportunity", { id: o.dataset.out });
    var sh = e.target.closest("[data-share]"); if (sh) {
      var url = sh.dataset.share || location.href;
      if (navigator.share) navigator.share({ title: document.title, url: url }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast("Link copied!"); });
    }
  });
  var opps = D.opportunities || [];
  $$("[data-opps]").forEach(function (el) {
    var mode = el.dataset.opps, list = opps.slice();
    if (mode === "closing") list = list.filter(function (o) { return nextDeadline(o); }).sort(function (a, b) { return nextDeadline(a) - nextDeadline(b); });
    if (mode === "featured") list = list.filter(function (o) { return o.featured; }).concat(list.filter(function (o) { return !o.featured && o.value >= 50000; }));
    if (mode.indexOf("type:") === 0) { var t = mode.slice(5); list = list.filter(function (o) { return o.type === t; }); }
    el.innerHTML = list.slice(0, +(el.dataset.limit || 6)).map(oppCard).join("");
  });
  $$("[data-opp-total]").forEach(function (el) { el.dataset.count = opps.length; el.textContent = opps.length; });

  /* ---------- Opportunities explorer ---------- */
  var ex2 = $("#oppResults");
  if (ex2) {
    var q = new URLSearchParams(location.search), st = { q: q.get("q") || "", type: q.get("type") || "All", level: q.get("level") || "", region: q.get("region") || "", sort: "deadline", noEssay: false, savedOnly: false };
    var inS = $("#fQ"), inL = $("#fLevel"), inR = $("#fRegion"), inSort = $("#fSort"), inNE = $("#fNoEssay"), inSaved = $("#fSaved");
    inS.value = st.q; inL.value = st.level; inR.value = st.region;
    var regions = Array.from(new Set(opps.map(function (o) { return o.region; }))).sort();
    regions.forEach(function (r) { inR.insertAdjacentHTML("beforeend", "<option>" + esc(r) + "</option>"); }); inR.value = st.region;
    function render() {
      var list = opps.filter(function (o) {
        if (st.type !== "All" && o.type !== st.type) return false;
        if (st.level && o.level.indexOf(st.level) < 0) return false;
        if (st.region && o.region !== st.region) return false;
        if (st.noEssay && !o.noEssay) return false;
        if (st.savedOnly && saved.indexOf(o.id) < 0) return false;
        if (st.q) { var hay = (o.title + " " + o.org + " " + o.desc + " " + o.tags.join(" ") + " " + o.field.join(" ")).toLowerCase(); if (st.q.toLowerCase().split(/\s+/).some(function (w) { return hay.indexOf(w) < 0; })) return false; }
        return true;
      });
      list.sort(function (a, b) {
        if (st.sort === "value") return b.value - a.value;
        if (st.sort === "az") return a.title.localeCompare(b.title);
        var da = nextDeadline(a), db = nextDeadline(b); return (da ? da.getTime() : 9e15) - (db ? db.getTime() : 9e15);
      });
      $("#oppCount").textContent = list.length;
      var html = list.map(oppCard);
      if (html.length > 6) html.splice(6, 0, '<div class="ad-slot" data-ad="inContent" style="grid-column:1/-1"></div>');
      ex2.innerHTML = html.join("") || '<div class="empty" style="grid-column:1/-1">No matches. Try fewer filters — or <a href="match.html">get matched</a> and we\'ll email new ones.</div>';
      initAds();
      var u = new URLSearchParams(); if (st.q) u.set("q", st.q); if (st.type !== "All") u.set("type", st.type); if (st.level) u.set("level", st.level); if (st.region) u.set("region", st.region);
      history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u : ""));
    }
    $$("#typeChips .chip").forEach(function (c) {
      c.classList.toggle("on", c.dataset.type === st.type);
      c.addEventListener("click", function () { st.type = c.dataset.type; $$("#typeChips .chip").forEach(function (x) { x.classList.toggle("on", x === c); }); render(); });
    });
    var deb; inS.addEventListener("input", function () { clearTimeout(deb); deb = setTimeout(function () { st.q = inS.value.trim(); render(); }, 150); });
    inL.addEventListener("change", function () { st.level = inL.value; render(); });
    inR.addEventListener("change", function () { st.region = inR.value; render(); });
    inSort.addEventListener("change", function () { st.sort = inSort.value; render(); });
    inNE.addEventListener("change", function () { st.noEssay = inNE.checked; render(); });
    inSaved.addEventListener("change", function () { st.savedOnly = inSaved.checked; render(); });
    $("#savedCount").textContent = saved.length;
    render();
  }

  /* ---------- Hero search ---------- */
  $$("form[data-search]").forEach(function (f) { f.addEventListener("submit", function (e) { e.preventDefault(); location.href = R + "opportunities.html?q=" + encodeURIComponent($("input", f).value); }); });

  /* ---------- Countdowns ---------- */
  function tick() {
    $$("[data-countdown]").forEach(function (el) {
      var end = new Date(el.dataset.countdown), s = Math.max(0, (end - new Date()) / 1000);
      var v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), Math.floor(s % 60)];
      el.innerHTML = ["Days", "Hrs", "Min", "Sec"].map(function (l, i) { return "<div><b>" + String(v[i]).padStart(2, "0") + "</b><small>" + l + "</small></div>"; }).join("");
    });
  }
  function contestEnd(c) {
    var n = new Date(), y = n.getFullYear(), m = n.getMonth();
    if (c.cadence === "monthly") return new Date(y, m + 1, 0, 23, 59, 59);
    if (c.cadence === "quarterly") return new Date(y, Math.floor(m / 3) * 3 + 3, 0, 23, 59, 59);
    return new Date(y, m < 6 ? 6 : 12, 0, 23, 59, 59);
  }
  $$("[data-contests]").forEach(function (el) {
    el.innerHTML = (D.contests || []).slice(0, +(el.dataset.limit || 4)).map(function (c) {
      var prize = c.prizeKey && C[c.prizeKey] ? "$" + C[c.prizeKey].toLocaleString() : c.prize;
      return '<article class="card contest hover" id="c-' + c.id + '"><div class="banner ' + c.banner + '"><span class="pill" style="background:rgba(255,255,255,.2);color:#fff">' + esc(c.cadence) + '</span><div class="prize">' + esc(prize) + "</div><h3>" + esc(c.name) + "</h3></div>" +
        '<div class="body"><p>' + esc(c.desc) + '</p><div class="countdown" data-countdown="' + contestEnd(c).toISOString() + '"></div>' +
        '<ul class="list-plain" style="font-size:.88rem"><li><span class="muted">Who</span><span>' + esc(c.audience) + '</span></li><li><span class="muted">Entry</span><span>' + esc(c.entry) + '</span></li><li><span class="muted">Judging</span><span>' + esc(c.judged) + "</span></li></ul>" +
        '<a class="btn btn-primary btn-block" href="' + R + "contests.html#enter\" data-pick=\"" + c.id + '">' + esc(c.cta) + " →</a></div></article>";
    }).join("");
  });
  tick(); setInterval(tick, 1000);
  document.addEventListener("click", function (e) { var p = e.target.closest("[data-pick]"); if (p) store.set("ngr-pick", p.dataset.pick); });

  /* ---------- Videos (lite embeds: fast pages, better Core Web Vitals) ---------- */
  function videoHTML(v) {
    return '<div><div class="video" data-yt="' + esc(v.id) + '" role="button" tabindex="0" aria-label="Play ' + esc(v.title) + '"><img loading="lazy" src="https://i.ytimg.com/vi/' + esc(v.id) + '/hqdefault.jpg" alt=""><span class="play">▶</span></div><div class="video-meta"><h3>' + esc(v.title) + "</h3><p>" + esc(v.by) + "</p></div></div>";
  }
  $$("[data-videos]").forEach(function (el) {
    var vids = (C.youtube && C.youtube.videos) || [], lim = +(el.dataset.limit || 99);
    function draw(cat) { el.innerHTML = vids.filter(function (v) { return !cat || cat === "All" || v.cat === cat; }).slice(0, lim).map(videoHTML).join(""); }
    draw();
    var tabs = $("#videoTabs");
    if (tabs) {
      ["All"].concat(Array.from(new Set(vids.map(function (v) { return v.cat; })))).forEach(function (c, i) {
        tabs.insertAdjacentHTML("beforeend", '<button class="chip' + (i ? "" : " on") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>");
      });
      tabs.addEventListener("click", function (e) { var b = e.target.closest("[data-cat]"); if (!b) return; $$(".chip", tabs).forEach(function (x) { x.classList.toggle("on", x === b); }); draw(b.dataset.cat); });
    }
  });
  function play(v) { v.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + v.dataset.yt + '?autoplay=1&rel=0" title="YouTube video" allow="accelerometer;autoplay;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>'; track("video_play", { id: v.dataset.yt }); }
  document.addEventListener("click", function (e) { var v = e.target.closest("[data-yt]"); if (v && !$("iframe", v)) play(v); });
  document.addEventListener("keydown", function (e) { var v = e.target.closest && e.target.closest("[data-yt]"); if (v && (e.key === "Enter" || e.key === " ") && !$("iframe", v)) { e.preventDefault(); play(v); } });
  $$("[data-channel]").forEach(function (a) { a.href = (C.youtube && C.youtube.channelUrl) || "#"; });

  /* ---------- Paths, roles, posts ---------- */
  $$("[data-paths]").forEach(function (el) {
    el.innerHTML = (D.paths || []).map(function (p) {
      return '<article class="card path hover"><div style="font-size:2rem">' + p.ico + "</div><h3>" + esc(p.name) + '</h3><div class="opp-meta" style="margin-bottom:10px"><span class="pill brand">⏱ ' + esc(p.time) + '</span><span class="pill ok">' + esc(p.salary) + "</span></div><ol>" +
        p.steps.map(function (s, i) { return '<li><a href="' + esc(href(p.links[i])) + '"' + (/^https?:/.test(p.links[i]) ? ' target="_blank" rel="noopener"' : "") + ">" + esc(s) + "</a></li>"; }).join("") + "</ol></article>";
    }).join("");
  });
  $$("[data-roles]").forEach(function (el) {
    el.innerHTML = (D.roles || []).map(function (r) {
      return '<article class="card hover"><span class="pill brand">' + esc(r.type) + "</span><h3 style=\"margin-top:10px\">" + esc(r.title) + "</h3><p>" + esc(r.desc) + '</p><p class="muted" style="font-size:.88rem">🎁 ' + esc(r.perks) + '</p><a href="#apply" class="btn btn-sm btn-ghost" data-role="' + esc(r.title) + '">Apply →</a></article>';
    }).join("");
    el.addEventListener("click", function (e) { var b = e.target.closest("[data-role]"); if (b) { var s = $("#roleSelect"); if (s) s.value = b.dataset.role; } });
    var s = $("#roleSelect"); if (s) (D.roles || []).forEach(function (r) { s.insertAdjacentHTML("beforeend", "<option>" + esc(r.title) + "</option>"); });
  });
  $$("[data-posts]").forEach(function (el) {
    el.innerHTML = (D.posts || []).map(function (p) {
      return '<a class="card hover" href="' + R + p.url + '" style="color:inherit;text-decoration:none"><span class="pill brand">' + esc(p.cat) + '</span> <span class="pill">' + p.mins + ' min read</span><h3 style="margin-top:12px">' + esc(p.title) + "</h3><p>" + esc(p.desc) + '</p><span style="color:var(--brand);font-weight:600">Read guide →</span></a>';
    }).join("");
  });

  /* ---------- Contest entry form: preselect + referral link ---------- */
  var ce = $("#contestSelect");
  if (ce) {
    (D.contests || []).forEach(function (c) { ce.insertAdjacentHTML("beforeend", '<option value="' + c.id + '">' + esc(c.name) + "</option>"); });
    var pick = store.get("ngr-pick", "") || (location.hash === "#scholarship" ? "scholarship" : "");
    if (pick) ce.value = pick;
    var syncTeam = function () { var t = $("#teamFields"); if (t) t.hidden = ["hackathon", "pitch"].indexOf(ce.value) < 0; var v = $("#linkField"); if (v) v.hidden = ce.value === "scholarship"; };
    ce.addEventListener("change", syncTeam); syncTeam();
  }
  document.addEventListener("ngr:lead", function (e) {
    if (e.detail.kind !== "contest-entry") return;
    var code = (e.detail.data.email || "friend").split("@")[0].replace(/[^a-z0-9]/gi, "").slice(0, 12) + Math.random().toString(36).slice(2, 6);
    var link = location.origin + location.pathname + "?ref=" + code;
    var box = $("#referBox"); if (box) { box.hidden = false; $("#referLink").value = link; }
  });
  var cp = $("#copyRef"); if (cp) cp.addEventListener("click", function () { var i = $("#referLink"); i.select(); try { navigator.clipboard.writeText(i.value); } catch (e) {} toast("Referral link copied — each friend who enters = +1 bonus entry."); });

  /* ---------- Match quiz (lead-gen funnel) ---------- */
  var mf = $("#matchForm");
  if (mf) {
    var steps = $$(".step", mf), cur = 0, bar = $("#stepsBar span"), lbl = $("#stepNum");
    function show(i) {
      cur = i; steps.forEach(function (s, j) { s.classList.toggle("on", j === i); });
      bar.style.width = ((i + 1) / steps.length * 100) + "%"; lbl.textContent = i + 1;
      if (i === 3) computeMatches();
      var top = mf.getBoundingClientRect().top + window.scrollY - 100; if (window.scrollY > top) window.scrollTo({ top: top, behavior: "smooth" });
      track("match_step", { step: i + 1 });
    }
    function stepValid(i) {
      var s = steps[i], radios = $$("input[type=radio]", s), boxes = $$("input[type=checkbox][data-group]", s);
      if (radios.length && !radios.some(function (r) { return r.checked; })) { toast("Pick one option to continue."); return false; }
      if (boxes.length && !boxes.some(function (r) { return r.checked; })) { toast("Pick at least one."); return false; }
      return validate(s);
    }
    $$("[data-next]", mf).forEach(function (b) { b.addEventListener("click", function () { if (stepValid(cur)) show(cur + 1); }); });
    $$("[data-prev]", mf).forEach(function (b) { b.addEventListener("click", function () { show(cur - 1); }); });
    $$("input[type=radio]", mf).forEach(function (r) { r.addEventListener("change", function () { if (r.closest(".step").dataset.auto) setTimeout(function () { show(cur + 1); }, 220); }); });
    var matched = [];
    function computeMatches() {
      var d = serialize(mf), lvl = d.level, goals = [].concat(d.goals || []), ints = [].concat(d.interests || []);
      var typeMap = { scholarships: "Scholarship", internships: "Internship", competitions: "Competition", fellowships: "Fellowship", courses: "Course", funding: "Grant" };
      var fieldMap = { ai: ["AI", "Tech", "Data", "STEM"], tech: ["Tech", "STEM", "AI"], business: ["Business"], science: ["STEM"], impact: ["Social Impact", "Development", "Policy"], creative: ["Any"], health: ["STEM", "Any"] };
      var wantTypes = goals.map(function (g) { return typeMap[g]; }), wantFields = [].concat.apply(["Any"], ints.map(function (i) { return fieldMap[i] || []; }));
      matched = opps.map(function (o) {
        var s = 0;
        if (wantTypes.indexOf(o.type) > -1) s += 3;
        if (lvl && o.level.indexOf(lvl) > -1) s += 3; else if (lvl) s -= 4;
        if (o.field.some(function (f) { return wantFields.indexOf(f) > -1; })) s += 2;
        if (o.featured) s += 2; if (o.noEssay) s += 1;
        if (d.region && (o.region === d.region || o.region === "Global" || o.region === "Online")) s += 1;
        return { o: o, s: s };
      }).filter(function (x) { return x.s >= 4; }).sort(function (a, b) { return b.s - a.s; }).map(function (x) { return x.o; });
      var total = matched.reduce(function (a, o) { return a + (o.value || 0); }, 0);
      $("#matchCount").textContent = matched.length;
      $("#matchValue").textContent = "$" + total.toLocaleString();
      $("#matchPreview").innerHTML = matched.slice(0, 3).map(oppCard).join("");
    }
    mf.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!stepValid(cur)) return;
      var data = serialize(mf); if (data.company_website) return; delete data.company_website;
      data.matches = matched.length;
      var btn = $("[type=submit]", mf); btn.disabled = true; btn.textContent = "Unlocking…";
      sendLead("match-profile", data).then(function () {
        store.set("ngr-subscribed", true); store.set("ngr-profile", { level: data.level, goals: data.goals, interests: data.interests });
        $("#matchWrap").hidden = true; var res = $("#matchResults"); res.hidden = false;
        $("#resName").textContent = (data.first_name || "there");
        $("#resList").innerHTML = matched.map(oppCard).join("") || '<div class="empty">We\'ll email your matches as new programs open.</div>';
        window.scrollTo({ top: res.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" });
        track("match_complete", { matches: matched.length });
      });
    });
    show(0);
  }

  /* ---------- Donate ---------- */
  var dn = $("#donateBox");
  if (dn) {
    var dc = C.donate || {}, amt = 25, freq = "once";
    var pct = dc.goal ? Math.min(100, (dc.raised || 0) / dc.goal * 100) : 0;
    $("#goalBar").style.width = Math.max(pct, 2) + "%";
    $("#goalText").textContent = "$" + (dc.raised || 0).toLocaleString() + " raised of $" + (dc.goal || 0).toLocaleString() + " goal";
    function impact() {
      var a = amt || 0, msg;
      if (a >= (C.scholarshipPrize || 1000)) msg = "funds a full NextGR No-Essay Scholarship for a student";
      else if (a >= 100) msg = "helps fund a contest prize for a young builder or creator";
      else if (a >= 25) msg = "helps cover hosting, tools and verification of new listings";
      else msg = "helps keep NextGR free and ad-light for students";
      $("#impactText").textContent = "$" + a.toLocaleString() + (freq === "monthly" ? "/month " : " ") + msg + ".";
      $("#donateAmt").value = a; $("#donateFreq").value = freq;
    }
    $$(".tier", dn).forEach(function (t) { t.addEventListener("click", function () { $$(".tier", dn).forEach(function (x) { x.classList.toggle("on", x === t); }); amt = +t.dataset.amt; $("#customAmt").value = ""; impact(); }); });
    $("#customAmt").addEventListener("input", function (e) { amt = Math.max(0, +e.target.value || 0); $$(".tier", dn).forEach(function (x) { x.classList.remove("on"); }); impact(); });
    $$("#freqToggle button").forEach(function (b) { b.addEventListener("click", function () { $$("#freqToggle button").forEach(function (x) { x.classList.toggle("on", x === b); }); freq = b.dataset.freq; impact(); }); });
    var links = { paypal: dc.paypal, stripe: dc.stripe, bmc: dc.buymeacoffee, kofi: dc.kofi, gh: dc.githubSponsors };
    $$("[data-pay]", dn).forEach(function (a) {
      var u = links[a.dataset.pay]; if (!u) { a.remove(); return; }
      a.href = u; a.target = "_blank"; a.rel = "noopener";
      a.addEventListener("click", function () {
        var f = $("#donorForm"), d = serialize(f); delete d.company_website;
        d.method = a.dataset.pay; d.amount = amt; d.frequency = freq;
        if (d.email) sendLead("donation-intent", d);
        track("donate_click", { method: a.dataset.pay, value: amt });
      });
    });
    impact();
  }

  /* ---------- Tools: ROI calculator ---------- */
  var roi = $("#roiForm");
  if (roi) {
    function calc() {
      var cost = +$("#rCost").value || 0, hrs = +$("#rHours").value || 0, wk = +$("#rWeekly").value || 1, now = +$("#rNow").value || 0, after = +$("#rAfter").value || 0;
      var weeks = Math.ceil(hrs / wk), gain = Math.max(0, after - now), monthly = gain / 12, payback = monthly ? cost / monthly : Infinity, fiveYr = gain * 5 - cost;
      $("#oWeeks").textContent = weeks + " weeks";
      $("#oGain").textContent = "$" + Math.round(gain).toLocaleString() + "/yr";
      $("#oPayback").textContent = isFinite(payback) ? (payback < 1 ? "< 1 month" : payback.toFixed(1) + " months") : "—";
      $("#oFive").textContent = "$" + Math.round(fiveYr).toLocaleString();
      $("#oROI").textContent = cost ? Math.round(fiveYr / cost * 100).toLocaleString() + "%" : "∞ (free course)";
    }
    $$("input", roi).forEach(function (i) { i.addEventListener("input", calc); }); calc();
  }

  /* ---------- Tools: career quiz ---------- */
  var cq = $("#careerQuiz");
  if (cq) {
    cq.addEventListener("submit", function (e) {
      e.preventDefault();
      var score = {}, fd = new FormData(cq), n = 0;
      fd.forEach(function (v) { if (!v) return; n++; v.split(",").forEach(function (k) { score[k] = (score[k] || 0) + 1; }); });
      if (n < 6) { toast("Answer all 6 questions for an accurate result."); return; }
      var best = Object.keys(score).sort(function (a, b) { return score[b] - score[a]; })[0];
      var p = (D.paths || []).filter(function (x) { return x.name === best; })[0] || D.paths[0];
      var box = $("#careerResult"); box.hidden = false;
      box.innerHTML = '<p class="eyebrow">Your future-proof path</p><h3>' + p.ico + " " + esc(p.name) + '</h3><p>Start with these steps (' + esc(p.time) + "):</p><ol>" + p.steps.map(function (s, i) { return '<li><a href="' + esc(href(p.links[i])) + '" target="_blank" rel="noopener">' + esc(s) + "</a></li>"; }).join("") + '</ol><a class="btn btn-primary" href="' + R + 'match.html">Get matched to programs for this path →</a> <button class="btn btn-ghost" data-share="' + esc(location.href) + '" type="button">Share result</button>';
      track("career_quiz_complete", { path: p.name });
    });
  }

  /* ---------- Tools: deadline planner + .ics export ---------- */
  var dp = $("#plannerForm");
  if (dp) {
    var items = store.get("ngr-planner", []);
    var sel = $("#plannerPick");
    opps.filter(function (o) { return nextDeadline(o); }).forEach(function (o) { sel.insertAdjacentHTML("beforeend", '<option value="' + o.id + '">' + esc(o.title) + "</option>"); });
    sel.addEventListener("change", function () { var o = opps.filter(function (x) { return x.id === sel.value; })[0]; if (!o) return; $("#pName").value = o.title; $("#pDate").value = nextDeadline(o).toISOString().slice(0, 10); });
    function draw() {
      items.sort(function (a, b) { return a.date.localeCompare(b.date); });
      $("#plannerList").innerHTML = items.map(function (it, i) {
        var dl = daysLeft(new Date(it.date + "T23:59:59"));
        return "<li><span><strong>" + esc(it.name) + '</strong><br><span class="muted" style="font-size:.85rem">' + esc(it.date) + '</span></span><span><span class="pill ' + (dl <= 14 ? "hot" : dl <= 45 ? "warn" : "ok") + '">' + (dl < 0 ? "passed" : dl + " days") + '</span> <button class="linklike" data-del="' + i + '" aria-label="Remove">✕</button></span></li>';
      }).join("") || '<li class="muted">No deadlines yet — add your first above.</li>';
      store.set("ngr-planner", items);
    }
    dp.addEventListener("submit", function (e) { e.preventDefault(); var n = $("#pName").value.trim(), d = $("#pDate").value; if (!n || !d) { toast("Add a name and a date."); return; } items.push({ name: n, date: d }); dp.reset(); draw(); toast("Deadline added."); });
    $("#plannerList").addEventListener("click", function (e) { var b = e.target.closest("[data-del]"); if (b) { items.splice(+b.dataset.del, 1); draw(); } });
    $("#icsBtn").addEventListener("click", function () {
      if (!items.length) { toast("Add at least one deadline first."); return; }
      var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//NextGR//Deadline Planner//EN"];
      items.forEach(function (it, i) {
        var d = it.date.replace(/-/g, ""), rem = new Date(it.date); rem.setDate(rem.getDate() - 7);
        lines.push("BEGIN:VEVENT", "UID:ngr-" + i + "-" + d + "@nextgr.com", "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z", "DTSTART;VALUE=DATE:" + d, "SUMMARY:Deadline: " + it.name.replace(/[,;]/g, " "), "DESCRIPTION:Tracked with NextGR.com", "BEGIN:VALARM", "TRIGGER:-P7D", "ACTION:DISPLAY", "DESCRIPTION:7 days left", "END:VALARM", "END:VEVENT");
      });
      lines.push("END:VCALENDAR");
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" })); a.download = "nextgr-deadlines.ics"; a.click();
      track("ics_export", { n: items.length });
    });
    draw();
  }

  /* ---------- Year + misc ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  $$("[data-month]").forEach(function (el) { el.textContent = new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" }); });
})();
