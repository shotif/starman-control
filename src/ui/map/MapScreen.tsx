// The map screen (§10), the home of the game. Both layouts are designed together (D-04):
//
// Phone: the map fills the screen, flat by default; a top bar and a bottom bar within thumb reach;
// a star opens its system as a bottom sheet; ships, the report and the menu are sheets too.
// Desktop: 3D by default; a top bar, an outliner on the left, the inspector on the right; hover
// cards, double-click to centre, right-click to order the selected ship, and a key for every action.
//
// It shows the neighbourhood to explore before playing, or a game (`play`), as M1_TURNS.md §6 sets
// out. The map element stays the same whichever layout is showing, so a tablet that switches layout
// when a mouse is used keeps its view.

import { type ComponentChildren, Fragment } from 'preact';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { quality, reducedMotion, settings } from '../../app/settings.ts';
import { play as sound } from '../../app/sound.ts';
import { ANOMALIES } from '../../content/anomalies.ts';
import { FACTION_IDS, FACTIONS } from '../../content/factions.ts';
import { SHIPS } from '../../content/ships.ts';
import type { SystemId } from '../../data/types.ts';
import type { ColonyView } from '../../render/ColonyView.ts';
import type { SceneBuilding } from '../../render/colonyScene.ts';
import type { MapRoute, MapView, ShipMark, ViewMode } from '../../render/MapView.ts';
import type { Rect } from '../../render/mapMath.ts';
import { mapContent } from '../../render/mapModel.ts';
import type { SceneLabel, SystemScene } from '../../render/SystemScene.ts';
import { anomalyAt } from '../../sim/anomalies.ts';
import { bodiesOf } from '../../sim/bodies.ts';
import { formatDate } from '../../sim/calendar.ts';
import { formatLy } from '../../sim/geometry.ts';
import { blindReachDeci, findRoute, lanesFor } from '../../sim/movement.ts';
import type { Need } from '../../sim/needs.ts';
import { speciesFor } from '../../sim/research.ts';
import { starKindWord } from '../../sim/stars.ts';
import { type GameState, hasSurveyed, powerOf, type ShipState } from '../../sim/state.ts';
import type { World } from '../../sim/world.ts';
import { Icon } from '../icons.tsx';
import { layout, sideSheets } from '../layout.ts';
import { Badge, FactionMark } from '../parts.tsx';
import { Sheet } from '../Sheet.tsx';
import { searchSystems } from '../search.ts';
import { SystemView } from '../system/SystemPanel.tsx';
import { ColonyCard } from './ColonyCard.tsx';
import { stillScene } from './ColonyStill.tsx';
import { EmpireView, HoldingPanel, holdingKind, holdingName, millions, needText, Resources } from './colony.tsx';
import {
  give,
  NeedsStack,
  type Play,
  planFor,
  ReportView,
  ShipPanel,
  ShipsList,
  shipStatus,
  TargetBar,
} from './play.tsx';
import { ResearchView } from './research.tsx';
import {
  failed,
  hover,
  insideColony,
  insideSystem,
  lanePreview,
  mode,
  panel,
  query,
  queueHover,
  selected,
  selectedBody,
  selectedHolding,
  selectedShip,
  targeting,
  toast,
} from './state.ts';
import '../sheet.css';
import './map.css';
import '../console.css';

interface Props {
  world: World;
  game: GameState;
  buildId: string;
  /** A game being played; absent when exploring. */
  play?: Play;
}

/** Keys for the desktop (§10: a shortcut for every action, listed under ?). */
export const SHORTCUTS: readonly [string, string][] = [
  ['Arrows or W A S D', 'Move the map'],
  ['Q and E', 'Turn the map (3D)'],
  ['+ and −', 'Zoom in and out'],
  ['F', 'Flat or 3D view'],
  ['H', 'Back home'],
  ['0', 'The whole neighbourhood'],
  ['/', 'Find a system'],
  ['C', 'Centre the selection'],
  ['V', 'Into the selected system, in 3D, and out again'],
  ['Arrows, + and −', 'In a colony: look along it, and closer or further'],
  ['Esc', 'Close, cancel, or clear the selection'],
  ['?', 'These keys'],
];

export const PLAY_SHORTCUTS: readonly [string, string][] = [
  ['Enter', 'End the turn'],
  ['N', 'The next thing that needs you'],
  ['M', 'Move the selected ship'],
  ['Right click', 'Send the selected ship there (Shift: add a waypoint)'],
  ['R', 'The report'],
  ['P', 'Your power: colonies, outposts and ships'],
];

function shipMarks(game: GameState): ShipMark[] {
  return game.ships.map((s) => {
    const colour = FACTIONS[s.owner].colour;
    if (s.at !== null || !s.blindJump) return { at: s.at, colour };
    const j = s.blindJump;
    return { at: null, from: j.from, to: j.to, progress: (j.turns - j.left + 0.5) / j.turns, colour };
  });
}

/**
 * Standing orders, drawn faintly: each ship's route through its destinations, or its blind jump,
 * and each lane waiting in a queue.
 */
function orderRoutes(world: World, game: GameState, faction: string): MapRoute[] {
  const out: MapRoute[] = [];
  for (const h of game.holdings) {
    if (h.owner !== faction) continue;
    for (const q of h.queue) if (q.kind === 'lane') out.push({ systems: [h.system, q.to], kind: 'orders' });
  }
  for (const s of game.ships) {
    if (s.owner !== faction) continue;
    if (s.blindJump) {
      out.push({ systems: [s.blindJump.from, s.blindJump.to], kind: 'orders', blind: true });
      continue;
    }
    if (s.at === null || s.destinations.length === 0) continue;
    const path: SystemId[] = [s.at];
    let at = s.at;
    for (const d of s.destinations) {
      const leg = findRoute(world, game, s.owner, at, d);
      if (!leg) break;
      path.push(...leg.map((h) => h.to));
      at = d;
    }
    out.push({ systems: path, kind: 'orders' });
  }
  return out;
}

