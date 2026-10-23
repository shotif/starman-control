// The advisors (M2_WORLDS.md §9, §24, M4_FLEETS.md §21.6): eight for each power, one for each department, each with a
// name in its power's tradition, a face and a voice. All of them are fiction. What they say is
// written here as sentences with blanks, filled from the game's state (no live AI text, D-17).

import type { FactionId } from './factions.ts';

export type Department = 'colonies' | 'works' | 'treasury' | 'science' | 'survey' | 'watch' | 'envoy' | 'admiral';

/** In the order they speak when two have news of the same weight. */
export const DEPARTMENTS: readonly Department[] = [
  'colonies',
  'treasury',
  'science',
  'works',
  'survey',
  'watch',
  'envoy',
  'admiral',
];

export const DEPARTMENT_NAMES: Record<Department, string> = {
  colonies: 'Colonies',
  works: 'Works',
  treasury: 'Treasury',
  science: 'Science',
  survey: 'Survey',
  watch: 'the Watch',
  envoy: 'the Envoy',
  admiral: 'the Admiral',
};

export type Voice = 'formal' | 'warm' | 'blunt';

/** The advisors speak every turn, only when something needs you, or not at all (a setting). */
export type AdvisorSetting = 'speak' | 'quiet' | 'off';

export interface Advisor {
  name: string;
  /** What they are called with their department: "Comptroller", "keeper of the Common Purse". */
  role: string;
  /** The portrait's file name under art/portrait/, without its width. */
  portrait: string;
}

