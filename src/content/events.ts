// The events (M2_WORLDS.md §11, §27, D-38): twelve, as data. Each has a picture, a few lines with
// blanks the state fills, and two choices whose costs and outcomes are said before you choose. The
// numbers are in rules.ts; src/sim/events.ts decides when they come and what each choice does.

import type { Department } from './advisors.ts';
import { RULES } from './rules.ts';

export type EventId =
  | 'flare'
  | 'comet'
  | 'harvest'
  | 'blight'
  | 'strike'
  | 'epidemic'
  | 'derelict'
  | 'lane-drift'
  | 'petition'
  | 'defectors'
  | 'smugglers'
  | 'founders-day';

/** What an event is about: one of the power's colonies, a system, a lane of its own, another power's ship, or none. */
export type EventSubject = 'colony' | 'system' | 'lane' | 'ship' | 'none';

export interface EventChoice {
  name: string;
  /** What it costs and what follows, said before it is chosen. */
  does: string;
  /** Credits it costs, for the rivals' choice. */
  credits: number;
}

export interface EventDef {
  id: EventId;
  name: string;
  /** The advisors' department it belongs to. */
  department: Department;
  subject: EventSubject;
  /** Whether real astronomy is in it (the flare's star); everything else in it is fiction. */
  real: boolean;
  /**
   * What happened, with blanks: {place} (the colony's world, or the system), {system}, {lane}
   * ("between A and B"), {power} and {ship} (another power's and its ship's names), {years}.
   */
  text: string;
  /** How a lasting effect of it is named among a colony's parts ("a strike"). */
  lasting?: string;
  /** The first is taken if the event goes unanswered. */
  choices: readonly [EventChoice, EventChoice];
}

const E = RULES.events;
/** A change in words: "−10", "+5". */
const signed = (n: number) => (n < 0 ? `−${-n}` : `+${n}`);

