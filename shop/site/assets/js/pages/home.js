// Home page behaviour: the hero product slider (autoplay with a visible pause,
// swipe, keys, angle thumbnails, add to bag), the shop-the-look switch, the
// small add controls in the look and watch panels, and store hydration.
// Markup builders are shared with the build: ./home-view.js.

import { loadStore, onStore, isEdited, getProducts, getProduct, getCategories, getLooks, seedProduct } from '../lib/store.js';
import { addToBag } from '../lib/actions.js';
import { $, $$, reducedMotion, announce, enhance, withTransition } from '../lib/ui.js';
import { initRails } from '../lib/rail.js';
import {
  heroProducts, heroSlidesHTML, heroLayerHTML, heroPictureHTML, toggleIcon,
  newArrivals, newArrivalsHTML, lookProducts, lookListHTML, watchPanelHTML,
} from './home-view.js';

const INTERVAL = 7000;          // autoplay interval (WCAG 2.2.2: visible pause button)
const SWIPE = 40;               // px before a horizontal drag counts as a swipe
const main = $('#main');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const idle = (fn) => ('requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 1200));
const pad = (n) => String(n).padStart(2, '0');

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
   Hero product slider
   ====================================================================== */

const heroEl = $('[data-hero]');
const carousel = $('[data-carousel]');
const hero = { slides: [], index: 0, playing: false, holds: new Set(), anim: null, token: 0 };

const slideName = (slide) => $('.home-name', slide)?.textContent.trim() ?? '';

function readSlides() {
  hero.slides = $$('[data-slide]', carousel);
  const active = hero.slides.findIndex((s) => s.classList.contains('is-active'));
  hero.index = Math.max(0, active);
  carousel.classList.toggle('is-single', hero.slides.length < 2);
  hero.slides.forEach((s, i) => { s.inert = i !== hero.index; });
}

function updateBar() {
  const n = hero.slides.length;
  const current = hero.slides[hero.index];
  const next = hero.slides[(hero.index + 1) % n];
  $('[data-hero-current]', carousel).textContent = pad(hero.index + 1);
  $('[data-hero-total]', carousel).textContent = pad(n);
  $('[data-hero-next-name]', carousel).textContent = next && n > 1 ? slideName(next) : '';
  if (current?.dataset.accent) heroEl.style.setProperty('--accent', current.dataset.accent);
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

function restartCycle() {
  hero.anim?.cancel();
  hero.anim = null;
  const bar = $('[data-hero-progress]', carousel);
  if (!hero.playing || hero.slides.length < 2 || !bar?.animate) return;
  hero.anim = bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: INTERVAL, easing: 'linear', fill: 'forwards' });
  hero.anim.onfinish = () => {
    if (!hero.playing) return;
    if (reducedMotion()) { setPlaying(false); return; }
    go(hero.index + 1);
  };
  applyHolds();
}

