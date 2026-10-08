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

## Layout

```
index.html    both games, the menu shell, and all styles
```

The two games are independent modules behind a small `ARCADE.register(id, {boot, mount,
unmount, snapshot})` contract. Only the mounted game runs a `requestAnimationFrame` loop or
responds to keys, so adding a third game means registering another module — nothing else
needs to change.
