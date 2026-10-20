// COOLCARE: small progressive enhancements. Every section, link and photo
// works without this file; it only adds the phone menu, the header's scrolled
// state, the active section in the navigation, soft reveals and photo fades.

(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Keep in step with the 64em header breakpoint in main.css.
  const desktop = window.matchMedia('(min-width: 64em)');

  /* Header: a hairline and soft shadow once the page has scrolled. */
  function initHeader() {
    const header = document.querySelector('[data-header]');
    if (!header) return;
    let queued = false;
    const update = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 4);
      queued = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!queued) {
          queued = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true },
    );
    update();
  }

  /* Phone menu: a modal <dialog>, so focus stays inside and Esc closes it. */
  function initMenu() {
    const dialog = document.getElementById('menu');
    const openButton = document.querySelector('[data-menu-open]');
    if (!dialog || !openButton) return;
    const closeButton = dialog.querySelector('[data-menu-close]');
    const canModal = typeof dialog.showModal === 'function';

    const open = () => {
      if (canModal) dialog.showModal();
      else dialog.setAttribute('open', '');
      openButton.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
      if (!dialog.open) return;
      if (canModal) dialog.close();
      else {
        dialog.removeAttribute('open');
        dialog.dispatchEvent(new Event('close'));
      }
    };

    openButton.addEventListener('click', open);
    closeButton?.addEventListener('click', close);
    dialog.addEventListener('close', () => {
      openButton.setAttribute('aria-expanded', 'false');
      if (!canModal) openButton.focus();
    });
    // Following an in-page link closes the menu first, then the browser scrolls.
    dialog.addEventListener('click', (event) => {
      if (event.target.closest('a[href^="#"]')) close();
    });
    // If the window grows to desktop width while the menu is open, close it.
    desktop.addEventListener('change', (event) => {
      if (event.matches) close();
    });
  }

  /* Navigation: marks the link of the section being read. */
  function initActiveSection() {
    const links = [...document.querySelectorAll('.site-nav__link')];
    if (!links.length || !('IntersectionObserver' in window)) return;
    const byId = new Map(links.map((link) => [link.hash.slice(1), link]));
    const sections = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const link = byId.get(entry.target.id);
          if (entry.isIntersecting) {
            links.forEach((other) => other.removeAttribute('aria-current'));
            link.setAttribute('aria-current', 'true');
          } else if (link.hasAttribute('aria-current')) {
            link.removeAttribute('aria-current');
          }
        }
      },
      // A thin reading band a third of the way down the screen.
      { rootMargin: '-33% 0px -66% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
  }

  /* Soft reveals: content eases up a little as it enters the screen. */
  function initReveal() {
    const items = [...document.querySelectorAll('[data-reveal]')];
    if (!items.length || !('IntersectionObserver' in window) || reducedMotion.matches) return;

    // Neighbours in one row follow each other by a beat.
    items.forEach((item) => {
      const siblings = [...item.parentElement.children].filter((el) => el.hasAttribute('data-reveal'));
      const index = siblings.indexOf(item);
      if (index > 0) item.style.setProperty('--reveal-delay', `${Math.min(index, 3) * 90}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    items.forEach((item) => observer.observe(item));
    root.classList.add('reveal-ready');

    // If reduced motion is switched on mid-visit, show everything at once.
    reducedMotion.addEventListener('change', (event) => {
      if (event.matches) items.forEach((item) => item.classList.add('is-visible'));
    });
  }

  /* Photos: each one fades in over its blurred preview once it has loaded. */
  function initPhotos() {
    const photos = [...document.querySelectorAll('.media__img:not([fetchpriority])')];
    const done = (img) => img.classList.add('is-loaded');
    for (const img of photos) {
      if (img.complete && img.naturalWidth > 0) done(img);
      else {
        img.addEventListener('load', () => done(img), { once: true });
        img.addEventListener('error', () => done(img), { once: true });
      }
    }
    root.classList.add('media-ready');
  }

  initHeader();
  initMenu();
  initActiveSection();
  initReveal();
  initPhotos();
})();
