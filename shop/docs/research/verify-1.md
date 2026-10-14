## Fact-check result: motion guidance (checked 2026-10-14)

The key claims hold. I downloaded `@mdn/browser-compat-data` 8.1.5 and `web-features` 3.42.0 from npm, which are the latest releases as of today, and queried every row of the support table. Each version number and Baseline date in §1 matches the data. That includes cross-doc VT (126 / 18.2 / no), pageswap/pagereveal, `rel=expect`, VT types (Firefox 147), the options form of `startViewTransition` (Firefox 147), element-scoped VT, scroll-driven animations (Firefox "preview"), `display` transitions (no Firefox), `overlay`, popover and `hint`, `closedby`, `requestClose`, invokers (2025-12-12), `:open` (2026-05-11), anchor positioning, `text-wrap`, `linear()` (widely available 2026-06-11), `sibling-index` (2026-08-18), `content-visibility`, `::details-content`, `interpolate-size` and speculation rules.

These were also confirmed against their sources:
- **Interop 2026:** cross-doc VT, `rel=expect`, `blocking=render`, `closedby`, `:open`, `popover=hint`, scroll-driven animations and anchor positioning are all focus areas. Source: the Interop 2026 README.
- **VT spec rules:** `@view-transition` may be nested in `@media`. Transitions run on traverse, and on push/replace unless the navigation came from browser UI. They never run on reload. Timeout is a skip with `TimeoutError`. Source: the CSS VT L2 spec source.
- **Chrome:** the 4 s timeout.
- **LCP:** opacity-0 elements are excluded.
- **Motion tokens:** Material 3 durations and `cubic-bezier(0.2,0,0,1)` (material-web 2.5.0 tokens). Carbon 70/110/150/240/400/700 ms and its expressive curves (`@carbon/motion` 11.54.0). The easings.net curves. The `linear()` spring list matches a zeta 0.75 step response with a peak of 1.028 (theory 2.84%).

Firefox 157 and 158 add nothing that changes the table. Cross-doc VT, scroll-driven animations and `text-wrap: pretty` are still not in Firefox release.

### Corrections (all minor; none changes how MONO should implement anything)

1. **"Current stable versions" is one release out of date for Edge and Firefox.**
   - Edge 155 (155.0.4283.45) shipped to Stable on 2026-10-08.
   - Firefox 158 shipped on 2026-10-13, so it is current today, not "due".
   - Chrome 155 and Safari/iOS 27 are correct.
   - Note: BCD now shows Chrome, Edge and Firefox on a 2-week release cadence, so version numbers move fast.
   - Sources: BCD 8.1.5 `browsers` data; MDN Firefox 158 release notes (mdn/content `files/en-us/mozilla/firefox/releases/158`); Edge 155 reports (https://tech.ifeng.com/c/8x6aETsvl8k, https://forest.watch.impress.co.jp/docs/news/2142518.html).

2. **Anchor positioning: the reason it is "not Baseline" is incomplete.**
   - The per-property versions are right: `position-anchor` with the conforming initial value is Chrome 151, Firefox 151 and Safari 27.
   - However, the `anchor-positioning` feature in web-features 3.42.0 lists **only Safari 27** as supporting it. Chrome and Firefox still lack the newer `position-visibility: anchor-valid` / `anchor-visible` values, which only Safari 27 has.
   - So "fully conforming versions are Chrome/Firefox 151" is not what the data says.
   - The guidance is unaffected: MONO doesn't use `position-visibility`, and all three engines handle `anchor-name` + `position-anchor` + `position-area` + `position-try-fallbacks`.
   - Source: web-features 3.42.0 `features["anchor-positioning"]` and BCD `css.properties.position-visibility.*`.

3. **WCAG 2.2.2 wording is overstated.**
   - The criterion requires "a mechanism for the user to pause, stop, or hide" moving content that starts automatically, lasts more than 5 s and runs alongside other content. It does not literally require a visible Pause button.
   - A visible, keyboard-reachable Pause/Play button is still the standard way to meet it, and pause-on-hover or focus alone doesn't satisfy touch users. **Keep the button.**
   - Source: https://www.w3.org/TR/WCAG22/#pause-stop-hide

4. **Table nuances (not wrong, but worth knowing):**
   - **Popover:** web-features computes the feature from Chrome **116**, while BCD `api.HTMLElement.popover` says 114. The Baseline date of 2025-01-27, set by the iOS 18.3 light-dismiss fix, is correct.
   - **`popover=hint`:** partial support since Chrome 133 and Firefox 149, using an older spec with inconsistent behaviour. Full support starts at 151 / 153 as stated.
   - **`content-visibility`:** the Baseline date (2025-09-15) is computed from Chrome 108 / Firefox 130 / Safari 26, not 85 / 125 / 18.

### Code caveats (implementation bugs, not factual errors)

- **`closeDrawer`:** `transitionend` bubbles. A child's transition, such as the 1200 ms sand highlight or the staggered content, can close the dialog early. Guard it with `e.target === d && e.propertyName === 'translate'`.
- **`pagereveal`:** `vt.ready.finally(...)` rethrows when the transition is skipped, because `ready` rejects on skip, timeout or duplicate names. That logs an unhandled rejection. Use `vt.ready.then(clear, clear)` instead.
- **Esc handling (plausible, not verified here):** under the HTML close-watcher rules, `cancel` can only be cancelled after user activation. If the drawer is opened without a user gesture, Esc may close it instantly with no exit animation. That is harmless, but the no-animation path must look fine.

### Sources
- BCD 8.1.5 and web-features 3.42.0 (npm tarballs, queried directly)
- https://github.com/web-platform-tests/interop/blob/main/2026/README.md
- https://github.com/w3c/csswg-drafts/blob/main/css-view-transitions-2/Overview.bs
- https://developer.chrome.com/docs/web-platform/view-transitions/cross-document
- MDN Firefox 157/158 release notes and the Experimental features page (github.com/mdn/content)
- https://web.dev/lcp
- https://www.debugbear.com/blog/opacity-animation-poor-lcp
- https://shopify.dev/docs/storefronts/themes/best-practices/performance/dont-hide-lcp-image-behind-animations
- @material/web 2.5.0 `tokens/versions/v0_192/_md-sys-motion.scss`
- @carbon/motion 11.54.0
- https://www.w3.org/TR/WCAG22/#pause-stop-hide