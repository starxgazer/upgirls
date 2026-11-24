#!/usr/bin/env python3
"""Add one event to shows.json.

Example:
  python3 tools/add_event.py --date 2026-12-06 --name "Minishow" \
      --type "Minishow" --time "15:00 WIB" --location "Ice Palace 4F" \
      --link https://t.co/XXXX

Read the date/time/place from the poster yourself. Anything the poster does not
say stays "TBA" (the default). Use --dry-run to preview without saving.
"""
import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SHOWS = ROOT / "shows.json"
WEEKDAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
TIME_RE = re.compile(r"^(TBA|\d{2}:\d{2}(-\d{2}:\d{2})?( WIB)?)$")


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


def resolve_link(url):
    """Resolve a t.co short link to its real URL (one hop, no body download)."""
    if not re.match(r"^https?://t\.co/\w+$", url):
        return url
    opener = urllib.request.build_opener(_NoRedirect)
    try:
        opener.open(urllib.request.Request(url, headers={"User-Agent": "curl/8"}), timeout=10)
    except urllib.error.HTTPError as e:
        loc = e.headers.get("Location")
        if loc:
            return loc
    except OSError as e:
        sys.exit(f"Could not resolve {url}: {e}")
    sys.exit(f"Could not resolve {url} (no redirect). Paste the full forms.gle link instead.")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--date", required=True, help="YYYY-MM-DD")
    p.add_argument("--name", required=True)
    p.add_argument("--type", default="Event", help='e.g. "Event: Cafe Date", "Minishow"')
    p.add_argument("--time", default="TBA", help='"HH:MM WIB" or "HH:MM-HH:MM WIB"')
    p.add_argument("--location", default="TBA")
    p.add_argument("--link", default="", help="forms.gle link or t.co short link")
    p.add_argument("--description", default="")
    p.add_argument("--event-type", default="performance", choices=["performance", "audition"])
    p.add_argument("--source", default="Poster resmi @theupgirls")
    p.add_argument("--dry-run", action="store_true")
    a = p.parse_args()

    try:
        d = date.fromisoformat(a.date)
    except ValueError:
        sys.exit(f"Invalid date '{a.date}'. Use YYYY-MM-DD.")
    if not TIME_RE.match(a.time):
        print(f"Warning: time '{a.time}' is not HH:MM[-HH:MM] [WIB]; the countdown/.ics will ignore it.")

    link = resolve_link(a.link) if a.link else ""
    shows = json.loads(SHOWS.read_text(encoding="utf-8"))

    for s in shows:
        if s.get("date") == a.date and s.get("name", "").strip().lower() == a.name.strip().lower():
            sys.exit(f"Duplicate: id {s['id']} already has this name on {a.date}.")
        if link and s.get("ticket_link") == link and s.get("date") == a.date:
            sys.exit(f"Duplicate: id {s['id']} already uses this link on {a.date}.")

    event = {
        "id": max(s["id"] for s in shows) + 1,
        "date": a.date,
        "name": a.name,
        "event_type": a.event_type,
        "type": a.type,
        "ticket_link": link,
        "time": a.time,
        "location": a.location,
    }
    if a.description:
        event["description"] = a.description
    event["source"] = a.source

    # Keep the file newest-first: insert before the first entry with an older date.
    pos = len(shows)
    for i, s in enumerate(shows):
        if re.match(r"^\d{4}-\d{2}-\d{2}$", s.get("date", "")) and s["date"] < a.date:
            pos = i
            break

    print(f"{a.date} is a {WEEKDAYS[d.weekday()]}. Check this against the poster.")
    print(json.dumps(event, ensure_ascii=False, indent=2))
    if a.dry_run:
        print("(dry run, nothing saved)")
        return
    shows.insert(pos, event)
    SHOWS.write_text(json.dumps(shows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved as id {event['id']} (position {pos + 1} of {len(shows)}).")
    print("Next: python3 tools/check_data.py")


if __name__ == "__main__":
    main()
