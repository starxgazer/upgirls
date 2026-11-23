# AGENTS.md

Notes for AI agents (and humans) working on this repo. See `README.md` for the file layout and data fields.

## What this is

Unofficial fan site for UPgirls. A plain static site (HTML, CSS, vanilla JS) on GitHub Pages. **No build step, no framework, no Node/Tailwind. Keep it that way.**

## Updating event data (`shows.json`)

This is the most common task. Events come from the group's X account (`@theupgirls`) and from poster images attached to its tweets.

- Dates, times, and places usually live **in the poster image, not the tweet text**. Open the image. Never guess a date.
- If a poster does not say the time or place, write `TBA`. Do not invent it.
- `date` is `YYYY-MM-DD`. `time` is read as **WIB**: use `HH:MM` or `HH:MM-HH:MM` so the countdown and the `.ics` file are correct.
- Check the weekday on the poster matches the date.
- `id` must be unique: use the current max `id` + 1.
- Tweet links are shortened (`t.co`) and truncated in the page text. Resolve them with `curl -s -o /dev/null -w '%{redirect_url}' https://t.co/XXXX` to get the full `forms.gle` URL.
- Many Google Forms need a login, so their descriptions cannot be read. Use the poster instead.
- One entry per event day. A multi-day Q-Time is one entry on its first day, with the range in `description`.
- Tweets go in `x_tweets_updated.json` (newest first, real `https://x.com/theupgirls/status/<id>` URLs).

## Checks before committing

```bash
python3 -c "import json;json.load(open('shows.json',encoding='utf-8'))"   # data files must stay valid JSON
node --check script.js
python3 generate_sitemap.py        # only after adding members or songs
```

To preview locally (the site uses `fetch`, so `file://` does not work):

```bash
python3 -m http.server 8000
```

After changing CSS or JS, hard-refresh (`Ctrl+Shift+R`); browsers cache them aggressively.

## Code conventions

- All rendering of data files goes through `esc()` / `safeUrl()` in `script.js`. Never put raw JSON values into `innerHTML`.
- Keep the nav, footer, and `<head>` meta the same across the five HTML pages when you change one.
- The home header is `position: fixed` with its full-size height reserved on `<body>` by `reserveHeaderSpace()`. Do not make it change layout height again, or it will flicker near the top.
- Dark mode is `html[data-theme="dark"]` with overrides at the end of `styles.css`. When adding a component with hard-coded colors, add a dark override.

## Git

- Work on `master`; commits go straight to it and Pages deploys from it.
- Use the same author as the existing commits (`git log -1`). Set it with `git config --local user.name/user.email`, **never `--global`**.
- Push over SSH (`git@github.com:starxgazer/upgirls.git`).
- Do not commit `.claude/` (local preview config).
