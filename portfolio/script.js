/* =========================================================
   Aman — portfolio script
   Small, dependency-free helpers. The page works without JS;
   this only adds the menu toggle, active nav link, waveform
   and the email-draft form.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector(".nav__toggle");
  const links = document.getElementById("nav-links");

  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    links.classList.toggle("is-open", open);
  }

  toggle.addEventListener("click", () => {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });

  // Close the menu after choosing a link, or with Escape
  links.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && links.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  /* ---------- Navbar border once the page scrolls ---------- */
  const header = document.querySelector(".site-header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Highlight the nav link for the section in view ---------- */
  const navLinks = [...links.querySelectorAll("a")];
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((a) => {
            const active = a.getAttribute("href") === "#" + entry.target.id;
            a.classList.toggle("is-active", active);
            if (active) a.setAttribute("aria-current", "true");
            else a.removeAttribute("aria-current");
          });
        });
      },
      // A section counts as "in view" when it crosses the middle of the screen
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
  }

  /* ---------- Hero waveform ---------- */
  // Heights come from layered sine waves, so the shape is the same on every load.
  const wave = document.querySelector(".wave");
  if (wave) {
    const count = window.innerWidth < 800 ? 56 : 96;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const envelope = Math.sin(Math.PI * t) * 0.75 + 0.25;
      const ripple = Math.abs(Math.sin(i * 0.55) * 0.6 + Math.sin(i * 1.7) * 0.4);
      const h = Math.max(6, Math.round(envelope * (30 + ripple * 70)));
      const bar = document.createElement("span");
      bar.style.setProperty("--h", h);
      bar.style.setProperty("--i", i);
      bar.style.setProperty("--p", Math.round(t * 100));
      frag.appendChild(bar);
    }
    wave.appendChild(frag);
  }

  /* ---------- Contact form: open an email draft ---------- */
  const EMAIL = "aman.c26417@nst.rishihood.edu.in";
  const form = document.getElementById("contact-form");
  const error = document.getElementById("cf-error");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.elements.name;
    const message = form.elements.message;

    // Mark empty fields and say which ones need filling in
    const missing = [];
    [name, message].forEach((field) => {
      const empty = !field.value.trim();
      field.setAttribute("aria-invalid", String(empty));
      if (empty) missing.push(field.labels[0].textContent.toLowerCase());
    });

    if (missing.length) {
      error.textContent = "Add " + missing.join(" and ") + " to write the email.";
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }

    error.textContent = "";
    const subject = "Hello from " + name.value.trim();
    window.location.href =
      "mailto:" + EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(message.value.trim());
  });

  /* ---------- Footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
