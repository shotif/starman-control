// The system screen (§10): a star system's stars, with their estimated light, its worlds, and its
// lanes, every fact with where it comes from. The same content on both layouts: a bottom sheet on a
// phone, the inspector on a desktop. In the codex (`realOnly`) it shows only what is observed.

import { useState } from 'preact/hooks';
import type { FactionId } from '../../content/factions.ts';
import { SPECIES, type SpeciesDef } from '../../content/species.ts';
import type { Measured, SkyPlanet, SkyStar, SystemId } from '../../data/types.ts';
import { type Body, bodiesOf } from '../../sim/bodies.ts';
import { formatLy } from '../../sim/geometry.ts';
import { habitability } from '../../sim/habitability.ts';
import { estimateStar } from '../../sim/starLight.ts';
import { starKindWord } from '../../sim/stars.ts';
import type { GameState } from '../../sim/state.ts';
import { otherEnd, type World } from '../../sim/world.ts';
import { Badge, FactionTag } from '../parts.tsx';
import { bodyBadge, PlanetPanel } from './PlanetPanel.tsx';
import { bodyLine, HABITABILITY_WORD } from './words.ts';
import './system.css';

interface Props {
  world: World;
  game: GameState;
  id: SystemId;
  /** Go to another system (its name in the lane list). */
  onGo: (id: SystemId) => void;
  /** Centre the map on this system; absent where there is no map. */
  onCentre?: () => void;
  /** Open one of its worlds; absent in the codex. */
  onBody?: (id: string) => void;
  /** Whose habitability to show (the player's species). */
  species?: SpeciesDef;
  /** The codex: observed facts only. */
  realOnly?: boolean;
  /** Whether the viewing power has surveyed it; if only charted, generated worlds stay hidden. */
  surveyed?: boolean;
  /** The viewing power's ships here, and what to do when one is chosen. */
  ships?: readonly { id: number; name: string; kind: string; status: string }[];
  onShip?: (id: number) => void;
  /** Colonies and outposts here, anyone's; the viewer's own open with `onHolding`. */
  holdings?: readonly HoldingRow[];
  onHolding?: (id: number) => void;
}

export interface HoldingRow {
  id: number;
  name: string;
  /** "Capital", "Colony", "Outpost". */
  kind: string;
  owner: FactionId;
  body: string;
  line: string;
  mine: boolean;
}

const COUNT = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'];

/** "A red dwarf", or "Three stars: a yellow dwarf, an orange dwarf and a red dwarf". */
export function describeStars(types: readonly string[]): string {
  const words = types.map(starKindWord);
  const an = (w: string) => (/^[aeiou]/.test(w) ? `an ${w}` : `a ${w}`);
  if (words.length === 1) return `${an(words[0] as string).replace(/^a/, 'A')}`;
  const list = words.map(an);
  const last = list.pop();
  return `${COUNT[words.length] ?? words.length} stars: ${list.join(', ')} and ${last}`;
}

/** An observed value and its uncertainty exactly as the archive gives them ("1.055 ± 0.055"). */
function measured(m: Measured | undefined, _digits?: number): string | null {
  if (!m) return null;
  return m.error !== undefined ? `${m.value} ± ${m.error}` : `${m.value}`;
}

/** "0.68 of the Sun’s light, 5,480 K", with the rule it came from. */
function StarLight({ star }: { star: SkyStar }) {
  const e = estimateStar(star.id, star.spectralType);
  const light =
    e.luminosity >= 0.1
      ? e.luminosity.toFixed(2)
      : e.luminosity >= 0.001
        ? e.luminosity.toFixed(4)
        : e.luminosity.toExponential(1);
  const why =
    e.basis === 'measured'
      ? null
      : e.basis === 'white-dwarf'
        ? 'from its type, as a white dwarf'
        : e.basis === 'assumed'
          ? 'its type is not catalogued: taken as a typical red dwarf'
          : `as a typical ${e.row} star`;
  return (
    <span class="star-light">
      {e.basis === 'measured' ? 'The Sun’s light' : `${light} of the Sun’s light`}, {e.teffK.toLocaleString('en-GB')} K{' '}
      <Badge kind={e.basis === 'measured' ? 'observed' : 'estimated'} />
      {why && <span class="dim"> {why}</span>}
    </span>
  );
}

