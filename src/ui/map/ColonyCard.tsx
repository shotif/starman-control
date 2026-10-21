// A building's card in the colony's scene (COLONY_VIEW.md §4): tap or click a building to light it
// and read what it is, what it does and its numbers. The scene shows; the card and the panel tell.

import { ZONE_DEFS } from '../../content/districts.ts';
import { FACTIONS } from '../../content/factions.ts';
import { PROJECTS } from '../../content/projects.ts';
import { SHIPS } from '../../content/ships.ts';
import type { SceneBuilding } from '../../render/colonyScene.ts';
import { costOf, queueTurns, workedSlots } from '../../sim/economy.ts';
import type { GameState, Holding } from '../../sim/state.ts';
import type { World } from '../../sim/world.ts';
import { millions, zoneYieldText } from './colony.tsx';

const HOME_WORD = { 1: 'Small homes', 2: 'Homes', 3: 'Tower homes' } as const;

function when(turns: number | null): string {
  if (turns === null) return 'never, with no industry';
  return turns === 1 ? 'ready when this turn ends' : `ready in about ${turns} turns`;
}

/** What a building's card says: its name and a line or two. */
export function buildingCard(
  world: World,
  game: GameState,
  h: Holding,
  b: SceneBuilding,
  homes: number,
): { title: string; lines: string[] } {
  const first = h.queue[0];
  const progress = () => {
    if (!first) return '';
    const cost = costOf(world, game, h, first).industry;
    return `${Math.min(h.industry, cost)} of ${cost} industry, ${when(queueTurns(world, game, h)[0] ?? null)}`;
  };
  if (b.kind === 'homes') {
    const sealed = b.home?.envelope === 'domed';
    return {
      title: `${HOME_WORD[b.home?.size ?? 2]}${sealed ? ', sealed' : ''}`,
      lines: [
        `${millions(h.people)} million people live in the colony’s ${homes} home${homes === 1 ? '' : 's'}.`,
        sealed ? 'Sealed against the world outside: its air cannot be breathed as it is.' : 'Open to the air.',
        ...(b.district === 'housing' ? [`District ${b.slot}, zoned for housing: room for 2 million more.`] : []),
      ],
    };
  }
  if (b.kind === 'scaffold' && b.district) {
    const zone = ZONE_DEFS[b.district];
    return {
      title: `Zoning district ${b.slot} for ${zone.name.toLowerCase()}`,
      lines: [`${progress()}.`, zone.does],
    };
  }
  if (b.district && b.kind !== 'scaffold') {
    const zone = ZONE_DEFS[b.district];
    const worked = workedSlots(h).has(b.slot);
    return {
      title: b.kind === 'greenhouse-farms' ? 'Farms under glass' : zone.name,
      lines: [
        `District ${b.slot}: ${zoneYieldText(world, game, h, b.district)} a turn when worked.`,
        worked ? 'A million people work it.' : 'No one works it: the colony has too few people.',
      ],
    };
  }
  if (b.kind === 'scaffold' && b.project) {
    return {
      title: `Building a ${PROJECTS[b.project].name.toLowerCase()}`,
      lines: [`${progress()}.`, PROJECTS[b.project].does],
    };
  }
  if (b.kind === 'hall') return { title: 'The capital’s hall', lines: [`The seat of the ${FACTIONS[h.owner].name}.`] };
  if (b.kind === 'rig')
    return { title: 'Outpost rig', lines: ['Machines gather the world’s riches here. No one lives at an outpost.'] };
  if (b.kind === 'fields') return { title: 'Fields', lines: ['The colony grows its food in the open air.'] };
  const project = b.project ?? b.kind;
  if (!(project in PROJECTS)) return { title: '', lines: [] };
  const def = PROJECTS[project as keyof typeof PROJECTS];
  const lines = [def.does];
  if (project === 'shipyard')
    lines.push(
      first?.kind === 'ship'
        ? `Building a ${SHIPS[first.ship].name.toLowerCase()}: ${progress()}.`
        : 'No ship is being built.',
    );
  return { title: def.name, lines };
}

export function ColonyCard({
  world,
  game,
  holding,
  building,
  homes,
  onClose,
}: {
  world: World;
  game: GameState;
  holding: Holding;
  building: SceneBuilding;
  /** How many homes the scene shows. */
  homes: number;
  onClose: () => void;
}) {
  const card = buildingCard(world, game, holding, building, homes);
  return (
    <section class="colony-card" aria-label={card.title} data-keep-clear>
      <h3>{card.title}</h3>
      {card.lines.map((l) => (
        <p key={l}>{l}</p>
      ))}
      <button type="button" class="button button-quiet button-small" onClick={onClose}>
        Close
      </button>
    </section>
  );
}