function setPlaying(on) {
  hero.playing = Boolean(on);
  const btn = $('[data-hero-toggle]', carousel);
  if (btn) {
    $('[data-hero-toggle-text]', btn).textContent = hero.playing ? 'Pause' : 'Play';
    $('[data-hero-toggle-icon]', btn).innerHTML = toggleIcon(hero.playing);
  }
  carousel.dataset.playing = String(hero.playing);
  restartCycle();
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

function clearSizeError(slide) {
  if (!slide) return;
  $('[data-hero-sizes]', slide)?.classList.remove('is-invalid');
  const msg = $('[data-hero-msg]', slide);
  if (msg) msg.textContent = '';
}

function go(target, { manual = false } = {}) {
  const n = hero.slides.length;
  if (n < 2) return;
  const to = ((target % n) + n) % n;
  if (to === hero.index) return;
  if (manual) setPlaying(false);
  const from = hero.slides[hero.index];
  const next = hero.slides[to];
  const token = ++hero.token;
  const img = $('.home-layer.is-current img', next);
  // Never show an empty frame: wait briefly for the incoming image.
  const ready = img && !(img.complete && img.naturalWidth) ? warmImage(img, 600) : Promise.resolve();
  ready.then(() => {
    if (token !== hero.token) return;
    const motion = !reducedMotion();
    const hadFocus = from.contains(document.activeElement);
    hero.slides.forEach((s) => {
      if (s !== from && s !== next) s.classList.remove('is-active', 'is-leaving', 'is-entering', 'is-intro');
    });
    from.classList.remove('is-active', 'is-entering', 'is-intro');
    from.inert = true;
    clearSizeError(from);
    next.classList.remove('is-leaving', 'is-intro', 'is-entering');
    next.inert = false;
    if (motion) {
      from.classList.add('is-leaving');
      clearTimeout(from._leave);
      from._leave = setTimeout(() => from.classList.remove('is-leaving'), 640);
      void next.offsetWidth;
      next.classList.add('is-entering');
      clearTimeout(next._enter);
      next._enter = setTimeout(() => next.classList.remove('is-entering'), 2100);
    } else {
      from.classList.remove('is-leaving');
    }
    next.classList.add('is-active');
    hero.index = to;
    updateBar();
    if (hadFocus) next.focus({ preventScroll: true });
    if (manual) live(`${to + 1} of ${n}: ${slideName(next)}`);
    restartCycle();
    warmNeighbours();
  });
}

/* ----- Angle thumbnails: crossfade the slide's main image ----- */

const prefetched = new Map();
function prefetchView(key, alt) {
  if (prefetched.has(key)) return;
  const holder = document.createElement('div');
  holder.innerHTML = heroPictureHTML(key, alt);
  prefetched.set(key, holder);
}

async function showView(btn) {
  const slide = btn.closest('[data-slide]');
  const frame = $('[data-frame]', slide);
  const key = btn.dataset.view;
  $$('[data-view]', slide).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  const current = $('.home-layer.is-current', frame);
  if (current?.dataset.key === key) return;
  await loadStore();
  frame._token = (frame._token ?? 0) + 1;
  const token = frame._token;
  const tpl = document.createElement('template');
  tpl.innerHTML = heroLayerHTML({ key, kind: btn.dataset.kind, alt: btn.dataset.alt }, { current: false });
  const layer = tpl.content.firstElementChild;
  const img = $('img', layer);
  img.loading = 'eager';
  layer.classList.add('is-pending');
  frame.append(layer);
  await Promise.race([img.decode ? img.decode().catch(() => {}) : Promise.resolve(), wait(1500)]);
  if (token !== frame._token) { layer.remove(); return; }
  img.classList.add('is-loaded');
  const motion = !reducedMotion();
  $$('.home-layer', frame).forEach((old) => {
    if (old === layer) return;
    old.classList.remove('is-current', 'is-in');
    if (motion) {
      old.classList.add('is-out');
      setTimeout(() => old.remove(), 440);
    } else {
      old.remove();
    }
  });
  layer.classList.remove('is-pending');
  layer.classList.add('is-current');
  if (motion) layer.classList.add('is-in');
}

/* ----- Add to bag from the hero (a size is required) ----- */

async function heroAdd(btn) {
  const slide = btn.closest('[data-slide]');
  await loadStore();
  const product = getProduct(slide.dataset.slug);
  if (!product) return;
  let variant = product.variants?.[0]?.id;
  if ((product.variants?.length ?? 0) > 1) {
    const checked = $('.home-size-input:checked', slide);
    if (!checked) {
      const label = (product.option?.label ?? 'size').toLowerCase();
      $('[data-hero-msg]', slide).textContent = `Choose a ${label} first.`;
      $('[data-hero-sizes]', slide)?.classList.add('is-invalid');
      $('.home-size-input:not(:disabled)', slide)?.focus();
      return;
    }
    variant = checked.value;
  }
  clearSizeError(slide);
  const result = addToBag(product.slug, variant);
  if (result.ok) flashAdded(btn);
}

function setupHero() {
  if (!carousel || !heroEl) return;
  readSlides();
  updateBar();

  carousel.addEventListener('click', (e) => {
    if (hero.swipedAt && Date.now() - hero.swipedAt < 400) { e.preventDefault(); return; }
    if (e.target.closest('[data-hero-prev]')) { go(hero.index - 1, { manual: true }); return; }
    if (e.target.closest('[data-hero-next]')) { go(hero.index + 1, { manual: true }); return; }
    if (e.target.closest('[data-hero-toggle]')) { setPlaying(!hero.playing); return; }
    const thumb = e.target.closest('[data-view]');
    if (thumb) { setPlaying(false); showView(thumb); return; }
    const add = e.target.closest('[data-hero-add]');
    if (add) { setPlaying(false); heroAdd(add); return; }
    // Any other engagement (a size, a link) stops the slideshow.
    if (e.target.closest('a, label, input, button')) setPlaying(false);
  });

  carousel.addEventListener('change', (e) => {
    if (!e.target.matches('.home-size-input')) return;
    setPlaying(false);
    clearSizeError(e.target.closest('[data-slide]'));
  });

  // Warm the bigger image of a view before it is chosen.
  carousel.addEventListener('pointerover', (e) => {
    const thumb = e.target.closest('[data-view]');
    if (thumb) loadStore().then(() => prefetchView(thumb.dataset.view, thumb.dataset.alt));
  });
  carousel.addEventListener('focusin', (e) => {
    const thumb = e.target.closest('[data-view]');
    if (thumb) loadStore().then(() => prefetchView(thumb.dataset.view, thumb.dataset.alt));
  });

  // Arrow keys move between products (radios keep their own arrow keys).
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

  // Pause on hover, on focus inside, when hidden or scrolled away.
  carousel.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hold('hover', true); });
  carousel.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hold('hover', false); });
  carousel.addEventListener('focusin', (e) => hold('focus', !e.target.closest('[data-hero-toggle]')));
  carousel.addEventListener('focusout', (e) => { if (!carousel.contains(e.relatedTarget)) hold('focus', false); });
  document.addEventListener('visibilitychange', () => hold('hidden', document.hidden));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => hold('offscreen', !entry.isIntersecting || entry.intersectionRatio < 0.3), { threshold: [0, 0.3, 0.6] }).observe(carousel);
  }

  carousel.dataset.ready = '';
  setPlaying(!reducedMotion());

  // The intro animation is a first-paint effect only.
  setTimeout(() => $$('.home-slide.is-intro', carousel).forEach((s) => s.classList.remove('is-intro')), 2200);
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
  const root = document.documentElement;
  if (useVT) {
    parts.forEach((p, i) => { p.style.viewTransitionName = VT_NAMES[i]; });
    root.classList.add('home-vt');
  }
  const update = () => {
    parts.forEach((part) => [...part.children].forEach((child) => {
      if (child.dataset.look) child.hidden = child.dataset.look !== id;
    }));
    $$('img', nextFigure ?? document.createElement('div')).forEach((img) => { if (img.complete) img.classList.add('is-loaded'); });
  };
  const done = () => {
    parts.forEach((p) => { p.style.viewTransitionName = ''; });
    root.classList.remove('home-vt');
  };
  const transition = useVT ? withTransition(update) : (update(), null);
  if (transition) transition.finished.finally(done);
  else done();
  const look = (await loadStore(), getLooks().find((l) => l.id === id));
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
  p.slug, p.name, p.price, p.accent, p.summary, p.category, Boolean(p.newArrival), Boolean(p.hidden), p.custom ?? false,
  p.colour?.name, p.colour?.hex, p.option?.label,
  (p.variants ?? []).map((v) => [v.id, v.label, Number(v.stock) > 0]),
  (p.images ?? []).map((i) => i.key),
]));

