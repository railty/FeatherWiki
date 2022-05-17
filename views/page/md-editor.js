import html from 'choo/html';

import { gallery } from '../gallery';
import { promptImageUpload, insertImg } from '../../helpers/handleImage';

export const editor = (state) => {
  const textChange = event => state.editStore.content = event.target.value;
  const element = html`<textarea onchange=${textChange}>${state.editStore.content}</textarea>`;
  const gal = () => document.getElementById('gal');

  return [
    element,
    html`<button onclick=${e => {e.preventDefault(); promptImageUpload(state, insert)}}>Insert Image from File</button>`,
    html`<button onclick=${e => {e.preventDefault(); gal().showModal()}}>Add Existing Image</button>`,
    html`<dialog id=gal>
      <form class=fr method=dialog>
        <button>Close</button>
      </form>
      ${ gallery(state, () => {}, { insert: (e, i) => insertImg(e, i, insert) }) }
    </dialog>`,
  ];
  
  // Modified from https://stackoverflow.com/a/19961519
  function insert ({ id }) {
    const text = `![](img:${id}:img)`;
    if (document.activeElement !== element) element.focus();
    if (document.selection) {
      // IE
      const sel = document.selection.createRange();
      sel.text = text;
    } else if (element.selectionStart || element.selectionStart === 0) {
      // Others
      var startPos = element.selectionStart;
      var endPos = element.selectionEnd;
      element.value = element.value.substring(0, startPos) +
        text +
        element.value.substring(endPos, element.value.length);
      element.selectionStart = startPos + text.length;
      element.selectionEnd = startPos + text.length;
    } else {
      element.value += text;
    }
    textChange({ target: element });
  };
}
