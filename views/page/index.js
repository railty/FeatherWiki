import { pageDisplay } from './display';
import { pageEdit } from './edit';

export const pageView = (state, emit, page) => {
  const { root, edit, help, p, events } = state;
  const { cd, md } = page; // created date & modified date

  if (edit) {
    return pageEdit(state, emit, page);
  }
  const breadcrumb = help.breadcrumb(page);
  
  const crFormat = FW.date(new Date(cd));
  const modified = new Date(md ?? cd); // If no modified date, use created
  const mdFormat = FW.date(modified);
  return [
    html`<header>
      ${breadcrumb.map(p => [html`<a href="${root}?page=${p.slug}">${p.name}</a>`, ' / '])}
      <div class="r ns">
        <h1 class=c>${page.name}</h1>
        ${
          page.e
          ? ''
          : html`<div class="c w14 tr">
            <time datetime=${modified.toISOString()}>
              ${
                crFormat !== mdFormat
                ? html`<abbr title="Created: ${crFormat}">${mdFormat}</abbr>`
                : mdFormat
              }
            </time>
          ${
            !p.published
            ? html`<button onclick=${() => emit(events.START_EDIT)}>Edit</button>
            `
            : ''
          }
          </div>`
        }
      </div>
    </header>`,
    pageDisplay(state, emit, page)
  ];
}