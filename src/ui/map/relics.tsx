// Relic sites on the screen (M5_UNKNOWN.md §20.8): a site in its system's panel, the Relics screen
// (the chapters waiting for a choice, the share of research, the known sites and the journal of the
// Absent), the share on the research screen, and the report's lines. Every site, chapter and
// revelation is fiction, and labelled so.

import { FACTIONS, type FactionId } from '../../content/factions.ts';
import { RELIC_KINDS, type RelicKind, revelationFor, STUDY_IT } from '../../content/relics.ts';
import { RULES } from '../../content/rules.ts';
import type { SystemId } from '../../data/types.ts';
import { researchOf } from '../../sim/economy.ts';
import { formatLy } from '../../sim/geometry.ts';
import { beginAnswerRefusal, holderOf, keyAt, keyKnown, keySites, keysHeld } from '../../sim/keys.ts';
import {
  canExcavate,
  chapterCost,
  digAt,
  excavateRefusal,
  knownSites,
  secondGives,
  siteAt,
  siteKnown,
  splitResearch,
  studyGives,
} from '../../sim/relics.ts';
import type { ReportEvent } from '../../sim/report.ts';
import { effects } from '../../sim/research.ts';
import { DIG_SHARES, type DigShare, type GameState, powerOf } from '../../sim/state.ts';
import type { World } from '../../sim/world.ts';
import { Badge } from '../parts.tsx';
import { give, type Play } from './play.tsx';
import './relics.css';

const CHAPTERS = RULES.relics.chapterCost.length;
const lower = (s: string) => s.replace(/^An? /, (m) => m.toLowerCase());
const SHARE_WORDS: Record<DigShare, string> = { 0: 'None', 25: 'A quarter', 50: 'A half' };

/** "Sirius, Procyon and 40 Eridani". */
function systemList(world: World, ids: readonly SystemId[]): string {
  const n = ids.map((id) => world.system(id).name);
  return n.length <= 1 ? (n[0] ?? '') : `${n.slice(0, -1).join(', ')} and ${n.at(-1)}`;
}

/** The report's line for a relic site's event, from the player's side (§20.8); null for others. */
export function relicText(world: World, game: GameState, e: ReportEvent, me: FactionId | undefined): string | null {
  const name = (id: SystemId) => world.system(id).name;
  const kindAt = (id: SystemId) => siteAt(world, game.seed, id)?.kind;
  switch (e.kind) {
    case 'relics-charted':
      return `Our old charts show ${e.systems.length === 1 ? 'a relic site' : 'relic sites'} of the Absent at ${systemList(world, e.systems)}.`;
    case 'dig':
      if (e.stage === 'lost')
        return `The excavation at ${name(e.system)} has stopped: we no longer hold anything in the system. What was done there is kept.`;
      return e.stage === 'stopped'
        ? `The excavation at ${name(e.system)} has stopped.`
        : `The excavation at ${name(e.system)} has begun.`;
    case 'chapter': {
      const kind = kindAt(e.system);
      const lines = kind ? RELIC_KINDS[kind].chapters[e.chapter - 1] : '';
      const revelation = me ? ` The Absent: ${revelationFor(e.revelation, me)}` : '';
      return `Chapter ${e.chapter} of ${kind ? lower(RELIC_KINDS[kind].name) : 'the site'} at ${name(e.system)} is done. ${lines}${revelation} Choose what to do with it on the Relics screen.`;
    }
    case 'chapter-answered': {
      const how = e.auto ? 'Left to wait, we' : 'We';
      const what =
        e.research !== undefined
          ? `studied it: ${e.research} research`
          : e.resource
            ? `took ${e.resource.amount} ${e.resource.kind === 'fuel' ? 'fusion fuel' : e.resource.kind}`
            : `followed its charts: ${e.surveyed?.length ?? 0} systems surveyed${e.surveyed && e.surveyed.length > 0 ? `, ${systemList(world, e.surveyed)}` : ''}`;
      return `${how} ${what}, from chapter ${e.chapter} at ${name(e.system)}.`;
    }
    case 'key': {
      const who = (f: FactionId | null | undefined) =>
        f === me ? 'us' : f ? `the ${FACTIONS[f].shortName}` : 'no one';
      const Who = (f: FactionId | null | undefined) =>
        f === me ? 'We' : f ? `The ${FACTIONS[f].shortName}` : 'No one';
      if (e.stage === 'found')
        return e.by === me
          ? `We found a key of the Absent at ${name(e.system)}. Every other power thinks the less of us for it.`
          : `${Who(e.by)} found a key of the Absent at ${name(e.system)}.`;
      if (e.stage === 'taken')
        return `${Who(e.by)} took the key of the Absent at ${name(e.system)}${e.from ? ` from ${who(e.from)}` : ''}.`;
      return `The key of the Absent at ${name(e.system)} is lost${e.from ? ` to ${who(e.from)}` : ''}: it lies at its site again, a chapter's excavation away.`;
    }
    case 'answer': {
      const ours = e.by === me;
      const whose = ours ? 'Our' : `The ${FACTIONS[e.by].shortName}’s`;
      const turns = `${e.left} turn${e.left === 1 ? '' : 's'}`;
      if (e.stage === 'begun')
        return ours
          ? `We have begun the Answer, with the five keys of the Absent: ${turns} more, if we keep them and our capital.`
          : `The ${FACTIONS[e.by].shortName} have begun the Answer, with the five keys of the Absent: ${turns} more, unless someone stops them.`;
      if (e.stage === 'stopped') return `${whose} Answer has stopped: the keys or the capital were lost.`;
      return e.left === 0 ? `${whose} Answer is given.` : `${whose} Answer: ${turns} left.`;
    }
    default:
      return null;
  }
}

