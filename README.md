# Starman Control

A 4X strategy game of exploration, colonies and first contact among **real nearby stars**, set in
the universe of [Starman Reborn](https://github.com/shotif/starman-reborn). Where Starman Reborn
puts you in the cockpit of one ship, Starman Control puts you in charge of a civilisation: chart
the neighbourhood, settle its real planets, build up your worlds, manage resources and fleets,
negotiate with the other powers — human and not — and find out who left the artefacts out among
the stars.

The design takes its lead from *Master of Orion 3* (2003): an empire large enough to feel imperial,
planets that are developed rather than micromanaged, a council of powers, and a hunt for the relics
of a vanished species. It also learns from what that game got wrong. No names, text, art or data
from *Master of Orion* are used; see [docs/research/MASTER_OF_ORION_3.md](docs/research/MASTER_OF_ORION_3.md).

It is made to be **completely playable on a phone**, as Starman Reborn is, **with a dedicated
desktop experience**. Several factions are playable: the three human powers first, the alien
species later.

**Status: in design.** No game yet. The live site, <https://shotif.github.io/starman-control/>,
shows a placeholder title until the first playable build.

## Design documents

| Document | What it holds |
| --- | --- |
| [docs/VISION.md](docs/VISION.md) | The pitch, the design pillars, and what we take from and fix in *Master of Orion 3* |
| [docs/SCOPE.md](docs/SCOPE.md) | Draft scope of work: every feature area, what is in 1.0 and what is later, milestones |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Key decisions: the open questions, the options, a recommendation, and the owner's answers |
| [docs/design/M1_FIRST_LIGHT.md](docs/design/M1_FIRST_LIGHT.md) | The detailed design of the first playable milestone |
| [docs/ART_PIPELINE.md](docs/ART_PIPELINE.md) | How portraits and illustrations are made with Google Gemini, reviewed and recorded |
| [docs/research/MASTER_OF_ORION_3.md](docs/research/MASTER_OF_ORION_3.md) | How *Master of Orion 3* works, what worked, what failed, lessons |
| [docs/research/STARMAN_REBORN_UNIVERSE.md](docs/research/STARMAN_REBORN_UNIVERSE.md) | What the Starman Reborn universe already establishes, and what we can reuse |
| [docs/research/TECH_STACK.md](docs/research/TECH_STACK.md) | The technology stack: engines and interface frameworks compared, with measured sizes |
| [CLAUDE.md](CLAUDE.md) | How we work: documentation first, decisions by the owner, style rules |

## Run it

Requirements: **Node.js 22.18 or newer** and npm.

```bash
npm ci            # install the exact locked dependencies
npm run dev       # development server at http://localhost:5173
npm run build     # production static site in dist/ (relative asset paths)
npm run preview   # serve dist/ at http://localhost:4173
npm run check     # typecheck, art records, unit tests and the production build
npm run art:ping  # check the Gemini key (see docs/ART_PIPELINE.md)
```

## Deploy

Every push to `main` runs `.github/workflows/pages.yml`, which builds `dist/` and publishes it to
GitHub Pages (`https://shotif.github.io/starman-control/`). One-time setup in the repository:
*Settings → Pages → Build and deployment → Source:* **GitHub Actions**. CI
(`.github/workflows/ci.yml`) runs the checks on every branch and pull request.

## Credits and rights

All code, text and design are original to this project. Typefaces: Saira Condensed and Saira Semi
Condensed (SIL Open Font License), bundled, as in Starman Reborn.
