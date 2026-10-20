// The whole page, assembled from the components in the recommended order:
// Header, Hero, ServiceGrid (ServiceCard), WhyCoolCare, Process, About,
// ContactCTA, Footer, plus the phone menu.

import About from './components/About.mjs';
import ContactCTA from './components/ContactCTA.mjs';
import Footer from './components/Footer.mjs';
import Header from './components/Header.mjs';
import Hero from './components/Hero.mjs';
import Menu from './components/Menu.mjs';
import Process from './components/Process.mjs';
import ServiceGrid from './components/ServiceGrid.mjs';
import WhyCoolCare from './components/WhyCoolCare.mjs';
import { html, raw } from './lib/html.mjs';

function sharing({ config, content }) {
  const { meta, hero } = content;
  const tags = [
    html`<meta property="og:type" content="website">`,
    html`<meta property="og:site_name" content="${config.name}">`,
    html`<meta property="og:title" content="${meta.title}">`,
    html`<meta property="og:description" content="${meta.description}">`,
    html`<meta name="twitter:card" content="summary_large_image">`,
  ];
  // Link previews need full addresses, so these appear once siteUrl is set.
  if (config.siteUrl) {
    tags.unshift(html`<link rel="canonical" href="${config.siteUrl}">`);
    tags.push(
      html`<meta property="og:url" content="${config.siteUrl}">`,
      html`<meta property="og:image" content="${config.siteUrl}assets/img/og-image.jpg">`,
      html`<meta property="og:image:width" content="1200">`,
      html`<meta property="og:image:height" content="630">`,
      html`<meta property="og:image:alt" content="${hero.image.alt}">`,
    );
  }
  return tags;
}

// Business details for search engines, only once they are real.
function structuredData({ config, content }) {
  if (config.isConcept) return '';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'HVACBusiness',
    name: config.name,
    description: content.meta.description,
    telephone: config.phone,
    areaServed: config.serviceArea,
    ...(config.siteUrl && { url: config.siteUrl, image: `${config.siteUrl}assets/img/og-image.jpg` }),
  };
  const json = JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
  return html`
    <script type="application/ld+json">
      ${raw(json)}
    </script>`;
}

export default function page(ctx) {
  const { content, assets } = ctx;
  const { meta } = content;
  return html`
    <!DOCTYPE html>
    <!-- Built by scripts/build.mjs from src/ and site.config.mjs. Edit those, then run npm run build. -->
    <html lang="en" class="no-js">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${meta.title}</title>
        <meta name="description" content="${meta.description}">
        <meta name="theme-color" content="${meta.themeColor}">
        ${sharing(ctx)}
        <link rel="icon" href="favicon.svg" type="image/svg+xml">
        <link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png">
        <link rel="apple-touch-icon" href="apple-touch-icon.png">
        <link rel="preload" href="assets/fonts/manrope.woff2" as="font" type="font/woff2" crossorigin>
        <link rel="stylesheet" href="${assets.css}">
        <script>document.documentElement.classList.replace('no-js', 'js');</script>
        <script src="${assets.js}" defer></script>
        ${structuredData(ctx)}
      </head>
      <body id="top">
        <a class="skip-link" href="#main">${content.skipLink}</a>
        ${Header(ctx)}
        <main id="main" tabindex="-1">
          ${Hero(ctx)}
          ${ServiceGrid(ctx)}
          ${WhyCoolCare(ctx)}
          ${Process(ctx)}
          ${About(ctx)}
          ${ContactCTA(ctx)}
        </main>
        ${Footer(ctx)}
        ${Menu(ctx)}
      </body>
    </html>`;
}
