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
