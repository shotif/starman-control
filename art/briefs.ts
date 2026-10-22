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
  // M3_NEIGHBOURS.md §24: written now, painted when the Duskfolk can be played.
  dusk:
    'In the architecture of the Duskfolk, an invented alien people: long, low halls half sunk into the ground, ' +
    'curved to follow a ridge, roofed with turf and dark slate, deep overhanging eaves, walls of fitted dark stone ' +
    'and woven screens, narrow slit windows glowing warm amber; communal, patient and very old.',
  // M3_NEIGHBOURS.md §25: written now, painted when the Drifters can be played.
  drift:
    'In the architecture of the Drifters, an invented alien people who live in a giant planet’s air: buoyant ' +
    'structures that float, rounded gas-filled pods of pale woven membrane tethered together by long cables, ' +
    'with slatted vanes for steering and soft violet lights; light, airy and slowly turning.',
};

/** The architectures whose buildings are painted: the aliens' wait until they can be played (§24.10, §25.9). */
type Painted = Exclude<ArchitectureId, 'dusk' | 'drift'>;

/**
 * The Duskfolk (M3_NEIGHBOURS.md §24), an invented people, written once and put into every brief
 * that shows them, so they look like one people. Fiction, and like no other work's aliens.
 */
const DUSKFOLK =
  'one of the Duskfolk, an invented alien people who are not human and have no human features: a long, narrow ' +
  'head that sweeps back into a single curved crest of bone like a blade, no nose and no ears, a small lipless ' +
  'mouth, small deep-set eyes that glow a soft amber-red, a long neck, dark slate-brown skin; long thin arms ' +
  'with long fingers (they walk on four legs, two arms free, with a long tail); wrapped in layered, hand-woven ' +
  'shawls in charcoal, ochre and plum';

/**
 * The Drifters (M3_NEIGHBOURS.md §25), an invented people, written once for every brief that shows
 * them. Fiction, and like no other work's aliens.
 */
const DRIFTER =
  'one of the Drifters, an invented alien creature that floats in a giant planet’s air and is not human ' +
  'nor like any animal of Earth: a vast, broad, flattened lens-shaped body of thick leathery hide, pale violet ' +
  'and cream with darker bands, rimmed by a frill of thin translucent vanes it steers with, a row of small dark ' +
  'eyes along its leading edge, and long fine feelers trailing beneath; it wears a few woven straps and ' +
  'cords hung with small tools and beads';

