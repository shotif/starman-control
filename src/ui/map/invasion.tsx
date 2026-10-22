// Defences, invasion, bombardment and blockade on the screen (M4_FLEETS.md §26.9): a colony's
// defences and what weighs on it, a fleet's missions, and the report's words for each landing and
// bombardment, with the commanders' radio traffic. The same parts serve the phone and the desktop.

import { FACTIONS, type FactionId } from '../../content/factions.ts';
import { PROJECTS } from '../../content/projects.ts';
import { RADIO, type RadioStage, radioLine } from '../../content/radio.ts';
import { RULES } from '../../content/rules.ts';
import { blockadedBy, garrisonOf, hasBattery, missionRefusal, silenced, troopsOf } from '../../sim/invasion.ts';
import type { ReportEvent } from '../../sim/report.ts';
import type { Fleet, GameState, Holding } from '../../sim/state.ts';
import { atWar } from '../../sim/war.ts';
import type { World } from '../../sim/world.ts';
import { holdingName, millions } from './colony.tsx';
import { give, type Play } from './play.tsx';

type Invasion = Extract<ReportEvent, { kind: 'invasion' }>;
type Bombarded = Extract<ReportEvent, { kind: 'bombarded' }>;

const placeOf = (world: World, game: GameState, id: number, system: string): string => {
  const h = game.holdings.find((x) => x.id === id);
  return h ? holdingName(world, game, h) : world.system(system).name;
};

/** An invasion in the report, from the viewer's side (§26.4). */
export function invasionText(world: World, game: GameState, e: Invasion, me: FactionId): string {
  const place = placeOf(world, game, e.holding, e.system);
  const outpost = e.garrison === 0;
  if (e.by === me) {
    const enemy = FACTIONS[e.from].shortName;
    return e.won
      ? `Our troops took ${place} from the ${enemy}: ${e.troops} landed${outpost ? '' : ` against a garrison of ${e.garrison}`}, and ${e.left} are left.`
      : `Our landing at ${place} was thrown back: ${e.troops} troops against a garrison of ${e.garrison}, of whom ${e.left} still stand.`;
  }
  const enemy = FACTIONS[e.by].shortName;
  return e.won
    ? `The ${enemy} took ${place}: ${e.troops} troops landed${outpost ? '' : ` against our garrison of ${e.garrison}`}.`
    : `Our garrison at ${place} threw back the ${enemy}’s landing: ${e.troops} troops against ${e.garrison}, and ${e.left} of ours still stand.`;
}

/** A bombardment in the report (§26.5). */
export function bombardedText(world: World, game: GameState, e: Bombarded, me: FactionId): string {
  const place = placeOf(world, game, e.holding, e.system);
  const wrecked = e.wrecked ? `, and its ${PROJECTS[e.wrecked].name.toLowerCase()} is wrecked` : '';
  if (e.by === me)
    return e.shielded
      ? `Our bombardment of ${place} broke on its planetary shield.`
      : `We bombarded ${place}: ${millions(e.people)} million of its people are dead${wrecked}.`;
  const enemy = FACTIONS[e.by].shortName;
  return e.shielded
    ? `The ${enemy} bombarded ${place}: its planetary shield held.`
    : `The ${enemy} bombarded ${place}: ${millions(e.people)} million of our people are dead${wrecked}.`;
}

/** The commanders' words to Control as the troops land, from the viewer's side (§26.4). */
export function radioTraffic(
  world: World,
  game: GameState,
  e: Invasion,
  me: FactionId,
): { who: string; text: string }[] {
  const place = placeOf(world, game, e.holding, e.system);
  const attacking = e.by === me;
  const voice = RADIO[attacking ? e.by : e.from];
  const fill = {
    place,
    enemy: FACTIONS[attacking ? e.from : e.by].shortName,
    troops: e.troops,
    garrison: e.garrison,
    left: e.left,
  };
  const stages: RadioStage[] = attacking
    ? ['landing', ...(e.garrison > 0 ? (['fighting'] as const) : []), e.won ? 'won' : 'lost']
    : ['sighted', ...(e.garrison > 0 ? (['holding'] as const) : []), e.won ? 'fell' : 'held'];
  const who = attacking ? voice.landing : voice.garrison;
  return stages.map((s) => ({ who, text: radioLine(voice, s, fill) }));
}

export function RadioTraffic({ world, game, e, me }: { world: World; game: GameState; e: Invasion; me: FactionId }) {
  return (
    <ol class="radio-traffic" aria-label="Radio traffic">
      {radioTraffic(world, game, e, me).map((l, i) => (
        <li key={`${i}-${l.text}`}>
          <span class="radio-who">{l.who}:</span> “{l.text}”
        </li>
      ))}
    </ol>
  );
}

