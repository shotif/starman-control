// The guided opening's steps (M2_WORLDS.md §12, §28, D-40): each led by an advisor in their power's
// voice, each done by doing it. `target` names the control lit for it (`data-guide` in the
// screens); `hint` says where to find it when it is not on the screen.

import type { Department, Voice } from './advisors.ts';

export type GuideStepId =
  | 'capital'
  | 'queue'
  | 'survey'
  | 'research'
  | 'taxes'
  | 'end-turn'
  | 'colony-ship'
  | 'ship'
  | 'lane'
  | 'governor'
  | 'watch';

export interface GuideStep {
  id: GuideStepId;
  department: Department;
  lines: Record<Voice, string>;
  /** The control lit by the ring; none for a step that only tells. */
  target: string | null;
  hint: string;
}

export const GUIDE_STEPS: readonly GuideStep[] = [
  {
    id: 'capital',
    department: 'colonies',
    lines: {
      formal: 'Control, this is our capital. Open it to see its districts and what it builds.',
      warm: 'Control, welcome home! Open our capital and have a look round.',
      blunt: 'This rock is ours. Open it up and see what we’ve got.',
    },
    target: 'capital',
    hint: 'It is in the empire, and on the map.',
  },
  {
    id: 'queue',
    department: 'works',
    lines: {
      formal: 'The works are waiting, Control: zone a district or queue a project.',
      warm: 'Give the builders something to do, Control: a district zoned, or a project queued.',
      blunt: 'Crews are idle. Zone something or queue something.',
    },
    target: 'queue',
    hint: 'In the capital’s panel: its districts, and Add to queue.',
  },
  {
    id: 'survey',
    department: 'survey',
    lines: {
      formal: 'Control, send a survey ship to a star nearby. We know nothing of what is there.',
      warm: 'Control, let’s send a survey ship out to a neighbour. Who knows what’s waiting?',
      blunt: 'Point a survey ship at a star. Any star. We’re blind out there.',
    },
    target: 'survey-ship',
    hint: 'Your ships are in the empire, under Ships.',
  },
  {
    id: 'research',
    department: 'science',
    lines: {
      formal: 'Control, please choose what our laboratories work on.',
      warm: 'Control, pick us something to learn! The labs are itching.',
      blunt: 'Give the lab a problem, Control.',
    },
    target: 'research',
    hint: 'Research is beside the empire.',
  },
  {
    id: 'taxes',
    department: 'treasury',
    lines: {
      formal: 'Control, our taxes and credits are in the empire. A look, before we spend?',
      warm: 'Control, the purse and the taxes live in the empire. Shall we look?',
      blunt: 'Credits and taxes are in the empire. Know what you’ve got.',
    },
    target: 'empire',
    hint: 'The empire holds the treasury and the taxes.',
  },
  {
    id: 'end-turn',
    department: 'colonies',
    lines: {
      formal: 'When you are ready, Control, end the turn. I shall report what happened.',
      warm: 'All set? End the turn, Control, and we’ll tell you how it went.',
      blunt: 'End the turn. I’ll tell you what broke.',
    },
    target: 'end-turn',
    hint: 'End turn ends the quarter; the report follows.',
  },
  {
    id: 'colony-ship',
    department: 'colonies',
    lines: {
      formal: 'Control, send the colony ship to a world our survey found, and found a colony there.',
      warm: 'Control, the settlers are packed! Send the colony ship to a world we’ve surveyed.',
      blunt: 'Colony ship’s full of people going nowhere. Send it somewhere surveyed.',
    },
    target: 'colony-ship',
    hint: 'Your ships are in the empire, under Ships.',
  },
  {
    id: 'ship',
    department: 'works',
    lines: {
      formal: 'Control, queue a ship at the shipyard. There is more sky than we have ships.',
      warm: 'Control, the yard could build us another ship. Queue one?',
      blunt: 'More sky than ships. Queue one at the yard.',
    },
    target: 'queue',
    hint: 'In the capital’s panel, under Add to queue.',
  },
  {
    id: 'lane',
    department: 'survey',
    lines: {
      formal: 'Control, relight one of the old lanes, or build a new one, to reach further.',
      warm: 'Control, an old lane could shine again, or we could tune a new one. Shall we?',
      blunt: 'Light a lane. Dark ones are wasted.',
    },
    target: 'lanes',
    hint: 'In a colony’s or outpost’s panel, under Lanes from here.',
  },
  {
    id: 'governor',
    department: 'colonies',
    lines: {
      formal: 'Control, a governor can run a colony for you, by a priority you choose. Or keep it in hand.',
      warm: 'Control, our new colony could have a governor of its own. Your choice, of course.',
      blunt: 'A governor can run the new place. Or you can. Pick.',
    },
    target: 'governor',
    hint: 'In a colony’s panel, under Governor.',
  },
  {
    id: 'watch',
    department: 'watch',
    lines: {
      formal: 'Control, the Watch has seen another power. We shall tell you whenever we see them again.',
      warm: 'Control, we’ve seen one of the others! We’ll keep you posted.',
      blunt: 'Company out there. I’ll call it whenever I see them.',
    },
    target: null,
    hint: 'The Watch’s news comes in the report.',
  },
];

/** The last step when playing alone: the sky is the player's to explore. */
export const ALONE_LINES: Record<Voice, string> = {
  formal: 'Control, no other power is out there: the sky is ours to explore.',
  warm: 'Control, it’s just us out here, with the whole sky to explore!',
  blunt: 'Nobody else out there. All yours, Control.',
};
