// Every world in a system (docs/design/M1_PLANETS.md): the known planets as astronomers measure
// them, Sol's bodies as NASA gives them, and generated bodies, labelled Fiction, made from the
// star's real type and the game's seed. Each attribute says where it comes from.
//
// Deterministic on every device (D-06): whole numbers, the seeded streams, and only +, −, ×, ÷ and
// square roots (exactly rounded everywhere) on stored numbers.

import { SOL_BODIES, type SolBody } from '../content/sol.ts';
import type { SkyPlanet, SkyStar, SourceRef, SystemId } from '../data/types.ts';
import { type Rng, rng } from './rng.ts';
import { estimateStar } from './starLight.ts';
import { type StarClass, starClass } from './stars.ts';
import type { World, WorldSystem } from './world.ts';

export type BodyKind = 'rocky' | 'super-earth' | 'mini-neptune' | 'ice-giant' | 'gas-giant' | 'dwarf' | 'moon' | 'belt';
export type TempBand = 'frozen' | 'cold' | 'temperate' | 'warm' | 'hot' | 'scorching';
export type Atmosphere = 'none' | 'thin' | 'dense' | 'toxic';
export type Water = 'none' | 'ice' | 'oceans';
export type Gravity = 'low' | 'normal' | 'high';
/** None, poor or rich. */
export type Richness = 0 | 1 | 2;
export type FactKind = 'observed' | 'estimated' | 'fiction';

export type Attribute =
  | 'orbit'
  | 'mass'
  | 'radius'
  | 'kind'
  | 'temperature'
  | 'atmosphere'
  | 'water'
  | 'gravity'
  | 'locked'
  | 'flare'
  | 'riches';

export interface Body {
  id: string;
  systemId: SystemId;
  name: string;
  /** The star it circles (a moon: its planet's star). */
  star: string;
  /** For a moon, the planet it circles. */
  parent?: string;
  origin: 'known' | 'sol' | 'generated';
  kind: BodyKind;
  /** Thousandths of an au from its star (a moon: its planet's distance). */
  orbitMilliAu: number;
  /** Hundredths of Earth's; null for belts. */
  massCenti: number | null;
  radiusCenti: number | null;
  /** Kelvin. */
  equilibriumK: number;
  surfaceK: number;
  temperature: TempBand;
  atmosphere: Atmosphere;
  water: Water;
  gravity: Gravity;
  /** 1 to 12: the number of districts it will have in M2. */
  size: number;
  /** Tidally locked to its star. */
  locked: boolean;
  flareExposed: boolean;
  riches: { metals: Richness; volatiles: Richness; fuel: Richness };
  facts: Record<Attribute, FactKind>;
  /** The archive record of a known planet. */
  planet?: SkyPlanet;
  /** For Sol's bodies and observed belts: what is real about it, and where that is from. */
  note?: string;
  source?: SourceRef;
}

const BANDS: readonly [number, TempBand][] = [
  [180, 'frozen'],
  [260, 'cold'],
  [310, 'temperate'],
  [370, 'warm'],
  [600, 'hot'],
];

export function temperatureBand(kelvin: number): TempBand {
  for (const [limit, band] of BANDS) if (kelvin < limit) return band;
  return 'scorching';
}

const GREENHOUSE: Record<Atmosphere, number> = { none: 0, thin: 5, dense: 35, toxic: 400 };

/** 255 K × L^¼ ÷ √a: a body's equilibrium temperature with Earth's reflectivity. */
export function equilibriumK(luminosity: number, orbitMilliAu: number): number {
  return Math.round((255 * Math.sqrt(Math.sqrt(luminosity))) / Math.sqrt(orbitMilliAu / 1000));
}

/** Mass over radius squared, in Earth's gravity: below 0.6 low, above 1.5 high. */
export function gravityOf(massCenti: number | null, radiusCenti: number | null): Gravity {
  if (!massCenti || !radiusCenti) return 'normal';
  const g100 = (massCenti * 100 * 100) / (radiusCenti * radiusCenti);
  return g100 < 60 ? 'low' : g100 > 150 ? 'high' : 'normal';
}

export function sizeOf(kind: BodyKind, radiusCenti: number | null): number {
  if (kind === 'gas-giant') return 12;
  if (kind === 'ice-giant') return 11;
  if (kind === 'mini-neptune') return 9;
  if (kind === 'belt') return 3;
  return Math.max(1, Math.min(10, Math.round((7 * (radiusCenti ?? 100)) / 100)));
}

