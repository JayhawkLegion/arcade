# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this is

Ten browser arcade games — Rally, Astro Smash, Snake, Drift, Battery, Hopper, Invaders,
Blocks, Lander and Sortie — living in a single self-contained `index.html`. No build system, no
package manager, no dependencies.
The only network fetch is a Google Fonts stylesheet, and the page is designed to work without it.

## The one rule

**`index.html` is canonical.** Everything else is generated or supporting.

Never hand-edit `dist/artifact.html`. It is produced by `tools/build-artifact.py`, and the
build fails loudly if it ever drifts.

## The two copies

`index.html` is a complete standalone document, so it works from GitHub Pages or any static
host. A copy is also published as a Claude Artifact, and that host supplies its own
`<!doctype>`, `<head>` and base reset — give it a second `<head>` and you get a nested document.

Everything only meaningful when self-hosted (charset, viewport, theme-color, manifest link,
icons, service-worker registration) is fenced inside `<!-- self-hosted:start -->` …
`<!-- self-hosted:end -->` in the `<head>`. The build strips exactly that block.

```
python tools/build-artifact.py           # -> dist/artifact.html
python tools/build-artifact.py --check   # fails if dist/ is stale
```

The build also fails if `serviceWorker`, `manifest.webmanifest` or `apple-touch-icon` leak
into the artifact copy, where they would 404. If you add self-hosted-only wiring, put it
inside the markers.

**Flow:** edit `index.html` → rebuild → publish `dist/artifact.html`. Never the reverse.

Always rebuild (it is one command and keeps `--check` green). *Publishing* the artifact is
optional — GitHub Pages is the primary way this is played, and the artifact is a convenience
copy. Skip the publish unless asked for it.

## Working from a phone, with no PC involved

This repo is meant to be editable entirely from a cloud session. The owner does this.

- **Commit to `main`.** Pages is a legacy branch build on `main`, so a push publishes to
  https://jayhawklegion.github.io/arcade/ in about a minute with no workflow and no merge
  step. Don't park work on a branch unless asked — there is no reviewer, and a branch just
  means the change never goes live.
- **Still ask before committing.** The owner treats committing and deploying as separate,
  explicitly approved steps, even after a verified build.
- **A new game shows up on the second launch** of an installed PWA, because the service
  worker is stale-while-revalidate. That is correct behaviour, not a failed deploy.
- Verification is weaker without a desktop browser. Prefer the synchronous-pump technique
  below over screenshots, and say plainly what you could not check.

## Adding a game

Each game is an independent module. In `index.html` you need three things:

1. A `<section id="game-yourname" hidden>` holding its markup. Reuse the existing classes
   (`stage`, `hud`, `overlay`, `card`, `console`, `knobs`, `knob`, `foot`, `howto`) so it
   matches without new CSS. Prefix element ids — Rally uses bare ids; Astro `a`, Snake `s`,
   Drift `d`, Battery `m`, Hopper `f`, Invaders `i`, Blocks `b`, Lander `l`, Sortie `x`.
   Pick an unused letter.
2. A `<button class="gamecard" data-game="yourname">` in the menu, with an inline SVG preview.
3. A module that registers itself:

```js
ARCADE.register("yourname", {
  boot:     function (saved) { /* build state; the section is still hidden, so no sizing */ },
  snapshot: function ()      { return { cfg: cfg, rec: rec }; },
  mount:    function ()      { live = true;  sizeStage();
                               if (raf) cancelAnimationFrame(raf);
                               lastT = 0; raf = requestAnimationFrame(frame); },
  unmount:  function ()      { live = false;
                               if (raf) { cancelAnimationFrame(raf); raf = null; }
                               if (document.body.classList.contains("fit")) setFit(false); }
});
```

Rules the existing modules follow, which matter:

- **Gate every global listener on `live`.** `keydown`, `keyup`, `resize` and
  `visibilitychange` are all window/document level, so an unmounted game will otherwise
  steal keys from the mounted one.
- **Never size the canvas in `boot`.** The section is hidden, so `clientWidth` is 0 and you
  get a 0×0 canvas. Size in `mount`.
- **On `visibilitychange`, always cancel and reschedule** rather than testing `if (!raf)`.
  A frame scheduled while the page is hidden never runs but still leaves `raf` non-null, so
  an `if (!raf)` guard would refuse to ever restart the loop.

## Game-loop conventions

Every game uses a logical play field of `W = 100` by `H = 150` units, scaled to the canvas via
`ctx.setTransform`. All physics is in those units, so behaviour is identical on every screen.

Fast-moving objects **substep**: movement is split into slices of ~1.4 units so a ball or
bullet cannot tunnel through a paddle between frames.

## Deployment

Pushing to `main` publishes to https://jayhawklegion.github.io/arcade/ automatically — Pages
is configured as a legacy branch build, so there is no workflow file and none is needed.
A deploy takes roughly a minute.

The service worker is stale-while-revalidate, so an installed copy shows a change on the
**second** launch, not the first. That is expected; say so rather than chasing it.

Commits in this repo use `315279197+JayhawkLegion@users.noreply.github.com`, set as local
`user.email`. Leave it that way — the repo is public and the owner's real address is not.

## Testing a canvas game

The games run on `requestAnimationFrame`, which **does not fire in a hidden or zero-sized
browser pane**. If rocks never spawn and the score sits at 0, check `document.visibilityState`
and `canvas.width` before suspecting the game code.

The reliable technique is to replace rAF with a synchronous pump and drive the simulation
deterministically, which is immune to visibility and runs far faster than real time:

```js
let cb = null, t = 0;
window.requestAnimationFrame = f => { cb = f; return 1; };
window.cancelAnimationFrame  = () => { cb = null; };
function pump(n) { for (let i = 0; i < n; i++) { const f = cb; cb = null; if (!f) break;
                                                 t += 16.67; f(t); } }
```

Two traps when using it:

- **Re-mount after installing the pump** (`ARCADE.home(); ARCADE.open(id)`), or the frame the
  game already scheduled is held by the old rAF and nothing ever runs.
- **Drive the player with arrow keys, not synthetic pointer events.** `pointerX()` divides by
  `getBoundingClientRect().width`, which is 0 in a collapsed pane — that puts `NaN` into the
  player position, and `NaN` fails every comparison, so all collisions silently stop.

To reach a late wave quickly, build a throwaway copy with a smaller `WAVE_AT` rather than
playing for minutes. Keep the gate under test real.

Service workers cannot be registered in a sandboxed preview pane at all, so PWA behaviour has
to be checked in a real browser.
