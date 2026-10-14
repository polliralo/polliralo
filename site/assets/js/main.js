// NIVARA COAST: small progressive enhancements. Every section, link and image
// works without this file; it only adds motion, the phone menu and small
// navigation helpers.

(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Header: transparent over the hero, solid once the hero has scrolled away. */
  function initHeader() {
    const header = document.querySelector('[data-header]');
    const hero = document.querySelector('.hero');
    if (!header || !hero || !('IntersectionObserver' in window)) {
      header?.classList.add('is-solid');
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => header.classList.toggle('is-solid', !entry.isIntersecting),
      // One extra pixel, so a hero edge sitting exactly under the header counts as gone.
      { rootMargin: `-${header.offsetHeight + 1}px 0px 0px 0px` },
    );
    observer.observe(hero);
  }

  /* Mobile menu: a modal <dialog>, so focus stays inside and Esc closes it. */
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
    // Keep this in step with the header breakpoint in main.css.
    window.matchMedia('(min-width: 1080px)').addEventListener('change', (event) => {
      if (event.matches && dialog.open) close();
    });
  }

  /* Scroll reveals: content eases in as it enters the screen. */
  function initReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length || !('IntersectionObserver' in window)) return;

    root.classList.add('reveal-ready');
    const showAll = () => items.forEach((item) => item.classList.add('is-visible'));
    if (reducedMotion.matches) {
      showAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    );
    items.forEach((item) => observer.observe(item));
    reducedMotion.addEventListener('change', (event) => {
      if (event.matches) showAll();
    });
  }

  /* Main navigation marks the section currently on screen. */
  function initSectionHighlight() {
    const links = [...document.querySelectorAll('.site-nav a[href^="#"]')];
    if (!links.length || !('IntersectionObserver' in window)) return;
    const byId = new Map(links.map((link) => [link.hash.slice(1), link]));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const link = byId.get(entry.target.id);
          if (!link) continue;
          if (entry.isIntersecting) {
            links.forEach((other) => other.removeAttribute('aria-current'));
            link.setAttribute('aria-current', 'true');
          } else if (link.hasAttribute('aria-current')) {
            link.removeAttribute('aria-current');
          }
        }
      },
      // A thin band across the middle of the screen decides which section is current.
      { rootMargin: '-45% 0px -54% 0px' },
    );
    byId.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  /* Island map: pointing at a legend entry highlights its marker, and back. */
  function initIslandMap() {
    const map = document.querySelector('[data-island-map]');
    if (!map) return;
    const points = [...map.querySelectorAll('[data-point]')];
    const setActive = (id) =>
      points.forEach((point) => point.classList.toggle('is-active', point.dataset.point === id));

    points.forEach((point) => {
      point.addEventListener('pointerenter', () => setActive(point.dataset.point));
      point.addEventListener('pointerleave', () => setActive(null));
    });
  }

  /* Ambient animations rest while the tab is in the background. */
  function initTabVisibility() {
    document.addEventListener('visibilitychange', () => {
      root.classList.toggle('is-hidden-tab', document.hidden);
    });
  }

  initHeader();
  initMenu();
  initReveal();
  initSectionHighlight();
  initIslandMap();
  initTabVisibility();
})();
