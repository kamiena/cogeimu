/* PRJ CÔGEIMU — language toggle, header state, mobile menu, reveal on scroll */
(function () {
  var root = document.documentElement;
  root.classList.add("js");

  // ---- language ---------------------------------------------------------
  var KEY = "cogeimu-lang";
  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function store(v) {
    try { localStorage.setItem(KEY, v); } catch (e) { /* private mode etc. */ }
  }
  function initialLang() {
    var q = new URLSearchParams(location.search).get("lang");
    if (q === "ja" || q === "en") return q;
    var s = stored();
    if (s === "ja" || s === "en") return s;
    // search engine robots browse in English; show them the Japanese page (the site's main language)
    if (/bot|crawl|spider|slurp|Google-InspectionTool|Lighthouse/i.test(navigator.userAgent || "")) return "ja";
    return /^ja\b/i.test(navigator.language || "") ? "ja" : "en";
  }
  function setLang(lang) {
    root.lang = lang;
    var t = root.getAttribute("data-title-" + lang);
    if (t) document.title = t;
    document.querySelectorAll("[data-alt-" + lang + "]").forEach(function (el) {
      el.alt = el.getAttribute("data-alt-" + lang);
    });
    document.querySelectorAll(".lang-toggle button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
    });
  }
  setLang(initialLang());
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".lang-toggle button");
    if (!b) return;
    setLang(b.dataset.lang);
    store(b.dataset.lang);
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
      if (status) status.innerHTML = '<span lang="ja">ハッシュタグをコピーしました：' + tags + '</span><span lang="en">Hashtags copied: ' + tags + "</span>";
    }, function () {
      if (status) status.innerHTML = '<span lang="ja">コピーできませんでした。ハッシュタグを長押ししてコピーしてください。</span><span lang="en">Couldn’t copy. Press and hold the hashtags to copy them.</span>';
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

  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
