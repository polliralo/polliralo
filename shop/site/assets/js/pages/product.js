// Product page behaviour (/products/<slug>/ and the /product/?slug= shell):
// gallery (thumbnails, phone swipe with dots, full-screen viewer), size
// choice with ?size= in the URL, quantity, Add to bag, the size guide, the
// sticky phone bar, "Complete the look" adds, and re-rendering from the store
// after an admin edit. Markup always comes from lib/pdp-view.js.

import { loadStore, onStore, getProduct, getCategory, getCategories, getProducts, getSizeGuide, isEdited, seedProduct } from '../lib/store.js';
import { MAX_QTY } from '../lib/cart.js';
import { addToBag } from '../lib/actions.js';
import { $, $$, openDialog, announce, enhance, reducedMotion } from '../lib/ui.js';
import { initRails } from '../lib/rail.js';
import { breadcrumbs, money } from '../lib/render.js';
import * as view from '../lib/pdp-view.js';

const PHONE = '(max-width: 760px)';
const isPhone = () => window.matchMedia(PHONE).matches;
const behavior = () => (reducedMotion() ? 'auto' : 'smooth');
const two = (n) => String(n).padStart(2, '0');
const storeAccess = () => ({ getProduct, getCategory, products: getProducts(), sizeGuide: getSizeGuide() });
const pageTitle = (p, category) => `${p.name} | ${category?.title ?? 'Shop'} | MONO`;

const staticRoot = $('[data-pdp]');
const shell = $('[data-pdp-dynamic]');

if (staticRoot) {
  const page = mount(staticRoot);
  let synced = false;
  // Pre-rendered from the seed catalogue: only touch the markup once the
  // admin has changed something in this browser (no flash otherwise).
  onStore(() => {
    if (!isEdited() && !synced) return;
    synced = true;
    page.sync();
  }).catch(() => { /* the page still works from its own markup */ });
} else if (shell) {
  renderDynamic(shell);
}

/* ======================================================================= */

