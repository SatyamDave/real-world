# web

The Vite + React + TypeScript web app. What it must do is specified in [product/web-app.md](../product/web-app.md); for now it is a shell that renders the page title and the simulation disclaimer.

## Run and test

```
make dev                   # dev server, from the repo root
pnpm --filter web test     # Vitest
pnpm --filter web build    # type check and production build
```
