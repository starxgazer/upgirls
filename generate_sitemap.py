#!/usr/bin/env python3
"""Regenerate sitemap.xml from members.json and discography.json.

Run after adding members or songs:  python3 generate_sitemap.py
"""
import json
from datetime import date
from urllib.parse import quote
from xml.sax.saxutils import escape

BASE = "https://starxgazer.github.io/upgirls/"
today = date.today().isoformat()

with open("members.json", encoding="utf-8") as f:
    members = json.load(f)
with open("discography.json", encoding="utf-8-sig") as f:
    songs = json.load(f)

urls = [("", "1.0"), ("all-members.html", "0.8"), ("all-events.html", "0.8")]
urls += [(f"member.html?name={quote(m['name'])}", "0.5") for m in members]
urls += [(f"song.html?id={quote(str(s['id']))}", "0.5") for s in songs]

lines = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for path, priority in urls:
    lines.append(f"  <url><loc>{escape(BASE + path)}</loc><lastmod>{today}</lastmod><priority>{priority}</priority></url>")
lines.append("</urlset>")

with open("sitemap.xml", "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
print(f"sitemap.xml: {len(urls)} urls")
