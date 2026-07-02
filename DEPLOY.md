# Deploying to Cloudflare Pages

This is a static site with no build step (plain HTML/CSS/ES modules), which
makes it a one-screen setup on Cloudflare Pages via its GitHub integration.
Every push to `main` auto-deploys to production; every pull request gets its
own preview URL.

## 1. Connect the repo

1. Go to the [Cloudflare dashboard](https://dash.cloudflare.com) → **Workers & Pages**.
2. Click **Create** → **Pages** → **Connect to Git**.
3. Authorize the Cloudflare Pages GitHub App if you haven't already, then
   pick the `swamp2k/oddlysatisfying` repository.
   - You can grant access to just this repo (recommended) or all repos.

## 2. Build settings

On the "Set up builds and deployments" screen:

| Field | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | *(leave empty)* |
| Build output directory | `/` |
| Root directory | `/` |

There's nothing to build — `index.html` at the repo root loads
`style.css` and `js/main.js` directly, and the toy modules are plain ES
modules (`<script type="module">`), so the browser fetches them as-is.

Click **Save and Deploy**. The first deploy kicks off immediately and
finishes in well under a minute.

## 3. Your URL

Cloudflare gives you `oddlysatisfying-<hash>.pages.dev` immediately, plus
a stable `oddlysatisfying.pages.dev` alias once the production branch has
deployed. Find both under the project's **Deployments** tab.

## 4. Custom domain (optional)

If you have a domain on Cloudflare already:

1. Open the project → **Custom domains** → **Set up a custom domain**.
2. Enter the domain/subdomain (e.g. `oddlysatisfying.yourdomain.com`).
3. Cloudflare adds the DNS record automatically since the zone is already
   on your account — no manual CNAME needed.

If the domain is registered elsewhere, you'll add a CNAME pointing at
`oddlysatisfying.pages.dev` at your registrar instead.

## 5. Ongoing workflow

- **Push to `main`** → production deployment updates automatically.
- **Open a pull request** → Cloudflare comments on the PR with a unique
  preview URL for that branch, so you can review changes live before
  merging.
- No environment variables, secrets, or KV/D1 bindings are needed — this
  project is 100% static assets.

## Notes

- All sound is synthesized client-side (Web Audio API) — nothing to
  configure for audio.
- `localStorage` is used by the Perfect Circle toy to remember your best
  score; that's scoped per-domain, so it'll reset if you later move from
  the `.pages.dev` URL to a custom domain.
