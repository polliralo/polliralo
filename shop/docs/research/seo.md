# MONO technical SEO checklist (checked 2026-10-14)

**How this was checked:** the sandbox's proxy blocked direct page fetches of developers.google.com, web.dev and schema.org, so I couldn't open those pages. Every fact below comes from search-engine extracts of the official pages plus the Google Search changelog. Before shipping, run the Rich Results Test in code-snippet mode on the generated HTML. Two points need that check most:
- the nesting of the Organization-level `ShippingService` properties;
- the `audience` values.

Catalogue facts this plan is built on (from `shop/src/data/catalog.json`):
- 12 products, and each colour has its own product page.
- Size options are stored as `variants` with a per-size `stock`.
- One-size items use variant `OS`.
- Olive and navy polos share `group: "pique-polo"`.
- The belt is sized by waist (32 to 38).
- There is no material and no GTIN in the data, so neither may be emitted.

---

## 0. Two build constants (add these first)

- **`SITE_ORIGIN`** (env var, no trailing slash) is the only source for:
  - canonical, `og:url` and `og:image`;
  - JSON-LD `url`/`@id`/`image`;
  - sitemap `<loc>` and the robots.txt `Sitemap:` line.

  The final domain isn't chosen yet, so set it to the current deploy origin (for example `https://<worker>.<account>.workers.dev`). Never emit a placeholder host. When the real domain arrives: rebuild with the new origin, 301 the old host to the new one (or disable workers.dev once the custom domain is live), then submit the new sitemap in Search Console.
- **`SEO_MODE`** = `demo` (default for the public portfolio deploy) or `live`. This switch controls commerce markup (see section 9 for why).
  - **demo:** every public page is indexable. JSON-LD = WebSite + Organization (basic) on the home page, plus BreadcrumbList. There is **no** Product/ProductGroup/Offer markup and **no** shipping or return policy markup.
  - **live:** adds the Product/ProductGroup/Offer markup and the Organization-level shipping and return policies. Turn this on only with real prices, stock, checkout and policies.
  - The generator code runs in tests in **both** modes, so the live markup stays validated.

## 1. Titles and meta descriptions

Rules:
- One unique `<title>` and one unique `<meta name="description">` on every indexable page.
- The title's main part matches the page's single `<h1>`.
- Use " | " as the separator, with no long dashes.
- Keep titles to about 60 characters and descriptions to about 155. These are practical display limits, not Google rules: Google truncates by pixel width and may rewrite titles, but it still uses the `<title>` element more than 80% of the time.
- Build fails on duplicate titles or descriptions, or on empty values.

| Page | `<title>` pattern | Meta description source |
|---|---|---|
| `/` | `MONO \| Modern Menswear Essentials` | Brand line + categories + "MONO is a fictional menswear demo store." |
| `/collections/` | `Shop All Menswear \| MONO` | "All 12 MONO essentials across shirts, T-shirts, polos, watches, sunglasses and accessories." |
| `/collections/<cat>/` | `{category.title} \| MONO` (for example "Men's Polo Shirts \| MONO") | `category.description` + " {n} styles." |
| `/products/<slug>/` | `{product.name} \| {category.title} \| MONO` (for example "Ivory Oxford Shirt \| Men's Shirts \| MONO") | `product.description`, trimmed at a word boundary to 155 or fewer characters. Leave out the demo price: a snippet can't carry the "demo" label. |
| `/about/` `/contact/` `/size-guide/` `/shipping-returns/` `/privacy/` | `About MONO`, `Contact \| MONO`, `Size Guide \| MONO`, `Shipping and Returns \| MONO`, `Privacy Policy \| MONO` | Hand-written, one sentence each |
| `/search/` `/cart/` `/checkout/` `/order-confirmation/` `/admin/*`, 404 | `Search \| MONO`, `Your Bag \| MONO`, `Checkout \| MONO`, `Order Confirmed \| MONO`, `Admin (Demo) \| MONO`, `Page Not Found \| MONO` | Optional (noindex) |

## 2. Canonicals

- On every indexable page, add one `<link rel="canonical">` in `<head>`:
  - absolute URL built as `SITE_ORIGIN + path`;
  - https, lower-case, **with** a trailing slash (matches the folder/index.html output);
  - no query string, no fragment.

  Google supports relative canonicals but recommends absolute ones. Use the same URL in `og:url` and in JSON-LD.
