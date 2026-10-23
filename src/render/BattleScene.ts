// The battle replay in 3D (docs/design/M4_FLEETS.md §25): a battle of the turn played back from its
// log, on the map's own WebGL renderer (the map pauses meanwhile, as for the system view). Each
// power's ships come from Reborn's kit (built once a power and shared by its ships), shots by their
// weapon's kind, shields flaring, ships breaking up, task forces leaving. Where everything is comes
// from the pure timeline (replayModel.ts); this file only draws it and keeps the clock.

import * as THREE from 'three';
import { FACTIONS, type FactionId } from '../content/factions.ts';
import type { DamageType, ShieldKind } from '../content/modules.ts';
import { createDefencePlatform, createDriftShip, createDuskShip } from './art/alienShips.ts';
import { createHaulerShip, createPirateShip, createPlayerShip, type ShipArt } from './art/ships.ts';
import { createStar, type StarArt } from './art/stars.ts';
import type { ArtContext } from './art/types.ts';
import { OrbitController } from './camera.ts';
import { GestureTracker } from './gestures.ts';
import { createLabelBox, type LabelBox, layoutLabels, pickNearestPoint } from './labels.ts';
import {
  createScreenPoint,
  fitOrbitDistance,
  orbitBasis,
  orbitDirection,
  projectPoint,
  type Rect,
  type ScreenPoint,
  type Vec3,
} from './mapMath.ts';
import { type BackgroundStars, createBackgroundStars, createSkyBackdrop, type SkyBackdrop } from './milkyWay.ts';
import {
  BAND_DISTANCE,
  BREAK_UP,
  type Frame,
  frameAt,
  IMPACT,
  type ReplayModel,
  SHIELD_COLOURS,
  SHOT_COLOURS,
} from './replayModel.ts';
import type { LayoutStar } from './systemLayout.ts';

const FOV = 40;
const MAX_POINTS = 6000;
const MAX_LINES = 3000;

/** What the controls need to know, at most ten times a second and at once on play, pause and seek. */
export interface ReplayTick {
  t: number;
  playing: boolean;
  speed: number;
  frame: Frame;
}

export interface BattleSceneEvents {
  tick(tick: ReplayTick): void;
  /** A ship chosen with a tap or a click, or none. */
  pick?(id: number | null): void;
}

export interface BattleSceneOptions {
  reducedMotion: boolean;
  quality: ArtContext['quality'];
  /** The map's Milky Way, lent. */
  sky?: THREE.CubeTexture;
  /** The system's chief star, drawn far off. */
  star?: LayoutStar;
}

/** Each power's ships (§25.1): Reborn's Kite, Hauler and raider for the human powers, and two of our own. */
const BUILDERS: Record<FactionId, (ctx: ArtContext) => ShipArt> = {
  sta: (ctx) => createPlayerShip(ctx, FACTIONS.sta.colour),
  frontier: createHaulerShip,
  'hollow-wake': createPirateShip,
  'dusk-concord': createDuskShip,
  'drift-moot': createDriftShip,
  // The heirs' ships are the Concord's long hulls until they have their own (M5_UNKNOWN.md §27).
  continuance: createDuskShip,
  // The Hearth's patched ships are haulers rebuilt for war (M5_UNKNOWN.md §25), until they have their own.
  'last-hearth': createHaulerShip,
};

const SHIELD_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;
const SHIELD_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uStrength;
varying vec3 vN;
varying vec3 vV;
void main() {
  float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
  gl_FragColor = vec4(uColor * (0.12 + 1.4 * f) * uStrength, 1.0);
}
`;
const POINT_VERT = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
uniform float uScale;
varying vec3 vColor;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(1.5, aSize * uScale / max(-mv.z, 1.0));
  vColor = aColor;
}
`;
const POINT_FRAG = /* glsl */ `
varying vec3 vColor;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = 1.0 - smoothstep(0.0, 1.0, d);
  gl_FragColor = vec4(vColor * a * a, 1.0);
}
`;

interface ShipThing {
  id: number;
  owner: FactionId;
  length: number;
  pivot: THREE.Group;
  body: THREE.Object3D;
  scale: number;
  ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  shield: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  bob: number;
  point: ScreenPoint;
}

