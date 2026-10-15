// /contact/: a demo contact form (never sent anywhere) and help links.
// app.js shows the confirmation for form[data-demo-form]; content.js adds the
// required-field checks, inline errors and the error summary.

import { esc, icon } from '../../../site/assets/js/lib/render.js';
import { head, trail, OG_DEFAULT } from '../partials/content.mjs';

const TOPICS = ['A product', 'Sizing and fit', 'Delivery and returns', 'A demo order', 'This demo site', 'Something else'];

const HELP = [
  { href: '/size-guide/', label: 'Size guide', note: 'Chest, neck and waist measurements for every size.' },
  { href: '/shipping-returns/', label: 'Shipping and returns', note: 'Demo delivery options, prices and the returns policy.' },
  { href: '/cart/', label: 'Your bag', note: 'See and change what you have added so far.' },
  { href: '/about/#demo', label: 'How this demo works', note: 'What is saved in your browser, and how to reset it.' },
];

export default function render() {
  const crumbs = trail('Contact', '/contact/');

  const content = `
${head({
  crumbs: crumbs.html,
  eyebrow: 'Help',
  title: 'Contact',
  lede: 'This is a demo form, so you can see how it works. Messages are not sent anywhere, and MONO has no real inbox.',
  ghost: 'Contact',
})}

<section class="wrap section-tight ct-contact" aria-label="Contact form and help">
  <div class="ct-contact-form">
    <form class="ct-form" action="/contact/" method="post" novalidate data-contact-form
      data-demo-form="Thank you. This is a demo, so your message was not sent anywhere and nothing was saved.">
      <div class="ct-errors" data-error-summary tabindex="-1" hidden>
        <h2 class="ct-errors-title" data-error-title>Check the form</h2>
        <ul data-error-list></ul>
      </div>

      <p class="ct-form-intro" id="ct-form-note">All fields are required. Nothing you type leaves this page.</p>

      <div class="ct-form-row">
        <div class="field" data-field="name">
          <label for="ct-name">Name</label>
          <input class="input" id="ct-name" name="name" type="text" autocomplete="name" autocapitalize="words" required maxlength="80" data-label="your name">
          <p class="field-error" id="ct-name-error" hidden></p>
        </div>
        <div class="field" data-field="email">
          <label for="ct-email">Email</label>
          <input class="input" id="ct-email" name="email" type="email" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" required maxlength="120" data-label="your email">
          <p class="field-error" id="ct-email-error" hidden></p>
        </div>
      </div>

      <div class="field" data-field="topic">
        <label for="ct-topic">Topic</label>
        <select class="select" id="ct-topic" name="topic" required data-label="a topic">
          <option value="">Choose a topic</option>
          ${TOPICS.map((t) => `<option>${esc(t)}</option>`).join('')}
        </select>
        <p class="field-error" id="ct-topic-error" hidden></p>
      </div>

      <div class="field" data-field="message">
        <div class="ct-field-top">
          <label for="ct-message">Message</label>
          <span class="hint tabular" data-count aria-hidden="true">0 / 1000</span>
        </div>
        <textarea class="textarea" id="ct-message" name="message" rows="7" required minlength="10" maxlength="1000" aria-describedby="ct-message-hint" data-label="a message"></textarea>
        <p class="hint" id="ct-message-hint">At least 10 characters.</p>
        <p class="field-error" id="ct-message-error" hidden></p>
      </div>

      <div class="ct-form-foot">
        <button class="btn" type="submit">Send message ${icon('arrow', { size: 16 })}</button>
        <p class="small muted">Demo form: nothing is sent.</p>
      </div>
      <p class="ct-form-msg" data-form-message></p>
      <noscript><p class="notice">This demo form needs JavaScript to run. It never sends anything.</p></noscript>
    </form>
  </div>

  <aside class="ct-contact-aside" aria-labelledby="ct-help-title">
    <h2 class="label ct-aside-title" id="ct-help-title">Before you write</h2>
    <ul class="ct-help" role="list">
      ${HELP.map((h) => `<li><a class="ct-help-link" href="${h.href}"><span class="ct-help-name">${esc(h.label)}${icon('arrow', { size: 18 })}</span><span class="ct-help-note">${esc(h.note)}</span></a></li>`).join('')}
    </ul>
    <div class="ct-note">
      <p class="label">About this page</p>
      <p>MONO is a fictional label, so there is no email address, phone number or shop to visit. The form is here to show how a real one would behave.</p>
    </div>
  </aside>
</section>`;

  return {
    title: 'Contact',
    description: 'Try the MONO contact form, a demo that sends nothing. Find the size guide, delivery details and how this demo store works.',
    content,
    css: ['content'],
    js: ['content'],
    jsonld: [crumbs.jsonld],
    bodyClass: 'ct-page ct-contact-page',
    ...OG_DEFAULT,
  };
}
