// Home page behaviour: the five-message hero (autoplay on wide, hover-capable
// screens only, with pause; swipe and arrow keys everywhere; a little pointer
// depth on computers), the shop-the-look
// switch, the small add controls in the look and watch panels, and store
// hydration. Markup builders are shared with the build: ./home-view.js.

import { loadStore, onStore, isEdited, getProducts, getProduct, getLooks, seedProduct } from '../lib/store.js';
import { addToBag } from '../lib/actions.js';
import { $, $$, reducedMotion, announce, enhance, withTransition } from '../lib/ui.js';
import { initRails } from '../lib/rail.js';
import {
  pad, toggleIcon,
  newArrivals, newArrivalsHTML, lookProducts, lookListHTML, watchPanelHTML,
} from './home-view.js';

const INTERVAL = 8000;          // autoplay interval; a visible pause button is always there (WCAG 2.2.2)
const SWIPE = 40;               // px before a horizontal drag counts as a swipe
// Autoplay only where it helps: a wide screen with a mouse, and no reduced motion.
const AUTOPLAY_MQ = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1040px)');
const REDUCE_MQ = window.matchMedia('(prefers-reduced-motion: reduce)');
const main = $('#main');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const idle = (fn) => ('requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 1200));

/** Start loading a lazy image now; resolves when decoded (or after `cap` ms). */
function warmImage(img, cap = 0) {
  if (!img) return Promise.resolve();
  if (img.loading === 'lazy') img.loading = 'eager';
  const decoded = img.decode ? img.decode().catch(() => {}) : Promise.resolve();
  return cap ? Promise.race([decoded, wait(cap)]) : decoded;
}

/** "Added" for two seconds on a button with a [data-label] span. */
function flashAdded(btn) {
  const label = btn && $('[data-label]', btn);
  if (!label) return;
  label.textContent = 'Added';
  btn.classList.add('is-added');
  clearTimeout(btn._added);
  btn._added = setTimeout(() => {
    label.textContent = label.dataset.label;
    btn.classList.remove('is-added');
  }, 2000);
}

initRails(document);

/* ======================================================================
   Hero
   ====================================================================== */

const carousel = $('[data-carousel]');
const hero = { slides: [], index: 0, playing: false, stopped: false, holds: new Set(), anim: null, token: 0 };

const slideTitle = (slide) => $('.home-title', slide)?.textContent.trim() ?? '';
const canAutoplay = () => AUTOPLAY_MQ.matches && !REDUCE_MQ.matches;

function updateBar() {
  const n = hero.slides.length;
  $('[data-hero-current]', carousel).textContent = pad(hero.index + 1);
  $('[data-hero-total]', carousel).textContent = pad(n);
  $$('.home-seg', carousel).forEach((seg, i) => {
    seg.classList.toggle('is-done', i < hero.index);
    seg.classList.toggle('is-current', i === hero.index);
  });
}

function live(message) {
  const region = $('[data-hero-live]', carousel);
  if (!region) return;
  region.textContent = '';
  requestAnimationFrame(() => { region.textContent = message; });
}

/* ----- Autoplay: runs only while nothing holds it ----- */

const held = () => hero.holds.size > 0;

function applyHolds() {
  const a = hero.anim;
  if (!a) return;
  if (held()) { if (a.playState === 'running') a.pause(); }
  else if (a.playState === 'paused') a.play();
}

function hold(name, on) {
  if (on) hero.holds.add(name);
  else hero.holds.delete(name);
  applyHolds();
}

// The current segment of the progress line fills over the interval; when it
// is full, the next slide comes in.
function restartCycle() {
  hero.anim?.cancel();
  hero.anim = null;
  if (!hero.playing || hero.slides.length < 2) return;
  const fill = $('.home-seg.is-current i', carousel);
  if (!fill?.animate) return;
  hero.anim = fill.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: INTERVAL, easing: 'linear', fill: 'forwards' });
  hero.anim.onfinish = () => {
    if (!hero.playing) return;
    if (!canAutoplay()) { setPlaying(false); return; }
    go(hero.index + 1);
  };
  applyHolds();
}

function setPlaying(on) {
  hero.playing = Boolean(on) && canAutoplay() && hero.slides.length > 1;
  const btn = $('[data-hero-toggle]', carousel);
  if (btn) {
    const label = hero.playing ? 'Pause slideshow' : 'Play slideshow';
    btn.setAttribute('aria-label', label);
    btn.title = label;
    $('[data-hero-toggle-icon]', btn).innerHTML = toggleIcon(hero.playing);
  }
  carousel.dataset.playing = String(hero.playing);
  restartCycle();
}

// Phones, tablets and reduced motion get no autoplay (and no pause button).
function syncAutoplay() {
  const available = canAutoplay() && hero.slides.length > 1;
  carousel.dataset.autoplay = available ? 'on' : 'off';
  setPlaying(available && !hero.stopped);
}

