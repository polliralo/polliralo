// Small UI helpers shared by every page: dialogs with open/close motion,
// toasts, a polite live region, scroll reveals, image fade-in and the
// bag count pulse.

import { esc, picture } from './render.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ----- Dialogs ----- */

export function openDialog(dialog, { opener } = {}) {
  if (!dialog) return;
  if (dialog.open) {
    // Asked to open again while its closing motion runs: keep it open.
    if (dialog.classList.contains('is-closing')) stopClosing(dialog);
    return;
  }
  stopClosing(dialog); // a close cut short by dialog.close() may have left its timer
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
  // Finish on the dialog's own animation (not a child's), with a safety timer.
  // Both are cleared when done, so a dialog reopened soon after is not shut.
  const done = (e) => {
    if (e?.type === 'animationend' && e.target !== dialog) return;
    stopClosing(dialog);
    dialog.close();
  };
  dialog._closeDone = done;
  dialog.addEventListener('animationend', done);
  dialog._closeTimer = setTimeout(done, 500);
}

function stopClosing(dialog) {
  clearTimeout(dialog._closeTimer);
  if (dialog._closeDone) dialog.removeEventListener('animationend', dialog._closeDone);
  dialog._closeDone = null;
  dialog.classList.remove('is-closing');
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

/* ----- Header bag count pulse ----- */

export function bumpBag() {
  if (reducedMotion()) return;
  $$('[data-bag-count]').forEach((el) => {
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  });
}

/* ----- Same-page view transitions (gallery swaps, grid re-sorts) ----- */

/** Run a DOM update inside document.startViewTransition when supported. */
export function withTransition(update) {
  if (!document.startViewTransition || reducedMotion()) {
    update();
    return null;
  }
  // vt-same keeps the page-wide fade (meant for page loads) out of this change.
  const root = document.documentElement;
  root.classList.add('vt-same');
  const transition = document.startViewTransition(update);
  transition.finished.finally(() => root.classList.remove('vt-same'));
  return transition;
}
