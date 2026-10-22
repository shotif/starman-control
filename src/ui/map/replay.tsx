// The battle replay's screen (M4_FLEETS.md §25.3, §25.4): the battle in 3D in the map's place, the
// controls in thumb reach on a phone and along the scene's foot on a desktop, and the account of the
// battle beside it (a panel on a desktop or a wide tablet, a sheet on a phone). This file and the
// scene it draws load only when a battle is watched, so the map's first load does not carry them.

import { useSignal } from '@preact/signals';
import { useEffect, useMemo, useRef } from 'preact/hooks';
import { quality, reducedMotion } from '../../app/settings.ts';
import { FACTIONS, type FactionId } from '../../content/factions.ts';
import type { DamageType } from '../../content/modules.ts';
import { SHIPS } from '../../content/ships.ts';
import { BattleScene, type ReplayTick } from '../../render/BattleScene.ts';
import type { MapView } from '../../render/MapView.ts';
import { replayModel, roundBack, roundOn, roundStart, SHOT_COLOURS } from '../../render/replayModel.ts';
import { systemLayout } from '../../render/systemLayout.ts';
import type { BattleLog } from '../../sim/battle.ts';
import type { GameState } from '../../sim/state.ts';
import type { World } from '../../sim/world.ts';
import { FactionMark } from '../parts.tsx';
import { BattleWhy, battleText } from './battle.tsx';
import './replay.css';

const SPEEDS = [1, 2, 4] as const;
const KIND_WORDS: Record<DamageType, string> = { energy: 'Energy', kinetic: 'Kinetic', plasma: 'Plasma', ion: 'Ion' };

/** Whole units from tenths, as the fleet panel shows structure. */
const units = (tenths: number) => Math.ceil(tenths / 10);