export const EVENTS: Record<EventId, EventDef> = {
  flare: {
    id: 'flare',
    name: 'Flare',
    department: 'colonies',
    subject: 'colony',
    real: true,
    text: 'The flare star of {system} is waking: its spots are spreading, and our forecasters expect a great flare over {place} within days. The colony there has no flare shield.',
    lasting: 'sheltering from a flare',
    choices: [
      { name: 'Shelter', does: 'The colony makes no industry for 1 turn while its people shelter.', credits: 0 },
      {
        name: 'Ride it out',
        does: `${E.flarePeople / 10} million people are lost to the radiation (never the last).`,
        credits: 0,
      },
    ],
  },
  comet: {
    id: 'comet',
    name: 'A comet',
    department: 'survey',
    subject: 'system',
    real: false,
    text: 'A comet nobody had charted is falling through {system}, close enough to reach: a mountain of old ice with a tail a hundred million kilometres long.',
    choices: [
      {
        name: 'Capture its ice',
        does: `−${E.cometCredits} credits for the tugs; +${E.cometVolatiles} volatiles.`,
        credits: E.cometCredits,
      },
      { name: 'Study it', does: `+${E.cometResearch} research.`, credits: 0 },
    ],
  },
  harvest: {
    id: 'harvest',
    name: 'A bumper harvest',
    department: 'colonies',
    subject: 'colony',
    real: false,
    text: 'The farms of {place} have had the best season since they were sown. There is more grain than the silos can hold.',
    choices: [
      { name: 'Store it', does: 'The food store on the capital’s lanes fills.', credits: 0 },
      { name: 'Sell it', does: `+${E.harvestCredits} credits.`, credits: -E.harvestCredits },
    ],
  },
  blight: {
    id: 'blight',
    name: 'Blight',
    department: 'colonies',
    subject: 'colony',
    real: false,
    text: 'A grey blight is spreading through the crops of {place}. The agronomists can burn the fields and replant, or the colony can live with a poor harvest.',
    lasting: 'blight',
    choices: [
      {
        name: 'Burn and replant',
        does: `−${E.blightCredits} credits; its farms yield 1 less for ${E.blightShort} turns.`,
        credits: E.blightCredits,
      },
      { name: 'Live with it', does: `Its farms yield 1 less for ${E.blightLong} turns.`, credits: 0 },
    ],
  },
  strike: {
    id: 'strike',
    name: 'A strike',
    department: 'works',
    subject: 'colony',
    real: false,
    text: 'The works of {place} have stopped: the crews want better pay and shorter shifts, and they have shut the gates.',
    lasting: 'a strike',
    choices: [
      { name: 'Meet their demands', does: `−${E.strikeCredits} credits.`, credits: E.strikeCredits },
      {
        name: 'Wait it out',
        does: `No industry there for ${E.strikeTurns} turns; approval ${signed(E.strikeApproval)} there for ${E.strikeTurns} turns.`,
        credits: 0,
      },
    ],
  },
  epidemic: {
    id: 'epidemic',
    name: 'An epidemic',
    department: 'colonies',
    subject: 'colony',
    real: false,
    text: 'A fever is spreading through {place}, and its clinic is full. There is no medical centre there.',
    lasting: 'quarantine',
    choices: [
      { name: 'Medical aid', does: `−${E.epidemicCredits} credits.`, credits: E.epidemicCredits },
      {
        name: 'Quarantine',
        does: `No growth there for ${E.quarantineTurns} turns; approval ${signed(E.quarantineApproval)} there for ${E.quarantineTurns} turns.`,
        credits: 0,
      },
    ],
  },
  derelict: {
    id: 'derelict',
    name: 'A derelict',
    department: 'survey',
    subject: 'system',
    real: false,
    text: 'Our survey ship at {system} has found a derelict: a ship from before the Lapse, dark and drifting, its hull still whole.',
    choices: [
      { name: 'Salvage it', does: `+${E.derelictMetals} metals.`, credits: 0 },
      { name: 'Study it', does: `+${E.derelictResearch} research.`, credits: 0 },
    ],
  },
  'lane-drift': {
    id: 'lane-drift',
    name: 'Lane drift',
    department: 'survey',
    subject: 'lane',
    real: false,
    text: 'The beacons of our lane {lane} are drifting out of tune. Ships still pass, but not for long.',
    choices: [
      {
        name: 'Retune it',
        does: `−${E.driftFuel} fusion fuel and −${E.driftMetals} metals from the stockpile.`,
        credits: 0,
      },
      {
        name: 'Let it drift',
        does: `The lane is retuned over ${E.driftTurns} turns, closed to ships meanwhile.`,
        credits: 0,
      },
    ],
  },
  petition: {
    id: 'petition',
    name: 'Settlers’ petition',
    department: 'colonies',
    subject: 'colony',
    real: false,
    text: '{place} is full, and a thousand families have signed a petition: they want a ship of their own, to go and settle somewhere new.',
    lasting: 'a refused petition',
    choices: [
      {
        name: 'Grant it',
        does: `−${E.petitionCredits} credits; a colony ship at {place}, and ${E.petitionPeople / 10} million people leave with it.`,
        credits: E.petitionCredits,
      },
      {
        name: 'Refuse',
        does: `Approval ${signed(E.petitionApproval)} there for ${E.petitionTurns} turns.`,
        credits: 0,
      },
    ],
  },
  defectors: {
    id: 'defectors',
    name: 'Defectors',
    department: 'watch',
    subject: 'ship',
    real: false,
    text: 'The crew of the {ship}, a survey ship of the {power} at {system}, have hailed us. They want to change sides, ship and all.',
    choices: [
      {
        name: 'Welcome them',
        does: `−${E.defectorsCredits} credits for their pay; the ship is yours, where it is.`,
        credits: E.defectorsCredits,
      },
      { name: 'Send them home', does: 'Nothing changes.', credits: 0 },
    ],
  },
  smugglers: {
    id: 'smugglers',
    name: 'A smugglers’ offer',
    department: 'treasury',
    subject: 'none',
    real: false,
    text: 'A captain with no papers and a hold full of fusion fuel is offering it cheap, no questions asked.',
    lasting: 'smugglers reported',
    choices: [
      {
        name: 'Buy',
        does: `−${E.smugglersCredits} credits; +${E.smugglersFuel} fusion fuel.`,
        credits: E.smugglersCredits,
      },
      {
        name: 'Report them',
        does: `Approval +${E.smugglersApproval} at the capital for ${E.smugglersTurns} turns.`,
        credits: 0,
      },
    ],
  },
  'founders-day': {
    id: 'founders-day',
    name: 'Founders’ Day',
    department: 'treasury',
    subject: 'none',
    real: false,
    text: '{years} years since the first quarter of the new age. The colonies want to mark it.',
    lasting: 'Founders’ Day',
    choices: [
      {
        name: 'A festival',
        does: `−${E.foundersCredits} credits; approval +${E.foundersApproval} at every colony for ${E.foundersTurns} turns.`,
        credits: E.foundersCredits,
      },
      { name: 'A quiet day', does: 'Nothing changes.', credits: 0 },
    ],
  },
};

export const EVENT_IDS = Object.keys(EVENTS) as EventId[];

export function isEventId(id: unknown): id is EventId {
  return typeof id === 'string' && id in EVENTS;
}