function PlanetItem({ p }: { p: SkyPlanet }) {
  const orbit = measured(p.semiMajorAxisAu, 3);
  const period = measured(p.orbitalPeriodDays, 2);
  const mass = measured(p.massEarth, 2);
  const radius = measured(p.radiusEarth, 2);
  return (
    <li class="planet">
      <div class="planet-name">
        <b>{p.name}</b> <Badge kind={p.status === 'confirmed' ? 'observed' : 'disputed'} />
      </div>
      <dl>
        <dt>Orbit</dt>
        <dd>{orbit ? `${orbit} au` : 'unknown'}</dd>
        <dt>Year</dt>
        <dd>{period ? `${period} days` : 'unknown'}</dd>
        <dt>{p.massEarth?.qualifier?.startsWith('minimum') ? 'Mass, at least' : 'Mass'}</dt>
        <dd>{mass ? `${mass} Earths` : 'unknown'}</dd>
        <dt>Size</dt>
        <dd>{radius ? `${radius} Earth radii` : 'unknown'}</dd>
      </dl>
      <p class="note">
        {p.status !== 'confirmed' && <>{p.statusNote ?? 'Astronomers dispute this planet.'} </>}
        Found {p.discoveryYear ?? ''} {p.discoveryMethod ? `by ${p.discoveryMethod.toLowerCase()}` : ''}.{' '}
        <a href={p.source.url} target="_blank" rel="noreferrer">
          {p.source.label}
        </a>
      </p>
    </li>
  );
}

function WorldRow({
  b,
  species,
  held,
  onOpen,
}: {
  b: Body;
  species: SpeciesDef;
  held?: HoldingRow;
  onOpen: () => void;
}) {
  const h = habitability(b, species);
  return (
    <li class={`world-item${b.parent ? ' is-moon' : ''}`}>
      <button type="button" class="world-row" onClick={onOpen}>
        <span class={`world-glyph kind-${b.kind}`} aria-hidden="true" />
        <span class="world-name">
          {b.name} <Badge kind={bodyBadge(b)} />
        </span>
        <span class="world-line">
          {held && (
            <span class="world-held">
              {held.mine ? `Your ${held.kind.toLowerCase()}` : <FactionTag faction={held.owner} />} ·{' '}
            </span>
          )}
          {bodyLine(b)}
        </span>
        <span class={`hab hab-${h.level}`}>{HABITABILITY_WORD[h.level]}</span>
      </button>
    </li>
  );
}