export const ADVISORS: Record<FactionId, { voice: Voice; people: Record<Department, Advisor> }> = {
  sta: {
    voice: 'formal',
    people: {
      colonies: { name: 'Adaeze Morrow', role: 'Commissioner for Colonies', portrait: 'advisor-sta-colonies' },
      works: { name: 'Pavel Lindqvist', role: 'Chief Engineer', portrait: 'advisor-sta-works' },
      treasury: { name: 'Sunita Rao', role: 'Comptroller', portrait: 'advisor-sta-treasury' },
      science: { name: 'Dr Kenji Albrecht', role: 'Chief Scientist', portrait: 'advisor-sta-science' },
      survey: { name: 'Lucia Ferreira', role: 'Commander of the Survey', portrait: 'advisor-sta-survey' },
      watch: { name: 'Owen Hale', role: 'Inspector of the Watch', portrait: 'advisor-sta-watch' },
      // M3's Envoy (M3_NEIGHBOURS.md §19.3).
      envoy: { name: 'Isabel Achterberg', role: 'Envoy of the Authority', portrait: 'advisor-sta-envoy' },
      // M4's Admiral (M4_FLEETS.md §21.6).
      admiral: { name: 'Helena Vasquez', role: 'Rear Admiral of the Fleet', portrait: 'advisor-sta-admiral' },
    },
  },
  frontier: {
    voice: 'warm',
    people: {
      colonies: { name: 'Ines Barros', role: 'of the Settlement table', portrait: 'advisor-frontier-colonies' },
      works: { name: 'Tobias Mwangi', role: 'of the Builders’ table', portrait: 'advisor-frontier-works' },
      treasury: { name: 'Lin Feng', role: 'keeper of the Common Purse', portrait: 'advisor-frontier-treasury' },
      science: { name: 'Priya Nandakumar', role: 'of the Learning table', portrait: 'advisor-frontier-science' },
      survey: { name: 'Sefa Owusu', role: 'of the Pathfinders', portrait: 'advisor-frontier-survey' },
      watch: { name: 'Mara Kowal', role: 'of the Lookouts', portrait: 'advisor-frontier-watch' },
      envoy: { name: 'Rafael Quispe', role: 'of the Welcome table', portrait: 'advisor-frontier-envoy' },
      admiral: { name: 'Joon-ho Park', role: 'of the Defence table', portrait: 'advisor-frontier-admiral' },
    },
  },
  'hollow-wake': {
    voice: 'blunt',
    people: {
      colonies: { name: 'Grist', role: 'who keeps the holds', portrait: 'advisor-wake-colonies' },
      works: { name: 'Weld', role: 'chief welder', portrait: 'advisor-wake-works' },
      treasury: { name: 'Tally', role: 'who counts the takings', portrait: 'advisor-wake-treasury' },
      science: { name: 'Doc Marrow', role: 'doctor and scientist', portrait: 'advisor-wake-science' },
      survey: { name: 'Farcast', role: 'navigator', portrait: 'advisor-wake-survey' },
      watch: { name: 'Lantern', role: 'who keeps watch', portrait: 'advisor-wake-watch' },
      envoy: { name: 'Hush', role: 'who does the talking', portrait: 'advisor-wake-envoy' },
      admiral: { name: 'Gaff', role: 'who runs the guns', portrait: 'advisor-wake-admiral' },
    },
  },
  // The Duskfolk's names are translations (M3_NEIGHBOURS.md §24.1). Only First Voice has a face yet:
  // the others are seen only by a player of the Concord, which comes later.
  'dusk-concord': {
    voice: 'formal',
    people: {
      colonies: { name: 'Warm Stone', role: 'who speaks for the Settled', portrait: 'advisor-dusk-colonies' },
      works: { name: 'Long Hands', role: 'who speaks for the Builders', portrait: 'advisor-dusk-works' },
      treasury: { name: 'Full Store', role: 'who keeps the Stores', portrait: 'advisor-dusk-treasury' },
      science: { name: 'Quiet Eye', role: 'who speaks for the Learned', portrait: 'advisor-dusk-science' },
      survey: { name: 'Far Walker', role: 'who speaks for the Wayfarers', portrait: 'advisor-dusk-survey' },
      watch: { name: 'Night Ear', role: 'who speaks for the Watchers', portrait: 'advisor-dusk-watch' },
      envoy: { name: 'First Voice', role: 'who speaks to strangers', portrait: 'advisor-dusk-envoy' },
      admiral: { name: 'Stone Shield', role: 'who speaks for the Guardians', portrait: 'advisor-dusk-admiral' },
    },
  },
  // The Drifters' names are translations too (M3_NEIGHBOURS.md §25.1); only Fair Wind has a face yet.
  'drift-moot': {
    voice: 'warm',
    people: {
      colonies: { name: 'Wide Shelter', role: 'who speaks for the Settled', portrait: 'advisor-drift-colonies' },
      works: { name: 'Slow Hands', role: 'who speaks for the Makers', portrait: 'advisor-drift-works' },
      treasury: { name: 'Full Hold', role: 'who keeps the Stores', portrait: 'advisor-drift-treasury' },
      science: { name: 'Long Memory', role: 'who speaks for the Learned', portrait: 'advisor-drift-science' },
      survey: { name: 'Far Drift', role: 'who speaks for the Wanderers', portrait: 'advisor-drift-survey' },
      watch: { name: 'Still Air', role: 'who speaks for the Listeners', portrait: 'advisor-drift-watch' },
      envoy: { name: 'Fair Wind', role: 'who carries offers', portrait: 'advisor-drift-envoy' },
      admiral: { name: 'Deep Keel', role: 'who speaks for the Wardens', portrait: 'advisor-drift-admiral' },
    },
  },
  // The heirs' names are designations, translated (M5_UNKNOWN.md §27.1); only Exact Measure has a face yet.
  continuance: {
    voice: 'formal',
    people: {
      colonies: { name: 'Second Survey', role: 'which places the copies', portrait: 'advisor-heirs-colonies' },
      works: { name: 'Patient Lathe', role: 'which keeps the Forge', portrait: 'advisor-heirs-works' },
      treasury: { name: 'True Ledger', role: 'which counts', portrait: 'advisor-heirs-treasury' },
      science: { name: 'Old Index', role: 'which remembers the makers', portrait: 'advisor-heirs-science' },
      survey: { name: 'Far Vector', role: 'which goes ahead', portrait: 'advisor-heirs-survey' },
      watch: { name: 'Still Lens', role: 'which watches', portrait: 'advisor-heirs-watch' },
      envoy: { name: 'Exact Measure', role: 'which negotiates', portrait: 'advisor-heirs-envoy' },
      admiral: { name: 'Hard Anvil', role: 'which defends', portrait: 'advisor-heirs-admiral' },
    },
  },
  // The Unhomed's names are translations too (M5_UNKNOWN.md §25.1); only Kindling has a face yet.
  'last-hearth': {
    voice: 'warm',
    people: {
      colonies: { name: 'Banked Coal', role: 'who keeps the settled', portrait: 'advisor-hearth-colonies' },
      works: { name: 'Ash Mender', role: 'who keeps the arks whole', portrait: 'advisor-hearth-works' },
      treasury: { name: 'Last Measure', role: 'who keeps the stores', portrait: 'advisor-hearth-treasury' },
      science: { name: 'Long Reckoner', role: 'who keeps the old learning', portrait: 'advisor-hearth-science' },
      survey: { name: 'Far Spark', role: 'who goes ahead', portrait: 'advisor-hearth-survey' },
      watch: { name: 'Night Tender', role: 'who keeps the watch fires', portrait: 'advisor-hearth-watch' },
      envoy: { name: 'Kindling', role: 'who asks', portrait: 'advisor-hearth-envoy' },
      admiral: { name: 'Cinder Ward', role: 'who guards the arks', portrait: 'advisor-hearth-admiral' },
    },
  },
};

