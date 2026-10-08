# Rally &amp; Astro

Two small arcade games that run in a browser, built to be played with one thumb on a phone.

Everything lives in **one self-contained `index.html`** — no build step, no package manager,
no dependencies. The only thing fetched from the network is a Google Fonts stylesheet, and
the games play fine without it in fallback fonts.

## The games

A menu offers both; picking one hides the menu and shows a slim `← Games` bar.

### Rally

Paddle and ball with real gravity. Keep the ball off the floor, clear a board of coloured
bricks, and the next board starts with gravity 5 higher than the last.

- The ball is served from just below the lowest brick, dead centre, falling straight down —
  your first paddle hit sets the whole opening angle.
- Where you hit the paddle sets the rebound angle, so placement is the skill.
- Bounce is held at or above whatever it takes to reach the ceiling, so trapping the ball
  above the bricks stays possible at any gravity. It only ever changes at a board boundary.

Tunable: gravity, bounce, bricks per row, rows, hits per brick, paddle size.

### Astro Smash

A cannon on the bottom rail against falling rock.

- Rocks fall at an angle and leave through the sides. A large one splits into two mediums,
  a medium into two smalls. Points run backwards — large pays 5, small pays 25 — so the
  value is in the follow-up, not the first shot.
- Rocks that reach the floor cost nothing. Only the ones that hit you cost a life.
- **Spinners** (red diamonds) end the run outright if they touch the floor — lives don't
  save you. One that drifts off the side is harmless, so read the angle before spending shots.
- **Gunships** cross near the top from the first grey wave onward, firing rounds that pass
  straight through rock but can hit you. Worth 150, more than anything else on screen.
- The sky cycles black → green → blue → grey → orange, one colour per wave. Completing a
  full cycle earns a life, so the backdrop doubles as the bonus-life clock.

Tunable: fall speed, spawn rate, fire rate, lives, spinner frequency, bonus-life interval.

## Running it

Open `index.html` directly in a browser. That's it.

To play on a phone or tablet on the same network, serve the folder and hit the machine's
LAN address from the other device:

```
python -m http.server 8080 --bind 0.0.0.0
```

`--bind 0.0.0.0` matters: without it Python listens on localhost only and other devices get
nothing. Find the host's address with `ipconfig` (Windows) or `ipconfig getifaddr en0` (macOS),
then browse to `http://<that-address>:8080/`.

Any static host works too — GitHub Pages, Netlify, an S3 bucket — since there is no server side.

## Notes

- **High scores are per-origin.** Each device, and each URL you serve from, keeps its own
  records in `localStorage`. Nothing syncs between them.
- **Both games pause when the tab is hidden** and resume when it comes back.
- **Fit screen** hides the settings and sizes the board to the viewport. The play field keeps a
  fixed 2:3 shape so the physics are identical on every device, which does leave letterboxing
  on a tall phone.
- Reduced-motion preferences are respected: trails, particles and screen shake switch off.

## Installing it

`manifest.webmanifest` plus `sw.js` make this installable: add to home screen and it opens
fullscreen with no browser chrome, and plays with no network at all. The worker is
stale-while-revalidate, so the game opens from cache instantly and a change lands on the
*next* launch.

**It needs a secure context.** Browsers only allow service workers over HTTPS, or on
`localhost`. Served from a plain `http://192.168.x.x` LAN address the registration quietly
does nothing -- the game still runs perfectly, just with no offline support and no install
prompt. To actually install it, use any HTTPS static host (Netlify, Cloudflare Pages, GitHub
Pages) or `localhost` on the machine itself.

Bump `VERSION` in `sw.js` only when you want to force every client to drop its cache;
ordinary edits are picked up by revalidation.

Icons are generated and committed:

```
python tools/make-icons.py
```

## The published copy

`index.html` is canonical. A copy also lives as a Claude Artifact, which supplies its own
`<!doctype>`, `<head>` and base reset and expects page content on its own -- so it needs the
document shell stripped. That is a build step, never a hand edit:

```
python tools/build-artifact.py           # -> dist/artifact.html
python tools/build-artifact.py --check   # fails if dist/ is stale
```

`dist/artifact.html` is committed so the repo always records exactly what was published, and
`--check` catches the two drifting apart. Everything outside the `host-shell` markers in
`index.html` is copied byte for byte, so the only difference between the two files is the
shell the host provides.

Edit `index.html`, rebuild, publish `dist/artifact.html`. Never the other way round.

## Layout

```
index.html                 both games, the menu shell, and all styles
manifest.webmanifest       PWA metadata
sw.js                      offline cache; stale-while-revalidate
icons/                     generated app icons, including maskable
tools/make-icons.py        redraws icons/
tools/build-artifact.py    strips the self-hosted block for the Artifact host
dist/artifact.html         generated; the exact bytes last published
```

The two games are independent modules behind a small `ARCADE.register(id, {boot, mount,
unmount, snapshot})` contract. Only the mounted game runs a `requestAnimationFrame` loop or
responds to keys, so adding a third game means registering another module — nothing else
needs to change.