export function MapScreen({ world, game, buildId, play }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const view = useRef<MapView | null>(null);
  const sheetHeight = useRef(0);
  const bar = useRef<HTMLElement>(null);
  const top = useRef<HTMLElement>(null);
  const [barHeight, setBarHeight] = useState(0);
  const [topHeight, setTopHeight] = useState(56);
  const desktop = layout.value === 'desktop';
  // The latest game and play for callbacks the map holds on to.
  const latest = useRef({ game, play });
  latest.current = { game, play };
  const home = play ? powerOf(game, play.faction).capital : 'sol';

  const select = useCallback((id: SystemId | null) => {
    if (id !== selected.value) selectedBody.value = null;
    selected.value = id;
    selectedShip.value = null;
    selectedHolding.value = null;
    view.current?.setSelected(id);
    if (id && panel.value === 'search') panel.value = null;
  }, []);
  const go = useCallback(
    (id: SystemId) => {
      select(id);
      view.current?.focus(id);
    },
    [select],
  );
  const pickShip = useCallback((id: number) => {
    const s = latest.current.game.ships.find((x) => x.id === id);
    if (!s) return;
    selectedShip.value = id;
    selectedHolding.value = null;
    selected.value = s.at;
    panel.value = null;
    const where = s.at ?? s.blindJump?.to ?? null;
    view.current?.setSelected(where);
    if (where) view.current?.focus(where);
  }, []);
  const pickHolding = useCallback((id: number) => {
    const h = latest.current.game.holdings.find((x) => x.id === id);
    if (!h) return;
    selectedShip.value = null;
    selectedHolding.value = id;
    selected.value = h.system;
    panel.value = null;
    view.current?.setSelected(h.system);
    view.current?.focus(h.system);
  }, []);
  /** Opens a colony's or an outpost's scene, from anywhere (COLONY_VIEW.md §4). */
  const viewColony = useCallback(
    (id: number) => {
      pickHolding(id);
      insideColony.value = id;
    },
    [pickHolding],
  );
  const openResearch = useCallback(() => {
    targeting.value = null;
    panel.value = 'research';
  }, []);
  const onNeed = useCallback(
    (n: Need) =>
      n.kind === 'idle-ship' ? pickShip(n.ship) : n.kind === 'no-research' ? openResearch() : pickHolding(n.holding),
    [pickShip, pickHolding, openResearch],
  );

  /** A star chosen on the map: a destination while choosing one, else a system to look at. */
  const onMapSelect = useCallback(
    (id: SystemId | null) => {
      const t = targeting.value;
      if (t) {
        if (id) targeting.value = { ...t, to: id };
        return;
      }
      select(id);
    },
    [select],
  );

  /** A right click (desktop): send the selected ship there, along lanes if it can, else blind. */
  const onCommand = useCallback(
    (id: SystemId, shift: boolean) => {
      const { game: g, play: p } = latest.current;
      const shipId = selectedShip.value;
      const ship = shipId === null ? undefined : g.ships.find((s) => s.id === shipId);
      if (!p || !ship) return;
      if (shift) {
        give(p, { type: 'move', ship: ship.id, to: id, append: true });
        return;
      }
      const plan = planFor(world, g, ship, id, false);
      if (!plan.ok) {
        give(p, { type: 'move', ship: ship.id, to: id });
        return;
      }
      give(p, plan.blind ? { type: 'blind-jump', ship: ship.id, to: id } : { type: 'move', ship: ship.id, to: id });
    },
    [world],
  );

  // The map itself, made once for this world.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    import('../../render/MapView.ts')
      .then(({ MapView }) => {
        if (disposed) return;
        try {
          const initial = mode.value ?? (layout.value === 'desktop' ? '3d' : 'flat');
          mode.value = initial;
          const { game: g, play: p } = latest.current;
          const v = new MapView(
            el,
            mapContent(world, g),
            {
              select: (id) => onMapSelect(id),
              hover: (id, x, y) => {
                hover.value = id ? { id, x, y } : null;
              },
              activate: (id) => go(id),
              command: (id, _x, _y, shift) => onCommand(id, shift),
            },
            initial,
          );
          view.current = v;
          v.setSelected(selected.value);
          if (p) v.focus(powerOf(g, p.faction).capital, true);
          if (new URLSearchParams(location.search).has('test')) (window as unknown as { __map: MapView }).__map = v;
          updateStage();
          setReady((n) => n + 1);
        } catch (err) {
          failed.value = (err as Error).message || 'WebGL is not available';
        }
      })
      .catch((err: Error) => {
        failed.value = err.message;
      });
    return () => {
      disposed = true;
      view.current?.dispose();
      view.current = null;
    };
  }, [world, onMapSelect, go, onCommand]);
  const [ready, setReady] = useState(0);
  // The settings that change how the map draws (M1_PROOF.md §1).
  const look = settings.value;
  useEffect(() => {
    view.current?.configure({ reducedMotion: reducedMotion(look), quality: quality(look) });
  }, [look, ready]);

  // The system in 3D (M1_SYSTEM_VIEW.md): it borrows the map's renderer while it is open.
  const sceneRef = useRef<SystemScene | null>(null);
  const inside = insideSystem.value;
  // The veil over the map while it glides into a system and the system comes up (LIVING_MAP.md §5).
  const [veil, setVeil] = useState<{ kind: 'in' | 'out'; n: number } | null>(null);
  useEffect(() => {
    const v = view.current;
    if (!inside || !v) return;
    let disposed = false;
    let scene: SystemScene | null = null;
    const glide = v.glideInto(inside);
    if (glide) setVeil((w) => ({ kind: 'in', n: (w?.n ?? 0) + 1 }));
    void Promise.all([
      import('../../render/SystemScene.ts'),
      import('../../render/systemLayout.ts'),
      new Promise((done) => setTimeout(done, glide)),
    ]).then(([{ SystemScene }, { systemLayout }]) => {
      if (disposed) return;
      const { game: g, play: p } = latest.current;
      const power = p ? powerOf(g, p.faction) : undefined;
      const surveyed = power ? hasSurveyed(power, inside) : true;
      const bodies = bodiesOf(world, g.seed, inside).filter((b) => surveyed || b.origin !== 'generated');
      const layout = systemLayout(world.system(inside), bodies);
      const labels = new Map<string, SceneLabel>();
      for (const st of world.system(inside).sky.stars) labels.set(st.id, { text: st.name });
      for (const b of bodies) {
        const h = g.holdings.find((x) => x.body === b.id);
        labels.set(b.id, h ? { text: b.name, held: FACTIONS[h.owner].colour } : { text: b.name });
      }
      v.suspend(true);
      scene = new SystemScene(
        v.gl,
        v.host,
        layout,
        labels,
        {
          select: (id) => {
            if (!id) return;
            const isBody = bodies.some((b) => b.id === id);
            selected.value = inside;
            selectedShip.value = null;
            selectedHolding.value = null;
            selectedBody.value = isBody ? id : null;
            scene?.setSelected(id);
            scene?.focus(id);
          },
        },
        { reducedMotion: reducedMotion(), quality: quality(), sky: v.skyTexture },
      );
      sceneRef.current = scene;
      scene.setSelected(selectedBody.value);
      updateStage();
      if (glide) setVeil((w) => ({ kind: 'out', n: (w?.n ?? 0) + 1 }));
      if (new URLSearchParams(location.search).has('test'))
        (window as unknown as { __system: SystemScene }).__system = scene;
    });
    return () => {
      disposed = true;
      scene?.dispose();
      sceneRef.current = null;
      v.suspend(false);
      // The map comes back up out of the dark.
      if (!reducedMotion()) setVeil((w) => ({ kind: 'out', n: (w?.n ?? 0) + 1 }));
      else setVeil(null);
    };
  }, [inside, world, ready]);
  // Leaving the system: choosing another, choosing where a ship goes.
  useEffect(() => {
    if (inside && ((selected.value && selected.value !== inside) || targeting.value)) insideSystem.value = null;
  }, [inside, selected.value, targeting.value]);

  // A colony as a living diorama (COLONY_VIEW.md): it borrows the map's renderer as the system does.
  const colonyRef = useRef<ColonyView | null>(null);
  const colony = insideColony.value;
  /** The building chosen in the colony's scene, for its card. */
  const [picked, setPicked] = useState<SceneBuilding | null>(null);
  useEffect(() => {
    const v = view.current;
    if (colony === null || !v) return;
    const { game: g } = latest.current;
    const h = g.holdings.find((x) => x.id === colony);
    const scene = h ? stillScene(world, g, h) : null;
    if (!h || !scene) {
      insideColony.value = null;
      return;
    }
    insideSystem.value = null;
    let disposed = false;
    let cv: ColonyView | null = null;
    const glide = v.glideInto(h.system);
    if (glide) setVeil((w) => ({ kind: 'in', n: (w?.n ?? 0) + 1 }));
    void Promise.all([
      import('../../render/ColonyView.ts'),
      import('../../content/colonyArt.ts'),
      new Promise((done) => setTimeout(done, glide)),
    ]).then(([{ ColonyView }, { LANDSCAPES }]) => {
      if (disposed) return;
      v.suspend(true);
      cv = new ColonyView(
        v.gl,
        v.host,
        scene,
        LANDSCAPES[scene.biome],
        { reducedMotion: reducedMotion(), quality: quality(), base: import.meta.env.BASE_URL },
        { select: (b) => setPicked(b) },
      );
      colonyRef.current = cv;
      updateStage();
      void cv.ready.then(() => {
        if (glide && !disposed) setVeil((w) => ({ kind: 'out', n: (w?.n ?? 0) + 1 }));
      });
      if (new URLSearchParams(location.search).has('test'))
        (window as unknown as { __colony: ColonyView }).__colony = cv;
    });
    return () => {
      disposed = true;
      cv?.dispose();
      colonyRef.current = null;
      setPicked(null);
      v.suspend(false);
      if (!reducedMotion()) setVeil((w) => ({ kind: 'out', n: (w?.n ?? 0) + 1 }));
      else setVeil(null);
    };
  }, [colony, world, ready]);
  // The colony's scene follows the game: a turn ends, something is queued.
  const colonyHolding = colony === null ? undefined : game.holdings.find((x) => x.id === colony);
  const colonyKey = colonyHolding ? JSON.stringify(stillScene(world, game, colonyHolding)) : '';
  useEffect(() => {
    const cv = colonyRef.current;
    const { game: g } = latest.current;
    const h = g.holdings.find((x) => x.id === colony);
    const scene = h ? stillScene(world, g, h) : null;
    if (cv && scene) cv.setScene(scene);
    // A chosen building that is gone (a scaffold become its project) gives up its card.
    setPicked((p) => (p && scene?.buildings.some((b) => b.slot === p.slot && b.kind === p.kind) ? p : null));
  }, [colonyKey]);
  // Desktop: the pointer over the queue's first project lights its scaffold in the scene.
  const hoverQueue = queueHover.value;
  useEffect(() => {
    const cv = colonyRef.current;
    if (!cv || colony === null) return;
    const h = latest.current.game.holdings.find((x) => x.id === colony);
    const scene = h ? stillScene(world, latest.current.game, h) : null;
    const scaffold = scene?.buildings.find((b) => b.kind === 'scaffold');
    cv.setSelected(hoverQueue === colony && scaffold ? scaffold.slot : (picked?.slot ?? null));
  }, [hoverQueue, colony, picked]);
  // Leaving the colony: its panel closed, another chosen, or a ship's destination being chosen.
  useEffect(() => {
    if (colony === null) return;
    if (targeting.value || selectedHolding.value === null) insideColony.value = null;
    else if (selectedHolding.value !== colony) insideColony.value = selectedHolding.value;
  }, [colony, selectedHolding.value, targeting.value]);

  // What the map draws follows the game: its lanes and holdings, its ships, and the routes.
  const lanesKey = [
    ...game.lanes.map((l) => `${l.id}:${l.owner}:${l.status}`),
    ...game.holdings.map((h) => `${h.id}:${Math.floor(h.people / 10)}`),
  ].join(',');
  useEffect(() => {
    view.current?.setContent(mapContent(world, latest.current.game));
    view.current?.setSelected(selected.value);
  }, [world, lanesKey, ready]);
  const shipsKey = JSON.stringify(game.ships.map((s) => [s.at, s.blindJump?.left, s.destinations]));
  const queuesKey = JSON.stringify(game.holdings.map((h) => h.queue.filter((q) => q.kind === 'lane')));
  useEffect(() => {
    view.current?.setShips(play ? shipMarks(latest.current.game) : []);
  }, [shipsKey, ready, play]);
  const t = targeting.value;
  const hoverId = hover.value?.id ?? null;
  useEffect(() => {
    const v = view.current;
    if (!v) return;
    const { game: g, play: p } = latest.current;
    if (!p) {
      v.setRoutes([]);
      return;
    }
    const routes = orderRoutes(world, g, p.faction);
    const ship = g.ships.find((s) => s.id === (t?.ship ?? selectedShip.value));
    const to = t ? t.to : desktop && selectedShip.value !== null ? hoverId : null;
    if (ship && to) {
      const plan = planFor(world, g, ship, to, t?.blind ?? false);
      if (plan.ok) routes.push({ systems: plan.path, kind: 'plan', blind: plan.blind });
    }
    const lane = lanePreview.value;
    if (lane) routes.push({ systems: [lane.from, lane.to], kind: 'plan' });
    v.setRoutes(routes);
  }, [shipsKey, queuesKey, ready, t, hoverId, desktop, selectedShip.value, lanePreview.value, world, play]);

  // Choosing where a ship goes: every star it can reach in one go is framed above the bars.
  const targetShip = t?.ship ?? null;
  const targetBlind = t?.blind ?? false;
  useEffect(() => {
    const v = view.current;
    if (targetShip === null || !v) return;
    const { game: g } = latest.current;
    const ship = g.ships.find((s) => s.id === targetShip);
    if (!ship?.at) return;
    const from = ship.at;
    const around = targetBlind
      ? world.systems.filter((s) => world.distanceDeci(from, s.id) <= blindReachDeci(g, ship.owner)).map((s) => s.id)
      : (lanesFor(world, g, ship.owner).get(from) ?? []).map((h) => h.to);
    v.frameAround(from, around);
  }, [targetShip, targetBlind, world]);

  /** Tells the map which part of it is not covered by bars, panels and sheets. */
  const updateStage = useCallback(() => {
    const v = view.current;
    const el = host.current;
    if (!v || !el) return;
    const box = el.getBoundingClientRect();
    const rel = (r: DOMRect): Rect => ({ x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height });
    const rects = (selector: string) =>
      [...(root.current?.querySelectorAll<HTMLElement>(selector) ?? [])]
        .map((e) => rel(e.getBoundingClientRect()))
        .filter((r) => r.w > 0 && r.h > 0);
    const covers = rects('[data-covers-map]');
    let topY = 0;
    let bottom = box.height;
    let left = 0;
    let right = box.width;
    for (const r of covers) {
      if (r.w >= box.width * 0.6) {
        if (r.y + r.h / 2 < box.height / 2) topY = Math.max(topY, r.y + r.h);
        else bottom = Math.min(bottom, r.y);
      } else if (r.h >= box.height * 0.5) {
        // A panel down one side (a side sheet).
        if (r.x + r.w / 2 > box.width / 2) right = Math.min(right, r.x);
        else left = Math.max(left, r.x + r.w);
      }
    }
    // The sheet sits on the bottom bar; its height is the one it is settling to, not mid-animation.
    if (sheetHeight.current > 0) {
      bottom -= sheetHeight.current;
      covers.push({ x: 0, y: bottom, w: box.width, h: box.height - bottom });
    }
    const stage = { x: left, y: topY, w: Math.max(80, right - left), h: Math.max(80, bottom - topY) };
    const avoid = [...covers, ...rects('[data-keep-clear]')];
    v.setStage(stage, avoid);
    sceneRef.current?.setStage(stage, avoid);
    colonyRef.current?.setStage(stage);
  }, []);

  useLayoutEffect(() => {
    updateStage();
  });
  useEffect(() => {
    window.addEventListener('resize', updateStage);
    return () => window.removeEventListener('resize', updateStage);
  }, [updateStage]);

  // The sheets sit on the bottom bar, so they need its height.
  useLayoutEffect(() => {
    const el = bar.current;
    if (!el) {
      setBarHeight(0);
      return;
    }
    const measure = () => {
      setBarHeight(Math.round(el.getBoundingClientRect().height));
      if (top.current) setTopHeight(Math.round(top.current.getBoundingClientRect().height));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (top.current) ro.observe(top.current);
    return () => ro.disconnect();
  }, [desktop]);

  const setMode = (m: ViewMode) => {
    mode.value = m;
    view.current?.setMode(m);
  };

  // The end of a turn (CONSOLE.md §4): a rising tone, a sweep of light and the new date.
  const [sweep, setSweep] = useState<number | null>(null);
  const turnSeen = useRef(game.turn);
  useEffect(() => {
    if (game.turn === turnSeen.current) return;
    const later = game.turn > turnSeen.current;
    turnSeen.current = game.turn;
    if (!later || !latest.current.play) return;
    sound('turn');
    if (reducedMotion()) return;
    setSweep(game.turn);
    const t = setTimeout(() => setSweep(null), 1400);
    return () => clearTimeout(t);
  }, [game.turn]);
  // Ships fly the lanes they took when a turn ends (IN_FLIGHT.md §1).
  const shipsBefore = useRef(new Map<number, SystemId | null>(game.ships.map((s) => [s.id, s.at])));
  const turnOfShips = useRef(game.turn);
  useEffect(() => {
    const g = latest.current.game;
    const before = shipsBefore.current;
    const next = g.turn === turnOfShips.current + 1;
    turnOfShips.current = g.turn;
    shipsBefore.current = new Map(g.ships.map((s) => [s.id, s.at]));
    const v = view.current;
    if (!next || !v || !latest.current.play) return;
    const moves: { path: SystemId[]; colour: string }[] = [];
    for (const s of g.ships) {
      const from = before.get(s.id);
      if (!from || !s.at || from === s.at) continue;
      const hops = findRoute(world, g, s.owner, from, s.at);
      moves.push({ path: hops ? [from, ...hops.map((h) => h.to)] : [from, s.at], colour: FACTIONS[s.owner].colour });
    }
    v.flyShips(moves);
  }, [game.turn]);
  // A refusal sounds low.
  useEffect(() => {
    if (toast.value) sound('refused');
  }, [toast.value]);

  const endTurn = useCallback(async () => {
    const p = latest.current.play;
    if (!p || p.resolving) return;
    targeting.value = null;
    panel.value = null;
    await p.endTurn();
    panel.value = 'report';
  }, []);
  /** The phone's End turn: what needs you first, if anything does. */
  const askEndTurn = () => {
    if (play && play.needs.length > 0) panel.value = 'needs';
    else void endTurn();
  };
  const nextIdle = useCallback(() => {
    const p = latest.current.play;
    if (!p || p.needs.length === 0) return;
    const i = p.needs.findIndex((n) =>
      n.kind === 'idle-ship'
        ? n.ship === selectedShip.value
        : n.kind === 'no-research'
          ? panel.value === 'research'
          : n.holding === selectedHolding.value,
    );
    const next = p.needs[(i + 1) % p.needs.length];
    if (next) onNeed(next);
  }, [onNeed]);

  // Keys (desktop, and any keyboard on a tablet).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const v = view.current;
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const { play: p } = latest.current;
      const step = 60;
      const k = e.key;
      let handled = true;
      const cv = colonyRef.current;
      if (cv && k !== 'Escape' && k !== '?' && k !== 'Enter') {
        if (k === 'ArrowLeft' || k === 'a') cv.panBy(step, 0);
        else if (k === 'ArrowRight' || k === 'd') cv.panBy(-step, 0);
        else if (k === 'ArrowUp' || k === 'w') cv.panBy(0, step);
        else if (k === 'ArrowDown' || k === 's') cv.panBy(0, -step);
        else if (k === '+' || k === '=') cv.zoomBy(1.25);
        else if (k === '-' || k === '_') cv.zoomBy(0.8);
        else if (k === '0' || k === 'c') cv.showTown();
        else handled = false;
        if (handled) {
          e.preventDefault();
          return;
        }
        handled = true;
      }
      if (k === 'ArrowLeft' || k === 'a') v?.panBy(step, 0);
      else if (k === 'ArrowRight' || k === 'd') v?.panBy(-step, 0);
      else if (k === 'ArrowUp' || k === 'w') v?.panBy(0, step);
      else if (k === 'ArrowDown' || k === 's') v?.panBy(0, -step);
      else if (k === 'q') v?.rotateBy(0.14, 0);
      else if (k === 'e') v?.rotateBy(-0.14, 0);
      else if (k === '+' || k === '=') v?.zoomBy(0.8);
      else if (k === '-' || k === '_') v?.zoomBy(1.25);
      else if (k === 'f') setMode(mode.value === 'flat' ? '3d' : 'flat');
      else if (k === 'h') go(home);
      else if (k === '0') v?.showAll();
      else if (k === 'c' && selected.value) v?.focus(selected.value);
      else if (k === '/') {
        panel.value = 'search';
        requestAnimationFrame(() => document.querySelector<HTMLInputElement>('#map-search')?.focus());
      } else if (k === '?') panel.value = panel.value === 'keys' ? null : 'keys';
      else if (k === 'Enter' && p) void endTurn();
      else if (k === 'n' && p) nextIdle();
      else if (k === 'r' && p) panel.value = panel.value === 'report' ? null : 'report';
      else if (k === 'p' && p) panel.value = panel.value === 'empire' ? null : 'empire';
      else if (k === 't' && p) panel.value = panel.value === 'research' ? null : 'research';
      else if (k === 'm' && p && selectedShip.value !== null)
        targeting.value = { ship: selectedShip.value, blind: false, to: null };
      else if (k === 'v' && selected.value) insideSystem.value = insideSystem.value ? null : selected.value;
      else if (k === 'Escape') {
        if (targeting.value) targeting.value = null;
        else if (panel.value) panel.value = null;
        else if (insideColony.value !== null) insideColony.value = null;
        else if (insideSystem.value) insideSystem.value = null;
        else select(null);
      } else handled = false;
      if (handled) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, select, endTurn, nextIdle, home]);

  const onSheetHeight = useCallback(
    (px: number) => {
      sheetHeight.current = px;
      updateStage();
    },
    [updateStage],
  );

  const current = selected.value;
  const ship = selectedShip.value === null ? undefined : game.ships.find((s) => s.id === selectedShip.value);
  const holding =
    selectedHolding.value === null ? undefined : game.holdings.find((h) => h.id === selectedHolding.value);
  const date = formatDate(game.turn);
  const modeNow = mode.value ?? (desktop ? '3d' : 'flat');
  const power = play ? powerOf(game, play.faction) : undefined;
  const shipsAt = (id: SystemId) =>
    play
      ? game.ships
          .filter((s) => s.owner === play.faction && s.at === id)
          .map((s: ShipState) => ({
            id: s.id,
            name: s.name,
            kind: SHIPS[s.type].name,
            status: shipStatus(world, game, s),
          }))
      : undefined;
  const systemView = (id: SystemId) => (
    <SystemView
      key={id}
      world={world}
      game={game}
      id={id}
      onGo={go}
      onCentre={
        insideSystem.value === id
          ? undefined
          : () => {
              view.current?.focus(id);
            }
      }
      onEnter={insideSystem.value === id ? undefined : () => (insideSystem.value = id)}
      body={selectedBody.value}
      onBodyChange={(b) => {
        selectedBody.value = b;
        sceneRef.current?.setSelected(b);
        if (b) sceneRef.current?.focus(b);
      }}
      surveyed={power ? hasSurveyed(power, id) : true}
      species={play ? speciesFor(game, play.faction) : undefined}
      anomaly={(() => {
        const a = power && hasSurveyed(power, id) ? anomalyAt(game.seed, id) : null;
        if (!a || !power) return undefined;
        const done = power.investigated.includes(id);
        return { name: ANOMALIES[a].name, text: done ? ANOMALIES[a].found : ANOMALIES[a].seen, investigated: done };
      })()}
      ships={shipsAt(id)}
      onShip={pickShip}
      holdings={game.holdings
        .filter((h) => h.system === id)
        .map((h) => ({
          id: h.id,
          name: holdingName(world, game, h),
          kind: holdingKind(h),
          owner: h.owner,
          body: h.body,
          line: h.kind === 'colony' ? `${millions(h.people)} million people` : 'gathers its world’s riches',
          mine: play?.faction === h.owner,
        }))}
      onHolding={pickHolding}
      onViewHolding={viewColony}
    />
  );
  const holdingView = (h: NonNullable<typeof holding>) => (
    <HoldingPanel
      key={h.id}
      world={world}
      game={game}
      holding={h}
      play={play}
      table={desktop}
      onGo={go}
      viewing={colony === h.id}
      onView={() => {
        insideColony.value = h.id;
      }}
    />
  );
  const research = play && <ResearchView game={game} faction={play.faction} play={play} table={desktop} />;
  const empire = play && (
    <EmpireView
      world={world}
      game={game}
      faction={play.faction}
      table={desktop}
      onHolding={pickHolding}
      onView={viewColony}
      shipsList={<ShipsList world={world} game={game} faction={play.faction} onPick={pickShip} />}
    />
  );
  const shipView = (s: ShipState) => play && <ShipPanel world={world} game={game} ship={s} play={play} onGo={go} />;
  const report = play && (
    <ReportView
      world={world}
      game={game}
      faction={play.faction}
      needs={play.needs.length}
      onGo={go}
      onHolding={pickHolding}
      onResearch={openResearch}
      onViewColony={viewColony}
    />
  );
  const keys = play ? [...PLAY_SHORTCUTS, ...SHORTCUTS] : SHORTCUTS;
  const endLabel = play?.resolving ? 'Ending…' : 'End turn';

  return (
    <div ref={root} class={`map-screen layout-${layout.value}${play ? ' is-playing' : ''}`}>
      <div ref={host} class="map-host" data-testid="map">
        {veil && <div key={veil.n} class={`map-veil veil-${veil.kind}`} aria-hidden="true" />}
        {colonyHolding && (
          <div class="system-bar colony-bar" style={{ top: desktop ? '12px' : `${topHeight + 8}px` }} data-keep-clear>
            <button type="button" class="chip system-exit" onClick={() => (insideColony.value = null)}>
              ← {world.system(colonyHolding.system).name}
            </button>
            <span class="system-scale">
              {holdingName(world, game, colonyHolding)}{' '}
              <span class="badge badge-fiction" title="Painted with the game’s art pipeline and laid out by the game">
                Illustration
              </span>
            </span>
          </div>
        )}
        {colonyHolding && picked && (
          <div class="colony-card-place" style={{ top: desktop ? '70px' : `${topHeight + 66}px` }}>
            <ColonyCard
              world={world}
              game={game}
              holding={colonyHolding}
              building={picked}
              homes={stillScene(world, game, colonyHolding)?.buildings.filter((b) => b.kind === 'homes').length ?? 0}
              onClose={() => {
                setPicked(null);
                colonyRef.current?.setSelected(null);
              }}
            />
          </div>
        )}
        {insideSystem.value && (
          <div class="system-bar" style={{ top: desktop ? '12px' : `${topHeight + 8}px` }} data-keep-clear>
            <button type="button" class="chip system-exit" onClick={() => (insideSystem.value = null)}>
              ← Neighbourhood
            </button>
            <span class="system-scale">
              {world.system(insideSystem.value).name} · not to scale <Badge kind="estimated" />
            </span>
          </div>
        )}
        {failed.value && (
          <div class="map-failed">
            <p>This browser cannot draw the map ({failed.value}).</p>
            <p>
              <a href="#/codex">Open the systems as a list</a> instead.
            </p>
          </div>
        )}
        {desktop && hover.value && hover.value.id !== current && (
          <HoverCard world={world} game={game} at={hover.value} ship={play ? ship : undefined} />
        )}
        {desktop && colony === null && (
          <p class="map-credit" data-keep-clear>
            Stars: Gaia DR3 and SIMBAD, as copied from Starman Reborn · Lanes and powers: fiction · Build {buildId}
          </p>
        )}
        {desktop && play && panel.value === 'report' && (
          <div class="popover report-popover" role="dialog" aria-label="Report" data-keep-clear>
            {report}
            <button type="button" class="button button-quiet button-small" onClick={() => (panel.value = null)}>
              Close
            </button>
          </div>
        )}
        {desktop && play && panel.value === 'empire' && (
          <div class="popover empire-popover" role="dialog" aria-label="Empire" data-keep-clear>
            {empire}
            <button type="button" class="button button-quiet button-small" onClick={() => (panel.value = null)}>
              Close
            </button>
          </div>
        )}
        {desktop && play && <TargetBar world={world} game={game} play={play} />}
      </div>

      <header ref={top} class="map-top" data-covers-map>
        {(desktop || !play) && (
          <a class="brand" href="#/" aria-label="Starman Control: back to the title">
            Starman <span>Control</span>
          </a>
        )}
        <span class="map-date" title="A turn is three months">
          {date}
        </span>
        {play && <Resources world={world} game={game} faction={play.faction} />}
        {desktop ? (
          <>
            <SearchBox world={world} onPick={go} />
            {!insideSystem.value && colony === null && <ViewToggle mode={modeNow} onChange={setMode} />}
            {!play && (
              <>
                <button
                  type="button"
                  class="chip"
                  title="Legend"
                  onClick={() => (panel.value = panel.value === 'legend' ? null : 'legend')}
                >
                  <Icon name="legend" />
                  <span class="chip-word">Legend</span>
                </button>
                <a class="chip" href="#/codex" title="Codex">
                  <Icon name="codex" />
                  <span class="chip-word">Codex</span>
                </a>
              </>
            )}
            <button
              type="button"
              class="chip"
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
              onClick={() => (panel.value = panel.value === 'keys' ? null : 'keys')}
            >
              <Icon name="keys" />
            </button>
            {play && (
              <>
                <button
                  type="button"
                  class="chip"
                  aria-pressed={panel.value === 'empire'}
                  title="Empire (P)"
                  onClick={() => (panel.value = panel.value === 'empire' ? null : 'empire')}
                >
                  <Icon name="empire" />
                  <span class="chip-word">Empire</span>
                </button>
                <button
                  type="button"
                  class="chip"
                  aria-pressed={panel.value === 'research'}
                  title="Research (T)"
                  onClick={() => (panel.value = panel.value === 'research' ? null : 'research')}
                >
                  <Icon name="research" />
                  <span class="chip-word">Research</span>
                </button>
                <button
                  type="button"
                  class="chip"
                  aria-pressed={panel.value === 'menu'}
                  title="Menu"
                  onClick={() => (panel.value = panel.value === 'menu' ? null : 'menu')}
                >
                  <Icon name="menu" />
                  <span class="chip-word">Menu</span>
                </button>
                <button
                  type="button"
                  class="button button-primary end-turn"
                  disabled={play.resolving}
                  onClick={() => void endTurn()}
                >
                  <Icon name="end-turn" />
                  {endLabel}
                  {play.needs.length > 0 && <span class="needs-count-badge">{play.needs.length}</span>}
                </button>
              </>
            )}
          </>
        ) : play ? (
          <button
            type="button"
            class="chip menu-chip"
            onClick={() => (panel.value = panel.value === 'menu' ? null : 'menu')}
          >
            <Icon name="menu" />
            Menu
          </button>
        ) : (
          <>
            <a class="chip" href="#/codex">
              Codex
            </a>
            <a class="chip" href="#/" aria-label="Back to the title">
              Title
            </a>
          </>
        )}
      </header>

      {desktop &&
        (play ? (
          <PlayOutliner
            world={world}
            game={game}
            play={play}
            onShip={pickShip}
            onHolding={pickHolding}
            onNeed={onNeed}
            onGo={go}
          />
        ) : (
          <Outliner world={world} game={game} onGo={go} />
        ))}

      {desktop && (
        <aside
          class="map-inspector"
          aria-label={ship ? 'Selected ship' : holding ? 'Selected colony' : 'Selected system'}
        >
          {ship ? (
            shipView(ship)
          ) : holding ? (
            holdingView(holding)
          ) : current ? (
            systemView(current)
          ) : (
            <div class="inspector-hint">
              <h2>{play ? `The ${FACTIONS[play.faction].name}` : 'The neighbourhood'}</h2>
              {play ? (
                <p>
                  Choose a ship on the left, or a star. With a ship chosen, the route follows the pointer: right-click a
                  star to send it. Press Enter to end the turn, ? for every key.
                </p>
              ) : (
                <>
                  <p>
                    {world.systems.length} real star systems within 27 light-years of the Sun, and the old lanes between
                    them. Click a star to see what astronomers know of it; double-click to centre it.
                  </p>
                  <p class="dim">
                    Drag to turn the map, Shift-drag or the right button to move it, the wheel to zoom. Press ? for
                    every key.
                  </p>
                </>
              )}
            </div>
          )}
        </aside>
      )}

      {desktop && play && panel.value === 'research' && (
        <div class="research-overlay" role="dialog" aria-label="Research">
          <button
            type="button"
            class="button button-quiet button-small research-close"
            onClick={() => (panel.value = null)}
          >
            Close
          </button>
          {research}
        </div>
      )}
      {desktop && play && panel.value === 'menu' && (
        <div class="popover menu-popover" role="dialog" aria-label="Menu">
          <nav class="menu-list">
            <button type="button" class="button" onClick={() => void play.leave()}>
              Save and leave
            </button>
            <button type="button" class="button button-quiet" onClick={() => (panel.value = 'legend')}>
              Legend
            </button>
            <a class="button button-quiet" href="#/saves">
              Saves
            </a>
            <a class="button button-quiet" href="#/settings">
              Settings
            </a>
            <a class="button button-quiet" href="#/codex">
              Codex
            </a>
            <button type="button" class="button button-quiet" onClick={() => (panel.value = 'keys')}>
              Keys
            </button>
          </nav>
        </div>
      )}
      {desktop && panel.value === 'legend' && (
        <div class="popover legend-popover" role="dialog" aria-label="Legend">
          <Legend />
        </div>
      )}
      {panel.value === 'keys' && (
        <div class="popover keys-popover" role="dialog" aria-label="Keyboard shortcuts">
          <h2>Keys</h2>
          <dl class="keys">
            {keys.map(([key, what]) => (
              <Fragment key={key}>
                <dt>{key}</dt>
                <dd>{what}</dd>
              </Fragment>
            ))}
          </dl>
        </div>
      )}

      {!desktop && (
        <nav ref={bar} class="map-bottom" aria-label="Map" data-covers-map>
          {play ? (
            <>
              <button
                type="button"
                class="bar-button"
                onClick={() => (panel.value = panel.value === 'report' ? null : 'report')}
              >
                <Icon name="report" />
                Report
              </button>
              <button
                type="button"
                class="bar-button"
                onClick={() => (panel.value = panel.value === 'empire' ? null : 'empire')}
              >
                <Icon name="empire" />
                Empire
              </button>
              <button
                type="button"
                class="bar-button"
                onClick={() => (panel.value = panel.value === 'research' ? null : 'research')}
              >
                <Icon name="research" />
                Research
              </button>
              <button type="button" class="bar-button bar-primary" disabled={play.resolving} onClick={askEndTurn}>
                <Icon name="end-turn" />
                {endLabel}
                {play.needs.length > 0 && <span class="needs-count-badge">{play.needs.length}</span>}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                class="bar-button"
                onClick={() => (panel.value = panel.value === 'search' ? null : 'search')}
              >
                <Icon name="find" />
                Find
              </button>
              <ViewToggle mode={modeNow} onChange={setMode} />
              <button type="button" class="bar-button" onClick={() => go('sol')}>
                <Icon name="sol" />
                Sol
              </button>
              <button
                type="button"
                class="bar-button"
                onClick={() => (panel.value = panel.value === 'legend' ? null : 'legend')}
              >
                <Icon name="legend" />
                Legend
              </button>
            </>
          )}
        </nav>
      )}

      {!desktop && panel.value === 'search' && (
        <div class="search-panel" data-covers-map>
          <SearchBox world={world} onPick={go} autoFocus />
        </div>
      )}

      {!desktop && play && <TargetBar world={world} game={game} play={play} />}

      {!desktop && play && !insideSystem.value && colony === null && (
        <div class="map-view-switch" style={{ top: `${topHeight + 8}px` }} data-keep-clear>
          <ViewToggle mode={modeNow} onChange={setMode} />
        </div>
      )}

      {!desktop &&
        !targeting.value &&
        (() => {
          const sheet = (label: string, body: ComponentChildren, onClose: () => void, key: string) => (
            <Sheet
              key={key}
              label={label}
              onClose={onClose}
              onHeight={onSheetHeight}
              bottomInset={barHeight}
              topInset={topHeight}
              side={sideSheets.value}
            >
              {body}
            </Sheet>
          );
          const close = () => (panel.value = null);
          if (play && panel.value === 'needs')
            return (
              <NeedsStack
                world={world}
                game={game}
                needs={play.needs}
                onNeed={onNeed}
                onEnd={() => void endTurn()}
                onClose={close}
              />
            );
          if (play && panel.value === 'report') return sheet('Report', report, close, 'report');
          if (play && panel.value === 'empire') return sheet('Empire', empire, close, 'empire');
          if (play && panel.value === 'research') return sheet('Research', research, close, 'research');
          if (play && panel.value === 'menu')
            return sheet(
              'Menu',
              <nav class="menu-list">
                <button type="button" class="button" onClick={() => void play.leave()}>
                  Save and leave
                </button>
                <button type="button" class="button button-quiet" onClick={() => (panel.value = 'search')}>
                  Find a system
                </button>
                <button type="button" class="button button-quiet" onClick={() => (panel.value = 'legend')}>
                  Legend
                </button>
                <a class="button button-quiet" href="#/saves">
                  Saves
                </a>
                <a class="button button-quiet" href="#/settings">
                  Settings
                </a>
                <a class="button button-quiet" href="#/codex">
                  Codex
                </a>
              </nav>,
              close,
              'menu',
            );
          if (panel.value === 'legend') return sheet('Legend', <Legend />, close, 'legend');
          if (ship) return sheet(ship.name, shipView(ship), () => (selectedShip.value = null), `ship-${ship.id}`);
          if (holding)
            return sheet(
              holdingName(world, game, holding),
              holdingView(holding),
              () => (selectedHolding.value = null),
              `holding-${holding.id}${colony === holding.id ? '-scene' : ''}`,
            );
          if (current) return sheet(world.system(current).name, systemView(current), () => select(null), current);
          return null;
        })()}

      {sweep !== null && (
        <div key={sweep} class="turn-sweep" aria-hidden="true">
          <span class="turn-sweep-date">{formatDate(sweep)}</span>
        </div>
      )}
      {toast.value && (
        <p class="toast" role="status">
          {toast.value}
        </p>
      )}
    </div>
  );
}

