// Memory and attitude (M3_NEIGHBOURS.md §20, D-55): each power's regard for every other it is in
// contact with, the sum of what it is to it and what it remembers of it, each part with its reason.
// Memories fade a point towards nothing every few turns. The first deed one power can do for
// another is a gift.

import { FACTIONS, type FactionId } from '../content/factions.ts';
import { PROJECTS } from '../content/projects.ts';
import { RULES } from '../content/rules.ts';
import { TREATIES } from '../content/treaties.ts';
import type { ReportEvent } from './report.ts';
import { contactWith, type GameState, type Memory, type MemoryKind, powerOf } from './state.ts';
import type { World } from './world.ts';

/** One part of an attitude, with its reason as the regarded power reads it. */
export interface AttitudePart {
  kind: 'kin' | 'known' | 'character' | 'treaty' | MemoryKind;
  reason: string;
  amount: number;
}

export interface Attitude {
  /** Held between −100 and +100. */
  total: number;
  word: string;
  parts: AttitudePart[];
}

/** The attitude's word: hostile, cold, neutral, warm or friendly (§20.1). */
export function attitudeWord(total: number): string {
  return RULES.memory.words.find((w) => total >= w.least)?.word ?? 'hostile';
}

const treatyWords = (m: Memory) => (m.treaty ? TREATIES[m.treaty].name.toLowerCase() : 'a');

/** A memory's reason, as the power remembered reads it. */
export function memoryReason(world: World, m: Memory): string {
  const place = m.system ? world.system(m.system).name : 'a system of its own';
  switch (m.kind) {
    case 'gift':
      return `Remembers our gift of ${m.credits ?? 0} credits`;
    case 'great-work-lost':
      return `Lost ${m.project ? `the ${PROJECTS[m.project].name}` : 'a great work'} to us`;
    case 'settled-beside':
      return `We settled beside it at ${place}`;
    case 'treaty-ended':
      return `We ended the ${treatyWords(m)} treaty`;
    case 'treaty-broken':
      return `We broke the ${treatyWords(m)} treaty`;
    case 'treaty-broken-heard':
      return `We broke a treaty with the ${m.victim ? FACTIONS[m.victim].shortName : 'others'}`;
    case 'offer-misread':
      return `Misread our offer of ${treatyWords(m)}`;
  }
}

/**
 * What `holder` thinks of `toward` (§20.1): nothing until it is in contact with them; then its kin,
 * how long it has known them, its view of their ways and its memories of them.
 */
export function attitudeOf(world: World, state: GameState, holder: FactionId, toward: FactionId): Attitude {
  const r = RULES.memory;
  const power = powerOf(state, holder);
  const contact = contactWith(power, toward);
  const parts: AttitudePart[] = [];
  if (contact) {
    if (FACTIONS[holder].species === FACTIONS[toward].species)
      parts.push({ kind: 'kin', reason: 'Of our own kind', amount: r.kin });
    const turns = state.turn - contact.since;
    const known = Math.min(r.knownMost, Math.floor(turns / r.knownEvery));
    if (known > 0) parts.push({ kind: 'known', reason: `Has known us ${turns} turns`, amount: known });
    const regard = FACTIONS[holder].regard[toward];
    if (regard) parts.push({ kind: 'character', reason: regard.reason, amount: regard.amount });
    // Each treaty in force between them (§21.1).
    const [a, b] = holder < toward ? [holder, toward] : [toward, holder];
    for (const t of state.treaties)
      if (t.a === a && t.b === b)
        parts.push({
          kind: 'treaty',
          reason: `Bound to us by ${TREATIES[t.kind].name.toLowerCase()}`,
          amount: r.treaty,
        });
    for (const m of power.memories)
      if (m.faction === toward) parts.push({ kind: m.kind, reason: memoryReason(world, m), amount: m.amount });
  }
  const sum = parts.reduce((n, p) => n + p.amount, 0);
  const total = Math.max(-r.most, Math.min(r.most, sum));
  return { total, word: attitudeWord(total), parts };
}

/** `holder` remembers something of `about`, from this turn. */
export function remember(
  state: GameState,
  holder: FactionId,
  about: FactionId,
  m: Omit<Memory, 'faction' | 'turn'>,
): void {
  if (holder === about || m.amount === 0) return;
  powerOf(state, holder).memories.push({ faction: about, turn: state.turn, ...m });
}

/** Memories fade a point towards nothing every few turns, and are forgotten at nothing (§20.1). */
export function fadeMemories(state: GameState): void {
  const every = RULES.memory.fadeEvery;
  for (const p of state.powers) {
    for (const m of p.memories) {
      const age = state.turn - m.turn;
      if (age > 0 && age % every === 0) m.amount -= Math.sign(m.amount);
    }
    p.memories = p.memories.filter((m) => m.amount !== 0);
  }
}

/** Why a gift cannot be sent (§20.2), or null if it can; 0 credits takes back a gift not yet sent. */
export function giftRefusal(state: GameState, faction: FactionId, to: FactionId, credits: number): string | null {
  const other = state.powers.find((p) => p.faction === to);
  if (!other || to === faction) return 'There is no such power.';
  const power = powerOf(state, faction);
  const name = FACTIONS[to].shortName;
  if (credits === 0)
    return power.gifts.some((g) => g.to === to) ? null : `No gift to the ${name} is waiting to be sent.`;
  if (!(RULES.memory.gifts as readonly number[]).includes(credits))
    return `A gift is ${RULES.memory.gifts.join(', ').replace(/, (\d+)$/, ' or $1')} credits.`;
  if (contactWith(power, to)?.stage !== 'talk') return `We cannot talk with the ${name} yet.`;
  const waiting = power.gifts.find((g) => g.to === to)?.credits ?? 0;
  if (power.treasury + waiting < credits) return 'The treasury cannot pay for it.';
  return null;
}

/** Puts a gift checked by `giftRefusal` in hand: paid now, in place of one already waiting for the same power. */
export function giveGift(state: GameState, faction: FactionId, to: FactionId, credits: number): void {
  const power = powerOf(state, faction);
  const waiting = power.gifts.find((g) => g.to === to);
  if (waiting) power.treasury += waiting.credits;
  power.gifts = power.gifts.filter((g) => g.to !== to);
  if (credits === 0) return;
  power.treasury -= credits;
  power.gifts.push({ to, credits });
}

/** The turn's gifts arrive (§20.2): the credits, the memory, and a word in both reports. */
export function deliverGifts(state: GameState, events: Map<FactionId, ReportEvent[]>): void {
  for (const p of state.powers) {
    for (const g of p.gifts) {
      const to = powerOf(state, g.to);
      to.treasury += g.credits;
      remember(state, g.to, p.faction, {
        kind: 'gift',
        amount: Math.floor(g.credits / RULES.memory.giftCredits),
        credits: g.credits,
      });
      events.get(p.faction)?.push({ kind: 'gift-sent', faction: g.to, credits: g.credits });
      events.get(g.to)?.push({ kind: 'gift-received', faction: p.faction, credits: g.credits });
    }
    p.gifts = [];
  }
}
