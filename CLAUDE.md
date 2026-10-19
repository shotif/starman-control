# Working agreement for Starman Control

Starman Control is a 4X strategy game (explore, expand, exploit, exterminate) in the universe of
[Starman Reborn](https://github.com/shotif/starman-reborn), inspired most by *Master of Orion 3*.
The project owner decides; Claude designs, documents, builds and tests.

## How we work

1. **Documentation first.** Every feature starts as a written design (in `docs/`) before any code.
   A design names its goals, what is out of scope, and the decisions it needs.
2. **Key decisions are the owner's.** Anything that shapes the game (scope, platform, rules,
   setting, tone, art, money) is raised as an open question in [docs/DECISIONS.md](docs/DECISIONS.md)
   with options and a recommendation, and is only built once the owner has answered. Record the
   answer, the date and the reason there. Small, reversible engineering choices can be made and
   noted without waiting.
3. **Ask for tools.** When something would be better with an external tool, service, asset or
   account (art generation, audio, hosting, a store page, real devices), ask the owner for it
   rather than working around its absence silently.
4. **Ship in increments.** Each milestone in [docs/SCOPE.md](docs/SCOPE.md) is split into
   increments that keep the game playable, pass CI and deploy to GitHub Pages from `main`.
5. **Tests with every rule.** Simulation rules get unit tests; player journeys get browser tests
   once the game has screens. `npm run check` must pass before a push.

## Standing requirements from the owner

- **Phone and desktop, both first-class** (D-04). The whole game must be completely playable on a
  phone, as Starman Reborn is, and the desktop must have a dedicated experience of its own. Design
  every screen for both layouts before building it, and test it at phone, tablet and desktop sizes.
- **Several playable factions** (D-08). The three human powers first; alien species later. No
  rule, screen or piece of code may assume the player is human or is one particular faction.
- **API keys never reach the game or the repository** (D-09). Generated art is made by build-time
  scripts and committed with its provenance ([docs/ART_PIPELINE.md](docs/ART_PIPELINE.md)).

## Stack (D-22)

TypeScript, Vite, Vitest and Playwright; **Preact + Signals** for every screen (JSX via
`jsxImportSource: preact`, never React); three.js for the map; the simulation is pure TypeScript
in a Web Worker using whole-number arithmetic; Biome for linting and formatting. See
[docs/research/TECH_STACK.md](docs/research/TECH_STACK.md).

## Writing style (shared with Starman Reborn)

- British English (*colonise*, *neighbourhood*, *labelled*), plain words, short sentences.
- Real astronomy is real; everything invented is **labelled as fiction** in the game and the docs.
  Never present an invented planet, species or event as an observed fact.
- No names, text, art, music or data from *Master of Orion* or any other game. Inspiration is
  about mechanics only; every species, faction, technology and story is original.

## Commands

```bash
npm ci          # install the locked dependencies (Node 22.18+)
npm run dev     # dev server at http://localhost:5173
npm run check   # typecheck, lint (Biome), art records, unit tests, production build
npm run format  # apply Biome's formatting and safe fixes
```
