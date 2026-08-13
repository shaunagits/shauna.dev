# CUTOVER — making this repo the real shauna.dev

Status: **PAUSED AT STEP 3 of 7.** Production `shauna.dev` is still served by
portfolio-2026 via the `byshauna` Netlify site.

Steps 1 and 2 are done: the new site is built, deployed and verified at
<https://shauna-dev.netlify.app>. Nothing points at it yet, so nothing is live
and nothing is at risk while this sits.

Paused on 2026-08-13 because Namecheap was down for scheduled maintenance, and
step 4 happens there. **Do not start step 3 without being able to finish step 4** —
they are the pair that opens the `www` gap, and step 3 alone leaves
`www.shauna.dev` 404ing with no way to close it.

Written 2026-08-13. Supersedes the 5-step sketch in `README.md`.

## The two sites

| | old | new |
|---|---|---|
| Netlify site | `byshauna` | `shauna-dev` |
| Site ID | `f63775ef-f653-4328-bf37-d5270d1882f2` | `72dd58e0-ee14-41fb-be3e-b9d535164274` |
| Repo | `shaunagits/portfolio-2026` | `shaunagits/shauna.dev` |
| Serves | shauna.digital **+ shauna.dev** | nothing yet |
| The page | `/links`, reached by host rewrite | `/`, directly |

`shauna.dev` and `www.shauna.dev` are currently **domain aliases on
`byshauna`**, whose `custom_domain` is `shauna.digital`.

## What has to move, and what does not

DNS for shauna.dev is at **Namecheap** (`dns1`/`dns2.registrar-servers.com`),
not Netlify. That splits the work: Netlify changes can be done from the CLI or
the Netlify UI, but the one DNS record has to be edited at Namecheap by hand.

- **Apex `shauna.dev` → `75.2.60.5` — do NOT change.** That is Netlify's shared
  load balancer. Every Netlify site sits behind it and routing is by hostname,
  so the apex follows whichever site claims the name. No edit needed.
- **`www.shauna.dev` CNAME → `byshauna.netlify.app` — MUST change.** This one is
  site-specific and is the only DNS edit in the whole cutover.
- **MX records (`eforward1-5.registrar-servers.com`) — do NOT touch.** They are
  Namecheap email forwarding for shauna.dev. Nothing here involves mail, and
  breaking them breaks mail silently.

## Order of operations

There is no ordering that avoids a gap on `www` entirely, because the Netlify
claim and the DNS record cannot change atomically. **The apex stays up the whole
time either way** — only `www` is exposed. Steps 3 and 4 are the gap; keep them
close together and it is a minute or two.

If you would rather the gap fall at a time you choose, do step 4 first: `www`
then 404s until step 3 lands, instead of after.

### 1. Deploy the new site  ← you · **DONE 2026-08-13**

Claude cannot run this; `netlify deploy` is denied in
`~/.claude/settings.json`.

Note: the first attempt failed on an Astro bug, not on anything here.
`removeEmptyDirs` in `astro/dist/core/fs/index.js` does `readdirSync` then
`rmdirSync` with no try/catch, racing `cleanServerOutput` deleting the same
transient `dist/chunks`. It throws ENOENT **after** every page is written, so
the output was already complete and correct. Ten clean builds could not
reproduce it; the retry succeeded. If it recurs, just run it again, or deploy
the good `dist/` directly with `netlify deploy --prod --dir=dist`.

```bash
cd /Users/shauna/Desktop/claudecode/shauna.dev && netlify deploy --build --prod
```

### 2. Verify the deploy before any domain touches  ← either of us · **DONE 2026-08-13**

Passed on every check: `200 text/html`; stylesheet same-origin and `text/css`;
CSP and security headers applied from `netlify.toml`; deployed HTML
byte-identical to the local `dist/index.html`; zero console errors under the
live CSP; renders fully styled. Content confirmed — seven linked bars, Island
Bound correctly non-linking, no Pinterest, canonical `https://shauna.dev/`.

The deploy log reporting "0 assets uploaded" was hash dedup from the failed
first attempt, not an empty deploy.

Re-run these if anything changes:

Nothing points at this site yet, so this is free to get wrong. Expect `200` and
`text/html`:

```bash
curl -sS -o /dev/null -D - https://shauna-dev.netlify.app/ | egrep -i '^(HTTP/|content-type:)'
```

Then confirm the stylesheet is same-origin and `text/css` — this is the check
that catches the failure mode where the page renders as unstyled text:

```bash
CSS=$(curl -sS https://shauna-dev.netlify.app/ | grep -o '/_astro/[^"]*\.css' | head -1); curl -sS -o /dev/null -D - "https://shauna-dev.netlify.app$CSS" | egrep -i '^(HTTP/|content-type:)'
```

**Open it in a browser and confirm it is styled.** One stylesheet is correct
here — portfolio-2026 served two because a 21-page build splits shared CSS.

Do not continue until this page looks right.

### 3. Move the domains on Netlify  ← either of us

