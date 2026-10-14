// NIVARA COAST: small progressive enhancements. Every section, link and image
// works without this file; it only adds motion, the phone menu, the island
// guide's moving light and small navigation helpers.

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

  /* Photos fade in over their blurred preview once they have loaded. */
  function initImageFade() {
    const images = document.querySelectorAll('.photo img');
    if (!images.length) return;
    root.classList.add('img-fade');
    images.forEach((img) => {
      const show = () => img.classList.add('is-loaded');
      if (img.complete) show();
      else {
        img.addEventListener('load', show, { once: true });
        // A photo that fails still leaves its preview, never an empty frame.
        img.addEventListener('error', show, { once: true });
      }
    });
  }

  /* Island guide: the place being read is lit on the aerial photo. The ring
     follows the reading line while scrolling, and pointing at a place (or
     tapping it) lights it straight away. */
  function initIslandGuide() {
    const guide = document.querySelector('[data-island]');
    const photo = guide?.querySelector('.island__photo');
    const stage = guide?.querySelector('.island__stage');
    const label = guide?.querySelector('.island__label');
    const places = guide ? [...guide.querySelectorAll('.place')] : [];
    if (!photo || !stage || !label || !places.length) return;

    // Keep in step with the island guide's side-by-side breakpoint in main.css.
    const sideBySide = window.matchMedia('(min-width: 900px)');
    let active = null;
    let held = null; // a place the mouse is resting on
    let labelTimer = 0;

    const setActive = (place) => {
      if (!place || place === active) return;
      active?.classList.remove('is-active');
      active = place;
      place.classList.add('is-active');
      guide.dataset.active = place.dataset.point;

      const x = place.style.getPropertyValue('--x').trim();
      const y = place.style.getPropertyValue('--y').trim();
      photo.style.setProperty('--spot-x', x);
      photo.style.setProperty('--spot-y', y);
      photo.classList.toggle('is-flipped', parseFloat(x) > 60);

      // The label fades out while the ring travels, then shows the new name.
      const name = place.querySelector('.place__name')?.textContent ?? '';
      window.clearTimeout(labelTimer);
      if (reducedMotion.matches) {
        label.textContent = name;
        label.classList.remove('is-hidden');
        return;
      }
      label.classList.add('is-hidden');
      labelTimer = window.setTimeout(() => {
        label.textContent = name;
        label.classList.remove('is-hidden');
      }, 550);
    };

    const update = () => {
      if (held) return;
      const viewport = window.innerHeight;
      // Side by side, the reading line is the middle of the screen. Stacked
      // on phones, it sits a little below the photo.
      let line = viewport * 0.5;
      if (!sideBySide.matches) {
        // On short screens the photo scrolls away; its edge then stops at 0.
        const below = Math.max(0, stage.getBoundingClientRect().bottom);
        line = Math.min(viewport * 0.85, below + (viewport - below) * 0.3);
      }
      let current = places[0];
      for (const place of places) {
        if (place.getBoundingClientRect().top < line) current = place;
      }
      setActive(current);
    };

    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(() => {
        queued = false;
        update();
      });
    };

    guide.classList.add('is-enhanced');
    // Light the first place without a glide, so the ring starts in place.
    photo.style.setProperty('--spot-x', places[0].style.getPropertyValue('--x').trim());
    photo.style.setProperty('--spot-y', places[0].style.getPropertyValue('--y').trim());
    setActive(places[0]);

    // Follow the scroll only while the guide is near the screen.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          window.addEventListener('scroll', onScroll, { passive: true });
          update();
        } else {
          window.removeEventListener('scroll', onScroll);
        }
      }, { rootMargin: '25% 0px' }).observe(guide);
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    window.addEventListener('resize', onScroll, { passive: true });

    places.forEach((place) => {
      place.addEventListener('pointerenter', (event) => {
        if (event.pointerType !== 'mouse') return;
        held = place;
        setActive(place);
      });
      place.addEventListener('pointerleave', (event) => {
        if (event.pointerType !== 'mouse') return;
        held = null;
      });
      place.addEventListener('click', () => setActive(place));
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
  initImageFade();
  initIslandGuide();
  initTabVisibility();
})();
