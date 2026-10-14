## Fact-check of "MONO: checkout, product page and cart UX plus accessibility checklist" (2026-10-14)

**Overall verdict:** Most key claims hold, including every WCAG SC/level, the dialog behaviour, the autofill tokens, web.dev's type=number advice, the FTC report, and most Baymard numbers. Seven items need correcting or qualifying before the build or any copy relies on them. baymard.com, web.dev, MDN and w3.org were also blocked for me. I checked Baymard figures through search-index excerpts of Baymard's own pages. I read MDN, W3C WCAG and GOV.UK as source files on raw.githubusercontent.com.

### Wrong or outdated

1. **Section 1 / Stats: abandonment reasons (19% account creation; extra costs 39% vs 48%).** Baymard's current primary list page (baymard.com/lists/cart-abandonment-rate, titled "50 Cart Abandonment Rate Statistics 2026", last updated about 22 Sep 2025) reports **40%** "Extra costs too high (shipping, tax, fees)" and **18%** "The site wanted me to create an account". The headline abandonment rate there is 70.22% across 50 studies.
   - 39% and 19% come from Baymard's "How to Reduce Cart Abandonment" blog (an earlier survey wave).
   - 48% and 26% come from the older 2024 wave (eMarketer cites a Feb 2024 Baymard survey).
   - Fix: quote 40% and 18% with "Baymard, 2025" as the source, or say "about 4 in 10".
   - Confidence is medium, because I saw this page only through search-index excerpts.
   - Sources: https://baymard.com/lists/cart-abandonment-rate, https://baymard.com/blog/reduce-cart-abandonment, https://www.emarketer.com/content/extra-costs-are-the-top-reason-consumers-abandon-online-carts

2. **Section 6 / Complete the look: "52% of sites show irrelevant ones".** This stat is about cross-sells **in the cart or the "Added to Cart" confirmation** on **desktop** sites, not on product pages. It covers suggestions that are "either completely irrelevant or based only on what other customers bought" (Baymard, Jan 2021). Cite it for the bag drawer and cart. Don't cite it for the PDP "Complete the look" block.
   - Source: https://baymard.com/blog/product-recommendations-cart

3. **Section 3 / Error summary: "Use either focus or a live region, not both", filed under the "GOV.UK pattern".** This is not what GOV.UK does. GOV.UK Frontend's error-summary template puts `role="alert"` on an inner `<div>` **and** its JS moves focus to the summary. A template comment says the inner placement avoids a race with the focus script. GOV.UK also has no `tabindex` in the markup: its focus helper adds `tabindex="-1"` when it focuses and removes it on blur.
   - Your either/or rule is reasonable for a summary injected on the client side, but label it [impl] and not GOV.UK.
   - Sources: https://raw.githubusercontent.com/alphagov/govuk-frontend/main/packages/govuk-frontend/src/govuk/components/error-summary/template.njk, https://raw.githubusercontent.com/alphagov/govuk-design-system/main/src/components/error-summary/index.md

4. **Section 8 / Dialogs: "Put `autofocus` on … the heading".** A heading is not focusable, so `autofocus` on a plain `<h2>` is skipped. The browser then focuses the first focusable element instead, which is often the close button. The heading needs `tabindex="-1"` as well, which is what W3C technique H102's example does. MDN also suggests the close button as a fallback when nothing else fits. The "no tabindex on `<dialog>` itself" rule is correct, because MDN says it "must not be used".
   - Sources: https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/html/reference/elements/dialog/index.md, https://raw.githubusercontent.com/w3c/wcag/main/techniques/html/H102.html

5. **Stats / "Apparel sites lacking sizing info: 82% vs 94%".**
   - 82% is from an older version of Baymard's "5 apparel best practices" article.
   - Baymard's dedicated sizing article gives **83% of desktop and 87% of mobile** apparel sites failing to provide enough sizing information.
   - The 94% figure also shows up as the headline "94% of sites get one or more of these key apparel best practices wrong", which is not a sizing-only stat.
   - Use 83% / 87%, or no number.
   - Sources: https://baymard.com/research-articles/apparel-size-information, https://baymard.com/blog/apparel-5-best-practices

### Numbers that are real but have conflicting Baymard versions (qualify or drop)

6. **Section 2: card spaces, "15% of sites don't".** The June 2025 research-article version says 15%, down from 50% in 2019. The article title still says "80% Don't", and another Baymard article says "51% fail to offer autoformatting". Quote 15% with "(Baymard, 2025)", or no number.
   - Source: https://baymard.com/research-articles/credit-card-field-auto-format-spaces
