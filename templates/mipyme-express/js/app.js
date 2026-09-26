// ─── app.js — Cabaña del Árbol ────────────────────────────────────────────
// UI interactions: navbar scroll state, scroll reveal, gallery lightbox
// (el banner/pantalla de demo vive en js/demo.js)

document.addEventListener("DOMContentLoaded", function () {
  // ── 1. Navbar scroll state ─────────────────────────────────────────────
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle("scrolled", window.scrollY > 50);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ── 2. Scroll Reveal (IntersectionObserver) ────────────────────────────
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));
  }

  // ── 3. Gallery: simple lightbox (native <dialog>) ──────────────────────
  const galleryItems = document.querySelectorAll(".gallery-item");
  const dialog = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxClose = document.getElementById("lightbox-close");

  if (dialog && lightboxImg) {
    galleryItems.forEach((item) => {
      item.addEventListener("click", () => {
        const img = item.querySelector("img");
        if (img) {
          lightboxImg.src = img.src;
          lightboxImg.alt = img.alt;
          dialog.showModal();
        }
      });
    });

    lightboxClose &&
      lightboxClose.addEventListener("click", () => dialog.close());

    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && dialog.open) dialog.close();
    });
  }

  // ── 4. Smooth-scroll for in-page anchors ───────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // ── 5. Hero parallax (subtle, desktop only) ────────────────────────────
  const heroImg = document.querySelector(".hero-main-img");
  if (heroImg && window.matchMedia("(min-width: 1024px)").matches) {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!prefersReduced) {
      window.addEventListener(
        "scroll",
        () => {
          const y = window.scrollY;
          if (y < window.innerHeight) {
            heroImg.style.transform = `scale(1.04) translateY(${y * 0.06}px)`;
          }
        },
        { passive: true }
      );
    }
  }
});
