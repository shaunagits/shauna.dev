# shauna.dev

The link-in-bio page at <https://shauna.dev/>. Astro, one page, no framework.

```bash
npm install && npm run dev
```

## Read this before you edit anything

**This folder does not deploy yet.** Production `shauna.dev` is still served by
the **portfolio-2026** repo at
`/Users/shauna/Desktop/claudecode/shauna.digital/portfolio`, which reaches this
domain through host-rewrite rules in its `netlify.toml`.

So right now there are two copies of this page:

| | portfolio-2026 | this folder |
|---|---|---|
| Route | `/links` | `/` |
| Serves shauna.dev | **yes, today** | not yet |
| Netlify site | `f63775ef-…` | none |

Editing here changes nothing on the live site until the cutover below is done.
Until then, **edit the copy in portfolio-2026**, or do both.

## What was copied, and the one non-obvious dependency

Everything the page needs to build, and nothing else — 21 pages became 1:

- `src/pages/index.astro` — was `src/pages/links.astro`
- `src/data/links.json` — all page content; adding a link is a one-entry edit
- `src/components/LogoS.astro`, `src/styles/global.css` — the only two imports
- `public/` — favicons, plus `og-image.jpg` (see below)

**`src/content/blog/` is the non-obvious one.** `index.astro` calls
`getCollection('blog')` to derive the post count and the latest post for the
Writing section, so all 13 markdown files have to be present or the build
fails. `content.config.ts` came along for the same reason. No blog *pages* were
copied, so nothing at `/blog/*` is built here and there is no duplicate content
— the collection is read, never rendered. The "read the latest" link is an
absolute URL to `shauna.digital/blog/…`, which is correct and stays that way.

The cost: **these 13 files are now duplicated and will drift.** Publish a post
on shauna.digital and this page's count goes stale. Decide before cutover —
options are (a) hardcode the count and latest slug in `links.json` and delete
the content dir, (b) keep syncing the files, (c) fetch the count at build time.
(a) is the least machinery for a number that changes a few times a year.

`og:image` still points at `https://shauna.digital/images/og-image.jpg`. The
file is copied into `public/images/` so you *can* switch that to a local path,
but the absolute URL works fine and was left alone.

## Cutover, when you want this folder to be the real site

Not started. Nothing below has been done.

1. `git init` here, push to a new repo
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
