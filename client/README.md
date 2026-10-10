# Euclip client

Ember 5.5 app. See the [root README](../README.md) for prerequisites, `bin/dev`, production builds and
the Google Cloud Storage CORS setup.

Useful commands (from this directory):

- `npx ember serve --proxy http://localhost:3000`: dev server (or just run `../bin/dev`)
- `npm run lint`, `npm run lint:types`
- `npm run wasm:build`: optional Rust/WASM bitcrusher build (needs wasm-pack)

Architecture notes: [theory-of-operation.md](theory-of-operation.md), [api_docs.md](api_docs.md), [todo.md](todo.md).
