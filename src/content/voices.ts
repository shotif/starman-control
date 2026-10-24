// What the voices say (docs/design/VOICES.md §2, D-100): every advisor line and every radio line has a
// spoken form with no blank in it (no place, power, technology, ship or number), true for every case
// the line covers and meaning what the written line means, in the same manner. The card still shows
// the whole written line while it is spoken. The lessons, the guided opening and the line for an
// empty sky have no blanks, so they are spoken as they are written. All of it is fiction.

import { ADVISORS, type Department, LINES, type LineKind, type Voice } from './advisors.ts';
import type { FactionId } from './factions.ts';
import { ALONE_LINES, GUIDE_STEPS } from './guide.ts';
import { LESSONS, type LessonId } from './lessons.ts';
import type { RadioStage } from './radio.ts';

export const SPOKEN: Record<LineKind, Record<Voice, string>> = {
  hungry: {
    formal: 'Control, our people are going hungry. I recommend farms, or hydroponics, without delay.',
    warm: 'Control, people are hungry. Let’s zone farms or build hydroponics, quickly, please.',
    blunt: 'Empty bellies. Farms or hydroponics, now.',
  },
  'hunger-coming': {
    formal: 'Control, our food is running out. Farms or hydroponics would prevent it.',
    warm: 'Control, the food won’t last. Farms or hydroponics, and soon?',
    blunt: 'Food’s running dry. Farms, or hydroponics.',
  },
  revolt: {
    formal: 'Control, a colony is in open revolt and makes nothing. Its approval must be raised.',
    warm: 'Control, a colony has risen up and won’t work. We need to win them back: lower taxes, feed them, build them something.',
    blunt: 'A colony has stopped taking orders. Give them a reason to start again.',
  },
  debt: LINES.debt,
  'debt-coming': {
    formal: 'Control, at this rate the treasury falls into debt. Raise taxes, zone markets, or cut overdrive.',
    warm: 'Control, the purse is running dry. Markets, taxes, less overdrive: any of them would help.',
    blunt: 'Broke soon at this rate. Markets, taxes, or stop buying industry.',
  },
  unrest: {
    formal: 'Control, a colony is restless: it makes less and has stopped growing.',
    warm: 'Control, a colony is unhappy, and it shows in the work. Something for them, perhaps?',
    blunt: 'A colony’s grumbling. Less work, no growth. Fix it before it turns.',
  },
  'no-research': LINES['no-research'],
  'overdrive-stopped': {
    formal: 'Control, the treasury could not pay for the overdrive, so it has stopped.',
    warm: 'Control, we couldn’t pay to push them harder, so they’re back to their own pace.',
    blunt: 'No credits for the overdrive. It’s off.',
  },
  'no-fuel': {
    formal: 'Control, a fusion plant is idle: we have no fusion fuel. A refinery would supply it.',
    warm: 'Control, a fusion plant has gone cold for want of fuel. A refinery, maybe?',
    blunt: 'A reactor’s cold. No fuel. Get a refinery going.',
  },
  researched: {
    formal: 'Control, our scientists have completed their research.',
    warm: 'Control, we’ve cracked it!',
    blunt: 'Done. It works.',
  },
  inspired: {
    formal: 'Control, what we have done has taught us something. Our research is the nearer for it.',
    warm: 'Control, that gave us ideas! Our research is nearer now.',
    blunt: 'That taught us a thing or two. The lab’s closer.',
  },
  observed: {
    formal: 'Control, our survey confirms the old catalogues.',
    warm: 'Control, the old star catalogues were right! More research for the labs.',
    blunt: 'As the old catalogues said. More for the lab.',
  },
  built: {
    formal: 'Control, the work is complete.',
    warm: 'Control, it’s finished, and the builders are proud of it.',
    blunt: 'It’s built.',
  },
  zoned: {
    formal: 'Control, a new district has been zoned.',
    warm: 'Control, there’s new ground, all laid out.',
    blunt: 'Another district, zoned.',
  },
  investigated: {
    formal: 'Control, our survey of the anomaly is complete. The report is in.',
    warm: 'Control, the crew have finished with the anomaly. Read what they found!',
    blunt: 'Done poking at the thing. Read it.',
  },
  'lane-opened': {
    formal: 'Control, the lane is tuned and open.',
    warm: 'Control, the lane is open: ships can use it now.',
    blunt: 'Lane’s open.',
  },
  surveyed: {
    formal: 'Control, another system has been surveyed.',
    warm: 'Control, we’ve charted somewhere new. Have a look at what’s there.',
    blunt: 'Another one, charted.',
  },
  founded: {
    formal: 'Control, our new holding stands, as you ordered.',
    warm: 'Control, we’ve set down somewhere new!',
    blunt: 'New ground. Ours now.',
  },
  'idle-yard': {
    formal: 'Control, a shipyard is building nothing.',
    warm: 'Control, a yard is quiet. Shall we build something?',
    blunt: 'A yard’s sitting idle.',
  },
  'idle-ship': {
    formal: 'Control, orders are awaited.',
    warm: 'Control, someone’s waiting for you.',
    blunt: 'Idle hands out there.',
  },
  'rival-founded': {
    formal: 'Control, a rival power has founded a new holding.',
    warm: 'Control, our neighbours have settled somewhere new.',
    blunt: 'They’ve put down somewhere new. I’m watching them.',
  },
  'rival-lane': {
    formal: 'Control, a rival power has opened a lane. It is closed to our ships.',
    warm: 'Control, the neighbours have a new lane. Not one we can use, mind.',
    blunt: 'They lit a lane. Ours can’t use it.',
  },
  'warship-built': {
    formal: 'Control, a new warship has been commissioned. She is ready for orders.',
    warm: 'Control, a new ship is out of the yard, and a good crew aboard.',
    blunt: 'New gun on the line.',
  },
  'design-new': {
    formal: 'Control, the yard has drawn a new design.',
    warm: 'Control, the yard has a new design for us.',
    blunt: 'The yard’s got a new design.',
  },
  refitted: {
    formal: 'Control, the refit is complete.',
    warm: 'Control, she’s refitted, good as new.',
    blunt: 'Refit’s done.',
  },
  'war-ours': {
    formal: 'Control, we are at war, as you ordered. Every power that knows us has heard of it.',
    warm: 'Control, it’s done: we’re at war. Everyone will have heard, I’m afraid.',
    blunt: 'We’re at war. Everyone knows it.',
  },
  'war-theirs': {
    formal: 'Control, war has been declared on us. Our fleets should be told.',
    warm: 'Control, they’ve declared war on us! We need to look to our colonies.',
    blunt: 'They want a fight. They’ve declared war.',
  },
  'war-ally': {
    formal: 'Control, our ally has been attacked: by our alliance we are at war too.',
    warm: 'Control, our ally’s been attacked, and our alliance means we’re at war too.',
    blunt: 'Someone went after our ally. The alliance drags us in: we’re at war.',
  },
  'peace-made': {
    formal: 'Control, peace is made. Neither of us may declare war for ten turns.',
    warm: 'Control, we have peace at last. Ten turns of truce, at least.',
    blunt: 'Peace. Ten turns of quiet, by the treaty.',
  },
  intercepted: {
    formal: 'Control, one of ours was stopped by their warships.',
    warm: 'Control, their warships stopped one of ours.',
    blunt: 'Ran into their guns. Stopped dead.',
  },
  'battle-held': {
    formal: 'Control, we have fought, and the system is ours. The report has the reckoning.',
    warm: 'Control, we held! The crews did well; the report says what it cost.',
    blunt: 'We’re still there; they’re not.',
  },
  'battle-lost': {
    formal: 'Control, we were beaten. I recommend you read why before we try again.',
    warm: 'Control, they drove us off. The report says why: let’s learn from it.',
    blunt: 'They beat us. Read why, then we hit back harder.',
  },
  'battle-even': {
    formal: 'Control, the battle is undecided: both fleets hold their ground.',
    warm: 'Control, we’re both still there: the fighting goes on.',
    blunt: 'Nobody gave way. Still at it.',
  },
  'contact-talk': {
    formal: 'Control, we have made contact. They share our tongue, so we may talk.',
    warm: 'Control, we’ve met someone! We speak the same tongue, so we can talk whenever you like.',
    blunt: 'Found someone. Same tongue as ours. We can talk.',
  },
  'contact-words': {
    formal:
      'Control, we have heard someone new out there, but cannot understand them yet. I have begun to learn their tongue.',
    warm: 'Control, there’s someone new out there. We can’t understand them yet, but I’m learning.',
    blunt: 'Someone new out there. Can’t make sense of them yet. I’m working on it.',
  },
  'contact-understood': {
    formal: 'Control, I can now speak their tongue. We may talk.',
    warm: 'Control, I’ve got it: I can speak with them now!',
    blunt: 'I can talk to them now.',
  },
  'gift-sent': {
    formal: 'Control, I have delivered our gift. It will be remembered.',
    warm: 'Control, our gift has reached them. They were touched, I think.',
    blunt: 'Took them the credits. They’ll remember.',
  },
  'gift-received': {
    formal: 'Control, we have been sent a gift.',
    warm: 'Control, someone sent us a gift! How kind.',
    blunt: 'Free money. Wonder what they want.',
  },
  'offer-waiting': {
    formal: 'Control, we have an offer. They await your answer before this turn ends.',
    warm: 'Control, someone would like a treaty with us! Shall we say yes? They need an answer this turn.',
    blunt: 'They want a deal. Yes or no, this turn.',
  },
  'offer-accepted': {
    formal: 'Control, our offer has been accepted.',
    warm: 'Control, good news: they said yes!',
    blunt: 'They took it.',
  },
  'offer-refused': {
    formal: 'Control, our offer has been declined. Their regard for us is not yet enough.',
    warm: 'Control, they said no, for now. They need to think better of us first.',
    blunt: 'They said no. They don’t like us enough. Yet.',
  },
  'treaty-begun': {
    formal: 'Control, the treaty is in force.',
    warm: 'Control, we have a treaty now. A good day.',
    blunt: 'Done. It’s signed.',
  },
  'treaty-ending': {
    formal: 'Control, one of our treaties is coming to an end.',
    warm: 'Control, one of our treaties is ending. A pity.',
    blunt: 'A treaty’s finished.',
  },
  'treaty-broken': {
    formal: 'Control, a treaty has been broken. It will not be forgotten.',
    warm: 'Control, they broke our treaty! After everything.',
    blunt: 'They broke the treaty. Remember that.',
  },
  event: {
    formal: 'Control, this requires your decision.',
    warm: 'Control, what shall we do? It’s your call.',
    blunt: 'Your call, Control.',
  },
  'rival-tech': {
    formal: 'Control, word from the lanes: a rival has mastered something new.',
    warm: 'Control, the talk on the lanes is that the neighbours have worked something out. Good for them, and a lesson for us.',
    blunt: 'Word is they cracked something new. Keep up.',
  },
  'great-work': {
    formal: 'Control, a great work has been finished. There will be no other.',
    warm: 'Control, they’ve built it! It’s theirs now, and the whole neighbourhood is talking.',
    blunt: 'They got it done. That one’s gone.',
  },
  'rival-ship': {
    formal: 'Control, a ship has been sighted.',
    warm: 'Control, we’ve spotted a ship.',
    blunt: 'A ship out there. Keeping my eye on it.',
  },
};

