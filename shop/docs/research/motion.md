# MONO: premium motion and the browser support it relies on (checked 2026-10-14)

**How this was checked.** Support data comes from `@mdn/browser-compat-data` **8.1.5** (2026-10-08) and `web-features` **3.42.0**. These are the datasets that MDN, caniuse and Baseline are built from. Each was downloaded and queried feature by feature. Behaviour details come from the MDN source on GitHub, the CSS View Transitions L2 spec source, the Interop 2026 README, and search confirmation of Chrome, web.dev and Shopify docs. The proxy blocked direct fetches of MDN, web.dev, caniuse and developer.chrome.com.

**Current stable versions:** Chrome 155, Edge 154, Firefox 157 (158 is due 2026-10-13), Safari and iOS Safari 27.

## 1. Support matrix and fallbacks

| Feature | Chrome/Edge | Safari (macOS + iOS) | Firefox | Status | How MONO should use it |
|---|---|---|---|---|---|
| Cross-document view transitions (`@view-transition { navigation: auto }`) | 126 | 18.2 | **No** (bug 1860854; in Interop 2026) | Not Baseline | Enhancement only. Without it the page simply loads normally. |
| `view-transition-name` | 111 | 18 | 144 | Baseline 2025 | Set it dynamically (see §2). |
| `view-transition-name: match-element` | 137 | 18.4 | 144 | ok in all three | Useful for re-ordering the grid in the same document. |
| `view-transition-class` | 125 | 18.2 | 144 | Baseline 2025-10-14 | Optional. With dynamic naming one fixed name is enough. |
| `pageswap` / `pagereveal` events | 124 / 123 | 18.2 (pageswap does not fire on cross-origin navigation) | No | Not Baseline | Only fire where cross-document VT exists, so feature-detect with `e.viewTransition`. |
| `navigation.activation` (Navigation API) | 123 | **26.2** | 147 | ok in all three current | Safari 18.2 to 26.1 has `pagereveal` but no `navigation`, so keep a sessionStorage fallback. |
| `<link rel="expect" blocking="render">` | 124 | 18.2 | No | Interop 2026 | Put it in the head of product pages. Browsers without it ignore it. |
| VT types (`ViewTransition.types`, `:active-view-transition-type()`) | 125 | 18.2 | 147 | ok in all three current | Optional. |
| `document.startViewTransition()` (same document) | 111 | 18 | 144 | Baseline 2025-10-14 | `if (!document.startViewTransition) update()`. The options-object form needs Firefox 147, so use the callback form. |
| Element-scoped VT, `view-transition-scope`, `waitUntil` | 147 / 144 | No | No | Experimental | Don't use. |
| Scroll-driven animations (`animation-timeline: view()/scroll()`, `animation-range`) | 115 | **26** | **Nightly only** | Not Baseline (Interop 2026) | Wrap in `@supports (animation-timeline: view())`. Use only for decorative scrubbing. One-shot reveals use IntersectionObserver instead. |
| `@starting-style` | 117 | 17.5 | 129 | Baseline 2024 | Entry animations for dialog and popover. |
| `transition-behavior: allow-discrete` | 117 | 17.4 | 129 | Baseline 2024 | ok |
| Transitioning `display` (exit animations) | 117 | 18 | **No** | n/a | Firefox hides instantly. For exits that must work everywhere, use a JS `.is-closing` class, then `close()`. |
| `overlay` (keeps the element in the top layer during exit) | 117 | No | No | Chrome only | Optional. |
| Popover API | 114 | 17 (iOS 18.3 fixes) | 125 | Baseline 2025-01-27 | Sort, filter and account menus, size-guide tips. |
| `popover="hint"` | 151 | Tech Preview | 153 | Not Baseline | Skip. |
| `<dialog>` + `showModal()` | 37 | 15.4 | 98 | Baseline widely available | Cart drawer, mobile nav, search overlay. |
| `dialog closedby="any"` | 134 | **No** (Tech Preview) | 141 | Interop 2026 | Add it, and also keep a JS backdrop-click close. |
| `requestClose()` | 134 | 18.4 | 139 | ok | Optional. |
| Invoker commands (`commandfor` / `command="show-modal"`) | 135 | 26.2 | 144 | Baseline 2025-12-12 | Optional declarative open. Keep a JS click handler too. |
| `:open` pseudo-class | 133 | 26.5 | 136 | Baseline 2026-05-11 | Prefer `[open]` / `:popover-open` for now. |
| CSS anchor positioning (`anchor-name`, `position-anchor`, `position-area`, `position-try-fallbacks`) | 125 | **26** | **147** | Not yet Baseline: `position-anchor`'s initial value changed, and fully conforming versions are Chrome/Firefox 151 and Safari 27 (Interop 2026) | Works in all three current engines. Always set `anchor-name` **and** `position-anchor` explicitly; don't rely on the implicit popover anchor. Fallback: `@supports not (anchor-name: --a)` gives a bottom sheet or a JS rect position. |
| `text-wrap: balance` | 114 | 17.5 | 121 | Baseline 2024 | Headings. |
| `text-wrap: pretty` | 117 | 26 | **No** | Not Baseline | Body copy. Firefox ignores it, which is harmless. |
| `linear()` easing | 113 | 17.2 | 112 | **Baseline widely available (2026-06-11)** | Safe to use. |
| `sibling-index()` | 138 | 26.2 | 154 | Baseline 2026-08-18 | Too new to rely on. Write `--i` into the HTML at build time instead. |
| `content-visibility: auto` | 85 | 18 (find-in-page fixed in 26) | 125 | Baseline 2025-09-15 | Below-the-fold sections. |
| `::details-content` | 131 | 18.4 | 143 | Baseline 2025 | Accordion styling. Animating its height needs `interpolate-size`, which is Chrome-only, so other browsers open instantly. |
| Speculation rules (prerender) | 109 | 26.2 behind a flag | No | Chrome only | Optional for `/products/*`. Makes cross-document transitions start instantly. |
| `prefers-reduced-motion`, WAAPI `el.animate()`, IntersectionObserver, `:has()`, scroll-snap, individual `translate`/`scale` | all | all | all | Baseline widely available | These form the base layer. |

