# Illustrated dispatches (increment 13)

**Status:** written 19 October 2026, before it was built, and built the same day (§4); part of
the visual direction ([VISUAL_DIRECTION.md](VISUAL_DIRECTION.md) §3, "faces and places", D-26).

**Goal.** The report at the end of a turn reads like a dispatch from the frontier: what mattered
most in the turn comes with a picture, so a turn that found a colony or an anomaly feels different
from one that moved a ship.

**Out of scope.** A picture for every kind of event; pictures of particular places (each would
need its own brief); animated or 3D illustrations.

## 1. Pictures

Six illustrations from the art pipeline (D-23: Nano Banana, the draft style), two candidates each,
about $0.60 in all (the total for the project stays under the owner's $5 without asking):

| Picture | Shown when the turn |
| --- | --- |
| `dispatch-anomaly` | found or investigated an anomaly |
| `dispatch-colony` | founded a colony or outpost |
| `dispatch-research` | finished a technology |
| `dispatch-lane` | opened or relit a lane |
| `dispatch-ship` | built a ship |
| `dispatch-survey` | surveyed a system |

Each depicts nothing real but stars in general: no particular system, and everything built is
fiction. Each is badged *Illustration* in the report, as on the new-game screen.

## 2. In the report

The picture of the most notable event, in the order of the table above, heads the report, wide
and short (cropped to about 5:2), fading into the dispatches below it. A quiet turn has no
picture. On a phone it heads the report's sheet; on a desktop, the report's pop-over. It is the
phone's 640-pixel picture unless the screen is wide, loaded only when the report opens.

## 3. Tests

- After a turn that surveyed a system, the report's picture is the survey's, badged; a quiet turn
  has none.
- The art records cover the new pictures (`npm run check`).
- The existing journeys pass.

## 4. As built

- **The pictures:** twelve candidates were made on 19 October 2026 for about $0.60 (the project's
  total is now about $2.70 of the owner's $5). Chosen at the report's wide crop: survey **B** (the
  clearest ship, no black band), colony **A**, ship **B** (the last weld), research **A** (the
  golden hologram reads best when small), anomaly **A**, lane **B**. Each is recorded in
  `art/manifest.json`. The lettered contact sheet was sent to the owner, who can overrule any
  choice (candidates are not kept in the repository).
- **In the report:** `dispatchPicture` in `src/ui/map/play.tsx` picks the picture in the order of
  §1; the figure is cropped to 5:2 with a fade and the *Illustration* badge, and its text
  description is the image's alternative text. Phones load the 640-pixel picture (10 to 30 KB),
  wide screens the 1280.
- **Tests:** the survey journey in `game.spec.ts` checks the survey's picture heads the report,
  badged and loaded; the turn journey in `console.spec.ts` checks a quiet turn has none.
