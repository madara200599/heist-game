[![make.fun bounty](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/madara200599/heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/madara200599/heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

# Vaultbreak — a stealth heist game

One thief. Three floors of the Meridian Exchange. Guards with sweeping vision
cones, cameras, timed laser silk, and one alarm meter standing between you
and the getaway van.

**Play it:** `node serve.ts`, then open http://localhost:8080 — or serve the
`game/` folder with any static file server and open `game/index.html`.
No build step, no network: every file the game loads lives under `game/`.

## How to play

- **WASD / arrows** — move
- **Shift** — sneak: slow, and low cover (display cases, desks, plants) hides you
- **Ctrl / C** — sprint: fast, but marble is loud and nearby guards come to look
- **Space (hold)** — grab loot, lift the keycard
- **E** — EMP burst: cameras and lasers go dark for 6 s (2 charges per floor)
- **Q** — smoke bomb: a cloud that vision cannot cross (2 per floor)
- **Mouse click** — toss a coin: guards within earshot investigate the clink (3 per floor)
- **Esc / P** — pause

Being seen pours into the **ALARM meter**. Cross the hunt line and guards
search in earnest; fill it and the alarm trips — guards chase, and one touch
while hunted ends the night. Grab each floor's named treasure, then reach the
van. Side loot pays extra; finishing unseen pays a ghost bonus.

## The floors

1. **Gallery of Echoes** — the Star Sapphire, two guards, two cameras.
2. **The Laser Archive** — the Aurelian Crown behind blinking laser silk.
3. **The Meridian Vault** — lift the keycard from the office corner, open the
   vault door, and take the Heart of Meridian.

## Layout

- `main.ts` — the hand-in program: copies `game/` + `screenshots/` to the
  output directory and writes `dossier.json` via `vendor/makefun-game.ts`.
- `game/src/` — the game, one job per file: `levels.js` (floors), `vision.js`
  (sight lines and cones), `guards.js` (patrol AI), `cameras.js` (camera and
  laser timing), `alarm.js` (the meter), `world.js` (the simulation),
  `render.js` (all drawing), `input.js`, `audio.js` (synthesized sounds),
  `shots.js` (screenshot scenes), `main.js` (loop and screens).
- `screenshots/` — four real renders of the game, cover first.

Entered via referral code r7k9dyj1
