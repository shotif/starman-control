// A new game (§10; FIRST_IMPRESSION.md §3): the three powers as tall cards, each with its home in a
// picture, its leader's face and its emblem, then where it starts, how it plays, its trait and its
// shipmakers; and a seed for those who want the same game twice. Side by side on a desktop; one at
// a time on a phone, swiped sideways. The pictures are illustrations (D-23), and say so.

import { useRef, useState } from 'preact/hooks';
import { startGame, world } from '../../app/game.ts';
import { FACTION_IDS, FACTIONS, type FactionId } from '../../content/factions.ts';
import { RULES } from '../../content/rules.ts';
import { formatLy } from '../../sim/geometry.ts';
import { Emblem } from '../parts.tsx';
import './newgame.css';

/** Each power's pictures (art/manifest.json) and what they show, for those who cannot see them. */
const ART: Record<FactionId, { file: string; scene: string; leader: string; leaderAlt: string }> = {
  sta: {
    file: 'sta',
    scene:
      'Earth at dawn from high orbit, with the Authority’s great wheel of a customs station and ships waiting in line.',
    leader: 'The Director',
    leaderAlt: 'The Director of the Authority: a calm, white-bearded man in a dark green uniform.',
  },
  frontier: {
    file: 'frontier',
    scene: 'White domes and green terraced farms on the hills of Tau Ceti e under a golden, dusty sky.',
    leader: 'An Elder',
    leaderAlt: 'An elected Elder of the Cooperative: a woman with braided dark hair in a blue work jacket.',
  },
  'hollow-wake': {
    file: 'wake',
    scene: 'A hollowed asteroid fitted with docks and floodlights, by the red dwarf Wolf 1061 and its dark planet.',
    leader: 'The Chief',
    leaderAlt: 'The chief of the Wake: a lean woman with a shaved head and a scar, in a patched red flight jacket.',
  },
};

const base = import.meta.env.BASE_URL;

function PowerCard({ id, starting, onStart }: { id: FactionId; starting: FactionId | null; onStart: () => void }) {
  const f = FACTIONS[id];
  const art = ART[id];
  const capital = world.system(f.capital.systemId);
  const scene = `${base}art/illustration/power-${art.file}-scene`;
  const leader = `${base}art/portrait/power-${art.file}-leader`;
  return (
    <article class="power-card" style={{ '--faction': f.colour }} aria-label={f.name}>
      <div class="power-frame">
        <div class="power-art">
          <img
            class="power-scene"
            src={`${scene}-640.webp`}
            srcset={`${scene}-640.webp 640w, ${scene}-1280.webp 1280w`}
            sizes="(min-width: 960px) 34vw, 88vw"
            width={640}
            height={429}
            alt={art.scene}
            decoding="async"
          />
          <span class="badge badge-fiction power-badge" title="Made with the game’s art pipeline; not a photograph">
            Illustration
          </span>
        </div>
        <div class="power-body">
          <div class="power-id">
            <figure class="power-leader">
              <img
                src={`${leader}-384.webp`}
                srcset={`${leader}-384.webp 384w, ${leader}-768.webp 768w`}
                sizes="112px"
                width={384}
                height={572}
                alt={art.leaderAlt}
                decoding="async"
              />
              <figcaption>{art.leader}</figcaption>
            </figure>
            <div class="power-name">
              <Emblem faction={id} size={44} />
              <h2>{f.name}</h2>
            </div>
          </div>
          <p class="plays-as">{f.playsAs}</p>
          <dl class="power-facts">
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
          <button type="button" class="power-lead" disabled={starting !== null} onClick={onStart}>
            <span>{starting === id ? 'Starting…' : `Lead the ${f.shortName}`}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export function NewGame() {
  const [seed, setSeed] = useState('');
  const [starting, setStarting] = useState<FactionId | null>(null);
  const [shown, setShown] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const seedNumber = /^\d+$/.test(seed.trim()) ? Number(seed.trim()) % 0x100000000 || 1 : undefined;

  const start = async (f: FactionId) => {
    setStarting(f);
    await startGame(f, seedNumber);
    location.hash = '#/game';
  };
  // On a phone the cards are swiped; the dots follow the card in view, and take you to one.
  const onScroll = () => {
    const t = track.current;
    if (!t || t.scrollWidth <= t.clientWidth) return;
    // The card nearest the middle; the last once the track has run out.
    const middle = t.scrollLeft + t.clientWidth / 2;
    let best = 0;
    [...t.children].forEach((c, i) => {
      const card = c as HTMLElement;
      const best0 = t.children[best] as HTMLElement;
      if (
        Math.abs(card.offsetLeft + card.offsetWidth / 2 - middle) <
        Math.abs(best0.offsetLeft + best0.offsetWidth / 2 - middle)
      )
        best = i;
    });
    if (t.scrollLeft >= t.scrollWidth - t.clientWidth - 2) best = t.children.length - 1;
    if (t.scrollLeft <= 2) best = 0;
    setShown(best);
  };
  const show = (i: number) => {
    const card = track.current?.children[i] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  return (
    <main class="new-game">
      <header class="ng-head">
        <a class="back" href="#/">
          <span aria-hidden="true">‹</span> Title
        </a>
        <p class="kicker">
          Q1 {RULES.calendar.startYear} · a generation after the Lapse <span class="badge badge-fiction">Fiction</span>
        </p>
        <h1>Choose your power</h1>
        <p class="dim">
          Each power still tends the lanes round its home. Beyond them, the old lanes run dark, and the stars are
          waiting.
        </p>
      </header>
      <div class="power-cards" ref={track} onScroll={onScroll}>
        {FACTION_IDS.map((id) => (
          <PowerCard key={id} id={id} starting={starting} onStart={() => void start(id)} />
        ))}
      </div>
      <div class="power-dots" aria-hidden="true">
        {FACTION_IDS.map((id, i) => (
          <button
            key={id}
            type="button"
            tabIndex={-1}
            class={i === shown ? 'on' : ''}
            style={{ '--faction': FACTIONS[id].colour }}
            onClick={() => show(i)}
          />
        ))}
      </div>
      <footer class="ng-foot">
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
          Every star is real. Every world nobody has observed, and every lane, power and person, is the game’s fiction,
          and says so. The pictures are illustrations made with the game’s art pipeline.
        </p>
      </footer>
    </main>
  );
}

export default function NewGameRoute() {
  return <NewGame />;
}