## 2. Cross-document page transitions (product card image → product page image)

**Rules from the spec, MDN and Chrome:**
- Both pages must opt in, and the navigation must be same-origin with no cross-origin redirect.
- It runs on push, replace and traverse (back/forward). It does **not** run on reload, on typing in the address bar, or on bookmarks.
- Chrome skips the transition if the new page takes more than 4 s (`TimeoutError`).
- The browser may skip the transition when it shows its own gesture animation, such as the iOS back-swipe. The no-transition path must look fine.
- Each `view-transition-name` must be unique among rendered elements, or the whole transition is skipped.
- The pseudo-elements only need to be styled in the destination page's CSS, but the stylesheet is shared, so both directions work.

**CSS (shared stylesheet):**
```css
@media (prefers-reduced-motion: no-preference) {
  @view-transition { navigation: auto; }   /* the spec allows nesting it in @media */
}
::view-transition-old(root) { animation: 200ms var(--ease-in) both vt-out; }
::view-transition-new(root) { animation: 420ms var(--ease-out) 80ms both vt-in; }
@keyframes vt-out { to { opacity: 0; } }
@keyframes vt-in  { from { opacity: 0; transform: translateY(12px); } }

/* header stays put (cart count updates without flicker) */
.site-header { view-transition-name: site-header; }
::view-transition-old(site-header) { display: none; }
::view-transition-new(site-header) { animation: none; }

/* the one morphing product image */
::view-transition-group(product-media) {
  animation-duration: 700ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1); /* expo-out */
}
::view-transition-old(product-media), ::view-transition-new(product-media) {
  height: 100%; object-fit: cover; overflow: clip; /* safety net if aspect ratios differ */
}
```

**Morph setup:**
- Give the card image and the PDP main image the **same aspect ratio** (for example 4:5).
- Use the **same image URL** (the same srcset candidate) for both, so the new snapshot is already in memory cache.
- On product pages, the main image must be in the HTML (it is pre-rendered), not lazy, and use `fetchpriority="high"`.
- Add `<link rel="expect" href="#pdp-media" blocking="render">` in the `<head>` of product pages.

