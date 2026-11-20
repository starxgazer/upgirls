# UPgirls Fan Site

Unofficial fan site for **UPgirls**, an Indonesian girl group under Up Management (fandom: **UpTown**).
Member profiles, event schedule, and discography.

Live site: https://starxgazer.github.io/upgirls/

> This is a fan-made website. It is not affiliated with, authorized, maintained, sponsored, or endorsed by Up Management or UPgirls. All related names, logos, and materials belong to their respective owners.

## Tech

Plain static site: HTML, CSS, and vanilla JavaScript. No build step, no dependencies. Hosted on GitHub Pages.

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

## Data

All content lives in JSON files. Edit these to update the site.

- `members.json`: `name`, `full_name`, `position`, `batch`, `is_active`, `image`, `facts`, profile details, and social handles.
- `shows.json`: `id`, `date` (`YYYY-MM-DD` or `TBA`), `name`, `event_type` (`performance` or `audition`), `type`, `ticket_link`, `time`, `location`, optional `description`.
- `discography.json`: `id`, `title`, `artist`, `release_year`, `type`, streaming links, `lyrics`.
- `x_tweets_updated.json`: tweets crawled from the group's X account.

Notes:
- Keep each `id` unique in `shows.json` and `discography.json`.
- The home page only lists events that are not over yet. Past events appear on `all-events.html`.

## Run locally

The site uses `fetch`, so it cannot be opened via `file://`. Serve it instead:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Data sources

[KProfiles](https://kprofiles.com/upgirls-members-profile/), [IDN Times](https://www.idntimes.com/hype/entertainment/profil-member-upgirls-q9t02-00-6sxgf-fmvt4h), and the group's official social accounts.
