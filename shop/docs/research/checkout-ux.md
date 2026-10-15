# MONO: checkout, product page and cart UX plus accessibility checklist (checked 2026-10-14)

**About the sources.** Direct fetches of baymard.com, web.dev and developer.mozilla.org were blocked by the egress proxy. Every item below comes from search-engine excerpts of those official pages, and much of Baymard's detailed research sits behind its paywall. Items marked **[impl]** are my implementation choices built on the research. They are not quoted findings.

---

## 1. Checkout: structure

- [ ] **Guest checkout only, with no account wall.** The Checkout button goes straight to the form. Baymard: 19% have abandoned an order because they had to create an account, and 62% of sites fail to make guest checkout the most prominent option. If you offer "save my details", put it on the **confirmation page**, after the order is placed (Baymard: delayed account creation).
- [ ] **Keep it short and linear.** Baymard: most sites need only **8 form fields**, against a 2024 average of 11.3. Field count matters more than step count. Accordion and one-page layouts can both work, and what you ask matters more than the layout. If you use steps, the progress indicator must match the real steps 1:1, past steps must be clickable, and the current step gets `aria-current="step"`.
- [ ] **Field order [impl, follows Baymard's field-minimising advice]:**
  1. **Contact:** Email.
  2. **Delivery:** Country (fixed to US, or a select) → Full name → Address → "+ Add apartment, suite, etc." link that reveals Address line 2 → City → State → ZIP → Phone (optional, with a reason).
  3. **Delivery method:** radio group, each option showing its price **and an estimated delivery date**.
  4. **Payment (demo):** "Billing address same as delivery" is **checked by default and hides the billing fields**.
  5. **Review, then Place demo order.**
- [ ] **Full name as one field [impl].** Baymard: 42% of participants typed their full name into "First name" at least once. A single field also handles family-name-first conventions.
- [ ] **Address line 2 behind a link.** Baymard: the always-visible line 2 made testers stop, misuse it, or split the street across both fields. Only 20% of sites hide it.
- [ ] **Phone: make it optional and explain why.** For example: "Optional. Only used if the courier needs to reach you." Baymard (updated July 2025): an unexplained required phone field causes false data or abandonment, and 39% of sites still require it without saying why.
- [ ] **Billing equals shipping by default, with the billing fields hidden.** Baymard: this cuts 30–40% of visible fields, which matters most on mobile. It also meets WCAG 3.3.7 Redundant Entry.
- [ ] **Promo code:** skip it unless you publish the demo codes. If you include it, collapse it behind a "Have a promo code?" link. Older Baymard data showed a visible coupon field sends users hunting for codes.
- [ ] **Mark both required and optional fields.** Write "(optional)" in the label text, not an asterisk alone. Baymard: only 14% of sites mark both.

## 2. Checkout: input attributes (WHATWG autofill tokens; WCAG 1.3.5 AA requires them on fields about the user)

Token order is fixed: `[section-*] [shipping|billing] [home|work|mobile] field`.

| Field | type | autocomplete | other |
|---|---|---|---|
| Email | `email` | `email` | `spellcheck="false"` `autocapitalize="off"` [impl] |
| Full name | `text` | `shipping name` | `autocapitalize="words"` [impl] |
| Address | `text` | `shipping address-line1` | |
| Apt/suite (revealed) | `text` | `shipping address-line2` | |
| City | `text` | `shipping address-level2` | |
| State | `select` | `shipping address-level1` | |
| ZIP | `text` (never `number`) | `shipping postal-code` | `inputmode="numeric"` only if the site is US-only. Remove it if non-numeric postcodes (UK, CA) are allowed, and validate per country. Note the iOS numeric keypad has no dash, so for ZIP+4 accept 9 digits or a dash typed another way. |
| Country | `select` | `shipping country` | |
| Phone | `tel` | `shipping tel` | Never require a format with ( ) or - (the iOS tel keypad cannot type them, per Baymard). Normalise digits yourself. |
| Billing fields (if shown) | same | `billing …` | |
| Card number (demo) | `text` | `cc-number` | `inputmode="numeric"`. Auto-insert spaces by card pattern (Baymard: 15% of sites don't). Never use `type="number"` (web.dev). |
| Expiry | `text` | `cc-exp` (or `cc-exp-month` + `cc-exp-year`) | Match the card print: MM / YY. Baymard: 72% of sites fail this. |
| CVC | `text` | `cc-csc` | `inputmode="numeric"` |

- [ ] **Demo payment safety [impl].** Do not invite real card numbers on a portfolio site. Either (a) offer a single "Demo payment (no card needed)" option, or (b) show read-only, pre-filled test values (4242 4242 4242 4242, 12 / 34, 123) under a clear "Demo store. No payment is taken." notice. Never write payment values to localStorage.

## 3. Checkout: validation and errors

- [ ] **Timing (Baymard 2024 inline-validation research):**
  - Validate a field the first time on **blur**, not while the user is still typing it the first time. Baymard calls early errors "premature validation".
  - Once a field shows an error, **re-validate on every input** so the error clears the moment it is fixed.
  - Use subtle **positive inline validation** (a tick) for fields like email.
  - On submit, validate everything.
- [ ] **Wording: specific, never generic.** Baymard: 98% of sites use generic messages. Say what is wrong and how to fix it, without blaming the user (NN/g: visible, constructive, precise, polite). GOV.UK style examples:
  - "Enter your email address"
  - "Enter an email address in the correct format, like name@example.com"
  - "Enter a 5-digit ZIP code"
  - "Select a delivery method"
  - Never "Invalid input" or "Error".
- [ ] **Placement:** put the error next to its field, between label and input where possible. Use text plus an icon, never colour alone (WCAG 1.4.1). Never show an error in an `alert()` or modal (NN/g: modals hide the error while the user is fixing it).
- [ ] **Markup (W3C ARIA21):**
  - `aria-describedby` points to the error element's id. Keep any hint id in it as well.
  - `aria-invalid="true"` is set **only after validation has run**.
  - Start the error text with a visually hidden "Error:".
- [ ] **Error summary on submit (GOV.UK pattern):**
  - Render a summary at the top of the form: "There is a problem", followed by a list of `<a href="#field-id">` links, one per error.
  - Give it `tabindex="-1"` and **move focus to it**.
  - Prefix `document.title` with "Error: ".
  - Clicking a link focuses its field.
  - Use either focus or a live region, not both, so it is not announced twice.
- [ ] Use `novalidate` on the form so the custom messages replace browser bubbles. Keep `required` and `type` in the markup for semantics [impl].
- [ ] Keep entered data if the user leaves and comes back (a draft in sessionStorage, excluding payment) [impl; supports WCAG 3.3.7].

## 4. Order summary, costs and trust

- [ ] **Desktop:** a sticky summary column on the right with item thumbnails, size, quantity, line price, subtotal, shipping, total, and an "Edit bag" link [impl; Baymard: users rely on the summary to check their data].
- [ ] **Mobile:** a collapsed bar at the top, "Show order summary · $X total", that expands in place, **plus the full totals repeated directly above Place order**. Shopify merchants report that a collapsed summary hides fees, so the collapsed bar must show the total.
- [ ] **Show delivery cost before checkout.** Baymard: 64% of users look for shipping cost on the product page, and 16% of sites don't show it even in the cart. Extra costs are the #1 abandonment reason: secondary sources quote Baymard at 39% (2025) and 48% (earlier); verify the current figure before quoting it. Use flat, clearly labelled demo rates (for example "Standard $X · Free over $Y (demo rates)") on the product page, in the cart and in checkout. No surprise fees at the review step.
- [ ] **Delivery options show an estimated delivery date, not just a speed.** Write "Arrives Tue, Oct 20", not "3–5 business days". Baymard: 41% of sites omit the date. Compute it from today's date and mark it as an estimate.
- [ ] **Trust cues allowed:**
  - Visually enclose the payment section (border plus a tinted background). Baymard: this raises perceived security.
  - Plain microcopy: "Demo checkout. No card is charged and nothing ships."
  - Links to Shipping & Returns, Privacy and Contact.
  - A clear returns summary near the total.
- [ ] **Trust cues not allowed:** Norton or McAfee-style seals, "secure by X" badges, review stars, "10k happy customers", payment-brand logos implying real acceptance. Baymard has studied fake seals. For a demo these would be fabricated.

## 5. Review step and confirmation

- [ ] **Review (WCAG 3.3.4 AA requires financial transactions to be reversible, checked, or reviewable):**
  - Show contact, address, delivery method and date, payment ("Demo"), items, and the full totals.
  - Each block has an **Edit** link that jumps straight to that field and returns to review afterwards. Baymard: 68% of sites send users back through the flow.
  - Make the button "Place demo order" and keep it visible without scrolling on desktop (Baymard: 23% get the placement wrong).
  - The review page must not look like a confirmation. Baymard: users closed the review page thinking the order was done.
  - Disable double-submit during the fake "processing" [impl].
- [ ] **Confirmation page [impl from Baymard receipt research]:**
  - H1 "Thank you, your demo order is placed", with focus moved to the H1 and a matching `document.title`.
  - A demo order number and the date.
  - "Demo: no payment was taken, nothing will ship, no email was sent."
  - Items, delivery address, delivery method and estimated date, totals.
  - What happens next.
  - Optional "Save my details on this device" (the delayed account-creation pattern).
  - Continue shopping.
  - Clear the bag. Make sure Back or refresh cannot re-place the order. Store the order for /admin.

## 6. Product page

- [ ] **Gallery (Baymard):**
  - Desktop: thumbnails (100% of benchmarked sites use them).
  - Mobile: swipe **plus visible thumbnails or a counter like "2 / 5"**. Only 24% of mobile sites use thumbnails, and dots alone made users miss images.
  - Include on-model shots (Baymard apparel: 21% don't) and a zoom or fullscreen view in a `<dialog>`.
  - Each image gets distinct alt text. Arrow keys move between images. Don't autoplay [impl].
- [ ] **Size selection:**
  - Use **buttons, not a drop-down**. Baymard: drop-downs get overlooked, which triggers avoidable errors, and 70% of apparel sites don't use buttons.
  - Build them as native `<fieldset><legend>Size</legend>` with `<input type="radio" name="size">` styled as buttons. You get arrow keys and a single tab stop for free (APG radio pattern).
  - **Don't preselect a size.** Show the chosen size in the legend ("Size: M").
- [ ] **Add to bag without a size:** keep the button **enabled**, because disabled buttons don't explain themselves. On click with no size:
  1. Do not add the item.
  2. Show the inline message "Select a size" inside the size fieldset (text plus icon).
  3. Scroll the group into view (accounting for the sticky header).
  4. Move focus to the first available size radio.
  5. Announce the message through the polite status region.
  6. Clear it as soon as a size is picked.
  
  Products with no sizes (watches, sunglasses, accessories) skip this step.
- [ ] **Size guide placement:**
  - Put a "Size guide" link **directly beside the size legend**, opening a `<dialog>` so the shopper stays on the page. Baymard guideline #2597 says users could not find size guides, and secondary sources say to place it by the selector.
  - Make the guide product-type specific: chart, how to measure, and international conversion (Baymard).
  - Add fit notes and the model's height and size, if they are real data.
- [ ] **Sticky add to bag on mobile [impl; Baymard advises a distinct style and white space around a sticky button rather than full-bleed, and recommends a sticky summary on large screens]:**
  - Show the bar only after the main CTA scrolls out of view (IntersectionObserver). Hide it when the main CTA or the footer is visible.
  - Content: product name, price, chosen size or "Select size", and the button.
  - With no size chosen, it scrolls to the size group and shows the same error.
  - Add `scroll-padding-bottom` equal to the bar height so a focused control is never hidden under it (WCAG 2.4.11 AA).
  - Targets at least 24×24 CSS px (WCAG 2.5.8), 44 px preferred.
- [ ] **Add-to-bag feedback (Baymard):**
  - Confirm with the item details (image, name, size, price) and clear next actions: View bag, Checkout, and Continue shopping (which closes it).
  - If it is a drawer, use `<dialog>.showModal()` and focus its heading. Otherwise use an inline confirmation plus a status announcement.
  - Update the header count.
- [ ] **"Complete the look":**
  - Place it **below the main buy box and details**, never between size and Add to bag.
  - 2–4 genuinely related items from other categories (for example shirt with watch and sunglasses), labelled clearly, in stock, each linking to its own product page.
  - Baymard: irrelevant cross-sells get ignored, 52% of sites show irrelevant ones, and forced cross-sell steps in checkout caused extreme frustration. **No cross-sell interstitial in checkout.**
- [ ] **Stock messaging, honest only:**
  - Use "In stock" or "Sold out" per size, from the demo data.
  - Sold-out sizes are disabled radios with **visible text "Sold out"** in the label, not only a strike-through or grey.
  - **No "Only 2 left", countdown timers or "X people viewing".** The FTC dark-patterns report (2022) names false scarcity and false urgency. As a demo with invented inventory, avoid low-stock claims entirely.
- [ ] Show the delivery cost and estimate plus the returns line near the price (see section 4).

## 7. Cart / bag

- [ ] **Quantity stepper:**
  - Use − / + buttons and a numeric field (`inputmode="numeric"`).
  - **Apply changes immediately**: no "Update" button, and don't rely on blur alone. Debounce typed values about 200–300 ms.
  - Line total, subtotal and header count update together (Baymard: 86% of sites make quantity or removal hard).
  - Buttons get accessible names such as "Decrease quantity, Oxford Shirt, size M".
  - At least 24×24 px, with good spacing on mobile.
- [ ] **Remove and undo:**
  - Use a visible text "Remove" button.
  - The removed row collapses to "Oxford Shirt removed. **Undo**", which stays until the next navigation, not a vanishing toast (WCAG 2.2.1). Baymard lists undo as one of five key quantity details.
  - Move focus to the Undo button, or to the next row's heading if undone.
  - "−" at quantity 1 either removes with undo or is disabled [impl, pick one].
- [ ] **Totals:**
  - Subtotal, then Shipping (the demo flat rate, or "Free" with the threshold stated), then Estimated total.
  - Any free-shipping progress line must be truthful ("$40 away from free demo shipping").
  - Label demo prices and rates as demo.
  - Checkout is the primary button. Continue shopping is secondary.
- [ ] **Empty state:** "Your bag is empty", a short line, and a primary link to collections. Optionally 3–4 real featured products. Never a dead end.
- [ ] The cart lives in localStorage. Read it safely (try/catch) and sync across tabs with the `storage` event [impl].

## 8. Accessibility specifics (cross-cutting)

- [ ] **Dialogs (size guide, image zoom, bag drawer, mobile menu):**
  - Use native `<dialog>` with `showModal()`. That gives you an inert background, Esc to close, and focus returned to the opener, all free (MDN, web.dev learn/html/dialog).
  - Name it with `aria-labelledby` pointing to its heading.
  - Put `autofocus` on the most relevant element: the heading or first control for content dialogs, the close button only if nothing else fits.
  - **No `tabindex` on `<dialog>` itself.**
  - Include a visible close button. Lock page scroll while it is open [impl].
  - With a custom dialog you must add `role="dialog"`, `aria-modal="true"` and a focus trap yourself (APG).
- [ ] **Live regions:**
  - Put one persistent `<div role="status" aria-atomic="true" class="visually-hidden">` in the page **at load**.
  - Set its `textContent` for add, update and remove: "Added Oxford Shirt, size M. Bag: 3 items." and "Quantity updated to 2. Subtotal $X." (W3C ARIA22, WCAG 4.1.3).
  - Inserting the region and its text at the same moment is often missed by screen readers.
  - Use `role="alert"` only for blocking failures.
  - The header bag link's name updates: "Bag, 3 items".
- [ ] **Radio groups:** native radios inside `fieldset`/`legend` for size, delivery method and payment option. Visually hidden inputs must stay focusable (not `display:none`), with a visible `:focus-visible` ring on the styled label.
- [ ] **Error summary and field errors:** see section 3 (GOV.UK error summary, ARIA21).
- [ ] **Focus not obscured (WCAG 2.4.11):** set `scroll-padding-top` and `scroll-padding-bottom` for the sticky header and the sticky add-to-bag bar.
- [ ] **Motion:** under `prefers-reduced-motion: reduce`, drawer, gallery and confirmation transitions become instant or fades [impl].

## Stats with conflicting secondary figures (re-check before quoting)

- Extra-costs abandonment: 39% vs 48%.
- Apparel sites lacking sizing info: 82% vs 94%.
- ZIP auto-detect missing: 28% (mobile) vs 60%.


## Sources

- https://baymard.com/blog/delayed-account-creation
- https://baymard.com/blog/make-guest-checkout-prominent
- https://baymard.com/blog/checkout-flow-average-form-fields
- https://baymard.com/blog/inline-form-validation
- https://baymard.com/blog/adaptive-validation-error-messages
- https://baymard.com/blog/address-line-2
- https://baymard.com/blog/explain-phone-number-field
- https://baymard.com/blog/set-billing-equal-to-shipping
- https://baymard.com/blog/zip-code-auto-detection
- https://baymard.com/blog/required-optional-form-fields
- https://baymard.com/blog/credit-card-field-auto-format-spaces
- https://baymard.com/blog/how-to-format-expiration-date-fields
- https://baymard.com/labs/touch-keyboard-types
- https://baymard.com/blog/perceived-security-of-payment-form
- https://baymard.com/blog/site-seal-trust
- https://baymard.com/blog/show-shipping-costs-on-product-pages
- https://baymard.com/blog/shipping-speed-vs-delivery-date
- https://baymard.com/blog/accordion-style-checkout
- https://baymard.com/blog/checkout-flow-ux-optimization
- https://baymard.com/ecommerce-design-examples/54-order-review
- https://baymard.com/ecommerce-design-examples/101-receipt
- https://baymard.com/blog/use-buttons-for-size-selection
- https://baymard.com/blog/apparel-5-best-practices
- https://baymard.com/research-articles/apparel-size-information
- https://baymard.com/guidelines/2597-locating-the-size-guide
- https://baymard.com/blog/always-use-thumbnails-additional-images
- https://baymard.com/guidelines/2884-thumbnails-in-image-galleries-on-mobile
- https://baymard.com/research-articles/responsive-upscaling
- https://baymard.com/ecommerce-design-examples/added-to-cart-confirmation
- https://baymard.com/research-articles/product-recommendations-cart
- https://baymard.com/blog/auto-update-users-quantity-changes
- https://baymard.com/blog/apparel-put-size-filter-near-top-and-expand-for-sidebar-filtering
- https://web.dev/articles/payment-and-address-form-best-practices
- https://web.dev/learn/html/dialog
- https://developer.mozilla.org/en-US/docs/Web/HTML/attributes/autocomplete
- https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
- https://www.w3.org/WAI/ARIA/apg/patterns/dialogmodal/
- https://www.w3.org/WAI/ARIA/apg/patterns/radio/
- https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA21
- https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22
- https://w3c.github.io/wcag/understanding/error-prevention-legal-financial-data
- https://w3c.github.io/wcag/understanding/identify-input-purpose
- https://tetralogical.com/blog/2023/10/05/whats-new-wcag-2.2
- https://design-system.service.gov.uk/components/error-summary
- https://design-system.service.gov.uk/patterns/email-addresses
- https://design.homeoffice.gov.uk/accessibility/interactivity/error-messages
- https://www.nngroup.com/videos/error-message-communication-guidelines/
- https://www.nngroup.com/videos/error-message-visibility/
- https://www.nngroup.com/videos/mobile-error-handling-alerts/
- https://hunton.com/privacy-and-information-security-law/ftc-releases-report-on-dark-patterns
- https://rocketvalidator.com/html-validation/tag/zip
- https://community.shopify.com/t/how-can-we-set-the-order-summary-to-expand-by-default/132279/19
