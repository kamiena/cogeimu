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


  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