const sigs = {};
let hydrated = false;

function watchSelection(get) {
  const watch = get('black-dial-watch');
  const extras = ['brown-bifold-wallet', 'black-dress-belt'].map(get).filter((p) => p && !p.hidden);
  const white = get('white-dial-watch');
  return { watch: watch && !watch.hidden ? watch : null, extras, white: white && !white.hidden ? white : null };
}

function initSigs() {
  // The server markup was built from the seed catalogue in this order.
  const slugs = (sel, root) => $$(sel, root).map((el) => el.dataset.slug);
  if (carousel) sigs.hero = sigOf(slugs('[data-slide]', carousel).map(seedProduct));
  const newList = $('[data-new-list]');
  if (newList) sigs.new = sigOf(slugs('.card[data-slug]', newList).map(seedProduct));
  if (lookSection) {
    $$('.home-look-list[data-look]', lookSection).forEach((el) => {
      sigs[`look:${el.dataset.look}`] = sigOf(slugs('.home-item', el).map(seedProduct));
    });
  }
  const s = watchSelection(seedProduct);
  sigs.watch = sigOf([s.watch, ...s.extras, s.white]);
}

function renderHero() {
  if (!carousel) return;
  const list = heroProducts(getProducts());
  const sig = sigOf(list);
  if (sig === sigs.hero) return;
  sigs.hero = sig;
  const keep = hero.slides[hero.index]?.dataset.slug;
  const slidesEl = $('[data-slides]', carousel);
  $('.home-hero-empty', heroEl)?.remove();
  carousel.hidden = list.length === 0;
  if (!list.length) {
    slidesEl.innerHTML = '';
    hero.slides = [];
    setPlaying(false);
    carousel.insertAdjacentHTML('afterend', '<div class="home-hero-empty"><p class="lede">The featured pieces are resting for now.</p><a class="btn" href="/collections/">Shop all</a></div>');
    return;
  }
  hero.token += 1;
  slidesEl.innerHTML = heroSlidesHTML(list, getCategories());
  const slides = $$('[data-slide]', slidesEl);
  slides.forEach((s) => s.classList.remove('is-intro'));
  const target = Math.max(0, slides.findIndex((s) => s.dataset.slug === keep));
  slides.forEach((s, i) => s.classList.toggle('is-active', i === target));
  readSlides();
  updateBar();
  enhance(slidesEl);
  restartCycle();
  warmNeighbours();
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
  const sig = sigOf([s.watch, ...s.extras, s.white]);
  if (sig === sigs.watch) return;
  sigs.watch = sig;
  panel.innerHTML = watchPanelHTML(s.watch, s.extras, s.white);
  enhance(panel);
}

function sync() {
  if (!Object.keys(sigs).length) initSigs();
  if (!isEdited() && !hydrated) return;
  hydrated = true;
  renderHero();
  renderNew();
  renderLooks();
  renderWatch();
}

/* ======================================================================
   Curtain wipe on the accessories photo. The shared data-reveal="clip"
   never fires in Chromium (the target's own clip-path makes its
   intersection zero), so the wrapper is observed and its picture clipped.
   ====================================================================== */

function setupCurtains() {
  const items = $$('[data-curtain]');
  if (!items.length) return;
  if (!('IntersectionObserver' in window) || reducedMotion()) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-in');
    io.unobserve(entry.target);
  }), { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
  items.forEach((el) => io.observe(el));
}

/* ----- Start ----- */
setupHero();
setupLooks();
setupItems();
setupCurtains();
onStore(sync).catch(() => { /* app.js reports a failed catalogue load */ });
