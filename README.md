# shauna.dev

The link-in-bio page at <https://shauna.dev/>. Astro, one page, no framework.

```bash
npm install && npm run dev
```

## This repo is the live site

`shauna.dev` and `www.shauna.dev` are served from here — Netlify project
`shauna-dev`, its own certificate, cut over **2026-08-13**.

**Push to `main` and it ships.** Continuous deploy is connected and verified;
no CLI step is needed. `netlify deploy --build --prod` still works as a fallback
if a build fails.

To change what is on the page, edit `src/data/links.json` — one entry per link,
nothing else to touch — and push.

There is no second copy any more. portfolio-2026 no longer contains this page
and no longer has host rules for this domain; `shauna.digital/links` is a 301
to here. Do not go looking for something to keep in sync.

## What's here

Everything the page needs, and nothing else — 21 pages became 1, 15 files total:

- `src/pages/index.astro` — was `src/pages/links.astro`
- `src/data/links.json` — **all page content**; adding a link is a one-entry edit
- `src/components/LogoS.astro`, `src/styles/global.css` — the only two imports
- `public/` — favicons, plus `og-image.jpg`

No integrations, no `sharp`, no content collections. One page, one stylesheet.

### The Writing section is hardcoded, and will go stale

This is the one thing that can silently rot. In portfolio-2026 the post count
and latest post came from `getCollection('blog')`, so they could not be wrong.
That required this repo to carry all 13 posts and their MDX components purely
to count them — for a number that changes a few times a year.

Decoupled on 2026-08-13: the values live in `links.json` under `writing`
(`postCount`, `latestPostSlug`, `latestTitle`, `latestReadTime`), and the blog
now exists only in portfolio-2026. **Publish a post there and this page is
wrong until you update those four fields by hand.** Nothing validates them; a
wrong slug is a 404 nobody notices.

`og:image` points at `https://shauna.digital/images/og-image.jpg`. The file is
in `public/images/` too, so you can switch to a local path, but the absolute
URL works and was left alone.

## Cutover, when you want this folder to be the real site

1. ~~`git init`, push to a new repo~~ — **done 2026-08-13**:
   <https://github.com/shaunagits/shauna.dev> (public, default `main`)
2. New Netlify site from that repo — build `npm run build`, publish `dist`
3. Point `shauna.dev` + `www.shauna.dev` DNS at the new site, provision the cert
   (the current Let's Encrypt cert covers all four names and expires
   **2026-10-31**; the new site needs its own)
4. In **portfolio-2026**, delete `src/pages/links.astro`, `src/data/links.json`,
   and the `shauna.dev` / `www.shauna.dev` rule blocks from `netlify.toml`
5. Re-run the verification curls in that repo's `CUTOVER-shauna-dev.md` — they
   still apply, and step 2 there (stylesheets must stay same-origin) is the
   check most worth running

Step 4 is what makes it a move rather than a copy. Do it **last**, after the new
site is verified live — until then the old rules are the rollback.

## Provenance, and what was verified

Copied out of portfolio-2026 at commit `323a4ef` on 2026-08-13. The original
history for these files lives in that repo; this folder starts fresh.

`npm run build` here was diffed against the live `https://shauna.dev/` HTML on
2026-08-13. **No content differences** — same markup, same copy, same derived
post count. Two build-level differences, both expected and harmless:

- **Scope hash.** Astro derives `data-astro-cid-…` from the component path, so
  renaming `links.astro` → `index.astro` changed it on every element.
- **CSS packaging.** Live ships two stylesheets (`links.*.css` and
  `_slug_.*.css` — a 21-page build splits shared from page-scoped CSS); this
  one-page build emits a single file. Compared rule-by-rule: **133 rules on
  each side, zero differences.** Same styles, different packaging.

Worth knowing for the cutover: fewer CSS requests is a small win, but it also
means the "stylesheets stay same-origin" check in portfolio-2026's
`CUTOVER-shauna-dev.md` will be looking for one file here, not two.
