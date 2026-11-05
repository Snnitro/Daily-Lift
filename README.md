# Daily Lift

A small offline fitness app (PWA) with her weekly plan built in.

## Put it online (free, ~5 minutes) — Netlify
1. Go to https://app.netlify.com/drop
2. Drag this whole folder (unzipped) onto the page.
3. You get a link like `https://something.netlify.app`. Rename it in Site settings if you like.

(GitHub Pages works too: push these files to a repo, then Settings → Pages → deploy from `main`.)

## Install on her Samsung
1. Open the link in **Chrome** or **Samsung Internet**.
2. Menu (⋮ or ≡) → **Add to Home screen** / **Install app**.
3. It opens full-screen and works offline at the gym.

## Change the workouts
- Edit `workouts.js` (days, exercises, sets, reps, guidelines, learning phase length).
- In `sw.js`, bump `CACHE_VERSION` (e.g. `dailylift-v2`).
- Re-upload the folder. Her phone picks it up the next time she opens the app online.

## Good to know
- Progress is stored on her phone only. Uninstalling the app or clearing Chrome's site data erases it.
- The 2-week learning phase starts the first day she opens it. She can change the date under Guide → Settings.
- Rest days never break her streak; only a missed workout day does.
