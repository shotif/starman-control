// What to paint. A brief names a series (its style is in art/styles.ts) and a subject. Everything a
// brief depicts is fiction; real astronomy in a picture must match the real sky (CLAUDE.md).

import type { ArchitectureId } from '../src/content/factions.ts';
import type { SeriesId } from './styles.ts';

export interface ArtBrief {
  /** Unique, lowercase words joined by hyphens; also the published file name. */
  id: string;
  series: SeriesId;
  /** What is in the picture: who or what, doing what, where. */
  subject: string;
  /** Why the game needs it, for the reviewer; not sent to the model. */
  purpose: string;
}

/**
 * Each power's architecture (D-28, COLONY_VIEW.md §3), written once and put into every brief for
 * its buildings, so they look like one people built them. Every building is fiction.
 */
export const ARCHITECTURE: Record<ArchitectureId, string> = {
  authority:
    'In the architecture of the Sol Transit Authority: civic and orderly, standardised prefabricated modules ' +
    'on a strict grid, pale grey ceramic panels and brushed metal, flat roofs, neat rows of square windows, ' +
    'slim green guide lights along the edges; tidy and well kept.',
  cooperative:
    'In the architecture of the Frontier Cooperative: rounded and hand-built, low curved buildings printed ' +
    'from the local soil in warm sand and terracotta tones, round windows, white fabric awnings and small solar ' +
    'sails, planters with greenery; communal and lived-in, with soft blue lights.',
  wake:
    'In the architecture of the Hollow Wake raiders: built from salvaged starship hull sections and old cargo ' +
    'containers, angular, patched with mismatched plates and welded seams, dark gunmetal and rust, set into ' +
    'banked earth, triangular braces, small red lights; improvised and tough.',
};

