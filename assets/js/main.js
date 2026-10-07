/* PRJ CÔGEIMU — language toggle, header state, mobile menu, reveal on scroll */
(function () {
  var root = document.documentElement;
  root.classList.add("js");

  // ---- language ---------------------------------------------------------
  // Pages are written in Japanese and English (<span lang="ja"> / <span lang="en"> pairs).
  // Seven more languages swap each English string for its translation from assets/i18n/<lang>.json
  // (keyed by the English text itself); a string without a translation simply stays in English.
  var KEY = "cogeimu-lang";
  var LANGS = {
    ja: ["JP", "日本語"], en: ["EN", "English"],
    fr: ["FR", "Français"], it: ["IT", "Italiano"], es: ["ES", "Español"], de: ["DE", "Deutsch"],
    ko: ["KO", "한국어"], "zh-Hans": ["简", "简体中文"], "zh-Hant": ["繁", "繁體中文"]
  };
  var MORE = ["fr", "it", "es", "de", "ko", "zh-Hans", "zh-Hant"];
  var FONTS = { ko: "KR", "zh-Hans": "SC", "zh-Hant": "TC" };
  var me = document.currentScript;
  var I18N = me && me.src ? me.src.replace(/js\/main\.js(\?.*)?$/, function (m, q) { return "i18n/@.json" + (q || ""); }) : "";
  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function store(v) {
    try { localStorage.setItem(KEY, v); } catch (e) { /* private mode etc. */ }
  }
  // "fr-CA" → "fr", "zh-TW" → "zh-Hant"; null when the site has no such language
  function pick(tag) {
    tag = String(tag || "").toLowerCase();
    if (/^zh\b/.test(tag)) return /hant|-(tw|hk|mo)\b/.test(tag) ? "zh-Hant" : "zh-Hans";
    tag = tag.split(/[-_]/)[0];
    return LANGS[tag] ? tag : null;
  }
  function initialLang() {
    var q = pick(new URLSearchParams(location.search).get("lang"));
    if (q) return q;
    var s = pick(stored());
    if (s) return s;
    // search engine robots browse in English; show them the Japanese page (the site's main language)
    if (/bot|crawl|spider|slurp|Google-InspectionTool|Lighthouse/i.test(navigator.userAgent || "")) return "ja";
    var prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    for (var i = 0; i < prefs.length; i++) { var p = pick(prefs[i]); if (p) return p; }
    return "en";
  }

  var dicts = {}, caught = [];
  var norm = function (t) { return String(t || "").replace(/[\s​﻿]+/g, " ").trim(); };
  // remember every English string as written (the first time it is seen), to put it back later
  function catchAll(scope) {
    (scope || document.body).querySelectorAll('[lang="en"]').forEach(function (el) {
      if (el._i18n || (el.parentElement && el.parentElement.closest('[lang="en"], [data-i18n]'))) return;
      el._i18n = { html: el.innerHTML, key: norm(el.textContent) };
      el.setAttribute("data-i18n", "");
      caught.push(el);
    });
  }
  function translate(scope) {
    var lang = root.lang, d = dicts[lang];
    catchAll(scope);
    caught.forEach(function (el) {
      var o = el._i18n, t = d && d[o.key];
      // (setAttribute, not .lang: the labels in the diagrams are SVG)
      if (t) { el.innerHTML = t; el.setAttribute("lang", lang); }
      else if (el.getAttribute("lang") !== "en") { el.innerHTML = o.html; el.setAttribute("lang", "en"); }
    });
    var tr = function (en) { return (d && d[norm(en)]) || en; };
    var t = root.getAttribute("data-title-" + lang) || tr(root.getAttribute("data-title-en"));
    if (t) document.title = t;
    document.querySelectorAll("[data-alt-en]").forEach(function (el) {
      el.alt = el.getAttribute("data-alt-" + lang) || tr(el.getAttribute("data-alt-en"));
    });
  }
  function loadFonts(lang) {
    var f = FONTS[lang], id = "font-" + lang;
    if (!f || document.getElementById(id)) return;
    var l = document.createElement("link");
    l.id = id; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+" + f + ":wght@400;500&family=Noto+Serif+" + f + ":wght@400;500&display=swap";
    document.head.appendChild(l);
  }
  function setLang(lang) {
    root.lang = lang;
    loadFonts(lang);
    document.querySelectorAll(".lang-toggle > button[data-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
    });
    document.querySelectorAll(".lang-toggle__more").forEach(function (b) {
      var on = MORE.indexOf(lang) >= 0;
      b.classList.toggle("is-on", on);
      b.querySelector(".lang-toggle__code").textContent = on ? LANGS[lang][b.closest(".lang-toggle--big") ? 1 : 0] : "";
    });
    document.querySelectorAll(".lang-menu button").forEach(function (b) {
      b.setAttribute("aria-current", String(b.dataset.lang === lang));
    });
    if (lang === "ja" || lang === "en" || dicts[lang]) { translate(); return; }
    translate(); // English for now
    if (!I18N || !window.fetch) return;
    fetch(I18N.replace("@", lang))
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) { dicts[lang] = d; if (root.lang === lang) translate(); })
      .catch(function () { /* stays in English */ })
      .then(function () { root.classList.remove("i18n-wait"); });
  }

  // the switch: JP and EN as before, then one more button that opens the other languages
  var GLOBE = '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.1"><circle cx="8" cy="8" r="6.5"/><ellipse cx="8" cy="8" rx="2.8" ry="6.5"/><path d="M1.5 8h13M2.6 4.6h10.8M2.6 11.4h10.8"/></svg>';
  document.querySelectorAll(".lang-toggle").forEach(function (box) {
    var more = document.createElement("button");
    more.type = "button";
    more.className = "lang-toggle__more";
    more.setAttribute("aria-label", "Other languages");
    more.setAttribute("aria-expanded", "false");
    more.innerHTML = GLOBE + '<span class="lang-toggle__code"></span>';
    var menu = document.createElement("div");
    menu.className = "lang-menu";
    menu.hidden = true;
    MORE.forEach(function (code) {
      var b = document.createElement("button");
      b.type = "button";
      b.dataset.lang = code;
      b.lang = code;
      b.textContent = LANGS[code][1];
      menu.appendChild(b);
    });
    box.appendChild(more);
    box.appendChild(menu);
  });
  function closeMenus(except) {
    document.querySelectorAll(".lang-menu").forEach(function (m) {
      if (m === except) return;
      m.hidden = true;
      m.previousElementSibling.setAttribute("aria-expanded", "false");
    });
  }

  var first = initialLang();
  if (MORE.indexOf(first) >= 0) {
    root.classList.add("i18n-wait");
    setTimeout(function () { root.classList.remove("i18n-wait"); }, 1500);
  }
  setLang(first);
  document.addEventListener("click", function (e) {
    var more = e.target.closest(".lang-toggle__more");
    if (more) {
      var m = more.nextElementSibling;
      closeMenus(m);
      m.hidden = !m.hidden;
      more.setAttribute("aria-expanded", String(!m.hidden));
      return;
    }
    var b = e.target.closest(".lang-toggle button[data-lang]");
    if (!e.target.closest(".lang-menu")) closeMenus();
    if (!b) return;
    closeMenus();
    setLang(b.dataset.lang);
    store(b.dataset.lang);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenus();
  });

  // ---- header / menu ----------------------------------------------------
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var menuBtn = document.querySelector(".menu-btn");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    document.documentElement.classList.toggle("no-scroll", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  }
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      setMenu(!document.body.classList.contains("menu-open"));
    });
    document.querySelectorAll(".nav__links a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  // ---- notes: the second layer of a work page ----------------------------
  // The page itself stays short; each note (#sculpture, #gameplay ...) opens
  // over it. Without JS the notes simply follow the page as normal sections.
  var notesEl = document.querySelector(".notes");
  if (notesEl) {
    var noteItems = Array.prototype.slice.call(notesEl.querySelectorAll(".notes__item"));
    var ids = noteItems.map(function (n) { return n.id; });
    var crumb = notesEl.querySelector(".notes__crumb-label");
    var closeBtn = notesEl.querySelector(".notes__close");
    var opener = null, pushed = false;

    notesEl.setAttribute("role", "dialog");
    notesEl.setAttribute("aria-modal", "true");
    notesEl.setAttribute("aria-hidden", "true");

    // previous / next note at the foot of each one
    noteItems.forEach(function (n, i) {
      if (noteItems.length < 2) return;
      var nav = document.createElement("nav");
      nav.className = "note-nav";
      nav.setAttribute("aria-label", "Notes");
      [noteItems[i - 1], noteItems[i + 1]].forEach(function (t, k) {
        if (!t) { nav.appendChild(document.createElement("span")); return; }
        var a = document.createElement("a");
        a.href = "#" + t.id;
        if (k === 1) a.className = "note-nav__next";
        var title = t.querySelector("h2").innerHTML.replace(/<br[^>]*>/g, "");
        a.innerHTML = "<small>" + (k === 0 ? "← " : "") + t.getAttribute("data-label") + (k === 1 ? " →" : "") + "</small><span>" + title + "</span>";
        nav.appendChild(a);
      });
      var wraps = n.querySelectorAll(".wrap");
      wraps[wraps.length - 1].appendChild(nav);
    });

    var show = function (id) {
      var found = false;
      noteItems.forEach(function (n) {
        var on = n.id === id;
        n.hidden = !on;
        if (on) { found = true; if (crumb) crumb.textContent = n.getAttribute("data-label"); }
      });
      if (!found) return;
      notesEl.classList.add("is-open");
      notesEl.setAttribute("aria-hidden", "false");
      root.classList.add("no-scroll");
      notesEl.scrollTop = 0;
      if (closeBtn) closeBtn.focus({ preventScroll: true });
    };
    var hide = function () {
      notesEl.classList.remove("is-open");
      notesEl.setAttribute("aria-hidden", "true");
      root.classList.remove("no-scroll");
      pushed = false;
      if (opener) { opener.focus({ preventScroll: true }); opener = null; }
    };
    var route = function () {
      var id = decodeURIComponent(location.hash.slice(1));
      if (ids.indexOf(id) >= 0) show(id);
      else if (notesEl.classList.contains("is-open")) hide();
    };
    var close = function () {
      if (pushed) { history.back(); return; }
      history.replaceState(null, "", location.pathname + location.search);
      hide();
    };

    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href").slice(1);
      if (ids.indexOf(id) < 0) return;
      e.preventDefault();
      if (notesEl.classList.contains("is-open")) {
        history.replaceState({ note: id }, "", "#" + id);
      } else {
        opener = a;
        history.pushState({ note: id }, "", "#" + id);
        pushed = true;
      }
      show(id);
    });
    if (closeBtn) closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && notesEl.classList.contains("is-open")) close();
    });
    window.addEventListener("popstate", route);
    route();
  }

  // ---- Japanese line breaking ---------------------------------------------
  // BudouX inserts break opportunities between natural phrases so Japanese
  // text never wraps in the middle of a word (e.g. a lone "る。" on its own line).
  if (window.budouxJa) {
    document.querySelectorAll("main, footer").forEach(function (el) {
      try { window.budouxJa.applyToElement(el); } catch (e) { /* keep default wrapping */ }
    });
  }

  // ---- reveal -----------------------------------------------------------
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }


  // ---- share: copy the hashtags ------------------------------------------
  // X takes hashtags in its post link; Instagram cannot pre-fill a caption,
  // so its button copies them first and then opens Instagram as a normal link.
  var copyText = function (text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, ng) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", "");
      ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy") ? ok() : ng(); } catch (err) { ng(err); }
      document.body.removeChild(ta);
    });
  };
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-share-copy]");
    if (!el) return;
    var box = el.closest("[data-share]");
    var tags = box ? box.getAttribute("data-share-tags") : "";
    var status = document.querySelector("[data-share-status]");
    copyText(tags).then(function () {
      if (status) { status.innerHTML = '<span lang="ja">ハッシュタグをコピーしました：</span><span lang="en">Hashtags copied:&nbsp;</span>' + tags; translate(status); }
    }, function () {
      if (status) { status.innerHTML = '<span lang="ja">コピーできませんでした。ハッシュタグを長押ししてコピーしてください。</span><span lang="en">Couldn’t copy. Press and hold the hashtags to copy them.</span>'; translate(status); }
    });
  });

  // ---- visitor count (a Google Apps Script web app in the project owner's Google account) ----
  // The script keeps one number: "?hit=1" adds one and returns it, a plain call only returns it.
  // Each browser is counted once a day, on whichever page it opens first; the total shows in the home footer.
  // The hit also says where the visitor came from (the script logs it to a spreadsheet):
  // ?from=… on the link wins, then the referrer's site; no referrer on the how-to-play page is most likely the QR code.
  // Paste the web app URL (https://script.google.com/macros/s/…/exec) below.
  // Left empty, nothing is sent and the counter stays hidden.
  var COUNTER_URL = "https://script.google.com/macros/s/AKfycby8Zj10nqZTJkvCth7UsnDoGAbBUBR1isBUNoeLz3i5ebUau0gYp39IwF8Z4RwlHo88/exec";
  if (COUNTER_URL && window.fetch) {
    var counter = document.querySelector("[data-visit-counter]");
    var num = counter && counter.querySelector("[data-visit-count]");
    var d0 = new Date();
    var today = d0.getFullYear() + "-" + (d0.getMonth() + 1) + "-" + d0.getDate();
    var lastVisit = null;
    try { lastVisit = localStorage.getItem("cogeimu-visit"); } catch (err) { /* private mode */ }
    var hit = lastVisit !== today;
    var visitSource = function () {
      var from = "", host = "";
      try { from = new URLSearchParams(location.search).get("from") || ""; } catch (err) { /* old browser */ }
      try { host = document.referrer ? new URL(document.referrer).hostname : ""; } catch (err) { /* bad referrer */ }
      var via = [
        [/^(t\.co|(.+\.)?x\.com|(.+\.)?twitter\.com)$/, "X"],
        [/(^|\.)instagram\.com$/, "Instagram"],
        [/(^|\.)facebook\.com$/, "Facebook"],
        [/(^|\.)youtube\.com$/, "YouTube"],
        [/(^|\.)line\.me$/, "LINE"],
        [/(^|\.)google\./, "Google"],
        [/(^|\.)(bing\.com|yahoo\.co\.jp|yahoo\.com|duckduckgo\.com)$/, "検索（Google 以外）"],
        [/(^|\.)arsobit\.com$/, "ars●bit"]
      ];
      var label = from;
      if (!label && host === location.hostname) label = "サイト内";
      for (var i = 0; !label && host && i < via.length; i++) if (via[i][0].test(host)) label = via[i][1];
      if (!label) label = host || (/\/play\//.test(location.pathname) ? "QR（推定）" : "直接・不明");
      return "&via=" + encodeURIComponent(label) + "&ref=" + encodeURIComponent(host) +
        "&page=" + encodeURIComponent(location.pathname.replace(/^\/cogeimu/, "") || "/") +
        "&lang=" + encodeURIComponent(navigator.language || "");
    };
    if (hit || num) {
      fetch(COUNTER_URL + (hit ? "?hit=1" + visitSource() : ""), { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function (d) {
          if (hit) { try { localStorage.setItem("cogeimu-visit", today); } catch (err) { /* ignore */ } }
          var total = parseInt(d.count, 10);
          if (!num || !total) return;
          counter.hidden = false;
          var fmt = function (n) { return n.toLocaleString("en-US"); };
          var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
          if (reduce || !("IntersectionObserver" in window)) { num.textContent = fmt(total); return; }
          num.textContent = fmt(0);
          // count up once the footer comes into view
          var seen = new IntersectionObserver(function (es) {
            if (!es[0].isIntersecting) return;
            seen.disconnect();
            var t0 = null, dur = 1600;
            var step = function (t) {
              if (t0 === null) t0 = t;
              var k = Math.min(1, (t - t0) / dur);
              num.textContent = fmt(Math.round(total * (1 - Math.pow(1 - k, 3))));
              if (k < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          });
          seen.observe(counter);
        })
        .catch(function () { /* counter stays hidden */ });
    }
  }

  // ---- scheduled entrances: a news row (or post-nav link) written as
  // <li hidden data-reveal="2026-10-08T19:50:00+09:00"> stays hidden until that moment,
  // then appears by itself (also on a page that is already open)
  var timed = document.querySelectorAll("[data-reveal]");
  if (timed.length) {
    var showDue = function () {
      var now = Date.now(), waiting = 0;
      timed.forEach(function (el) {
        var t = Date.parse(el.getAttribute("data-reveal"));
        if (!isNaN(t) && now >= t) { el.hidden = false; } else { waiting++; }
      });
      return waiting;
    };
    if (showDue()) {
      var tick = setInterval(function () { if (!showDue()) clearInterval(tick); }, 20000);
    }
  }

  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
