# Master instruction: MONO premium men's fashion e-commerce

The owner's brief for the shop build, saved as given. Do not start building until the owner says so: they are choosing the design and UI direction first. `build-notes.md` in this folder maps the supplied photos to this brief and lists open questions.

---

Act as my senior e-commerce designer, luxury menswear art director, frontend architect, UX designer, QA engineer, and AI-first development partner.

## 1. Project goal

Build a polished, premium-looking, fully responsive ecommerce portfolio/demo website for MONO, a fictional men's fashion and accessories brand.

This must look and behave like a professionally designed fashion ecommerce store, not a generic landing page or an ordinary AI-generated template.

Product categories:

- Shirts
- T-Shirts
- Polos
- Watches
- Sunglasses
- Accessories

The website must prioritize product discovery, attractive photography, clear product information, mobile usability, working shopping interactions, and visual consistency.

Do not claim this fictional brand has real customers, verified reviews, certifications, guarantees, or operational services.

## 2. First: inspect the existing project

Before changing anything:

1. Inspect the current repository, framework, package manager, routes, components, assets, and existing functionality.
2. Identify what already works.
3. Reuse compatible existing code and preserve working features.
4. Locate supplied MONO image assets and inspect their actual filenames.
5. Identify missing assets instead of assuming they exist.
6. Prepare a concise implementation plan and then execute it in stages.

Do not blindly rewrite the entire project, replace the existing stack, or install unnecessary dependencies.

If the project already uses a suitable framework, continue with it unless there is a clear technical reason to change.

## 3. Brand identity

Brand: MONO

Brand descriptor: Premium Men's Fashion & Accessories

Proposed tagline: "Less noise. Better essentials."

Visual direction:

- Modern, understated, confident, masculine, sophisticated.
- Premium editorial art direction with clean commercial product presentation.
- Refined typography, clear spacing, restrained animation, and strong visual hierarchy.

Suggested palette:

- Warm ivory: #F5F2EC
- Charcoal: #1C1C1A
- Soft stone: #E8E2D9
- Muted olive: #686B55
- Warm grey and taupe supporting tones
- Deep navy and brown as product-specific accents
- Border: #DDD7CE

Use a refined display serif with a highly readable sans-serif. Use existing compatible fonts if available; do not add unnecessary fonts.

Build a cohesive visual system, but DO NOT make every image or section look identical.

## 4. Critical image art direction

One of the main design requirements is photographic diversity.

Do not reuse the same beige studio, stone wall, lighting, camera angle, or centered composition for every category and editorial image.

Use different environments according to the purpose of each image:

- Homepage desktop hero: sophisticated urban architecture, late-afternoon sunlight, male fashion model, wide editorial composition.
- Mobile hero: a separate compact landscape composition, with the model positioned beside a visually quiet text area.
- Shirts category: refined indoor setting, wood, window light, visible collar and shirt construction.
- T-Shirts category: contemporary concrete architecture, graphic shadows, relaxed casual styling.
- Polos category: sunlit terrace or outdoor architecture, knit texture and relaxed sophistication.
- Watches: darker, more dramatic product photography with controlled metal highlights.
- Sunglasses: outdoor daylight, natural face fit and recognizable frame silhouette.
- Accessories: tactile leather and wood, directional lighting, still-life composition.
- New Arrivals: wider campaign photography featuring coordinated but distinct outfits.
- Brand story: natural lifestyle photography in a modern wardrobe or apartment.

However, product catalog images should remain clean and sufficiently consistent within the same category so customers can compare products easily.

IMPORTANT DISTINCTION: Campaign images should have diverse creative direction. Product catalog images should prioritize product clarity. Product-detail gallery images must show meaningful additional information.

Do not use random unrelated photos simply to make the site appear luxurious.

### Asset handling

Use supplied images where available.

Recommended asset paths:

- /images/hero/mono-hero-desktop.webp
- /images/hero/mono-hero-mobile.webp
- /images/categories/
- /images/products/
- /images/campaigns/

Check the exact files before referencing them.

If an image is missing:

1. Keep a clear, intentional placeholder with the correct aspect ratio.
2. Provide the exact expected filename and explain which image is missing.
3. Do not silently replace it with a random remote image or reuse one unrelated image for every section.

Do not place important headlines, CTAs, product names, prices, or logos inside generated photographs. Render these as actual website content.

## 5. Mobile hero: highest priority

The mobile storefront must feel compact, practical, and genuinely optimized for shopping.

Do NOT simply scale the desktop hero down or use an oversized full-screen mobile poster.

