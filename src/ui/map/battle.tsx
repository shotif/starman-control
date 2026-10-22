// A battle in the report (M4_FLEETS.md §24.8): who fought, what was lost, who held the system, and up
// to three reasons why, from the player's side; and *Watch* for the replay (increment 45).

import { FACTIONS, type FactionId } from '../../content/factions.ts';
import type { DamageType, ShieldKind } from '../../content/modules.ts';
import type { BattleLog, Why } from '../../sim/battle.ts';
import type { GameState } from '../../sim/state.ts';
import { atWar } from '../../sim/war.ts';
import type { World } from '../../sim/world.ts';

const SHIELD_WORDS: Record<ShieldKind, string> = { balanced: 'balanced', deflector: 'deflector', diffuser: 'diffuser' };
const TYPE_WORDS: Record<DamageType, string> = { energy: 'energy', kinetic: 'kinetic', plasma: 'plasma', ion: 'ion' };
/** What would do better against a shield that sheds a kind of fire. */
const BETTER: Record<ShieldKind, string> = {
  balanced: '',
  deflector: ' Energy or ion fire would do better against them.',
  diffuser: ' Plasma would burn through.',
};

function side(f: FactionId, me: FactionId, our: string, their: string): string {
  return f === me ? our : their;
}

/** "the Frontier Co-op and the Hollow Wake". */
function names(fs: readonly FactionId[]): string {
  const n = fs.map((f) => `the ${FACTIONS[f].shortName}`);
  return n.length <= 1 ? (n[0] ?? 'no one') : `${n.slice(0, -1).join(', ')} and ${n.at(-1)}`;
}

/** A reason, worded from the viewer's side (§24.8). */
export function whyText(why: Why, me: FactionId): string {
  switch (why.kind) {
    case 'weight':
      return why.strong === me
        ? `We brought far more fire: ${why.strongAttack} a round against their ${why.weakAttack}.`
        : `They brought far more fire: ${why.strongAttack} a round against our ${why.weakAttack}.`;
    case 'shields': {
      const shield = SHIELD_WORDS[why.shield];
      const type = TYPE_WORDS[why.type];
      const p = Math.abs(why.percent);
      if (why.by === me)
        return why.percent < 0
          ? `Our ${shield} shields shed their ${type} fire: ${p}% less.`
          : `Their ${type} fire tore through our ${shield} shields: ${p}% more.`;
      return why.percent < 0
        ? `Their ${shield} shields shed our ${type} fire: ${p}% less.${BETTER[why.shield]}`
        : `Our ${type} fire tore through their ${shield} shields: ${p}% more.`;
    }
    case 'range':
      return why.of === me
        ? `Our guns fired away from their best range, and lost ${why.percent}% of their damage: a stance that keeps to their range would help.`
        : `Their guns fired away from their best range, and lost ${why.percent}% of their damage.`;
    case 'ion':
      return `${side(why.of, me, 'Our', 'Their')} ion fire barely scratched hulls once the shields were down.`;
    case 'left': {
      const who = why.owner === me ? `The ${why.force}` : `The ${FACTIONS[why.owner].shortName}’s ${why.force}`;
      return why.why === 'evade'
        ? `${who} kept its distance and left after the second round.`
        : `${who} reached its retreat point and withdrew.`;
    }
  }
}

/** The battle's line in the report: where, against whom, the losses, and who held the system. */
export function battleText(world: World, game: GameState, log: BattleLog, me: FactionId): string {
  const enemies = log.powers.filter((p) => p !== me && atWar(game, me, p));
  const mine = log.ships.filter((s) => s.owner === me);
  const theirs = log.ships.filter((s) => enemies.includes(s.owner));
  const lost = new Set(log.rounds.flatMap((r) => r.destroyed));
  const ours = mine.filter((s) => lost.has(s.id)).length;
  const them = theirs.filter((s) => lost.has(s.id)).length;
  const held =
    log.held.includes(me) && !log.held.some((p) => enemies.includes(p))
      ? 'We hold the system.'
      : log.held.some((p) => enemies.includes(p)) && !log.held.includes(me)
        ? 'They hold the system.'
        : log.held.length > 0
          ? 'Both sides hold their ground: the battle goes on next turn.'
          : 'Neither side holds the system.';
  const rounds = log.rounds.length;
  return `A battle at ${world.system(log.system).name} against ${names(enemies)}, ${rounds} round${rounds === 1 ? '' : 's'}: we lost ${ours} of ${mine.length} ship${mine.length === 1 ? '' : 's'}, they lost ${them} of ${theirs.length}. ${held}`;
}

export function BattleWhy({ log, me }: { log: BattleLog; me: FactionId }) {
  if (log.why.length === 0) return null;
  return (
    <ul class="battle-why" aria-label="Why it went so">
      {log.why.map((w, i) => (
        <li key={`${w.kind}-${i}`}>{whyText(w, me)}</li>
      ))}
    </ul>
  );
}