/** A site's picture, wide, with its alternative text (§20.9). */
function RelicPicture({ kind }: { kind: RelicKind }) {
  const base = `${import.meta.env.BASE_URL}art/illustration/relic-${kind}`;
  return (
    <figure class="relic-art">
      <img
        src={`${base}-640.webp`}
        srcset={`${base}-640.webp 640w, ${base}-1280.webp 1280w`}
        sizes="(min-width: 900px) 680px, 100vw"
        width={640}
        height={427}
        alt={RELIC_KINDS[kind].seen}
        decoding="async"
        loading="lazy"
      />
    </figure>
  );
}

/** Where a site stands, from our side: done, under way, waiting, another's, or not begun. */
function siteStatus(game: GameState, faction: FactionId, system: SystemId): string {
  const d = digAt(game, system);
  const done = d?.chapters ?? 0;
  if (done >= CHAPTERS) return `All ${CHAPTERS} chapters done.`;
  if (!d?.by) return done > 0 ? `${done} of ${CHAPTERS} chapters done; no one excavates it now.` : 'Not yet excavated.';
  if (d.by !== faction) return `${done} of ${CHAPTERS} chapters done; the ${FACTIONS[d.by].shortName} excavate it.`;
  if (d.waiting !== null) return `Chapter ${done} is done and waits for our choice.`;
  return `We excavate it: chapter ${done + 1}, ${d.progress} of ${chapterCost(game, faction, done)} research.`;
}

/** Excavate or stop, with the reason when we may not (§20.8). */
function DigButton({
  world,
  game,
  faction,
  play,
  system,
}: {
  world: World;
  game: GameState;
  faction: FactionId;
  play: Play;
  system: SystemId;
}) {
  const d = digAt(game, system);
  if (d?.by === faction)
    return (
      <button
        type="button"
        class="button button-small button-quiet"
        onClick={() => give(play, { type: 'stop-excavation', system })}
      >
        Stop
      </button>
    );
  const refusal = excavateRefusal(world, game, faction, system);
  if (refusal) return <p class="dim relic-why">{refusal}</p>;
  return (
    <button type="button" class="button button-small" onClick={() => give(play, { type: 'excavate', system })}>
      Excavate
    </button>
  );
}