/** A known planet's kind, by its radius where measured, else by its mass (§4). */
export function kindOfKnown(massEarth: number | undefined, radiusEarth: number | undefined): BodyKind {
  if (radiusEarth !== undefined) {
    if (radiusEarth < 1.6) return 'rocky';
    if (radiusEarth < 4) return massEarth !== undefined && massEarth > 10 ? 'mini-neptune' : 'super-earth';
    if (radiusEarth < 8) return 'ice-giant';
    return 'gas-giant';
  }
  const m = massEarth ?? 1;
  if (m < 2) return 'rocky';
  if (m < 10) return 'super-earth';
  if (m < 30) return 'mini-neptune';
  if (m < 80) return 'ice-giant';
  return 'gas-giant';
}

/** A radius in hundredths of Earth's from a mass, when no one has measured it (§1). */
export function radiusFromMass(massCenti: number): number {
  const m = massCenti / 100;
  if (m <= 10) return Math.round(100 * Math.sqrt(Math.sqrt(m)));
  if (m <= 120) return Math.round(65 * Math.sqrt(m));
  return 1100;
}

function lockRadiusMilliAu(cls: StarClass): number {
  return cls === 'M' ? 300 : cls === 'K' ? 100 : 50;
}

const SOLID: ReadonlySet<BodyKind> = new Set(['rocky', 'super-earth', 'moon', 'dwarf']);

/** Atmosphere, water and riches for a body that nobody has observed that closely (Fiction). */
function invent(
  r: Rng,
  kind: BodyKind,
  massCenti: number | null,
  equilibrium: number,
  flare: boolean,
): { atmosphere: Atmosphere; surfaceK: number; water: Water; riches: Body['riches'] } {
  let atmosphere: Atmosphere;
  if (kind === 'belt') atmosphere = 'none';
  else if (!SOLID.has(kind)) atmosphere = 'dense';
  else {
    const m = massCenti ?? 100;
    const hot = equilibrium > 320;
    const weights: [Atmosphere, number][] =
      m < 20
        ? [
            ['none', 8],
            ['thin', 2],
            ['dense', equilibrium < 150 ? 1 : 0],
          ]
        : m < 60
          ? [
              ['none', 2],
              ['thin', 2],
              ['dense', 1],
            ]
          : [
              ['none', 1 + (equilibrium > 600 ? 4 : 0)],
              ['thin', 2],
              ['dense', 4],
              ['toxic', 1 + (hot ? 3 : 0)],
            ];
    if (flare) weights[0] = ['none', weights[0][1] + 2];
    atmosphere = r.weighted(weights);
  }
  const surfaceK = equilibrium + GREENHOUSE[atmosphere];
  let water: Water = 'none';
  if (SOLID.has(kind) || kind === 'belt') {
    if (surfaceK < 273) water = r.chance(3, 4) ? 'ice' : 'none';
    else if (surfaceK < 373)
      water = atmosphere === 'none' ? (r.chance(1, 2) ? 'ice' : 'none') : r.chance(3, 4) ? 'oceans' : 'none';
  }
  const pick = (w: [Richness, number][]) => r.weighted(w);
  let riches: Body['riches'];
  switch (kind) {
    case 'rocky':
    case 'super-earth':
      riches = {
        metals: pick([
          [0, 1],
          [1, 3],
          [2, 2],
        ]),
        volatiles: water === 'none' ? 0 : 1,
        fuel: 0,
      };
      break;
    case 'moon':
    case 'dwarf':
      riches = {
        metals: pick([
          [0, 2],
          [1, 2],
        ]),
        volatiles:
          surfaceK < 200
            ? pick([
                [1, 1],
                [2, 2],
              ])
            : 0,
        fuel: 0,
      };
      break;
    case 'belt':
      riches = {
        metals: pick([
          [1, 1],
          [2, 2],
        ]),
        volatiles: water === 'ice' ? 2 : 0,
        fuel: 0,
      };
      break;
    case 'gas-giant':
      riches = { metals: 0, volatiles: 0, fuel: 2 };
      break;
    case 'ice-giant':
      riches = { metals: 0, volatiles: 2, fuel: 1 };
      break;
    default:
      riches = { metals: 0, volatiles: 1, fuel: 1 };
  }
  return { atmosphere, surfaceK, water, riches };
}

