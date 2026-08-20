# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

## Deployment (Vercel)

The site is a static Vite build (`dist/`) — no server runtime. Build settings live in
[`vercel.json`](vercel.json), so no dashboard configuration is needed beyond the environment variable.

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Install command | `npm install` (`package-lock.json` is the lockfile Vercel uses; local dev uses Yarn 4) |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node.js | Vercel default (24.x). `.nvmrc` is **not** read by Vercel — pin it in **Settings → Build and Deployment → Node.js Version** or via `engines.node` if a specific major is needed. |

### Required environment variable

`VITE_SITE_URL` — the public origin, **no trailing slash** (e.g. `https://supernova-podcast.vercel.app`
or the custom domain). It is baked into `index.html` (canonical, OG, Twitter, JSON-LD) and into
`podcast.rss` / `sitemap.xml` at build time, so it must be set for **Production** *and* **Preview**
before the first deploy — otherwise the committed `.env` fallback (the old Cloudflare Pages URL) is used.
Changing the domain requires a redeploy.

### First deploy

```bash
npm i -g vercel      # or: npx vercel
vercel link          # connect the repo to a Vercel project
vercel env add VITE_SITE_URL production   # and: preview
vercel --prod
```

Or import the Git repo at vercel.com/new, add `VITE_SITE_URL` in **Settings → Environment Variables**,
and deploy.

### Routing and headers

- `scripts/copy-spa-shells.ts` writes a real `dist/episode/<slug>/index.html` for every episode, so
  episode URLs are served as static files (good for crawlers and link previews).
- `vercel.json` adds a catch-all rewrite to `/index.html` as a fallback for unknown paths — it only
  applies when no static file matches, so the RSS feed, sitemap, and images are unaffected.
- Cache headers (immutable hashed assets, fonts, OG images, feed) are declared in `vercel.json`.
  `public/_headers` is Cloudflare-only and is ignored by Vercel.

### After cutting over from Cloudflare Pages

- Point the custom domain at Vercel, then update `VITE_SITE_URL` and redeploy.
- Keep the old `*.pages.dev` host alive or 301-redirect it: podcast clients and Google have the old
  episode URLs from `podcast.rss` and `sitemap.xml`.
- Re-verify the property in Google Search Console for the new origin.
