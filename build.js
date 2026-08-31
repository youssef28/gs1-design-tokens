import fs from 'fs';
import StyleDictionary from 'style-dictionary';
import { register } from '@tokens-studio/sd-transforms';

// excludeParentKeys makes the tokens-studio preprocessor merge each Tokens
// Studio "set" (global, Primitives/Value, Theme/MyGS1 Light, ...) directly
// into the root of the tree, dropping the set-name wrapper key. Aliases in
// tokens.json (e.g. "{surface.brand}") are written against that flattened
// namespace, not the raw nested set structure.
register(StyleDictionary, { excludeParentKeys: true });

const tokens = JSON.parse(fs.readFileSync('tokens.json', 'utf8'));

// Every Theme/* set defines the same keys (text, surface, border, status),
// so merging all of them at once would let the last one silently win for
// every theme. Each build gets only the shared sets plus its own theme set.
const themeSetKeys = {
  'mygs1-light': 'Theme/MyGS1 Light',
  'mygs1-dark': 'Theme/MyGS1 Dark',
  'onetrace-light': 'Theme/OneTrace Light',
  'onetrace-dark': 'Theme/OneTrace Dark',
  'tracesync-light': 'Theme/TraceSync Light',
  'tracesync-dark': 'Theme/TraceSync Dark',
};

for (const [theme, themeSetKey] of Object.entries(themeSetKeys)) {
  const sd = new StyleDictionary({
    tokens: {
      global: tokens.global,
      'Primitives/Value': tokens['Primitives/Value'],
      'Component/Value': tokens['Component/Value'],
      [themeSetKey]: tokens[themeSetKey],
      // Typography/Arabic is intentionally excluded here: it shares the same
      // keys as Typography/English (family, weight, size, right-to-left, ...)
      // and these 6 themes are brand x mode only, not language-scoped, so
      // including both would let one silently overwrite the other.
      'Typography/English': tokens['Typography/English'],
    },
    preprocessors: ['tokens-studio'],
    platforms: {
      css: {
        transformGroup: 'tokens-studio',
        transforms: ['name/kebab'],
        buildPath: 'dist/css/',
        files: [{
          destination: `themes/${theme}.css`,
          format: 'css/variables',
          options: { selector: `:root[data-theme='${theme}']`, outputReferences: true }
        }]
      }
    }
  });
  await sd.buildAllPlatforms();
}

const sdAll = new StyleDictionary({
  source: ['tokens.json'],
  preprocessors: ['tokens-studio'],
  platforms: {
    scss: {
      transformGroup: 'tokens-studio',
      transforms: ['name/kebab'],
      buildPath: 'dist/scss/',
      files: [{ destination: '_tokens.scss', format: 'scss/variables' }]
    }
  }
});
await sdAll.buildAllPlatforms();

console.log('✓ Built all themes + SCSS');