function mount(root) {
  const slug = root.dataset.slug;
  const state = { size: null, qty: 1, index: 0, gone: false };

  /* ----- Gallery ----- */
  const track = $('[data-pdp-track]', root);
  const frame = $('[data-pdp-frame]', root);
  const slides = $$('[data-slide]', track);
  const thumbsWrap = $('[data-pdp-thumbs]', root);
  const thumbs = $$('[data-thumb]', root);
  const dots = $$('[data-dot]', root);
  const n = slides.length;
  const images = slides.map((s) => s.querySelector('img'));

  let swapTimer = 0;
  function warm(i) {
    const img = images[i];
    if (img && img.loading === 'lazy') img.loading = 'eager';
  }
  // Desktop: once the page has loaded, fetch the other angles quietly so a
  // thumbnail swap never waits on the network. Phones lazy-load as they swipe.
  const warmAll = () => { if (!isPhone()) images.forEach((_, k) => warm(k)); };
  if (document.readyState === 'complete') setTimeout(warmAll, 600);
  else window.addEventListener('load', () => setTimeout(warmAll, 600), { once: true });

  function setActive(i, { from = 'ui', focus = false } = {}) {
    if (!n) return;
    const next = Math.max(0, Math.min(n - 1, i));
    const prevIndex = state.index;
    const changed = next !== prevIndex;
    state.index = next;
    warm(next);
    clearTimeout(swapTimer);
    slides.forEach((s, k) => {
      s.classList.remove('is-entering', 'is-leaving');
      s.classList.toggle('is-active', k === next);
      if (k === next) s.removeAttribute('aria-hidden');
      else s.setAttribute('aria-hidden', 'true');
    });
    // Desktop crossfade: the leaving slide fades out while the new one fades in.
    if (changed && !isPhone() && !reducedMotion() && document.documentElement.classList.contains('motion')) {
      const leaving = slides[prevIndex];
      leaving?.classList.add('is-leaving');
      slides[next].classList.add('is-entering');
      swapTimer = setTimeout(() => {
        leaving?.classList.remove('is-leaving');
        slides[next].classList.remove('is-entering');
      }, 760);
    }
    thumbs.forEach((t, k) => {
      if (k === next) t.setAttribute('aria-current', 'true');
      else t.removeAttribute('aria-current');
      t.tabIndex = k === next ? 0 : -1;
    });
    dots.forEach((d, k) => {
      if (k === next) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
    const index = $('[data-pdp-index]', root);
    if (index) index.textContent = two(next + 1);
    const viewName = $('[data-pdp-view]', root);
    if (viewName) viewName.textContent = thumbs[next]?.getAttribute('aria-label')?.split(': ').slice(1).join(': ') ?? '';
    $('.pdp-progress i', root)?.style.setProperty('--x', String(next));
    frame?.style.setProperty('--ghost-shift', String(next));
    if (from !== 'scroll' && isPhone() && track) {
      track.scrollTo({ left: next * track.clientWidth, behavior: changed ? behavior() : 'auto' });
    }
    if (focus) thumbs[next]?.focus();
  }

  thumbs.forEach((t, i) => {
    t.addEventListener('click', () => setActive(i));
    t.addEventListener('pointerenter', () => warm(i));
    t.addEventListener('focus', () => warm(i));
  });
  thumbsWrap?.addEventListener('keydown', (e) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    let i = null;
    if (step) i = (state.index + step + n) % n;
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = n - 1;
    if (i == null) return;
    e.preventDefault();
    setActive(i, { focus: true });
  });
  dots.forEach((d, i) => d.addEventListener('click', () => setActive(i)));

  // Phones: the frame is a scroll-snap row; the slide in view becomes active.
  if (track && n > 1 && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (!isPhone()) return;
      entries.forEach((e) => {
        if (e.isIntersecting && e.intersectionRatio >= 0.6) setActive(Number(e.target.dataset.slide), { from: 'scroll' });
      });
    }, { root: track, threshold: [0.6] });
    slides.forEach((s) => io.observe(s));
    window.matchMedia(PHONE).addEventListener('change', () => {
      if (isPhone()) track.scrollLeft = state.index * track.clientWidth;
    });
  }

  /* ----- Full-screen viewer ----- */
  const viewer = $('[data-pdp-viewer]', root);
  const zoom = $('[data-pdp-zoom]', root);
  let vIndex = 0;
  if (viewer) {
    const vTrack = $('[data-viewer-track]', viewer);
    const vSlides = $$('[data-viewer-slide]', viewer);
    const prev = $('[data-viewer-prev]', viewer);
    const next = $('[data-viewer-next]', viewer);
    const vCount = $('[data-viewer-index]', viewer);
    const vUpdate = (i) => {
      vIndex = i;
      if (vCount) vCount.textContent = two(i + 1);
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === vSlides.length - 1;
      vSlides.forEach((s, k) => {
        if (k === i) s.removeAttribute('aria-hidden');
        else s.setAttribute('aria-hidden', 'true');
      });
      [i - 1, i, i + 1].forEach((k) => {
        const img = vSlides[k]?.querySelector('img');
        if (img && img.loading === 'lazy') img.loading = 'eager';
      });
    };
    const vGo = (i, animate = true) => {
      const k = Math.max(0, Math.min(vSlides.length - 1, i));
      vUpdate(k);
      vTrack.scrollTo({ left: k * vTrack.clientWidth, behavior: animate ? behavior() : 'auto' });
    };
    const open = () => {
      vUpdate(state.index);
      openDialog(viewer, { opener: zoom });
      vGo(state.index, false);
    };
    zoom?.addEventListener('click', open);
    track?.addEventListener('click', open);
    prev?.addEventListener('click', () => vGo(vIndex - 1));
    next?.addEventListener('click', () => vGo(vIndex + 1));
    viewer.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); vGo(vIndex - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); vGo(vIndex + 1); }
      if (e.key === 'Home') { e.preventDefault(); vGo(0); }
      if (e.key === 'End') { e.preventDefault(); vGo(vSlides.length - 1); }
    });
    if ('IntersectionObserver' in window) {
      const vio = new IntersectionObserver((entries) => {
        if (!viewer.open) return;
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) vUpdate(Number(e.target.dataset.viewerSlide));
        });
      }, { root: vTrack, threshold: [0.6] });
      vSlides.forEach((s) => vio.observe(s));
    }
    // Closing leaves the main gallery on the image last viewed.
    viewer.addEventListener('close', () => { if (vIndex !== state.index) setActive(vIndex); });
    window.addEventListener('resize', () => {
      if (viewer.open) vTrack.scrollLeft = vIndex * vTrack.clientWidth;
    }, { passive: true });
  }

  /* ----- Buy form ----- */
  const form = () => $('[data-pdp-form]', root);
  const radios = () => $$('input[name="size"]', root);
  const sized = () => form()?.dataset.sized === 'true';
  const optionLabel = () => (form()?.dataset.option ?? 'Size');

  // A light product built from the form's own data-* (kept in step with the store by sync()).
  function domProduct() {
    const f = form();
    if (!f) return { variants: [] };
    if (sized()) {
      return { variants: radios().map((r) => ({ id: r.value, label: r.dataset.label ?? r.value, stock: Number(r.dataset.stock) || 0 })) };
    }
    return { variants: [{ id: f.dataset.variant, label: 'One size', stock: Number(f.dataset.stock) || 0 }] };
  }
  const cap = () => view.qtyCap(domProduct(), state.size, MAX_QTY);
  const soldOut = () => domProduct().variants.every((v) => !(v.stock > 0));

  function renderQty() {
    const stepper = $('[data-pdp-qty]', root);
    if (!stepper) return;
    const max = cap();
    state.qty = Math.max(1, Math.min(state.qty, max));
    stepper.dataset.max = String(max);
    $('output', stepper).textContent = String(state.qty);
    $('[data-step="-1"]', stepper).disabled = state.qty <= 1;
    $('[data-step="1"]', stepper).disabled = soldOut() || state.qty >= max;
  }

  function refreshChoice() {
    const p = domProduct();
    const chosen = radios().find((r) => r.checked);
    state.size = chosen ? chosen.value : (sized() ? null : state.size);
    const label = chosen?.dataset.label ?? '';
    const chosenEl = $('[data-pdp-chosen]', root);
    if (chosenEl) chosenEl.textContent = label ? `: ${label}` : '';
    radios().forEach((r) => r.closest('.chip')?.classList.toggle('is-on', r.checked));
    const stock = view.stockLine(p, state.size);
    const stockEl = $('[data-pdp-stock]', root);
    if (stockEl) {
      if (stockEl.textContent !== stock.text) stockEl.textContent = stock.text;
      stockEl.dataset.state = stock.state;
    }
    const stickySize = $('[data-sticky-size]', root);
    if (stickySize) stickySize.textContent = label ? `${optionLabel()} ${label}` : `Select ${optionLabel().toLowerCase()}`;
    $$('[data-guide-row]', root).forEach((row) => row.classList.toggle('is-on', Boolean(label) && row.dataset.guideRow === label));
    renderQty();
  }

  function choose(id, { updateUrl = true } = {}) {
    const radio = radios().find((r) => r.value === id);
    if (!radio || radio.disabled) return;
    radio.checked = true;
    clearError();
    refreshChoice();
    if (updateUrl) {
      const u = new URL(window.location.href);
      u.searchParams.set('size', id);
      history.replaceState(history.state, '', u);
    }
  }

  function clearError() {
    const err = $('[data-pdp-error]', root);
    if (!err || err.hidden) return;
    err.hidden = true;
    const fs = $('[data-pdp-options]', root);
    fs?.removeAttribute('aria-invalid');
    fs?.removeAttribute('aria-describedby');
    $('[data-pdp-option]', root)?.classList.remove('is-invalid');
  }

  function showError() {
    const fs = $('[data-pdp-options]', root);
    const err = $('[data-pdp-error]', root);
    if (!fs || !err) return;
    err.hidden = false;
    fs.setAttribute('aria-invalid', 'true');
    fs.setAttribute('aria-describedby', 'pdp-size-error');
    const wrap = $('[data-pdp-option]', root);
    wrap?.classList.remove('is-invalid');
    void wrap?.offsetWidth; // restart the attention motion
    wrap?.classList.add('is-invalid');
    const r = fs.getBoundingClientRect();
    const top = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    if (r.top < top || r.bottom > window.innerHeight - 96) fs.scrollIntoView({ block: 'center', behavior: behavior() });
    radios().find((x) => !x.disabled)?.focus({ preventScroll: true });
    announce(`Choose a ${optionLabel().toLowerCase()} first.`);
  }

  function flash(btn) {
    if (!btn) return;
    const label = $('[data-add-label]', btn);
    const done = $('[data-add-done]', btn);
    btn.classList.add('is-added');
    label?.setAttribute('aria-hidden', 'true');
    done?.removeAttribute('aria-hidden');
    clearTimeout(btn._addedTimer);
    btn._addedTimer = setTimeout(() => {
      btn.classList.remove('is-added');
      label?.removeAttribute('aria-hidden');
      done?.setAttribute('aria-hidden', 'true');
    }, 2000);
  }

  async function add(fromSticky = false) {
    const f = form();
    if (!f || soldOut()) return;
    if (sized() && !state.size) { showError(); return; }
    const variant = sized() ? state.size : f.dataset.variant;
    try { await loadStore(); } catch { return; }
    const res = addToBag(slug, variant, { qty: state.qty });
    if (res.ok) {
      flash($('[data-pdp-add]', root));
      if (fromSticky) flash($('[data-sticky-add]', root));
      state.qty = 1;
      renderQty();
    }
  }

  root.addEventListener('change', (e) => {
    if (e.target.matches('input[name="size"]')) choose(e.target.value);
  });
  root.addEventListener('submit', (e) => {
    if (!e.target.matches('[data-pdp-form]')) return;
    e.preventDefault();
    add();
  });
  root.addEventListener('click', (e) => {
    const step = e.target.closest('[data-step]');
    if (step && step.closest('[data-pdp-qty]')) {
      state.qty += Number(step.dataset.step);
      renderQty();
      return;
    }
    const guideBtn = e.target.closest('[data-open-guide]');
    if (guideBtn) {
      const guide = $('[data-pdp-guide]', root);
      if (guide) openDialog(guide, { opener: guideBtn });
      return;
    }
    if (e.target.closest('[data-sticky-add]')) { add(true); return; }
    const look = e.target.closest('[data-look-add]');
    if (look) {
      loadStore().then(() => {
        const res = addToBag(look.dataset.lookAdd, look.dataset.variant);
        if (res.ok) flash(look);
      }).catch(() => {});
    }
  });

  // Colour swatches: pointing at one previews its name in the label.
  const colourName = () => $('[data-pdp-colour]', root);
  const currentColour = () => $('.pdp-sw[aria-current]', root)?.dataset.colour ?? '';
  const preview = (e) => {
    const sw = e.target.closest?.('.pdp-sw');
    const el = colourName();
    if (sw && el) el.textContent = sw.dataset.colour;
  };
  const restore = (e) => {
    const sw = e.target.closest?.('.pdp-sw');
    const el = colourName();
    if (sw && el && !sw.contains(e.relatedTarget)) el.textContent = currentColour();
  };
  root.addEventListener('pointerover', preview);
  root.addEventListener('pointerout', restore);
  root.addEventListener('focusin', preview);
  root.addEventListener('focusout', restore);

  /* ----- Sticky bar (phones): shows once the buy form has scrolled away -----
     The sentinel reaches from far above the form to its bottom edge, so it
     stops intersecting exactly when Add to bag is above the viewport, even
     after a jump (Home key, tap on the status bar) that skips past the form. */
  let pastForm = false;
  let footerSeen = false;
  const sticky = () => $('[data-pdp-sticky]', root);
  const updateSticky = () => {
    const bar = sticky();
    if (!bar) return;
    const show = pastForm && !footerSeen && !state.gone;
    bar.classList.toggle('is-shown', show);
    bar.inert = !show;
  };
  if ('IntersectionObserver' in window) {
    const sentinel = $('[data-pdp-sentinel]', root);
    if (sentinel) {
      new IntersectionObserver(([e]) => {
        pastForm = !e.isIntersecting;
        updateSticky();
      }).observe(sentinel);
    }
    const footer = $('.site-footer');
    if (footer) {
      new IntersectionObserver(([e]) => { footerSeen = e.isIntersecting; updateSticky(); }).observe(footer);
    }
  }

  /* ----- Start ----- */
  initRails(root);
  const want = new URLSearchParams(window.location.search).get('size');
  if (want && sized()) {
    const w = want.trim().toLowerCase();
    const hit = radios().find((r) => !r.disabled && (r.value.toLowerCase() === w || (r.dataset.label ?? '').toLowerCase() === w));
    if (hit) choose(hit.value, { updateUrl: false });
  }
  refreshChoice();

  /* ----- Re-render from the store (admin edits, stock changes) ----- */
  function sync() {
    if (state.gone) return;
    const p = getProduct(slug);
    const category = getCategory((p ?? seedProduct(slug))?.category);
    if (!p || p.hidden) {
      state.gone = true;
      updateSticky();
      root.outerHTML = view.unavailableHTML(p ?? seedProduct(slug), category, { categories: getCategories() });
      document.title = 'No Longer Available | MONO';
      return;
    }
    const data = view.collect(p, storeAccess());
    const set = (sel, text) => { const el = $(sel, root); if (el && el.textContent !== text) el.textContent = text; };
    set('[data-pdp-name]', p.name);
    set('[data-pdp-price]', money(p.price));
    set('[data-pdp-summary]', p.summary ?? '');
    const details = $('[data-pdp-details]', root);
    if (details) details.innerHTML = view.detailsBodyHTML(p);

    const f = form();
    if (f) {
      const keep = view.matchVariant(p, state.size);
      const isSizedNow = view.isSized(p);
      f.dataset.sized = String(isSizedNow);
      f.dataset.option = p.option?.label ?? 'Size';
      if (isSizedNow) { delete f.dataset.variant; delete f.dataset.stock; } else {
        f.dataset.variant = p.variants?.[0]?.id ?? '';
        f.dataset.stock = String(Math.max(0, Number(p.variants?.[0]?.stock) || 0));
      }
      const body = $('[data-pdp-form-body]', f);
      if (body) body.innerHTML = view.formInnerHTML(p, { selected: keep });
      state.size = keep;
    }
    const bar = sticky();
    if (bar) {
      const shown = bar.classList.contains('is-shown');
      bar.outerHTML = view.stickyHTML(p);
      if (shown) { sticky().classList.add('is-shown'); sticky().inert = false; }
    }
    const lookSlot = $('[data-pdp-look-slot]', root);
    if (lookSlot) lookSlot.innerHTML = view.lookHTML(data.look);
    const moreSlot = $('[data-pdp-more-slot]', root);
    if (moreSlot) moreSlot.innerHTML = view.moreHTML(p, data.category, data.more);
    refreshChoice();
    initRails(root);
    enhance(root);
    document.title = pageTitle(p, data.category);
  }

  return { sync };
}