/** The fleets bombarding a holding now. */
function bombarding(game: GameState, h: Holding): Fleet[] {
  return game.fleets.filter((f) => f.mission?.kind === 'bombard' && f.mission.holding === h.id);
}

/** A colony's defences, and the blockade and bombardment it suffers (§26.9). */
export function Defences({ game, holding: h }: { game: GameState; holding: Holding }) {
  if (h.kind !== 'colony') return null;
  const g = garrisonOf(h);
  const battery = hasBattery(h);
  const shield = h.projects.includes('planetary-shield');
  const by = blockadedBy(game, h);
  const bombed = bombarding(game, h);
  return (
    <section class="defences" aria-label="Defences">
      <h3>Defences</h3>
      <p>
        A garrison of <b>{g.total}</b> troops{' '}
        <span class="dim">({g.parts.map((p) => `${p.value} ${p.label}`).join(', ')})</span>
        {battery ? `; a defence battery${silenced(game, h) ? ', silenced this turn' : ''}` : ''}
        {shield ? `; a planetary shield of ${RULES.defence.planetaryShield}` : ''}.
      </p>
      {h.taken > 0 && (
        <p class="defences-warn">
          Newly taken: its people are unhappy for {h.taken} more turn{h.taken === 1 ? '' : 's'}.
        </p>
      )}
      {by && (
        <p class="defences-warn">Blockaded by the {FACTIONS[by].shortName}: cut off from supply, its credits halved.</p>
      )}
      {bombed.map((f) => (
        <p key={f.id} class="defences-warn">
          Under bombardment by the {FACTIONS[f.owner].shortName}’s {f.name}
          {shield ? ', which its planetary shield stops' : ''}.
        </p>
      ))}
    </section>
  );
}

/** A fleet's missions in its system: invade with its troops, bombard with its guns, or stop (§26.9). */
export function FleetMissions({
  world,
  game,
  fleet,
  play,
  at,
}: {
  world: World;
  game: GameState;
  fleet: Fleet;
  play: Play;
  at: string;
}) {
  const targets = game.holdings.filter(
    (h) => h.system === at && h.owner !== fleet.owner && atWar(game, fleet.owner, h.owner),
  );
  const m = fleet.mission;
  if (targets.length === 0 && !m) return null;
  const troops = troopsOf(game, fleet);
  return (
    <section class="fleet-missions" aria-label="Missions">
      <h3>Missions</h3>
      {m && (
        <p>
          {m.kind === 'invade' ? 'Invading' : 'Bombarding'} {placeOf(world, game, m.holding, at)}
          {m.kind === 'invade' ? ' as the turn ends, once the orbit is ours.' : ' each turn while the orbit is ours.'}{' '}
          <button
            type="button"
            class="button button-quiet button-small"
            onClick={() => give(play, { type: 'fleet-mission', fleet: fleet.id, mission: null })}
          >
            Stop
          </button>
        </p>
      )}
      <ul class="fleet-targets">
        {targets.map((h) => {
          const name = holdingName(world, game, h);
          const invade = { kind: 'invade' as const, holding: h.id };
          const bombard = { kind: 'bombard' as const, holding: h.id };
          const canInvade = missionRefusal(game, fleet, invade) === null;
          const canBombard = missionRefusal(game, fleet, bombard) === null;
          const g = garrisonOf(h).total;
          return (
            <li key={h.id}>
              <b>{name}</b>{' '}
              <span class="dim">
                the {FACTIONS[h.owner].shortName}’s {h.kind}
                {h.kind === 'colony' ? `, a garrison of ${g}` : ', no garrison'}
              </span>
              <span class="fleet-target-actions">
                {canInvade && !(m?.kind === 'invade' && m.holding === h.id) && (
                  <button
                    type="button"
                    class="button button-small"
                    onClick={() => give(play, { type: 'fleet-mission', fleet: fleet.id, mission: invade })}
                  >
                    Invade {name}
                  </button>
                )}
                {canBombard && !(m?.kind === 'bombard' && m.holding === h.id) && (
                  <button
                    type="button"
                    class="button button-quiet button-small"
                    onClick={() => give(play, { type: 'fleet-mission', fleet: fleet.id, mission: bombard })}
                  >
                    Bombard {name}
                  </button>
                )}
              </span>
              {canInvade && (
                <span class="dim fleet-odds">
                  Our {troops} troops against {h.kind === 'colony' ? `a garrison of ${g}` : 'none'}.
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
