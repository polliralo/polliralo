// NIVARA COAST: small progressive enhancements. Every section, link and image
// works without this file; it only adds motion, the menu and the hero video.

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
    window.matchMedia('(min-width: 900px)').addEventListener('change', (event) => {
      if (event.matches && dialog.open) close();
    });
  }

  /* Hero video: starts only after the page has loaded, never on data-saver or
     very slow connections, never with reduced motion, and pauses off screen.
     If anything fails, the still image underneath simply stays. */

  // One file per screen shape, each in AV1 (smaller) and H.264 (plays almost
  // everywhere). Files live in the folder named by the video's data-video-path.
  const HERO_VIDEOS = {
    large: { file: 'hero-1080', width: 1920, height: 1080, av1: 'av01.0.08M.08', h264: 'avc1.640028' },
    medium: { file: 'hero-720', width: 1280, height: 720, av1: 'av01.0.05M.08', h264: 'avc1.64001f' },
    portrait: { file: 'hero-portrait', width: 608, height: 1080, av1: 'av01.0.04M.08', h264: 'avc1.64001f' },
  };

  async function pickCodec(video, variant) {
    const av1 = `video/mp4; codecs="${variant.av1}"`;
    const h264 = `video/mp4; codecs="${variant.h264}"`;
    const canAv1 = video.canPlayType(av1) !== '';
    const canH264 = video.canPlayType(h264) !== '';
    if (canAv1 && canH264 && navigator.mediaCapabilities) {
      // Prefer AV1 only where the device decodes it efficiently (saves battery).
      try {
        const info = await navigator.mediaCapabilities.decodingInfo({
          type: 'file',
          video: { contentType: av1, width: variant.width, height: variant.height, bitrate: 1_800_000, framerate: 30 },
        });
        return info.supported && info.powerEfficient ? 'av1' : 'h264';
      } catch {
        return 'h264';
      }
    }
    if (canAv1) return 'av1';
    if (canH264) return 'h264';
    return null;
  }

  function initHeroVideo() {
    const video = document.querySelector('[data-hero-video]');
    const toggle = document.querySelector('[data-video-toggle]');
    if (!video || !toggle) return;

    const connection = navigator.connection;
    if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '')) return;

    const label = toggle.querySelector('[data-video-toggle-label]');
    const path = video.dataset.videoPath ?? '';
    const portrait = window.matchMedia('(max-aspect-ratio: 3/4)');
    let started = false;
    let userPaused = false;
    let inView = true;
    let failed = false;
    let current = null; // { key, codec }

    const pickVariant = () => {
      if (portrait.matches) return 'portrait';
      const pixels = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
      return pixels > 1400 ? 'large' : 'medium';
    };

    const fileFor = (key, codec) => `${path}${HERO_VIDEOS[key].file}${codec === 'av1' ? '-av1' : ''}.mp4`;

    const load = (key, codec) => {
      current = { key, codec };
      video.classList.remove('is-playing');
      video.src = fileFor(key, codec);
    };

    const setSource = async () => {
      const key = pickVariant();
      if (current?.key === key) return;
      const codec = await pickCodec(video, HERO_VIDEOS[key]);
      if (!codec) {
        failed = true;
        return;
      }
      load(key, codec);
    };

    const updateToggle = () => {
      const paused = video.paused;
      toggle.dataset.state = paused ? 'paused' : 'playing';
      label.textContent = paused ? 'Play background video' : 'Pause background video';
    };

    const play = () => {
      if (failed || !current || userPaused || !inView || reducedMotion.matches) return;
      // Autoplay can be refused (for example in low power mode): keep the still.
      video.play()?.catch(() => {});
    };

    const stop = () => {
      video.pause();
      video.classList.remove('is-playing');
      toggle.hidden = true;
    };

    const start = async () => {
      if (started || reducedMotion.matches) return;
      started = true;
      await setSource();
      play();
    };

    video.addEventListener('playing', () => {
      video.classList.add('is-playing');
      toggle.hidden = false;
      updateToggle();
    });
    video.addEventListener('pause', updateToggle);
    video.addEventListener('error', () => {
      // If the AV1 file cannot be decoded, try the H.264 file once.
      if (current?.codec === 'av1' && video.canPlayType(`video/mp4; codecs="${HERO_VIDEOS[current.key].h264}"`)) {
        load(current.key, 'h264');
        play();
        return;
      }
      failed = true;
      stop();
    });

    toggle.addEventListener('click', () => {
      if (video.paused) {
        userPaused = false;
        play();
      } else {
        userPaused = true;
        video.pause();
      }
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        if (inView) play();
        else video.pause();
      }).observe(video);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) video.pause();
      else play();
    });

    portrait.addEventListener('change', async () => {
      if (!started || failed) return;
      await setSource();
      play();
    });

    reducedMotion.addEventListener('change', (event) => {
      if (event.matches) stop();
      else if (started) play();
      else start();
    });

    // Wait for the page (and the still image) to finish loading first.
    const whenIdle = () =>
      'requestIdleCallback' in window
        ? window.requestIdleCallback(start, { timeout: 1500 })
        : window.setTimeout(start, 300);
    if (document.readyState === 'complete') whenIdle();
    else window.addEventListener('load', whenIdle, { once: true });
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
  initHeroVideo();
  initReveal();
  initSectionHighlight();
  initIslandMap();
  initTabVisibility();
})();
