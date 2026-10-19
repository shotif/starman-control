// The system screen (§10): a star system's real data, with where each fact comes from, and its
// lanes. The same content on both layouts: a bottom sheet on a phone, the inspector on a desktop.

import type { Measured, SkyPlanet, SystemId } from '../../data/types.ts';
import { formatLy } from '../../sim/geometry.ts';
import { starKindWord } from '../../sim/stars.ts';
import type { GameState } from '../../sim/state.ts';
import { otherEnd, type World } from '../../sim/world.ts';
import { Badge, FactionTag } from '../parts.tsx';
import './system.css';

interface Props {
  world: World;
  game: GameState;
  id: SystemId;
  /** Go to another system (its name in the lane list). */
  onGo: (id: SystemId) => void;
  /** Centre the map on this system; absent where there is no map. */
  onCentre?: () => void;
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

function measured(m: Measured | undefined, digits: number): string | null {
  if (!m) return null;
  const v = m.value.toFixed(digits);
  return m.error !== undefined ? `${v} ± ${m.error.toFixed(digits)}` : v;
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

export function SystemPanel({ world, game, id, onGo, onCentre }: Props) {
  const system = world.system(id);
  const s = system.sky;
  const height = s.positionLy[2];
  const lanes = world.catalogueAt(id);
  const owners = new Map(game.lanes.map((l) => [l.id, l.owner]));
  const capitalOf = game.powers.find((p) => p.capital === id)?.faction;
  const heldBy = capitalOf ?? lanes.map((l) => owners.get(l.id)).find((o) => o !== undefined);

  return (
    <article class="system-panel" aria-label={s.name}>
      <header>
        <h2>{s.name}</h2>
        <p class="system-kind">{describeStars(s.stars.map((st) => st.spectralType))}</p>
        {heldBy && (
          <p class="held">
            <FactionTag faction={heldBy} /> · {capitalOf ? 'its capital' : 'in its home web'} <Badge kind="fiction" />
          </p>
        )}
        {onCentre && (
          <button type="button" class="button button-small" onClick={onCentre}>
            Centre on map
          </button>
        )}
      </header>

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
          </li>
        ))}
      </ul>

      <h3>Known planets</h3>
      {s.planets.length > 0 ? (
        <ul class="planets">
          {s.planets.map((p) => (
            <PlanetItem key={p.id} p={p} />
          ))}
        </ul>
      ) : (
        <p class="none">
          Astronomers know of none. Every world here will be found by survey, and labelled <Badge kind="fiction" />.
        </p>
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
