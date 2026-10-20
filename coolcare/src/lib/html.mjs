// A tiny HTML template helper with no dependencies.
//
//   html`<p class="${cls}">${text}</p>`
//
// Every interpolated value is escaped unless it is already HTML (the result of
// another html`` call, or raw()). Arrays are joined line by line. A value that
// starts its own line takes on that line's indentation, so nested components
// come out neatly indented in the built page.

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export class Html {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

export const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ENTITIES[char]);

// Marks trusted markup (for example an SVG icon) as HTML, so it is not escaped.
export const raw = (value) => new Html(String(value));

function stringify(value) {
  if (value === null || value === undefined || value === false) return '';
  if (Array.isArray(value)) return value.map(stringify).filter(Boolean).join('\n');
  if (value instanceof Html) return value.value;
  return escape(value);
}

// Drops the first and last line breaks and the indentation all lines share.
function dedent(text) {
  const lines = text.replace(/^[ \t]*\n/, '').replace(/\n[ \t]*$/, '').split('\n');
  const indents = lines.filter((line) => line.trim()).map((line) => /^ */.exec(line)[0].length);
  const shared = indents.length ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(shared)).join('\n');
}

export function html(strings, ...values) {
  let out = '';
  strings.forEach((chunk, i) => {
    out += chunk;
    if (i >= values.length) return;
    const value = stringify(values[i]);
    const lineSoFar = out.slice(out.lastIndexOf('\n') + 1);
    const indent = /^[ \t]+$/.test(lineSoFar) ? lineSoFar : '';
    out += indent ? value.replace(/\n(?=[^\n])/g, `\n${indent}`) : value;
  });
  // Only block templates (starting on a new line) are dedented; a one-line
  // fragment such as html` target="_blank"` keeps its leading space.
  return new Html(strings[0].startsWith('\n') ? dedent(out) : out);
}

// Joins attribute values, skipping empty ones: cx('btn', primary && 'btn--primary').
export const cx = (...names) => names.filter(Boolean).join(' ');