const LETTERS = 'bcdefghijklmnopqrstuvwxyz';
const ROMAN = ['I', 'II', 'III', 'IV'];

interface Host {
  star: SkyStar;
  cls: StarClass;
  luminosity: number;
  flare: boolean;
}

function host(star: SkyStar): Host {
  return {
    star,
    cls: starClass(star.spectralType),
    luminosity: estimateStar(star.id, star.spectralType).luminosity,
    flare: star.flareVariable !== undefined,
  };
}

function finish(
  base: Omit<Body, 'equilibriumK' | 'temperature' | 'gravity' | 'size' | 'locked' | 'flareExposed' | 'surfaceK'> & {
    surfaceK?: number;
  },
  h: Host,
  equilibrium: number,
): Body {
  const surfaceK = base.surfaceK ?? equilibrium;
  return {
    ...base,
    equilibriumK: equilibrium,
    surfaceK,
    temperature: temperatureBand(surfaceK),
    gravity: gravityOf(base.massCenti, base.radiusCenti),
    size: sizeOf(base.kind, base.radiusCenti),
    locked: base.kind !== 'moon' && base.kind !== 'belt' && base.orbitMilliAu < lockRadiusMilliAu(h.cls),
    flareExposed: h.flare && base.kind !== 'belt',
  };
}

function solBodies(seed: number, system: WorldSystem): Body[] {
  const sun = system.sky.stars[0] as SkyStar;
  const h = host(sun);
  return SOL_BODIES.map((b: SolBody) => {
    const massCenti = b.mass !== undefined ? Math.round(b.mass * 100) : null;
    const radiusCenti = b.radius !== undefined ? Math.round(b.radius * 100) : null;
    const orbit = Math.round(b.orbitAu * 1000);
    const eq = equilibriumK(1, orbit);
    const r = rng(seed, 'bodies', 'sol', b.id);
    const riches = invent(r, b.kind, massCenti, eq, false).riches;
    const facts: Record<Attribute, FactKind> = {
      orbit: 'observed',
      mass: 'observed',
      radius: 'observed',
      kind: 'observed',
      temperature: 'observed',
      atmosphere: 'observed',
      water: 'observed',
      gravity: 'observed',
      locked: 'observed',
      flare: 'observed',
      riches: 'fiction',
    };
    return finish(
      {
        id: b.id,
        systemId: 'sol',
        name: b.name,
        star: sun.id,
        ...(b.parent ? { parent: b.parent } : {}),
        origin: 'sol',
        kind: b.kind,
        orbitMilliAu: orbit,
        massCenti,
        radiusCenti,
        surfaceK: b.surfaceTempK ?? eq,
        atmosphere: b.atmosphere,
        water: b.water,
        riches,
        facts,
        note: b.note,
        source: b.source,
      },
      h,
      eq,
    );
  });
}

function knownPlanet(seed: number, system: WorldSystem, p: SkyPlanet, h: Host): Body {
  const r = rng(seed, 'bodies', system.id, p.id);
  const mass = p.massEarth?.value;
  const radius = p.radiusEarth?.value;
  const kind = kindOfKnown(mass, radius);
  const massCenti = mass !== undefined ? Math.round(mass * 100) : null;
  const radiusCenti =
    radius !== undefined ? Math.round(radius * 100) : massCenti !== null ? radiusFromMass(massCenti) : null;
  // An orbit the archive lacks is placed from the period if it gives one, else at 0.05 au.
  const orbit = p.semiMajorAxisAu ? Math.max(1, Math.round(p.semiMajorAxisAu.value * 1000)) : 50;
  const eq = equilibriumK(h.luminosity, orbit);
  const made = invent(r, kind, massCenti, eq, h.flare);
  return finish(
    {
      id: p.id,
      systemId: system.id,
      name: p.name,
      star: h.star.id,
      origin: 'known',
      kind,
      orbitMilliAu: orbit,
      massCenti,
      radiusCenti,
      surfaceK: made.surfaceK,
      atmosphere: made.atmosphere,
      water: made.water,
      riches: made.riches,
      facts: {
        orbit: p.semiMajorAxisAu ? 'observed' : 'fiction',
        mass: mass !== undefined ? 'observed' : 'fiction',
        radius: radius !== undefined ? 'observed' : 'estimated',
        kind: 'estimated',
        temperature: 'fiction',
        atmosphere: 'fiction',
        water: 'fiction',
        gravity: 'estimated',
        locked: 'estimated',
        flare: 'estimated',
        riches: 'fiction',
      },
      planet: p,
    },
    h,
    eq,
  );
}

