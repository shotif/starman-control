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
npm run check   # typecheck, unit tests, production build
```