**Dynamic naming.** Name only the clicked element and never name all 12 cards statically: duplicates kill the transition, and every name is an extra GPU snapshot. Put this code in an **inline classic `<script>` in `<head>`**, not a module, `defer` or `async`, because `pagereveal` fires before the first render.
```html
<script>
(() => {
  const NAME = 'product-media', KEY = 'mono:vt-from';
  const isPDP = (p) => /^\/products\/[^/]+\/?$/.test(p);
  const slugOf = (p) => p.split('/').filter(Boolean)[1];
  const inView = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };

  addEventListener('pageswap', async (e) => {
    try { sessionStorage.setItem(KEY, location.pathname); } catch {}
    if (!e.viewTransition || !e.activation) return;
    const to = new URL(e.activation.entry.url).pathname;
    let el = null;
    if (isPDP(to)) el = document.querySelector(`[data-slug="${slugOf(to)}"] [data-vt-media]`);
    else if (isPDP(location.pathname)) el = document.getElementById('pdp-media');
    if (!el || !inView(el)) return;
    el.style.viewTransitionName = NAME;
    await e.viewTransition.finished;            // clean up for bfcache restores
    el.style.viewTransitionName = '';
  });

  addEventListener('pagereveal', async (e) => {
    const vt = e.viewTransition; if (!vt) return;
    let from = window.navigation?.activation?.from?.url;
    from = from ? new URL(from).pathname : (() => { try { return sessionStorage.getItem(KEY); } catch { return null; } })();
    let el = null;
    if (isPDP(location.pathname)) el = document.getElementById('pdp-media');
    else if (from && isPDP(from)) {
      const c = document.querySelector(`[data-slug="${slugOf(from)}"] [data-vt-media]`);
      if (c && inView(c)) el = c;
    }
    if (el) { el.style.viewTransitionName = NAME; vt.ready.finally(() => { el.style.viewTransitionName = ''; }); }
    // INP: never make the user wait for an animation (Shopify/Chrome advice)
    const skip = () => vt.skipTransition();
    addEventListener('pointerdown', skip, { once: true });
    addEventListener('keydown', skip, { once: true });
    vt.finished.finally(() => { removeEventListener('pointerdown', skip); removeEventListener('keydown', skip); });
  });
})();
</script>
```

**Same-document transitions** (re-sorting or filtering the collection grid, swapping the PDP gallery image):
```js
export function withTransition(update) {
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return void update();
  document.startViewTransition(update);   // callback form works in Firefox 144+
}
```
For grid re-order, put `view-transition-name: match-element` on the cards (Chrome 137+, Safari 18.4+, Firefox 144+). Set `::view-transition-group(*) { animation-duration: 450ms; animation-timing-function: cubic-bezier(0.22,1,0.36,1); }` and scope it with a type or class if it is used elsewhere.

**Optional, Chrome only.** Prerender product pages on hover so the morph starts instantly. Never prerender `/cart/`, `/checkout/` or `/admin/`:
`<script type="speculationrules">{"prerender":[{"where":{"href_matches":"/products/*"},"eagerness":"moderate"}]}</script>`

## 3. Motion tokens