const FICTION: Record<Attribute, FactKind> = {
  orbit: 'fiction',
  mass: 'fiction',
  radius: 'fiction',
  kind: 'fiction',
  temperature: 'fiction',
  atmosphere: 'fiction',
  water: 'fiction',
  gravity: 'fiction',
  locked: 'fiction',
  flare: 'estimated',
  riches: 'fiction',
};

/** How many planets, and how likely a belt, around each kind of star (§3). */
function plan(r: Rng, cls: StarClass): { planets: number; belt: boolean } {
  switch (cls) {
    case 'M':
    case '?':
      return { planets: r.int(1, 4), belt: r.chance(1, 4) };
    case 'K':
    case 'G':
      return { planets: r.int(2, 7), belt: r.chance(1, 2) };
    case 'A':
    case 'F':
    case 'B':
    case 'O':
      return { planets: r.int(1, 4), belt: r.chance(3, 5) };
    case 'D':
      return { planets: r.chance(1, 8) ? 1 : 0, belt: r.chance(7, 10) };
    default:
      return { planets: r.int(0, 2), belt: false };
  }
}

function generatedKind(r: Rng, cls: StarClass, beyondSnow: boolean): BodyKind {
  if (cls === 'L' || cls === 'T' || cls === 'Y')
    return r.weighted([
      ['rocky', 2],
      ['dwarf', 1],
    ]);
  if (cls === 'M' || cls === '?')
    return beyondSnow
      ? r.weighted([
          ['super-earth', 3],
          ['dwarf', 2],
          ['ice-giant', 1],
          ['gas-giant', 1],
        ])
      : r.weighted([
          ['rocky', 6],
          ['super-earth', 5],
          ['mini-neptune', 1],
        ]);
  if (cls === 'A' || cls === 'F' || cls === 'B' || cls === 'O' || cls === 'D')
    return beyondSnow
      ? r.weighted([
          ['gas-giant', 5],
          ['ice-giant', 3],
          ['dwarf', 1],
        ])
      : r.weighted([
          ['rocky', 2],
          ['super-earth', 2],
          ['gas-giant', 2],
        ]);
  return beyondSnow
    ? r.weighted([
        ['gas-giant', 4],
        ['ice-giant', 4],
        ['mini-neptune', 2],
        ['super-earth', 1],
        ['dwarf', 1],
      ])
    : r.weighted([
        ['rocky', 5],
        ['super-earth', 4],
        ['mini-neptune', 2],
        ['gas-giant', 1],
      ]);
}

function massFor(r: Rng, kind: BodyKind): { massCenti: number | null; radiusCenti: number | null } {
  switch (kind) {
    case 'rocky': {
      const m = r.int(10, 180);
      return { massCenti: m, radiusCenti: radiusFromMass(m) };
    }
    case 'super-earth': {
      const m = r.int(180, 1000);
      return { massCenti: m, radiusCenti: radiusFromMass(m) };
    }
    case 'mini-neptune':
      return { massCenti: r.int(300, 2500), radiusCenti: r.int(180, 390) };
    case 'ice-giant':
      return { massCenti: r.int(1000, 6000), radiusCenti: r.int(330, 550) };
    case 'gas-giant':
      return { massCenti: r.int(6000, 300000), radiusCenti: r.int(800, 1300) };
    case 'dwarf':
      return { massCenti: r.int(1, 3), radiusCenti: r.int(15, 30) };
    case 'moon':
      return { massCenti: r.int(1, 5), radiusCenti: r.int(20, 45) };
    default:
      return { massCenti: null, radiusCenti: null };
  }
}

/** Whether an orbit is within a factor of 1.3 of any of `taken`. */
function tooClose(orbit: number, taken: readonly number[]): boolean {
  return taken.some((k) => orbit * 10 <= k * 13 && orbit * 13 >= k * 10);
}