- **Query-string URLs** for filters, sorting, `?size=` variant preselection and `?q=` serve the same static file, so they inherit the clean canonical automatically. This matches Google's ecommerce advice: when optional query parameters identify variants, use the URL without the parameter as the canonical.
- The olive and navy polo pages are distinct pages, so each canonicalises to **itself**. Do not point one colour at the other.
- noindex pages: **omit** the canonical. Google advises against using noindex to influence which page it picks as canonical.
- Don't use robots.txt as a canonicalisation tool. Signal strength runs: redirect, then rel=canonical, then sitemap inclusion.
- There's no pagination (12 products). If pagination is added later, each page canonicalises to itself, not to page 1.

## 3. Indexing controls

| URL | Control |
|---|---|
| `/cart/`, `/checkout/`, `/order-confirmation/`, `/search/` (all `?q=`) | `<meta name="robots" content="noindex">` |
| `/admin/` and every admin subpage | `<meta name="robots" content="noindex, nofollow">` plus an `X-Robots-Tag: noindex, nofollow` header via `_headers` (belt and braces) |
| All other public pages | No robots meta. Optionally `max-image-preview:large` so Google may show large image previews. |
| Unknown URLs | A real HTTP 404 (see section 6), not a 200 "not found" page |

- **Never Disallow these URLs in robots.txt.** A blocked page is never fetched, so Google never sees the noindex and can still index the bare URL. robots.txt can't deindex anything.
- Exclude all of them from the sitemap.
- The order confirmation must not put personal data (names, email) in the URL.
- On portfolio clarity: the brief says not to present the hidden admin route as secure. noindex is not security, and the README must say so.

## 4. robots.txt (`site/robots.txt`, generated)
```
User-agent: *
Allow: /

Sitemap: https://<SITE_ORIGIN>/sitemap.xml
```
- Don't block `/assets/`. Google needs the CSS, JS and images to render pages and index images.
- No parameter rules are needed while filter controls are buttons rather than links (see section 10).

## 5. sitemap.xml (generated at build)

- Contents: 25 URLs. Home, `/collections/`, 6 category pages, 12 product pages, plus `/about/`, `/contact/`, `/size-guide/`, `/shipping-returns/`, `/privacy/`. Use absolute canonical URLs only.
- Leave out: noindex pages, `/admin/`, 404, and any URL with a query string.
- `<lastmod>`: the date of the last *significant* change to that page's data or template, for example the git commit date of the catalogue entry. Don't stamp "now" on every build. Google uses lastmod only when it's consistently accurate.
- Omit `<priority>` and `<changefreq>`. Google ignores both.
- Optionally add `image:image` entries for each product's main images. Only `image:loc` is used.
- Test: every sitemap URL returns 200, matches its own canonical and carries no noindex.
- In live mode, submit the sitemap in Search Console once the domain is verified.
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://mono.example.com/products/olive-pique-polo/</loc>
    <lastmod>2026-10-14</lastmod>
    <image:image><image:loc>https://mono.example.com/assets/img/cut-olive-pique-polo-front-1120.webp</image:loc></image:image>
  </url>