/* ----- Moving between slides ----- */

function warmSlide(slide) {
  $$('img', slide).forEach((img) => { if (img.loading === 'lazy') img.loading = 'eager'; });
}

function warmNeighbours() {
  const n = hero.slides.length;
  if (n < 2) return;
  idle(() => {
    warmSlide(hero.slides[(hero.index + 1) % n]);
    warmSlide(hero.slides[(hero.index - 1 + n) % n]);
  });
}

function go(target, { manual = false } = {}) {
  const n = hero.slides.length;
  if (n < 2) return;
  const to = ((target % n) + n) % n;
  if (to === hero.index) return;
  if (manual) {
    hero.stopped = true;
    setPlaying(false);
  }
  const from = hero.slides[hero.index];
  const next = hero.slides[to];
  const token = ++hero.token;
  // Never show an empty panel: wait briefly for the incoming picture.
  const img = $('.home-panel img', next);
  const ready = img && !(img.complete && img.naturalWidth) ? warmImage(img, 600) : Promise.resolve();
  ready.then(() => {
    if (token !== hero.token) return;
    const motion = !reducedMotion();
    const hadFocus = from.contains(document.activeElement);
    hero.slides.forEach((s) => {
      s.classList.remove('is-intro');
      if (s !== from && s !== next) s.classList.remove('is-active', 'is-leaving', 'is-entering');
    });
    from.classList.remove('is-active', 'is-entering');
    from.inert = true;
    next.classList.remove('is-leaving', 'is-entering');
    next.inert = false;
    if (motion) {
      // Layered change (home.css): the new stage opens over the old one in
      // a widening circle (1100ms), so the old slide stays drawn beneath
      // until it is covered; the old words leave first so words never overlap.
      from.classList.add('is-leaving');
      clearTimeout(from._leave);
      from._leave = setTimeout(() => from.classList.remove('is-leaving'), 1160);
      void next.offsetWidth;
      next.classList.add('is-entering');
      clearTimeout(next._enter);
      next._enter = setTimeout(() => next.classList.remove('is-entering'), 1800);
    } else {
      from.classList.remove('is-leaving');
    }
    next.classList.add('is-active');
    hero.index = to;
    updateBar();
    if (hadFocus) next.focus({ preventScroll: true });
    if (manual) live(`${to + 1} of ${n}: ${slideTitle(next)}`);
    restartCycle();
    warmNeighbours();
  });
}

// Depth on a computer: the picture, the brush phrase and the circle drift a
// few pixels apart with the pointer (home.css reads --px and --py, -1 to 1),
// easing back to rest when the pointer leaves.
function setupDepth() {
  const FINE = window.matchMedia('(hover: hover) and (pointer: fine)');
  let target = { x: 0, y: 0 };
  const now = { x: 0, y: 0 };
  let frame = 0;
  const step = () => {
    now.x += (target.x - now.x) * 0.08;
    now.y += (target.y - now.y) * 0.08;
    carousel.style.setProperty('--px', now.x.toFixed(3));
    carousel.style.setProperty('--py', now.y.toFixed(3));
    frame = Math.abs(target.x - now.x) + Math.abs(target.y - now.y) > 0.002 ? requestAnimationFrame(step) : 0;
  };
  const run = () => { if (!frame) frame = requestAnimationFrame(step); };
  carousel.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !FINE.matches || reducedMotion()) return;
    const r = carousel.getBoundingClientRect();
    target = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1 };
    run();
  }, { passive: true });
  carousel.addEventListener('pointerleave', () => { target = { x: 0, y: 0 }; run(); });
}

