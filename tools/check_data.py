#!/usr/bin/env python3
"""Sanity-check the site's data and pages. Run before committing:

  python3 tools/check_data.py

Exit code 1 if any error is found. Warnings do not fail the run.
"""
import json
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
errors, warnings = [], []
err = errors.append
warn = warnings.append


def load(name, enc="utf-8"):
    try:
        return json.loads((ROOT / name).read_text(encoding=enc))
    except FileNotFoundError:
        err(f"{name}: missing")
    except json.JSONDecodeError as e:
        err(f"{name}: invalid JSON ({e})")
    return None


def check_shows():
    shows = load("shows.json")
    if shows is None:
        return
    seen = {}
    time_ok = re.compile(r"^(TBA|\d{2}:\d{2}(-\d{2}:\d{2})?( WIB)?)")
    for s in shows:
        sid = s.get("id")
        label = f"shows.json id {sid} ({s.get('name', '?')})"
        for k in ("id", "date", "name", "event_type", "type", "ticket_link", "time", "location"):
            if k not in s:
                err(f"{label}: missing '{k}'")
        if sid in seen:
            err(f"{label}: duplicate id (also '{seen[sid]}')")
        seen[sid] = s.get("name")
        d = s.get("date", "")
        if d != "TBA":
            try:
                date.fromisoformat(d)
                if not re.match(r"^\d{4}-\d{2}-\d{2}$", d):
                    raise ValueError
            except ValueError:
                err(f"{label}: bad date '{d}'")
        if s.get("event_type") not in ("performance", "audition"):
            err(f"{label}: event_type '{s.get('event_type')}'")
        link = s.get("ticket_link", "")
        if link and not link.startswith("https://"):
            warn(f"{label}: ticket_link is not https ('{link}')")
        if "t.co/" in link:
            err(f"{label}: unresolved t.co link")
        # Only upcoming events matter for the countdown/.ics; old ones are history.
        if d >= date.today().isoformat() and not time_ok.match(s.get("time", "")):
            warn(f"{label}: free-text time '{s.get('time')}' (no countdown/.ics)")
    ids = sorted(i for i in seen if isinstance(i, int))
    print(f"shows.json: {len(shows)} events, max id {ids[-1] if ids else '-'}")


def check_tweets():
    tw = load("x_tweets_updated.json")
    if tw is None:
        return
    urls = set()
    for t in tw:
        u = t.get("url", "")
        if not re.match(r"^https://x\.com/theupgirls/status/\d+$", u):
            warn(f"x_tweets_updated.json: not a real status url '{u}'")
            continue
        if u in urls:
            err(f"x_tweets_updated.json: duplicate {u}")
        urls.add(u)
    print(f"x_tweets_updated.json: {len(tw)} tweets")


def check_members_songs():
    members = load("members.json")
    songs = load("discography.json", "utf-8-sig")
    if members:
        for m in members:
            img = m.get("image")
            if img and not (ROOT / img).is_file():
                err(f"members.json: {m.get('name')} image '{img}' not found")
        print(f"members.json: {len(members)} members")
    if songs:
        ids = [s.get("id") for s in songs]
        if len(ids) != len(set(ids)):
            err("discography.json: duplicate ids")
        print(f"discography.json: {len(songs)} songs")
    return members, songs


def check_sitemap(members, songs):
    if not (members and songs):
        return
    want = {"", "all-members.html", "all-events.html"}
    want |= {f"member.html?name={quote(m['name'])}" for m in members}
    want |= {f"song.html?id={quote(str(s['id']))}" for s in songs}
    p = ROOT / "sitemap.xml"
    if not p.is_file():
        err("sitemap.xml: missing")
        return
    have = {u.replace("https://starxgazer.github.io/upgirls/", "")
            for u in re.findall(r"<loc>([^<]+)</loc>", p.read_text(encoding="utf-8"))}
    have = {h.replace("&amp;", "&") for h in have}
    if want != have:
        err("sitemap.xml is out of date. Run: python3 generate_sitemap.py "
            f"(missing {len(want - have)}, extra {len(have - want)})")


PAGES = ["index.html", "all-events.html", "all-members.html", "member.html", "song.html"]


def block(html, tag):
    m = re.search(rf"<{tag}\b.*?</{tag}>", html, re.S)
    return re.sub(r"\s+", " ", m.group(0)) if m else None


def nav_labels(html):
    nav = block(html, "nav") or ""
    return re.findall(r">([^<>]+)</a>", nav)


def check_pages():
    htmls = {}
    for pg in PAGES:
        try:
            htmls[pg] = (ROOT / pg).read_text(encoding="utf-8")
        except FileNotFoundError:
            err(f"{pg}: missing")
    if not htmls:
        return
    ref = "index.html"
    for pg, h in htmls.items():
        if pg == ref:
            continue
        if nav_labels(h) != nav_labels(htmls[ref]):
            err(f"{pg}: nav labels differ from {ref}: {nav_labels(h)} vs {nav_labels(htmls[ref])}")
        if block(h, "footer") != block(htmls[ref], "footer"):
            err(f"{pg}: footer differs from {ref}")
    for pg, h in htmls.items():
        for need in ("<title>", 'name="description"', 'rel="canonical"'):
            if need not in h:
                warn(f"{pg}: missing {need}")
        if 'class="scrolled' in h or "header class=\"scrolled" in h:
            err(f"{pg}: header must not use a scrolled class")
    print(f"pages: nav and footer compared across {len(htmls)} files")


def main():
    check_shows()
    check_tweets()
    members, songs = check_members_songs()
    check_sitemap(members, songs)
    check_pages()
    for w in warnings:
        print("WARN ", w)
    for e in errors:
        print("ERROR", e)
    print(f"\n{len(errors)} error(s), {len(warnings)} warning(s)")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
