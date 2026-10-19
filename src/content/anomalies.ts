// Anomalies (M1_FIRST_LIGHT.md §9, M1_LANES_RESEARCH.md §3): things a survey finds that a survey
// ship can investigate. Every one is fiction, written in Starman Reborn's voice and drawn from its
// universe (docs/research/STARMAN_REBORN_UNIVERSE.md); the old beacon's carrier tone and the charts
// "older than any in your computer" echo Reborn's derelicts (src/content/wrecks/lines.ts, D-10).
// Three hint at something no human made, the first threads of the precursor mystery (D-13): they
// are written so as not to settle what it is.

import type { TechId } from './techs.ts';

export type AnomalyId =
  | 'old-beacon'
  | 'drifting-hauler'
  | 'coop-farm'
  | 'wake-cache'
  | 'buried-instruments'
  | 'long-comet'
  | 'derelict-yard'
  | 'lost-surveys'
  | 'flare-logs'
  | 'metal-asteroid'
  | 'lifeboat'
  | 'cracked-domes'
  | 'frontier-clinic'
  | 'gas-skimmer'
  | 'charter-office'
  | 'silent-relay'
  | 'ice-vents'
  | 'ordered-dust'
  | 'old-charts'
  | 'second-tone';

/** What investigating gives. */
export type AnomalyReward =
  /** Research points, into the current technology (or the first that can be researched). */
  | { kind: 'research'; points: number }
  /** Progress towards one technology. */
  | { kind: 'tech'; tech: TechId; points: number }
  | { kind: 'resources'; metals?: number; volatiles?: number; fuel?: number }
  /** Only the story. */
  | { kind: 'story' };

export interface AnomalyDef {
  id: AnomalyId;
  name: string;
  /** What the survey report says about it before anyone looks closer. */
  seen: string;
  /** What investigating it finds. */
  found: string;
  /** Turns a survey ship spends on it. */
  turns: number;
  reward: AnomalyReward;
  /** One of the threads of the precursor mystery. */
  mystery?: boolean;
}

