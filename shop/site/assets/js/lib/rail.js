// Horizontal product rails: arrow buttons scroll by most of a screen and
// disable themselves at either end. Markup:
//   <div class="rail-wrap" data-rail>
//     <div class="rail-nav"><button data-rail-prev aria-label="Previous">…</button><button data-rail-next aria-label="Next">…</button></div>
//     <div class="rail" tabindex="0" role="region" aria-label="…">…cards…</div>
//   </div>

import { $$, reducedMotion } from './ui.js';

export function initRails(root = document) {
  $$('[data-rail]', root).forEach((wrap) => {
    if (wrap._rail) return;
    wrap._rail = true;
    const rail = wrap.querySelector('.rail');
    const prev = wrap.querySelector('[data-rail-prev]');
    const next = wrap.querySelector('[data-rail-next]');
    if (!rail) return;
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth - 2;
      if (prev) prev.disabled = rail.scrollLeft <= 2;
      if (next) next.disabled = rail.scrollLeft >= max;
    };
    const go = (dir) => rail.scrollBy({ left: dir * rail.clientWidth * 0.9, behavior: reducedMotion() ? 'auto' : 'smooth' });
    prev?.addEventListener('click', () => go(-1));
    next?.addEventListener('click', () => go(1));
    rail.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  });
}