export function SystemPanel({
  world,
  game,
  id,
  onGo,
  onCentre,
  onBody,
  species = SPECIES.human,
  realOnly,
  surveyed = true,
  ships,
  onShip,
  holdings = [],
  onHolding,
}: Props) {
  const system = world.system(id);
  const s = system.sky;
  const height = s.positionLy[2];
  const lanes = world.catalogueAt(id);
  const owners = new Map(game.lanes.map((l) => [l.id, l.owner]));
  const capitalOf = game.powers.find((p) => p.capital === id)?.faction;
  const heldBy = capitalOf ?? holdings[0]?.owner ?? lanes.map((l) => owners.get(l.id)).find((o) => o !== undefined);
  const heldBody = new Map(holdings.map((h) => [h.body, h]));
  // Charted only: astronomers' worlds (known planets, observed belts, all of Sol's), not the rest.
  const bodies = realOnly ? [] : bodiesOf(world, game.seed, id).filter((b) => surveyed || b.origin !== 'generated');

  return (
    <article class="system-panel" aria-label={s.name}>
      <header>
        <h2>{s.name}</h2>
        <p class="system-kind">{describeStars(s.stars.map((st) => st.spectralType))}</p>
        {heldBy && (
          <p class="held">
            <FactionTag faction={heldBy} /> ·{' '}
            {capitalOf ? 'its capital' : holdings.some((h) => h.owner === heldBy) ? 'settled' : 'in its home web'}{' '}
            <Badge kind="fiction" />
          </p>
        )}
        {onCentre && (
          <button type="button" class="button button-small" onClick={onCentre}>
            Centre on map
          </button>
        )}
      </header>

      {holdings.length > 0 && (
        <>
          <h3>Colonies and outposts</h3>
          <ul class="ships-here">
            {holdings.map((h) => (
              <li key={h.id}>
                {h.mine && onHolding ? (
                  <button type="button" class="ship-row holding-row" onClick={() => onHolding(h.id)}>
                    <b>{h.name}</b>
                    <span class="ship-type">{h.kind}</span>
                    <span class="ship-line">{h.line}</span>
                  </button>
                ) : (
                  <div class="ship-row holding-row">
                    <b>{h.name}</b>
                    <span class="ship-type">
                      <FactionTag faction={h.owner} /> {h.kind.toLowerCase()}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {ships && ships.length > 0 && (
        <>
          <h3>Your ships here</h3>
          <ul class="ships-here">
            {ships.map((sh) => (
              <li key={sh.id}>
                <button type="button" class="ship-row" onClick={() => onShip?.(sh.id)}>
                  <b>{sh.name}</b>
                  <span class="ship-type">{sh.kind}</span>
                  <span class="ship-line">{sh.status}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <dl class="facts">
        <dt>From Sol</dt>
        <dd>
          {id === 'sol'
            ? 'Home of humanity'
            : `${s.distanceLy.toFixed(2)} ly${s.distanceErrorLy ? ` ± ${s.distanceErrorLy.toFixed(3)}` : ''}`}{' '}
          <Badge kind="observed" />
        </dd>
        {id !== 'sol' && (
          <>
            <dt>Height</dt>
            <dd>
              {Math.abs(height) < 0.05
                ? 'in the plane of the celestial equator'
                : `${Math.abs(height).toFixed(1)} ly ${height > 0 ? 'north' : 'south'} of the celestial equator’s plane`}
            </dd>
          </>
        )}
      </dl>

      <h3>{s.stars.length === 1 ? 'The star' : 'The stars'}</h3>
      <ul class="stars">
        {s.stars.map((st) => (
          <li key={st.id}>
            <span class="star-dot" style={{ background: st.colorHex }} aria-hidden="true" />
            <b>{st.name}</b>, {starKindWord(st.spectralType)} ({st.spectralType})
            {st.flareVariable && <span class="flare-tag"> · flare star, {st.flareVariable}</span>}{' '}
            <a href={st.astrometrySource.url} target="_blank" rel="noreferrer">
              {st.astrometrySource.label}
            </a>
            <br />
            <StarLight star={st} />
          </li>
        ))}
      </ul>

      {realOnly ? (
        <>
          <h3>Known planets</h3>
          {s.planets.length > 0 ? (
            <ul class="planets">
              {s.planets.map((p) => (
                <PlanetItem key={p.id} p={p} />
              ))}
            </ul>
          ) : (
            <p class="none">Astronomers know of none. In a game, the worlds here are generated, and say so.</p>
          )}
          {s.belts.length > 0 && (
            <>
              <h3>Belts and discs</h3>
              <ul class="belts">
                {s.belts.map((b) => (
                  <li key={b.id}>
                    <b>{b.name}</b> <Badge kind="observed" /> {b.note}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : (
        <>
          <h3>
            Worlds <span class="dim">· for {species.name.toLowerCase()}</span>
          </h3>
          {bodies.length > 0 && (
            <ul class="worlds">
              {bodies.map((b) => (
                <WorldRow key={b.id} b={b} species={species} held={heldBody.get(b.id)} onOpen={() => onBody?.(b.id)} />
              ))}
            </ul>
          )}
          {surveyed ? (
            bodies.length === 0 && <p class="none">Nothing but the star.</p>
          ) : (
            <p class="none unsurveyed">
              Charted, not surveyed: {bodies.length > 0 ? 'these are the worlds astronomers know. ' : ''}Send a survey
              ship to find every world here.
            </p>
          )}
        </>
      )}

      <h3>
        Lanes <Badge kind="fiction" />
      </h3>
      <ul class="lanes">
        {lanes.map((l) => {
          const to = otherEnd(l.id, id);
          const owner = owners.get(l.id);
          return (
            <li key={l.id} class={owner ? 'lane-open' : 'lane-dark'}>
              <button type="button" class="link" onClick={() => onGo(to)}>
                {world.system(to).name}
              </button>
              <span>{formatLy(l.lengthDeci)}</span>
              {owner ? <FactionTag faction={owner} /> : <span class="dark">dark since the Lapse</span>}
            </li>
          );
        })}
      </ul>
    </article>
  );
}

/** A system and its worlds: the system panel, or one of its worlds with a way back. */
export function SystemView(props: Omit<Props, 'onBody' | 'realOnly'>) {
  const [body, setBody] = useState<string | null>(null);
  const bodies = bodiesOf(props.world, props.game.seed, props.id);
  const open = body ? bodies.find((b) => b.id === body) : undefined;
  if (open) {
    const held = props.holdings?.find((h) => h.body === open.id);
    return (
      <PlanetPanel
        body={open}
        siblings={bodies}
        species={props.species ?? SPECIES.human}
        systemName={props.world.system(props.id).name}
        onBack={() => setBody(null)}
        held={held}
        onHolding={props.onHolding}
      />
    );
  }
  return <SystemPanel {...props} onBody={setBody} />;
}