export const ANOMALIES: Record<AnomalyId, AnomalyDef> = {
  'old-beacon': {
    id: 'old-beacon',
    name: 'An old beacon',
    seen: 'A lane beacon from before the Lapse, still sending its carrier tone into the dark.',
    found:
      'The beacon has sent its carrier tone for a very long time, to a partner that went out of tune generations ago. Its tuning records survive, and your engineers copy every line.',
    turns: 2,
    reward: { kind: 'tech', tech: 'beacon-tuning', points: 30 },
  },
  'drifting-hauler': {
    id: 'drifting-hauler',
    name: 'A drifting hauler',
    seen: 'A Kettering Line hauler from long ago, adrift with its holds sealed.',
    found: 'The crew left in good order; the cargo did not. Its holds are full of refined metal, still good.',
    turns: 1,
    reward: { kind: 'resources', metals: 20 },
  },
  'coop-farm': {
    id: 'coop-farm',
    name: 'An abandoned Co-op farm',
    seen: 'Farm domes on a cold world, dark and empty.',
    found:
      'The crops are long dead and the vote to leave is still pinned by the airlock, but the seed vault is sealed and whole, and so are the farm’s notes on keeping a closed world alive.',
    turns: 2,
    reward: { kind: 'tech', tech: 'closed-ecologies', points: 30 },
  },
  'wake-cache': {
    id: 'wake-cache',
    name: 'A Wake cache',
    seen: 'A hollowed rock with a heat signature it should not have.',
    found: 'A raiders’ cache: fuel bladders, stolen and never collected. Whoever hid them is not coming back.',
    turns: 1,
    reward: { kind: 'resources', fuel: 25 },
  },
  'buried-instruments': {
    id: 'buried-instruments',
    name: 'Buried instruments',
    seen: 'A survey team’s instruments, half buried on a moon and still recording.',
    found:
      'A Pyre Observatory team left them here and never came back. Decades of measurements of the star, every one kept: a gift to your astronomers.',
    turns: 2,
    reward: { kind: 'research', points: 25 },
  },
  'long-comet': {
    id: 'long-comet',
    name: 'A long-period comet',
    seen: 'A comet falling inwards for the first time in thousands of years.',
    found: 'It is rich in water ice and ammonia, and easy to tap as it passes. Your crews fill every tank they have.',
    turns: 1,
    reward: { kind: 'resources', volatiles: 20 },
  },
  'derelict-yard': {
    id: 'derelict-yard',
    name: 'A derelict shipyard',
    seen: 'Half-built hulls in an orbital slip.',
    found:
      'An Ares Foundry contract that ended with the Lapse. The hulls are scrap, but the jigs and tooling are sound, and their plans can be copied.',
    turns: 3,
    reward: { kind: 'tech', tech: 'orbital-yards', points: 40 },
  },
  'lost-surveys': {
    id: 'lost-surveys',
    name: 'Lost lane surveys',
    seen: 'A Transit Authority survey drone, powered down in a high orbit.',
    found:
      'Its logs are full of beacon positions charted before the Lapse: where lanes once ran, and how they were laid.',
    turns: 2,
    reward: { kind: 'tech', tech: 'lane-engineering-1', points: 30 },
  },
  'flare-logs': {
    id: 'flare-logs',
    name: 'Flare logs',
    seen: 'Automatic sensors still watching the star.',
    found: 'Sixty years of the star’s flares, logged to the second. Your physicists are delighted.',
    turns: 1,
    reward: { kind: 'research', points: 15 },
  },
  'metal-asteroid': {
    id: 'metal-asteroid',
    name: 'A metal asteroid',
    seen: 'An iron-nickel asteroid the size of a mountain, with claim markers on it.',
    found: 'The company that claimed it no longer exists. Its mining rigs still work, after a fashion.',
    turns: 2,
    reward: { kind: 'resources', metals: 30 },
  },
  lifeboat: {
    id: 'lifeboat',
    name: 'A lifeboat',
    seen: 'A lifeboat on a slow orbit, its beacon off.',
    found:
      'It is empty. Someone was picked up, or was not; the log ends in the middle of a sentence. Your crew leave a note on the hatch, in case.',
    turns: 1,
    reward: { kind: 'story' },
  },
  'cracked-domes': {
    id: 'cracked-domes',
    name: 'Cracked domes',
    seen: 'A settlement under domes, every one of them cracked.',
    found:
      'A colony that failed in the Lapse, in one hard winter when the heating could not be fixed. What went wrong is written in the frames, and your builders learn from it.',
    turns: 2,
    reward: { kind: 'tech', tech: 'habitat-domes', points: 25 },
  },
  'frontier-clinic': {
    id: 'frontier-clinic',
    name: 'A frontier clinic',
    seen: 'A small clinic on a cold world, its lights still on.',
    found:
      'Its records follow settlers living in the cold for three generations: what changed in them, and what helped.',
    turns: 2,
    reward: { kind: 'tech', tech: 'adaptation-1', points: 25 },
  },
  'gas-skimmer': {
    id: 'gas-skimmer',
    name: 'A gas skimmer',
    seen: 'An automated skimmer still dipping into a giant’s clouds.',
    found: 'It has filled its tanks with fusion fuel for decades and no one has come to empty them. Now someone has.',
    turns: 1,
    reward: { kind: 'resources', fuel: 20 },
  },
  'charter-office': {
    id: 'charter-office',
    name: 'A charter office',
    seen: 'A colonial charter office in a small station, sealed.',
    found:
      'Its claims register is intact: every world here assessed, priced and argued over. It makes settling cheaper.',
    turns: 1,
    reward: { kind: 'tech', tech: 'colonial-charters', points: 20 },
  },
  'silent-relay': {
    id: 'silent-relay',
    name: 'A silent relay',
    seen: 'A communications relay from Reborn’s days, silent.',
    found: 'Its memory is full of messages that were never delivered. Most are private; some are science.',
    turns: 2,
    reward: { kind: 'research', points: 20 },
  },
  'ice-vents': {
    id: 'ice-vents',
    name: 'Ice vents',
    seen: 'Plumes of water rising from a frozen world.',
    found: 'The vents throw ice into orbit, where it is easy to gather: a ready source of volatiles.',
    turns: 2,
    reward: { kind: 'resources', volatiles: 30 },
  },
  'ordered-dust': {
    id: 'ordered-dust',
    name: 'Ordered dust',
    seen: 'A cloud of fine dust where none should be.',
    found:
      'Every grain is the same size, to within a few atoms. Your survey team argues about it for three turns and agrees on nothing, except that dust does not do this.',
    turns: 3,
    reward: { kind: 'research', points: 30 },
    mystery: true,
  },
  'old-charts': {
    id: 'old-charts',
    name: 'Charts older than any',
    seen: 'A wreck with no maker’s marks.',
    found:
      'Only the charts are left, older than any in your computer. They show the nearby stars where they stood long before anyone was here to see them.',
    turns: 2,
    reward: { kind: 'research', points: 20 },
    mystery: true,
  },
  'second-tone': {
    id: 'second-tone',
    name: 'A second tone',
    seen: 'Something under an old beacon’s carrier tone.',
    found:
      'Beneath the beacon’s tone, a slow and regular signal that no beacon anyone built would send. When your ship listens closely, it stops.',
    turns: 2,
    reward: { kind: 'research', points: 25 },
    mystery: true,
  },
};

export const ANOMALY_IDS = Object.keys(ANOMALIES) as AnomalyId[];
