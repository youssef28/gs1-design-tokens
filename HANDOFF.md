# Frontend Handoff — GS1 Design Tokens

This repo builds CSS custom properties from Figma via Tokens Studio. This doc is for the Angular team consuming the generated output in `dist/`.

## What's in `dist/css/themes/`

Six files, one per brand × color-mode combination:

```
dist/css/themes/mygs1-light.css
dist/css/themes/mygs1-dark.css
dist/css/themes/onetrace-light.css
dist/css/themes/onetrace-dark.css
dist/css/themes/tracesync-light.css
dist/css/themes/tracesync-dark.css
```

Each file defines the same set of CSS custom properties, scoped under a `data-theme` attribute selector, e.g.:

```css
:root[data-theme='mygs1-light'] {
  --surface-brand: #d83f0e;
  --text-primary: #1a1a1a;
  /* ... */
}
```

Because every theme is scoped to its own `[data-theme='...']` selector, all six files can be loaded into the page **at the same time** without colliding — switching themes at runtime is just a matter of changing the `data-theme` attribute on `<html>`, no page reload or stylesheet swap needed.

There's also `dist/scss/_tokens.scss`, a flattened SCSS variable dump of the whole token set. **Don't use it for anything theme-dependent** — since it merges all six themes' `surface`/`text`/`border`/`status` tokens together, only the last-processed theme's values survive collisions. It's only safe for tokens that don't vary by theme (spacing, radius, border widths). For anything that changes between light/dark or brand, use the CSS custom properties described below instead.

## Adding the theme files to Angular

In `angular.json`, add all six theme files (plus your global stylesheet) to the `styles` array so they're all present in the page:

```json
"styles": [
  "src/styles.scss",
  "node_modules/gs1-design-tokens/dist/css/themes/mygs1-light.css",
  "node_modules/gs1-design-tokens/dist/css/themes/mygs1-dark.css",
  "node_modules/gs1-design-tokens/dist/css/themes/onetrace-light.css",
  "node_modules/gs1-design-tokens/dist/css/themes/onetrace-dark.css",
  "node_modules/gs1-design-tokens/dist/css/themes/tracesync-light.css",
  "node_modules/gs1-design-tokens/dist/css/themes/tracesync-dark.css"
]
```

Adjust the path if you're vendoring the CSS directly instead of installing it as a package (e.g. `src/assets/tokens/themes/*.css`).

## Switching themes: `ThemeService`

A minimal service that sets `data-theme` on `<html>` and persists the choice:

```ts
// theme.service.ts
import { Injectable, signal } from '@angular/core';

export type ThemeName =
  | 'mygs1-light' | 'mygs1-dark'
  | 'onetrace-light' | 'onetrace-dark'
  | 'tracesync-light' | 'tracesync-dark';

const STORAGE_KEY = 'gs1-theme';
const DEFAULT_THEME: ThemeName = 'mygs1-light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<ThemeName>(this.readInitialTheme());

  constructor() {
    this.applyTheme(this.theme());
  }

  setTheme(theme: ThemeName): void {
    this.theme.set(theme);
    this.applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  private applyTheme(theme: ThemeName): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  private readInitialTheme(): ThemeName {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    return stored ?? DEFAULT_THEME;
  }
}
```

Usage in a component:

```ts
constructor(private theme: ThemeService) {}

switchToDark() {
  this.theme.setTheme('mygs1-dark');
}
```

## Using the tokens in component SCSS

Reference the CSS custom properties directly — they resolve to whichever theme is currently active on `<html>`, so component styles never need to know or care which theme is applied:

```scss
// button.component.scss
.button-primary {
  background: var(--button-primary-background);
  color: var(--button-primary-text);
  border-radius: var(--button-radius);
  padding: var(--button-padding-y) var(--button-padding-x);
  gap: var(--button-gap);
}

.card {
  background: var(--card-background);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
}
```

Don't hardcode hex values or reach for `dist/scss/_tokens.scss` color variables in component code — always go through the semantic `var(--...)` custom properties so theming keeps working.

## Common tokens

| Token | Purpose |
|---|---|
| `--text-primary` | Main body/heading text color |
| `--text-secondary` | Supporting/lower-emphasis text |
| `--surface-primary` | Default page/component background |
| `--surface-brand` | Brand-colored surfaces (primary buttons, brand accents) |
| `--border-default` | Standard borders/dividers/input outlines |
| `--status-error-surface` / `-border` / `-solid` / `-text` | Error state background, border, solid fill, and text color |
| `--status-warning-*` | Same pattern as error, for warning state |
| `--status-success-*` | Same pattern as error, for success state |
| `--status-info-*` | Same pattern as error, for info state |
| `--button-primary-background` / `-text` | Primary button fill and label color |
| `--button-secondary-background` / `-text` / `-border` | Secondary (outline) button styling |
| `--button-radius` / `-padding-x` / `-padding-y` / `-gap` | Shared button shape/spacing |
| `--input-background` / `-text` / `-placeholder` / `-border` / `-border-focus` | Form input styling by state |
| `--input-radius` / `-padding-x` / `-padding-y` | Shared input shape/spacing |
| `--card-background` / `-border` | Card surface and outline |
| `--card-radius` / `-padding` / `-gap` | Shared card shape/spacing |

## RTL support

The shipped tokens are currently English-only — don't rely on `--family-*`, `--weight-*`, `--right-to-left`, or `--language` for locale logic, and there's no Arabic-specific token set built yet.

RTL layout mirroring is a separate concern from theming and is handled by the browser via the `dir` attribute plus **logical CSS properties**, not by a token. When Arabic support lands:

1. Set `dir="rtl"` on `<html>` alongside `data-theme` (two independent attributes — direction and brand/mode toggle separately).
2. In component styles, use logical properties instead of physical ones so layout flips automatically:

```scss
// Wrong — stays pinned to the left even when dir="rtl"
.card {
  padding-left: var(--space-8);
  margin-right: var(--space-4);
  border-left: 1px solid var(--border-default);
  text-align: left;
}

// Right — flips automatically with dir
.card {
  padding-inline-start: var(--space-8);
  margin-inline-end: var(--space-4);
  border-inline-start: 1px solid var(--border-default);
  text-align: start;
}
```

Common swaps: `padding-left/right` → `padding-inline-start/end`, `margin-left/right` → `margin-inline-start/end`, `left/right` (positioning) → `inset-inline-start/end`, `border-left/right` → `border-inline-start/end`, `text-align: left/right` → `text-align: start/end`.