function generate(seed: number, system: WorldSystem, h: Host, known: readonly Body[]): Body[] {
  const r = rng(seed, 'bodies', system.id);
  const { planets, belt } = plan(r, h.cls);
  const sqrtL = Math.sqrt(h.luminosity);
  const snow = Math.round(2700 * sqrtL);
  const taken = known.filter((b) => b.star === h.star.id && !b.parent).map((b) => b.orbitMilliAu);
  // Letters run on after the highest a real planet here has (skipped letters were often candidates
  // that were later withdrawn, such as Tau Ceti b, c and d), so fiction never reuses a real name.
  const highest = Math.max(0, ...known.map((b) => LETTERS.indexOf(b.name.slice(-1)) + 1));
  const letters = [...LETTERS.slice(highest)];
  const out: Body[] = [];
  // Brown dwarfs give almost no light: their few worlds lie out where they are cold (§3).
  const dim = h.cls === 'L' || h.cls === 'T' || h.cls === 'Y';
  let orbit = dim ? r.int(20, 60) : Math.max(5, Math.round(r.int(250, 500) * sqrtL));
  let made = 0;
  for (let attempt = 0; made < planets && attempt < planets + 4; attempt++) {
    if (attempt > 0) orbit = Math.floor((orbit * r.int(140, 220)) / 100);
    if (tooClose(orbit, taken)) continue;
    const kind = generatedKind(r, h.cls, orbit > snow);
    const { massCenti, radiusCenti } = massFor(r, kind);
    const eq = equilibriumK(h.luminosity, orbit);
    const inv = invent(r, kind, massCenti, eq, h.flare);
    out.push(
      finish(
        {
          id: `${system.id}:${made + 1}`,
          systemId: system.id,
          name: `${h.star.name} ${letters[made] ?? `${made + 1}`}`,
          star: h.star.id,
          origin: 'generated',
          kind,
          orbitMilliAu: orbit,
          massCenti,
          radiusCenti,
          surfaceK: inv.surfaceK,
          atmosphere: inv.atmosphere,
          water: inv.water,
          riches: inv.riches,
          facts: FICTION,
        },
        h,
        eq,
      ),
    );
    taken.push(orbit);
    made++;
  }
  // A belt, unless astronomers already see one here.
  if (belt && system.sky.belts.length === 0) {
    const at = Math.max(20, Math.round(r.int(1500, 4500) * sqrtL));
    const eq = equilibriumK(h.luminosity, at);
    const inv = invent(r, 'belt', null, eq, h.flare);
    out.push(
      finish(
        {
          id: `${system.id}:belt`,
          systemId: system.id,
          name: `${h.star.name} belt`,
          star: h.star.id,
          origin: 'generated',
          kind: 'belt',
          orbitMilliAu: at,
          massCenti: null,
          radiusCenti: null,
          surfaceK: inv.surfaceK,
          atmosphere: 'none',
          water: inv.water,
          riches: inv.riches,
          facts: FICTION,
        },
        h,
        eq,
      ),
    );
  }
  return out;
}

/** The large moons of a giant: 0 to 3, generated (Fiction), whether the giant is known or not. */
function moonsOf(seed: number, giant: Body, h: Host): Body[] {
  if (giant.kind !== 'gas-giant' && giant.kind !== 'ice-giant') return [];
  const r = rng(seed, 'moons', giant.id);
  const n = r.int(0, 3);
  const out: Body[] = [];
  for (let i = 0; i < n; i++) {
    const { massCenti, radiusCenti } = massFor(r, 'moon');
    const inv = invent(r, 'moon', massCenti, giant.equilibriumK, h.flare);
    out.push(
      finish(
        {
          id: `${giant.id}:${i + 1}`,
          systemId: giant.systemId,
          name: `${giant.name} ${ROMAN[i]}`,
          star: giant.star,
          parent: giant.id,
          origin: 'generated',
          kind: 'moon',
          orbitMilliAu: giant.orbitMilliAu,
          massCenti,
          radiusCenti,
          surfaceK: inv.surfaceK,
          atmosphere: inv.atmosphere,
          water: inv.water,
          riches: inv.riches,
          facts: FICTION,
        },
        h,
        giant.equilibriumK,
      ),
    );
  }
  return out;
}

