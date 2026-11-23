# UPgirls Fan Site

Unofficial fan site for **UPgirls**, an Indonesian girl group under Up Management (fandom: **UpTown**).
Member profiles, event schedule, and discography.

Live site: https://starxgazer.github.io/upgirls/

> This is a fan-made website. It is not affiliated with, authorized, maintained, sponsored, or endorsed by Up Management or UPgirls. All related names, logos, and materials belong to their respective owners.

## Tech

Plain static site: HTML, CSS, and vanilla JavaScript. No build step, no dependencies. Hosted on GitHub Pages.

## Features

- Event list with a live countdown to the next event, plus per-event **Add to Calendar** (`.ics`)
- Event archive with search, year/month/status/type filters, and a clickable calendar
- Latest posts from the group's X account
- Member profiles, discography with lyrics, and a click-to-load Spotify / YouTube player on each song page, dark mode (follows the system, toggle in the header)

## Structure

| File | Purpose |
|---|---|
| `index.html` | Home: about, upcoming events, members, discography, social links |
| `all-members.html` | Member archive with search and filters |
| `all-events.html` | Event calendar and full event list |
| `member.html` | Member profile (`?name=`) |
| `song.html` | Song detail with lyrics (`?id=`) |
| `script.js` | All page logic; loads the JSON files below with `fetch` |
| `styles.css` | Styles |
| `images/` | Member photos and logo |
| `sitemap.xml`, `robots.txt` | SEO. Regenerate the sitemap with `python3 generate_sitemap.py` |

## Data

All content lives in JSON files. Edit these to update the site.

- `members.json`: `name`, `full_name`, `position`, `batch`, `is_active`, `image`, `facts`, profile details, and social handles.
- `shows.json`: `id`, `date` (`YYYY-MM-DD` or `TBA`), `name`, `event_type` (`performance` or `audition`), `type`, `ticket_link`, `time`, `location`, optional `description`.
- `discography.json`: `id`, `title`, `artist`, `release_year`, `type`, streaming links, `lyrics`.
- `x_tweets_updated.json`: tweets crawled from the group's X account.

Notes:
- Keep each `id` unique in `shows.json` and `discography.json`.
- The home page only lists events that are not over yet (or the 3 most recent if none). Everything else is on `all-events.html`.
- `time` is read as WIB (UTC+7). Use `HH:MM`, or `HH:MM-HH:MM` for a range, so the countdown and `.ics` file get the right time.
- Run `python3 generate_sitemap.py` after adding members or songs.

## Run locally

The site uses `fetch`, so it cannot be opened via `file://`. Serve it instead:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Data sources

[KProfiles](https://kprofiles.com/upgirls-members-profile/), [IDN Times](https://www.idntimes.com/hype/entertainment/profil-member-upgirls-q9t02-00-6sxgf-fmvt4h), and the group's official social accounts.