/** The powers whose people speak: those a player can lead (D-101). */
export const VOICED_FACTIONS = [
  'sta',
  'frontier',
  'hollow-wake',
  'dusk-concord',
] as const satisfies readonly FactionId[];
export type VoicedFaction = (typeof VOICED_FACTIONS)[number];

/** The commanders' radio (src/content/radio.ts), spoken without its places and numbers. */
export const SPOKEN_RADIO: Record<VoicedFaction, Record<RadioStage, string>> = {
  sta: {
    landing: 'Control, landing group. Down and deploying by the book. Orbit is ours.',
    fighting: 'Contact at the perimeter. Advancing by sections.',
    won: 'Secure, Control. Raising the flag over the civic block.',
    lost: 'Control, we cannot hold the landing ground. Every section is down. I am sorry.',
    sighted: 'Control, garrison here. Landers on approach.',
    holding: 'All posts manned. We hold the perimeter as drilled.',
    fell: 'Control, they are in the civic block. We are lost. Burning the records now.',
    held: 'Landing repulsed, Control. We hold; the garrison is still at its posts.',
  },
  frontier: {
    landing: 'Control, we are down. Nobody wanted this. Moving in.',
    fighting: 'They’re at the domes and they are not giving way. Neither are we.',
    won: 'It’s ours, Control. Tell the families we are bringing everyone home we can.',
    lost: 'Control, it is over. We could not do it. Look after the ones who come back.',
    sighted: 'Control, landers overhead. Everyone to the shelters.',
    holding: 'Militia out. Nobody takes this place without a fight.',
    fell: 'They have the domes, Control. We have fallen. We kept the people safe; that is something.',
    held: 'They have gone, Control. We held.',
  },
  'hollow-wake': {
    landing: 'Boots down. Every one of the crew hungry. Doors first.',
    fighting: 'They’re dug in. Cutting through.',
    won: 'It’s ours. The stores are open. Tell the Wake.',
    lost: 'Landing is gone. They were waiting for us. Get the next lot ready.',
    sighted: 'Company coming. Lock it down.',
    holding: 'We’re behind the plates. Let them come.',
    fell: 'They are through the hatches. We’ve lost it. Scuttle what they can use.',
    held: 'Sent them packing. It stays the Wake’s.',
  },
  'dusk-concord': {
    landing: 'Control. We are come down, out of the long light. We go slowly.',
    fighting: 'Their keepers stand. We do not hurry. We remember why we came.',
    won: 'It is in the Concord’s keeping. It will be remembered.',
    lost: 'Control. The descent has failed. Remember those who did not return.',
    sighted: 'Control. Strangers fall on us from the bright side.',
    holding: 'The ring stands, in the dusk where we have always stood.',
    fell: 'Control. It has passed from our keeping. We will remember who took it.',
    held: 'They are gone, Control. It is kept. We will remember this too.',
  },
};