Recommended mobile hero image:

- 1080 × 810 px
- 4:3 landscape aspect ratio

Recommended initial rendered hero height:

- Approximately 290–350 CSS pixels, adjustable according to the actual phone viewport and design.

Mobile requirements:

- Compact announcement bar.
- Efficient header with a working menu, search and cart.
- Separate mobile hero image.
- Short, readable headline.
- One clear primary CTA and, only when useful, one secondary CTA.
- No unnecessary full-screen image.
- Avoid excessive top and bottom padding.
- Make category browsing accessible quickly after the hero.
- Do not allow a giant hero to push all product discovery far below the first screen.

Use responsive picture sources or the project's compatible image-loading mechanism to serve the dedicated mobile image when appropriate.

Desktop hero may use a wide 1920 × 900 image. The mobile hero must be a separately art-directed asset rather than a blind crop of that desktop image.

Keep hero text accessible and readable. If text overlays the image, use a carefully designed contrast treatment. If necessary, use an image followed by a compact text panel instead.

Test the real layout at narrow mobile widths, not only in a desktop browser.

## 6. Homepage structure

Implement the following hierarchy:

1. Compact announcement bar.
2. Header with MONO wordmark, category navigation, search, and cart.
3. Premium editorial hero with HTML headline and CTA.
4. Shop-by-category section with six distinct category images.
5. New Arrivals product grid.
6. Wide New Arrivals editorial banner.
7. Shirts or Everyday Essentials feature.
8. Watches feature with a distinct visual environment.
9. Sunglasses feature with an outdoor editorial image.
10. Accessories feature with still-life product photography.
11. Short, honest MONO brand introduction.
12. Optional demo newsletter interface.
13. Footer with working navigation and clearly labelled demo policies.

The page should feel premium, but do not add sections solely to make it longer.

On mobile, preserve a fast route to products and categories.

## 7. Required pages

Implement these pages where compatible with the existing project:

- /
- /collections
- /collections/shirts
- /collections/t-shirts
- /collections/polos
- /collections/watches
- /collections/sunglasses
- /collections/accessories
- /products/[slug]
- /search
- /cart
- /checkout
- /order-confirmation
- /about
- /contact
- /size-guide
- /admin
- /admin/products
- /admin/orders
- /privacy
- /shipping-returns

Use reusable templates instead of hardcoding six completely separate collection pages.

If the existing routing convention differs, use the equivalent routes supported by the current project.

## 8. Product catalog

Begin with 12 clearly identified demo products: two products per category.

Each product should have:

- Unique ID and slug
- Unique SKU
- Name and category
- Product description
- Price and consistent currency
- Color
- Material and specifications when provided
- Product images and descriptive alt text
- Relevant variants
- Variant-specific stock quantities
- Featured/new-arrival status
- Clearly marked demo-data status

Never invent technical product claims and present them as verified facts.

Do not generate fake customer reviews, ratings, sales numbers, or purchase counts.

If data is missing, use a clearly marked demo placeholder or omit the field.

## 9. Collection pages and product cards

Collection pages need:

- Category title and short description
- Product count
- Working search/filter/sort controls
- Active filter indicators
- Clear-filter action
- Responsive product grid
- Empty-results state

Filters should use relevant actual data, including available sizes, colors, prices and product attributes.

Product cards should include:

- Product image
- Product name
- Price and currency
- Available color indicators when applicable
- Optional genuine New Arrival label for seeded demo data
- Product detail link

Do not overload cards with excessive badges, text, or decorative elements.

Keep card image ratios consistent within a product collection. Provide meaningful secondary hover images only when real corresponding assets are available.

## 10. Product detail pages

Build a reusable product-detail template that supports the following:

- Product image gallery with working thumbnails
- Product title, price and description
- Relevant specifications
- Product variant selectors
- Stock and availability states
- Quantity selector
- Add-to-cart action
- Size guide for clothing
- Care information where supported
- Related products
- Useful delivery/returns information only when explicitly configured

Different products need different controls:

- Shirts, T-Shirts and Polos: size and color as appropriate.
- Watches: watch-specific options if supplied.
- Sunglasses: frame/color variants if supplied.
- Accessories: relevant options only.

Do not force clothing-size selectors onto watches or sunglasses.

Validate required variant selections before adding apparel to the cart.

## 11. Cart and demo checkout

Implement real frontend interactions, not decorative buttons.

Cart:

