// War and peace (M4_FLEETS.md §9, §23, D-64): war declared, with its price, remembered by everyone;
// allies called; peace offered and answered, and a truce after it; war weariness. The same orders
// for the player and the rivals. Pure and in whole numbers.

import { FACTIONS, type FactionId, type WarReason } from '../content/factions.ts';
import { MODULES } from '../content/modules.ts';
import { RULES } from '../content/rules.ts';
import { TREATIES } from '../content/treaties.ts';
import type { SystemId } from '../data/types.ts';
import { shipDesign } from './designs.ts';
import { remember } from './memory.ts';
import type { ReportEvent } from './report.ts';
import { contactWith, type GameState, powerOf, type ShipState, treatyOf } from './state.ts';
import { pair } from './treaties.ts';

/** Whether two powers are at war. */
export function atWar(state: GameState, x: FactionId, y: FactionId): boolean {
  if (x === y) return false;
  if (declared(state, x, y)) return true;
  // A subdued power fights its victor's wars (M4_FLEETS.md §28.5).
  const vx = subduedBy(state, x);
  const vy = subduedBy(state, y);
  return (vx !== null && vx !== y && declared(state, vx, y)) || (vy !== null && vy !== x && declared(state, x, vy));
}

/** A war declared between the two (not one a subdued power fights for its victor). */
function declared(state: GameState, x: FactionId, y: FactionId): boolean {
  const [a, b] = pair(x, y);
  return state.wars.some((w) => w.a === a && w.b === b);
}

/** The power a power has capitulated to, or null (§28.5). */
export function subduedBy(state: GameState, f: FactionId): FactionId | null {
  return state.powers.find((p) => p.faction === f)?.subduedBy ?? null;
}

/** The powers a power is at war with, its victor's wars too if it is subdued. */
export function enemiesOf(state: GameState, f: FactionId): FactionId[] {
  return state.powers.map((p) => p.faction).filter((x) => atWar(state, f, x));
}

/** The war between two powers, if they are at war. */
export function warBetween(state: GameState, x: FactionId, y: FactionId) {
  const [a, b] = pair(x, y);
  return state.wars.find((w) => w.a === a && w.b === b);
}

export { endWar as makePeace, wouldMakePeace } from './treaties.ts';

/** The turn a truce between two powers ends, if one holds. */
export function truceUntil(state: GameState, x: FactionId, y: FactionId): number | null {
  const [a, b] = pair(x, y);
  return state.truces.find((t) => t.a === a && t.b === b && t.until > state.turn)?.until ?? null;
}

/** The powers allied with a power. */
export function alliesOf(state: GameState, f: FactionId): FactionId[] {
  return state.treaties
    .filter((t) => t.kind === 'alliance' && (t.a === f || t.b === f))
    .map((t) => (t.a === f ? t.b : t.a));
}

/** Why a power cannot declare war on another (§23.1), or null if it can. */
export function declareRefusal(state: GameState, me: FactionId, other: FactionId): string | null {
  if (other === me || !state.powers.some((p) => p.faction === other)) return 'There is no such power.';
  const name = FACTIONS[other].shortName;
  if (!contactWith(powerOf(state, me), other)) return `We have not heard the ${name}.`;
  const victor = subduedBy(state, me);
  if (victor) return `We are subdued by the ${FACTIONS[victor].shortName}: we may not declare war.`;
  if (atWar(state, me, other)) return `We are at war with the ${name} already.`;
  const until = truceUntil(state, me, other);
  if (until !== null) return `We made peace with the ${name}: no war before turn ${until}.`;
  for (const kind of ['non-aggression', 'alliance'] as const)
    if (treatyOf(state, me, other, kind)) return `We have ${TREATIES[kind].words} with the ${name}: break it first.`;
  return null;
}

/** The powers that would be at war with a declarer: the one attacked and its allies at peace with it. */
export function warWith(state: GameState, me: FactionId, other: FactionId): FactionId[] {
  return [other, ...alliesOf(state, other).filter((a) => a !== me && !atWar(state, me, a))];
}

/** Starts a war between two powers, ending their treaties and offers. */
function begin(state: GameState, by: FactionId, other: FactionId, via?: FactionId, reason?: WarReason): void {
  const [a, b] = pair(by, other);
  state.wars.push({ a, b, since: state.turn, by, ...(via ? { via } : {}), ...(reason ? { reason } : {}) });
  state.wars.sort((p, q) => (`${p.a}~${p.b}` < `${q.a}~${q.b}` ? -1 : 1));
  state.treaties = state.treaties.filter((t) => !(t.a === a && t.b === b));
  state.offers = state.offers.filter((o) => !((o.from === a && o.to === b) || (o.from === b && o.to === a)));
}

