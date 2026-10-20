import { html, raw } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { Button, detailHref, Eyebrow, titleText } from './common.mjs';

// Two thin rings and a dot in the corner of the panel: the logo's C and its
// status light, drawn large and faint.
const RINGS = raw(
  '<svg class="cta__rings" viewBox="0 0 400 400" aria-hidden="true" focusable="false"><circle cx="200" cy="200" r="190" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="200" cy="200" r="130" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="330" cy="200" r="9" fill="currentColor"/></svg>',
);

// The closing call to action: a Deep Navy panel. Both buttons open the
// visitor's own phone or WhatsApp; nothing is sent from the page itself.
export default function ContactCTA({ content, links }) {
  const { contact, actions } = content;
  return html`
    <section class="cta" id="contact" aria-labelledby="contact-title">
      <div class="container">
        <div class="cta__panel">
          ${RINGS}
          <div class="cta__content">
            ${Eyebrow({ text: contact.eyebrow, inverse: true })}
            <h2 class="cta__title" id="contact-title">${titleText(contact.title)}</h2>
            <p class="cta__text">${contact.text}</p>
            <div class="cta__actions">
              ${Button({ href: links.call, label: actions.call, icon: 'phone', variant: 'accent', size: 'lg' })}
              ${Button({ href: links.whatsapp, label: actions.whatsapp, icon: 'message', variant: 'inverse', size: 'lg', external: true })}
            </div>
          </div>
          <dl class="cta__details">
            ${contact.details.map((detail) => html`
              <div class="cta__detail">
                <dt><span class="badge-icon badge-icon--inverse">${icon(detail.icon)}</span>${detail.term}</dt>
                <dd>${detail.link ? html`<a class="nowrap" href="${detailHref(links, detail.link)}"${detail.link === 'whatsapp' ? html` target="_blank" rel="noopener"` : ''}><span class="visually-hidden">${detail.term}: </span>${detail.value}</a>` : detail.value}</dd>
              </div>`)}
          </dl>
        </div>
      </div>
    </section>`;
}