export const BRIEFS: ArtBrief[] = [
  // The style test: the same four subjects from both services, so the owner can choose a direction
  // and a provider before any picture goes into the game.
  {
    id: 'style-test-authority-officer',
    series: 'portrait',
    subject:
      'A senior officer of the Sol Transit Authority, a woman in her fifties with close-cropped grey hair, ' +
      'in a dark green civil-service uniform with a small brass insignia at the collar; tired, patient, sharp-eyed.',
    purpose: 'Style test: a human leader portrait (the Authority).',
  },
  {
    id: 'style-test-wake-captain',
    series: 'portrait',
    subject:
      'A Hollow Wake raider captain, a man in his thirties with a weathered face and an old scar along the jaw, ' +
      'in a flight jacket patched together from different ships, a wary half-smile.',
    purpose: 'Style test: a human leader portrait (the Wake).',
  },
  {
    id: 'style-test-twilight-colony',
    series: 'illustration',
    subject:
      'A small frontier colony on the twilight band of a tidally locked planet orbiting a red dwarf: ' +
      'domes and greenhouses in ruddy half-light, the large dim red sun low and unmoving on the horizon, ' +
      'a cargo ship lifting off on a thin trail.',
    purpose: 'Style test: an event illustration (a colony on a red dwarf world).',
  },
  {
    id: 'style-test-relic',
    series: 'illustration',
    subject:
      "In the dark between stars, a small survey ship's floodlights fall on an enormous ancient structure " +
      'of no human make: smooth, dark, partly broken, many times larger than the ship. Quiet and uneasy.',
    purpose: 'Style test: a relic illustration (the precursor mystery).',
  },
  // The first pictures for the game (D-26, VISUAL_DIRECTION.md §4, increment 9): each power's scene
  // and leader, for the new-game screen. The places are real; everything built there is fiction.
  {
    id: 'power-sta-scene',
    series: 'illustration',
    subject:
      'High orbit over Earth at dawn: a vast wheel-shaped customs station with green navigation lights, ' +
      'cargo ships waiting in an orderly line of lights towards a slender lane beacon; the Sun rising over ' +
      'the curve of the Earth, the Moon small and grey in the distance.',
    purpose: 'New-game screen: the Sol Transit Authority at home (Earth, D-20).',
  },
  {
    id: 'power-frontier-scene',
    series: 'illustration',
    subject:
      'A settlement of the Frontier Cooperative on a warm, hazy super-Earth: clusters of white habitat domes ' +
      'and green terraced farms on rolling hills, a shared landing field with small ships under blue lights, ' +
      'a pale yellow-orange sun a little smaller than ours in a golden, dusty sky.',
    purpose: 'New-game screen: the Frontier Cooperative at home (Tau Ceti e, D-24).',
  },
  {
    id: 'power-wake-scene',
    series: 'illustration',
    subject:
      'A raiders’ den in the dark: a hollowed asteroid fitted with docking arms and floodlights, patched-together ' +
      'ships with red running lights, sparks from welding; a small dim red dwarf sun and the dark crescent of ' +
      'a large rocky planet beyond.',
    purpose: 'New-game screen: the Hollow Wake at home (Wolf 1061 and Wolf 1061 c, D-24).',
  },
  {
    id: 'power-sta-leader',
    series: 'portrait',
    subject:
      'The Director of the Sol Transit Authority, a calm man in his sixties with a neatly trimmed white beard, ' +
      'in a dark green civil-service uniform with plain geometric insignia; composed, watchful, a little weary.',
    purpose: 'New-game screen: the face of the Authority.',
  },
  {
    id: 'power-frontier-leader',
    series: 'portrait',
    subject:
      'An elected Elder of the Frontier Cooperative, a woman in her forties with sun-weathered skin and braided ' +
      'dark hair, in a practical blue work jacket with a small round pin; warm, determined, ready to argue.',
    purpose: 'New-game screen: the face of the Cooperative.',
  },
  {
    id: 'power-wake-leader',
    series: 'portrait',
    subject:
      'The chief of the Hollow Wake raiders, a lean woman in her thirties with a shaved head and a thin faded ' +
      'scar at her temple, in a patched dark red flight jacket; a cool, appraising, faintly amused look.',
    purpose: 'New-game screen: the face of the Wake.',
  },
  // The report's dispatches (increment 13): one picture for what mattered most in a turn. Every ship,
  // colony and structure is fiction; the stars are generic, not any real system.
  {
    id: 'dispatch-survey',
    series: 'illustration',
    subject:
      'A small survey ship with a long sensor boom drifting past a newly charted system of a dim orange star, ' +
      'faint fans of scanning light reaching towards two distant planets, deep space all round.',
    purpose: 'Report: a system surveyed.',
  },
  {
    id: 'dispatch-colony',
    series: 'illustration',
    subject:
      'The first prefabricated habitat domes being set down on the rocky plain of an alien world at dusk, ' +
      'landing lights glowing, a small lander and a few settlers in suits, a pale sun low on the horizon.',
    purpose: 'Report: a colony or outpost founded.',
  },
  {
    id: 'dispatch-ship',
    series: 'illustration',
    subject:
      'A newly built starship easing out of the open frame of an orbital shipyard above a hazy planet, ' +
      'work lights along the frame, two small tugs guiding it, sparks from a last weld.',
    purpose: 'Report: a ship built.',
  },
  {
    id: 'dispatch-research',
    series: 'illustration',
    subject:
      'A dim research station laboratory where three scientists stand round a glowing holographic model of a ' +
      'lane beacon, benches of instruments and screens of plain geometric diagrams, a window onto the stars.',
    purpose: 'Report: a technology researched.',
  },
  {
    id: 'dispatch-anomaly',
    series: 'illustration',
    subject:
      'A strange ancient ring of dark stone-like material floating alone in deep space, faint geometric lights ' +
      'along its inner edge, a tiny survey ship approaching with its floodlights on, for scale.',
    purpose: 'Report: an anomaly found or investigated (the precursor mystery, fiction).',
  },
  {
    id: 'dispatch-lane',
    series: 'illustration',
    subject:
      'A slender lane beacon tower in space igniting, sending a bright straight thread of light out towards a ' +
      'distant star, two crew in suits watching from a work platform at its base.',
    purpose: 'Report: a lane opened.',
  },
  // The colony view's style slice (COLONY_VIEW.md §6, increment 14): one landscape, the
  // Cooperative's buildings for its capital, the shared scaffold, and homes in the other two
  // architectures, so the owner sees all three before the rest is made.
  {
    id: 'landscape-shore',
    series: 'landscape',
    subject:
      'A warm world with shallow seas. Beyond the plain, a calm, shallow, grey-green sea with a long pale shore ' +
      'and low dunes; low, flat-topped hills of ochre and pale rock on the far horizon, softened by heat haze. ' +
      'The plain in front is firm, level pale sand and gravel with low, tough grey-green scrub in patches.',
    purpose: 'Colony view: the shore biome (warm, with oceans), as Tau Ceti e is in most games.',
  },
  {
    id: 'cooperative-homes-2-domed',
    series: 'structure',
    subject: `${ARCHITECTURE.cooperative} Homes for a few hundred settlers on a harsh world: a cluster of three large frosted-glass bubble domes joined by short rounded tunnels, sealed against the outside; inside, rounded two- and three-storey houses glow warmly through the frosted glass; small airlocks at ground level.`,
    purpose: 'Colony view: the Cooperative’s middle-sized homes, under domes.',
  },
  {
    id: 'cooperative-shipyard',
    series: 'structure',
    subject: `${ARCHITECTURE.cooperative} A small colony shipyard: a round landing pad of rammed earth with a ring of blue edge lights, a tall open gantry crane of pale metal beside it, a low rounded hangar with a wide door, and squat fuel tanks; no ship on the pad.`,
    purpose: 'Colony view: the Cooperative’s shipyard.',
  },
  {
    id: 'cooperative-lane-station',
    series: 'structure',
    subject: `${ARCHITECTURE.cooperative} A lane station, the ground station that keeps the system's lane beacons in tune: a slender mast several storeys tall with a ring of antennae and a soft blue light at the top, beside a large dish aerial pointing at the sky, rising from a low rounded control building with round windows.`,
    purpose: 'Colony view: the Cooperative’s lane station.',
  },
  {
    id: 'cooperative-mine',
    series: 'structure',
    subject: `${ARCHITECTURE.cooperative} A small mine: a drilling tower over a shaft, a short covered conveyor carrying ore to a rounded processing shed, heaps of dark ore beside it, a little dust in the air.`,
    purpose: 'Colony view: the Cooperative’s mine.',
  },
  {
    id: 'scaffold',
    series: 'structure',
    subject:
      'A building under construction at a space colony: a tall box of light metal scaffolding with orange work ' +
      'lights, a small crane arm on top, stacked wall panels and crates at its foot, the first panels going up on ' +
      'one side; plain grey and yellow construction equipment with no markings.',
    purpose: 'Colony view: what is being built, for every power.',
  },
  {
    id: 'authority-homes-2-open',
    series: 'structure',
    subject: `${ARCHITECTURE.authority} A block of homes for a few hundred people in the open air: three-storey modular apartment units arranged round a small square courtyard with a few trees, balconies, rooftop solar panels, green lights at the doors.`,
    purpose: 'Colony view: the Authority’s middle-sized homes, in the open air (setting its architecture).',
  },
  {
    id: 'wake-homes-2-domed',
    series: 'structure',
    subject: `${ARCHITECTURE.wake} Homes for a few hundred raiders on a hostile world: a cluster of half-buried bunkers made from a salvaged freighter hull cut into sections, small thick-glass domes on top lit warmly from inside, ladders and gangways between them, a red warning light on a short mast.`,
    purpose: 'Colony view: the Wake’s middle-sized homes, sealed (setting its architecture).',
  },
];
