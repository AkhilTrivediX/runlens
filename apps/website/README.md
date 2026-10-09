# RunLens website

The public product landing page. The RunLens dashboard remains a separate local application.

From the repository root:

```sh
pnpm dev:website
pnpm test:website
```

The build uses Node to copy static HTML, CSS, JavaScript and assets into `dist`. It needs no browser automation database or backend.

## Vercel

Deploy this directory as the project root. `vercel.json` specifies `node build.mjs` and the `dist` output directory. The Vercel project should use Node 24.

```sh
cd apps/website
vercel login
vercel --prod
```

The website contains a clearly labelled illustrative trace. Repository setup links currently target the release candidate branch. Once that branch is merged and the npm package is published, update the links and install guidance together. There is no hosted trace collection or dashboard account.

Typography is served locally. Its licence and source are in `public/fonts`. Contact and author email: akhiltrivedix@gmail.com.