/** Which department says each kind of line in the report (src/sim/advice.ts); the event line, any of six. */
export const SPEAKERS: Record<LineKind, readonly Department[]> = {
  hungry: ['colonies'],
  'hunger-coming': ['colonies'],
  revolt: ['colonies'],
  debt: ['treasury'],
  'debt-coming': ['treasury'],
  unrest: ['colonies'],
  'no-research': ['science'],
  'overdrive-stopped': ['treasury'],
  'no-fuel': ['works'],
  researched: ['science'],
  inspired: ['science'],
  observed: ['science'],
  built: ['works'],
  zoned: ['works'],
  investigated: ['survey'],
  'lane-opened': ['survey'],
  surveyed: ['survey'],
  founded: ['colonies'],
  'idle-yard': ['works'],
  'idle-ship': ['survey'],
  'rival-founded': ['watch'],
  'rival-lane': ['watch'],
  'warship-built': ['admiral'],
  'design-new': ['admiral'],
  refitted: ['admiral'],
  'war-ours': ['envoy'],
  'war-theirs': ['envoy'],
  'war-ally': ['envoy'],
  'peace-made': ['envoy'],
  intercepted: ['admiral'],
  'battle-held': ['admiral'],
  'battle-lost': ['admiral'],
  'battle-even': ['admiral'],
  'contact-talk': ['envoy'],
  'contact-words': ['envoy'],
  'contact-understood': ['envoy'],
  'gift-sent': ['envoy'],
  'gift-received': ['envoy'],
  'offer-waiting': ['envoy'],
  'offer-accepted': ['envoy'],
  'offer-refused': ['envoy'],
  'treaty-begun': ['envoy'],
  'treaty-ending': ['envoy'],
  'treaty-broken': ['envoy'],
  event: ['colonies', 'survey', 'works', 'watch', 'treasury', 'science'],
  'rival-tech': ['watch'],
  'great-work': ['watch'],
  'rival-ship': ['watch'],
};