</urlset>
```

## 6. Cloudflare Workers static assets config

- In wrangler config, under `assets`: set `"not_found_handling": "404-page"` and ship `site/404.html`.
  - The documented default is `none`.
  - Do **not** use `single-page-application`: it returns 200 with index.html for every unknown URL, which creates soft 404s.
- Keep `"html_handling": "auto-trailing-slash"` (the default). `/about` redirects to `/about/`, which matches the canonicals.
- `_headers` is supported in the assets directory: max 100 rules, and it applies only to asset responses, not Worker-generated ones. Use it for the `X-Robots-Tag` on `/admin/` and `/admin/*`, and for long-cache headers on hashed assets.

## 7. Structured data: what Google uses in 2026

**General rules**
- Use JSON-LD only, written into the **pre-rendered HTML**. Google warns that Product markup generated by JavaScript makes Shopping crawls less frequent and less reliable.
- Markup must match visible content: the price shown equals the price marked up, and the breadcrumb trail equals the visible breadcrumb.
- Only emit properties backed by catalogue data:
  - no `material` (not in the data);
  - **no invented `gtin`**;
  - **never `review` or `aggregateRating`**. MONO has none, and fake reviews break both Google's policy and the brief.

**Merchant listings vs product snippets**
- Merchant listings are "for pages where customers can purchase products from you". Product snippets are for product pages that don't sell directly, such as reviews.
- Meeting the merchant listing requirements generally makes a page eligible for product snippets too.
- Product snippet minimum: `name` + one of `offers`/`review`/`aggregateRating`. MONO can only use `offers`, so ignore the Rich Results Test warning about missing reviews.

**Merchant listing: required**
- Product: `name`, `image`, `offers`.
- Offer: `price` (or `priceSpecification.price`) and `priceCurrency`. Google lists priceCurrency as "required for merchant listing experiences". Use `"USD"`.

**Merchant listing: recommended**
- Product: `description`, `brand` (`{"@type":"Brand","name":"MONO"}`), `sku`, `color`, `size`, `audience` (`PeopleAudience`), and `category`.
  - `category` was added 2026-07-07. It takes Text or `CategoryCode`, in line with the feed attributes `google_product_category` and `product_type`. A text taxonomy path is fine, for example "Apparel & Accessories > Clothing > Shirts & Tops".
  - Use `mpn` only if MONO treats its own SKU as the part number.
  - `isVariantOf` / `inProductGroupWithID` apply when variants are involved.
  - Skip `hasAdultConsideration` (added May 2026); it's not relevant here.
- Offer: `availability` (`InStock`/`OutOfStock` from build-time stock), `itemCondition` (`NewCondition`), `shippingDetails`, `hasMerchantReturnPolicy`.
  - For sale prices only, use `validFrom`/`validThrough`/`priceValidUntil` (sale-duration section, July 2026).
  - Otherwise don't emit dates: a static build would let them go stale, and Google may not show a snippet when `priceValidUntil` is in the past.

**Images in markup**
- Use absolute, crawlable URLs, ideally the same files shown on the page.
- Google recommends several high-resolution images (at least 50K pixels, width × height) in 1:1, 4:3 and 16:9. The media script should add 1:1 and 4:3 crops of the front cutout.
- Google Search supports AVIF (since Aug 2024), but use the WebP or JPEG variant in markup and OG tags for wider compatibility.

**Variants (`ProductGroup`)**
- Properties: `productGroupID`, `variesBy` (values like `https://schema.org/size` and `https://schema.org/color`), `hasVariant`.
- Put shared properties (brand, description, audience, category) on the group.
- **Single-page** sites have all variants selectable on one page via query parameters. Each variant needs a distinct URL that **preselects** it (`?size=M`), and the ProductGroup `url` is the base page.
- **Multi-page** sites: repeat the full ProductGroup on every variant page, and give the ProductGroup no `url`.
- How this maps to MONO:
  - shirts, tees and the belt: single-page ProductGroup, `variesBy` size (belt sizes "32" to "38");
  - polos: multi-page ProductGroup, `variesBy` color + size, 2 colours × 5 sizes = 10 variants, with the full group repeated on both colour pages;
  - watches, sunglasses and the wallet (`OS`): a plain `Product` with one `Offer`.
- **Implementation must:** read `?size=` on page load and preselect that size, because the markup advertises those URLs.

**Shipping and returns (live mode only, and only once the policy is configured, as the brief requires)**
- Since Nov 2025, Google recommends one site-wide policy under `Organization`: `hasShippingService` → `ShippingService` → `shippingConditions`, and `hasMerchantReturnPolicy`.
  - Offer-level `shippingDetails` / `hasMerchantReturnPolicy` are only for per-product exceptions, and Offer-level shipping supports a narrower property set.
  - If you do use offer-level `OfferShippingDetails`, it requires `shippingRate` (currency + value or maxValue; free = 0), `shippingDestination.addressCountry` and `deliveryTime` (handlingTime/transitTime in days, `unitCode` DAY).
- `MerchantReturnPolicy` needs:
  - `applicableCountry` (ISO 3166-1 alpha-2, max 50);
  - `returnPolicyCategory`, plus `merchantReturnDays` if the window is finite;
  - `returnPolicyCountry`, which Google now treats as required (added to its examples in March 2025).
- Search Console's "Shipping and returns" settings override the markup.
- Values must equal the visible `/shipping-returns/` page.

**Other types**
- **WebSite:** home page only, with `name`, `alternateName` and `url`. This is what sets the site name in results.
  - Sitelinks search box: Google retired it on 2024-11-21, so **don't add a SearchAction**. Leftover markup causes no errors, but it does nothing.
- **Organization:** home page.
  - Include `name` (same as the WebSite name), `url`, `logo` (crawlable PNG, at least 112×112 px; use a square 512 px file) and `description`.
  - **No** `address`, `telephone`, `email` or `sameAs`: MONO has none, and the content rules forbid inventing them.
  - Use type `Organization` in demo mode and `OnlineStore` in live mode.
- **BreadcrumbList:** on category, product and info pages, matching the visible trail. Mobile results have shown only the domain since 2025-01-23, but desktop still shows breadcrumbs and Google still supports the markup.

## 8. Exact JSON-LD (live mode; host = `https://mono.example.com`, replace with `SITE_ORIGIN`)

### 8a. Multi-page ProductGroup: `/products/olive-pique-polo/`
The same block goes on `/products/navy-pique-polo/`. It's shortened here to 4 of the 10 variants: generate one entry per colour × size from `catalog.json`.
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProductGroup",
  "@id": "https://mono.example.com/#group-pique-polo",
  "name": "Piqué Polo",
  "description": "A piqué-knit polo with a flat-knit collar, a two-button placket, ribbed sleeve bands and small side vents at the hem.",
  "brand": { "@type": "Brand", "name": "MONO" },
  "productGroupID": "MONO-PL",
  "variesBy": ["https://schema.org/color", "https://schema.org/size"],
  "category": "Apparel & Accessories > Clothing > Shirts & Tops",
  "audience": { "@type": "PeopleAudience", "suggestedGender": "male", "suggestedMinAge": 13 },
  "hasVariant": [
    {
      "@type": "Product",
      "sku": "MONO-PL-01-M",
      "name": "Olive Piqué Polo, size M",
      "url": "https://mono.example.com/products/olive-pique-polo/?size=M",
      "image": [
        "https://mono.example.com/assets/img/cut-olive-pique-polo-front-1120.webp",
        "https://mono.example.com/assets/img/cut-olive-pique-polo-back-1120.webp"
      ],
      "color": "Olive",
      "size": "M",
      "offers": {
        "@type": "Offer",
        "url": "https://mono.example.com/products/olive-pique-polo/?size=M",
        "price": 48.00,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition"
      }
    },
    {
      "@type": "Product",
      "sku": "MONO-PL-01-XXL",
      "name": "Olive Piqué Polo, size XXL",
      "url": "https://mono.example.com/products/olive-pique-polo/?size=XXL",
      "image": "https://mono.example.com/assets/img/cut-olive-pique-polo-front-1120.webp",
      "color": "Olive",
      "size": "XXL",
      "offers": {
        "@type": "Offer",
        "url": "https://mono.example.com/products/olive-pique-polo/?size=XXL",
        "price": 48.00,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition"
      }
    },
    {
      "@type": "Product",
      "sku": "MONO-PL-02-M",
      "name": "Navy Piqué Polo, size M",
      "url": "https://mono.example.com/products/navy-pique-polo/?size=M",
      "image": "https://mono.example.com/assets/img/cut-navy-pique-polo-front-1120.webp",
      "color": "Navy",
      "size": "M",
      "offers": {
        "@type": "Offer",
        "url": "https://mono.example.com/products/navy-pique-polo/?size=M",
        "price": 48.00,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition"
      }
    },
    {
      "@type": "Product",
      "sku": "MONO-PL-02-XXL",
      "name": "Navy Piqué Polo, size XXL",
      "url": "https://mono.example.com/products/navy-pique-polo/?size=XXL",
      "image": "https://mono.example.com/assets/img/cut-navy-pique-polo-front-1120.webp",
      "color": "Navy",
      "size": "XXL",
      "offers": {
        "@type": "Offer",
        "url": "https://mono.example.com/products/navy-pique-polo/?size=XXL",
        "price": 48.00,
        "priceCurrency": "USD",
        "availability": "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition"
      }
    }
  ]
}
</script>
```
**Single-page variant of the same pattern** (shirts, tees, belt), for example `/products/ivory-oxford-shirt/`:
- add `"url": "https://mono.example.com/products/ivory-oxford-shirt/"` to the ProductGroup;
- `"productGroupID": "MONO-SH-01"`;
- `"variesBy": ["https://schema.org/size"]`;
- `"color": "Ivory"` on each variant;
- one variant per size, S to XXL, with `?size=S` and so on;
- `availability` taken from each size's `stock` (blue-stripe S and ivory-heavyweight XXL are `OutOfStock`).

**One-size items** (watches, sunglasses, wallet): a plain `{"@type":"Product", name, description, image[], sku, brand, color, category, audience, offers:{Offer}}` with no ProductGroup.

### 8b. BreadcrumbList: product page (the visible trail must read Home / Shop / Polos / Olive Piqué Polo)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://mono.example.com/" },
    { "@type": "ListItem", "position": 2, "name": "Shop", "item": "https://mono.example.com/collections/" },
    { "@type": "ListItem", "position": 3, "name": "Polos", "item": "https://mono.example.com/collections/polos/" },
    { "@type": "ListItem", "position": 4, "name": "Olive Piqué Polo" }
  ]
}
</script>
```
`item` may be left off the last (current-page) element. Category pages end at position 3.

### 8c. Home page: WebSite + Organization (demo mode = this block without the two `has…` properties, `@type` "Organization")
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://mono.example.com/#website",
      "name": "MONO",
      "alternateName": "MONO Menswear",
      "url": "https://mono.example.com/"
    },
    {
      "@type": "OnlineStore",
      "@id": "https://mono.example.com/#org",
      "name": "MONO",
      "alternateName": "MONO Menswear",
      "url": "https://mono.example.com/",
      "logo": "https://mono.example.com/assets/brand/mono-logo-512.png",
      "description": "Modern menswear essentials: shirts, T-shirts, polos, watches, sunglasses and accessories.",
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "US",
        "returnPolicyCountry": "US",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 30,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn",
        "refundType": "https://schema.org/FullRefund",
        "merchantReturnLink": "https://mono.example.com/shipping-returns/"
      },
      "hasShippingService": {
        "@type": "ShippingService",
        "name": "Standard shipping",
        "handlingTime": { "@type": "ServicePeriod", "duration": { "@type": "QuantitativeValue", "minValue": 0, "maxValue": 1, "unitCode": "DAY" } },
        "shippingConditions": {
          "@type": "ShippingConditions",
          "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "US" },
          "shippingRate": { "@type": "MonetaryAmount", "value": 0, "currency": "USD" },
          "transitTime": { "@type": "ServicePeriod", "duration": { "@type": "QuantitativeValue", "minValue": 3, "maxValue": 5, "unitCode": "DAY" } }
        }
      }
    }
  ]
}
</script>
```
The policy numbers are placeholders. They must be copied from the configured `/shipping-returns/` page; if no policy is configured, emit neither property.

## 9. Demo/fictional products: policy risk and the decision

- **Merchant listing scope:** the markup is meant for pages where customers can actually buy. MONO's checkout is a demo, so an `Offer` would claim a purchase that can't happen.
- **Google's structured data guidelines:** "Don't use structured data to deceive or mislead users", and markup must reflect the visible page.
  - The penalty is a structured-data manual action: the markup is ignored and rich-result eligibility is lost. Rankings are not affected.
  - Since April 2026, Google says it may act on spam reports.
- **The project's own rule:** demo prices are allowed only when clearly labelled. A price in Google's product surfaces (Shopping knowledge panel, popular products, Images badges) shows **without** the "demo" label.
- **Decision (recommended):** in `SEO_MODE=demo`, leave out Product/Offer and policy markup.
  - Keep pages indexable, so Lighthouse SEO stays at 100; it fails "Page is blocked from indexing" if noindex is used.
  - Keep WebSite/Organization/BreadcrumbList.
  - Show the validated live-mode markup in tests and the README ("merchant-listing-ready, switched on with one flag").
- **If the owner wants Product markup on the demo anyway:** the only safe pairing is Product markup + `noindex` on product pages. That costs the Lighthouse SEO score on those pages. Never pair indexable pages with offers for products nobody can buy.
- **In every mode:** no `review`/`aggregateRating`, and no invented GTIN, material or contact details.

## 10. Faceted navigation (filters and sort on category and shop pages)

- The 6 category URLs are the only indexable facets. Each has a unique H1, intro (`category.description`) and title.
- Size, colour, price-sort and in-stock filters run client-side over pre-rendered cards.
- Mirror filter state in the query string for sharing and Back with `history.replaceState`:
  - standard `&` separators (Google advises against commas or semicolons as separators);
  - lower-case keys, stable key order;
  - for example `?size=m&sort=price-asc`.
- Render filter and sort controls as `<button>`/`<input>`, **not** `<a href>`, so crawlers don't discover the combinations. The page's canonical stays the clean category URL.
- Google's 2024 faceted-navigation guidance (moved to its crawling docs in Dec 2025) says robots.txt disallow of filter parameters is the most effective crawl control, and that empty combinations should return 404. Neither is needed here: there are no crawlable filter links and the site is 12 products. Revisit both only if server-rendered filter URLs ever appear.
- Never put filtered URLs in the sitemap or in internal `<a>` links.

## 11. Internal linking

- All navigation must be crawlable `<a href>`. Google doesn't follow JavaScript-only click handlers.
  - Header: Shop + all 6 categories.
  - Footer: categories + About, Contact, Size Guide, Shipping and Returns, Privacy.
- Visible breadcrumbs on category and product pages (they match the BreadcrumbList).
- Product cards: one `<a href="/products/<slug>/">` around the image and name. The anchor text is the product name, never just "Shop now".
- Product page links:
  - "Complete the look" (`completeTheLook` in the data);
  - "More in {Category}";
  - polo colour swatches as real links between the olive and navy pages, named by colour.
- Home links every category and the featured and new products. Every sitemap URL is reachable in 3 clicks or fewer, with no orphan pages.
- The admin demo link (if shown, for example in the footer) is fine: those pages are noindex.

## 12. Image SEO

- Product and editorial images use `<img>`/`<picture>`, never CSS backgrounds (Google doesn't index CSS images).
- Keep a `src` fallback with `srcset`/`sizes` (AVIF + WebP from the existing 360/560/800/1120 widths).
- `alt` comes from the catalogue (already descriptive). Decorative images get `alt=""`. No keyword stuffing.
- Filenames: descriptive kebab-case, as already produced (`cut-olive-pique-polo-front-1120.webp`). Google treats filenames as only a light hint, so they don't need to change.
- Every `<img>` gets `width` and `height` (or CSS `aspect-ratio`) to prevent CLS.
- Loading:
  - LCP image (first hero-slider slide; main image on product pages): `loading="eager"` + `fetchpriority="high"`, never lazy.
  - All other images: `loading="lazy"` + `decoding="async"`.
  - Slider slides after the first stay lazy and must not block the first paint.
- Place images next to the related text (product name, caption).
- Don't use images with embedded text in place of real copy (the brief already says this).

## 13. Open Graph and X cards (every page, from the same data as the title and description)

- `og:site_name` = MONO, `og:type` = `website`, `og:title`, `og:description`.
- `og:url` = canonical, `og:locale` = `en_US`.
- `og:image`: absolute https URL, 1200×630 JPEG, plus `og:image:width`/`og:image:height`/`og:image:alt`.
  - Add a build step that makes 1200×630 share cards: ivory background, the product cutout, a small MONO wordmark.
  - Avoid a bare logo as the share image.
- Leave out `product:price:*` OG tags: link previews would show an unlabelled demo price.
- `twitter:card` = `summary_large_image` (set it explicitly), plus `twitter:image:alt`. X falls back to the og title, description and image.
- Don't add `twitter:site`: there is no real account.
- X caches previews, so change the image URL (or its hash) when a card changes.

## 14. Core Web Vitals (Google "good" thresholds, 75th percentile of field data, mobile and desktop separately)

- **LCP ≤ 2.5 s** (poor > 4 s), **INP ≤ 200 ms** (poor > 500 ms), **CLS ≤ 0.1** (poor > 0.25).
- A demo site will have no CrUX field data (28-day window, traffic-gated), so measure with Lighthouse/PageSpeed Insights in the lab and the `web-vitals` library.
- **LCP:** pre-rendered HTML; the LCP image is preloaded or fetchpriority high and sized for the viewport; render-blocking CSS kept small. Self-host the Bodoni Moda + Jost woff2 subsets, preload only the 1–2 above-the-fold faces, and use `font-display: swap`.
- **CLS:** image dimensions; fallback-font metric overrides (`size-adjust`, `ascent-override`); no late-injected banners. The cart badge and drawer must not shift layout.
- **INP:** keep handlers short (add-to-bag, filter toggles, drawer, size select). Animate only `transform`/`opacity`, with no heavy animation libraries. Honour `prefers-reduced-motion`.
- Premium navigation without CWV cost:
  - cross-document View Transitions (`@view-transition { navigation: auto; }`) as progressive enhancement;
  - Speculation Rules prefetch for `/products/*` and `/collections/*` with `"eagerness": "moderate"`.
- Avoid `unload` handlers so the back/forward cache keeps working.

## 15. Language and hreflang

- `<html lang="en">` on every page, plus `<meta charset>` and `<meta name="viewport">`.
- One language and one region, so **no hreflang**.

## 16. Automated checks to add (Playwright / html-validate, desktop and phone)

1. Every indexable page has exactly one each of `<title>`, meta description, `<h1>` and canonical. The canonical is `SITE_ORIGIN + path` with a trailing slash. Titles and descriptions are unique site-wide.
2. noindex pages (`/cart/`, `/checkout/`, `/order-confirmation/`, `/search/`, `/admin/*`) carry robots noindex, have no canonical, are absent from the sitemap and are not Disallowed in robots.txt.
3. Sitemap URLs return 200 with no noindex. robots.txt contains the absolute `Sitemap:` line. An unknown URL returns status 404.
4. Every JSON-LD block passes `JSON.parse`, and every `@type` is one of WebSite, Organization, OnlineStore, BreadcrumbList, Product, ProductGroup. Checks by mode:
   - **demo:** no Product/Offer/ReturnPolicy/ShippingService, and no `review`/`aggregateRating`.
   - **live:** each Offer has price + `priceCurrency: "USD"` + availability; the JSON-LD price equals the visible price; variant URLs with `?size=` preselect that size in the UI.
5. The visible breadcrumb text equals the BreadcrumbList names.
6. Every `<img>` has `alt` (may be empty), `width` and `height`. Only the LCP image lacks `loading="lazy"`.
7. OG/Twitter: `og:image` and `og:url` are absolute https and `twitter:card` = `summary_large_image`.
8. Manual before launch: Rich Results Test (code mode) on one shirt, one polo, one watch and the home page; Schema Markup Validator; Lighthouse SEO 100.


## Sources

- https://developers.google.com/search/docs/appearance/structured-data/product
- https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
- https://developers.google.com/search/docs/appearance/structured-data/product-snippet
- https://developers.google.com/search/docs/appearance/structured-data/product-variants
- https://developers.google.com/search/blog/2024/02/product-variants
- https://developers.google.com/search/docs/appearance/structured-data/return-policy
- https://developers.google.com/search/docs/appearance/structured-data/shipping-policy
- https://developers.google.com/search/blog/2025/11/more-ways-to-share-shipping
- https://developers.google.com/search/docs/appearance/structured-data/organization
- https://developers.google.com/search/docs/appearance/site-names
- https://developers.google.com/search/blog/2025/01/simplifying-breadcrumbs
- https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/updates
- https://www.seroundtable.com/google-product-category-sale-duration-merchant-listing-41637.html
- https://www.searchenginejournal.com/google-updates-structured-data-requirements-for-return-policies/542080/
- https://searchengineland.com/google-search-to-drop-sitelinks-search-box-447682
- https://developers.google.com/search/docs/appearance/structured-data/generate-structured-data-with-javascript
- https://www.searchenginejournal.com/google-adds-two-new-best-practices-for-product-markup/528917/
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites
- https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- https://developers.google.com/search/docs/crawling-indexing/block-indexing
- https://developers.google.com/search/docs/crawling-indexing/robots/intro
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
- https://developers.google.com/crawling/docs/faceted-navigation
- https://developers.google.com/search/blog/2024/12/crawling-december-faceted-nav
- https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure
- https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- https://developers.google.com/search/docs/appearance/title-link
- https://developers.google.com/search/blog/2021/09/more-info-about-titles
- https://developers.google.com/search/docs/appearance/google-images
- https://developers.google.com/search/blog/2024/08/happy-avifriday
- https://web.dev/articles/vitals
- https://web.dev/articles/defining-core-web-vitals-thresholds
- https://developers.google.com/speed/docs/insights/v5/about
- https://developer.x.com/cards/markup
- https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/
- https://developers.cloudflare.com/workers/static-assets/headers/
- https://developers.cloudflare.com/workers/wrangler/configuration/
