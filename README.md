# Syn Sanych — Path of Sani

An endless 2D platformer-slasher about a cat, meme monsters, friendly characters, weapons, runes and UniBuff.
Pure HTML + CSS + JavaScript (Canvas 2D), no build step and no dependencies.

**Play online:** <https://synsanych.nortov.win>

The game is in English by default, with a full Russian localization — switch languages with the **EN / RU** buttons on the menu or pause screen.

## Running locally

1. Run `start-game.bat` — it starts a local server and opens the game in your browser.
   You need **Node.js** (if it is missing, the script falls back to Python). Keep the console window open while you play — the server lives there. If the browser did not open, copy the link from the console.
2. Or start a server manually:

```bash
node server.js
# or
python -m http.server 8080
```

then open <http://localhost:8123> (or <http://localhost:8080>).

> Opening `index.html` by double-clicking no longer works: browsers block reading `data/game-data.json` over `file://`. In that case the game shows a **"DATA UNAVAILABLE"** screen with a hint to run `start-game.bat`.

## Game data

All editable data lives in a single file — **`data/game-data.json`**:

- `player` — health, run speed, jump, gravity, limits;
- `unibuff` — how much UniBuff gives;
- `runes` — "Red", "Delta", "Zetel" and their effects;
- `talents` — talents and their effects;
- `weapons` — every weapon;
- `monsters` — every monster: HP, damage, speed, size, colors, images;
- `friends` — friendly characters, their gifts, spawn threshold and rarity;
- `effects` — timed effects (Confidence, Frenzy): duration and multipliers;
- `spawning` — which monsters and weapons appear at which depth (`minPower` / `minDepth`). Veteran of All Greats is added to the pool with `minDepth: 1000`;
- `world` — chunk width, ground height, stat growth with depth, monster chase speed, heart healing, talent threshold, waves;
- `heroImage` — path to the hero photo.

Edit the JSON → reload the page. On a syntax error or a missing section the game shows an error screen.

Text fields are localized with `name` / `nameRu`, `description` / `descriptionRu`, `letter` / `letterRu`, `hint` / `hintRu` — English first, Russian in the `*Ru` keys.

## PC only

The game is designed for a keyboard and mouse. If you open it on a phone or tablet, an **"PC REQUIRED"** screen appears instead of the game, and the run is blocked.

## Controls

| Key | Action |
| --- | --- |
| `A` / `D` or `←` / `→` | move |
| `Space` / `W` / `↑` | jump (a second jump is allowed in the air) |
| `F` | attack |
| `E` | pick up a weapon or rune, talk to a friendly character |
| `Esc` / `P` | pause |
| `M` | sound on/off |
| `R` | restart (on the death or pause screen) |

## HUD stats

Always visible in the top-left corner:

- **DAMAGE** — damage of the current weapon with all bonuses;
- **ATTACK SPEED** — hits per second;
- **SPEED** — movement speed;
- **UNIBUFF** — number of buffs collected;
- **R / D / Z** — number of "Red", "Delta", "Zetel" runes.

Health, depth in meters, zone/danger, the kill counter and the current weapon are on screen too.

Active **effects** and permanent gifts are listed in a panel under UniBuff: name, icon, remaining seconds and a timer bar. Permanent gifts are marked **FOREVER** (НАВСЕГДА).

## Talents

At **50 kills** the game once offers a choice of one talent out of two random ones (there are only two in the JSON right now, so both are shown):

| Talent | Effect |
| --- | --- |
| **Bloodthirst** | Restore 5 HP when you kill a monster |
| **Power Flow** | Gain 10 UniBuffs every 10 kills |

- A talent is chosen **once per run**. After the pick, no second talent and no further offers appear.
- The reward is granted at the 50th kill; add more talents to the JSON and two of them will be offered at random.
- The chosen talent resets on death/restart.
- The threshold, the number of options and the talents themselves are configured in `data/game-data.json`.

## UniBuff

**Every killed monster drops a UniBuff** — a glowing multicolored star. It is picked up automatically: it flies toward the cat.

One UniBuff gives everything at once:

- +4% damage;
- +3% attack speed;
- +3% run speed;
- +2 max health (and heals for 2).

Armor has been removed from the game — survivability now comes from health, mobility and kill speed.

## Runes

Runes lie around the map and are picked up with `E`. Each one stacks until the end of the run:

| Rune | Letter | Effect |
| --- | --- | --- |
| **Red** | R | +7% movement speed each (overall cap ×2.5) |
| **Delta** | D | +12% attack speed each |
| **Zetel** | Z | double damage; every next one adds another +100% |

## Weapons

You start with a **Fist**. Weapons lie along the way — pick them up with `E`.
Taking a new weapon drops the old one on the ground, so you can take it back.

| Weapon | Feel | Damage | Reach |
| --- | --- | --- | --- |
| Fist | starting paws | 10 | 44 |
| Rusty Cleaver | found in a bush | 17 | 54 |
| Blade of Hope | light and ringing | 25 | 60 |
| Dagger | very fast, short | 13 | 46 |
| Frying Pan | dinner is served | 21 | 58 |
| Utsy's Katana | pink. very pink | 34 | 66 |
| Hunter's Spear | keeps monsters away | 27 | 104 |
| Reaper's Scythe | wide harvest sweeps | 40 | 94 |
| Ogros's Axe | heavy and angry | 48 | 72 |
| Sea Trident | straight from the deep | 56 | 98 |
| Hero's Sword | it glows. so it must work | 62 | 80 |
| Thunder Hammer | slow. very loud | 78 | 84 |