function setupHero() {
  if (!carousel) return;
  hero.slides = $$('[data-slide]', carousel);
  hero.index = Math.max(0, hero.slides.findIndex((s) => s.classList.contains('is-active')));
  hero.slides.forEach((s, i) => { s.inert = i !== hero.index; });
  carousel.classList.toggle('is-single', hero.slides.length < 2);
  updateBar();

  carousel.addEventListener('click', (e) => {
    if (hero.swipedAt && Date.now() - hero.swipedAt < 400) { e.preventDefault(); return; }
    if (e.target.closest('[data-hero-prev]')) { go(hero.index - 1, { manual: true }); return; }
    if (e.target.closest('[data-hero-next]')) { go(hero.index + 1, { manual: true }); return; }
    if (e.target.closest('[data-hero-toggle]')) {
      hero.stopped = hero.playing;
      setPlaying(!hero.playing);
    }
  });

  // Arrow keys move between slides while focus is in the hero.
  carousel.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.target.matches('input, select, textarea')) return;
    e.preventDefault();
    go(hero.index + (e.key === 'ArrowRight' ? 1 : -1), { manual: true });
  });

  // Swipe (touch and pen; pan-y keeps vertical scrolling native).
  const slidesEl = $('[data-slides]', carousel);
  let start = null;
  slidesEl.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || !e.isPrimary) return;
    start = { x: e.clientX, y: e.clientY, id: e.pointerId };
  }, { passive: true });
  slidesEl.addEventListener('pointerup', (e) => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = null;
    if (Math.abs(dx) >= SWIPE && Math.abs(dx) > Math.abs(dy) * 1.2) {
      hero.swipedAt = Date.now();
      go(hero.index + (dx < 0 ? 1 : -1), { manual: true });
    }
  }, { passive: true });
  slidesEl.addEventListener('pointercancel', () => { start = null; }, { passive: true });

  // Pause on hover, on focus inside, when the tab is hidden or the hero scrolled away.
  carousel.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hold('hover', true); });
  carousel.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hold('hover', false); });
  carousel.addEventListener('focusin', (e) => hold('focus', !e.target.closest('[data-hero-toggle]')));
  carousel.addEventListener('focusout', (e) => { if (!carousel.contains(e.relatedTarget)) hold('focus', false); });
  document.addEventListener('visibilitychange', () => hold('hidden', document.hidden));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => hold('offscreen', !entry.isIntersecting || entry.intersectionRatio < 0.3), { threshold: [0, 0.3, 0.6] }).observe(carousel);
  }
  AUTOPLAY_MQ.addEventListener?.('change', syncAutoplay);
  REDUCE_MQ.addEventListener?.('change', syncAutoplay);

  carousel.dataset.ready = '';
  syncAutoplay();
  setupDepth();
  // The first-paint entrance is a one-off.
  setTimeout(() => $$('.home-slide.is-intro', carousel).forEach((s) => s.classList.remove('is-intro')), 2100);
  if (document.readyState === 'complete') warmNeighbours();
  else window.addEventListener('load', warmNeighbours, { once: true });
}

/* ======================================================================
   Shop the look
   ====================================================================== */

const lookSection = $('[data-look-section]');
const lookParts = () => ['[data-look-texts]', '[data-look-stage]', '[data-look-panel]'].map((sel) => $(sel, lookSection));
const VT_NAMES = ['home-look-text', 'home-look-stage', 'home-look-panel'];

async function switchLook(id) {
  const parts = lookParts();
  if (parts.some((p) => !p)) return;
  const nextFigure = $(`[data-look="${CSS.escape(id)}"]`, parts[1]);
  $$('img', parts[2]).forEach((img) => { if (img.loading === 'lazy') img.loading = 'eager'; });
  await warmImage(nextFigure && $('img', nextFigure), 700);
  if ($('input[name="home-look"]:checked', lookSection)?.value !== id) return;
  const useVT = Boolean(document.startViewTransition) && !reducedMotion();
  if (useVT) parts.forEach((p, i) => { p.style.viewTransitionName = VT_NAMES[i]; });
  const update = () => {
    parts.forEach((part) => [...part.children].forEach((child) => {
      if (child.dataset.look) child.hidden = child.dataset.look !== id;
    }));
    if (nextFigure) $$('img', nextFigure).forEach((img) => { if (img.complete) img.classList.add('is-loaded'); });
  };
  const done = () => parts.forEach((p) => { p.style.viewTransitionName = ''; });
  const transition = useVT ? withTransition(update) : (update(), null);
  if (transition) transition.finished.finally(done);
  else done();
  await loadStore();
  const look = getLooks().find((l) => l.id === id);
  const count = $$(`[data-look="${CSS.escape(id)}"] .home-item`, parts[2]).length;
  if (look) announce(`${look.name}: ${count} ${count === 1 ? 'piece' : 'pieces'}.`);
}

function setupLooks() {
  if (!lookSection) return;
  lookSection.addEventListener('change', (e) => {
    if (e.target.name === 'home-look') switchLook(e.target.value);
  });
  // Load the other look's picture as the section comes near.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((en) => en.isIntersecting)) return;
      io.disconnect();
      idle(() => $$('.home-look-figure img', lookSection).forEach((img) => warmImage(img)));
    }, { rootMargin: '400px 0px' });
    io.observe(lookSection);
  }
}

/* ======================================================================
   Add controls in the look and watch panels
   ====================================================================== */

function closeChips(item) {
  if (!item) return;
  $('[data-choose]', item)?.setAttribute('aria-expanded', 'false');
  const panel = $('.home-item-sizes', item);
  if (panel) panel.hidden = true;
}

function toggleChips(btn) {
  const item = btn.closest('.home-item');
  const panel = $('.home-item-sizes', item);
  const open = btn.getAttribute('aria-expanded') !== 'true';
  $$('[data-choose][aria-expanded="true"]', main).forEach((b) => { if (b !== btn) closeChips(b.closest('.home-item')); });
  btn.setAttribute('aria-expanded', String(open));
  if (panel) panel.hidden = !open;
  if (open) $('.chip:not(:disabled)', panel)?.focus();
}

