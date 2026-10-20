// Inline SVG icons, drawn on a 24px grid in the current text colour.
// Phone, message and arrow shapes adapted from Lucide (ISC License); the rest drawn for CoolCare.

import { raw } from './html.mjs';

const PATHS = {
  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  arrowUp: '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
  menu: '<path d="M4 9h16"/><path d="M4 15h16"/>',
  close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  // A split AC's indoor unit with air flowing from it.
  ac: '<rect x="2.75" y="4.75" width="18.5" height="8.5" rx="2"/><path d="M6 10.25h12"/><path d="M8 16.5c-.6 1-1.4 1.6-2.4 2"/><path d="M12 16.5V19"/><path d="M16 16.5c.6 1 1.4 1.6 2.4 2"/>',
};

export function icon(name, className = 'icon') {
  return raw(
    `<svg class="${className}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${PATHS[name]}</svg>`,
  );
}

// The brand mark: the C of CoolCare with the small status light every AC carries.
// "solid" sits on light grounds, "inverse" (no tile) on navy ones.
export function mark(variant = 'solid') {
  const tile = variant === 'solid' ? '<rect width="32" height="32" rx="9" fill="#0B1F33"/>' : '';
  return raw(
    `<svg class="logo__mark" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false">${tile}<path d="M21.66 10.34A8 8 0 1 0 21.66 21.66" fill="none" stroke="#fff" stroke-width="2.75" stroke-linecap="round"/><circle cx="22" cy="16" r="2.25" fill="#18B7D3"/></svg>`,
  );
}