Weapon power grows with depth: items drop with levels (`+N`) that increase damage and reach. The deeper you go, the stronger the base weapon that can drop.

## The endless forest

- The world is generated procedurally in 1500 px chunks and never ends.
- The further the cat goes and the longer the run lasts, the higher the danger: monsters gain HP, damage and speed, and there are more of them.
- Every few seconds a wave of monsters arrives from the edge of the screen.
- You cannot simply run past monsters: while chasing they accelerate after the cat, get extra speed when they fall behind, and lunge during their wind-up to reach a running cat. Aggro is no longer dropped by distance, so outrunning them will not work.
- Monsters patrol, chase the cat, and jump onto platforms and across pits.
- There is no final boss: the goal is to get as far as possible. The record is saved in the browser.

## Monsters

From the `Reference/monsters` folder, names strictly by file:

**Early forest**

- **UtsyUfe** — fast and annoying;
- **Peshcheros** — a sturdy all-rounder;
- **Undefined** — very quick;
- **Glekozhmyshenko** — small and hyperactive;
- **Zhmykhzhmyshenko** — quick and scrappy;
- **American Petrults** — fast, hits from a distance;
- **American Chertov** — slightly heavier cousin;
- **Downitos** — balanced mid-tier;
- **Prostotup** — slow-ish brawler;
- **Bogdanplyas** — dancing into your face;
- **Garik** — solid all-rounder.

**Mid forest**

- **Utseplyastszhire** — heavier and hits harder;
- **Ebalokluv** — a big brawler;
- **Guitarabas** — heavy hitter;
- **Nunchik** — fast striker;
- **Karatist** — quick and painful;
- **Govorpizdy** — tanky talker;
- **Chimas** — sturdy and fast;
- **Sempelo** — heavy mid-tier;
- **Tuplozhmyshenko** — tough and annoying.

**Deep forest**

- **Ogros Narepos** — late-zone mini-tank;
- **Bogdanzir** — heavy brute;
- **Morbidor** — big and mean;
- **Tupoeblo** — slow, very tough;
- **Mamosanos** — late-zone tank;
- **Shevas** — the heaviest of the new arrivals;
- **Veteran of All Greats** — elite crowned tank that appears from **1000 m** deep.

## Friendly characters

Starting from **15 kills**, friendly characters begin to appear in the forest — **rarely**, about once every 1–2 minutes, and no more than one at a time. Walk up and press `E` to talk.

| Character | Gift |
| --- | --- |
| **Cat Healer** | Offers a choice of **+100 max health**, **+100 damage** or **+100 speed**. The gift is permanent for the rest of the run. |
| **Gleko** | Grants **Confidence** for **10 seconds**: doubles damage, attack speed and movement speed. |
| **Anton Gavnod** | Fully restores HP and grants **Frenzy** for **30 seconds**: doubles damage. |

- The healer's choice opens a three-card screen; press `Esc` to postpone and talk again later.
- Timed effects stack with each other and with runes/UniBuff.
- Active effects and permanent gifts are shown in the HUD panel under UniBuff, with timers.
- Friendly characters cannot be attacked and do not attack; they disappear after giving their gift.
- The spawn threshold and rarity are configured in `data/game-data.json` → `friends` (`minKills`, `firstDelayMin/Max`, `delayMin/Max`, `maxActive`).

## Code structure

The code is split into small modules. All game data is in JSON; the code is logic only.

```
index.html
css/style.css
data/game-data.json    ← monsters, weapons, friends, effects, runes, talents, balance
server.js              local server (needed to load the JSON)
start-game.bat         Windows launcher (Node → Python fallback)
js/
  core/
    config.js          base constants
    platform.js        PC / phone / tablet detection
    i18n.js            EN/RU localization layer
    data-loader.js     loads and applies game-data.json
    utils.js           math and shared drawing helpers
    input.js           keyboard
    audio.js           synthesized sounds
    assets.js          image loading
  data/
    weapons.js         accepts weapons from JSON + level math
    monsters.js        accepts monsters from JSON
    runes.js           accepts runes and UniBuff from JSON
    talents.js         accepts talents from JSON
  world/
    generator.js       procedural chunk generation
    world.js           world streaming and collisions
  entities/
    player.js          the cat and its stats
    monster.js         monster AI and physics
    friend.js          friendly characters and their gifts
    pickups.js         weapons, runes, UniBuff, hearts
    effects.js         particles and floating text
  render/
    background.js      sky, moon, parallax
    world.js           ground, platforms, decor
    hud.js             HUD and vignette
    weapon-art.js      vector weapon drawing
  game.js              run state, waves, talents
  main.js              JSON and asset loading, boot
```

Scripts are loaded with plain `<script>` tags in a strict order. The JSON is read via `fetch`, so the game needs a local server (started by `start-game.bat`). React was not needed: all graphics are Canvas, the interface is light DOM/CSS.

## Debug parameters

- `http://localhost:8123/index.html?play=1` — start a run immediately.
- `http://localhost:8123/index.html?play=1&x=12000` — start at 12000 px depth (25 px = 1 m).

## License

Free to use, modify and share.