Remove both names from `byshauna` first, or the add on `shauna-dev` will be
rejected as already claimed.

In the Netlify UI:
1. `byshauna` → Domain management → remove `shauna.dev` and `www.shauna.dev`
   (leave `shauna.digital` alone)
2. `shauna-dev` → Domain management → add `shauna.dev` as the primary domain,
   then `www.shauna.dev` as an alias

Netlify will report the domains as misconfigured until step 4. That is expected.

### 4. Repoint `www` at Namecheap  ← you

Only Claude cannot do this one — no Namecheap access.

1. Namecheap → Domain List → `shauna.dev` → **Advanced DNS**
2. Find the CNAME record with Host `www`, currently `byshauna.netlify.app.`
3. Change the value to **`shauna-dev.netlify.app.`** (keep the trailing dot if
   the existing record has one)
4. Drop TTL to the minimum offered before saving if you want faster propagation
5. Save. Leave the apex `A` record and every MX record exactly as they are.

### 5. Let the certificate provision  ← Netlify, then verify

The current Let's Encrypt cert covers all four names and lives on `byshauna`;
it does not follow the domains. `shauna-dev` provisions its own once DNS
resolves and the names are claimed — usually a few minutes, occasionally longer.

`shauna-dev` → Domain management → HTTPS → "Verify DNS configuration" if it
does not start on its own.

Until the cert issues, HTTPS will error. That is the expected middle state, not
a failure.

### 6. Verify the cutover  ← either of us

```bash
for u in https://shauna.dev/ https://www.shauna.dev/; do echo "== $u"; curl -sS -o /dev/null -D - "$u" | egrep -i '^(HTTP/|location:|content-type:|x-nf-request-id:)'; done
```

Both should be `200 text/html`. A 200 alone does not prove the swap — the old
site returns one too. What distinguishes them is the four bars added in this
repo (Thread, Countdown, Aloha Animal Outreach, Hawaiʻi 311), which are the
only ones using the `plain` variant:

```bash
curl -sS https://shauna.dev/ | grep -o 'class="bar plain' | wc -l
```

(`grep -o | wc -l`, not `grep -c` — the HTML is minified onto one line, so
`grep -c` counts that single line and always answers 1.)

**4** = the new site is serving. **0** = still the old one (it has three bars,
all accented). Seven linked bars total on the new page versus three on the old.

Then confirm shauna.digital is untouched:

```bash
for u in https://shauna.digital/ https://shauna.digital/blog https://shauna.digital/links/; do printf '%-38s ' "$u"; curl -sSL -o /dev/null -w '%{http_code}\n' "$u"; done
```

### 7. Retire the old copy  ← either of us, LAST

Only after step 6 passes. Until this runs, the old rules are the rollback.

In portfolio-2026: delete `src/pages/links.astro` and `src/data/links.json`,
and remove the `shauna.dev` / `www.shauna.dev` rule blocks from `netlify.toml`.
The build returns to 21 pages. Then push and let it deploy.

Note `/links` disappears from shauna.digital too. That is intended — it existed
only to be rewritten onto shauna.dev.

## Rollback

Before step 7, rollback is: put `shauna.dev` and `www.shauna.dev` back as
aliases on `byshauna`, and point the `www` CNAME back at `byshauna.netlify.app`.
Same shape as the cutover, same `www` gap, no code change. The old cert is
still on `byshauna` and still covers all four names (expires **2026-10-31**).

After step 7, rollback also means reverting that commit in portfolio-2026.

## Continuous deploy: WORKING, verified 2026-08-13

Set on 2026-08-13 via `netlify api updateSite`, mirroring how `byshauna` is
wired — the Netlify **GitHub App** (`installation_id: 5327833`), not a deploy
key:

```
provider github · repo shaunagits/shauna.dev · branch main
cmd "npm run build" · dir dist
```

Proven by the next push to `main`, which produced a git-triggered deploy that
reached `state=ready` on its own. That also settles the open question about
repo access — the Netlify GitHub App cloned this repo successfully, so it does
cover it. The resulting build serves byte-identical HTML to a local `npm run
build`.

Git-triggered deploys carry the commit message in the deploy `title`; CLI
deploys have an empty one. That is the quickest way to tell which path built
what:

```bash
netlify api listSiteDeploys --data '{"site_id":"72dd58e0-ee14-41fb-be3e-b9d535164274"}' | python3 -c "import json,sys; [print(d['created_at'][:19], d['state'], repr(d.get('title') or '')[:50]) for d in json.load(sys.stdin)[:5]]"
```

**Push to `main` is now the way to ship.** `netlify deploy --build --prod`
still works and is the fallback if a build fails, but it is no longer required.

## Known loose ends

- The live `countdownproject.org` brands itself "The ʻĪlio Project"; the bar
  here says "Countdown Project" by explicit call. Noted in `links.json`.
- Island Bound Hawaiʻi is still a non-linking "Building now" bar — no domain is
  registered and the repo is pre-implementation.
- The Writing section is hardcoded now and will go stale when you publish on
  shauna.digital. See `README.md`.