/** A relic site in its system's panel (§20.8), if we know of one there. */
export function RelicSiteSection({
  world,
  game,
  faction,
  play,
  system,
  onRelics,
}: {
  world: World;
  game: GameState;
  faction: FactionId;
  play?: Play;
  system: SystemId;
  onRelics?: () => void;
}) {
  const site = siteAt(world, game.seed, system);
  if (!site || !siteKnown(world, game, powerOf(game, faction), system)) return null;
  const def = RELIC_KINDS[site.kind];
  return (
    <section class="relic-site" aria-label="Relic site">
      <h3>
        {def.name} <Badge kind="fiction" />
      </h3>
      <RelicPicture kind={site.kind} />
      <p>{def.seen}</p>
      <p class="dim">{siteStatus(game, faction, system)}</p>
      {keyKnown(world, game, powerOf(game, faction), system) && (
        <p class="relic-key-note">
          {(() => {
            const k = keyAt(game, system);
            const holder = k ? holderOf(game, k) : null;
            if (holder)
              return `Its key of the Absent is held by ${holder === faction ? 'us' : `the ${FACTIONS[holder].shortName}`}.`;
            return k
              ? 'Its key of the Absent was lost, and lies here again.'
              : 'It holds a key of the Absent, found with its third chapter.';
          })()}
        </p>
      )}
      {play && <DigButton world={world} game={game} faction={faction} play={play} system={system} />}
      {onRelics && (
        <button type="button" class="link" onClick={onRelics}>
          Relics
        </button>
      )}
    </section>
  );
}

/** The share of research for excavations (§20.3), and what it takes this turn. */
export function DigShareLine({
  world,
  game,
  faction,
  play,
}: {
  world: World;
  game: GameState;
  faction: FactionId;
  play: Play;
}) {
  if (!canExcavate(game, faction)) return null;
  const me = powerOf(game, faction);
  const taken = splitResearch(game, faction, researchOf(world, game, faction).total).digs.reduce(
    (n, d) => n + d.points,
    0,
  );
  return (
    <div class="dig-share">
      <span>Excavations take</span>
      <fieldset class="dig-share-buttons">
        <legend class="visually-hidden">Share of research for excavations</legend>
        {DIG_SHARES.map((s) => (
          <button
            key={s}
            type="button"
            class="button button-small"
            aria-pressed={me.digShare === s}
            onClick={() => give(play, { type: 'dig-share', share: s })}
          >
            {SHARE_WORDS[s]}
          </button>
        ))}
      </fieldset>
      <span class="dim">
        {taken > 0 ? `${taken} research this turn.` : 'none this turn: no excavation is under way.'}
      </span>
    </div>
  );
}

/** The keys of the Absent and the Answer (M5_UNKNOWN.md §21.6), as far as we know. */
function KeysSection({
  world,
  game,
  faction,
  play,
  onGo,
}: {
  world: World;
  game: GameState;
  faction: FactionId;
  play: Play;
  onGo: (system: SystemId) => void;
}) {
  const me = powerOf(game, faction);
  const sites = keySites(world, game.seed);
  const known = sites.filter((s) => keyKnown(world, game, me, s));
  const unknown = sites.length - known.length;
  const held = keysHeld(game, faction).length;
  const a = game.answer;
  const refusal = beginAnswerRefusal(game, faction);
  const whose = (f: FactionId) => (f === faction ? 'us' : `the ${FACTIONS[f].shortName}`);
  return (
    <section class="relic-keys" aria-label="The keys">
      <h3>The keys</h3>
      <p class="dim">
        Five of the sites each hold a key of the Absent, found with their third chapter. With all five and The
        instrument, a power may begin the Answer: {RULES.keys.answerTurns} turns, and it wins. Every other power thinks{' '}
        {-RULES.keys.fear} less of a power for each key it holds. We hold {held}.
      </p>
      {a && (
        <p class="relic-answer">
          {a.by === faction ? 'We are answering' : `The ${FACTIONS[a.by].shortName} are answering`}: {a.left} turn
          {a.left === 1 ? '' : 's'} left.
        </p>
      )}
      <ul class="relic-list">
        {known.map((s) => {
          const k = keyAt(game, s);
          const holder = k ? holderOf(game, k) : null;
          return (
            <li key={s}>
              <button type="button" class="link" onClick={() => onGo(s)}>
                {world.system(s).name}
              </button>
              <span class="dim relic-status">
                {holder
                  ? `Held by ${whose(holder)}.`
                  : k
                    ? 'Lost: it lies at its site again, a chapter away.'
                    : 'Not yet found.'}
              </span>
            </li>
          );
        })}
      </ul>
      {unknown > 0 && (
        <p class="dim">
          {unknown === sites.length ? 'Where the keys lie, we do not know' : `${unknown} more we do not know of`}: The
          second tone, in Xenology, would tell us.
        </p>
      )}
      {refusal === null ? (
        <button type="button" class="button" onClick={() => give(play, { type: 'begin-answer' })}>
          Begin the Answer
        </button>
      ) : (
        effects(game, faction, 'answer').length > 0 && <p class="dim">{refusal}</p>
      )}
    </section>
  );
}