/**
 * War declared (order `declare-war`, checked), in effect at once (§23.1): every treaty between the
 * two ends; the other remembers it, and every power in contact with the declarer hears of it; the
 * other's allies are at war with the declarer too. The report tells it as the turn ends.
 */
export function declareWar(state: GameState, me: FactionId, other: FactionId, reason?: WarReason): void {
  const w = RULES.war;
  const sides = warWith(state, me, other);
  for (const enemy of sides) {
    begin(state, me, enemy, enemy === other ? undefined : other, enemy === other ? reason : undefined);
    remember(state, enemy, me, { kind: 'war-declared', amount: w.declared });
  }
  for (const p of state.powers)
    if (p.faction !== me && !sides.includes(p.faction) && contactWith(p, me))
      remember(state, p.faction, me, {
        kind: 'war-declared-heard',
        amount: FACTIONS[p.faction].lawful ? w.heardLawful : w.heard,
        victim: other,
      });
}

/** The wars begun this turn, told to both sides as the turn ends. */
export function reportWars(state: GameState, events: Map<FactionId, ReportEvent[]>): void {
  for (const war of state.wars) {
    if (war.since !== state.turn) continue;
    const other = war.a === war.by ? war.b : war.a;
    const ally = war.via ? { ally: war.via } : {};
    const reason = war.reason ? { reason: war.reason } : {};
    events.get(war.by)?.push({ kind: 'war-declared', faction: other, by: war.by, ...ally, ...reason });
    events.get(other)?.push({ kind: 'war-declared', faction: war.by, by: war.by, ...ally, ...reason });
  }
}

/** Whether `raider` raids a holding of `victim`'s at a system now (M4_FLEETS.md §27.1). */
export function raidingAt(state: GameState, raider: FactionId, victim: FactionId, system: SystemId): boolean {
  for (const f of state.fleets) {
    const m = f.mission;
    if (f.owner !== raider || m?.kind !== 'raid') continue;
    if (!state.holdings.some((h) => h.id === m.holding && h.owner === victim && h.system === system)) continue;
    if (state.ships.some((s) => s.fleet === f.id && s.at === system)) return true;
  }
  return false;
}

/** Whether any raid goes on: when none does, only wars make enemies. */
export function anyRaid(state: GameState): boolean {
  return state.fleets.some((f) => f.mission?.kind === 'raid');
}

/** Whether two powers fight at a system (§27.1): at war, or one raiding the other there. */
export function hostileAt(state: GameState, x: FactionId, y: FactionId, system: SystemId): boolean {
  if (x === y) return false;
  if (atWar(state, x, y)) return true;
  return raidingAt(state, x, y, system) || raidingAt(state, y, x, system);
}

/** Adds to a power's war weariness. */ /** Adds to a power's war weariness. */
export function wearyFrom(state: GameState, f: FactionId, amount: number): void {
  const p = state.powers.find((x) => x.faction === f);
  if (p) p.weariness += amount;
}

/** Each turn (§23.4): a power at war grows weary by its character; at peace it rests. Truces run out. */
export function resolveWeariness(state: GameState): void {
  for (const p of state.powers) {
    if (enemiesOf(state, p.faction).length > 0) p.weariness += FACTIONS[p.faction].weary;
    else p.weariness = Math.max(0, p.weariness - RULES.war.wearyRest);
  }
  // A truce is kept on record a while after it ends: the rivals do not go back to war so soon (§28.1).
  state.truces = state.truces.filter((t) => t.until + RULES.rivalsWar.rest > state.turn);
}

/** What war weariness costs every colony's approval (§23.4): −1 for every 5, at most −15. */
export function wearinessApproval(state: GameState, f: FactionId): number {
  const w = RULES.war;
  return -Math.min(w.wearyMost, Math.floor(powerOf(state, f).weariness / w.wearyPer));
}

/** Whether a ship carries a weapon. */
export function isArmed(state: GameState, ship: ShipState): boolean {
  return shipDesign(state, ship)?.modules.some((m) => MODULES[m].weapon !== undefined) ?? false;
}

/** The power at war with `owner` whose armed warship or battery at a system stops it there (§23.4, §26.7), if any. */
export function interceptedBy(state: GameState, owner: FactionId, system: SystemId): FactionId | null {
  if (!state.wars.some((w) => w.a === owner || w.b === owner)) return null;
  for (const s of state.ships)
    if (s.at === system && s.owner !== owner && atWar(state, owner, s.owner) && isArmed(state, s)) return s.owner;
  // A colony's battery stops them too (M4_FLEETS.md §26.7).
  for (const h of state.holdings)
    if (
      h.system === system &&
      h.kind === 'colony' &&
      h.projects.includes('defence-battery') &&
      atWar(state, owner, h.owner)
    )
      return h.owner;
  return null;
}
