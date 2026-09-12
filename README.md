# Chase Morrin's Awesome Music App

Ear training and music theory exercises, built with React + Vite.

## Running it locally

You'll need [Node.js](https://nodejs.org) installed (v18+).

```bash
npm install
npm run dev
```

This opens the app at `http://localhost:5173`. Changes to the code reload
instantly in the browser.

## Adding chord audio for "Sing Tetrachord in Harmony"

Drop your 2-second chord recordings into:

```
src/assets/audio/tetrachords/
```

Any `.mp3`, `.wav`, `.m4a`, or `.ogg` file placed there is picked up
automatically — no code edits needed. Rebuild (or just refresh in `npm run
dev`) and they'll show up in the random-chord pool.

## Setting up the Claves page (JSONBin access key)

The Claves page reads your metronome presets from JSONBin.io. It needs a
**read-only** access key — never the account's master key — set via an
environment variable so it never ends up committed to the repo.

1. On jsonbin.io, generate an **access key** scoped to read-only (ideally
   limited to just the Claves bin), not a master key.
2. Copy `.env.example` to `.env` and paste the key in:
   ```
   VITE_JSONBIN_ACCESS_KEY=your-key-here
   ```
   **If the key itself contains dollar signs** (bcrypt-style keys look
   like `$2a$10$...`), escape each one as `\$`, e.g.
   `\$2a\$10\$restOfKey` — otherwise a `.env`-parsing quirk (variable
   expansion) will silently mangle the value and every request will
   fail with an auth error that's confusing to track down.
3. For the deployed site, add the same value as a GitHub Actions
   secret: repo **Settings → Secrets and variables → Actions → New
   repository secret**, named `VITE_JSONBIN_ACCESS_KEY`. The included
   workflow already passes it through at build time.

Worth understanding: even with a "read-only" key, anyone who opens
their browser's dev tools on the deployed site can see this key in the
JS bundle — that's unavoidable for a site with no backend server. A
read-only key only being *able* to read is what keeps that acceptable;
never use the master key here.

## Adding a new exercise page

1. Add a component in `src/pages/YourExercise.jsx`.
2. Add an entry to `src/data/exercises.js` (slug, title, tagline, and a
   pad color — one of `pink | blue | yellow | teal | violet | coral`).
   This automatically adds a pad to the home page.
3. Add a matching `<Route>` in `src/App.jsx` pointing the slug's path to
   your new component.

## Deploying to GitHub Pages

This repo includes a GitHub Actions workflow
(`.github/workflows/deploy.yml`) that builds and publishes the site
automatically every time you push to `main`.

1. Push this project to a new GitHub repository.
2. In the repo's **Settings → Pages**, set **Source** to **GitHub
   Actions**.
3. Push to `main` — the site will build and go live at
   `https://<your-username>.github.io/<repo-name>/`.

### Why the URLs look like `.../#/brighter-or-darker`

The app uses a "hash router," so each page gets its own address (e.g.
`#/sing-tetrachord-in-harmony`) that you can bookmark or share, and the
browser's back/forward buttons work correctly. This style needs zero
server configuration, which matters because GitHub Pages only serves
static files — a plain path-based URL like `/brighter-or-darker` (no
`#`) would 404 on refresh unless you add extra redirect files. If you'd
rather have clean URLs without the `#`, swap `HashRouter` for
`BrowserRouter` in `src/App.jsx` and add a `404.html` that redirects
back to `index.html` (a well-documented GitHub Pages pattern) — just
know it's an extra moving part.

## Manual build (without GitHub Actions)

```bash
npm run build
```

The finished site is output to `dist/`. You can also publish it to the
`gh-pages` branch directly with:

```bash
npm run deploy
```
