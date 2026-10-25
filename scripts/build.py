#!/usr/bin/env python3
"""Render committed Astro templates with current user data. No Node needed for content updates."""
import json
from pathlib import Path
from content_render import render
ROOT=Path(__file__).resolve().parents[1]
def read(name):
    return json.loads((ROOT/name).read_text().split(' = ',1)[1].strip().rstrip(';'))
def build():
    output=render(read('content-data.js'),read('content-templates.js'),read('gallery-data.js'))
    for path,html in output.items():
        (ROOT/path).parent.mkdir(exist_ok=True)
        (ROOT/path).write_text(html)
    (ROOT/'robots.txt').write_text('User-agent: *\nAllow: /\n')
    print(f'Generated {len(output)-1} bilingual pages using Astro templates, preserving current user content.')
if __name__=='__main__':build()
