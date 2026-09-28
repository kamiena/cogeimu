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
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    document.querySelectorAll(".nav__links a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("menu-open");
        menuBtn.setAttribute("aria-expanded", "false");
      });
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


  // ---- "into her eye" transition ------------------------------------------
  // Work cards carry data-eye="x y" (the eye position, % of the image).
  // On click we zoom into that eye, fade into the world inside it, then load
  // the work page, which fades the same image out (see html.eye-enter in CSS).
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("a[data-eye]").forEach(function (a) {
    var inside = new URL(a.getAttribute("data-eye-inside"), location.href).href;
    var color = a.getAttribute("data-eye-color") || "#000";
    a.addEventListener("pointerenter", function () {
      if (a._prefetched) return;
      a._prefetched = true;
      var l = document.createElement("link"); l.rel = "prefetch"; l.href = a.href; document.head.appendChild(l);
      new Image().src = inside;
    });
    a.addEventListener("click", function (ev) {
      if (reduceMotion || !a.animate || ev.defaultPrevented || ev.button !== 0 ||
          ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      var img = a.querySelector("img");
      if (!img || !img.complete) return;
      ev.preventDefault();

      var r = img.getBoundingClientRect();
      var p = a.getAttribute("data-eye").split(/\s+/).map(Number);
      var ox = r.width * p[0] / 100, oy = r.height * p[1] / 100;
      var dx = innerWidth / 2 - (r.left + ox), dy = innerHeight / 2 - (r.top + oy);
      var scale = Math.max(innerWidth, innerHeight) * 1.8 / (r.width * 0.19);

      var ov = document.createElement("div");
      ov.className = "eye-zoom";
      var clone = document.createElement("img");
      clone.className = "eye-zoom__img";
      clone.src = img.currentSrc || img.src;
      clone.alt = "";
      clone.style.cssText = "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height +
        "px;object-fit:cover;transform-origin:" + ox + "px " + oy + "px";
      var world = document.createElement("div");
      world.className = "eye-zoom__inside";
      world.style.backgroundImage = 'url("' + inside + '")';
      world.style.backgroundColor = color;
      ov.appendChild(clone);
      ov.appendChild(world);
      document.body.appendChild(ov);

      var dur = 1400;
      ov.animate([{ backgroundColor: "rgba(10,10,11,0)" }, { backgroundColor: "rgba(10,10,11,1)" }],
        { duration: 500, fill: "forwards" });
      var zoom = clone.animate([
        { transform: "translate(0,0) scale(1)" },
        { transform: "translate(" + dx + "px," + dy + "px) scale(1.8)", offset: 0.3 },
        { transform: "translate(" + dx + "px," + dy + "px) scale(" + scale + ")" }
      ], { duration: dur, easing: "cubic-bezier(0.55, 0, 0.8, 0.3)", fill: "forwards" });
      world.animate([{ opacity: 0 }, { opacity: 0, offset: 0.62 }, { opacity: 1 }],
        { duration: dur, fill: "forwards" });

      try { sessionStorage.setItem("cogeimu-eye", JSON.stringify({ img: inside, color: color })); } catch (e) { /* ignore */ }
      var went = false;
      var go = function () { if (!went) { went = true; location.href = a.href; } };
      zoom.onfinish = go;
      setTimeout(go, dur + 400);
    });
  });
  // Coming back with the browser's back button restores the old page as-is.
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) document.querySelectorAll(".eye-zoom").forEach(function (n) { n.remove(); });
  });

  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