Curves are verified against easings.net source, Material 3 tokens (material-web) and Carbon (`@carbon/motion` 11.54.0).
```css
:root {
  --ease-out:        cubic-bezier(0.22, 1, 0.36, 1);   /* easeOutQuint: default for entrances and reveals */
  --ease-out-expo:   cubic-bezier(0.16, 1, 0.3, 1);    /* easeOutExpo: image morphs, large moves */
  --ease-in-out:     cubic-bezier(0.65, 0, 0.35, 1);   /* easeInOutCubic: slides moving on-screen to on-screen */
  --ease-in-out-4:   cubic-bezier(0.76, 0, 0.24, 1);   /* easeInOutQuart: curtain/clip wipes */
  --ease-in:         cubic-bezier(0.32, 0, 0.67, 0);   /* easeInCubic: exits */
  --ease-standard:   cubic-bezier(0.2, 0, 0, 1);       /* M3 standard: small UI state changes */
  --ease-settle: linear(0, 0.044, 0.149, 0.283, 0.425, 0.559, 0.677, 0.777, 0.857, 0.917, 0.962,
    0.992, 1.011, 1.022, 1.027, 1.028, 1.026, 1.023, 1.019, 1.015, 1.012, 1.008, 1.006, 1.004, 1);
    /* damped spring (zeta 0.75), about 2.8% overshoot: cart badge only, 500-600ms */
  --dur-1: 120ms;  /* hover colour, underline, focus */
  --dur-2: 200ms;  /* button label swap, small fades, exits of small things */
  --dur-3: 320ms;  /* drawer/overlay exit, dropdown */
  --dur-4: 480ms;  /* drawer enter, popover panels */
  --dur-5: 700ms;  /* page morph, section reveal */
  --dur-6: 1100ms; /* hero image/text intro: once per page, never blocks input */
  --stagger: 60ms; /* 40-80ms per item; cap at 5-6 items (total under 400ms), the rest arrive together */
}
```
**Calibration:**
- Material 3: short 50–200 ms, medium 250–400 ms, long 450–600 ms, extra-long 700–1000 ms.
- Carbon: 70, 110, 150, 240, 400 and 700 ms. Carbon's expressive standard curve is `cubic-bezier(0.4,0.14,0.3,1)` and its entrance curve is `(0,0,0.3,1)`.
- Exits should be about 60–70% of the matching entrance and use ease-in.
- No bounce or overshoot except the cart badge.
- Never use `transition: all`.

## 4. Patterns

**Image reveal.** The default is composited:
- A wrapper with `overflow: clip` and a fixed `aspect-ratio`.
- The inner `img` animates `scale(1.06) → 1` (1100 ms, `--ease-out`) and `opacity 0 → 1` (600 ms).
- It is triggered once by an IntersectionObserver that adds `.is-in` (`threshold 0.15`, `rootMargin '0px 0px -10% 0px'`), then unobserves.
- Hide content only when JS is running: `html.js .reveal:not(.is-in)`.
- Each item gets `transition-delay: calc(min(var(--i), 5) * var(--stagger))`, with `--i` written at build time.
- Use the LQIP blur-up placeholder as the wrapper background.

The editorial "curtain" `clip-path: inset(100% 0 0 0) → inset(0)` runs 900–1000 ms with `--ease-in-out-4`. Use it at most once per page, for example on an editorial image. clip-path can paint on the main thread; Motion's tier list rates it compositor-capable, but test it on an iPhone.

**Never fade the LCP image from `opacity: 0`.** Chromium excludes opacity-0 elements from LCP, so the fade delays LCP. The hero image must be visible at first paint. Animate only a subtle `scale(1.04 → 1)` on it, and fade the text instead.

**Scrubbed parallax.** This is decorative and runs in Chrome and Safari 26 only:
```css
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .parallax img { animation: drift linear both; animation-timeline: view(); animation-range: cover; } /* timeline AFTER the shorthand: the shorthand resets it */
  }
}
@keyframes drift { from { transform: translateY(-6%) scale(1.12); } to { transform: translateY(6%) scale(1.12); } }
```
Don't use scroll-scrubbed fades for content. They reverse on scroll-up and read as cheap, and Firefox doesn't support them.

**Headings.** Use `text-wrap: balance` on headings and `text-wrap: pretty` on paragraphs. For the hero title, put each line in a mask wrapper `clip-path: inset(0 0 -0.15em 0)` with the inner element going `translateY(105%) → 0`. That takes 800 ms with `--ease-out` and an 80 ms stagger between lines. Start it after `document.fonts.ready` to avoid reflow mid-animation. Keep line splits authored per breakpoint, or animate the whole block (`translateY(16px)` + opacity).

**Product card hover.** Wrap it in `@media (hover:hover) and (pointer:fine)`:
- The primary image goes to `scale(1.03)` over 900 ms with `--ease-out`.
- The second view cross-fades in at `opacity` 450 ms.
- The text link underline is `transform: scaleX(0→1)` with `transform-origin: left`, over `--dur-2`.
- Nothing moves on touch devices.

