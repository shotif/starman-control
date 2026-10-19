// A new game (§10): the three powers as cards, with where each starts, how it plays, its trait and
// its shipmakers, and a seed for those who want the same game twice. One after another on a phone,
// side by side on a desktop.

import { useState } from 'preact/hooks';
import { startGame, world } from '../../app/game.ts';
import { FACTION_IDS, FACTIONS, type FactionId } from '../../content/factions.ts';
import { RULES } from '../../content/rules.ts';
import { formatLy } from '../../sim/geometry.ts';
import { FactionMark } from '../parts.tsx';
import './newgame.css';

export function NewGame() {
  const [seed, setSeed] = useState('');
  const [starting, setStarting] = useState<FactionId | null>(null);
  const seedNumber = /^\d+$/.test(seed.trim()) ? Number(seed.trim()) % 0x100000000 || 1 : undefined;

  const start = async (f: FactionId) => {
    setStarting(f);
    await startGame(f, seedNumber);
    location.hash = '#/game';
  };

  return (
    <main class="new-game">
      <header>
        <a class="back" href="#/">
          ← Title
        </a>
        <h1>Choose your power</h1>
        <p class="dim">
          The year is {RULES.calendar.startYear}. A generation after the Lapse, each power still tends the lanes round
          its home. Beyond them, the old lanes run dark.
        </p>
      </header>
      <div class="faction-cards">
        {FACTION_IDS.map((id) => {
          const f = FACTIONS[id];
          const capital = world.system(f.capital.systemId);
          return (
            <article key={id} class="faction-card" style={{ '--faction': f.colour }} aria-label={f.name}>
              <h2>
                <FactionMark faction={id} size={18} /> {f.name}
              </h2>
              <p class="plays-as">{f.playsAs}</p>
              <dl>
                <dt>Capital</dt>
                <dd>
                  {capital.name}
                  {id === 'sta' ? ', the Sun' : `, ${formatLy(capital.fromSolDeci)} from Sol`}
                </dd>
                <dt>Trait</dt>
                <dd>
                  {f.traits.map((t) => (
                    <span key={t.id}>
                      <b>{t.name}:</b> {t.text}
                    </span>
                  ))}
                </dd>
                <dt>Shipmakers</dt>
                <dd>{f.shipmakers.join(', ')}</dd>
              </dl>
              <button
                type="button"
                class="button button-primary"
                disabled={starting !== null}
                onClick={() => start(id)}
              >
                {starting === id ? 'Starting…' : `Lead the ${f.shortName}`}
              </button>
            </article>
          );
        })}
      </div>
      <details class="seed">
        <summary>More</summary>
        <label>
          Seed <span class="dim">(a whole number: the same seed gives the same worlds)</span>
          <input
            type="text"
            inputMode="numeric"
            value={seed}
            placeholder="chosen at random"
            onInput={(e) => setSeed((e.target as HTMLInputElement).value)}
          />
        </label>
      </details>
      <p class="dim">
        Every star is real. Every world nobody has observed, and every lane and power, is the game’s fiction, and says
        so.
      </p>
    </main>
  );
}

export default function NewGameRoute() {
  return <NewGame />;
}