/**
 * What advisors say (§24.2), each in three voices. `{blank}`s are filled from the state: a place,
 * a number of turns, a technology. Every line addresses the player as Control (D-11).
 */
export type LineKind =
  | 'hungry'
  | 'hunger-coming'
  | 'revolt'
  | 'debt'
  | 'debt-coming'
  | 'unrest'
  | 'no-research'
  | 'overdrive-stopped'
  | 'no-fuel'
  | 'researched'
  | 'inspired'
  | 'observed'
  | 'built'
  | 'zoned'
  | 'investigated'
  | 'lane-opened'
  | 'surveyed'
  | 'founded'
  | 'idle-yard'
  | 'idle-ship'
  | 'rival-founded'
  | 'rival-lane'
  | 'rival-ship'
  | 'rival-tech'
  | 'great-work'
  | 'contact-talk'
  | 'contact-words'
  | 'contact-understood'
  | 'gift-sent'
  | 'gift-received'
  | 'offer-waiting'
  | 'offer-accepted'
  | 'offer-refused'
  | 'treaty-begun'
  | 'treaty-ending'
  | 'treaty-broken'
  | 'event'
  // The Admiral (M4_FLEETS.md §21.6).
  | 'warship-built'
  | 'design-new'
  | 'refitted'
  // War and peace (M4_FLEETS.md §23.5).
  | 'war-ours'
  | 'war-theirs'
  | 'war-ally'
  | 'peace-made'
  | 'intercepted'
  // Battles (M4_FLEETS.md §24.8).
  | 'battle-held'
  | 'battle-lost'
  | 'battle-even';

