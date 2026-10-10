# Arcade

Ten small arcade games that run in a browser, built to be played with one thumb on a phone.

Everything lives in **one self-contained `index.html`** — no build step, no package manager,
no dependencies. The only thing fetched from the network is a Google Fonts stylesheet, and
the games play fine without it in fallback fonts.

## The games

A menu offers all ten, each card showing the shared top score and initials under its picture.
Picking a game, from its card or from the ☰ menu in the top-left corner, opens it **full screen**:
the board fills the screen under a slim bar holding the ☰ games menu, `← Games` and an
`Exit full screen` toggle that brings the settings back.

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

### Snake

Grid movement, swipe or arrow to turn, eat to grow. Reversing into your own neck is rejected
rather than fatal, and the cell your tail is vacating is legal to enter, so following your own
tail is safe. Every segment shortens the tick, so you build the difficulty curve yourself.

Tunable: speed, grid size, walls vs wrap.

### Drift

Free movement — the craft follows your finger anywhere on the field. Collect gold orbs,
avoid drifting hazards. Surviving scores on its own, so a cautious run still counts; chasing
gold pays far better and is how you get hit.

Tunable: hazard speed, hazard count, orb rate, lives.

### Battery

Missile defence. Tap the sky to detonate; every warhead you kill chains a smaller blast, so a
well-placed first shot can clear a whole volley. Warheads aim at bases that are still standing,
so pressure concentrates as you lose ground. Your only limit is how many blasts can be live at once.

Tunable: fall speed, blast radius, concurrent blasts, base count.

### Hopper

Cross the road, ride the river, fill the five bays at the top. A tap hops forward, a tap beside
the frog hops left or right, and every swipe is exactly one hop in its direction, so it plays
with a thumb.

- Five lanes of traffic, a safe verge, then five lanes of river where logs and turtles are the
  only floor. Whatever you ride carries you, and being carried off the edge counts as a fall.
- Diving turtles flash pink before they go under and take their passengers with them.
- Each new row pays 10; a bay pays 50 plus 10 for every second left on the timer. A fly in an
  empty bay is worth 200 more. All five bays clears the level for 500, and the next is 12% faster.

Tunable: traffic speed, timer, lives, diving turtles.

### Invaders

The marching formation. Drag to move the cannon, hold to fire.

- The block steps sideways, drops a row at each wall, and steps faster as it thins, so the last
  invader is the quickest thing on the screen.
- One shot in flight at a time by default, as in the original, so a miss costs time.
- Four bunkers erode under fire from both sides and are rebuilt every wave. The mystery ship
  pays 50 to 300. Letting the formation reach the ground ends the run outright.

Tunable: march speed, return fire, shots at once, bunkers, lives.

### Blocks

Falling pieces on a 10 by 20 well, with a seven-piece bag, hold, a ghost piece and standard
wall kicks.

- Drag sideways to slide and down to ease it lower; flick down to drop, flick up to hold. A tap
  on the right half turns it clockwise, on the left half anticlockwise.
- One to four lines pay 100, 300, 500 and 800 times the level. A level is ten lines.

Tunable: start level, preview length, ghost piece.

### Lander

Hold anywhere to burn; the craft leans toward your finger and rights itself when you let go.

- Land with both feet on a pad, falling slower than the legs can take, near upright and barely
  drifting. Telemetry under the score turns green inside every limit.
- Pads pay 50 times their multiplier (x2, x3, x5 — the narrower, the better), doubled for a
  perfect touchdown. A landing refunds fuel and a crash costs 150. The run ends when the tank
  is dry. The field wraps at the sides.

Tunable: gravity, fuel, leg strength, arrival drift.

### Sortie

A side-scrolling cave run. The landscape slides left; you fly forward, back, up and down
between the ceiling and the floor while squadrons fly at you from the right.

- Drag anywhere and the ship moves as far as your finger does (relative drag), so your thumb
  never covers it. Holding fires.
- Rock, an enemy or an enemy shot each cost a ship; you start with three. A new ship blinks for
  two seconds, safe from enemies but not from the walls.
- Enemies ride the cave as a fraction of its height, so a squadron follows the walls. Darts,
  weavers, then divers (wave 2) that home on you and two-hit gunners (wave 3) that shoot back.
- Kills pay 100 to 250, a whole squadron 300 more, a cleared wave 250 times its number. Each wave
  scrolls a little faster with a narrower cave. Another ship every 20,000.

Tunable: scroll speed, cave height, squadrons per wave, enemy speed, fire rate, return fire, ships.

## High scores

A screen off the menu shows the **shared top 5** for every game, from every device, each entry
with three initials, the score, a detail (wave, lines, level…) and the date and time in US
Central. Under each game it also shows your best on this device, read from the game's own
`localStorage` record so it can never disagree with the in-game HUD.

- **Only default settings count.** A run can enter only if it started on every game's default
  settings and none of its settings were touched before it ended — moving a slider and putting
  it back still disqualifies that run. A top-5 run on custom settings gets a note saying so.
- **Initials.** A qualifying score opens a three-letter initials box at game over. The last
  initials used on the device are pre-filled. Skip leaves the board alone.
- **Where it lives.** The site is static, so the board is a Google Sheet behind a small Apps
  Script web app, `tools/leaderboard.gs`. The sheet *is* the board: it only ever holds each
  game's top five, the script stamps entries in Central time, and you can fix or delete any row
  there directly. Nothing can prove a score was really earned, so the sheet is where to tidy up.
- **Switching it on.** Paste the web app's `/exec` URL into `ARCADE_LEADERBOARD_URL` in the
  self-hosted block of `index.html`. Empty means off, and the screen falls back to this device's
  bests. The Artifact copy never has it (the build strips that block), and the service worker
  never caches it, so the board is always live.
- Resetting clears this device's bests and play counts (two taps); it cannot touch the sheet.

### Setting up the sheet

1. Create a Google Sheet (any name). **Extensions → Apps Script**.
2. Replace the editor's contents with `tools/leaderboard.gs` and save.
3. **Deploy → New deployment**, type **Web app**, execute as **Me**, access **Anyone**. Authorise it.
4. Copy the URL ending in `/exec` into `ARCADE_LEADERBOARD_URL`, rebuild, push.

The script creates a **Leaderboard** tab on the first score. After changing the script later,
use **Deploy → Manage deployments → Edit → New version** so the same URL keeps working.

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
- **Every game pauses when the tab is hidden** and resumes when it comes back.
- **Full screen** (the fit mode) is how every game opens: it hides the settings and sizes the board to the viewport. The play field keeps a
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
index.html                 every game, the menu shell, and all styles
manifest.webmanifest       PWA metadata
sw.js                      offline cache; stale-while-revalidate
icons/                     generated app icons, including maskable
tools/make-icons.py        redraws icons/
tools/build-artifact.py    strips the self-hosted block for the Artifact host
tools/leaderboard.gs       the shared top-5 board: Apps Script for a Google Sheet
dist/artifact.html         generated; the exact bytes last published
```

The games are independent modules behind a small `ARCADE.register(id, {boot, mount,
unmount, snapshot, standard})` contract, plus `ARCADE.begin(id)` when a run starts and
`ARCADE.note(id, score, detail)` when it ends. Only the mounted game runs a `requestAnimationFrame` loop or
responds to keys, so adding a game means registering another module — nothing else
needs to change.
