// The planet screen (§10, docs/design/M1_PLANETS.md §6): every attribute of a world with where it
// comes from, and how habitable it is for the player's species, with the reasons.

import type { ComponentChildren } from 'preact';
import type { SpeciesDef } from '../../content/species.ts';
import type { Measured } from '../../data/types.ts';
import type { Attribute, Body, FactKind } from '../../sim/bodies.ts';
import { habitability } from '../../sim/habitability.ts';
import { Badge, type BadgeKind, FactionTag } from '../parts.tsx';
import type { HoldingRow } from './SystemPanel.tsx';
import {
  ATMOSPHERE_WORD,
  auWord,
  HABITABILITY_HELP,
  HABITABILITY_WORD,
  KIND_WORD,
  reasonWord,
  richnessWord,
  WATER_WORD,
} from './words.ts';

/** The badge for a whole body: observed, disputed (a contested planet) or fiction. */
export function bodyBadge(b: Body): BadgeKind {
  if (b.origin === 'generated') return 'fiction';
  if (b.planet && b.planet.status !== 'confirmed') return 'disputed';
  return 'observed';
}

/** An observed value and its uncertainty exactly as the archive gives them ("1.055 ± 0.055"). */
function measured(m: Measured | undefined, _digits?: number): string | null {
  if (!m) return null;
  return m.error !== undefined ? `${m.value} ± ${m.error}` : `${m.value}`;
}

function Fact({ label, kind, children }: { label: string; kind: FactKind; children: ComponentChildren }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>
        {children} <Badge kind={kind} />
      </dd>
    </>
  );
}

interface Props {
  body: Body;
  /** The bodies of its system, to name a moon's planet. */
  siblings: readonly Body[];
  species: SpeciesDef;
  systemName: string;
  onBack: () => void;
  /** A colony or outpost on it, and how to open the player's own. */
  held?: HoldingRow;
  onHolding?: (id: number) => void;
}

export function PlanetPanel({ body: b, siblings, species, systemName, onBack, held, onHolding }: Props) {
  const h = habitability(b, species);
  const f = (a: Attribute) => b.facts[a];
  const p = b.planet;
  const parent = b.parent ? siblings.find((x) => x.id === b.parent) : undefined;
  const solid = b.kind !== 'belt' && b.kind !== 'gas-giant' && b.kind !== 'ice-giant' && b.kind !== 'mini-neptune';
  return (
    <article class="planet-panel" aria-label={b.name}>
      <button type="button" class="link back-link" onClick={onBack}>
        ← {systemName}
      </button>
      <header>
        <h2>{b.name}</h2>
        <p class="system-kind">
          {parent ? `A moon of ${parent.name}` : `A ${KIND_WORD[b.kind]}`} <Badge kind={bodyBadge(b)} />
        </p>
      </header>

      {held && (
        <p class="held">
          {held.mine && onHolding ? (
            <button type="button" class="button button-small" onClick={() => onHolding(held.id)}>
              Open your {held.kind.toLowerCase()} here
            </button>
          ) : (
            <>
              <FactionTag faction={held.owner} /> · {held.kind.toLowerCase()} here <Badge kind="fiction" />
            </>
          )}
        </p>
      )}

      <section class={`habitability hab-${h.level}`} aria-label={`For ${species.name.toLowerCase()}`}>
        <p>
          <b>
            For {species.name.toLowerCase()}: {HABITABILITY_WORD[h.level]}
          </b>
          , {HABITABILITY_HELP[h.level]}.
        </p>
        {h.reasons.length > 0 && <p class="reasons">{h.reasons.map(reasonWord).join(' · ')}</p>}
        <p class="reasons">
          {h.capacity > 0 ? `Room for about ${h.capacity} million people.` : 'Room for no one to live there.'}
        </p>
      </section>

      <dl class="facts">
        <Fact label={parent ? 'Its planet’s orbit' : 'Orbit'} kind={f('orbit')}>
          {p?.semiMajorAxisAu ? `${measured(p.semiMajorAxisAu, 3)} au` : auWord(b.orbitMilliAu)}
        </Fact>
        {p?.orbitalPeriodDays && (
          <Fact label="Year" kind="observed">
            {measured(p.orbitalPeriodDays, 2)} days
          </Fact>
        )}
        {b.massCenti !== null && (
          <Fact label={p?.massEarth?.qualifier?.startsWith('minimum') ? 'Mass, at least' : 'Mass'} kind={f('mass')}>
            {p?.massEarth ? measured(p.massEarth, 2) : (b.massCenti / 100).toFixed(2)} Earths
          </Fact>
        )}
        {b.radiusCenti !== null && (
          <Fact label="Radius" kind={f('radius')}>
            {p?.radiusEarth ? measured(p.radiusEarth, 2) : (b.radiusCenti / 100).toFixed(2)} Earths
          </Fact>
        )}
        <Fact label="Kind" kind={f('kind')}>
          {KIND_WORD[b.kind]}, size {b.size} of 12
        </Fact>
        {solid && (
          <Fact label="Gravity" kind={f('gravity')}>
            {b.gravity}
          </Fact>
        )}
        <Fact label="Temperature" kind={f('temperature')}>
          {b.temperature}, {b.surfaceK} K
          {b.kind === 'gas-giant' || b.kind === 'ice-giant' ? ' at the cloud tops' : ' at the surface'}
        </Fact>
        {b.origin !== 'sol' && (
          <Fact label="Lit to" kind="estimated">
            {b.equilibriumK} K by its star alone
          </Fact>
        )}
        {b.kind !== 'belt' && (
          <Fact label="Atmosphere" kind={f('atmosphere')}>
            {ATMOSPHERE_WORD[b.atmosphere]}
          </Fact>
        )}
        <Fact label="Water" kind={f('water')}>
          {WATER_WORD[b.water]}
        </Fact>
        {b.locked && (
          <Fact label="Day" kind={f('locked')}>
            tidally locked: one face always to its star
          </Fact>
        )}
        {b.flareExposed && (
          <Fact label="Flares" kind={f('flare')}>
            exposed: its star is a flare star
          </Fact>
        )}
        <Fact label="Riches" kind={f('riches')}>
          metals {richnessWord(b.riches.metals)}, volatiles {richnessWord(b.riches.volatiles)}, fusion fuel{' '}
          {richnessWord(b.riches.fuel)}
        </Fact>
      </dl>

      {p && (
        <p class="note">
          {p.status !== 'confirmed' && <>{p.statusNote ?? 'Astronomers dispute this planet.'} </>}
          Found {p.discoveryYear ?? ''}
          {p.discoveryMethod ? ` by ${p.discoveryMethod.toLowerCase()}` : ''}.{' '}
          <a href={p.source.url} target="_blank" rel="noreferrer">
            {p.source.label}
          </a>
        </p>
      )}
      {b.note && (
        <p class="note">
          {b.note}{' '}
          {b.source && (
            <a href={b.source.url} target="_blank" rel="noreferrer">
              {b.source.label}
            </a>
          )}
        </p>
      )}
      {b.origin === 'generated' && (
        <p class="note">
          No one has observed this world: the game made it from its star’s real type and this game’s seed.
        </p>
      )}
    </article>
  );
}