const FIRST: ArtBrief[] = [
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
  // M4's report pictures (M4_FLEETS.md §19, §26.10): war, peace, a battle and an invasion. Every
  // ship, world and person is fiction.
  {
    id: 'dispatch-battle',
    series: 'illustration',
    subject:
      'Two small fleets of angular warships exchanging fire in deep space, bright blue-white bolts and orange ' +
      'tracers crossing between them, a translucent shield bubble flaring round one ship, a dim red sun far off.',
    purpose: 'Report: a battle fought (M4).',
  },
  {
    id: 'dispatch-invasion',
    series: 'illustration',
    subject:
      'Troop landers descending through a hazy evening sky towards a colony of domes and towers, their landing ' +
      'lights blazing, a defence gun on the ground firing upwards, smoke drifting across the domes.',
    purpose: 'Report: a colony invaded (M4).',
  },
  {
    id: 'dispatch-war',
    series: 'illustration',
    subject:
      'A darkened command room where officers stand round a table-sized holographic star map with one border ' +
      'glowing red, a large screen behind them showing warships leaving a station, tense faces lit from below.',
    purpose: 'Report: war declared (M4).',
  },
  {
    id: 'dispatch-peace',
    series: 'illustration',
    subject:
      'Two small delegations in different dress meeting across a long table in a bright conference room aboard ' +
      'a station, a great window onto a calm blue planet, a signed document on the table between them.',
    purpose: 'Report: peace made (M4).',
  },
  // The Assembly (M4_FLEETS.md §29.5): its chamber for its screen, and a vote for the report. Every
  // chamber, delegate and power is fiction.
  {
    id: 'assembly-chamber',
    series: 'illustration',
    subject:
      'A great round assembly hall aboard an orbital station: tiers of curved benches rising round a low central ' +
      'floor where one delegate stands to speak, delegates in many different kinds of dress, a high domed window ' +
      `above showing the curve of a planet and the stars; among the human delegates, ${DUSKFOLK}.`,
    purpose: 'The Assembly’s screen: its chamber (M4).',
  },
  {
    id: 'dispatch-assembly',
    series: 'illustration',
    subject:
      'A vote being taken in an assembly hall aboard a station, seen from behind the back benches: rows of ' +
      'delegates in different dress, each before a small glowing panel, and above the central floor a great ' +
      'ring of light filling with two arcs of colour, cyan and amber, as the votes come in.',
    purpose: 'Report: the Assembly formed, or a vote taken (M4).',
  },
  // Relic sites of the Absent (M5_UNKNOWN.md §20.9): one for each kind, an old, tidy, switched-off
  // place, never a ruin, with no writing and no figures. Every site is fiction.
  {
    id: 'relic-vault',
    series: 'illustration',
    subject:
      'Inside an ancient vault cut into dark rock: a long, perfectly straight corridor of smooth grey stone lit by a ' +
      'soft even glow with no visible source, empty racks along both walls, everything swept clean and orderly, a ' +
      'single small object resting on a shelf at the far end; quiet, tidy, uncanny; no people, no writing.',
    purpose: 'A relic site of the Absent: a vault (M5).',
  },
  {
    id: 'relic-dust',
    series: 'illustration',
    subject:
      'A vast cloud of fine glittering dust drifting in deep space beside a faint white dwarf star, the dust arranged ' +
      'in perfect concentric rings and slow spirals as if combed, a tiny survey ship with lights hanging at its edge ' +
      'for scale; still, beautiful, unnatural; no writing.',
    purpose: 'A relic site of the Absent: a field of ordered dust (M5).',
  },
  {
    id: 'relic-array',
    series: 'illustration',
    subject:
      'An enormous lattice of thin silver rods floating in space, many kilometres across, every rod pointing the ' +
      'same way toward one point of the southern sky, a dim brown dwarf glowing deep red behind it, a small ' +
      'engineering ship beside one node for scale; precise, ancient, switched off; no writing.',
    purpose: 'A relic site of the Absent: an array (M5).',
  },
  {
    id: 'relic-moon',
    series: 'illustration',
    subject:
      'The interior of a small hollow moon: tiers of smooth curved galleries ringing a great empty central chamber, ' +
      'a ring of plain stone seats on the lowest floor all facing an empty centre, a single work lamp left by a ' +
      'survey crew casting a warm pool of light; vast, quiet, carefully kept; no people, no writing.',
    purpose: 'A relic site of the Absent: a hollow moon (M5).',
  },
  {
    id: 'relic-charts',
    series: 'illustration',
    subject:
      'A long dim hall of tall flat dark panels, each covered in tiny points of light like star charts, faint lines ' +
      'drawn between some of the points, two astronaut surveyors in work suits small in the distance holding up ' +
      'handheld lights to read them; hushed, archival, very old; no writing.',
    purpose: 'A relic site of the Absent: a hall of charts (M5).',
  },
  {
    id: 'relic-beacon',
    series: 'illustration',
    subject:
      'An ancient beacon floating in space near a small white dwarf star: an elegant smooth spire of dark metal shaped ' +
      'somewhat like a modern lane beacon but older and stranger, a single faint pale light at its tip, turned ' +
      'slightly toward the far stars; a small human survey ship approaching cautiously; lonely, patient; no writing.',
    purpose: 'A relic site of the Absent: a quiet beacon (M5).',
  },
  // The end of the game (M4_FLEETS.md §30.5): victory and defeat. Every person and power is fiction.
  {
    id: 'end-victory',
    series: 'illustration',
    subject:
      'A crowded station concourse under a great curved window, people of many kinds of dress celebrating, ' +
      'banners of plain colour hung from the galleries, and outside the window a line of ships passing slowly ' +
      'in salute against a bright blue-white planet.',
    purpose: 'The end of the game: a victory (M4).',
  },
  {
    id: 'end-defeat',
    series: 'illustration',
    subject:
      'An empty command room at night, its great holographic star map dark but for a few dim points, chairs ' +
      'pushed back, one officer standing alone at the window looking out at the stars and a distant red sun.',
    purpose: 'The end of the game: a defeat (M4).',
  },
  // The end by the keys (M5_UNKNOWN.md §21.7): the Answer given. The instrument and the Absent are fiction.
  {
    id: 'end-keys',
    series: 'illustration',
    subject:
      'In a vast dark chamber of smooth grey stone, five strange pieces of an ancient instrument, each a different ' +
      'shape, fitted together on a low plinth into one quiet whole; a thin pale light rising from where they meet ' +
      'and spreading in faint rings across the walls; far beyond a tall window, the stars; awed, quiet, uneasy; ' +
      'no people, no writing.',
    purpose: 'The end of the game: the Answer given with the keys of the Absent (M5).',
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
  // The colony view, increment 17: each power's capital hall and its outposts' rig, and the fields
  // an open-air colony farms.
  {
    id: 'authority-hall',
    series: 'structure',
    subject: `${ARCHITECTURE.authority} The capital's main hall, the seat of the colony's administration: a broad, symmetrical civic building of pale ceramic panels with a row of slim pillars along its front, a tall square tower with a green beacon, wide steps, rows of square windows; dignified and orderly.`,
    purpose: 'Colony view: the Authority’s capital hall, the town’s landmark.',
  },
  {
    id: 'cooperative-hall',
    series: 'structure',
    subject: `${ARCHITECTURE.cooperative} The capital's meeting hall, where the settlers vote: a large rounded earth building with a wide low dome, a ring of round windows, white fabric awnings over a broad entrance, a small tower with a blue light, planters along its front; welcoming.`,
    purpose: 'Colony view: the Cooperative’s capital hall, the town’s landmark.',
  },
  {
    id: 'wake-hall',
    series: 'structure',
    subject: `${ARCHITECTURE.wake} The raiders' great hall: the forward section of an old warship set into banked earth as a fortress, its bridge windows lit, armour plates and triangular braces, a tall mast with a red light, a heavy gate; imposing and battered.`,
    purpose: 'Colony view: the Wake’s capital hall, the town’s landmark.',
  },
  {
    id: 'authority-rig',
    series: 'structure',
    subject: `${ARCHITECTURE.authority} An automated outpost with no people: a compact square extraction rig with a drill tower, storage tanks, a small landing pad for drones and a slim beacon mast with a green light; no windows, built for machines.`,
    purpose: 'Colony view: the Authority’s outposts.',
  },
  {
    id: 'cooperative-rig',
    series: 'structure',
    subject: `${ARCHITECTURE.cooperative} An automated outpost with no people: a rounded extraction rig printed from earth with a drill tower, squat tanks, small solar sails, a little landing pad for drones and a beacon with a blue light; built for machines.`,
    purpose: 'Colony view: the Cooperative’s outposts.',
  },
  {
    id: 'wake-rig',
    series: 'structure',
    subject: `${ARCHITECTURE.wake} An automated outpost with no people: a drilling rig welded from old hull girders, tanks made from fuel drums, a landing pad of scrap plates for drones and a beacon mast with a red light; built for machines.`,
    purpose: 'Colony view: the Wake’s outposts.',
  },
  {
    id: 'fields',
    series: 'structure',
    subject:
      'Not a building but a small patch of farmland of a space colony: neat rectangular plots of green and golden crops ' +
      'in rows, thin irrigation pipes between them, and a small pump shed at one corner; the plots lie flat, seen from a ' +
      'little above.',
    purpose: 'Colony view: the fields an open-air colony farms, for every power.',
  },
];

// The colony view, increment 18 (COLONY_VIEW.md §9): two more versions of every home, so neighbours
// differ, and small props between the buildings.
export const BRIEFS: ArtBrief[] = [
  ...FIRST,
  ...homeVersions(FIRST),
  ...props(),
  ...districts(),
  ...projects(),
  ...greatWorks(),
  ...advisors(),
  ...events(),
  ...duskfolk(),
  ...drifters(),
  ...leaders(),
];

/**
 * Increment 56's faces (M5_UNKNOWN.md §24.7): four for each people, worn by the leaders a power
 * hires, whatever their calling. All fiction.
 */
function leaders(): ArtBrief[] {
  const sta = 'of the Sol Transit Authority, in a dark green civil-service uniform with plain geometric insignia';
  const coop = 'of the Frontier Cooperative, in practical blue work clothes with a small round pin';
  const wake = 'of the Hollow Wake raiders, in a patched flight jacket of mismatched dark red and grey panels';
  const faces: [string, string][] = [
    [
      'sta-1',
      `An officer ${sta}: a Nigerian man in his thirties with close-cropped hair and a neat moustache; alert, correct.`,
    ],
    [
      'sta-2',
      `An officer ${sta}: a Swedish woman in her forties with straight ash-blonde hair to the jaw; cool, precise.`,
    ],
    [
      'sta-3',
      `An officer ${sta}: a Chinese man in his sixties with thin grey hair and fine lines about the eyes; patient, wise.`,
    ],
    ['sta-4', `An officer ${sta}: a Brazilian woman in her twenties with dark curls tied back; eager, bright.`],
    [
      'frontier-1',
      `A settler ${coop}: a Maori woman in her fifties with a weathered face and grey-streaked hair; kind, sure.`,
    ],
    [
      'frontier-2',
      `A settler ${coop}: an Irish man in his twenties with red hair, freckles and a sunburnt nose; open, cheerful.`,
    ],
    [
      'frontier-3',
      `A settler ${coop}: a Kenyan man in his forties with a short beard and a wool scarf; thoughtful, warm.`,
    ],
    [
      'frontier-4',
      `A settler ${coop}: a Mexican woman in her thirties with a long black braid and a smudge of dust on one cheek; capable, wry.`,
    ],
    [
      'hollow-wake-1',
      `A raider ${wake}: a gaunt woman in her forties with a shaved scalp and a tattooed line down the jaw; cold, watchful.`,
    ],
    [
      'hollow-wake-2',
      `A raider ${wake}: a heavy man in his thirties with a black beard and a burn scar on one cheek; fierce, amused.`,
    ],
    [
      'hollow-wake-3',
      `A raider ${wake}: a wiry old man in his seventies with white stubble and a goggle pushed up on his brow; sly, tough.`,
    ],
    [
      'hollow-wake-4',
      `A raider ${wake}: a young woman in her twenties with spiky dyed-blue hair and a split lip; defiant, quick.`,
    ],
    ['dusk-concord-1', `${DUSKFOLK}, the crest short and dark with youth; curious, alert.`],
    [
      'dusk-concord-2',
      `${DUSKFOLK}, a shawl of deep plum with a pale grey band, the crest notched by an old injury; grave, steady.`,
    ],
    [
      'dusk-concord-3',
      `${DUSKFOLK}, an ochre shawl pulled high about the neck, faint pale streaks along the crest; gentle, patient.`,
    ],
    [
      'dusk-concord-4',
      `${DUSKFOLK}, a charcoal shawl with a thin copper thread, eyes glowing brighter than most; intent, sharp.`,
    ],
    [
      'drift-moot-1',
      `${DRIFTER}; the front edge of its body and its row of eyes fill the frame, its hide unmarked and bright with youth, a single cord of blue beads; lively.`,
    ],
    [
      'drift-moot-2',
      `${DRIFTER}; the front edge of its body and its row of eyes fill the frame, broad darker bands across the hide, many tools on its straps; steady, practical.`,
    ],
    [
      'drift-moot-3',
      `${DRIFTER}; the front edge of its body and its row of eyes fill the frame, a torn vane healed in a pale seam, a sash of green beads; wary, wise.`,
    ],
    [
      'drift-moot-4',
      `${DRIFTER}; the front edge of its body and its row of eyes fill the frame, the hide a deeper violet, cords of amber beads looped many times; calm, proud.`,
    ],
  ];
  return faces.map(([id, subject]) => ({
    id: `leader-${id}`,
    series: 'portrait' as const,
    subject,
    purpose: `A leader's face (M5, fiction): ${id.replace(/-\d$/, '')}.`,
  }));
}

/** Increment 39's pictures (M3_NEIGHBOURS.md §25.9): the Moot's envoy and speaker, and its people at home. */
function drifters(): ArtBrief[] {
  return [
    {
      id: 'advisor-drift-envoy',
      series: 'portrait',
      subject: `Fair Wind, who carries offers for the Drift Moot: ${DRIFTER}; the front edge of its body and its row of eyes fill the frame, a woven sash with violet beads across it; open and attentive.`,
      purpose: 'The Moot’s Envoy, on the diplomacy screen (M3, fiction).',
    },
    {
      id: 'speaker-drift-moot',
      series: 'portrait',
      subject: `Deep Current, eldest of the Drift Moot: ${DRIFTER}; the front edge of its body and its row of eyes fill the frame, its hide scarred and faded with very great age, many old cords and beads; calm and slow.`,
      purpose: 'The Moot’s speaker, on the data page (M3, fiction).',
    },
    {
      id: 'people-drifters',
      series: 'illustration',
      subject:
        'Inside the banded clouds of a cold giant planet, high above an endless floor of cloud: a few vast Drifters float ' +
        'among towering cloud walls, broad lens-shaped bodies of pale violet and cream hide with frills of thin vanes and long ' +
        'feelers trailing below, and between them a cluster of floating, rounded pods of woven membrane tethered by cables, ' +
        'with soft violet lights. A small orange sun low in a hazy sky. Vast in scale, quiet and slow. An invented alien ' +
        'people, not human, and like no other story’s creatures.',
      purpose: 'The Drifters at home, on the data page (M3, fiction).',
    },
  ];
}

/** Increment 38's pictures (M3_NEIGHBOURS.md §24.10): the Concord's envoy and speaker, and its people at home. */
function duskfolk(): ArtBrief[] {
  return [
    {
      id: 'advisor-dusk-envoy',
      series: 'portrait',
      subject: `First Voice, who speaks to strangers for the Dusk Concord: ${DUSKFOLK}, with a band of amber thread at the shawl's edge; attentive and unhurried, the head tilted as if listening.`,
      purpose: 'The Concord’s Envoy, on the diplomacy screen (M3, fiction).',
    },
    {
      id: 'speaker-dusk-concord',
      series: 'portrait',
      subject: `Still Water, the speaker of the Dusk Concord: ${DUSKFOLK}, in a heavy shawl of many layers, the crest worn and pale with great age; calm and still, the gaze steady.`,
      purpose: 'The Concord’s speaker, on the data page (M3, fiction).',
    },
    {
      id: 'people-duskfolk',
      series: 'illustration',
      subject:
        'The ring of dusk on a world locked to its red dwarf sun: the huge, dim red sun sits half below the horizon and never moves; ' +
        'to the left the land runs into bright, heat-hazed desert, to the right into blue darkness and ice. On a curved ridge between them, ' +
        'long low halls roofed with turf and slate glow with amber slit windows, and a few of the Duskfolk walk a path among them: ' +
        'tall, long-limbed figures with slate-grey skin and large eyes that catch the red light, in layered woven shawls. Quiet and patient. ' +
        'An invented alien people, not human, and like no other story’s aliens.',
      purpose: 'The Duskfolk at home, on the data page (M3, fiction).',
    },
  ];
}

/** Each home's second and third versions: the same kind of home told another way. */
function homeVersions(first: ArtBrief[]): ArtBrief[] {
  const versions: [string, string, string][] = [
    [
      'authority-homes-1-open',
      'A short terrace of small two-storey prefabricated family houses set in an L-shape, flat solar canopies over the doors, low hedges in front, green lights by the doors.',
      'Two small square prefabricated houses side by side, one with a single-storey annexe, a shared front porch under a flat canopy, solar panels on the roofs, green lights by the doors.',
    ],
    [
      'authority-homes-1-domed',
      'A pair of small prefabricated family houses under a low, wide, hexagonal geodesic glass dome sealed against a hostile world, a tunnel airlock at one side, warm windows inside.',
      'A small prefabricated house with a greenhouse module beside it under a tall, narrow, faceted geodesic glass dome on a ring of metal footings sealed against a hostile world, an airlock porch, warm windows inside.',
    ],
    [
      'authority-homes-2-open',
      'A long four-storey block of modular apartments, solar panels on its flat roof, a covered walkway along the ground floor, a row of young trees in planters along its front, green lights at the doors.',
      'Two three-storey blocks of modular apartments in an L shape, joined at the corner by a glazed stair tower, balconies with planters, green lights at the doors.',
    ],
    [
      'authority-homes-2-domed',
      'Two low blocks of modular apartments under twin faceted geodesic glass domes sealed against a hostile world, joined by a short glazed corridor, airlocks at their bases, warm windows inside.',
      'A stepped block of modular apartments, five storeys at the back down to two at the front, under a tall faceted geodesic glass dome sealed against a hostile world, an airlock at its base, warm windows inside.',
    ],
    [
      'authority-homes-3-open',
      'A slender residential tower of stacked prefabricated modules, sixteen storeys, set back in tiers near the top, a crown of solar panels and a green beacon on the roof, a low entrance hall at its foot.',
      'Two residential towers of stacked prefabricated modules, ten and fourteen storeys, side by side and joined by a skybridge halfway up, rows of square windows, green beacons on their roofs.',
    ],
    [
      'authority-homes-3-domed',
      'A slim residential tower of stacked prefabricated modules inside a tall, pointed, faceted geodesic glass dome like a spire, sealed against a hostile world, lower service buildings round it under the glass, an airlock at the base.',
      'Three medium residential towers of stacked prefabricated modules inside a broad, low, faceted geodesic glass dome sealed against a hostile world, lit walkways between them, airlocks at the base.',
    ],
    [
      'cooperative-homes-1-open',
      'Two small domed earth houses joined by a curved garden wall, a round window in each, a white awning over a shared doorway, a little vegetable bed and a water barrel.',
      'A small cluster of rounded earth houses of different heights, one with a tiny lookout tower, white fabric awnings, potted plants and a solar sail on a pole.',
    ],
    [
      'cooperative-homes-1-domed',
      'Two small frosted-glass bubble domes side by side sealed against a harsh world, each sheltering a rounded earth house, joined by a short tunnel, warm light glowing through the glass, an airlock at the front.',
      'A small rounded earth house half sunk into the ground under a low frosted-glass dome sealed against a harsh world, a greenhouse bubble beside it full of green plants, warm light inside, an airlock tunnel.',
    ],
    [
      'cooperative-homes-2-open',
      'A long, gently curved terrace of rounded three-storey earth-printed houses, round windows, balconies with planters, white awnings, solar sails along the roof.',
      'A stepped mound of rounded earth homes built up in terraces, gardens on the roofs, white awnings, round windows, a spiral stair round the outside.',
    ],
    [
      'cooperative-homes-2-domed',
      'One wide, low frosted-glass bubble dome sealed against a harsh world, a ring of rounded three-storey earth houses inside glowing warmly through the glass, a greenhouse bubble on one side, small airlocks at ground level.',
      'A row of four frosted-glass bubble domes of different sizes sealed against a harsh world, joined by rounded tunnels, rounded houses and green plants glowing through the glass, airlocks at ground level.',
    ],
    [
      'cooperative-homes-3-open',
      'Two rounded towers of earth-printed rings of different heights, joined by curved bridges, terraces of greenery on every level, white awnings, solar sails on top.',
      'A broad, tall, conical tower of earth-printed terraces like a stepped hill, gardens and young trees on every level, round windows, white awnings, a solar sail on top.',
    ],
    [
      'cooperative-homes-3-domed',
      'A tall egg-shaped frosted-glass dome sealed against a harsh world, a stack of rounded earth-printed floors inside glowing warmly through the glass, green terraces, smaller bubble domes round its foot.',
      'Three large frosted-glass bubble domes clustered together sealed against a harsh world, each with a rounded earth tower inside glowing through the glass, joined by tunnels, airlocks at ground level.',
    ],
    [
      'wake-homes-1-open',
      'A small row of homes cut from an old shuttle hull laid on its side, doors and windows cut into its plates, a scrap-metal porch roof, a ladder to the top, small red lights.',
      'Two small huts built from engine cowlings and hull plates, patched and riveted, a welded water tank on a frame between them, a scrap awning, small red lights.',
    ],
    [
      'wake-homes-1-domed',
      'Two small armoured bunkers made from cargo containers, half sunk into banked earth and joined by a covered gangway, a small thick-glass dome on each lit warmly from inside.',
      'A small bunker made from an escape pod and container sections welded together and half buried, a thick-glass observation dome lit from inside, an armoured hatch and a red light.',
    ],
    [
      'wake-homes-2-open',
      'Homes stacked from rusty cargo containers four high in an uneven block, doors and windows cut into them, scrap balconies, ladders, a crane arm on top, small red lights.',
      'The hull of a wrecked freighter lying on its side and turned into homes, rows of small windows cut into its plates, scrap porches and gangways along its flank, red lights.',
    ],
    [
      'wake-homes-2-domed',
      "A long half-buried bunker made from a freighter's cargo spine, a row of small thick-glass domes along its top lit warmly from inside, armoured airlocks at each end, a red light.",
      'Three squat armoured bunkers made from engine housings and hull plates set into banked earth round a central thick-glass dome, gangways between them, red lights.',
    ],
    [
      'wake-homes-3-open',
      "A tall tower built round an old starship's upright engine section, its decks turned into homes with rows of small warm windows, scrap balconies, ladders up the outside, red lights at the top.",
      'Two leaning towers of welded cargo containers and hull plates braced against each other with triangular girders, gangways between them, small warm windows, red lights.',
    ],
    [
      'wake-homes-3-domed',
      'A tall armoured tower made from fuel-tank sections welded end to end and sealed against a hostile world, rows of small warm windows, thick-glass domes at its base, armoured airlocks, a red light on top.',
      'The great nose cone of a wrecked ship set down over a half-buried bunker town and sealed as a dome against a hostile world, small warm windows cut through its plates, armoured airlocks round its base.',
    ],
  ];
  return versions.flatMap(([id, b, c]) => {
    const base = first.find((x) => x.id === id);
    if (!base) throw new Error(`no brief ${id}`);
    const architecture = ARCHITECTURE[id.split('-')[0] as ArchitectureId];
    const purpose = base.purpose.replace('Colony view: the', 'Colony view: another version of the');
    return [
      { id: `${id}-b`, series: 'structure' as const, subject: `${architecture} ${b}`, purpose },
      { id: `${id}-c`, series: 'structure' as const, subject: `${architecture} ${c}`, purpose },
    ];
  });
}

/** The props (COLONY_VIEW.md §9.3): five in each power's architecture, ten shared. */
function props(): ArtBrief[] {
  const own: Record<string, Record<Painted, string>> = {
    'water-tanks': {
      authority:
        'Water tanks for a colony: three tall white ceramic cylinders on a neat steel frame, with pipes and a ladder, a slim green light on top.',
      cooperative:
        'Water tanks for a colony: two squat rounded cisterns printed from the local soil in warm terracotta, a white fabric shade over them, pipes running down to the ground.',
      wake: 'Water tanks for a colony: two old rusty fuel tanks from a starship, patched and welded, stood upright on a frame of girders, with a ladder and a small red light.',
    },
    mast: {
      authority:
        'A communications mast: a slim lattice tower of brushed metal about twelve metres tall with small dish aerials and antennas, a green light at the top, on a small square footing.',
      cooperative:
        'A communications mast: a slim curved mast about twelve metres tall with small aerials, a little solar sail and a soft blue light on top, rising from a small rounded earth footing.',
      wake: 'A communications mast: a ragged mast about twelve metres tall welded from scrap girders, hung with mismatched aerials and an old dish, a red light at the top, held by guy wires.',
    },
    cargo: {
      authority:
        'A tidy stack of standard grey cargo containers, two high, in neat rows, with a small gantry crane over them and green guide lights.',
      cooperative:
        'A stack of rounded cargo pods and crates under a white fabric awning, with a small hand crane beside them.',
      wake: 'A jumbled stack of rusty, mismatched cargo containers, one standing open, with a crane arm welded from girders over them and a small red light.',
    },
    greenhouse: {
      authority:
        'A long greenhouse module: a row of pale ceramic frames with glass panels, green plants growing inside under warm white grow lights, an airlock at one end.',
      cooperative:
        'A frosted-glass bubble greenhouse on a rounded earth base, full of green plants and vines, warm white light inside.',
      wake: 'A greenhouse built from an old hull section with glass panels welded into its plates, green plants inside under warm white grow lights, patched seams.',
    },
    monument: {
      authority:
        'A monument to the first settlers: a tall, slim column of pale ceramic with a ring of green light near its top, on a low stepped base.',
      cooperative:
        'A monument to the first settlers: a ring of tall standing stones printed from the local soil, leaning together at their tops, a soft blue light glowing at the centre.',
      wake: "A monument to the raiders' first ship: the sharp bow of an old starship stood upright in the ground like a blade, plain welded plates on its side, a red light at its tip.",
    },
  };
  const shared: Record<string, string> = {
    'solar-field':
      'A small solar field: three rows of dark blue solar panels on angled metal frames, with a little grey inverter cabinet at one end.',
    'landing-beacon':
      'A landing beacon: a short, sturdy metal tower about six metres tall with a bright white lamp in a cage at its top, a ring of small lights and orange striped panels near its base.',
    'supply-crates':
      'A few supply crates and drums stacked together: grey and orange crates of different sizes, two metal drums and a small hand cart.',
    'storage-spheres':
      'Two pressurised storage spheres on sturdy legs, pale grey and weathered, with pipes and a ladder up to a walkway between them.',
    'wind-turbines':
      'Three slim wind turbines of different heights standing close together, each with three white blades on a thin grey tower.',
    radiators:
      'A heat radiator array: a row of tall, thin, dark grey radiator fins standing on edge on a metal frame, with pipes along their base.',
    orchard:
      'A small orchard of a space colony: three rows of young fruit trees in raised beds with thin irrigation pipes, and a small tool shed.',
    'ore-heap':
      'A heap of dark metallic ore beside a short open conveyor and a small loading hopper, a few rocks spilled at its foot.',
    'gas-well':
      'A gas well capping a deposit of ice and volatiles under the ground: a wellhead of valves and pipes rimed with frost, a short vent stack trailing a thin white plume, a small control box.',
    'regolith-plant':
      'A small regolith plant that bakes fusion fuel out of the soil: a squat boxy machine with a hopper on top, a short conveyor feeding it and a chute of grey dust.',
  };
  const ownBriefs = Object.entries(own).flatMap(([kind, by]) =>
    (Object.keys(by) as Painted[]).map((a) => ({
      id: `${a}-${kind}`,
      series: 'prop' as const,
      subject: `${ARCHITECTURE[a]} ${by[a]}`,
      purpose: `Colony view: a prop between the buildings (${kind}), in the ${a === 'authority' ? 'Authority' : a === 'cooperative' ? 'Cooperative' : 'Wake'}'s architecture.`,
    })),
  );
  const sharedBriefs = Object.entries(shared).map(([id, subject]) => ({
    id,
    series: 'prop' as const,
    subject: `Not a building but a small piece of a space colony's equipment. ${subject}`,
    purpose: `Colony view: a prop between the buildings (${id}), shared by every power.`,
  }));
  return [...ownBriefs, ...sharedBriefs];
}

/**
 * M2's districts (M2_WORLDS.md §15, increment 20): the buildings a zoned district shows. Farms show
 * the shared fields in the open air and greenhouses when sealed; mines show each power's mine;
 * housing shows homes. Works, labs and markets are new, in each power's architecture.
 */
function districts(): ArtBrief[] {
  const own: Record<string, Record<Painted, string>> = {
    works: {
      authority:
        'A works district: a long, orderly manufacturing hall of prefabricated modules with a sawtooth roof of skylights, a loading bay with a small gantry crane, stacked standard containers and green lights.',
      cooperative:
        'A works district: a cluster of rounded earth-printed workshops with wide doors open on workbenches and machines, a large printer arm under a fabric awning, solar sails, and soft blue lights.',
      wake: 'A works district: a salvage yard and workshop built in an old freighter hold, cranes made from girders, a furnace glowing orange through an open door, stacks of hull plates, red lights.',
    },
    labs: {
      authority:
        'A research district: a clean, symmetrical laboratory block of pale ceramic panels with rows of square windows, a small observatory dome and an antenna array on its flat roof, green lights.',
      cooperative:
        'A research district: a rounded earth-built laboratory with a large round window, a greenhouse wing for experiments, a small telescope dome, white awnings and soft blue lights.',
      wake: 'A research district: a laboratory improvised in a salvaged science vessel half sunk into banked earth, its sensor mast and dish still working, cables running everywhere, small red lights.',
    },
    market: {
      authority:
        'A market district: a civic trade hall with a colonnade of slim pillars, a covered arcade of small shopfronts with lit windows, a tidy square of stalls under flat canopies, green lights.',
      cooperative:
        'A market district: a lively covered market of rounded earth stalls under white fabric awnings, crates of produce, a shared kitchen with a chimney, strings of soft blue lights.',
      wake: 'A market district: a black market in stacked cargo containers opened up as stalls, scrap awnings, hanging lamps, crates and barrels, a watchtower with a red light.',
    },
    // M4's defences (M4_FLEETS.md §26.1, §26.10).
    'defence-battery': {
      authority:
        'A defence battery: a squat armoured gun emplacement of thick grey prefabricated panels behind a sloped berm, a turret of three long gun barrels angled at the sky, a radar mast and an ammunition bunker, green lights.',
      cooperative:
        'A defence battery: a rounded earth-built bunker half sunk into a mound, a domed turret with three gun barrels angled at the sky, a woven-mesh radar dish beside it, soft blue lights.',
      wake: 'A defence battery: three salvaged warship guns welded onto a turret ring on a blockhouse of hull plates and sandbags, aimed at the sky, a crooked radar mast, red lights.',
    },
    'planetary-shield': {
      authority:
        'A planetary shield generator: a tall cylindrical tower of white prefabricated panels crowned by a ring of emitters casting a faint translucent dome of light up into the sky, thick cables to a power building, green lights.',
      cooperative:
        'A planetary shield generator: a rounded earth-built hall with three copper-wound emitter towers round a central spire, a faint blue translucent dome of light rising from them into the sky, soft blue lights.',
      wake: 'A planetary shield generator: a warship’s shield projector salvaged and mounted on a tower of welded girders, throwing a faint flickering violet dome of light into the sky, cables and coolant pipes, red lights.',
    },
    barracks: {
      authority:
        'Barracks: orderly rows of prefabricated two-storey buildings round a parade ground, a flagpole, a watchtower and a vehicle shed with armoured rovers, green lights.',
      cooperative:
        'Barracks: rounded earth-built bunkhouses round a training yard with a climbing frame, a domed mess hall and solar sails, soft blue lights.',
      wake: 'Barracks: a camp of stacked cargo containers and a grounded troop ship turned into bunk rooms, a sparring ring and armoured buggies, red lights.',
    },
  };
  const names: Record<Painted, string> = { authority: 'Authority', cooperative: 'Cooperative', wake: 'Wake' };
  return [
    ...Object.entries(own).flatMap(([kind, by]) =>
      (Object.keys(by) as Painted[]).map((a) => ({
        id: `${a}-${kind}`,
        series: 'structure' as const,
        subject: `${ARCHITECTURE[a]} ${by[a]}`,
        purpose: `Colony view: a ${kind} district, in the ${names[a]}'s architecture (M2).`,
      })),
    ),
    {
      id: 'greenhouse-farms',
      series: 'structure',
      subject:
        'Not a building but the sealed farmland of a space colony on a hostile world: three long, low, arched greenhouse tunnels of ' +
        'clear panels side by side, green crops glowing under warm grow lights inside, pipes and a small pump house at one end.',
      purpose: 'Colony view: a farm district under glass, where the colony is sealed, for every power (M2).',
    },
  ];
}

/** Increment 21's projects (M2_WORLDS.md §23.1), each in every power's architecture. */
function projects(): ArtBrief[] {
  const own: Record<string, Record<Painted, string>> = {
    hydroponics: {
      authority:
        'A hydroponics farm: a long, low prefabricated building with a glazed roof, racks of green plants under pink-white grow lights visible through its windows, water tanks and pipes along one side, green lights.',
      cooperative:
        'A hydroponics farm: a rounded earth-built greenhouse hall with a ribbed glass roof, tiers of leafy plants glowing under warm grow lights, rain barrels and a small wind vane, soft blue lights.',
      wake: 'A hydroponics farm: grow racks inside opened-up cargo containers stacked in a horseshoe, pink grow lights spilling out, tarpaulins, water bladders and hoses, small red lights.',
    },
    'trade-exchange': {
      authority:
        'A trade exchange: a formal civic building with a tall glass atrium, a large display board of figures over the entrance, a landing pad for cargo drones on the roof, flags, green lights.',
      cooperative:
        'A trade exchange: a round earth-built hall with a domed roof and a ring of open arches, cargo carts and crates outside, a tall mast hung with signal pennants, soft blue lights.',
      wake: 'A trade exchange: a fortified bazaar in the hull of a grounded cargo ship, its loading ramp down as an entrance, crates and barrels piled outside, a crane, armed lookouts, red lights.',
    },
    'civic-centre': {
      authority:
        'A civic centre: a dignified town hall of pale prefabricated stone with a colonnade, a clock tower and a public square with benches and young trees in front, green lights.',
      cooperative:
        'A civic centre: a large rounded meeting house of rammed earth with a terraced amphitheatre in front, a garden roof, a tall solar sail and soft blue lights.',
      wake: 'A civic centre: a meeting hall built in the bridge section of an old warship, a wide deck in front for gatherings, a banner of red cloth, braziers and red lights.',
    },
    'recreation-dome': {
      authority:
        'A recreation dome: a large faceted glass dome over a small park with trees, a pond and paths, a sports field beside it, people-sized doors, green lights.',
      cooperative:
        'A recreation dome: a great frosted-glass bubble dome over gardens, a pool and a little open-air stage, rounded pavilions round its edge, soft blue lights.',
      wake: 'A recreation dome: a patched glass dome salvaged from a liner, over a rough garden and a fighting ring, scrap benches, hanging lamps and red lights.',
    },
    'research-institute': {
      authority:
        'A research institute: an imposing campus building of pale ceramic panels with a tall glass entrance, a large radio telescope dish beside it and an observatory dome, green lights.',
      cooperative:
        'A research institute: a cluster of rounded earth-built halls round a courtyard, a big glass telescope dome, solar sails and a tall weather mast, soft blue lights.',
      wake: 'A research institute: the hull of a salvaged science ship stood on end and braced with girders, sensor dishes bolted on at every level, cables everywhere, red lights.',
    },
    'fusion-plant': {
      authority:
        'A fusion power plant: a large cylindrical reactor hall of prefabricated panels with a glowing ring window, cooling towers, a switchyard of transformers and power lines, green lights.',
      cooperative:
        'A fusion power plant: a rounded earth-built reactor hall with a glowing blue ring window, curved cooling fins, a low control building and cables on posts, soft blue lights.',
      wake: 'A fusion power plant: a starship engine section bolted upright into banked earth as a reactor, glowing violet through vents, radiator fins and thick cables, warning lights.',
    },
    refinery: {
      authority:
        'A fuel refinery: neat columns and spherical tanks of white-painted steel, pipe racks, a tall flare stack with a small flame, a control building, green lights.',
      cooperative:
        'A fuel refinery: rounded earth-built sheds round two tall distillation columns, pipes on wooden trestles, round storage tanks and soft blue lights.',
      wake: 'A fuel refinery: tanks cut from old fuel pods, crooked pipe runs, a flare stack burning brightly, a pump house of hull plates, red lights.',
    },
    arcology: {
      authority:
        'An arcology: a single enormous stepped tower of prefabricated modules housing a whole town, terraces of gardens, many lit windows, a beacon on top, smaller buildings at its foot.',
      cooperative:
        'An arcology: a huge rounded tower of earth-printed rings wider at the base like a hill, every terrace green with gardens and lit windows, solar sails at the top.',
      wake: 'An arcology: the hulk of a great colony ship stood upright and buried at its base, its decks turned into homes, lit portholes in rows, scaffold walkways and red lights.',
    },
    'medical-centre': {
      authority:
        'A medical centre: a clean white hospital building of prefabricated modules with a green cross sign, an ambulance shuttle pad on the roof and a small garden, green lights.',
      cooperative:
        'A medical centre: a rounded earth-built clinic with a healing garden, big round windows, a white awning over the entrance and a blue cross sign, soft blue lights.',
      wake: 'A medical centre: a field hospital in a salvaged medical frigate, its side opened up as a ward, a red cross painted on the hull, tents and red lights.',
    },
    // Increment 24 (M2_WORLDS.md §26.3).
    'deep-space-scanner': {
      authority:
        'A deep-space scanner: a tall lattice mast of white steel carrying a ring of flat sensor panels, a large dish beside it pointed at the sky, a neat equipment building at its foot, cable trays, green lights.',
      cooperative:
        'A deep-space scanner: three rounded radio dishes on earth-built plinths round a domed listening hall, a tall braced antenna, cables on posts, soft blue lights.',
      wake: 'A deep-space scanner: a salvaged warship’s sensor array bolted on top of a tower of stacked hull sections, dishes and antennas jutting at angles, hanging cables, red lights.',
    },
    // Increment 25 (M2_WORLDS.md §27.5).
    'flare-shield': {
      authority:
        'A flare shield: a squat, heavily armoured generator building of thick grey panels with a tall mast carrying a ring of magnetic coils, glowing faintly, thick cables running out to the ground, green lights.',
      cooperative:
        'A flare shield: a low rounded earth-built bunker half sunk into a mound, a cluster of three coil towers wound with copper on its roof, a soft blue glow between them, solar sails folded down.',
      wake: 'A flare shield: a starship’s magnetic deflector ring salvaged and stood upright on a frame of girders over a blockhouse of hull plates, cables and coolant pipes, a faint violet glow, red lights.',
    },
    // M2b's increment 30 (M2B_SCIENCE.md §18.3).
    'lane-relay': {
      authority:
        'A lane relay: a slender white lattice tower carrying a ring of three large beacon dishes angled at the sky, a glowing cyan beacon lamp on its tip, a neat square control house at its foot, cable trays, green lights.',
      cooperative:
        'A lane relay: a tall braced mast on a rounded earth-built base, two big woven-mesh beacon dishes turned skyward, a soft blue beacon lamp on top, a small round hut and solar sails beside it.',
      wake: 'A lane relay: a crooked tower of welded girders topped by a salvaged ship’s beacon array and a red-glowing lamp, mismatched dishes bolted on at angles, a blockhouse of hull plates and hanging cables.',
    },
    'orbital-habitat': {
      authority:
        'An orbital habitat seen from the ground: a tall space-elevator tether rising straight into the sky from a squat, orderly anchor station of prefabricated modules, a lift car halfway up, landing pads, green lights.',
      cooperative:
        'An orbital habitat seen from the ground: a rounded earth-built shuttle port with a domed hall and a launch ring, a shuttle rising on a thin trail towards a bright ring-shaped station small in the sky, soft blue lights.',
      wake: 'An orbital habitat seen from the ground: a launch gantry of girders over a scorched pad, a battered shuttle on it, fuel tanks and cargo, and a patched wheel-shaped station small in the sky above, red lights.',
    },
    'terraforming-station': {
      authority:
        'A terraforming station: a great processing plant of prefabricated modules with two tall stacks breathing white vapour into the sky, spherical gas tanks, pipes and a control tower, green lights.',
      cooperative:
        'A terraforming station: rounded earth-built halls round a huge glass bioreactor dome glowing green with algae, tall vents breathing white vapour, terraced beds of hardy plants around it, soft blue lights.',
      wake: 'A terraforming station: the engine block of a wrecked bulk carrier rigged as an atmosphere processor, its exhausts roaring white vapour into the sky, tanks and crooked pipes, red lights.',
    },
  };
  const names: Record<Painted, string> = { authority: 'Authority', cooperative: 'Cooperative', wake: 'Wake' };
  return Object.entries(own).flatMap(([kind, by]) =>
    (Object.keys(by) as Painted[]).map((a) => ({
      id: `${a}-${kind}`,
      series: 'structure' as const,
      subject: `${ARCHITECTURE[a]} ${by[a]}`,
      purpose: `Colony view: the ${kind.replaceAll('-', ' ')}, in the ${names[a]}'s architecture (M2).`,
    })),
  );
}

/**
 * M2b's great works (M2B_SCIENCE.md §20.2): one of each in the whole neighbourhood, so each is one
 * picture in no power's architecture, grander than any project. All fiction.
 */
function greatWorks(): ArtBrief[] {
  const works: [string, string][] = [
    [
      'long-array',
      'The Long Array, a great work: a vast field of twelve identical radio-telescope dishes in a long curved line across the ground, linked by glowing cyan cables to a tall white control spire with an observation deck, all turned to the same point in the sky.',
    ],
    [
      'lapse-archive',
      'The Lapse Archive, a great work: a monumental stepped library of pale stone and glass, a great colonnaded entrance with wide steps, a tall central tower crowned by a slowly glowing beacon of light, terraces of reading gardens, warm light in every window.',
    ],
    [
      'lanewright-foundry',
      'The Lanewright Foundry, a great work: an immense industrial forge where lane beacons are built, a huge hangar with its doors open on a half-finished beacon ring glowing white-hot, heavy gantry cranes, smokestacks and a launch rail pointing at the sky.',
    ],
    [
      'commons',
      'The Commons, a great work: a great round civic hall with a shallow glass dome over a garden open to everyone, a ring of arcades with market stalls and benches, a central fountain and tall trees, banners in many colours, warm lights.',
    ],
  ];
  return works.map(([id, subject]) => ({
    id,
    series: 'structure' as const,
    subject,
    purpose: `Colony view: the great work ${id.replaceAll('-', ' ')}, in no power's architecture (M2b).`,
  }));
}

/** Increment 22's advisors (M2_WORLDS.md §24.1), and M3's Envoy: seven faces for each power, all fiction. */
function advisors(): ArtBrief[] {
  const sta = 'of the Sol Transit Authority, in a dark green civil-service uniform with plain geometric insignia';
  const coop = 'of the Frontier Cooperative, in practical blue work clothes with a small round pin';
  const wake = 'of the Hollow Wake raiders, in a patched flight jacket of mismatched dark red and grey panels';
  const people: [string, string, string][] = [
    [
      'sta-colonies',
      `The Commissioner for Colonies ${sta}: a woman in her fifties of West African descent with short greying hair and reading glasses pushed up; steady and caring, a little stern.`,
      'the Authority’s Colonies',
    ],
    [
      'sta-works',
      `The Chief Engineer ${sta}, sleeves rolled: a broad man in his forties with a fair beard and a pencil behind his ear; practical, unhurried.`,
      'the Authority’s Works',
    ],
    [
      'sta-treasury',
      `The Comptroller ${sta}: a South Asian woman in her sixties with silver hair in a neat bun and a precise gaze; exacting, dry.`,
      'the Authority’s Treasury',
    ],
    [
      'sta-science',
      `The chief scientist ${sta}, a lab coat over it: a slight man in his fifties of Japanese and German descent with untidy dark hair; curious, absorbed.`,
      'the Authority’s Science',
    ],
    [
      'sta-survey',
      `The Commander of the survey service ${sta} with a pilot's collar: a Brazilian woman in her thirties with dark curly hair tied back; alert, confident.`,
      'the Authority’s Survey',
    ],
    [
      'sta-watch',
      `The Inspector of the Watch ${sta}: a lean man in his fifties with a shaved head and a short grey moustache; watchful, unreadable.`,
      'the Authority’s Watch',
    ],
    [
      'frontier-colonies',
      `A settlement leader ${coop}: a woman in her fifties of Portuguese and Cape Verdean descent with laugh lines and grey-streaked curls; warm, motherly, firm.`,
      'the Cooperative’s Colonies',
    ],
    [
      'frontier-works',
      `A master builder ${coop}, a tool belt over one shoulder: a tall Kenyan man in his thirties with a close beard and dust on his sleeves; cheerful, strong.`,
      'the Cooperative’s Works',
    ],
    [
      'frontier-treasury',
      `The keeper of the common purse ${coop}: a Chinese man in his seventies with a thin white beard and small round spectacles; shrewd, kindly.`,
      'the Cooperative’s Treasury',
    ],
    [
      'frontier-science',
      `The head of the learning table ${coop}: a South Indian woman in her twenties with long dark hair in a braid and an ink stain on her fingers; eager, sharp.`,
      'the Cooperative’s Science',
    ],
    [
      'frontier-survey',
      `A pathfinder ${coop}, goggles round the neck: a Ghanaian man in his forties with a weathered face and a ready grin; restless, brave.`,
      'the Cooperative’s Survey',
    ],
    [
      'frontier-watch',
      `A lookout ${coop}, a scarf round the neck: a Polish woman in her forties with short fair hair and pale eyes; quiet, cautious.`,
      'the Cooperative’s Watch',
    ],
    [
      'wake-colonies',
      `The raider who keeps the holds ${wake}: a heavy-set older woman with cropped white hair and strong forearms; gruff, protective.`,
      'the Wake’s Colonies',
    ],
    [
      'wake-works',
      `The chief welder ${wake}, welding goggles pushed up on his forehead: a wiry man in his twenties with a smudge of soot on one cheek and a crooked grin; quick, cocky.`,
      'the Wake’s Works',
    ],
    [
      'wake-treasury',
      `The raider who counts the takings ${wake}: a thin man in his fifties with slicked-back hair, a gold tooth and many small rings; sly, calculating.`,
      'the Wake’s Treasury',
    ],
    [
      'wake-science',
      `The raiders' doctor and scientist ${wake}, a magnifying loupe on a strap: a gaunt woman in her sixties with wild grey hair; eccentric, brilliant.`,
      'the Wake’s Science',
    ],
    [
      'wake-survey',
      `The raiders' best navigator ${wake}: a young woman in her twenties with a shaved side of the head and a star chart tattoo on her neck; daring, amused.`,
      'the Wake’s Survey',
    ],
    [
      'wake-watch',
      `The raider who keeps watch ${wake}, a hood half up: a tall man in his forties with a long black beard and one clouded eye; silent, wary.`,
      'the Wake’s Watch',
    ],
    // M3's Envoy (M3_NEIGHBOURS.md §19.3).
    [
      'sta-envoy',
      `The Envoy ${sta}, a dark green sash of office across it: a Dutch woman in her forties with straight auburn hair cut at the jaw and an attentive half-smile; poised, diplomatic.`,
      'the Authority’s Envoy',
    ],
    [
      'frontier-envoy',
      `The envoy of the welcome table ${coop}, a woven shawl over one shoulder: a Peruvian man in his sixties with a broad, warm face and grey hair tied back; open, patient.`,
      'the Cooperative’s Envoy',
    ],
    [
      'wake-envoy',
      `The raider who does the talking ${wake}: a sharp-featured woman in her thirties with dark braided hair, a row of silver rings in one ear and a knowing look; smooth, persuasive.`,
      'the Wake’s Envoy',
    ],
    // M4's Admiral (M4_FLEETS.md §21.6).
    [
      'sta-admiral',
      `The Rear Admiral of the fleet ${sta}, two plain gold bars on the collar: a Spanish woman in her fifties with greying black hair pinned back and a level gaze; steady, exacting.`,
      'the Authority’s Admiral',
    ],
    [
      'frontier-admiral',
      `The defender of the defence table ${coop}, a worn navy padded vest over it: a Korean man in his forties with short black hair and a calm, careful face; patient, resolute.`,
      'the Cooperative’s Admiral',
    ],
    [
      'wake-admiral',
      `The raider who runs the guns ${wake}, a bandolier of tools across the chest: a broad-shouldered man in his fifties with a shaved head, a scarred chin and a hard grin; fearless, loud.`,
      'the Wake’s Admiral',
    ],
  ];
  return people.map(([id, subject, who]) => ({
    id: `advisor-${id}`,
    series: 'portrait' as const,
    subject,
    purpose: `Advisors: ${who} (M2, fiction).`,
  }));
}

/**
 * Increment 25's events (M2_WORLDS.md §27.2): one picture for each, shared by every power, so none
 * shows one power's buildings or ships. All are fiction but the flare's star.
 */
function events(): ArtBrief[] {
  const each: [string, string][] = [
    [
      'flare',
      'From the surface of a dim, rocky world, a red dwarf sun low in a black sky erupts in a blinding white-blue flare; ' +
        'in the foreground a small settlement of plain grey domes has its shutters closed and its lights dimmed, long hard shadows across the ground.',
    ],
    [
      'comet',
      'A bright comet with a long, faint blue tail swings past a ringless rocky planet; a small, plain tug ship with work lights ' +
        'closes on its icy nucleus, venting jets of vapour sparkling in the sunlight.',
    ],
    [
      'harvest',
      'Golden fields of tall grain under a pale, hazy sky with a small second moon, on a colony world; harvesting machines ' +
        'work in rows at dusk with their lamps on, and plain storage silos stand full beyond.',
    ],
    [
      'blight',
      'Inside a long greenhouse on a colony world, rows of crops gone grey and spotted under grow lights; ' +
        'a worker in plain overalls kneels to look closely at a sick leaf with a handheld lamp.',
    ],
    [
      'strike',
      'Outside the closed gates of a factory on a colony world, a crowd of workers stands together in work clothes with folded arms, ' +
        'idle cranes and cold chimneys behind them, under a hazy amber sky; plain blank banners, no writing.',
    ],
    [
      'epidemic',
      'A colony clinic corridor sealed with translucent plastic sheeting; medical staff in pale protective suits and visors ' +
        'move between beds, warm lights, a quiet and serious mood.',
    ],
    [
      'derelict',
      'An ancient human starship hangs dark and silent in deep space, its hull pitted and scarred, a dead engine ring; ' +
        "a small survey ship's searchlight sweeps across its flank.",
    ],
    [
      'lane-drift',
      'A great ring-shaped lane beacon floating in space, its blue light flickering and uneven, a ripple of distortion ' +
        'running through the space inside the ring; a small maintenance craft hovers beside it with work lights on.',
    ],
    [
      'petition',
      "Settlers gathered at a colony's landing field with bundles, crates and children, looking up at a plain colony ship " +
        'standing on its pad in the evening light; hopeful and restless.',
    ],
    [
      'defectors',
      'A small, plain survey ship drifts towards a docking light in space; through its lit bridge window its few crew can be seen ' +
        'looking out, uncertain; a quiet, tense moment.',
    ],
    [
      'smugglers',
      'At night in a hidden corner of a spaceport, a battered cargo shuttle with its ramp down; figures in hooded jackets unload ' +
        'crates of softly glowing fuel cells by the light of a single lamp.',
    ],
    [
      'founders-day',
      "A colony's central square at night, crowds celebrating under strings of warm lanterns and bursts of fireworks over plain domes, " +
        'a simple stone monument in the middle; joyful.',
    ],
    [
      'dust-stirs',
      'A field of fine glittering dust swirling in slow rings round a lit excavation platform in deep space, a few crew in suits watching from its rail.',
    ],
    [
      'rival-dig',
      'A distant excavation seen through a long-range telescope: work lights on a small dark moon, an unfamiliar ship beside it, the view framed by a round scope.',
    ],
    [
      'key-sings',
      'A strange smooth object of dark metal resting on a shelf in a dim stone vault, faint rings of pale light pulsing out from it, a technician nearby with hands over her ears.',
    ],
    [
      'second-tone',
      'A ring-shaped lane beacon in space with faint concentric waves passing through it, and in a small cockpit nearby a pilot listening with eyes closed.',
    ],
    [
      'charts-match',
      'An astronomer at a desk at night under an observatory dome, an old chart of glowing points laid over a screen of the real sky, one point circled in red.',
    ],
    [
      'great-flare',
      'A small red dwarf star erupting in an enormous flare that fills half the sky above a planet, auroras blazing over a settlement of domes with shutters closed.',
    ],
    [
      'nova',
      'A night sky over a colony with one new star blazing brighter than all the others, people standing on rooftops and terraces looking up.',
    ],
    [
      'meteor-storm',
      'Meteors streaking across the night sky of a colony world, one bright fireball breaking up, domes below with their lights on.',
    ],
    [
      'audit',
      'Two officials in plain uniforms going through ledgers and screens in a cramped spaceport customs office at night, a single lamp.',
    ],
    [
      'shareholders',
      'A crowded meeting hall of settlers in work clothes raising their hands to vote, a simple tally board behind the speaker.',
    ],
    [
      'feud',
      'Two rough crews facing each other across a dim hangar of battered, mismatched ships, tension in the air, one figure stepping between them.',
    ],
    [
      'long-night',
      'The twilight band of a tidally locked world: fields of dark crops half in shadow, a dim red sun low and unmoving on the horizon, workers moving lamps.',
    ],
    [
      'great-storm',
      'A vast storm rising through the banded clouds of a gas giant, lightning inside it, small floating towns drawing in their cables nearby.',
    ],
  ];
  return each.map(([id, subject]) => ({
    id: `event-${id}`,
    series: 'illustration' as const,
    subject,
    purpose: `An event's picture (M2_WORLDS.md §27.2): ${id.replaceAll('-', ' ')}, shared by every power.`,
  }));
}
