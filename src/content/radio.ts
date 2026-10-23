// Radio traffic (M4_FLEETS.md §26.4, D-17 A): what each power's commanders say to Control as their
// troops land on a colony, or as their garrison meets a landing, in each power's own voice. Every
// line is written into the game; all of it is fiction. {place}, {enemy}, {troops}, {garrison} and
// {left} are filled in from the landing.

import type { FactionId } from './factions.ts';

/** The invader's officer: landing, fighting, then won or lost; the garrison's: sighted, holding, then fell or held. */
export type RadioStage = 'landing' | 'fighting' | 'won' | 'lost' | 'sighted' | 'holding' | 'fell' | 'held';

export interface RadioVoice {
  /** Who speaks for the landing, and for the garrison. */
  landing: string;
  garrison: string;
  lines: Record<RadioStage, string>;
}

export const RADIO: Record<FactionId, RadioVoice> = {
  sta: {
    landing: 'Landing group commander',
    garrison: 'Garrison commander',
    lines: {
      landing: 'Control, landing group. Down at {place}: {troops} troops deploying by the book. Orbit is ours.',
      fighting: 'Contact at the perimeter, a garrison of about {garrison}. Advancing by sections.',
      won: '{place} is secure, Control. {left} of ours still standing. Raising the flag over the civic block.',
      lost: 'Control, we cannot hold the landing ground. Every section is down. I am sorry.',
      sighted: 'Control, garrison at {place}. Landers on approach, {enemy} markings, about {troops} troops.',
      holding: 'All posts manned, {garrison} of us. We hold the perimeter as drilled.',
      fell: 'Control, they are in the civic block. {place} is lost. Burning the records now.',
      held: 'Landing repulsed, Control. {place} holds; {left} of the garrison still at their posts.',
    },
  },
  frontier: {
    landing: 'Landing warden',
    garrison: 'Militia warden',
    lines: {
      landing: 'Control, we are down at {place}. {troops} of us, and nobody wanted this. Moving in.',
      fighting: 'They have about {garrison} at the domes and they are not giving way. Neither are we.',
      won: '{place} is ours, Control. {left} of us left. Tell the families we are bringing everyone home we can.',
      lost: 'Control, it is over at {place}. We could not do it. Look after the ones who come back.',
      sighted: 'Control, landers over {place}: the {enemy}, about {troops} troops. Everyone to the shelters.',
      holding: 'Militia out, {garrison} strong. Nobody takes this place without a fight.',
      fell: 'They have the domes, Control. {place} has fallen. We kept the people safe; that is something.',
      held: 'They have gone, Control. {place} held. {left} of the militia still with us.',
    },
  },
  'hollow-wake': {
    landing: 'Boarding boss',
    garrison: 'Dock boss',
    lines: {
      landing: 'Boots down at {place}. {troops} of the crew and every one of them hungry. Doors first.',
      fighting: 'About {garrison} of theirs dug in. Cutting through.',
      won: '{place} is ours. {left} of the crew left standing, and the stores are open. Tell the Wake.',
      lost: 'Landing is gone. They were waiting for us. Get the next lot ready.',
      sighted: 'Company coming at {place}: the {enemy}, about {troops} of them. Lock it down.',
      holding: '{garrison} of us behind the plates. Let them come.',
      fell: 'They are through the hatches. {place} is lost. Scuttle what they can use.',
      held: 'Sent them packing. {place} stays the Wake’s. {left} of us still breathing.',
    },
  },
  'dusk-concord': {
    landing: 'Keeper of the descent',
    garrison: 'Keeper of the ring',
    lines: {
      landing: 'Control. We are come down at {place}, {troops} of us, out of the long light. We go slowly.',
      fighting: 'Their keepers stand, about {garrison}. We do not hurry. We remember why we came.',
      won: '{place} is in the Concord’s keeping. {left} of us remain. It will be remembered.',
      lost: 'Control. The descent has failed at {place}. Remember those who did not return.',
      sighted: 'Control. Strangers fall on {place} from the bright side: the {enemy}, about {troops}.',
      holding: 'The ring stands, {garrison} of us, in the dusk where we have always stood.',
      fell: 'Control. {place} has passed from our keeping. We will remember who took it.',
      held: 'They are gone, Control. {place} is kept. {left} of the ring remain. We will remember this too.',
    },
  },
  'drift-moot': {
    landing: 'Speaker for the descent',
    garrison: 'Speaker for the deep',
    lines: {
      landing: 'Control, we sink to {place}: {troops} of us, and every one counted. The price was agreed.',
      fighting: 'About {garrison} stand against us. The air is thick here. We press on, and keep account.',
      won: '{place} has come to the Moot. {left} of us remain. A dear bargain, Control, but a bargain.',
      lost: 'Control, the descent at {place} is spent. We could not pay what it asked.',
      sighted: 'Control, a descent on {place}: the {enemy}, about {troops}. We would rather have talked.',
      holding: '{garrison} of us hold the deep layers. Nothing is taken from the Moot cheaply.',
      fell: 'Control, {place} is lost to the Moot. Note who took it, and the cost.',
      held: 'The descent is turned back, Control. {place} is the Moot’s still. {left} of us remain.',
    },
  },
  continuance: {
    landing: 'Landing array',
    garrison: 'Defence array',
    lines: {
      landing: 'Control. Landing at {place}: {troops} units. Resistance expected. Proceeding.',
      fighting: 'Opposition estimated at {garrison}. Losses within tolerance. Continuing.',
      won: '{place} is held for the Continuance. {left} units remain. The work goes on.',
      lost: 'Control. The landing at {place} has failed. Losses recorded. Revising.',
      sighted: 'Control. Landing detected at {place}: the {enemy}, about {troops}. Defence array engaging.',
      holding: 'The array holds, {garrison} units. Repairs continue between engagements.',
      fell: 'Control. {place} is lost. The loss is recorded. It will be recovered.',
      held: 'They have withdrawn, Control. {place} holds. {left} units remain. Resuming work.',
    },
  },
  'last-hearth': {
    landing: 'Warden of the landing',
    garrison: 'Warden of the hearth',
    lines: {
      landing: 'Control. We are down at {place}, {troops} of us. We did not cross the dark to be turned away.',
      fighting: 'About {garrison} stand against us. We have lost more than this before. We hold on.',
      won: '{place} is the Hearth’s now. {left} of us remain. Another fire kept.',
      lost: 'Control, the landing at {place} has failed. We will carry them in our telling.',
      sighted: 'Control. Ships fall on {place}: the {enemy}, about {troops}. Not again. Not here.',
      holding: 'The hearth holds, {garrison} of us. We have nowhere else to go.',
      fell: 'Control. {place} is lost to us. Another home taken. We remember.',
      held: 'They are gone, Control. {place} is ours still. {left} of us remain to keep the fire.',
    },
  },
};

/** A line with its numbers filled in. */
export function radioLine(
  voice: RadioVoice,
  stage: RadioStage,
  fill: { place: string; enemy: string; troops: number; garrison: number; left: number },
): string {
  return voice.lines[stage]
    .replaceAll('{place}', fill.place)
    .replaceAll('{enemy}', fill.enemy)
    .replaceAll('{troops}', String(fill.troops))
    .replaceAll('{garrison}', String(fill.garrison))
    .replaceAll('{left}', String(fill.left));
}