**Add to bag** (Baymard: the confirmation must show the item's details and give clear next steps):
1. **0 ms:** write to localStorage and update the header count. Announce it in an `aria-live="polite"` region, for example "Added Oxford Shirt, size M. Bag: 2 items." There is no fake latency.
2. **0–200 ms:** the button label cross-fades to "Added to bag". The button has a fixed `min-width`, so there is no layout shift.
3. **80 ms:** the cart drawer opens (§ drawer) with the new line item highlighted. The highlight is a sand background that fades to transparent over 1200 ms.
   - The drawer shows the image, name, colour, size, quantity, price, a subtotal labelled demo, **View bag**, **Checkout** and a close / continue-shopping button.
4. **Badge:** WAAPI `scale 1 → 1.15 → 1`, 500 ms, `--ease-settle`. Skip it when reduced motion is on.
5. **2000 ms:** the button label reverts.

Avoid "fly-to-cart" and shake-on-error. A missing size gets an inline message, focus moves to the size group, and the border colour changes.

**Cart drawer** (`<dialog>` + `showModal()`; you get a focus trap, an inert page, Esc and top layer):
```css
.drawer { margin: 0 0 0 auto; height: 100dvh; max-height: none; width: min(440px, 100vw);
  translate: 100% 0; transition: translate var(--dur-4) var(--ease-out); }
.drawer[open] { translate: 0 0; }
@starting-style { .drawer[open] { translate: 100% 0; } }
.drawer::backdrop { background: rgb(23 59 58 / 0); transition: background-color var(--dur-4) linear; }
.drawer[open]::backdrop { background: rgb(23 59 58 / .35); }
@starting-style { .drawer[open]::backdrop { background: rgb(23 59 58 / 0); } }
.drawer.is-closing { translate: 100% 0; transition: translate var(--dur-3) var(--ease-in); }
.drawer.is-closing::backdrop { background: rgb(23 59 58 / 0); transition-duration: var(--dur-3); }
html:has(dialog[open]) { overflow: hidden; scrollbar-gutter: stable; }
```
```js
function closeDrawer(d) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return d.close();
  d.classList.add('is-closing');
  const done = () => { d.classList.remove('is-closing'); d.close(); };
  d.addEventListener('transitionend', done, { once: true });
  setTimeout(() => d.open && done(), 400);              // safety net
}
d.addEventListener('cancel', (e) => { e.preventDefault(); closeDrawer(d); }); // Esc
d.addEventListener('click', (e) => { if (e.target === d) closeDrawer(d); });   // backdrop (Safari has no closedby yet)
```
Drawer contents enter with an 8 px `translateY` and opacity, starting at 120 ms with a 40 ms stagger. The mobile nav and search overlay use the same pattern: full-screen, fade plus 8 px move, links staggered at 50 ms.

**Popover menus** (sort, filter):
```css
[popover] { opacity: 0; translate: 0 -4px;
  transition: opacity var(--dur-2) var(--ease-out), translate var(--dur-2) var(--ease-out),
              display var(--dur-2) allow-discrete, overlay var(--dur-2) allow-discrete; }
[popover]:popover-open { opacity: 1; translate: 0 0; }
@starting-style { [popover]:popover-open { opacity: 0; translate: 0 -4px; } }
@supports (anchor-name: --a) {
  .sort-btn { anchor-name: --sort; }
  #sort-menu { position-anchor: --sort; inset: auto; margin: 4px 0 0; position-area: bottom span-left; position-try-fallbacks: flip-block; }
}
```
Exit animations work in Chrome. Safari 18+ fades them out without `overlay`. Firefox hides them instantly, which is acceptable.

**Hero product slider** (decided as the hero):
- Slides are stacked. The incoming slide fades `opacity 0 → 1` over 900 ms (`--ease-in-out`) and its image scales `1.06 → 1` over 1600 ms (`--ease-out`). The outgoing slide fades out over 600 ms.
- Slide text reveals 200 ms later, 700 ms, 80 ms stagger.
- The progress bar is `transform: scaleX(0→1)`, linear, over the interval.
- Autoplay interval is 6–7 s. **WCAG 2.2.2 requires a visible Pause button** for anything that auto-advances for more than 5 s.
- Pause on hover, on `:focus-within` and when `visibilitychange` reports the page hidden. There is no autoplay with reduced motion.
- Swipe: pointer events with a 40 px threshold. Buttons are real `<button>`s.

**Product rails** (related products, new in): use native `scroll-snap-type: x mandatory` and `overscroll-behavior-x: contain`. The arrows call `scrollBy({ left: rail.clientWidth * 0.9, behavior: reduce ? 'auto' : 'smooth' })`.

## 5. Reduced motion
- Write motion-first CSS inside `@media (prefers-reduced-motion: no-preference)`. Under `reduce`, state changes are instant or are opacity-only fades of 200 ms or less (simple fades are generally considered safe).
- Turn off for reduced motion:
  - the cross-document VT (wrapped in @media, see §2)
  - same-document VT (check `matchMedia` in JS)
  - parallax
  - slider autoplay and slide moves
  - `scroll-behavior: smooth`
  - badge pulse, hero line reveals and stagger
- Read `matchMedia('(prefers-reduced-motion: reduce)').matches` at call time, so a live OS toggle is respected.
- Content must never depend on an animation finishing. With JS off or reduced motion on, everything is visible.

## 6. Performance rules
1. Animate only `transform`, `opacity`, `translate` and `scale`. Use `clip-path`/`filter` for one-shot reveals only. Never animate width, height, top, left, margin or box-shadow. Drawers use `translate`, never `right`.
2. Use `will-change: transform` only on the active and next slides and on an opening drawer, then remove it. Never apply it globally.
3. No scroll listeners for effects: use IntersectionObserver. Touch and wheel listeners get `{ passive: true }`. Batch layout reads (`getBoundingClientRect`) before writes, inside `requestAnimationFrame`.
4. Use `content-visibility: auto; contain-intrinsic-size: auto 800px` on below-the-fold blocks: footer, long PDP details, related rail, editorial sections. Never on the hero or above-the-fold content. Off-screen skipped cards can't be captured by VT, which is fine because they shouldn't morph anyway.
5. Images:
   - Give every image `width`/`height` or `aspect-ratio`.
   - `loading="lazy"` and `decoding="async"` below the fold.
   - The LCP image uses `fetchpriority="high"`, is eager, and is visible at first paint.
6. View transitions:
   - Name 3–4 elements at most per transition.
   - Remove names after the snapshot.
   - Skip the transition on user input (INP).
   - Keep pages fast, because Chrome gives up after 4 s.
7. Nothing that blocks input may run longer than 700 ms. The 1.1 s hero intro must not use `pointer-events: none`.
8. Test with the DevTools Performance panel at 4× CPU throttling, using Paint flashing and Layer borders, and on a real iPhone (Safari 18.2+ runs cross-document VT).


## Sources

- https://www.npmjs.com/package/@mdn/browser-compat-data (v8.1.5, 2026-10-08; queried locally)
- https://www.npmjs.com/package/web-features (v3.42.0; Baseline dates)
- https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition
- https://developer.mozilla.org/en-US/docs/Web/API/Window/pagereveal_event
- https://developer.mozilla.org/en-US/docs/Web/API/Window/pageswap_event
- https://developer.chrome.com/docs/web-platform/view-transitions/cross-document
- https://drafts.csswg.org/css-view-transitions-2/ (source: github.com/w3c/csswg-drafts css-view-transitions-2/Overview.bs)
- https://blog.logrocket.com/?p=200599
- https://github.com/web-platform-tests/interop/blob/main/2026/README.md
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility
- https://web.dev/articles/animations-guide
- https://web.dev/articles/animations-and-performance
- https://web.dev/learn/css/view-transitions-spas
- https://web.dev/articles/lcp
- https://www.debugbear.com/blog/opacity-animation-poor-lcp
- https://shopify.dev/docs/storefronts/themes/best-practices/performance/dont-hide-lcp-image-behind-animations
- https://shopify.dev/docs/storefronts/themes/best-practices/performance/cancel-view-transitions-on-interaction
- https://baymard.com/ecommerce-design-examples/added-to-cart-confirmation
- https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide
- https://easings.net/ (values from github.com/ai/easings.net src/easings.yml)
- https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-motion.scss
- https://www.npmjs.com/package/@carbon/motion (v11.54.0)
- https://motion.dev/blog/web-animation-performance-tier-list
- https://matthiasott.com/notes/view-transitions-the-smooth-parts