interface ForceLabel {
  key: string;
  el: HTMLDivElement;
  box: LabelBox;
  point: ScreenPoint;
  pos: THREE.Vector3;
}

/** A small, steady number from a few whole numbers, in [0, 1). */
function hash(...n: number[]): number {
  let h = 2166136261;
  for (const x of n) {
    h ^= x | 0;
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

const rgb = (hex: string, k = 1): [number, number, number] => {
  const c = new THREE.Color(hex);
  return [c.r * k, c.g * k, c.b * k];
};

export class BattleScene {
  readonly controller: OrbitController;
  readonly model: ReplayModel;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly canvas: HTMLCanvasElement;
  private readonly container: HTMLElement;
  private readonly events: BattleSceneEvents;
  private readonly ctx: ArtContext;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(FOV, 1, 1, 20_000);
  private readonly gestures: GestureTracker;
  private readonly labelLayer: HTMLDivElement;
  private readonly templates = new Map<string, { art: ShipArt; native: number }>();
  private readonly ships = new Map<number, ShipThing>();
  private readonly labels: ForceLabel[] = [];
  private readonly star: StarArt | null = null;
  private readonly sky: { backdrop: SkyBackdrop; stars: BackgroundStars } | null = null;
  private readonly own: (THREE.Mesh | THREE.Points | THREE.LineSegments)[] = [];
  private readonly shieldGeometry = new THREE.SphereGeometry(1, 24, 16);
  private readonly ringGeometry = new THREE.RingGeometry(0.62, 0.72, 40);
  private readonly points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private readonly lines: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  private readonly viewProjection = new THREE.Matrix4();
  private readonly basis = new THREE.Matrix4();
  private readonly order: number[] = [];
  private readonly placed: number[] = [];
  private readonly detach: () => void;
  private readonly savedToneMapping: THREE.ToneMapping;
  private stage: Rect = { x: 0, y: 0, w: 1, h: 1 };
  private obstacles: Rect[] = [];
  private frame = 0;
  private lastTime = 0;
  /** Seconds of the scene's own life, for what moves on its own. */
  private life = 0;
  private lastTick = -1;
  private touched = false;
  private lastPointerType = 'mouse';
  private selected: number | null = null;
  private settling = true;
  private disposed = false;
  /** The replay's clock. */
  time = 0;
  playing = true;
  speed = 1;
  /** The frame drawn last, for tests. */
  current: Frame;

  constructor(
    renderer: THREE.WebGLRenderer,
    container: HTMLElement,
    model: ReplayModel,
    events: BattleSceneEvents,
    opts: BattleSceneOptions,
  ) {
    this.renderer = renderer;
    this.canvas = renderer.domElement;
    this.container = container;
    this.model = model;
    this.events = events;
    this.ctx = { quality: opts.quality, reducedMotion: opts.reducedMotion };
    this.savedToneMapping = renderer.toneMapping;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    if (opts.sky) {
      const backdrop = createSkyBackdrop(opts.sky, 0.5);
      const stars = createBackgroundStars({
        quality: opts.quality,
        dpr: renderer.getPixelRatio(),
        twinkle: false,
        brightness: 0.85,
      });
      this.scene.add(backdrop.mesh, stars.points);
      this.sky = { backdrop, stars };
    }
    // The system's star far off, and its light.
    const toStar = new THREE.Vector3(-0.4, 0.03, -1).normalize();
    const starColour = opts.star?.colour ?? '#fff4e0';
    if (opts.star) {
      const star = createStar(
        {
          radius: 160 * Math.max(0.5, Math.min(1.6, opts.star.radius / 3600)),
          color: opts.star.colour,
          kind: opts.star.kind,
          activity: opts.star.activity,
          seed: 7,
        },
        this.ctx,
      );
      star.object.position.copy(toStar).multiplyScalar(4200);
      this.scene.add(star.object);
      this.star = star;
    }
    const sun = new THREE.DirectionalLight(starColour, 2.4);
    sun.position.copy(toStar).multiplyScalar(1000);
    this.scene.add(sun, new THREE.HemisphereLight(0x8c9ac0, 0x0c0e16, 0.7), new THREE.AmbientLight(0x404858, 0.5));

    this.buildShips();
    // Shots, sparks, flashes and debris as glowing points; ion fire and reduced-motion shots as lines.
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_POINTS * 3), 3));
    pg.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(MAX_POINTS * 3), 3));
    pg.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(MAX_POINTS), 1));
    this.points = new THREE.Points(
      pg,
      new THREE.ShaderMaterial({
        uniforms: { uScale: { value: 500 } },
        vertexShader: POINT_VERT,
        fragmentShader: POINT_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.points.frustumCulled = false;
    this.points.renderOrder = 8;
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_LINES * 6), 3));
    lg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_LINES * 6), 3));
    this.lines = new THREE.LineSegments(
      lg,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.lines.frustumCulled = false;
    this.lines.renderOrder = 8;
    this.scene.add(this.points, this.lines);
    this.own.push(this.points, this.lines);

    this.labelLayer = document.createElement('div');
    this.labelLayer.className = 'map-labels battle-labels';
    this.labelLayer.setAttribute('aria-hidden', 'true');
    container.appendChild(this.labelLayer);
    this.buildLabels();

    // From behind the viewer's side, a little to one side and above.
    this.controller = new OrbitController(
      { target: [0, 0, 0], yaw: 0.5, pitch: 0.3, distance: 600 },
      { minDistance: 60, maxDistance: 2400, minPitch: -1.3, maxPitch: 1.4, maxTargetRadius: 400 },
    );
    this.controller.reducedMotion = opts.reducedMotion;
    this.gestures = new GestureTracker({
      rotate: (dx, dy) => {
        this.touched = true;
        this.controller.rotateByPixels(dx, dy);
        this.invalidate();
      },
      pan: (dx, dy) => {
        this.touched = true;
        this.controller.pan(dx, dy, this.height, FOV);
        this.invalidate();
      },
      zoom: (factor, x, y) => {
        this.touched = true;
        const c = this.centre();
        this.controller.zoomAt(factor, x - c.x, y - c.y, this.height, FOV);
        this.invalidate();
      },
      tap: (x, y) => this.choose(this.shipAt(x, y, this.lastPointerType)),
      doubleTap: (x, y, type) => this.choose(this.shipAt(x, y, type)),
    });
    this.detach = this.attachInput();
    this.current = frameAt(model, 0);
    container.dataset.replay = 'yes';
    this.invalidate();
  }

  // ---------------------------------------------------------------- building

  private get width(): number {
    return Math.max(1, this.canvas.clientWidth);
  }

  private get height(): number {
    return Math.max(1, this.canvas.clientHeight);
  }

  /** One model a power, built once; its ships are copies that share its geometry and materials. */
  private template(owner: FactionId, battery = false): { art: ShipArt; native: number } {
    const key = battery ? `battery-${owner}` : owner;
    const have = this.templates.get(key);
    if (have) return have;
    // A colony's battery is a gun platform in its power's colour (M4_FLEETS.md §26.7).
    const art = battery ? createDefencePlatform(this.ctx, FACTIONS[owner].colour) : BUILDERS[owner](this.ctx);
    art.setThrottle(0.55);
    const box = new THREE.Box3();
    art.object.updateMatrixWorld(true);
    art.object.traverse((o) => {
      if (o instanceof THREE.Mesh && o.name !== 'plumes' && o.name !== 'shield') {
        o.geometry.computeBoundingBox();
        if (o.geometry.boundingBox) box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
      }
    });
    const size = box.getSize(new THREE.Vector3());
    const t = { art, native: Math.max(1, size.z, size.x) };
    this.templates.set(key, t);
    return t;
  }

  private buildShips(): void {
    for (const s of this.model.ships) {
      const owner = s.ship.owner;
      const t = this.template(owner, s.ship.type === 'battery');
      const body = t.art.object.clone(true);
      body.getObjectByName('shield')?.removeFromParent();
      const scale = s.length / t.native;
      body.scale.setScalar(scale);
      const pivot = new THREE.Group();
      pivot.add(body);
      const ring = new THREE.Mesh(
        this.ringGeometry,
        new THREE.MeshBasicMaterial({
          color: FACTIONS[owner].colour,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -s.length * 0.28;
      ring.scale.setScalar(s.length * 1.05);
      pivot.add(ring);
      const shield = new THREE.Mesh(
        this.shieldGeometry,
        new THREE.ShaderMaterial({
          uniforms: {
            uColor: { value: new THREE.Color(SHIELD_COLOURS[s.ship.shieldKind as ShieldKind]) },
            uStrength: { value: 0 },
          },
          vertexShader: SHIELD_VERT,
          fragmentShader: SHIELD_FRAG,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      shield.scale.set(s.length * 0.58, s.length * 0.36, s.length * 0.62);
      shield.visible = false;
      shield.renderOrder = 7;
      pivot.add(shield);
      this.scene.add(pivot);
      this.own.push(ring, shield);
      this.ships.set(s.ship.id, {
        id: s.ship.id,
        owner,
        length: s.length,
        pivot,
        body,
        scale,
        ring,
        shield,
        bob: hash(s.ship.id, 3) * Math.PI * 2,
        point: createScreenPoint(),
      });
    }
  }

  private buildLabels(): void {
    const size = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    for (const f of this.model.forces) {
      const el = document.createElement('div');
      el.className = 'map-label battle-label';
      const text = f.name === 'ships sailing alone' ? 'Ships sailing alone' : f.name;
      el.textContent = text;
      el.dataset.force = f.key;
      el.style.setProperty('--held', FACTIONS[f.owner].colour);
      el.hidden = true;
      this.labelLayer.appendChild(el);
      const box = createLabelBox();
      box.height = Math.round(size * 0.8125 * 1.385);
      box.width = Math.round(text.length * size * 0.44 + 12);
      this.labels.push({ key: f.key, el, box, point: createScreenPoint(), pos: new THREE.Vector3() });
    }
  }

  // ---------------------------------------------------------------- the clock

  /** Plays from where it is; at the end, from the start. */
  play(): void {
    if (this.time >= this.model.duration) this.time = 0;
    this.playing = true;
    this.tickNow();
  }

  pause(): void {
    this.playing = false;
    this.tickNow();
  }

  seek(t: number): void {
    this.time = Math.max(0, Math.min(this.model.duration, t));
    this.tickNow();
  }

  setSpeed(speed: number): void {
    this.speed = speed;
    this.tickNow();
  }

  /** Straight to the end, with the result (§25.3). */
  skip(): void {
    this.playing = false;
    this.seek(this.model.duration);
  }

  private tickNow(): void {
    this.lastTick = -1;
    this.invalidate();
  }

  // ---------------------------------------------------------------- the camera

  /** Far enough back to see every ship as the battle opens, within the stage. */
  private fitDistance(): number {
    const pts: Vec3[] = frameAt(this.model, 0).ships.map((s) => s.pos);
    if (pts.length === 0) pts.push([BAND_DISTANCE[2], 0, 0], [-BAND_DISTANCE[2], 0, 0]);
    const s = this.controller.current;
    return fitOrbitDistance(
      pts,
      [0, 0, 0],
      s.yaw,
      s.pitch,
      FOV,
      this.stage.w,
      this.stage.h,
      this.height,
      40,
      120,
      2400,
    );
  }

  private centre(): { x: number; y: number } {
    return { x: this.stage.x + this.stage.w / 2, y: this.stage.y + this.stage.h / 2 };
  }

  /** The part of the canvas not covered by the replay's bars and panel, and what labels must avoid. */
  setStage(stage: Rect, obstacles: Rect[] = []): void {
    const first = this.stage.w <= 1;
    this.stage = stage;
    this.obstacles = obstacles;
    if (first) {
      // Upright, look down more steeply, so the sides spread up the screen rather than across it.
      const upright = stage.w < stage.h;
      const yaw = upright ? 0.1 : 0.5;
      const pitch = upright ? 0.8 : 0.3;
      this.controller.jumpTo({ ...this.controller.current, yaw, pitch });
      this.controller.jumpTo({ ...this.controller.current, distance: this.fitDistance() });
    }
    this.invalidate();
  }

  /** Back to the whole battle. */
  showAll(): void {
    this.controller.transitionTo({ target: [0, 0, 0], distance: this.fitDistance() });
    this.invalidate();
  }

  setSelected(id: number | null): void {
    this.selected = id;
    this.invalidate();
  }

  private choose(id: number | null): void {
    this.selected = id;
    this.events.pick?.(id);
    this.invalidate();
  }

  /** True while anything is still moving, for tests. */
  get moving(): boolean {
    return this.playing || this.settling;
  }

  // ---------------------------------------------------------------- drawing

  invalidate(): void {
    if (!this.frame && !this.disposed) this.frame = requestAnimationFrame((t) => this.draw(t));
  }

  private draw(now: number): void {
    this.frame = 0;
    const dt = this.lastTime ? Math.min(0.1, (now - this.lastTime) / 1000) : 1 / 60;
    this.lastTime = now;
    const calm = this.ctx.reducedMotion;
    if (!calm) this.life += dt;
    if (this.playing) {
      this.time = Math.min(this.model.duration, this.time + dt * this.speed);
      if (this.time >= this.model.duration) {
        this.playing = false;
        this.lastTick = -1;
      }
    }
    // The camera turns slowly round the battle until the player turns it (§25.3).
    if (!calm && !this.touched) {
      this.controller.current.yaw += dt * 0.025;
      this.controller.goal.yaw += dt * 0.025;
    }
    const f = frameAt(this.model, this.time);
    this.current = f;
    this.placeShips(f);
    this.drawEffects(f);
    for (const t of this.templates.values()) t.art.update?.(dt, this.life, this.camera);
    this.star?.update?.(dt, this.life, this.camera);
    const moving = this.controller.update(dt);
    this.settling = moving;
    this.updateCamera();
    this.sky?.backdrop.update(this.camera, FOV, this.camera.aspect);
    this.sky?.stars.update(this.camera, this.life, FOV, this.camera.aspect);
    this.points.material.uniforms.uScale.value =
      this.renderer.getDrawingBufferSize(new THREE.Vector2()).y / (2 * Math.tan((FOV * Math.PI) / 360));
    this.renderer.render(this.scene, this.camera);
    this.layoutLabels(f);
    this.container.dataset.ready = '1';
    if (this.lastTick < 0 || now - this.lastTick > 100) {
      this.lastTick = now;
      this.events.tick({ t: this.time, playing: this.playing, speed: this.speed, frame: f });
    }
    if (this.playing || moving || !calm) this.invalidate();
  }

  private placeShips(f: Frame): void {
    const calm = this.ctx.reducedMotion;
    for (const sf of f.ships) {
      const th = this.ships.get(sf.id);
      const ship = this.model.byShip.get(sf.id);
      if (!th || !ship) continue;
      const shown =
        sf.status === 'fighting' ||
        (sf.status === 'leaving' && sf.phase < 0.95) ||
        (sf.status === 'breaking' && sf.phase < 0.3);
      th.pivot.visible = shown;
      if (!shown) continue;
      const bob = calm ? 0 : Math.sin(this.life * 0.8 + th.bob) * 0.8;
      th.pivot.position.set(sf.pos[0], sf.pos[1] + bob, sf.pos[2]);
      // Ships face −Z: turn the bow along the heading.
      th.pivot.rotation.y = Math.atan2(-Math.cos(sf.heading), -Math.sin(sf.heading));
      if (sf.status === 'breaking') {
        const p = sf.phase;
        th.body.rotation.set(p * 2.2, 0, p * 3.6);
        th.body.scale.setScalar(th.scale * (1 - p));
      } else {
        th.body.rotation.set(0, 0, 0);
        th.body.scale.setScalar(th.scale);
      }
      const whole = Math.max(1, ship.ship.structureMax);
      th.ring.visible = sf.status !== 'breaking';
      th.ring.material.opacity =
        th.id === this.selected ? 1 : 0.18 + 0.4 * (sf.structure / whole) * (sf.status === 'leaving' ? 0.5 : 1);
      th.ring.scale.setScalar(th.length * (th.id === this.selected ? 1.3 : 1.05));
      const since = sf.shieldHit === null ? 99 : f.t - sf.shieldHit;
      const strength = since >= 0 && since < 1 ? Math.exp(-since * 4) * (calm ? 0.5 : 1) : 0;
      th.shield.visible = strength > 0.01;
      th.shield.material.uniforms.uStrength.value = strength;
    }
  }

  /** Shots in flight, impacts, ships breaking up and jumping out (§25.1). */
  private drawEffects(f: Frame): void {
    const pos = this.points.geometry.attributes.position as THREE.BufferAttribute;
    const col = this.points.geometry.attributes.aColor as THREE.BufferAttribute;
    const size = this.points.geometry.attributes.aSize as THREE.BufferAttribute;
    const lpos = this.lines.geometry.attributes.position as THREE.BufferAttribute;
    const lcol = this.lines.geometry.attributes.color as THREE.BufferAttribute;
    const P = pos.array as Float32Array;
    const C = col.array as Float32Array;
    const S = size.array as Float32Array;
    const LP = lpos.array as Float32Array;
    const LC = lcol.array as Float32Array;
    let n = 0;
    let m = 0;
    const point = (x: number, y: number, z: number, s: number, c: readonly number[], k: number) => {
      if (n >= MAX_POINTS || k <= 0.002) return;
      P[n * 3] = x;
      P[n * 3 + 1] = y;
      P[n * 3 + 2] = z;
      C[n * 3] = (c[0] ?? 0) * k;
      C[n * 3 + 1] = (c[1] ?? 0) * k;
      C[n * 3 + 2] = (c[2] ?? 0) * k;
      S[n] = s;
      n++;
    };
    const line = (a: readonly number[], b: readonly number[], c: readonly number[], k: number) => {
      if (m >= MAX_LINES || k <= 0.002) return;
      for (let i = 0; i < 3; i++) {
        LP[m * 6 + i] = a[i] ?? 0;
        LP[m * 6 + 3 + i] = b[i] ?? 0;
        LC[m * 6 + i] = (c[i] ?? 0) * k;
        LC[m * 6 + 3 + i] = (c[i] ?? 0) * k;
      }
      m++;
    };
    const calm = this.ctx.reducedMotion;
    const lerp = (a: readonly number[], b: readonly number[], u: number) => [
      (a[0] ?? 0) + ((b[0] ?? 0) - (a[0] ?? 0)) * u,
      (a[1] ?? 0) + ((b[1] ?? 0) - (a[1] ?? 0)) * u,
      (a[2] ?? 0) + ((b[2] ?? 0) - (a[2] ?? 0)) * u,
    ];
    for (const s of f.shots) {
      const type: DamageType = s.shot.type;
      const c = SHOT_RGB[type];
      const flight = s.shot.lands - s.shot.fired;
      const u = s.progress <= 1 ? s.progress : 1 + s.since / flight;
      const fade = s.progress <= 1 ? 1 : Math.max(0, 1 - s.since / IMPACT);
      if (calm) {
        // With reduced motion, a short line that appears and fades, not a bolt that travels.
        line(s.from, s.to, c, 0.7 * fade);
      } else if (type === 'ion') {
        if (s.progress <= 1 || s.since < 0.12) {
          // A crackle from the gun to the target, its kinks changing as it flickers.
          const flick = Math.floor(this.life * 24);
          let a: number[] = [...s.from];
          for (let k = 1; k <= 5; k++) {
            const b = k === 5 ? [...s.to] : lerp(s.from, s.to, k / 5);
            if (k < 5) for (let i = 0; i < 3; i++) b[i] = (b[i] ?? 0) + (hash(s.shot.index, k, i, flick) - 0.5) * 6;
            line(a, b, c, 0.9);
            a = b;
          }
        }
      } else if (s.progress <= 1 || !s.shot.hit) {
        const look = BOLT[type];
        for (let k = 0; k < look.trail; k++) {
          const p = lerp(s.from, s.to, u - k * look.gap);
          point(
            p[0] ?? 0,
            p[1] ?? 0,
            p[2] ?? 0,
            look.size * (1 - k / (look.trail + 1)),
            c,
            fade * (1 - k / look.trail),
          );
        }
      }
      // A hit: a flash where it lands, and sparks off the structure.
      if (s.shot.hit && s.progress > 1 && s.since < IMPACT) {
        const k = 1 - s.since / IMPACT;
        const [x, y, z] = s.to;
        point(x, y, z, (s.shot.hull > 0 ? 12 : 8) * k, s.shot.hull > 0 ? SPARK : c, k);
        if (s.shot.hull > 0 && !calm)
          for (let j = 0; j < 6; j++) {
            const d = [hash(s.shot.index, j, 1) - 0.5, hash(s.shot.index, j, 2) - 0.5, hash(s.shot.index, j, 3) - 0.5];
            const v = 40 * s.since;
            point(x + (d[0] ?? 0) * v, y + (d[1] ?? 0) * v, z + (d[2] ?? 0) * v, 2.6, SPARK, k);
          }
      }
    }
    for (const sf of f.ships) {
      const th = this.ships.get(sf.id);
      if (!th) continue;
      const [x, y, z] = sf.pos;
      if (sf.status === 'breaking') {
        const p = sf.phase;
        // The flash, then debris drifting out and fading.
        if (p < 0.35) point(x, y, z, th.length * 3.2 * (calm ? 0.5 : 1) * (1 - p / 0.35), BLAST, 1 - p / 0.35);
        const pieces = calm ? 10 : 26;
        for (let j = 0; j < pieces; j++) {
          const d = [hash(sf.id, j, 4) - 0.5, (hash(sf.id, j, 5) - 0.5) * 0.6, hash(sf.id, j, 6) - 0.5];
          const v = (6 + 22 * hash(sf.id, j, 7)) * p * BREAK_UP;
          const hot = j < pieces / 3;
          point(
            x + (d[0] ?? 0) * v,
            y + (d[1] ?? 0) * v,
            z + (d[2] ?? 0) * v,
            hot ? 3.4 : 2.4,
            hot ? BLAST : DEBRIS,
            (1 - p) * (hot ? 1 - p : 1),
          );
        }
      } else if (sf.status === 'leaving' && sf.phase > 0.85) {
        // Jumping out: a brief flash.
        const k = 1 - Math.abs(sf.phase - 0.95) / 0.1;
        point(x, y, z, th.length * 1.6 * k, JUMP, k);
      }
    }
    this.points.geometry.setDrawRange(0, n);
    this.lines.geometry.setDrawRange(0, m * 2);
    pos.needsUpdate = true;
    col.needsUpdate = true;
    size.needsUpdate = true;
    lpos.needsUpdate = true;
    lcol.needsUpdate = true;
  }

  private updateCamera(): void {
    const s = this.controller.current;
    const r: Vec3 = [0, 0, 0];
    const u: Vec3 = [0, 0, 0];
    const d: Vec3 = [0, 0, 0];
    orbitBasis(s.yaw, s.pitch, r, u);
    orbitDirection(s.yaw, s.pitch, d);
    this.basis.makeBasis(new THREE.Vector3(...r), new THREE.Vector3(...u), new THREE.Vector3(...d));
    const c = this.centre();
    const cam = this.camera;
    cam.aspect = this.width / this.height;
    cam.position.set(s.target[0] + d[0] * s.distance, s.target[1] + d[1] * s.distance, s.target[2] + d[2] * s.distance);
    cam.quaternion.setFromRotationMatrix(this.basis);
    cam.setViewOffset(
      this.width,
      this.height,
      -(c.x - this.width / 2),
      -(c.y - this.height / 2),
      this.width,
      this.height,
    );
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld(true);
    this.viewProjection.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  }

  /** Each task force's name over it, and where each ship is on screen for a tap. */
  private layoutLabels(f: Frame): void {
    const m = this.viewProjection.elements;
    const w = this.width;
    const h = this.height;
    for (const th of this.ships.values()) {
      const p = th.pivot.position;
      projectPoint(m, p.x, p.y, p.z, w, h, th.point);
      if (!th.pivot.visible) th.point.visible = false;
    }
    for (const l of this.labels) {
      let count = 0;
      l.pos.set(0, 0, 0);
      for (const sf of f.ships) {
        const s = this.model.byShip.get(sf.id);
        if (s?.ship.force !== l.key || (sf.status !== 'fighting' && sf.status !== 'leaving')) continue;
        l.pos.x += sf.pos[0];
        l.pos.y += sf.pos[1];
        l.pos.z += sf.pos[2];
        count++;
      }
      if (count > 0) l.pos.divideScalar(count);
      l.pos.y += 16;
      projectPoint(m, l.pos.x, l.pos.y, l.pos.z, w, h, l.point);
      const inside =
        count > 0 && l.point.visible && l.point.x >= 0 && l.point.y >= 0 && l.point.x <= w && l.point.y <= h;
      l.box.anchorX = l.point.x;
      l.box.anchorY = l.point.y;
      l.box.active = inside;
      l.box.gap = 6;
      l.box.priority = 100;
    }
    layoutLabels(
      this.labels.map((l) => l.box),
      { x: 4, y: 4, w: w - 8, h: h - 8 },
      this.obstacles,
      this.order,
      this.placed,
    );
    for (const l of this.labels) {
      l.el.hidden = !l.box.visible;
      if (l.box.visible) l.el.style.transform = `translate(${Math.round(l.box.x)}px, ${Math.round(l.box.y)}px)`;
    }
  }

  // ---------------------------------------------------------------- input

  /** The ship nearest a point on screen, within reach of a finger or the mouse. */
  shipAt(x: number, y: number, pointerType: string): number | null {
    const list = [...this.ships.values()];
    const i = pickNearestPoint(
      list.map((t) => t.point),
      x,
      y,
      pointerType === 'mouse' ? 20 : 30,
    );
    return i >= 0 ? (list[i]?.id ?? null) : null;
  }

  /** Where a ship is on screen, for tests. */
  screenOf(id: number): { x: number; y: number; visible: boolean } | null {
    const t = this.ships.get(id);
    return t ? { x: t.point.x, y: t.point.y, visible: t.point.visible } : null;
  }

  private attachInput(): () => void {
    const el = this.canvas;
    const local = (e: PointerEvent | WheelEvent) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'touch' && !this.gestures.tracks('touch')) this.gestures.releaseAll();
      this.lastPointerType = e.pointerType;
      const p = local(e);
      const pan = e.button === 1 || e.button === 2 || e.shiftKey;
      if (this.gestures.down(e.pointerId, p.x, p.y, e.timeStamp, e.pointerType, pan, e.button === 0))
        el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (this.gestures.activePointers > 0) {
        const p = local(e);
        this.gestures.move(e.pointerId, p.x, p.y);
      }
    };
    const up = (e: PointerEvent) => {
      const p = local(e);
      this.gestures.up(e.pointerId, p.x, p.y, e.timeStamp);
    };
    const cancel = (e: PointerEvent) => this.gestures.cancel(e.pointerId);
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      this.touched = true;
      const p = local(e);
      const c = this.centre();
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      this.controller.zoomAt(Math.exp(delta * 0.0015), p.x - c.x, p.y - c.y, this.height, FOV);
      this.invalidate();
    };
    // The paused map ignores the same events (MapView.suspend).
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', cancel);
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', cancel);
      el.removeEventListener('wheel', wheel);
    };
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.detach();
    for (const t of this.templates.values()) t.art.dispose();
    for (const o of this.own) {
      if (o.geometry !== this.shieldGeometry && o.geometry !== this.ringGeometry) o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
    this.shieldGeometry.dispose();
    this.ringGeometry.dispose();
    this.star?.dispose();
    this.renderer.toneMapping = this.savedToneMapping;
    this.sky?.backdrop.dispose();
    this.sky?.stars.dispose();
    delete this.container.dataset.replay;
    this.labelLayer.remove();
  }
}

/** Shots by kind, as glowing colours (above 1 for the bloom of an additive glow). */
const SHOT_RGB: Record<DamageType, [number, number, number]> = {
  energy: rgb(SHOT_COLOURS.energy, 1.6),
  kinetic: rgb(SHOT_COLOURS.kinetic, 1.5),
  plasma: rgb(SHOT_COLOURS.plasma, 1.5),
  ion: rgb(SHOT_COLOURS.ion, 1.4),
};
/** How each kind's bolt looks: its size, and its trail's points and spacing (in parts of its flight). */
const BOLT: Record<DamageType, { size: number; trail: number; gap: number }> = {
  energy: { size: 6, trail: 5, gap: 0.04 },
  kinetic: { size: 3.6, trail: 7, gap: 0.03 },
  plasma: { size: 11, trail: 3, gap: 0.035 },
  ion: { size: 4, trail: 1, gap: 0 },
};
const SPARK = rgb('#ffb066', 1.6);
const BLAST = rgb('#ffd8a0', 2);
const DEBRIS = rgb('#8a8078', 0.9);
const JUMP = rgb('#dff1ff', 1.8);
