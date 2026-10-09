# RunLens website

The public product landing page. The RunLens dashboard remains a separate local application.

The landing page includes a replayable illustrative trace with pause and resume, three failure scenarios and selectable step, event and DOM evidence. The quickstart switches between source commands, Playwright and Puppeteer integration code. Tabs support keyboard navigation. Replay runs once on viewport entry and pauses when the demo leaves view or the page is hidden. Reduced motion disables autoplay and spatial effects while retaining the controls.

Live site: [runlens.dev](https://runlens.dev).

Published to Vercel production on 9 October 2026 using Node 24. The public deployment passes the same four viewport browser checks as the local build. Contact email remains akhiltrivedix@gmail.com.

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

The website contains a clearly labelled illustrative trace. Repository navigation links use the project home. Setup checks out a verified source snapshot while the release changes are under review. Once the release is merged and the npm package is published, update the source snapshot and install guidance together. There is no hosted trace collection or dashboard account.

Typography is served locally. Its licence and source are in `public/fonts`. Contact and author email: akhiltrivedix@gmail.com.
