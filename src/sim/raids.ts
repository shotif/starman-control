// Raids (docs/design/M4_FLEETS.md §27, D-66): the outlaw's fleets plunder a colony or outpost of a
// power they are not at war with, while they hold its orbit; remembered, but not war.

import { FACTIONS, type FactionId } from '../content/factions.ts';
import { RULES } from '../content/rules.ts';
import { creditsOf, yieldsOf } from './economy.ts';
import { holdsOrbit, keepMemory, missionRefusal } from './invasion.ts';
import type { ReportEvent } from './report.ts';
import { contactWith, type GameState, type Holding, powerOf } from './state.ts';
import type { World } from './world.ts';

/**
 * Plunder as the turn ends (§27.1), after the battles: a fleet raiding a holding whose power no
 * longer holds the orbit takes a colony's credits of the turn, or an outpost's yields, for its own
 * power; no more than the raided power has, and a holding once a turn however many fleets raid it
 * (M5_UNKNOWN.md §28, as built). Both read of it; it is remembered by the raided and heard by the lawful.
 */
export function resolveRaids(world: World, state: GameState, events: Map<FactionId, ReportEvent[]>): void {
  const r = RULES.raid;
  const plundered = new Set<number>();
  for (const fleet of state.fleets) {
    const m = fleet.mission;
    if (!m || m.kind !== 'raid') continue;
    if (missionRefusal(state, fleet, m) !== null) {
      fleet.mission = null;
      continue;
    }
    const h = state.holdings.find((x) => x.id === m.holding) as Holding;
    if (holdsOrbit(state, h.owner, h.system) || plundered.has(h.id)) continue;
    plundered.add(h.id);
    const victim = powerOf(state, h.owner);
    const raider = powerOf(state, fleet.owner);
    let credits = 0;
    const took = { metals: 0, volatiles: 0, fuel: 0 };
    if (h.kind === 'colony') {
      credits = Math.max(0, Math.min(creditsOf(world, state, h).total, victim.treasury));
      victim.treasury -= credits;
      raider.treasury += credits;
    } else {
      const y = yieldsOf(world, state, h).total;
      for (const k of ['metals', 'volatiles', 'fuel'] as const) {
        took[k] = Math.max(0, Math.min(y[k], victim.stockpile[k]));
        victim.stockpile[k] -= took[k];
        raider.stockpile[k] += took[k];
      }
    }
    const event: ReportEvent = {
      kind: 'raided',
      holding: h.id,
      system: h.system,
      by: fleet.owner,
      from: h.owner,
      fleet: fleet.id,
      credits,
      ...took,
    };
    events.get(fleet.owner)?.push(event);
    events.get(h.owner)?.push(event);
    keepMemory(state, h.owner, fleet.owner, 'raided', r.raided, h.system);
    for (const p of state.powers)
      if (
        p.faction !== h.owner &&
        p.faction !== fleet.owner &&
        FACTIONS[p.faction].lawful &&
        contactWith(p, fleet.owner)
      )
        keepMemory(state, p.faction, fleet.owner, 'raided-heard', r.heard, h.system, h.owner);
  }
}