/** Who speaks a clip: an advisor by department, or a commander on the radio. */
export type Speaker = Department | 'landing' | 'garrison';

/** One clip the game can play: where it is published, who says it and what they say. */
export interface Clip {
  /** Its name within the power's folder, without `.mp3`. */
  id: string;
  speaker: Speaker;
  text: string;
}

/** The published path of a clip (under `public/`). */
export const clipPath = (faction: VoicedFaction, id: string) => `voice/${faction}/${id}.mp3`;
export const adviceClip = (department: Department, kind: LineKind) => `${department}-${kind}`;
export const lessonClip = (id: LessonId) => `lesson-${id}`;
export const guideClip = (id: string) => `guide-${id}`;
export const radioClip = (stage: RadioStage) => `radio-${stage}`;
export const ALONE_CLIP = 'alone';

/** The landing's stages, spoken by the landing commander; the rest by the garrison's. */
const LANDING: readonly RadioStage[] = ['landing', 'fighting', 'won', 'lost'];

/** Every clip a power can play (VOICES.md §1): 89 for each power a player can lead. */
export function clipsOf(faction: VoicedFaction): Clip[] {
  const manner = ADVISORS[faction].voice;
  const out: Clip[] = [];
  for (const kind of Object.keys(SPEAKERS) as LineKind[])
    for (const department of SPEAKERS[kind])
      out.push({ id: adviceClip(department, kind), speaker: department, text: SPOKEN[kind][manner] });
  // The Watch's step of the guided opening, when no other power is in the game (src/ui/map/guide.tsx).
  out.push({ id: ALONE_CLIP, speaker: 'watch', text: ALONE_LINES[manner] });
  for (const l of LESSONS) out.push({ id: lessonClip(l.id), speaker: l.department, text: l.lines[manner] });
  for (const s of GUIDE_STEPS) out.push({ id: guideClip(s.id), speaker: s.department, text: s.lines[manner] });
  for (const stage of Object.keys(SPOKEN_RADIO[faction]) as RadioStage[])
    out.push({
      id: radioClip(stage),
      speaker: LANDING.includes(stage) ? 'landing' : 'garrison',
      text: SPOKEN_RADIO[faction][stage],
    });
  return out;
}
