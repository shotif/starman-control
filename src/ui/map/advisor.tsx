// An advisor beside the numbers of their department (M2_WORLDS.md §24.3): the Treasury's face by the
// treasury, Science's by the research rate. Fiction, as every advisor is.

import { ADVISORS, type Department } from '../../content/advisors.ts';
import type { FactionId } from '../../content/factions.ts';
import { AdvisorFace } from '../parts.tsx';

export function AdvisorBy({ faction, department }: { faction: FactionId; department: Department }) {
  const a = ADVISORS[faction].people[department];
  return (
    <p class="advisor-by">
      <AdvisorFace advisor={a} size={36} />
      <span>
        <b>{a.name}</b> <span class="dim">{a.role}</span>
      </span>
    </p>
  );
}
