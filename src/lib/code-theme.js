// Thèmes de coloration du code (Shiki), alignés sur les jetons de src/styles/global.css :
// fond chaud, clés en paprika, chaînes olive, nombres ocre, mots-clés lie-de-vin.
// Chaque couleur atteint un contraste d'au moins 4,5:1 sur son fond (WCAG AA).
const theme = (name, type, c) => ({
  name,
  type,
  colors: { 'editor.background': c.bg, 'editor.foreground': c.fg },
  tokenColors: [
    { settings: { foreground: c.fg } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: c.comment, fontStyle: 'italic' } },
    {
      scope: ['entity.name.tag', 'support.type.property-name', 'meta.object-literal.key', 'entity.other.attribute-name', 'variable.other.property', 'punctuation.support.type.property-name'],
      settings: { foreground: c.key },
    },
    { scope: ['string', 'markup.inline.raw', 'punctuation.definition.string'], settings: { foreground: c.string } },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character', 'constant.other', 'support.constant', 'variable.other.normal', 'variable.parameter'],
      settings: { foreground: c.number },
    },
    {
      scope: ['keyword', 'storage', 'storage.type', 'entity.name.function', 'support.function', 'entity.name.type'],
      settings: { foreground: c.keyword },
    },
    { scope: ['keyword.operator', 'punctuation'], settings: { foreground: c.fg } },
  ],
});

export const codeLight = theme('carnet-clair', 'light', {
  bg: '#f1ede5', fg: '#1f1e1c', comment: '#67635b', key: '#a8360c', string: '#4d6619', number: '#8a5300', keyword: '#8e3557',
});

export const codeDark = theme('carnet-sombre', 'dark', {
  bg: '#24211e', fg: '#ebe7df', comment: '#9a948a', key: '#f08a5d', string: '#b8c47e', number: '#e6b866', keyword: '#e39bb6',
});