function setupItems() {
  main?.addEventListener('click', async (e) => {
    const choose = e.target.closest('[data-choose]');
    if (choose) { toggleChips(choose); return; }
    const add = e.target.closest('[data-add-slug]');
    if (!add) {
      if (!e.target.closest('.home-item-sizes')) $$('[data-choose][aria-expanded="true"]', main).forEach((b) => closeChips(b.closest('.home-item')));
      return;
    }
    await loadStore();
    const item = add.closest('.home-item');
    const fromChip = add.classList.contains('chip');
    const opener = fromChip ? $('[data-choose]', item) : null;
    if (fromChip) {
      closeChips(item);
      opener?.focus({ preventScroll: true });
    }
    const result = addToBag(add.dataset.addSlug, add.dataset.addVariant);
    if (result.ok) flashAdded(opener ?? add);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = $('[data-choose][aria-expanded="true"]', main);
    if (!open) return;
    closeChips(open.closest('.home-item'));
    open.focus();
  });
}

/* ======================================================================
   Store hydration: when the demo admin changed products in this browser,
   re-render the product markup with the same builders. Untouched seed data
   leaves the server markup alone (no flash).
   ====================================================================== */

const sigOf = (list) => JSON.stringify(list.map((p) => p && [
  p.slug, p.name, p.price, p.summary, p.category, Boolean(p.newArrival), Boolean(p.hidden), p.custom ?? false,
  p.colour?.name, p.colour?.hex, p.option?.label,
  (p.variants ?? []).map((v) => [v.id, v.label, Number(v.stock) > 0]),
  (p.images ?? []).map((i) => [i.key, i.alt]),
]));

const sigs = {};
let hydrated = false;

function watchSelection(get) {
  const visible = (p) => (p && !p.hidden ? p : null);
  return {
    watch: visible(get('white-dial-watch')),
    extras: ['brown-bifold-wallet', 'black-dress-belt'].map(get).filter((p) => p && !p.hidden),
    other: visible(get('black-dial-watch')),
  };
}

function initSigs() {
  // The server markup was built from the seed catalogue.
  const slugs = (sel, root) => $$(sel, root).map((el) => el.dataset.slug);
  const newList = $('[data-new-list]');
  if (newList) sigs.new = sigOf(slugs('.card[data-slug]', newList).map(seedProduct));
  if (lookSection) {
    $$('.home-look-list[data-look]', lookSection).forEach((el) => {
      sigs[`look:${el.dataset.look}`] = sigOf(slugs('.home-item', el).map(seedProduct));
    });
  }
  const s = watchSelection(seedProduct);
  sigs.watch = sigOf([s.watch, ...s.extras, s.other]);
}

function renderNew() {
  const section = $('[data-new-section]');
  const listEl = $('[data-new-list]');
  if (!section || !listEl) return;
  const list = newArrivals(getProducts());
  const sig = sigOf(list);
  if (sig === sigs.new) return;
  sigs.new = sig;
  section.hidden = list.length === 0;
  listEl.innerHTML = newArrivalsHTML(list);
  enhance(listEl);
  listEl.scrollLeft = 0;
  listEl.dispatchEvent(new Event('scroll'));
}

function renderLooks() {
  if (!lookSection) return;
  getLooks().forEach((look) => {
    const el = $(`.home-look-list[data-look="${CSS.escape(look.id)}"]`, lookSection);
    if (!el) return;
    const products = lookProducts(look, getProduct);
    const sig = sigOf(products);
    if (sig === sigs[`look:${look.id}`]) return;
    sigs[`look:${look.id}`] = sig;
    const tpl = document.createElement('template');
    tpl.innerHTML = lookListHTML(look, products, !el.hidden);
    const fresh = tpl.content.firstElementChild;
    el.replaceWith(fresh);
    enhance(fresh);
  });
}

function renderWatch() {
  const panel = $('[data-watch-panel]');
  if (!panel) return;
  const s = watchSelection(getProduct);
  const sig = sigOf([s.watch, ...s.extras, s.other]);
  if (sig === sigs.watch) return;
  sigs.watch = sig;
  panel.innerHTML = watchPanelHTML(s.watch, s.extras, { alt: s.other, altQuestion: 'Prefer a black dial?' });
  enhance(panel);
}

function sync() {
  if (!Object.keys(sigs).length) initSigs();
  if (!isEdited() && !hydrated) return;
  hydrated = true;
  renderNew();
  renderLooks();
  renderWatch();
}

/* ----- Start ----- */
setupHero();
setupLooks();
setupItems();
onStore(sync).catch(() => { /* app.js reports a failed catalogue load */ });