/** The Relics screen (§20.8). */
export function RelicsView({
  world,
  game,
  faction,
  play,
  onGo,
}: {
  world: World;
  game: GameState;
  faction: FactionId;
  play: Play;
  onGo: (system: SystemId) => void;
}) {
  const me = powerOf(game, faction);
  const home = me.capital;
  const sites = knownSites(world, game, faction).sort(
    (a, b) => world.distanceDeci(home, a.system) - world.distanceDeci(home, b.system) || (a.system < b.system ? -1 : 1),
  );
  const waiting = game.digs.filter((d) => d.by === faction && d.waiting !== null);
  const read = Math.min(me.chapters, 12);
  return (
    <div class="relics">
      <p>
        <Badge kind="fiction" /> The Absent left places among the stars, most at the dead ones. A survey finds them; a
        colony or an outpost in the system excavates them, chapter by chapter, with a share of our research.
      </p>
      {!canExcavate(game, faction) && <p class="dim">We cannot excavate yet: it needs Relic studies, in Xenology.</p>}

      {waiting.map((d) => {
        const site = siteAt(world, game.seed, d.system);
        if (!site) return null;
        const def = RELIC_KINDS[site.kind];
        const choose = (choice: 0 | 1, label: string, does: string) => (
          <button
            type="button"
            class={`event-choice${d.answer === choice ? ' is-chosen' : ''}`}
            aria-pressed={d.answer === choice}
            onClick={() => give(play, { type: 'chapter-choice', system: d.system, choice })}
          >
            <b>{label}</b> <span>{does}</span>
          </button>
        );
        return (
          <section
            key={d.system}
            class="relic-waiting"
            aria-label={`Chapter ${d.chapters} at ${world.system(d.system).name}`}
          >
            <h3>
              Chapter {d.chapters}: {lower(def.name)} at {world.system(d.system).name}
            </h3>
            <RelicPicture kind={site.kind} />
            <p>{def.chapters[d.chapters - 1]}</p>
            <fieldset class="event-choices">
              <legend class="visually-hidden">Our choice</legend>
              {choose(0, STUDY_IT, studyGives(d.chapters))}
              {choose(1, def.second, secondGives(site.kind, d.chapters))}
            </fieldset>
            <p class="dim">
              Unanswered after {RULES.relics.waits} turns, we study it. Until then the excavation waits.
            </p>
          </section>
        );
      })}

      <DigShareLine world={world} game={game} faction={faction} play={play} />

      <h3>Known sites</h3>
      {sites.length === 0 ? (
        <p class="dim">None yet. Our survey ships find them; Old charts show those near our holdings.</p>
      ) : (
        <ul class="relic-list">
          {sites.map((s) => (
            <li key={s.system}>
              <button type="button" class="link" onClick={() => onGo(s.system)}>
                {world.system(s.system).name}
              </button>
              <span class="dim"> {formatLy(world.distanceDeci(home, s.system))} from our capital</span>
              <span class="relic-kind">{RELIC_KINDS[s.kind].name}</span>
              <span class="dim relic-status">{siteStatus(game, faction, s.system)}</span>
              <DigButton world={world} game={game} faction={faction} play={play} system={s.system} />
            </li>
          ))}
        </ul>
      )}

      <KeysSection world={world} game={game} faction={faction} play={play} onGo={onGo} />

      <h3>The Absent</h3>
      {read === 0 ? (
        <p class="dim">Nothing yet: each chapter we excavate tells us more.</p>
      ) : (
        <ol class="relic-journal">
          {Array.from({ length: read }, (_, i) => (
            <li key={i}>{revelationFor(i + 1, faction)}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
