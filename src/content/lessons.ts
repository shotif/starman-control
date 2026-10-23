// Lessons when they matter (M6_ONE.md §4, §20, D-80): the first time each system matters to the
// player, the advisor whose work it is says what it is and where to act, in the power's voice; each
// is told once on this device, and every one is kept in the codex as a summary. In the order they
// are told when more than one is due. When each is due is worked out in src/app/lessons.ts.

import type { Department, Voice } from './advisors.ts';

export type LessonId =
  | 'debt'
  | 'hunger'
  | 'unrest'
  | 'war'
  | 'raided'
  | 'arks'
  | 'contact'
  | 'talk'
  | 'assembly'
  | 'warships'
  | 'relic-site'
  | 'chapter'
  | 'keys'
  | 'leaders'
  | 'agents'
  | 'event';

export interface Lesson {
  id: LessonId;
  /** Its name in the codex's How to play. */
  title: string;
  department: Department;
  lines: Record<Voice, string>;
  /** Where its control is, on the phone and the desktop. */
  hint: string;
  /** The controls lit by the ring (`data-guide` in the screens), any of them that are showing. */
  targets: readonly string[];
  /** How the system works, for the codex: two or three plain sentences. */
  summary: string;
}

export const LESSONS: readonly Lesson[] = [
  {
    id: 'debt',
    title: 'Credits and debt',
    department: 'treasury',
    lines: {
      formal:
        'Control, our treasury is below zero. While we are in debt, leaders may leave us and no governor starts a project that costs upkeep.',
      warm: 'Control, we’re spending more than we have. We’re in debt, and people notice. Let’s find the leak.',
      blunt: 'We’re broke. In the red. Fix it before people start walking.',
    },
    hint: 'The empire (P) shows our income and what costs upkeep. Raise taxes, run colonies for trade, or scrap a ship.',
    targets: ['empire'],
    summary:
      'Credits come from taxes and trade, and go on the upkeep of ships, outposts and projects, and on agents and leaders. Below zero, leaders may leave and governors start nothing that costs upkeep. Higher taxes, colonies run for trade, and scrapping ships we do not need bring the treasury back.',
  },
  {
    id: 'hunger',
    title: 'Food and hunger',
    department: 'colonies',
    lines: {
      formal: 'Control, a colony of ours is hungry. Hungry for a few turns, it will begin to lose people.',
      warm: 'Control, one of our colonies doesn’t have enough to eat. We need to feed them, and soon.',
      blunt: 'People are going hungry. Give it a few turns and they start dying off.',
    },
    hint: 'A colony’s panel shows its food. Zone farms, build hydroponics, or link it to the capital by lanes.',
    targets: ['empire'],
    summary:
      'Colonies on the capital’s lanes share one store of food; a colony cut off from them must feed itself. Farms (a district zoned for food) and hydroponics make food, and people eat it. A colony hungry for a few turns loses people, and hunger lowers approval.',
  },
  {
    id: 'unrest',
    title: 'Approval and unrest',
    department: 'colonies',
    lines: {
      formal: 'Control, a colony is in unrest. It will not grow, and in revolt it stops working altogether.',
      warm: 'Control, one of our colonies is really unhappy. They’ve stopped growing, and it could get worse.',
      blunt: 'A colony’s turning on us. No growth now. Push it and they stop working.',
    },
    hint: 'A colony’s panel shows its approval and why. Lower taxes, a civic centre, or an edict helps.',
    targets: ['empire'],
    summary:
      'Every colony has an approval, made of many parts: taxes, crowding, distance from the capital, hunger, war weariness, and what is built there. In unrest a colony stops growing; in revolt it stops working. Lower taxes, civic centres, recreation and edicts raise it.',
  },
  {
    id: 'war',
    title: 'War and peace',
    department: 'admiral',
    lines: {
      formal: 'Control, we are at war. Our fleets will fight theirs wherever they meet, and either side may invade.',
      warm: 'Control, it’s war. I wish it weren’t. Our fleets will meet theirs, and our colonies need guarding.',
      blunt: 'It’s war. Ships fight on sight, and they’ll be coming for our worlds.',
    },
    hint: 'Fleets take orders from their panel. Diplomacy (Y, or Menu on a phone) is where peace is offered.',
    targets: ['diplomacy', 'menu-diplomacy'],
    summary:
      'At war, fleets fight wherever they meet, in rounds at three ranges, and a fleet with troop transports may invade a colony whose orbit it holds. Batteries, shields and barracks defend a colony. Peace is offered in Diplomacy; a long war tires the people.',
  },
  {
    id: 'raided',
    title: 'Raids',
    department: 'watch',
    lines: {
      formal: 'Control, raiders took from one of our holdings. They need no war to do it, while they hold its orbit.',
      warm: 'Control, someone’s raiding us! They took what they could while they held the orbit.',
      blunt: 'Raiders hit us. No war, no warning. They take what’s there while they hold orbit.',
    },
    hint: 'The report says where. Warships there drive them off; protection bought in Diplomacy keeps them away.',
    targets: [],
    summary:
      'An outlaw power may raid without declaring war: while its fleet holds a holding’s orbit, it takes the colony’s credits of the turn or the outpost’s yields, never more than we have. Warships there drive the raiders off, or protection can be bought from them in Diplomacy.',
  },
  {
    id: 'arks',
    title: 'The arks',
    department: 'envoy',
    lines: {
      formal:
        'Control, very old ships have come out of the dark, asking every power for a world. They wait for our answer.',
      warm: 'Control, there are people out there with nowhere to go. They’re asking us for a home. What shall we say?',
      blunt: 'Arks at the edge of the map, begging for a world. They want an answer.',
    },
    hint: 'What needs you takes you to them, as does the panel of the star where they wait.',
    targets: [],
    summary:
      'Once in a game, a people whose star is dying come to the edge of the map and ask every power for a world. A power may give them a free world it holds, take them in among its own people, or refuse; given or taken, they remember it. The game says which stars are real and what is fiction.',
  },
  {
    id: 'contact',
    title: 'First contact',
    department: 'envoy',
    lines: {
      formal: 'Control, we have met another power. We share no words yet; we learn more of theirs each turn.',
      warm: 'Control, we’re not alone! We can’t understand each other yet, but we’re learning a little every turn.',
      blunt: 'We’ve met someone. Can’t talk yet. Give it time.',
    },
    hint: 'Diplomacy (Y, or Menu on a phone) shows every power we know, and how far our words go.',
    targets: ['diplomacy', 'menu-diplomacy'],
    summary:
      'Powers meet when their ships or holdings see each other. At first they share only a few words, learnt a little each turn (Translation helps with an alien tongue); once they can talk, they can deal.',
  },
  {
    id: 'talk',
    title: 'Talking and treaties',
    department: 'envoy',
    lines: {
      formal: 'Control, we can talk with them now. Treaties are open to us, as far as they regard us well enough.',
      warm: 'Control, we can finally talk! Let’s see who’d like to work with us.',
      blunt: 'We can talk now. Deals are on the table, if they like us enough.',
    },
    hint: 'In Diplomacy, each power shows how it regards us and why, and the treaties it would take.',
    targets: ['diplomacy', 'menu-diplomacy'],
    summary:
      'Each power regards every other by what it remembers: gifts, treaties kept or broken, wars, raids and more, fading with time. A treaty is offered in Diplomacy and taken only when the other regards us well enough: open lanes, shared research, borders, trade, passage, pacts and alliances.',
  },
  {
    id: 'assembly',
    title: 'The Assembly',
    department: 'envoy',
    lines: {
      formal:
        'Control, the Assembly has formed. Each member votes by its people, and every twenty turns it elects a leader.',
      warm: 'Control, the powers have formed an Assembly! Votes go by people, and there’s an election every twenty turns.',
      blunt: 'There’s an Assembly now. Votes by headcount. Elections every twenty turns.',
    },
    hint: 'The Assembly (G, or Menu on a phone) shows its members, their votes and the next election.',
    targets: ['menu', 'menu-assembly'],
    summary:
      'The Assembly forms once three powers can each talk with the others. Members vote by their people; every twenty turns they elect a leader, and a power chosen by two thirds of all the votes wins the game. Members propose sanctions and calls for peace.',
  },
  {
    id: 'warships',
    title: 'Warships and fleets',
    department: 'admiral',
    lines: {
      formal: 'Control, warships are built to designs of our own, and fight in fleets under the orders we give.',
      warm: 'Control, about our warships: we design them, build them at a shipyard, and send them out together.',
      blunt: 'Warships: design them, build them, group them, point them.',
    },
    hint: 'Designs (B, or from a shipyard in a colony’s panel); a fleet takes its orders from its panel.',
    targets: [],
    summary:
      'A warship is a hull with the weapons, shields and armour of a design we make, built at a shipyard. Ships at one star form a fleet, which moves and fights together and may be sent to invade, bombard or (for an outlaw) raid. Every ship costs upkeep.',
  },
  {
    id: 'relic-site',
    title: 'Relic sites',
    department: 'science',
    lines: {
      formal:
        'Control, we know of a relic site of the Absent. With Relic studies and a holding there, we may excavate it.',
      warm: 'Control, there’s a relic site out there, left by the Absent! We could dig, with a holding there.',
      blunt: 'Ruins out there. Get a holding there and Relic studies, and we dig.',
    },
    hint: 'Relics (J, or Menu) lists the sites we know; a site’s panel has Excavate.',
    targets: ['menu', 'menu-relics'],
    summary:
      'The Absent left sites at the dead stars. A power that has learnt Relic studies and holds a colony or outpost in a site’s system may excavate it, giving it a share of its research. Each site has three chapters; all of it is fiction.',
  },
  {
    id: 'chapter',
    title: 'Chapters and the journal',
    department: 'science',
    lines: {
      formal:
        'Control, a chapter of our excavation is done and waits for our choice. Each tells us more of the Absent.',
      warm: 'Control, we’ve finished a chapter! There’s a choice to make, and a page of the story to read.',
      blunt: 'Chapter done. Pick what we take from it. There’s more of the story too.',
    },
    hint: 'Relics (J, or Menu) shows the choice and keeps the journal.',
    targets: ['menu', 'menu-relics'],
    summary:
      'Each chapter done asks a choice: study it for research, or take what it gives. Each brings the next revelation of the Absent, kept in the journal on the Relics screen.',
  },
  {
    id: 'keys',
    title: 'The keys and the Answer',
    department: 'science',
    lines: {
      formal:
        'Control, a key of the Absent has been found. There are five. A power holding all five may begin the Answer, and win.',
      warm: 'Control, someone has found a key! There are five of them, and whoever holds them all can begin the Answer.',
      blunt: 'A key turned up. Five in all. Hold the lot, start the Answer, win.',
    },
    hint: 'Relics (J, or Menu) shows the keys as far as we know them.',
    targets: ['menu', 'menu-relics'],
    summary:
      'Five sites each hold a key, found with their third chapter, held by the holding that dug it and taken with it. A power holding all five that has learnt The instrument may begin the Answer: ten turns, while every power that does not call for peace goes to war on it. Done, it wins by the keys.',
  },
  {
    id: 'leaders',
    title: 'Leaders',
    department: 'colonies',
    lines: {
      formal:
        'Control, people offer to serve us. Hired and posted, a leader makes a fleet, a colony or a department better.',
      warm: 'Control, some good people want to work with us! A leader in the right post can make a real difference.',
      blunt: 'People want jobs. Hire the good ones, put them where they help.',
    },
    hint: 'Leaders (L, or Menu): hire for a fee, post them, and pay their wages.',
    targets: ['menu', 'menu-leaders'],
    summary:
      'Every ten turns three people are offered, each with a calling: a commander for a fleet, a steward for a colony, a scholar for research, an ambassador, or a spymaster. They cost a fee and a wage, grow with the turns they serve, and may leave if our treasury is empty or their colony unhappy.',
  },
  {
    id: 'agents',
    title: 'Agents',
    department: 'watch',
    lines: {
      formal: 'Control, our agents could watch a power we know, for a few credits a turn, and learn what it holds.',
      warm: 'Control, we could keep an eye on our neighbours, for a few credits a turn. Shall we?',
      blunt: 'For a few credits a turn I can put eyes on anyone we’ve met.',
    },
    hint: 'In Diplomacy (Y, or Menu), under each power: Agents. Our guard at home is there too.',
    targets: ['diplomacy', 'menu-diplomacy'],
    summary:
      'Agents watch a power we have met, for credits each turn, and what they learn grows while they watch: its holdings, then its ships, then its secrets (its technologies, research and treasury). A guard at home makes others’ agents slower.',
  },
  {
    id: 'event',
    title: 'Events',
    department: 'colonies',
    lines: {
      formal: 'Control, something has happened that needs a decision. Each choice has a cost and a consequence.',
      warm: 'Control, something’s come up and we need to decide. Neither choice is free.',
      blunt: 'Something’s happened. Pick a choice. Both cost something.',
    },
    hint: 'The event waits in the report and in What needs you, with its picture and two choices.',
    targets: [],
    summary:
      'Now and then an event comes with a picture and two choices, each with a cost and a consequence; left unanswered for a few turns, the first is taken. Some are real astronomy, marked so; the rest are fiction.',
  },
];