function observedBelt(system: WorldSystem, h: Host, b: WorldSystem['sky']['belts'][number]): Body {
  const beltHost = system.sky.stars.find((s) => s.id === b.hostId) ?? h.star;
  const bh = host(beltHost);
  const at =
    b.innerAu !== undefined && b.outerAu !== undefined
      ? Math.round(((b.innerAu + b.outerAu) / 2) * 1000)
      : Math.max(20, Math.round(3000 * Math.sqrt(bh.luminosity)));
  const eq = equilibriumK(bh.luminosity, at);
  const water: Water = eq < 200 ? 'ice' : 'none';
  return finish(
    {
      id: b.id,
      systemId: system.id,
      name: b.name,
      star: beltHost.id,
      origin: 'known',
      kind: 'belt',
      orbitMilliAu: at,
      massCenti: null,
      radiusCenti: null,
      atmosphere: 'none',
      water,
      riches: { metals: 2, volatiles: water === 'ice' ? 2 : 0, fuel: 0 },
      facts: {
        ...FICTION,
        orbit: b.innerAu !== undefined ? 'observed' : 'fiction',
        kind: 'observed',
        temperature: 'estimated',
        water: 'estimated',
      },
      note: b.note,
      source: b.sources[0],
    },
    bh,
    eq,
  );
}

/** Orders a system's bodies outward from the star, each giant followed by its moons. */
function order(bodies: Body[]): Body[] {
  const top = bodies.filter((b) => !b.parent).sort((a, b) => a.orbitMilliAu - b.orbitMilliAu || (a.id < b.id ? -1 : 1));
  return top.flatMap((b) => [b, ...bodies.filter((m) => m.parent === b.id)]);
}

/**
 * Worlds the game keeps in every game, whatever the seed (M5_UNKNOWN.md §27.1): the Forge of the machine
 * heirs at GJ 3306, a real white dwarf with no planet known. All of it is fiction.
 */
const KEPT: Partial<Record<SystemId, { name: string; orbitMilliAu: number; massCenti: number; radiusCenti: number }>> =
  {
    'gj-3306': { name: 'The Forge', orbitMilliAu: 9, massCenti: 70, radiusCenti: 90 },
  };

/** A kept world (§27.1), airless and rich in metals. */
function keptWorld(system: WorldSystem, h: Host): Body | null {
  const k = KEPT[system.id];
  if (!k) return null;
  return finish(
    {
      id: `${system.id}:forge`,
      systemId: system.id,
      name: k.name,
      star: h.star.id,
      origin: 'generated',
      kind: 'rocky',
      orbitMilliAu: k.orbitMilliAu,
      massCenti: k.massCenti,
      radiusCenti: k.radiusCenti,
      atmosphere: 'none',
      water: 'none',
      riches: { metals: 2, volatiles: 0, fuel: 1 },
      facts: FICTION,
    },
    h,
    equilibriumK(h.luminosity, k.orbitMilliAu),
  );
}

/** Every body of one system for a game's seed. */
export function generateSystemBodies(seed: number, system: WorldSystem): Body[] {
  if (system.id === 'sol') return order(solBodies(seed, system));
  const primary = host(system.sky.stars[0] as SkyStar);
  const hosts = new Map(system.sky.stars.map((s) => [s.id, host(s)]));
  const known = system.sky.planets.map((p) => knownPlanet(seed, system, p, hosts.get(p.hostId) ?? primary));
  const belts = system.sky.belts.map((b) => observedBelt(system, primary, b));
  const kept = keptWorld(system, primary);
  // The generated worlds are as they would be without it, so no name or orbit changes in any seed.
  const made = generate(seed, system, primary, known);
  const planets = [...known, ...(kept ? [kept] : []), ...made];
  const moons = planets.flatMap((p) => moonsOf(seed, p, hosts.get(p.star) ?? primary));
  return order([...planets, ...belts, ...moons]);
}

const cache = new WeakMap<World, Map<number, Map<SystemId, Body[]>>>();

/** A system's bodies in a game with this seed, made once and kept. */
export function bodiesOf(world: World, seed: number, systemId: SystemId): readonly Body[] {
  let bySeed = cache.get(world);
  if (!bySeed) {
    bySeed = new Map();
    cache.set(world, bySeed);
  }
  let bySystem = bySeed.get(seed);
  if (!bySystem) {
    bySystem = new Map();
    bySeed.set(seed, bySystem);
  }
  let list = bySystem.get(systemId);
  if (!list) {
    list = generateSystemBodies(seed, world.system(systemId));
    bySystem.set(systemId, list);
  }
  return list;
}
