// The guided opening's card (M2_WORLDS.md §28.3): the step's advisor and sentence, where to find
// its control, *Skip* and *Stop guiding*, and a ring round the control to press. It never blocks
// anything: every control works as always, and the card sits clear of the bars and sheets.

import { useEffect } from 'preact/hooks';
import { currentStep, guide, guideFinished, guideGameId, setGuideFlag, skipStep, stopGuide } from '../../app/guide.ts';
import { settings } from '../../app/settings.ts';
import { ADVISORS, DEPARTMENT_NAMES } from '../../content/advisors.ts';
import type { FactionId } from '../../content/factions.ts';
import { ALONE_LINES, GUIDE_STEPS } from '../../content/guide.ts';
import type { GameState } from '../../sim/state.ts';
import { AdvisorFace } from '../parts.tsx';
import { panel, selectedHolding } from './state.ts';
import './guide.css';

export function GuideCard({ game, faction, top }: { game: GameState; faction: FactionId; top?: number }) {
  const g = guide.value;
  const active = settings.value.guide === 'on' && g.on && g.game === guideGameId(game, faction);
  const capital = game.holdings.find((h) => h.owner === faction && h.capital);
  const openedCapital = capital !== undefined && selectedHolding.value === capital.id;
  const openedEmpire = panel.value === 'empire';
  useEffect(() => {
    if (!active) return;
    if (openedCapital) setGuideFlag('capitalOpened');
    if (openedEmpire) setGuideFlag('empireOpened');
    if (guideFinished(game, faction, guide.value.flags)) stopGuide();
  }, [active, openedCapital, openedEmpire, game, faction]);
  const step = active ? currentStep(game, faction, g.flags) : null;
  if (!step) return null;
  const team = ADVISORS[faction];
  const advisor = team.people[step.department];
  const line = step.id === 'watch' && game.powers.length === 1 ? ALONE_LINES[team.voice] : step.lines[team.voice];
  const n = GUIDE_STEPS.indexOf(step) + 1;
  return (
    <aside class="guide-card" aria-label="Guide" style={top !== undefined ? { top: `${top}px` } : undefined}>
      {step.target && <style>{`[data-guide="${step.target}"] { ${RING} }`}</style>}
      <AdvisorFace advisor={advisor} size={44} />
      <div class="guide-body">
        <p class="guide-who">
          <b>{advisor.name}</b>{' '}
          <span class="dim">
            · {DEPARTMENT_NAMES[step.department]} · step {n} of {GUIDE_STEPS.length}
          </span>
        </p>
        <p class="guide-line">{line}</p>
        <p class="guide-hint">{step.hint}</p>
        <div class="guide-actions">
          <button type="button" class="button button-small" onClick={() => skipStep(step.id)}>
            {step.id === 'watch' ? 'Done' : 'Skip'}
          </button>
          <button type="button" class="button button-quiet button-small" onClick={stopGuide}>
            Stop guiding
          </button>
        </div>
      </div>
    </aside>
  );
}

/** The ring round the control to press: a warm outline that pulses, still with reduced motion. */
const RING =
  'outline: 2px solid var(--warm) !important; outline-offset: 3px; animation: guide-ring 1.6s ease-in-out infinite;';
