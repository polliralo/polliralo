// Small UI helpers shared by every page: dialogs with open/close motion,
// toasts, a polite live region, scroll reveals, image fade-in and the
// "fly to bag" animation.

import { esc, picture } from './render.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ----- Dialogs ----- */

export function openDialog(dialog, { opener } = {}) {
  if (!dialog || dialog.open) return;
  dialog._opener = opener ?? document.activeElement;
  dialog.classList.remove('is-closing');
  dialog.showModal();
  document.documentElement.classList.add('is-locked');
  if (!dialog._wired) {
    dialog._wired = true;
    // Click on the backdrop closes.
    dialog.addEventListener('click', (e) => { if (e.target === dialog) closeDialog(dialog); });
    // Esc: play the closing motion instead of snapping shut.
    dialog.addEventListener('cancel', (e) => { e.preventDefault(); closeDialog(dialog); });
    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('is-locked');
      dialog._opener?.focus?.({ preventScroll: true });
    });
  }
}

export function closeDialog(dialog) {
  if (!dialog?.open || dialog.classList.contains('is-closing')) return;
  if (reducedMotion()) { dialog.close(); return; }
  dialog.classList.add('is-closing');
  const done = () => { dialog.classList.remove('is-closing'); dialog.close(); };
  dialog.addEventListener('animationend', done, { once: true });
  setTimeout(() => { if (dialog.open) done(); }, 500);
}

/* ----- Live region and toasts ----- */

let live;
export function announce(message) {
  if (!live) {
    live = document.createElement('div');
    live.className = 'visually-hidden';
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('role', 'status');
    document.body.append(live);
  }
  live.textContent = '';
  requestAnimationFrame(() => { live.textContent = message; });
}

let toastHost;
/**
 * toast({ message, imageKey, action: { label, href } | { label, onClick }, timeout })
 * Visual only; pair with announce() for screen readers.
 */
export function toast({ message, imageKey, action, timeout = 4200 }) {
  if (!toastHost) {
    toastHost = document.createElement('div');
    toastHost.className = 'toasts';
    document.body.append(toastHost);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = (imageKey ? picture(imageKey, { alt: '', sizes: '40px', loading: 'eager' }) : '')
    + `<span>${esc(message)}</span>`
    + (action?.href ? `<a href="${esc(action.href)}">${esc(action.label)}</a>` : '')
    + (action?.onClick ? `<button type="button">${esc(action.label)}</button>` : '');
  if (action?.onClick) el.querySelector('button').addEventListener('click', () => { action.onClick(); dismiss(); });
  el.querySelectorAll('.pic img').forEach((img) => img.classList.add('is-loaded'));
  toastHost.append(el);
  let timer = setTimeout(dismiss, timeout);
  el.addEventListener('mouseenter', () => clearTimeout(timer));
  el.addEventListener('mouseleave', () => { timer = setTimeout(dismiss, 1800); });
  function dismiss() {
    clearTimeout(timer);
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 360);
  }
  return dismiss;
}

/* ----- Scroll reveals ----- */

let revealObserver;
export function observeReveals(root = document) {
  const items = $$('[data-reveal]:not(.is-in)', root);
  if (!items.length) return;
  // Stagger siblings inside a [data-stagger] parent.
  $$('[data-stagger]', root).forEach((parent) => {
    [...parent.children].forEach((child, i) => child.style.setProperty('--i', String(i % 8)));
  });
  if (!('IntersectionObserver' in window) || !document.documentElement.classList.contains('motion')) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  revealObserver ??= new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach((el) => revealObserver.observe(el));
}

/* ----- Images fade in once decoded ----- */

export function watchImages(root = document) {
  $$('.pic img:not(.is-loaded)', root).forEach((img) => {
    const show = () => img.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) show();
    else {
      img.addEventListener('load', show, { once: true });
      img.addEventListener('error', show, { once: true });
    }
  });
}

/** Wire up reveals and image fades for freshly rendered markup. */
export function enhance(root = document) {
  watchImages(root);
  observeReveals(root);
}

/* ----- Fly to bag ----- */

export function flyToBag(sourceImg) {
  const target = $$('[data-open-cart]').find((el) => el.offsetParent !== null);
  if (!sourceImg || !target || reducedMotion()) { bumpBag(); return; }
  const from = sourceImg.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (!from.width || !to.width) { bumpBag(); return; }
  const ghost = document.createElement('div');
  ghost.className = 'fly';
  const w = Math.min(from.width, 220);
  const h = w * (from.height / from.width);
  Object.assign(ghost.style, { left: `${from.left + (from.width - w) / 2}px`, top: `${from.top + (from.height - h) / 2}px`, width: `${w}px`, height: `${h}px` });
  const img = document.createElement('img');
  img.src = sourceImg.currentSrc || sourceImg.src;
  img.alt = '';
  ghost.append(img);
  document.body.append(ghost);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const anim = ghost.animate([
    { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0 },
    { transform: `translate(${dx * 0.55}px, ${dy * 0.35 - 40}px) scale(.55)`, opacity: 1, offset: 0.55 },
    { transform: `translate(${dx}px, ${dy}px) scale(.08)`, opacity: 0.2, offset: 1 },
  ], { duration: 780, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' });
  anim.onfinish = () => { ghost.remove(); bumpBag(); };
}

export function bumpBag() {
  $$('[data-bag-count]').forEach((el) => {
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  });
}