export const LINES: Record<LineKind, Record<Voice, string>> = {
  hungry: {
    formal: 'Control, {place} {is} going hungry. I recommend farms there, or hydroponics, without delay.',
    warm: 'Control, people are hungry at {place}. Let’s zone farms or build hydroponics, quickly, please.',
    blunt: '{place}: empty bellies. Farms or hydroponics, now.',
  },
  'hunger-coming': {
    formal: 'Control, food {where} runs out {when}. Farms or hydroponics would prevent it.',
    warm: 'Control, the food {where} won’t last: it runs out {when}. Farms or hydroponics, and soon?',
    blunt: 'Food {where} runs dry {when}. Farms, or hydroponics.',
  },
  revolt: {
    formal: 'Control, {place} is in open revolt and makes nothing. Its approval must be raised.',
    warm: 'Control, {place} has risen up and won’t work. We need to win them back: lower taxes, feed them, build them something.',
    blunt: '{place} has stopped taking orders. Give them a reason to start again.',
  },
  debt: {
    formal: 'Control, the treasury is in debt, and every colony feels it. Raise taxes or reduce our upkeep.',
    warm: 'Control, we owe more than we have, and the colonies know it. Raise taxes, or let something go?',
    blunt: 'We’re in the red. Everyone’s sour about it. Tax harder or cut something.',
  },
  'debt-coming': {
    formal: 'Control, at this rate the treasury falls into debt {when}. Raise taxes, zone markets, or cut overdrive.',
    warm: 'Control, the purse runs dry {when}. Markets, taxes, less overdrive: any of them would help.',
    blunt: 'Broke {when} at this rate. Markets, taxes, or stop buying industry.',
  },
  unrest: {
    formal: 'Control, {place} is restless: it makes less and has stopped growing.',
    warm: 'Control, {place} is unhappy, and it shows in the work. Something for them, perhaps?',
    blunt: '{place} is grumbling. Less work, no growth. Fix it before it turns.',
  },
  'no-research': {
    formal: 'Control, our laboratories have nothing to work on. Please choose a technology.',
    warm: 'Control, the labs are idle! Pick us something to learn.',
    blunt: 'Nothing on the bench. Give me a problem.',
  },
  'overdrive-stopped': {
    formal: 'Control, the treasury could not pay for {place}’s overdrive, so it has stopped.',
    warm: 'Control, we couldn’t pay to push {place} harder, so it’s back to its own pace.',
    blunt: 'No credits for {place}’s overdrive. It’s off.',
  },
  'no-fuel': {
    formal: 'Control, the fusion plant at {place} is idle: we have no fusion fuel. A refinery would supply it.',
    warm: 'Control, {place}’s fusion plant has gone cold for want of fuel. A refinery, maybe?',
    blunt: '{place}’s reactor is cold. No fuel. Get a refinery going.',
  },
  researched: {
    formal: 'Control, our scientists have completed {tech}. {effect}',
    warm: 'Control, we’ve cracked {tech}! {effect}',
    blunt: '{tech}: done. {effect}',
  },
  // Discoveries (M2B_SCIENCE.md §17).
  inspired: {
    formal: 'Control, {deed} has taught us something of {tech}: {points} research towards it.',
    warm: 'Control, {deed} gave us ideas! {tech} is {points} research nearer.',
    blunt: '{deed} taught us a thing or two. {tech}: {points} closer.',
  },
  observed: {
    formal: 'Control, our survey of {place} confirms the old catalogues: {what}. {points} research.',
    warm: 'Control, the old star catalogues were right about {place}: {what}! {points} research for the labs.',
    blunt: '{place}: {what}, as the old catalogues said. {points} research.',
  },
  built: {
    formal: 'Control, {place} has completed {what}.',
    warm: 'Control, {place} has finished {what}. The builders are proud of it.',
    blunt: '{what} at {place}: built.',
  },
  zoned: {
    formal: 'Control, {place} has zoned a district for {zone}.',
    warm: 'Control, {place} has new {zone} ground, all laid out.',
    blunt: '{place}: a district turned to {zone}.',
  },
  investigated: {
    formal: 'Control, our survey of the anomaly at {place} is complete. The report is in.',
    warm: 'Control, the crew at {place} have finished with the anomaly. Read what they found!',
    blunt: 'Done poking at the thing at {place}. Read it.',
  },
  'lane-opened': {
    formal: 'Control, the lane {place} is tuned and open.',
    warm: 'Control, the lane {place} is open: ships can use it now.',
    blunt: 'Lane {place}: open.',
  },
  surveyed: {
    formal: 'Control, {place} has been surveyed.',
    warm: 'Control, we’ve charted {place}. Have a look at what’s there.',
    blunt: '{place}, charted.',
  },
  founded: {
    formal: 'Control, {what} stands on {place}.',
    warm: 'Control, we have {what} on {place}!',
    blunt: '{what} on {place}. Ours now.',
  },
  'idle-yard': {
    formal: 'Control, the shipyard at {place} is building nothing.',
    warm: 'Control, the yard at {place} is quiet. Shall we build something?',
    blunt: '{place}’s yard is sitting idle.',
  },
  'idle-ship': {
    formal: 'Control, {count} awaiting orders.',
    warm: 'Control, {count} waiting for you.',
    blunt: '{count} sitting on their hands.',
  },
  // The Watch (M2_WORLDS.md §26.3).
  'rival-founded': {
    formal: 'Control, the {power} has founded {what} on {place}.',
    warm: 'Control, our neighbours of the {power} have {what} on {place} now.',
    blunt: 'The {power} put {what} on {place}. I’m watching them.',
  },
  'rival-lane': {
    formal: 'Control, the {power} has opened a lane {place}. It is closed to our ships.',
    warm: 'Control, the {power} have a new lane {place}. Not one we can use, mind.',
    blunt: 'The {power} lit a lane {place}. Ours can’t use it.',
  },
  // Contact (M3_NEIGHBOURS.md §19.3): the Envoy speaks.
  // The Admiral (M4_FLEETS.md §21.6).
  'warship-built': {
    formal: 'Control, {place} has commissioned {what}, the {ship}. She is ready for orders.',
    warm: 'Control, the {ship} is out of the yard at {place}: {what}, and a good crew aboard.',
    blunt: 'New gun on the line: the {ship}, {what}, out of {place}.',
  },
  'design-new': {
    formal: 'Control, the yard has drawn a new design, the {design}: {what}.',
    warm: 'Control, the yard has a new design for us, the {design}: {what}.',
    blunt: 'The yard’s new design: the {design}. {what}.',
  },
  refitted: {
    formal: 'Control, the {ship} has been refitted at {place} to the {design}.',
    warm: 'Control, the {ship} is refitted at {place}: she’s a {design} now.',
    blunt: 'The {ship}: refitted at {place}. A {design} now.',
  },
  'war-ours': {
    formal: 'Control, we are at war with the {power}, as you ordered. Every power that knows us has heard of it.',
    warm: 'Control, it’s done: we’re at war with the {power}. Everyone will have heard, I’m afraid.',
    blunt: 'We’re at war with the {power}. Everyone knows it.',
  },
  'war-theirs': {
    formal: 'Control, the {power} has declared war on us. Our fleets should be told.',
    warm: 'Control, the {power} has declared war on us! We need to look to our colonies.',
    blunt: 'The {power} wants a fight. They’ve declared war.',
  },
  'war-ally': {
    formal: 'Control, the {power} has declared war on the {ally}, our ally: by our alliance we are at war with it too.',
    warm: 'Control, the {power} has attacked the {ally}, and our alliance means we’re at war with them too.',
    blunt: 'The {power} went after the {ally}. Our alliance drags us in: we’re at war.',
  },
  'peace-made': {
    formal: 'Control, peace is made with the {power}. Neither of us may declare war for ten turns.',
    warm: 'Control, we have peace with the {power} at last. Ten turns of truce, at least.',
    blunt: 'Peace with the {power}. Ten turns of quiet, by the treaty.',
  },
  intercepted: {
    formal: 'Control, {what} was stopped at {place} by the {power}’s warships.',
    warm: 'Control, the {power}’s warships stopped {what} at {place}.',
    blunt: '{what} ran into the {power}’s guns at {place}. Stopped dead.',
  },
  'battle-held': {
    formal: 'Control, we have fought the {power} at {place}, and the system is ours. The report has the reckoning.',
    warm: 'Control, we held {place} against the {power}! The crews did well; the report says what it cost.',
    blunt: 'Fought the {power} at {place}. We’re still there; they’re not.',
  },
  'battle-lost': {
    formal: 'Control, we were beaten by the {power} at {place}. I recommend you read why before we try again.',
    warm: 'Control, the {power} drove us off at {place}. The report says why: let’s learn from it.',
    blunt: 'The {power} beat us at {place}. Read why, then we hit back harder.',
  },
  'battle-even': {
    formal: 'Control, the battle with the {power} at {place} is undecided: both fleets hold their ground.',
    warm: 'Control, we and the {power} are both still at {place}: the fighting goes on.',
    blunt: 'Nobody gave way at {place}. The {power} and us, still at it.',
  },
  'contact-talk': {
    formal: 'Control, we have made contact with the {power} at {place}. They share our tongue, so we may talk.',
    warm: 'Control, we’ve met the {power}, at {place}! We speak the same tongue, so we can talk whenever you like.',
    blunt: 'Found the {power}, at {place}. Same tongue as ours. We can talk.',
  },
  'contact-words': {
    formal:
      'Control, we have heard the {power} at {place}, but cannot understand them yet. I have begun to learn their tongue.',
    warm: 'Control, there’s someone new out there: the {power}, at {place}. We can’t understand them yet, but I’m learning.',
    blunt: 'The {power}, at {place}. Can’t make sense of them yet. I’m working on it.',
  },
  'contact-understood': {
    formal: 'Control, I can now speak the tongue of the {power}. We may talk.',
    warm: 'Control, I’ve got it: I can speak with the {power} now!',
    blunt: 'I can talk to the {power} now.',
  },
  // Gifts (M3_NEIGHBOURS.md §20.2).
  'gift-sent': {
    formal: 'Control, I have delivered our gift of {credits} credits to the {power}. It will be remembered.',
    warm: 'Control, our gift of {credits} credits reached the {power}. They were touched, I think.',
    blunt: 'Took the {power} their {credits} credits. They’ll remember.',
  },
  'gift-received': {
    formal: 'Control, the {power} has sent us a gift of {credits} credits.',
    warm: 'Control, the {power} sent us {credits} credits, as a gift! How kind.',
    blunt: 'The {power} sent us {credits} credits. Free money. Wonder what they want.',
  },
  // Treaties (M3_NEIGHBOURS.md §21).
  'offer-waiting': {
    formal: 'Control, the {power} offers us {treaty}. They await your answer before this turn ends.',
    warm: 'Control, the {power} would like {treaty} with us! Shall we say yes? They need an answer this turn.',
    blunt: 'The {power} wants {treaty}. Yes or no, this turn.',
  },
  'offer-accepted': {
    formal: 'Control, the {power} has accepted our offer of {treaty}.',
    warm: 'Control, good news: the {power} said yes to {treaty}!',
    blunt: 'The {power} took our {treaty}.',
  },
  'offer-refused': {
    formal: 'Control, the {power} has declined our offer of {treaty}. Their regard for us is not yet enough.',
    warm: 'Control, the {power} said no to {treaty}, for now. They need to think better of us first.',
    blunt: 'The {power} said no to {treaty}. They don’t like us enough. Yet.',
  },
  'treaty-begun': {
    formal: 'Control, we now have {treaty} with the {power}.',
    warm: 'Control, we have {treaty} with the {power} now. A good day.',
    blunt: 'Done: {treaty} with the {power}.',
  },
  'treaty-ending': {
    formal: 'Control, our {treaty} with the {power} is coming to an end.',
    warm: 'Control, our {treaty} with the {power} is ending. A pity.',
    blunt: 'Our {treaty} with the {power} is finished.',
  },
  'treaty-broken': {
    formal: 'Control, the {power} has broken our {treaty}. It will not be forgotten.',
    warm: 'Control, the {power} broke our {treaty}! After everything.',
    blunt: 'The {power} broke the {treaty}. Remember that.',
  },
  // Events (M2_WORLDS.md §27.6): the department the event belongs to speaks.
  event: {
    formal: 'Control, {what} {where} requires your decision.',
    warm: 'Control, {what} {where}! What shall we do? It’s your call.',
    blunt: '{what} {where}. Your call, Control.',
  },
  // Rumours (M2B_SCIENCE.md §19.3).
  'rival-tech': {
    formal: 'Control, word from the lanes: the {power} has mastered {tech}.',
    warm: 'Control, the talk on the lanes is that the {power} have worked out {tech}. Good for them, and a lesson for us.',
    blunt: 'Word is the {power} cracked {tech}. Keep up.',
  },
  // Great works (M2B_SCIENCE.md §20.2).
  'great-work': {
    formal: 'Control, the {power} has finished the {work}. There will be no other.',
    warm: 'Control, the {power} have built the {work}! It’s theirs now, and the whole neighbourhood is talking.',
    blunt: 'The {power} got the {work} done. That one’s gone.',
  },
  'rival-ship': {
    formal: 'Control, {ship} is at {place}.',
    warm: 'Control, we’ve spotted {ship} at {place}.',
    blunt: '{ship} at {place}. Keeping my eye on it.',
  },
};

/** Fills a line's blanks (a blank with no value is left out) and starts it with a capital. */
export function fillLine(template: string, values: Record<string, string>): string {
  const line = template
    .replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? '')
    .replace(/\s+([.,])/g, '$1')
    .replace(/ {2,}/g, ' ')
    .trim();
  return `${line.charAt(0).toUpperCase()}${line.slice(1)}`;
}
