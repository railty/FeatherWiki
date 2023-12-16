import { marked } from 'marked';
import '../node_modules/gfm.css/gfm.css'

const reference = {
  name: 'reference',
  level: 'inline',                                 // Is this a block-level or inline-level tokenizer?
  start(src) {
    return src.match(/\[\[/)?.index; 
  },    // Hint to Marked.js to stop and check for a match
  tokenizer(src, tokens) {
    const rule = /^\[\[(.*)\]\]$/;  // Regex for the complete token, anchor to string start
    const match = rule.exec(src);
    if (match) {
      return {                                         // Token to generate
        type: 'reference',                           // Should match "name" above
        raw: match[0],                                 // Text to consume from the source
        title: this.lexer.inlineTokens(match[1].trim()),  // Additional custom properties, including
      };
    }
  },
  renderer(token) {
    const title = this.parser.parseInline(token.title)
    return `\n<a onclick="openReference('${title}')">${title}</a>`;
  },
};

marked.use({ extensions: [reference] });

export default function md (markdown) {
  return marked.parse(markdown);
}
