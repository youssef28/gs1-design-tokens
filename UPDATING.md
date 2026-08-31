# Updating the Design Tokens

How a token change makes it from Figma into the Angular app.

## The flow

1. **Designer changes a variable in Figma** (e.g. updates `mygs1.500` or adds a new semantic token).
2. **Designer pushes via the Tokens Studio plugin**, which syncs the change to this repo and updates `tokens.json`.
3. **Someone runs `npm run build`** in this repo to regenerate `dist/` from the updated `tokens.json`.
4. **The regenerated `dist/` is committed and pushed** to this repo.
5. **The Angular team updates the dependency and rebuilds** their app to pick up the new CSS.

## Commands — token repo side (steps 3–4)

```bash
# pull the tokens.json change Tokens Studio just pushed
git pull origin main

# install/refresh dependencies if package.json changed
npm install

# regenerate dist/css/themes/*.css and dist/scss/_tokens.scss from tokens.json
npm run build

# review what actually changed before committing
git status
git diff dist/

# commit and push the regenerated output
git add tokens.json dist/
git commit -m "Rebuild tokens from Figma sync"
git push origin main
```

If `npm run build` fails with "Some token references could not be found," it usually means a new token set or alias was added in Figma that `build.js` doesn't yet know how to merge — check that the alias's referenced path actually exists in one of the sets being merged for that theme before assuming it's a build config bug.

## Commands — Angular app side (step 5)

```bash
# pull in the latest published version of the tokens package
npm update gs1-design-tokens

# rebuild the app so the new CSS custom property values take effect
ng build
# or, during local development:
ng serve
```

Because theming works via CSS custom properties scoped to `data-theme`, most token *value* changes (a color, a spacing value) need no code changes in Angular — just a rebuild. You only need to touch Angular code when a token's **name** changes (e.g. `--surface-brand` renamed) or a new semantic token is introduced that a component should start using — see [HANDOFF.md](HANDOFF.md) for the current token list.