7. **Section 6: size buttons, "70% don't".** The research-article version says 70%. The blog version of the same article says 63%.
   - Source: https://baymard.com/research-articles/apparel-5-best-practices
8. **Section 6: on-model images, "21% don't".** The research-article version says 21%. The July 2022 blog version says 75%. Use no number, or 21% with the date.
   - Sources: https://baymard.com/research-articles/apparel-5-best-practices, https://baymard.com/blog/human-model

### Unverified (could not confirm; don't quote as fact)

- **"Place order" placement, "23% get it wrong".** I found no source. Baymard guideline #556 exists but is paywalled. The verified related point is that a review step that looks like a confirmation page causes up to 10% mobile checkout abandonment.
  - Source: https://baymard.com/guidelines/556-place-order-button-placement
- **iOS tel keypad has no ( ) or - "per Baymard".** The behaviour is correct (the iOS phone pad has only digits and +*#), but I could not find a Baymard source. Drop the attribution.

### Confirmed (no change needed)

- **Baymard checkout and form stats:**
  - Average checkout 11.3 fields vs 8 needed; field count matters more than step count (June 2024).
  - 62% of sites fail to make guest checkout the most prominent option (2025).
  - 42% of participants typed their full name into "First name" (89% of sites don't use a single name field).
  - Only 20% of sites hide Address line 2 behind a link.
  - Phone required without explanation on 39% of sites (updated 29 Jul 2025).
  - Billing = shipping hides 30–40% of fields.
  - Only 14% mark both required and optional fields (2016 benchmark; little change by 2021).
  - 72% don't match the expiry format printed on the card (Oct 2023).
  - 98% don't use adaptive error messages (Dec 2023).
  - The inline-validation article covers premature validation, removing errors once fixed, and positive validation (Jan 2024).
- **Baymard shipping, review, gallery and cart stats:**
  - 64% look for shipping cost on the PDP and 16% don't show it in the cart (both from 2017 data, so old).
  - 41% don't show a delivery date (Jun 2023).
  - 68% send users backwards to edit at the review step.
  - Desktop galleries: all benchmarked sites use thumbnails. Mobile: only 24% do (Oct 2020).
  - 86% make quantity changes (50%) or removal (36%) hard, and undo is one of the five quantity details.
  - ZIP auto-detect: 28% (mobile article, Apr 2023) and 60% (overall article) are different scopes, not a conflict.
  - Guideline #2597 "Locating the Size Guide" exists (updated Dec 2025).
- **WCAG:** 1.3.5 (AA), 1.4.1 (A), 2.2.1 (A), 2.4.11 Focus Not Obscured (Minimum) (AA), 2.5.8 24×24 (AA), 3.3.4 (AA), 3.3.7 Redundant Entry (A), and 4.1.3 (AA) are all correct. The Understanding doc for 3.3.7 uses the billing/delivery "same address" checkbox as its own example. ARIA21 and ARIA22 are the right techniques.
- **Native `<dialog>` with `showModal()`:** inert background, Esc to close, and focus returned to the invoker (W3C H102). Baseline support is Chrome 37, Firefox 98 and Safari 15.4. Optional extra: the `closedby` attribute for light dismiss works in Chrome 134+ and Firefox 141+, and is still preview-only in Safari, so don't rely on it.
  - Source: https://raw.githubusercontent.com/mdn/browser-compat-data/main/html/elements/dialog.json
- **web.dev:** don't use `type="number"` for card numbers; use `type="text"` with `inputmode="numeric"`.
  - Source: https://web.dev/articles/payment-and-address-form-best-practices
- **Autofill:** the token order `[section-*] [shipping|billing] [home|work|mobile] field` is correct. Small addition: home/work/mobile are only valid before contact fields (tel, email, impp).
- **FTC "Bringing Dark Patterns to Light" (15 Sep 2022):** it names false scarcity ("only 2 left"), baseless countdown timers and false activity messages ("X people viewing").
  - Source: https://www.venable.com/insights/blogs/2022/09/the-ftc-brings-more-light-to-dark-patterns-in-new

### Structured data / SEO

The checklist makes no Google structured-data claims, so there was nothing there to verify. If Product markup is added later, follow the project's own rules: no `review` or `aggregateRating` for a demo brand, and any `offers` price must match the visibly labelled demo price.