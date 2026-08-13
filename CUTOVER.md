# CUTOVER — making this repo the real shauna.dev

Status: **NOT DONE.** Production `shauna.dev` is still served by portfolio-2026
via the `byshauna` Netlify site. Nothing in this repo is live.

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

### 1. Deploy the new site  ← you

Claude cannot run this; `netlify deploy` is denied in
`~/.claude/settings.json`.

```bash
cd /Users/shauna/Desktop/claudecode/shauna.dev && netlify deploy --build --prod
```

### 2. Verify the deploy before any domain touches  ← either of us

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
curl -sS https://shauna.dev/ | grep -c 'class="bar plain'
```

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

## Known loose ends

- The live `countdownproject.org` brands itself "The ʻĪlio Project"; the bar
  here says "Countdown Project" by explicit call. Noted in `links.json`.
- Island Bound Hawaiʻi is still a non-linking "Building now" bar — no domain is
  registered and the repo is pre-implementation.
- The Writing section is hardcoded now and will go stale when you publish on
  shauna.digital. See `README.md`.
