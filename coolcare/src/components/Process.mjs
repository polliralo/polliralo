import { html } from '../lib/html.mjs';
import { Eyebrow, titleText } from './common.mjs';

// Three numbered steps on a line, like a timeline. Numbers carry the order;
// no icons needed.
export default function Process({ content }) {
  const { process } = content;
  return html`
    <section class="section process" id="how-it-works" aria-labelledby="process-title">
      <div class="container">
        <div class="section-head section-head--center">
          ${Eyebrow({ text: process.eyebrow })}
          <h2 class="section-title" id="process-title">${titleText(process.title)}</h2>
        </div>
        <ol class="steps" role="list">
          ${process.steps.map((step, index) => html`
            <li class="step" data-reveal>
              <span class="step__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
              <h3 class="step__title">${step.title}</h3>
              <p class="step__text">${step.text}</p>
            </li>`)}
        </ol>
      </div>
    </section>`;
}
