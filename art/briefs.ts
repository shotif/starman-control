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
  // The colony view, increment 15: every other landscape, and the homes and projects of all three
  // powers (COLONY_VIEW.md §3). The worlds are generic, not any real one; Earth, the Moon and Mars
  // share the garden, airless and tundra grounds.
  {
    id: 'landscape-garden',
    series: 'landscape',
    subject:
      'A temperate world with seas and plant life. Beyond the plain, a calm blue-grey sea inlet with a pale beach; rolling green hills and low wooded ridges on the horizon, a few distant grey cliffs. The plain in front is short green-gold grass and low shrubs on firm level ground, with a few scattered stones.',
    purpose: 'Colony view: the garden biome (temperate, with oceans), Earth among others.',
  },
  {
    id: 'landscape-steppe',
    series: 'landscape',
    subject:
      'A dry, temperate world. A wide, level plain of pale ochre earth and cracked clay with sparse tufts of tough grey-green grass; long, low, eroded ridges and distant buttes of red and tan rock on the horizon; a little dust in the air.',
    purpose: 'Colony view: the steppe biome (temperate or warm, dry).',
  },
  {
    id: 'landscape-desert',
    series: 'landscape',
    subject:
      'A hot desert world. A wide, level plain of hard-baked orange and rust-red sand and flat stone, shimmering with heat; tall wind-carved rock towers and long dune fields on the horizon; no plants at all.',
    purpose: 'Colony view: the desert biome (hot).',
  },
  {
    id: 'landscape-inferno',
    series: 'landscape',
    subject:
      'A scorching world. A wide, level plain of dark cooled basalt and black glassy rock, with a few thin cracks glowing faint orange; on the horizon, distant volcanoes and fissures with rivers of glowing lava far off, and heat haze above them.',
    purpose: 'Colony view: the inferno biome (scorching).',
  },
  {
    id: 'landscape-tundra',
    series: 'landscape',
    subject:
      'A cold, dry world. A wide, level plain of rust-brown and grey gravel and frost-shattered stones, with thin patches of snow and frost in the hollows; low, rounded, eroded hills and a distant snow-dusted escarpment on the horizon.',
    purpose: 'Colony view: the tundra biome (cold), Mars among others.',
  },
  {
    id: 'landscape-ice',
    series: 'landscape',
    subject:
      'A frozen world. A wide, level plain of wind-scoured blue-white ice and packed snow with long cracks and low pressure ridges; jagged ice cliffs and distant frozen mountains on the horizon.',
    purpose: 'Colony view: the ice biome (frozen), painted under a magenta sky so the white ice is kept.',
  },
  {
    id: 'landscape-airless',
    series: 'landscape',
    subject:
      'An airless world with no weather, under hard, direct light with sharp black shadows. A wide, level plain of fine grey dust and regolith with small craters and scattered rocks; old, rounded crater rims and low mountains on the horizon.',
    purpose: 'Colony view: the airless biome (no atmosphere), the Moon among others.',
  },
  {
    id: 'landscape-haze',
    series: 'landscape',
    subject:
      'A world under a toxic atmosphere. A wide, level plain of dark ochre rock crusted with pale yellow sulphur ' +
      'deposits and small steaming vents; low volcanic hills on the horizon, with a faint low mist along their feet only.',
    purpose: 'Colony view: the haze biome (a toxic atmosphere).',
  },
  {
    id: 'authority-homes-1-open',
    series: 'structure',
    subject: `${ARCHITECTURE.authority} A few small two-storey prefabricated family houses in a neat row, little front gardens, a shared path, solar panels on the flat roofs, green lights by the doors.`,
    purpose: 'Colony view: the Authority’s small homes, in the open air.',
  },
  {
    id: 'authority-homes-1-domed',
    series: 'structure',
    subject: `${ARCHITECTURE.authority} A few small prefabricated family houses in a neat row under a faceted geodesic glass dome sealed against a hostile world, an airlock at its base, warm windows inside.`,
    purpose: 'Colony view: the Authority’s small homes, sealed.',
  },
  {
    id: 'authority-homes-2-domed',
    series: 'structure',
    subject: `${ARCHITECTURE.authority} A three-storey block of modular apartments under a large faceted geodesic glass dome sealed against a hostile world, airlocks at its base, warm windows inside.`,
    purpose: 'Colony view: the Authority’s middle-sized homes, sealed.',
  },
  {
    id: 'authority-homes-3-open',
    series: 'structure',
    subject: `${ARCHITECTURE.authority} A tall residential tower of stacked prefabricated modules, twelve storeys, with neat rows of balconies and windows, a green beacon on the roof, low service buildings at its foot.`,
    purpose: 'Colony view: the Authority’s largest homes, in the open air.',
  },
  {
    id: 'authority-homes-3-domed',
    series: 'structure',
    subject: `${ARCHITECTURE.authority} Two tall residential towers of stacked prefabricated modules inside a large faceted geodesic glass dome sealed against a hostile world, joined by skybridges, airlocks at the base.`,
    purpose: 'Colony view: the Authority’s largest homes, sealed.',
  },
  {
    id: 'cooperative-homes-1-open',
    series: 'structure',
    subject: `${ARCHITECTURE.cooperative} A few small rounded earth houses with round windows, white awnings over the doors and little gardens, joined by sandy paths.`,
    purpose: 'Colony view: the Cooperative’s small homes, in the open air.',
  },
  {
    id: 'cooperative-homes-1-domed',
    series: 'structure',
    subject: `${ARCHITECTURE.cooperative} A few small rounded earth houses gathered under one frosted-glass bubble dome sealed against a harsh world, a small airlock tunnel, warm light glowing through the glass.`,
    purpose: 'Colony view: the Cooperative’s small homes, sealed.',
  },
  {
    id: 'cooperative-homes-2-open',
    series: 'structure',
    subject: `${ARCHITECTURE.cooperative} A cluster of rounded two- and three-storey earth houses round a small shared garden with trees, white awnings and solar sails on the roofs.`,
    purpose: 'Colony view: the Cooperative’s middle-sized homes, in the open air.',
  },
  {
    id: 'cooperative-homes-3-open',
    series: 'structure',
    subject: `${ARCHITECTURE.cooperative} A tall rounded tower of stacked earth-printed rings with terraces of greenery on every level, white awnings, a small solar sail on top, low rounded houses at its foot.`,
    purpose: 'Colony view: the Cooperative’s largest homes, in the open air.',
  },
  {
    id: 'cooperative-homes-3-domed',
    series: 'structure',
    subject: `${ARCHITECTURE.cooperative} A great frosted-glass bubble dome sealed against a harsh world, with a tall rounded tower of earth-printed rings and green terraces inside it glowing warmly through the glass, smaller domes round its base joined by tunnels.`,
    purpose: 'Colony view: the Cooperative’s largest homes, sealed.',
  },
  {
    id: 'wake-homes-1-open',
    series: 'structure',
    subject: `${ARCHITECTURE.wake} A few small homes made from old cargo containers and hull plates, stacked two high, patched and welded, with ladders, a scrap-metal awning and small red lights.`,
    purpose: 'Colony view: the Wake’s small homes, in the open air.',
  },
  {
    id: 'wake-homes-1-domed',
    series: 'structure',
    subject: `${ARCHITECTURE.wake} A small half-buried bunker made from a salvaged shuttle hull, a thick-glass dome on top lit warmly from inside, an armoured airlock door.`,
    purpose: 'Colony view: the Wake’s small homes, sealed.',
  },
  {
    id: 'wake-homes-2-open',
    series: 'structure',
    subject: `${ARCHITECTURE.wake} A cluster of homes made from a salvaged freighter hull cut into sections and stood upright, joined by scrap gangways and ladders, a red warning light on a mast.`,
    purpose: 'Colony view: the Wake’s middle-sized homes, in the open air.',
  },
  {
    id: 'wake-homes-3-open',
    series: 'structure',
    subject: `${ARCHITECTURE.wake} A tall ragged tower of salvaged starship hull sections and cargo containers welded together, gangways and ladders up its sides, rows of small warm windows, red lights, a crane arm on top.`,
    purpose: 'Colony view: the Wake’s largest homes, in the open air.',
  },
  {
    id: 'wake-homes-3-domed',
    series: 'structure',
    subject: `${ARCHITECTURE.wake} A huge salvaged starship hull stood upright and sealed as a tower of homes, rows of small warm windows cut into its plates, thick-glass domes and armoured airlocks round its base.`,
    purpose: 'Colony view: the Wake’s largest homes, sealed.',
  },
  {
    id: 'authority-shipyard',
    series: 'structure',
    subject: `${ARCHITECTURE.authority} A colony shipyard: a square landing pad with green edge lights and painted guide lines, a tall gantry crane on rails beside it, a large rectangular hangar of grey panels, neat fuel tanks; no ship on the pad.`,
    purpose: 'Colony view: the Authority’s shipyard.',
  },
  {
    id: 'authority-lane-station',
    series: 'structure',
    subject: `${ARCHITECTURE.authority} A lane station, the ground station that keeps the system’s lane beacons in tune: a tall lattice mast with a ring of antennae and a green light at the top, a large dish aerial, and a rectangular control building with rows of square windows.`,
    purpose: 'Colony view: the Authority’s lane station.',
  },
  {
    id: 'authority-mine',
    series: 'structure',
    subject: `${ARCHITECTURE.authority} A mine: a square steel headframe tower over a shaft, an enclosed conveyor to a boxy processing plant, neat heaps of dark ore.`,
    purpose: 'Colony view: the Authority’s mine.',
  },
  {
    id: 'authority-survey-station',
    series: 'structure',
    subject: `${ARCHITECTURE.authority} A survey station: three dish telescopes on square concrete pads round a low flat-roofed control building with a white radome on its roof.`,
    purpose: 'Colony view: the Authority’s survey station.',
  },
  {
    id: 'cooperative-survey-station',
    series: 'structure',
    subject: `${ARCHITECTURE.cooperative} A survey station: three dish telescopes on rounded earth bases round a low rounded control building with round windows and a white fabric awning.`,
    purpose: 'Colony view: the Cooperative’s survey station.',
  },
  {
    id: 'wake-shipyard',
    series: 'structure',
    subject: `${ARCHITECTURE.wake} A rough shipyard: a landing pad of welded steel plates with red edge lights, a gantry crane built from old hull girders, a hangar made from a ship’s cargo hold, mismatched fuel tanks; no ship on the pad.`,
    purpose: 'Colony view: the Wake’s shipyard.',
  },
  {
    id: 'wake-lane-station',
    series: 'structure',
    subject: `${ARCHITECTURE.wake} A lane station, the ground station that keeps the system’s lane beacons in tune: a tall mast welded from scrap girders with a ring of salvaged antennae and a red light at the top, a battered dish aerial, and a bunker made from a ship’s bridge section.`,
    purpose: 'Colony view: the Wake’s lane station.',
  },
  {
    id: 'wake-mine',
    series: 'structure',
    subject: `${ARCHITECTURE.wake} A mine: a drilling tower welded from hull girders over a shaft, an open conveyor to a crusher made from an old engine housing, heaps of dark ore.`,
    purpose: 'Colony view: the Wake’s mine.',
  },
  {
    id: 'wake-survey-station',
    series: 'structure',
    subject: `${ARCHITECTURE.wake} A survey station: salvaged sensor dishes from old warships mounted on scrap towers round a bunker made from a ship’s bridge section.`,
    purpose: 'Colony view: the Wake’s survey station.',
  },
  // The colony view, increment 16: the vehicles that bring it to life. Each power's shuttle lands on
  // its shipyard's pad now and then; the rover is shared, its lights in the power's colour.
  {
    id: 'authority-shuttle',
    series: 'structure',
    subject: `${ARCHITECTURE.authority} Not a building but a small cargo shuttle seen from the side and a little above: a tidy, boxy lifting body with stubby wings, landing legs down, small engine nozzles at the back, green navigation lights.`,
    purpose: 'Colony view: the Authority’s shuttle, landing on and leaving the shipyard’s pad.',
  },
  {
    id: 'cooperative-shuttle',
    series: 'structure',
    subject: `${ARCHITECTURE.cooperative} Not a building but a small cargo shuttle seen from the side and a little above: a rounded, sand-coloured lifting body with patched panels, landing legs down, small engine nozzles at the back, soft blue navigation lights.`,
    purpose: 'Colony view: the Cooperative’s shuttle, landing on and leaving the shipyard’s pad.',
  },
  {
    id: 'wake-shuttle',
    series: 'structure',
    subject: `${ARCHITECTURE.wake} Not a building but a small cargo shuttle seen from the side and a little above: an angular, patched gunmetal hull welded from salvage, landing legs down, oversized engine nozzles at the back, red navigation lights.`,
    purpose: 'Colony view: the Wake’s shuttle, landing on and leaving the shipyard’s pad.',
  },
  {
    id: 'rover',
    series: 'structure',
    subject:
      'Not a building but a six-wheeled surface rover seen from the side and a little above: a pressurised grey cabin ' +
      'with a dark windscreen, a small cargo bed behind, big tyres, two headlights; plain markings, no emblem.',
    purpose: 'Colony view: rovers driving between the buildings, for every power.',
  },
];