- Add item
- Change quantity
- Remove item
- Clear cart
- Recalculate subtotals correctly
- Handle unavailable or out-of-stock items
- Persist demo state locally where appropriate
- Display a polished empty-cart state

Checkout:

- Validated contact and delivery form
- Order summary
- Clear demonstration disclaimer
- Test-only submission
- Simulated order reference
- Confirmation page showing the actual simulated order summary

The demo must not collect real payment-card information or imply that money has been charged.

Do not connect an actual payment provider unless specifically required and properly configured.

## 12. Demo admin dashboard

Build a clearly labelled demo owner dashboard with:

- Summary metrics based on demo data
- Product table and search
- Add/edit/delete product
- Price and description editing
- Image-path editing
- Variant and inventory editing
- Form validation
- Destructive-action confirmation
- Mock order list generated through demo checkout
- Reset-to-demo-data functionality where suitable

Product changes should flow through the central data source so storefront views stay consistent.

localStorage is acceptable for a portfolio-only persistence demonstration, but do not claim it is secure production storage.

Do not pretend a hidden frontend route is production-secure admin authorization. Clearly state that real deployment requires backend authentication, authorization, a database, and appropriate server-side validation.

## 13. Component architecture

Use reusable components appropriate to the existing stack, such as:

- AnnouncementBar
- SiteHeader
- MobileNavigation
- SearchPanel
- HeroSection
- CategoryGrid
- CategoryCard
- ProductCard
- ProductGrid
- CollectionFilters
- SortControl
- ProductGallery
- VariantSelector
- SizeGuide
- CartDrawer or CartPage
- CheckoutForm
- OrderConfirmation
- AdminLayout
- ProductForm
- InventoryTable
- EmptyState
- Footer

Use one source of truth for products, variants, prices and stock.

Avoid duplicated product information and inconsistent prices across pages.

Keep styling organized through reusable design tokens and components.

## 14. Animation and interaction

Use subtle, purposeful motion:

- Short opacity/transform transitions
- Product-card hover interactions
- Smooth cart feedback
- Light gallery transitions
- Clear button hover/focus states

Avoid excessive 3D animation, constant motion, intrusive scroll effects, oversized parallax, and effects that interfere with shopping.

Respect reduced-motion preferences where applicable.

The brand should look premium because of art direction, typography, layout, photography and detail, not because every section animates.

## 15. Accessibility, SEO and performance

Include:

- Keyboard-accessible navigation and forms
- Visible focus indicators
- Appropriate text contrast
- Useful image alt text
- Semantic headings and page landmarks
- Clear form errors
- Descriptive page titles and meta descriptions
- Product/category URLs with meaningful slugs
- Responsive image delivery
- Optimized local images
- Lazy loading where appropriate
- Proper image dimensions to reduce layout shifts
- Working internal navigation

Do not use images containing embedded text as a substitute for real page content.

Avoid unnecessary packages and dependencies.

## 16. Development workflow

Work in manageable milestones:

- PHASE 1: Repository audit and implementation plan.
- PHASE 2: Brand design tokens, global layout and responsive navigation.
- PHASE 3: Homepage and category pages using available assets.
- PHASE 4: Product data, listing functionality and product-detail pages.
- PHASE 5: Cart, demo checkout and order confirmation.
- PHASE 6: Demo admin and inventory management.
- PHASE 7: SEO, accessibility, performance and responsive QA.
- PHASE 8: Final fixes, README and portfolio presentation.

After each phase:

- Run available checks.
- Test the relevant page and functionality.
- Fix confirmed problems.
- Summarize changes.
- Identify missing assets or unfinished requirements honestly.

Do not stop at a static mockup if working functionality is required.

Do not claim tests passed unless they were actually run.

## 17. Final acceptance criteria

The project is ready for portfolio presentation when:

1. All required routes load correctly.
2. Desktop and mobile layouts are intentionally designed.
3. The mobile hero is compact and separately optimized.
4. Images have distinct art direction where appropriate.
5. Catalog images remain clear and consistent within each collection.
6. Product gallery images correspond to the correct products.
7. Search, filters, sorting and variant selection actually work.
8. Cart calculations and quantity updates are correct.
9. Demo checkout validates inputs and never pretends a real payment occurred.
10. Admin product changes are reflected in the storefront demo.
11. All essential navigation and buttons work.
12. No obvious broken images, placeholder links, layout overflow or misleading claims remain.
13. The README explains features, setup instructions, demo behavior, and production limitations.

Begin by inspecting the current project. Then implement the website in these stages, preserving working functionality and reporting genuine blockers instead of silently inventing solutions.
