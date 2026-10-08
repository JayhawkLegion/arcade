#!/usr/bin/env python3
"""Produce the Artifact-flavoured copy of the game from the canonical index.html.

index.html is a complete standalone document so it works from any static host.
The Claude Artifact platform supplies its own <!doctype>, <head> and base reset
and expects the page content on its own -- give it a second <head> and you get a
nested document. This strips the parts the host provides and leaves the rest
byte-for-byte, so the two copies can never drift apart by hand.

    python tools/build-artifact.py            -> dist/artifact.html
    python tools/build-artifact.py --check     verify only, write nothing
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "index.html")
OUT = os.path.join(ROOT, "dist", "artifact.html")

SHELL = re.compile(r"<!-- self-hosted:start.*?self-hosted:end -->\s*", re.S)


def build(src_text):
    head = src_text.split("<head>", 1)[1].split("</head>", 1)[0]
    body = src_text.split("<body>", 1)[1].rsplit("</body>", 1)[0]

    head, n = SHELL.subn("", head)
    if n != 1:
        sys.exit("expected exactly one self-hosted block, found %d" % n)

    out = head.strip() + "\n\n" + body.strip() + "\n"

    for tag in ("<!doctype", "<html", "</html>", "<head>", "</head>", "<body>", "</body>"):
        if tag in out.lower():
            sys.exit("document tag %r survived into the artifact copy" % tag)
    # self-hosted-only wiring must not reach the host, where it would 404
    for leak in ("serviceWorker", "manifest.webmanifest", "apple-touch-icon"):
        if leak in out:
            sys.exit("self-hosted-only %r survived into the artifact copy" % leak)
    if "<title>" not in out:
        sys.exit("the artifact copy lost its <title>")
    return out


def main():
    src = io.open(SRC, encoding="utf-8").read()
    out = build(src)

    if "--check" in sys.argv:
        if not os.path.exists(OUT):
            sys.exit("dist/artifact.html missing - run without --check")
        if io.open(OUT, encoding="utf-8").read() != out:
            sys.exit("dist/artifact.html is stale - rebuild it")
        print("artifact copy is up to date (%d bytes)" % len(out))
        return

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    io.open(OUT, "w", encoding="utf-8", newline="\n").write(out)
    print("wrote %s (%d bytes, from %d)" % (
        os.path.relpath(OUT, ROOT).replace("\\", "/"), len(out), len(src)))


if __name__ == "__main__":
    main()