export function ReplayView({
  world,
  game,
  log,
  me,
  view,
  wide,
  onClose,
  onScene,
}: {
  world: World;
  game: GameState;
  log: BattleLog;
  me: FactionId;
  /** The map, whose renderer the replay borrows while it is open. */
  view: MapView;
  /** A desktop or a wide tablet: the account in a panel beside the scene. */
  wide: boolean;
  onClose: () => void;
  /** The scene made, or gone: for the map screen to tell it where its stage is. */
  onScene: (scene: BattleScene | null) => void;
}) {
  const sceneRef = useRef<BattleScene | null>(null);
  const tick = useSignal<ReplayTick | null>(null);
  const picked = useSignal<number | null>(null);
  const account = useSignal(wide);
  const model = useMemo(() => replayModel(log, me), [log, me]);

  useEffect(() => {
    const v = view;
    v.suspend(true);
    const star = systemLayout(world.system(log.system), []).stars[0];
    const scene = new BattleScene(
      v.gl,
      v.host,
      model,
      {
        tick: (t) => {
          tick.value = t;
        },
        pick: (id) => {
          picked.value = id;
        },
      },
      { reducedMotion: reducedMotion(), quality: quality(), sky: v.skyTexture, ...(star ? { star } : {}) },
    );
    sceneRef.current = scene;
    onScene(scene);
    if (new URLSearchParams(location.search).has('test'))
      (window as unknown as { __replay: BattleScene | null }).__replay = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
      onScene(null);
      v.suspend(false);
      if (new URLSearchParams(location.search).has('test'))
        (window as unknown as { __replay: BattleScene | null }).__replay = null;
    };
  }, []);

  useEffect(() => {
    account.value = wide;
  }, [wide]);

  // Keys (§25.3): Space, ← and →, Home, F, S, and Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = sceneRef.current;
      if (!s || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && (el as HTMLInputElement).type !== 'range')
        return;
      const k = e.key;
      if (k === ' ') s.playing ? s.pause() : s.play();
      else if (k === 'ArrowLeft') s.seek(roundBack(model, s.time));
      else if (k === 'ArrowRight') s.seek(roundOn(model, s.time));
      else if (k === 'Home') s.seek(0);
      else if (k === 'f' || k === 'F') s.setSpeed(SPEEDS[(SPEEDS.indexOf(s.speed as 1) + 1) % SPEEDS.length] ?? 1);
      else if (k === 's' || k === 'S') s.skip();
      else if (k === 'Escape') onClose();
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const t = tick.value;
  const frame = t?.frame ?? null;
  const playing = t?.playing ?? true;
  const speed = t?.speed ?? 1;
  const round = frame?.round ?? 0;
  const ended = frame?.ended ?? false;
  const scene = sceneRef.current;
  const place = world.system(log.system).name;
  const shipFrame = (id: number) => frame?.ships.find((s) => s.id === id);
  const chosen = picked.value === null ? undefined : log.ships.find((s) => s.id === picked.value);
  const kinds = [...new Set(model.shots.map((s) => s.type))];

  const side = (owner: FactionId) => {
    const tally = frame?.tally.find((x) => x.owner === owner);
    const forces = log.forces.filter((f) => f.owner === owner);
    return (
      <section key={owner} class="replay-side" aria-label={FACTIONS[owner].name}>
        <h3>
          <FactionMark faction={owner} size={12} /> {owner === me ? 'Ours' : `The ${FACTIONS[owner].shortName}`}
        </h3>
        {tally && (
          <p class="replay-tally">
            {tally.ships} fighting{tally.lost > 0 ? `, ${tally.lost} lost` : ''}
            {tally.left > 0 ? `, ${tally.left} gone` : ''} · structure {units(tally.structure)} of{' '}
            {units(tally.structureStart)}
          </p>
        )}
        {forces.map((f) => (
          <div key={f.key} class="replay-force">
            <p class="replay-force-name">{f.fleet === null ? 'Ships sailing alone' : f.name}</p>
            <ul>
              {log.ships
                .filter((s) => s.force === f.key)
                .map((s) => {
                  const sf = shipFrame(s.id);
                  const left = sf?.structure ?? s.structure;
                  const state =
                    sf?.status === 'breaking' || (sf?.status === 'gone' && left <= 0)
                      ? 'destroyed'
                      : sf?.status === 'leaving' || sf?.status === 'gone'
                        ? 'gone'
                        : null;
                  return (
                    <li
                      key={s.id}
                      class={`replay-ship${picked.value === s.id ? ' is-picked' : ''}${state ? ` is-${state}` : ''}`}
                    >
                      <button
                        type="button"
                        class="link"
                        onClick={() => {
                          picked.value = s.id;
                          scene?.setSelected(s.id);
                        }}
                      >
                        {s.name}
                      </button>
                      <span class="replay-bar" aria-hidden="true">
                        <span style={{ width: `${Math.round((100 * left) / Math.max(1, s.structureMax))}%` }} />
                      </span>
                      <span class="dim">
                        {state === 'destroyed' ? 'destroyed' : state === 'gone' ? 'left' : `${units(left)}`}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </section>
    );
  };

  const accountView = (
    <div class="replay-account-body">
      <p class="replay-summary">{battleText(world, game, log, me)}</p>
      {model.sides.map((s) => side(s.owner))}
      <BattleWhy log={log} me={me} />
      {kinds.length > 0 && (
        <p class="replay-key">
          <span class="dim">Fire:</span>
          {kinds.map((k) => (
            <span key={k}>
              <i style={{ background: SHOT_COLOURS[k] }} aria-hidden="true" /> {KIND_WORDS[k]}
            </span>
          ))}
        </p>
      )}
    </div>
  );

  return (
    <div class={`replay${wide ? ' is-wide' : ''}`} data-testid="replay">
      <div class="replay-top" data-covers-map>
        <button type="button" class="chip" onClick={onClose}>
          ← Back
        </button>
        <h2 class="replay-title">
          Battle at {place}
          <span class="replay-round">
            {round === 0 ? 'Before the first round' : `Round ${round} of ${model.rounds}`}
            {ended ? ' · the end' : ''}
          </span>
        </h2>
        {!wide && (
          <button
            type="button"
            class="chip"
            aria-pressed={account.value}
            onClick={() => {
              account.value = !account.value;
            }}
          >
            Account
          </button>
        )}
      </div>

      {chosen && (
        <div class="replay-card" data-keep-clear>
          <p>
            <FactionMark faction={chosen.owner} size={12} /> <b>{chosen.name}</b>{' '}
            <span class="dim">
              {chosen.design ?? SHIPS[chosen.type].name}, {FACTIONS[chosen.owner].shortName}
            </span>
          </p>
          <p class="dim">
            {(() => {
              const sf = shipFrame(chosen.id);
              if (sf?.status === 'breaking' || (sf?.status === 'gone' && sf.structure <= 0)) return 'Destroyed.';
              if (sf?.status === 'leaving' || sf?.status === 'gone') return 'Left the battle.';
              const shields =
                chosen.shieldMax > 0 ? `, shields ${units(sf?.shield ?? 0)} of ${units(chosen.shieldMax)}` : '';
              return `Structure ${units(sf?.structure ?? chosen.structure)} of ${units(chosen.structureMax)}${shields}.`;
            })()}
          </p>
          <button
            type="button"
            class="button button-quiet button-small"
            onClick={() => {
              picked.value = null;
              scene?.setSelected(null);
            }}
          >
            Close
          </button>
        </div>
      )}

      {wide && (
        <aside class="replay-account is-side" aria-label="The account of the battle" data-covers-map>
          {accountView}
        </aside>
      )}

      <div class="replay-dock" data-covers-map>
        {!wide && account.value && (
          <aside class="replay-account" aria-label="The account of the battle">
            {accountView}
          </aside>
        )}
        <div class="replay-controls" role="toolbar" aria-label="Replay">
          <div class="replay-slider">
            <input
              type="range"
              min={0}
              max={model.duration}
              step={0.05}
              value={t?.t ?? 0}
              aria-label="Time in the battle"
              aria-valuetext={round === 0 ? 'Before the first round' : `Round ${round} of ${model.rounds}`}
              onInput={(e) => scene?.seek(Number((e.target as HTMLInputElement).value))}
            />
            <span class="replay-marks" aria-hidden="true">
              {Array.from({ length: model.rounds }, (_, i) => (
                <i key={i} style={{ left: `${(100 * roundStart(model, i + 1)) / model.duration}%` }} />
              ))}
            </span>
          </div>
          <div class="replay-buttons">
            <button
              type="button"
              class="chip"
              aria-label="Back to the start"
              title="Back to the start (Home)"
              onClick={() => scene?.seek(0)}
            >
              ⏮
            </button>
            <button
              type="button"
              class="chip"
              aria-label="A round back"
              title="A round back (←)"
              onClick={() => scene?.seek(roundBack(model, scene.time))}
            >
              ◀
            </button>
            <button
              type="button"
              class="chip replay-play"
              aria-label={playing ? 'Pause' : ended ? 'Play again' : 'Play'}
              title={playing ? 'Pause (Space)' : 'Play (Space)'}
              onClick={() => (playing ? scene?.pause() : scene?.play())}
            >
              {playing ? '❚❚' : '▶'}
            </button>
            <button
              type="button"
              class="chip"
              aria-label="A round on"
              title="A round on (→)"
              onClick={() => scene?.seek(roundOn(model, scene.time))}
            >
              ▶▶
            </button>
            <button
              type="button"
              class="chip"
              aria-label={`Speed: ${speed}×`}
              title="Faster (F)"
              onClick={() => scene?.setSpeed(SPEEDS[(SPEEDS.indexOf(speed as 1) + 1) % SPEEDS.length] ?? 1)}
            >
              {speed}×
            </button>
            <button
              type="button"
              class="chip"
              title="Skip to the end (S)"
              disabled={ended}
              onClick={() => scene?.skip()}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
