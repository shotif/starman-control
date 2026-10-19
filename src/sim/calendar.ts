// Game time: a turn is one quarter of a year (D-16), and turn 1 is the first quarter of 2176 (D-20).

import { RULES } from '../content/rules.ts';

export interface GameDate {
  year: number;
  /** 1 to 4. */
  quarter: number;
}

export function dateOfTurn(turn: number): GameDate {
  const per = RULES.calendar.turnsPerYear;
  return { year: RULES.calendar.startYear + Math.floor((turn - 1) / per), quarter: ((turn - 1) % per) + 1 };
}

/** "Q1 2176". */
export function formatDate(turn: number): string {
  const d = dateOfTurn(turn);
  return `Q${d.quarter} ${d.year}`;
}