/* ----- /product/?slug= : products that only exist in this browser ----- */

async function renderDynamic(host) {
  const params = new URLSearchParams(window.location.search);
  const slug = (params.get('slug') ?? '').trim();
  let page = null;
  const draw = () => {
    const p = slug ? getProduct(slug) : null;
    host.removeAttribute('aria-busy');
    if (!p || p.hidden) {
      const category = p ? getCategory(p.category) : null;
      host.innerHTML = p
        ? view.unavailableHTML(p, category, { categories: getCategories() })
        : view.notFoundHTML({ categories: getCategories(), slug });
      document.title = p ? 'No Longer Available | MONO' : 'Product Not Found | MONO';
      return null;
    }
    const data = view.collect(p, storeAccess());
    const items = view.trail(p, data.category);
    host.innerHTML = view.pdpHTML(p, data, { crumbs: breadcrumbs(items) });
    document.title = pageTitle(p, data.category);
    enhance(host);
    return mount($('[data-pdp]', host));
  };
  try {
    await loadStore();
  } catch {
    host.removeAttribute('aria-busy');
    host.innerHTML = view.notFoundHTML({ categories: [], slug });
    return;
  }
  page = draw();
  window.addEventListener('mono:catalog', () => {
    if (page) page.sync();
    else page = draw();
  });
}