function ViewToggle({ mode: m, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <fieldset class="view-toggle">
      <legend class="visually-hidden">View</legend>
      <button type="button" class="toggle-option" aria-pressed={m === 'flat'} onClick={() => onChange('flat')}>
        <Icon name="flat" size={16} />
        Flat
      </button>
      <button type="button" class="toggle-option" aria-pressed={m === '3d'} onClick={() => onChange('3d')}>
        <Icon name="3d" size={16} />
        3D
      </button>
    </fieldset>
  );
}

function SearchBox({
  world,
  onPick,
  autoFocus,
}: {
  world: World;
  onPick: (id: SystemId) => void;
  autoFocus?: boolean;
}) {
  const results = searchSystems(world, query.value);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);
  const pick = (id: SystemId) => {
    onPick(id);
    query.value = '';
    input.current?.blur();
  };
  return (
    <div class="search-box">
      <label>
        <span class="visually-hidden">Find a system</span>
        <input
          ref={input}
          id="map-search"
          type="search"
          autoComplete="off"
          placeholder="Find a system"
          value={query.value}
          onInput={(e) => {
            query.value = (e.target as HTMLInputElement).value;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) {
              e.stopPropagation();
              pick(results[0]);
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              document.querySelector<HTMLButtonElement>('.search-results .result')?.focus();
            }
          }}
        />
      </label>
      {results.length > 0 && (
        <ul class="search-results">
          {results.map((id) => {
            const s = world.system(id);
            return (
              <li key={id}>
                <button
                  type="button"
                  class="result"
                  onClick={() => pick(id)}
                  onKeyDown={(e) => {
                    const li = (e.currentTarget as HTMLElement).parentElement;
                    if (e.key === 'ArrowDown')
                      (li?.nextElementSibling?.querySelector('.result') as HTMLElement)?.focus();
                    if (e.key === 'ArrowUp')
                      ((li?.previousElementSibling?.querySelector('.result') as HTMLElement) ?? input.current)?.focus();
                  }}
                >
                  <b>{s.name}</b>
                  <span>
                    {formatLy(s.fromSolDeci)} · {starKindWord(s.sky.stars[0]?.spectralType ?? '')}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {query.value.trim() !== '' && results.length === 0 && <p class="search-none">No system by that name.</p>}
    </div>
  );
}

function Outliner({ world, game, onGo }: { world: World; game: GameState; onGo: (id: SystemId) => void }) {
  return (
    <aside class="outliner" aria-label="The powers">
      <h2>The powers</h2>
      {FACTION_IDS.filter((f) => game.powers.some((p) => p.faction === f)).map((f) => (
        <HomeWeb key={f} world={world} game={game} faction={f} onGo={onGo} />
      ))}
      <p class="dim">
        Each power’s home web: the lanes it kept tending through the Lapse <Badge kind="fiction" />
      </p>
    </aside>
  );
}

function HomeWeb({
  world,
  game,
  faction: f,
  onGo,
}: {
  world: World;
  game: GameState;
  faction: (typeof FACTION_IDS)[number];
  onGo: (id: SystemId) => void;
}) {
  const lanes = game.lanes.filter((l) => l.owner === f);
  const capital = powerOf(game, f).capital;
  const systems = [capital, ...new Set(lanes.flatMap((l) => l.id.split('~')).filter((s) => s !== capital))];
  return (
    <section class="outliner-power" style={{ '--faction': FACTIONS[f].colour }}>
      <h3>
        <FactionMark faction={f} size={13} /> {FACTIONS[f].name}
      </h3>
      <ul>
        {systems.map((id) => (
          <li key={id}>
            <button
              type="button"
              class={`outliner-item${selected.value === id && selectedShip.value === null ? ' is-selected' : ''}`}
              onClick={() => onGo(id)}
            >
              {world.system(id).name}
              {id === capital && <span class="capital"> capital</span>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PlayOutliner({
  world,
  game,
  play,
  onShip,
  onHolding,
  onNeed,
  onGo,
}: {
  world: World;
  game: GameState;
  play: Play;
  onShip: (id: number) => void;
  onHolding: (id: number) => void;
  onNeed: (n: Need) => void;
  onGo: (id: SystemId) => void;
}) {
  const colonies = game.holdings.filter((h) => h.owner === play.faction);
  return (
    <aside class="outliner" aria-label="Your power">
      <h2>Needs you</h2>
      {play.needs.length === 0 ? (
        <p class="dim">Nothing. End the turn when you are ready.</p>
      ) : (
        <ul class="needs-list">
          {play.needs.map((n) => (
            <li
              key={n.kind === 'idle-ship' ? `s${n.ship}` : n.kind === 'no-research' ? n.kind : `${n.kind}-${n.holding}`}
            >
              <button type="button" class="outliner-item" onClick={() => onNeed(n)}>
                {needText(world, game, n)}
              </button>
            </li>
          ))}
        </ul>
      )}
      <h2>Colonies and outposts</h2>
      <ul class="needs-list">
        {colonies.map((h) => (
          <li key={h.id}>
            <button
              type="button"
              class={`outliner-item${selectedHolding.value === h.id ? ' is-selected' : ''}`}
              onClick={() => onHolding(h.id)}
            >
              {holdingName(world, game, h)}
              <span class="capital">
                {' '}
                {h.kind === 'colony' ? `${millions(h.people)}M` : 'outpost'}
                {h.capital ? ' · capital' : ''}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <h2>Ships</h2>
      <ShipsList world={world} game={game} faction={play.faction} onPick={onShip} />
      <h2>Home</h2>
      <HomeWeb world={world} game={game} faction={play.faction} onGo={onGo} />
    </aside>
  );
}

function HoverCard({
  world,
  game,
  at,
  ship,
}: {
  world: World;
  game: GameState;
  at: { id: SystemId; x: number; y: number };
  ship?: ShipState;
}) {
  const s = world.system(at.id);
  const lanes = world.catalogueAt(at.id).length;
  const plan = ship ? planFor(world, game, ship, at.id, false) : null;
  return (
    <div class="hover-card" style={{ transform: `translate(${Math.round(at.x + 16)}px, ${Math.round(at.y + 12)}px)` }}>
      <b>{s.name}</b>
      <span>
        {s.id === 'sol' ? 'The Sun' : formatLy(s.fromSolDeci)} ·{' '}
        {s.sky.stars.length > 1 ? `${s.sky.stars.length} stars` : starKindWord(s.sky.stars[0]?.spectralType ?? '')}
      </span>
      <span>
        {s.sky.planets.length > 0 ? `${s.sky.planets.length} known planets` : 'No known planets'} · {lanes} old lane
        {lanes === 1 ? '' : 's'}
      </span>
      {plan && (
        <span class={plan.ok ? 'plan-ok' : 'plan-no'}>
          {plan.ok ? `${plan.text}. Right-click to send.` : plan.text}
        </span>
      )}
    </div>
  );
}

export function Legend() {
  return (
    <div class="legend">
      <h2>Legend</h2>
      <ul>
        <li>
          <span class="legend-line legend-open" aria-hidden="true" /> An open lane, in the colour of the power that
          tends it <Badge kind="fiction" />
        </li>
        <li>
          <span class="legend-line legend-tuning" aria-hidden="true" /> A lane being tuned, dotted in its power’s
          colour: paid for, and open in a few turns <Badge kind="fiction" />
        </li>
        <li>
          <span class="legend-line legend-dark" aria-hidden="true" /> A dark lane: one of the old lanes, out of tune
          since the Lapse, that can be relit <Badge kind="fiction" />
        </li>
        {FACTION_IDS.map((f) => (
          <li key={f}>
            <FactionMark faction={f} size={14} /> {FACTIONS[f].name}: its {FACTIONS[f].mark} marks the systems it holds;
            a larger one its capital
          </li>
        ))}
        <li>
          <span class="legend-chevron" aria-hidden="true" /> Ships, beside their star in their power’s colour; a bright
          amber line is the route being chosen, a faint one a ship’s orders, dashed for a blind jump
        </li>
        <li>
          <span class="legend-star" aria-hidden="true" /> A star, where astronomers measure it, coloured by its kind
          (red dwarfs red, the Sun yellow-white) <Badge kind="observed" />
        </li>
        <li>
          <span class="legend-ring" aria-hidden="true" /> Rings every 5 light-years from Sol, in the plane of the
          celestial equator; in 3D, a faint line drops from each star to that plane
        </li>
      </ul>
    </div>
  );
}
