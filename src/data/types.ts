// The shape of src/data/sky.json, the real sky copied from Starman Reborn (scripts/data/import-reborn.ts).
// Every value here is observed (with its source) or, for lanes, Reborn's fiction; nothing is invented
// for Control. Invented things (generated planets, the state of the lanes) are made by the simulation.

export type SystemId = string;

/** A citation for an observed value. */
export interface SourceRef {
  /** Short label shown in the interface, e.g. "Gaia DR3". */
  label: string;
  url: string;
  /** Record inside the source, e.g. "Gaia DR3 5853498713190525696". */
  recordId?: string;
  /** ISO date the record was retrieved. */
  retrieved?: string;
  /** ADS bibcode of the publication behind the value. */
  bibcode?: string;
}

/** Checked against the archives (`snapshot`), or transcribed and not yet checked (`provisional`). */
export type Verification = 'snapshot' | 'provisional';

export type Vec3 = [number, number, number];

/** A measured value with its uncertainty, as the archive gives it. */
export interface Measured {
  value: number;
  unit: string;
  /** Plus or minus, when the source gives one. */
  error?: number;
  /** e.g. "minimum mass (M sin i)". */
  qualifier?: string;
}

export interface SkyStar {
  id: string;
  name: string;
  role: 'primary' | 'companion';
  /** For a companion: the star it is grouped with. */
  parentId?: string;
  spectralType: string;
  spectralTypeSource: SourceRef;
  /** Display colour, an artistic choice from the spectral type (Reborn's). */
  colorHex: string;
  catalogIds: Partial<Record<'gaiaDr3' | 'hip' | 'simbad' | 'gliese', string>>;
  distanceLy: number;
  /** One-sigma uncertainty from the parallax, when known. */
  distanceErrorLy?: number;
  parallaxMas?: number;
  raDegrees?: number;
  decDegrees?: number;
  /** Sol-centred equatorial Cartesian light-years at the dataset's epoch. */
  positionLy: Vec3;
  astrometrySource: SourceRef;
  /** Only when the parallax comes from elsewhere than the position. */
  parallaxSource?: SourceRef;
  positionNote?: string;
  verification: Verification;
  /** Its variable-star name, when it is one of the catalogued flare stars Reborn flares. */
  flareVariable?: string;
}

/** What the archives say about a planet. Contested planets and candidates are kept, and say so. */
export type PlanetStatus = 'confirmed' | 'contested' | 'candidate';

export interface SkyPlanet {
  id: string;
  /** As the archive names it, e.g. "Proxima Cen b". */
  archiveName: string;
  name: string;
  hostId: string;
  status: PlanetStatus;
  /** For a contested planet or a candidate: what each archive says. */
  statusNote?: string;
  controversial: boolean;
  source: SourceRef;
  asOfDate: string;
  verification: Verification;
  discoveryYear?: number;
  discoveryMethod?: string;
  orbitalPeriodDays?: Measured;
  semiMajorAxisAu?: Measured;
  massEarth?: Measured;
  radiusEarth?: Measured;
  /** What nobody has measured, shown as unknown rather than invented. */
  unknowns: string[];
}

export interface SkyBelt {
  id: string;
  hostId: string;
  name: string;
  kind: 'asteroid-belt' | 'kuiper-belt' | 'debris-disc';
  innerAu?: number;
  outerAu?: number;
  sources: SourceRef[];
  note: string;
}

export interface SkySystem {
  id: SystemId;
  name: string;
  /** The primary star's catalogue identifier. */
  catalogId: string;
  /** The primary star's position. */
  positionLy: Vec3;
  distanceLy: number;
  distanceErrorLy?: number;
  /** Primary first. */
  stars: SkyStar[];
  planets: SkyPlanet[];
  belts: SkyBelt[];
}

export interface SkyDataset {
  format: 'starman-control-sky';
  version: 1;
  importedFrom: { repository: string; commit: string };
  description: string;
  /** Julian year of every position. */
  epoch: number;
  systems: SkySystem[];
  /** Reborn's jump network: each lane once, its two ends in order. Fiction. */
  lanes: [SystemId, SystemId][];
  /** laneFingerprint(lanes) when imported, so a changed network is noticed. */
  laneFingerprint: string;
}
