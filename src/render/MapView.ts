// The neighbourhood map (docs/design/M1_FIRST_LIGHT.md §10): the real stars, the lanes and the
// systems the powers hold, in a flat view (from above the celestial north pole, an orthographic
// projection) or in 3D (an orbit camera). Labels are HTML laid over the canvas, thinned by
// priority. It draws only when something changed, so an idle map costs nothing on a phone.
//
// The camera maths, gestures and label layout are Starman Reborn's (src/render/mapMath.ts,
// camera.ts, gestures.ts, labels.ts); the scene itself is written for Control.

import * as THREE from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { FACTIONS } from '../content/factions.ts';
import type { SystemId } from '../data/types.ts';
import { OrbitController } from './camera.ts';
import { GestureTracker } from './gestures.ts';
import { createLabelBox, type LabelBox, layoutLabels, pickLabelAt, pickNearestPoint } from './labels.ts';
import {
  cloneOrbit,
  createScreenPoint,
  fitOrbitDistance,
  ORBIT_LIMITS,
  type OrbitLimits,
  type OrbitState,
  orbitBasis,
  orbitDirection,
  projectPoint,
  type Rect,
  type ScreenPoint,
  smoothingFactor,
  type Vec3,
  worldPerPixel,
} from './mapMath.ts';
import { labelPriority, type MapClaim, type MapContent, type MapHolding } from './mapModel.ts';
import {
  type BackgroundStars,
  type BakedSky,
  bakeMilkyWay,
  createBackgroundStars,
  createSkyBackdrop,
  type SkyBackdrop,
} from './milkyWay.ts';

export type ViewMode = 'flat' | '3d';

export const MAP_FOV_DEG = 50;

const COLOURS = {
  background: 0x04070e,
  grid: 0x7eaaff,
  dark: 0x9b90c9,
  selected: 0xffffff,
};

/** Distance rings on the plane of the celestial equator, light-years from Sol. */
export const RING_RADII_LY = [5, 10, 15, 20, 25];

const FLAT_LIMITS: OrbitLimits = { ...ORBIT_LIMITS, minPitch: Math.PI / 2, maxPitch: Math.PI / 2, minDistance: 0.8 };
const ORBIT_3D_LIMITS: OrbitLimits = { ...ORBIT_LIMITS, minDistance: 0.8 };

export interface MapViewEvents {
  /** A tap or click on a star (or on empty space: null). */
  select(id: SystemId | null): void;
  /** The mouse is over a star (or none), at container pixels. */
  hover?(id: SystemId | null, x: number, y: number): void;
  /** A double click on a star (desktop): centre it. */
  activate?(id: SystemId): void;
  /** A right click on a star (desktop): an order for the selected ship. Shift adds a waypoint. */
  command?(id: SystemId, x: number, y: number, shift: boolean): void;
}

const STAR_VERTEX = `
attribute float size;
attribute vec3 tint;
attribute float spikes;
uniform float scale;
varying vec3 vTint;
varying float vSpikes;
void main() {
  vTint = tint;
  vSpikes = spikes;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * scale;
}`;

// A bright core, a soft halo, and four faint spikes on the brightest kinds (LIVING_MAP.md §2).
const STAR_FRAGMENT = `
varying vec3 vTint;
varying float vSpikes;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = length(p);
  if (d > 1.0) discard;
  float core = 1.0 - smoothstep(0.16, 0.3, d);
  float glow = exp(-d * d * 5.0) * 0.55 + exp(-d * 2.6) * 0.16;
  float spikes = (exp(-abs(p.x) * 38.0) * exp(-abs(p.y) * 3.4) + exp(-abs(p.y) * 38.0) * exp(-abs(p.x) * 3.4)) * 0.5 * vSpikes;
  float edge = 1.0 - smoothstep(0.75, 1.0, d);
  vec3 col = mix(vTint, vec3(1.0), core * 0.6);
  gl_FragColor = vec4(col, max(core, (glow + spikes) * edge));
}`;

/** Each power's reach (LIVING_MAP.md §4): a soft disc of its colour round each system it holds, facing the camera. */
const FIELD_VERTEX = `
attribute vec3 centre;
attribute vec3 tint;
attribute float radius;
varying vec2 vCorner;
varying vec3 vTint;
void main() {
  vCorner = position.xy;
  vTint = tint;
  vec4 mv = modelViewMatrix * vec4(centre, 1.0);
  mv.xy += position.xy * radius;
  gl_Position = projectionMatrix * mv;
}`;

const FIELD_FRAGMENT = `
uniform float strength;
varying vec2 vCorner;
varying vec3 vTint;
void main() {
  float r = length(vCorner);
  if (r > 1.0) discard;
  float a = smoothstep(1.0, 0.0, r);
  gl_FragColor = vec4(vTint * a * a * strength, 1.0);
}`;

/** Outlined shapes, so a faction's colour always comes with its shape (square, circle, triangle, diamond, hexagon). */
const MARK_VERTEX = `
attribute float size;
attribute vec3 tint;
attribute float shape;
attribute float weight;
uniform float scale;
uniform float pulse;
varying vec3 vTint;
varying float vShape;
varying float vWeight;
void main() {
  vTint = tint;
  vShape = shape;
  vWeight = weight;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * scale * pulse;
}`;

const MARK_FRAGMENT = `
varying vec3 vTint;
varying float vShape;
varying float vWeight;
uniform float opacity;
float triangle(vec2 p, float r) {
  const float k = 1.7320508;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  p.y = -p.y;
  float d;
  if (vShape < 0.5) d = length(p) - 0.8;
  else if (vShape < 1.5) d = max(abs(p.x), abs(p.y)) - 0.68;
  else if (vShape < 2.5) d = triangle(p + vec2(0.0, 0.14), 0.82);
  else if (vShape < 3.5) d = (abs(p.x) + abs(p.y)) * 0.7071 - 0.6;
  else {
    vec2 q = abs(p);
    d = max(q.x * 0.8660254 + q.y * 0.5, q.y) - 0.7;
  }
  float w = vWeight;
  float a = 1.0 - smoothstep(w, w + 0.07, abs(d));
  if (a <= 0.01) discard;
  gl_FragColor = vec4(vTint, a * opacity);
}`;

const SHAPE: Record<MapHolding['mark'], number> = { circle: 0, square: 1, triangle: 2, diamond: 3, hexagon: 4 };

/** Ships: small chevrons drawn a fixed number of pixels from their star, so they never hide it. */
const SHIP_VERTEX = `
attribute vec3 tint;
attribute vec2 offset;
uniform float scale;
uniform vec2 viewport;
varying vec3 vTint;
void main() {
  vTint = tint;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position.xy += offset * scale * 2.0 / viewport * gl_Position.w;
  gl_PointSize = 18.0 * scale;
}`;

const SHIP_FRAGMENT = `
varying vec3 vTint;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  // A chevron pointing up and to the right: two strokes meeting at the tip.
  vec2 q = vec2(p.x - p.y, p.x + p.y) * 0.7071;
  float arm = max(abs(q.x + 0.15) - 0.75, abs(q.y - 0.45) - 0.16);
  float arm2 = max(abs(q.y - 0.15) - 0.75, abs(q.x - 0.45) - 0.16);
  float d = min(arm, arm2);
  if (d > 0.12) discard;
  float edge = smoothstep(0.0, 0.12, d);
  // Lighter than the power's colour, so a ship stands out against its own rings and lanes.
  vec3 body = mix(vTint, vec3(1.0), 0.45);
  gl_FragColor = vec4(mix(body, vec3(0.02, 0.03, 0.06), edge), 1.0);
}`;

/** A ship in flight after a turn (IN_FLIGHT.md §1): a comet with a fading tail. */
const FLYER_VERTEX = `
attribute vec3 tint;
attribute float fade;
uniform float scale;
varying vec3 vTint;
varying float vFade;
void main() {
  vTint = tint;
  vFade = fade;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = (5.0 + 17.0 * fade) * scale;
}`;

const FLYER_FRAGMENT = `
varying vec3 vTint;
varying float vFade;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = length(p);
  if (d > 1.0) discard;
  float core = 1.0 - smoothstep(0.1, 0.35, d);
  float glow = exp(-d * d * 4.0);
  gl_FragColor = vec4(mix(vTint, vec3(1.0), core * 0.7), (core + glow * 0.6) * vFade);
}`;

/** Seconds a flight takes, and the comet's points: its head and a fading tail. */
const FLIGHT_S = 1.5;
const TAIL = 7;

export interface ShipMark {
  /** Where it is: a system, or partway between two on a blind jump (0 to 1). */
  at: SystemId | null;
  from?: SystemId;
  to?: SystemId;
  progress?: number;
  colour: string;
}

export interface MapRoute {
  systems: SystemId[];
  /** `plan`: the route being chosen; `orders`: a ship's standing orders. */
  kind: 'plan' | 'orders';
  /** A blind jump, drawn dashed. */
  blind?: boolean;
}

interface Label {
  el: HTMLDivElement;
  box: LabelBox;
  shown: boolean;
  x: number;
  y: number;
}

export class MapView {
  readonly canvas: HTMLCanvasElement;
  readonly controller: OrbitController;
  private readonly container: HTMLElement;
  private readonly labelLayer: HTMLDivElement;
  private readonly events: MapViewEvents;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly perspective = new THREE.PerspectiveCamera(MAP_FOV_DEG, 1, 0.01, 600);
  private readonly ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 1200);
  private readonly gestures: GestureTracker;
  private readonly viewProjection = new THREE.Matrix4();
  private readonly basis = new THREE.Matrix4();
  private content: MapContent;
  private index = new Map<SystemId, number>();
  private holdings = new Map<SystemId, MapHolding>();
  private points: ScreenPoint[] = [];
  private labels: Label[] = [];
  private readonly order: number[] = [];
  private readonly placed: number[] = [];

  private stars!: THREE.Points;
  private marks!: THREE.Points;
  private highlight!: THREE.Points;
  private openLanes!: LineSegments2;
  private darkLanes!: LineSegments2;
  private tuningLanes!: LineSegments2;
  private drops!: THREE.LineSegments;
  private fields!: THREE.Mesh;
  private sparks!: LineSegments2;
  private readonly fieldMaterial: THREE.ShaderMaterial;
  private readonly sparkMaterial: LineMaterial;
  private sky: { baked: BakedSky; backdrop: SkyBackdrop; stars: BackgroundStars } | null = null;
  private readonly flyerMaterial: THREE.ShaderMaterial;
  private flights: { points: THREE.Vector3[]; along: number[] }[] = [];
  private flyers: THREE.Points | null = null;
  private flightStart = 0;
  private quality: 'low' | 'medium' | 'high' = 'medium';
  /** A change waits to be drawn (the camera, the content): drawn at once, not at the ambient rate. */
  private dirty = false;
  /** Seconds of ambient motion: the sparks, the creeping dashes, the breathing ring. */
  private clock = 0;
  /** Milliseconds between ambient frames: 30, or more on a device that cannot keep up (LIVING_MAP.md §6). */
  private ambientGap = 30;
  private selectedAt = 0;
  private readonly starMaterial: THREE.ShaderMaterial;
  private readonly markMaterial: THREE.ShaderMaterial;
  private readonly highlightMaterial: THREE.ShaderMaterial;
  private readonly openMaterial: LineMaterial;
  private readonly darkMaterial: LineMaterial;
  private readonly tuningMaterial: LineMaterial;
  private readonly grid = new THREE.Group();
  private ships: THREE.Points | null = null;
  private readonly shipMaterial: THREE.ShaderMaterial;
  private readonly routeLines: LineSegments2[] = [];
  private readonly routeMaterials: Record<'plan' | 'orders' | 'planBlind' | 'ordersBlind', LineMaterial>;
  private readonly disposables: { dispose(): void }[] = [];

  private mode: ViewMode = 'flat';
  private saved3d = { yaw: 0.55, pitch: 0.55 };
  private selected: SystemId | null = null;
  private hovered: SystemId | null = null;
  private width = 1;
  private height = 1;
  private stage: Rect = { x: 0, y: 0, w: 1, h: 1 };
  /** Where the camera's centre is drawn now: it eases toward the stage's centre when panels open. */
  private centre = { x: 0.5, y: 0.5 };
  private obstacles: Rect[] = [];
  private dpr = 1;
  private frame = 0;
  private lastTime = 0;
  private drawnVersion = -1;
  private labelsDirty = true;
  private readonly observer: ResizeObserver;
  private readonly detach: () => void;
  private measure: CanvasRenderingContext2D | null = null;

  constructor(container: HTMLElement, content: MapContent, events: MapViewEvents, mode: ViewMode = 'flat') {
    this.container = container;
    this.content = content;
    this.events = events;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    this.renderer.setClearColor(COLOURS.background, 1);
    this.canvas = this.renderer.domElement;
    this.canvas.className = 'map-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(this.canvas);
    this.labelLayer = document.createElement('div');
    this.labelLayer.className = 'map-labels';
    this.labelLayer.setAttribute('aria-hidden', 'true');
    container.appendChild(this.labelLayer);

    this.starMaterial = this.own(
      new THREE.ShaderMaterial({
        uniforms: { scale: { value: 1 } },
        vertexShader: STAR_VERTEX,
        fragmentShader: STAR_FRAGMENT,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const markOptions = {
      vertexShader: MARK_VERTEX,
      fragmentShader: MARK_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    };
    this.markMaterial = this.own(
      new THREE.ShaderMaterial({
        ...markOptions,
        uniforms: { scale: { value: 1 }, opacity: { value: 0.95 }, pulse: { value: 1 } },
      }),
    );
    this.highlightMaterial = this.own(
      new THREE.ShaderMaterial({
        ...markOptions,
        uniforms: { scale: { value: 1 }, opacity: { value: 1 }, pulse: { value: 1 } },
      }),
    );
    this.fieldMaterial = this.own(
      new THREE.ShaderMaterial({
        uniforms: { strength: { value: 0.2 } },
        vertexShader: FIELD_VERTEX,
        fragmentShader: FIELD_FRAGMENT,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        // Fields of one power join where they meet instead of brightening (LIVING_MAP.md §4).
        blending: THREE.CustomBlending,
        blendEquation: THREE.MaxEquation,
      }),
    );
    this.flyerMaterial = this.own(
      new THREE.ShaderMaterial({
        uniforms: { scale: { value: 1 } },
        vertexShader: FLYER_VERTEX,
        fragmentShader: FLYER_FRAGMENT,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.sparkMaterial = this.own(
      new LineMaterial({
        linewidth: 4,
        vertexColors: true,
        worldUnits: false,
        dashed: true,
        dashSize: 0.1,
        gapSize: 1,
        transparent: true,
        opacity: 0.95,
      }),
    );
    this.shipMaterial = this.own(
      new THREE.ShaderMaterial({
        uniforms: { scale: { value: 1 }, viewport: { value: new THREE.Vector2(1, 1) } },
        vertexShader: SHIP_VERTEX,
        fragmentShader: SHIP_FRAGMENT,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    );
    const routeMaterial = (opacity: number, width: number, dashed: boolean) =>
      this.own(
        new LineMaterial({
          // Amber: unlike every power's colour, so a route shows over any lane.
          color: 0xffc95c,
          linewidth: width,
          worldUnits: false,
          transparent: true,
          opacity,
          dashed,
          dashSize: 0.3,
          gapSize: 0.2,
        }),
      );
    this.routeMaterials = {
      plan: routeMaterial(1, 4, false),
      planBlind: routeMaterial(1, 3, true),
      orders: routeMaterial(0.55, 2, false),
      ordersBlind: routeMaterial(0.55, 2, true),
    };
    this.openMaterial = this.own(
      new LineMaterial({ linewidth: 3, vertexColors: true, worldUnits: false, transparent: true, opacity: 0.95 }),
    );
    this.tuningMaterial = this.own(
      new LineMaterial({
        linewidth: 2.5,
        vertexColors: true,
        worldUnits: false,
        dashed: true,
        dashSize: 0.1,
        gapSize: 0.1,
        transparent: true,
        opacity: 0.9,
      }),
    );
    this.darkMaterial = this.own(
      new LineMaterial({
        color: COLOURS.dark,
        linewidth: 1.4,
        worldUnits: false,
        dashed: true,
        dashSize: 0.3,
        gapSize: 0.2,
        transparent: true,
        opacity: 0.55,
      }),
    );
    this.buildGrid();
    this.build();

    this.controller = new OrbitController(this.initialView(mode), mode === 'flat' ? FLAT_LIMITS : ORBIT_3D_LIMITS);
    this.mode = mode;
    this.controller.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.gestures = new GestureTracker({
      rotate: (dx, dy) => {
        if (this.mode === '3d') this.controller.rotateByPixels(dx, dy);
        else this.controller.pan(dx, dy, this.height, MAP_FOV_DEG);
        this.invalidate();
      },
      pan: (dx, dy) => {
        this.controller.pan(dx, dy, this.height, MAP_FOV_DEG);
        this.invalidate();
      },
      zoom: (factor, x, y) => {
        const c = this.projectionCentre();
        this.controller.zoomAt(factor, x - c.x, y - c.y, this.height, MAP_FOV_DEG);
        this.invalidate();
      },
      tap: (x, y) => {
        this.events.select(this.systemAt(x, y, this.lastPointerType));
      },
      doubleTap: (x, y, type) => {
        const id = this.systemAt(x, y, type);
        if (type === 'mouse' && id) {
          this.events.activate?.(id);
          return;
        }
        // A double tap zooms in there; on a star it also chooses it, as its first tap would have.
        if (id) this.events.select(id);
        const c = this.projectionCentre();
        this.controller.zoomAt(0.5, x - c.x, y - c.y, this.height, MAP_FOV_DEG, true);
        this.invalidate();
      },
    });
    this.detach = this.attachInput();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.resize();
    document.fonts?.ready.then(() => {
      this.measureLabels();
      this.invalidate();
    });
  }

  // ---------------------------------------------------------------- the scene

  private own<T extends { dispose(): void }>(thing: T): T {
    this.disposables.push(thing);
    return thing;
  }

  private buildGrid(): void {
    const material = this.own(new THREE.LineBasicMaterial({ color: COLOURS.grid, transparent: true, opacity: 0.13 }));
    for (const r of RING_RADII_LY) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < 128; i++) {
        const a = (i / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      }
      const geometry = this.own(new THREE.BufferGeometry().setFromPoints(pts));
      this.grid.add(new THREE.LineLoop(geometry, material));
    }
    this.scene.add(this.grid);
  }

  /** (Re)builds everything drawn from the content. */
  private build(): void {
    for (const o of [
      this.stars,
      this.marks,
      this.highlight,
      this.openLanes,
      this.tuningLanes,
      this.darkLanes,
      this.drops,
      this.fields,
      this.sparks,
    ]) {
      if (!o) continue;
      this.scene.remove(o);
      o.geometry.dispose();
    }
    const { systems, lanes, holdings } = this.content;
    this.index = new Map(systems.map((s, i) => [s.id, i]));
    this.holdings = new Map(holdings.map((h) => [h.system, h]));
    const colour = new THREE.Color();

    const pos = new Float32Array(systems.length * 3);
    const tint = new Float32Array(systems.length * 3);
    const size = new Float32Array(systems.length);
    const spikes = new Float32Array(systems.length);
    systems.forEach((s, i) => {
      pos.set(s.pos, i * 3);
      colour.set(s.colour);
      tint.set([colour.r, colour.g, colour.b], i * 3);
      size[i] = s.sizePx * 3.2;
      spikes[i] = s.sizePx >= 11 ? 1 : s.sizePx >= 10 ? 0.45 : 0;
    });
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    starGeometry.setAttribute('tint', new THREE.BufferAttribute(tint, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(size, 1));
    starGeometry.setAttribute('spikes', new THREE.BufferAttribute(spikes, 1));
    this.stars = new THREE.Points(starGeometry, this.starMaterial);
    this.stars.renderOrder = 3;

    this.marks = this.markPoints(
      holdings.map((h) => {
        const s = systems[this.index.get(h.system) ?? 0];
        return {
          pos: s?.pos ?? [0, 0, 0],
          colour: h.colour,
          shape: SHAPE[h.mark],
          size: h.capital ? 30 : 22,
          weight: h.capital ? 0.12 : 0.08,
        };
      }),
      this.markMaterial,
    );
    this.marks.renderOrder = 2;
    this.highlight = this.markPoints([], this.highlightMaterial);
    this.highlight.renderOrder = 4;

    const coloured = (status: 'open' | 'building', material: LineMaterial) => {
      const list = lanes.filter((l) => l.status === status);
      const geometry = new LineSegmentsGeometry();
      const pos: number[] = [];
      const col: number[] = [];
      for (const l of list) {
        const a = systems[this.index.get(l.a) ?? 0]?.pos ?? [0, 0, 0];
        const b = systems[this.index.get(l.b) ?? 0]?.pos ?? [0, 0, 0];
        pos.push(...a, ...b);
        colour.set(l.owner ? FACTIONS[l.owner].colour : '#ffffff');
        col.push(colour.r, colour.g, colour.b, colour.r, colour.g, colour.b);
      }
      geometry.setPositions(pos.length ? pos : [0, 0, 0, 0, 0, 0]);
      geometry.setColors(col.length ? col : [0, 0, 0, 0, 0, 0]);
      const line = new LineSegments2(geometry, material);
      line.computeLineDistances();
      line.visible = list.length > 0;
      line.renderOrder = 1;
      return line;
    };
    this.openLanes = coloured('open', this.openMaterial);
    this.tuningLanes = coloured('building', this.tuningMaterial);

    const darkPos: number[] = [];
    for (const l of lanes) {
      if (l.status !== 'dark') continue;
      darkPos.push(
        ...(systems[this.index.get(l.a) ?? 0]?.pos ?? [0, 0, 0]),
        ...(systems[this.index.get(l.b) ?? 0]?.pos ?? [0, 0, 0]),
      );
    }
    const darkGeometry = new LineSegmentsGeometry();
    darkGeometry.setPositions(darkPos.length ? darkPos : [0, 0, 0, 0, 0, 0]);
    this.darkLanes = new LineSegments2(darkGeometry, this.darkMaterial);
    this.darkLanes.computeLineDistances();
    this.darkLanes.renderOrder = 0;

    const dropPos = new Float32Array(systems.length * 6);
    systems.forEach((s, i) => {
      dropPos.set([s.pos[0], s.pos[1], s.pos[2], s.pos[0], 0, s.pos[2]], i * 6);
    });
    const dropGeometry = new THREE.BufferGeometry();
    dropGeometry.setAttribute('position', new THREE.BufferAttribute(dropPos, 3));
    this.drops = new THREE.LineSegments(
      dropGeometry,
      this.own(new THREE.LineBasicMaterial({ color: COLOURS.grid, transparent: true, opacity: 0.07 })),
    );

    this.fields = this.buildFields(holdings, systems, this.content.claims);
    this.sparks = this.buildSparks(lanes, holdings, systems);

    this.scene.add(
      this.fields,
      this.darkLanes,
      this.openLanes,
      this.tuningLanes,
      this.sparks,
      this.drops,
      this.marks,
      this.stars,
      this.highlight,
    );
    this.points = systems.map(() => createScreenPoint());
    this.buildLabels();
    this.updateHighlight();
  }

  /**
   * A soft field of its power's colour round each system a power holds, larger at a capital, and a
   * smaller one round each it only claims (M3_NEIGHBOURS.md §22.5), one for each claimant where contested.
   */
  private buildFields(
    held: readonly MapHolding[],
    systems: MapContent['systems'],
    claims: readonly MapClaim[] = [],
  ): THREE.Mesh {
    const holdings = [
      ...held.map((h) => ({ system: h.system, colour: h.colour, radius: h.capital ? 4.4 : 3.2 })),
      ...claims.map((c) => ({ system: c.system, colour: c.colour, radius: 2.2 })),
    ];
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    const n = Math.max(1, holdings.length);
    const centre = new Float32Array(n * 3);
    const tint = new Float32Array(n * 3);
    const radius = new Float32Array(n);
    const colour = new THREE.Color();
    holdings.forEach((h, i) => {
      centre.set(systems[this.index.get(h.system) ?? 0]?.pos ?? [0, 0, 0], i * 3);
      colour.set(h.colour).toArray(tint, i * 3);
      radius[i] = h.radius;
    });
    geometry.setAttribute('centre', new THREE.InstancedBufferAttribute(centre, 3));
    geometry.setAttribute('tint', new THREE.InstancedBufferAttribute(tint, 3));
    geometry.setAttribute('radius', new THREE.InstancedBufferAttribute(radius, 1));
    geometry.instanceCount = holdings.length;
    const mesh = new THREE.Mesh(geometry, this.fieldMaterial);
    mesh.frustumCulled = false;
    mesh.renderOrder = -10;
    mesh.visible = holdings.length > 0;
    return mesh;
  }

  /**
   * Sparks along each power's open lanes (LIVING_MAP.md §3), every lane drawn from the end nearer
   * the power's capital through its own lanes, so the light runs outward from home.
   */
  private buildSparks(
    lanes: MapContent['lanes'],
    holdings: readonly MapHolding[],
    systems: MapContent['systems'],
  ): LineSegments2 {
    const open = lanes.filter((l) => l.status === 'open' && l.owner);
    const hops = new Map<string, number>();
    for (const h of holdings) {
      if (!h.capital) continue;
      const own = open.filter((l) => l.owner === h.faction);
      const queue = [h.system];
      hops.set(`${h.faction} ${h.system}`, 0);
      for (let i = 0; i < queue.length; i++) {
        const at = queue[i] as SystemId;
        const d = hops.get(`${h.faction} ${at}`) ?? 0;
        for (const l of own) {
          const next = l.a === at ? l.b : l.b === at ? l.a : null;
          if (!next || hops.has(`${h.faction} ${next}`)) continue;
          hops.set(`${h.faction} ${next}`, d + 1);
          queue.push(next);
        }
      }
    }
    const pos: number[] = [];
    const col: number[] = [];
    const colour = new THREE.Color();
    for (const l of open) {
      const far = (id: SystemId) => hops.get(`${l.owner} ${id}`) ?? 99;
      const [a, b] = far(l.a) <= far(l.b) ? [l.a, l.b] : [l.b, l.a];
      pos.push(
        ...(systems[this.index.get(a) ?? 0]?.pos ?? [0, 0, 0]),
        ...(systems[this.index.get(b) ?? 0]?.pos ?? [0, 0, 0]),
      );
      colour.set(l.owner ? FACTIONS[l.owner].colour : '#ffffff').lerp(new THREE.Color(1, 1, 1), 0.45);
      col.push(colour.r, colour.g, colour.b, colour.r, colour.g, colour.b);
    }
    const geometry = new LineSegmentsGeometry();
    geometry.setPositions(pos.length ? pos : [0, 0, 0, 0, 0, 0]);
    geometry.setColors(col.length ? col : [0, 0, 0, 0, 0, 0]);
    const line = new LineSegments2(geometry, this.sparkMaterial);
    line.computeLineDistances();
    line.visible = open.length > 0;
    line.renderOrder = 1;
    return line;
  }

  private markPoints(
    items: { pos: readonly number[]; colour: string | number; shape: number; size: number; weight: number }[],
    material: THREE.ShaderMaterial,
  ): THREE.Points {
    const colour = new THREE.Color();
    const n = Math.max(1, items.length);
    const pos = new Float32Array(n * 3);
    const tint = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const shape = new Float32Array(n);
    const weight = new Float32Array(n);
    items.forEach((m, i) => {
      pos.set(m.pos, i * 3);
      colour.set(m.colour);
      tint.set([colour.r, colour.g, colour.b], i * 3);
      size[i] = m.size;
      shape[i] = m.shape;
      weight[i] = m.weight;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('tint', new THREE.BufferAttribute(tint, 3));
    g.setAttribute('size', new THREE.BufferAttribute(size, 1));
    g.setAttribute('shape', new THREE.BufferAttribute(shape, 1));
    g.setAttribute('weight', new THREE.BufferAttribute(weight, 1));
    g.setDrawRange(0, items.length);
    return new THREE.Points(g, material);
  }

  private updateHighlight(): void {
    const items: Parameters<MapView['markPoints']>[0] = [];
    const at = (id: SystemId) => this.content.systems[this.index.get(id) ?? -1]?.pos;
    const hovered = this.hovered && this.hovered !== this.selected ? at(this.hovered) : undefined;
    if (hovered) items.push({ pos: hovered, colour: 0xcfe4ff, shape: 0, size: 34, weight: 0.05 });
    const selected = this.selected ? at(this.selected) : undefined;
    if (selected) items.push({ pos: selected, colour: COLOURS.selected, shape: 0, size: 44, weight: 0.07 });
    this.scene.remove(this.highlight);
    this.highlight.geometry.dispose();
    this.highlight = this.markPoints(items, this.highlightMaterial);
    this.highlight.renderOrder = 4;
    this.scene.add(this.highlight);
  }

  // ---------------------------------------------------------------- labels

  private buildLabels(): void {
    this.labelLayer.replaceChildren();
    this.labels = this.content.systems.map((s) => {
      const el = document.createElement('div');
      el.className = 'map-label';
      el.textContent = s.name;
      el.dataset.system = s.id;
      const held = this.holdings.get(s.id);
      if (held) el.classList.add('is-held');
      if (held && held.people > 0) {
        const people = document.createElement('span');
        people.className = 'map-label-people';
        people.textContent = ` ${held.people}M`;
        el.appendChild(people);
      }
      el.hidden = true;
      this.labelLayer.appendChild(el);
      const box = createLabelBox();
      box.height = 18;
      box.gap = Math.max(9, s.sizePx * 0.9);
      return { el, box, shown: false, x: 0, y: 0 };
    });
    this.measureLabels();
  }

  private measureLabels(): void {
    if (!this.measure) this.measure = document.createElement('canvas').getContext('2d');
    const ctx = this.measure;
    const style = getComputedStyle(this.labels[0]?.el ?? this.container);
    const font = style.font || '600 13px sans-serif';
    // Labels grow with the text size setting.
    const height = Math.round((Number.parseFloat(style.fontSize) || 13) * 1.385);
    this.content.systems.forEach((s, i) => {
      const label = this.labels[i];
      if (!label) return;
      label.box.height = height;
      const text = label.el.textContent ?? s.name;
      if (ctx) {
        ctx.font = font;
        label.box.width = Math.ceil(ctx.measureText(text).width) + 10;
      } else {
        label.box.width = text.length * 7 + 10;
      }
    });
    this.labelsDirty = true;
  }

  private layout(): void {
    const ctx = { selected: this.selected, hovered: this.hovered, holdings: this.holdings };
    const c = this.projectionCentre();
    const reach = Math.max(this.width, this.height) / 2;
    this.content.systems.forEach((s, i) => {
      const p = this.points[i] as ScreenPoint;
      const label = this.labels[i] as Label;
      const inside = p.visible && p.x >= 0 && p.y >= 0 && p.x <= this.width && p.y <= this.height;
      const nearness = 1 - Math.hypot(p.x - c.x, p.y - c.y) / reach;
      label.box.anchorX = p.x;
      label.box.anchorY = p.y;
      label.box.active = inside;
      label.box.priority = labelPriority(s, ctx, nearness);
    });
    layoutLabels(
      this.labels.map((l) => l.box),
      { x: 4, y: 4, w: this.width - 8, h: this.height - 8 },
      this.obstacles,
      this.order,
      this.placed,
    );
    for (const label of this.labels) {
      const show = label.box.visible;
      if (show !== label.shown) {
        label.el.hidden = !show;
        label.shown = show;
      }
      if (show && (label.box.x !== label.x || label.box.y !== label.y)) {
        label.el.style.transform = `translate(${Math.round(label.box.x)}px, ${Math.round(label.box.y)}px)`;
        label.x = label.box.x;
        label.y = label.box.y;
      }
    }
    const selected = this.selected ? this.labels[this.index.get(this.selected) ?? -1] : undefined;
    for (const l of this.labels) l.el.classList.toggle('is-selected', l === selected);
  }

  // ---------------------------------------------------------------- the camera

  private initialView(mode: ViewMode): OrbitState {
    const near = this.content.systems.filter((s) => Math.hypot(...s.pos) <= 12).map((s) => s.pos);
    const pitch = mode === 'flat' ? Math.PI / 2 : this.saved3d.pitch;
    const yaw = mode === 'flat' ? 0 : this.saved3d.yaw;
    const distance = fitOrbitDistance(near, [0, 0, 0], yaw, pitch, MAP_FOV_DEG, 400, 600, 600, 10, 2, 60);
    return { target: [0, 0, 0], yaw, pitch, distance };
  }

  /** Where the camera's centre falls on screen: the middle of the visible stage. */
  private projectionCentre(): { x: number; y: number } {
    return this.centre;
  }

  private stageCentre(): { x: number; y: number } {
    return { x: this.stage.x + this.stage.w / 2, y: this.stage.y + this.stage.h / 2 };
  }

  /** Eases the drawn centre toward the stage's; returns true while it is still moving. */
  private easeCentre(dt: number): boolean {
    const goal = this.stageCentre();
    const k = this.controller.reducedMotion ? 1 : smoothingFactor(dt, 0.05);
    const dx = goal.x - this.centre.x;
    const dy = goal.y - this.centre.y;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
      const moved = dx !== 0 || dy !== 0;
      this.centre = goal;
      return moved;
    }
    this.centre = { x: this.centre.x + dx * k, y: this.centre.y + dy * k };
    return true;
  }

  private updateCamera(): THREE.Camera {
    const s = this.controller.current;
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    const r: Vec3 = [0, 0, 0];
    const u: Vec3 = [0, 0, 0];
    const d: Vec3 = [0, 0, 0];
    orbitBasis(s.yaw, s.pitch, r, u);
    orbitDirection(s.yaw, s.pitch, d);
    right.set(...r);
    up.set(...u);
    const back = new THREE.Vector3(...d);
    this.basis.makeBasis(right, up, back);
    const centre = this.projectionCentre();
    const shiftX = centre.x - this.width / 2;
    const shiftY = centre.y - this.height / 2;
    const aspect = this.width / this.height;
    let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    if (this.mode === '3d') {
      camera = this.perspective;
      camera.aspect = aspect;
      camera.position.set(
        s.target[0] + d[0] * s.distance,
        s.target[1] + d[1] * s.distance,
        s.target[2] + d[2] * s.distance,
      );
    } else {
      camera = this.ortho;
      const halfH = s.distance * Math.tan((MAP_FOV_DEG * Math.PI) / 360);
      camera.top = halfH;
      camera.bottom = -halfH;
      camera.left = -halfH * aspect;
      camera.right = halfH * aspect;
      camera.position.set(s.target[0] + d[0] * 500, s.target[1] + d[1] * 500, s.target[2] + d[2] * 500);
    }
    camera.quaternion.setFromRotationMatrix(this.basis);
    camera.setViewOffset(this.width, this.height, -shiftX, -shiftY, this.width, this.height);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    this.viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    return camera;
  }

  // ---------------------------------------------------------------- drawing

  /** Asks for a frame; nothing is drawn while nothing changes. */
  invalidate(labels = true): void {
    if (labels) this.labelsDirty = true;
    this.dirty = true;
    this.schedule();
  }

  private schedule(): void {
    if (!this.frame && !this.suspended) this.frame = requestAnimationFrame((t) => this.draw(t));
  }

  /** Whether anything moves on its own (LIVING_MAP.md §6): never with reduced motion. */
  get animating(): boolean {
    return (
      !this.controller.reducedMotion &&
      (this.sparks.visible || this.tuningLanes.visible || this.selected !== null || this.flyers !== null)
    );
  }

  /** The baked sky and its faint stars, made at the first frame and again when the quality changes. */
  private ensureSky(): NonNullable<MapView['sky']> {
    if (this.sky) return this.sky;
    const baked = bakeMilkyWay(this.renderer, this.quality);
    const backdrop = createSkyBackdrop(baked.texture, 0.6);
    const stars = createBackgroundStars({ quality: this.quality, dpr: this.dpr, twinkle: false });
    this.scene.add(backdrop.mesh, stars.points);
    this.sky = { baked, backdrop, stars };
    this.container.dataset.sky = 'yes';
    return this.sky;
  }

  private dropSky(): void {
    if (!this.sky) return;
    this.scene.remove(this.sky.backdrop.mesh, this.sky.stars.points);
    this.sky.backdrop.dispose();
    this.sky.stars.dispose();
    this.sky.baked.dispose();
    this.sky = null;
  }

  private draw(time: number): void {
    this.frame = 0;
    if (this.suspended) return;
    // Only the ambient motion is running: at most 30 frames a second, fewer on a slow device.
    if (!this.dirty && this.lastTime && time - this.lastTime < this.ambientGap) {
      this.schedule();
      return;
    }
    const ambientOnly = !this.dirty;
    const interval = this.lastTime ? time - this.lastTime : 0;
    const started = performance.now();
    this.dirty = false;
    const dt = this.lastTime ? Math.min(0.1, (time - this.lastTime) / 1000) : 1 / 60;
    this.lastTime = time;
    const still = this.controller.reducedMotion;
    if (!still) this.clock += dt;
    const shifting = this.easeCentre(dt);
    const moving = this.controller.update(dt) || shifting;
    const camera = this.updateCamera();
    const s = this.controller.current;
    // Stars grow a little as you come closer, and shrink a little far out.
    const zoomScale = Math.min(1.6, Math.max(0.75, Math.sqrt(14 / s.distance)));
    this.starMaterial.uniforms.scale.value = this.dpr * zoomScale;
    this.markMaterial.uniforms.scale.value = this.dpr * Math.min(1.3, Math.max(0.8, zoomScale));
    this.highlightMaterial.uniforms.scale.value = this.dpr * Math.min(1.3, Math.max(0.8, zoomScale));
    const k = worldPerPixel(s.distance, MAP_FOV_DEG, this.height);
    this.darkMaterial.dashSize = 6 * k;
    this.darkMaterial.gapSize = 5 * k;
    this.tuningMaterial.dashSize = 2 * k;
    this.tuningMaterial.gapSize = 4 * k;
    this.shipMaterial.uniforms.scale.value = this.dpr;
    for (const m of [this.routeMaterials.planBlind, this.routeMaterials.ordersBlind]) {
      m.dashSize = 8 * k;
      m.gapSize = 6 * k;
    }
    this.drops.visible = this.mode === '3d';
    this.flyerMaterial.uniforms.scale.value = this.dpr;
    const flying = this.stepFlights();
    // Sparks of about 7 px every 70 px, running outward at 36 px a second; the tuning dashes creep.
    this.sparkMaterial.dashSize = 7 * k;
    this.sparkMaterial.gapSize = 64 * k;
    this.sparkMaterial.dashOffset = -this.clock * 36 * k;
    this.tuningMaterial.dashOffset = -this.clock * 6 * k;
    // The chosen system's ring settles in from larger, then breathes.
    const breathe = still ? 0 : Math.sin(this.clock * 2.4);
    const settle = still ? 0 : Math.exp(-(this.clock - this.selectedAt) * 9);
    this.highlightMaterial.uniforms.pulse.value = 1 + 0.5 * settle + 0.04 * breathe;
    this.highlightMaterial.uniforms.opacity.value = 0.88 + 0.12 * breathe;
    this.fieldMaterial.uniforms.strength.value = 0.4;
    const sky = this.ensureSky();
    sky.backdrop.setStrength(this.mode === '3d' ? 0.62 : 0.45);
    sky.backdrop.update(camera, MAP_FOV_DEG, this.width / this.height);
    sky.stars.update(camera, this.clock, MAP_FOV_DEG, this.width / this.height);
    this.renderer.render(this.scene, camera);
    if (this.controller.version !== this.drawnVersion || this.labelsDirty || shifting) {
      this.project();
      this.layout();
      this.drawnVersion = this.controller.version;
      this.labelsDirty = false;
    }
    this.container.dataset.ready = '1';
    // A device that takes long over a frame, or cannot keep up, gets fewer ambient frames, so the
    // game stays quick to answer a touch.
    const cost = performance.now() - started;
    const behind = ambientOnly && interval > this.ambientGap * 1.6 ? interval * 1.25 : 0;
    this.ambientGap = Math.min(400, this.ambientGap * 0.7 + Math.max(30, cost * 5, behind) * 0.3);
    if (moving) this.invalidate();
    else if (flying) this.invalidate(false);
    else if (this.animating) this.schedule();
  }

  /**
   * Ships fly the lanes they took when a turn ends (IN_FLIGHT.md §1): each path is the systems it
   * passed through, start to end. Nothing flies with reduced motion.
   */
  flyShips(moves: readonly { path: readonly SystemId[]; colour: string }[]): void {
    this.endFlights();
    if (this.controller.reducedMotion) return;
    const colours: THREE.Color[] = [];
    for (const m of moves) {
      const points: THREE.Vector3[] = [];
      for (const id of m.path) {
        const p = this.content.systems[this.index.get(id) ?? -1]?.pos;
        if (p) points.push(new THREE.Vector3(p[0], p[1], p[2]));
      }
      if (points.length < 2) continue;
      const along = [0];
      for (let i = 1; i < points.length; i++)
        along.push((along[i - 1] ?? 0) + (points[i] as THREE.Vector3).distanceTo(points[i - 1] as THREE.Vector3));
      this.flights.push({ points, along });
      colours.push(new THREE.Color(m.colour));
    }
    if (this.flights.length === 0) return;
    const n = this.flights.length * TAIL;
    const tint = new Float32Array(n * 3);
    const fade = new Float32Array(n);
    for (let i = 0; i < this.flights.length; i++)
      for (let k = 0; k < TAIL; k++) {
        (colours[i] as THREE.Color).toArray(tint, (i * TAIL + k) * 3);
        fade[i * TAIL + k] = (1 - k / TAIL) ** 1.5;
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('tint', new THREE.BufferAttribute(tint, 3));
    g.setAttribute('fade', new THREE.BufferAttribute(fade, 1));
    this.flyers = new THREE.Points(g, this.flyerMaterial);
    this.flyers.frustumCulled = false;
    this.flyers.renderOrder = 6;
    this.scene.add(this.flyers);
    this.flightStart = this.clock;
    this.stepFlights();
    this.invalidate(false);
  }

  private endFlights(): void {
    if (this.flyers) {
      this.scene.remove(this.flyers);
      this.flyers.geometry.dispose();
    }
    this.flyers = null;
    this.flights = [];
  }

  /** Moves each comet along its path, easing in and out; false once they have all arrived. */
  private stepFlights(): boolean {
    if (!this.flyers) return false;
    const t = (this.clock - this.flightStart) / FLIGHT_S;
    if (t >= 1) {
      this.endFlights();
      return false;
    }
    const attr = this.flyers.geometry.getAttribute('position') as THREE.BufferAttribute;
    const out = attr.array as Float32Array;
    const v = new THREE.Vector3();
    this.flights.forEach((f, i) => {
      const total = f.along[f.along.length - 1] ?? 0;
      for (let k = 0; k < TAIL; k++) {
        const tk = Math.max(0, t - k * 0.03);
        const eased = tk < 0.5 ? 4 * tk ** 3 : 1 - (-2 * tk + 2) ** 3 / 2;
        const d = eased * total;
        let seg = 1;
        while (seg < f.along.length - 1 && (f.along[seg] ?? 0) < d) seg++;
        const a = f.points[seg - 1] as THREE.Vector3;
        const b = f.points[seg] as THREE.Vector3;
        const start = f.along[seg - 1] ?? 0;
        const length = (f.along[seg] ?? 0) - start;
        v.copy(a).lerp(b, length > 0 ? Math.min(1, (d - start) / length) : 1);
        v.toArray(out, (i * TAIL + k) * 3);
      }
    });
    attr.needsUpdate = true;
    return true;
  }

  /** How many ships are in flight after a turn, for tests. */
  get flying(): number {
    return this.flights.length;
  }

  /** The baked sky, lent to the system view so it sits under the same Milky Way (IN_FLIGHT.md §2). */
  get skyTexture(): THREE.CubeTexture {
    return this.ensureSky().baked.texture;
  }

  private project(): void {
    const m = this.viewProjection.elements;
    this.content.systems.forEach((s, i) => {
      projectPoint(m, s.pos[0], s.pos[1], s.pos[2], this.width, this.height, this.points[i] as ScreenPoint);
    });
  }

  private resize(): void {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.dpr = Math.min(this.maxDpr, window.devicePixelRatio || 1);
    if (w === this.width && h === this.height && this.renderer.getPixelRatio() === this.dpr) return;
    const centred = this.stage.w === this.width && this.stage.h === this.height;
    const first = this.width === 1 && this.height === 1;
    this.width = w;
    this.height = h;
    if (centred) this.stage = { x: 0, y: 0, w, h };
    if (first) this.centre = this.stageCentre();
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h, false);
    const skyDpr = (this.sky?.stars.points.material as THREE.ShaderMaterial | undefined)?.uniforms.uDpr;
    if (skyDpr) skyDpr.value = this.dpr;
    this.openMaterial.resolution.set(w, h);
    this.sparkMaterial.resolution.set(w, h);
    this.darkMaterial.resolution.set(w, h);
    this.tuningMaterial.resolution.set(w, h);
    for (const m of Object.values(this.routeMaterials)) m.resolution.set(w, h);
    this.shipMaterial.uniforms.viewport.value.set(w * this.dpr, h * this.dpr);
    this.invalidate();
  }

  // ---------------------------------------------------------------- input

  private lastPointerType = 'mouse';

  private attachInput(): () => void {
    const el = this.canvas;
    const local = (e: PointerEvent | WheelEvent | MouseEvent) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = (e: PointerEvent) => {
      if (this.suspended) return;
      if (e.pointerType === 'touch' && !this.gestures.tracks('touch')) this.gestures.releaseAll();
      this.lastPointerType = e.pointerType;
      const p = local(e);
      // Middle or right button, or Shift, pans; a right click without a drag is a command.
      const pan = e.button === 1 || e.button === 2 || e.shiftKey;
      if (this.gestures.down(e.pointerId, p.x, p.y, e.timeStamp, e.pointerType, pan, e.button === 0)) {
        el.setPointerCapture(e.pointerId);
        this.rightDown = e.button === 2 ? { x: p.x, y: p.y } : null;
      }
    };
    const move = (e: PointerEvent) => {
      if (this.suspended) return;
      const p = local(e);
      if (this.gestures.activePointers > 0) {
        this.gestures.move(e.pointerId, p.x, p.y);
        return;
      }
      if (e.pointerType === 'mouse') this.setHover(this.systemAt(p.x, p.y, 'mouse'), p.x, p.y);
    };
    const up = (e: PointerEvent) => {
      if (this.suspended) return;
      const p = local(e);
      this.gestures.up(e.pointerId, p.x, p.y, e.timeStamp);
      if (this.rightDown && e.button === 2 && Math.hypot(p.x - this.rightDown.x, p.y - this.rightDown.y) < 4) {
        const id = this.systemAt(p.x, p.y, 'mouse');
        if (id) this.events.command?.(id, p.x, p.y, e.shiftKey);
      }
      this.rightDown = null;
    };
    const cancel = (e: PointerEvent) => this.gestures.cancel(e.pointerId);
    const leave = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && this.gestures.activePointers === 0) this.setHover(null, 0, 0);
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      if (this.suspended) return;
      const p = local(e);
      const c = this.projectionCentre();
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      this.controller.zoomAt(Math.exp(delta * 0.0015), p.x - c.x, p.y - c.y, this.height, MAP_FOV_DEG);
      this.invalidate();
    };
    const menu = (e: Event) => e.preventDefault();
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', cancel);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('contextmenu', menu);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', cancel);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('contextmenu', menu);
    };
  }

  private rightDown: { x: number; y: number } | null = null;

  // ---------------------------------------------------------------- the system view

  private suspended = false;
  /** Where the camera was before it glided into a system, to come back to. */
  private beforeGlide: OrbitState | null = null;
  /** Sharpest pixel ratio drawn: lower on the low quality setting. */
  private maxDpr = 2;

  /** The settings that change how the map draws (M1_PROOF.md §1). */
  configure(opts: { reducedMotion: boolean; quality: 'low' | 'medium' | 'high' }): void {
    this.controller.reducedMotion = opts.reducedMotion;
    if (opts.quality !== this.quality) {
      this.quality = opts.quality;
      this.dropSky();
    }
    const dpr = opts.quality === 'low' ? 1 : 2;
    if (dpr !== this.maxDpr) {
      this.maxDpr = dpr;
      this.resize();
    }
    this.invalidate();
  }

  /** The renderer, lent to the system view while the map is paused. */
  get gl(): THREE.WebGLRenderer {
    return this.renderer;
  }

  get host(): HTMLElement {
    return this.container;
  }

  /** Pauses the map (no drawing, no input, no labels) while a system view uses its canvas. */
  suspend(on: boolean): void {
    this.suspended = on;
    this.labelLayer.hidden = on;
    if (on) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.gestures.releaseAll();
      this.setHover(null, 0, 0);
    } else {
      if (this.beforeGlide) this.controller.jumpTo(this.beforeGlide);
      this.beforeGlide = null;
      this.lastTime = 0;
      this.invalidate();
    }
  }

  /**
   * Glides in on a system before its system view opens (LIVING_MAP.md §5): how long that takes, in
   * milliseconds, or 0 with reduced motion. The map comes back where it was when it is resumed.
   */
  glideInto(id: SystemId): number {
    const s = this.content.systems[this.index.get(id) ?? -1];
    if (!s || this.controller.reducedMotion) return 0;
    this.beforeGlide = cloneOrbit(this.controller.current);
    const distance = Math.max(0.9, Math.min(2.4, this.controller.current.distance * 0.3));
    this.controller.transitionTo({ target: [...s.pos], distance }, 0.07);
    this.invalidate();
    return 340;
  }

  private setHover(id: SystemId | null, x: number, y: number): void {
    if (id !== this.hovered) {
      this.hovered = id;
      this.updateHighlight();
      this.invalidate();
    }
    this.events.hover?.(id, x, y);
    this.canvas.style.cursor = id ? 'pointer' : '';
  }

  // ---------------------------------------------------------------- what the screen asks of the map

  /** The system under a point (container pixels): its label, or the nearest star within reach. */
  systemAt(x: number, y: number, pointerType = 'mouse'): SystemId | null {
    const boxes = this.labels.map((l) => l.box);
    const byLabel = pickLabelAt(boxes, x, y, pointerType === 'mouse' ? 2 : 6);
    const i = byLabel >= 0 ? byLabel : pickNearestPoint(this.points, x, y, pointerType === 'mouse' ? 14 : 24);
    return i >= 0 ? (this.content.systems[i]?.id ?? null) : null;
  }

  /** Where a system is drawn (container pixels), for tests and pop-ups. */
  screenOf(id: SystemId): { x: number; y: number; visible: boolean } | null {
    const p = this.points[this.index.get(id) ?? -1];
    return p
      ? { x: p.x, y: p.y, visible: p.visible && p.x >= 0 && p.y >= 0 && p.x <= this.width && p.y <= this.height }
      : null;
  }

  /** True while the camera or the centre is still moving, for tests. */
  get moving(): boolean {
    const c = this.stageCentre();
    return (
      this.controller.isAnimating ||
      Math.abs(c.x - this.centre.x) > 0.5 ||
      Math.abs(c.y - this.centre.y) > 0.5 ||
      this.dirty
    );
  }

  /** Where the camera is, for tests. */
  get orbit(): OrbitState {
    return cloneOrbit(this.controller.current);
  }

  /** How many fields of a power's reach, and lanes with sparks, are drawn: for tests. */
  get fieldCount(): number {
    return this.fields.visible ? (this.fields.geometry as THREE.InstancedBufferGeometry).instanceCount : 0;
  }

  get sparkCount(): number {
    return this.sparks.visible ? (this.sparks.geometry as LineSegmentsGeometry).instanceCount : 0;
  }

  /** Which labels are showing, for tests. */
  visibleLabels(): SystemId[] {
    return this.labels.filter((l) => l.shown).map((l) => l.el.dataset.system as SystemId);
  }

  get viewMode(): ViewMode {
    return this.mode;
  }

  setContent(content: MapContent): void {
    this.content = content;
    this.build();
    this.invalidate();
  }

  setSelected(id: SystemId | null): void {
    if (id === this.selected) return;
    this.selected = id;
    this.selectedAt = this.clock;
    this.updateHighlight();
    this.invalidate();
  }

  /** The part of the map not covered by panels (container pixels): the camera centres on it. */
  setStage(stage: Rect, obstacles: Rect[] = []): void {
    this.stage = { x: stage.x, y: stage.y, w: Math.max(1, stage.w), h: Math.max(1, stage.h) };
    this.obstacles = obstacles;
    this.invalidate();
  }

  setMode(mode: ViewMode): void {
    if (mode === this.mode) return;
    const s = this.controller.current;
    if (mode === 'flat') {
      this.saved3d = { yaw: s.yaw, pitch: s.pitch };
      Object.assign(this.controller.limits, FLAT_LIMITS);
      this.mode = 'flat';
      this.controller.transitionTo({ pitch: Math.PI / 2, yaw: 0 }, 0.1);
    } else {
      Object.assign(this.controller.limits, ORBIT_3D_LIMITS);
      this.mode = '3d';
      this.controller.transitionTo({ pitch: this.saved3d.pitch, yaw: this.saved3d.yaw }, 0.1);
    }
    this.invalidate();
  }

  /** Brings a system to the centre of the stage, closer if the view is far out; `instant` skips the easing. */
  focus(id: SystemId, instant = false): void {
    const s = this.content.systems[this.index.get(id) ?? -1];
    if (!s) return;
    const distance = Math.max(3, Math.min(this.controller.current.distance, 14));
    if (instant) this.controller.jumpTo({ ...this.controller.current, target: [...s.pos], distance });
    else this.controller.transitionTo({ target: [...s.pos], distance });
    this.invalidate();
  }

  /**
   * Centres a system and draws back far enough to show the others too, within the stage (never
   * closer than now): for choosing where a ship goes, with every place it can go in view.
   */
  frameAround(centre: SystemId, around: readonly SystemId[]): void {
    const c = this.content.systems[this.index.get(centre) ?? -1];
    if (!c) return;
    const pts = [c, ...around.map((id) => this.content.systems[this.index.get(id) ?? -1])]
      .filter((x) => x !== undefined)
      .map((x) => x.pos);
    const s = this.controller.current;
    const fit = fitOrbitDistance(
      pts,
      c.pos,
      s.yaw,
      s.pitch,
      MAP_FOV_DEG,
      this.stage.w,
      this.stage.h,
      this.height,
      40,
      3,
      60,
    );
    this.controller.transitionTo({ target: [...c.pos], distance: Math.max(s.distance, fit) });
    this.invalidate();
  }

  /** Frames the whole neighbourhood. */
  showAll(): void {
    const s = this.controller.current;
    const pts = this.content.systems.map((x) => x.pos);
    const d = fitOrbitDistance(
      pts,
      [0, 0, 0],
      s.yaw,
      s.pitch,
      MAP_FOV_DEG,
      this.stage.w,
      this.stage.h,
      this.height,
      16,
      2,
      120,
    );
    this.controller.transitionTo({ target: [0, 0, 0], distance: d });
    this.invalidate();
  }

  /** For the keyboard and on-screen buttons. */
  panBy(dxPx: number, dyPx: number): void {
    this.controller.pan(dxPx, dyPx, this.height, MAP_FOV_DEG);
    this.invalidate();
  }

  rotateBy(dYaw: number, dPitch: number): void {
    if (this.mode !== '3d') return;
    this.controller.rotate(dYaw, dPitch);
    this.invalidate();
  }

  zoomBy(factor: number): void {
    this.controller.zoom(factor);
    this.invalidate();
  }

  /** The ships to draw: one chevron per power at each system, and one for each blind jump. */
  /** The ship marks last drawn (read by the browser tests). */
  shipMarks: readonly ShipMark[] = [];

  setShips(marks: readonly ShipMark[]): void {
    this.shipMarks = marks;
    if (this.ships) {
      this.scene.remove(this.ships);
      this.ships.geometry.dispose();
      this.ships = null;
    }
    const at = (id: SystemId | undefined) => this.content.systems[this.index.get(id ?? '') ?? -1]?.pos;
    const items: { pos: readonly number[]; colour: string; offset: [number, number] }[] = [];
    const seen = new Map<string, number>();
    for (const m of marks) {
      if (m.at) {
        const key = `${m.at}|${m.colour}`;
        if (seen.has(key)) continue;
        seen.set(key, 1);
        const pos = at(m.at);
        // Powers at the same system sit one above another.
        const n = [...seen.keys()].filter((k) => k.startsWith(`${m.at}|`)).length - 1;
        if (pos) items.push({ pos, colour: m.colour, offset: [19, 17 + n * 15] });
      } else {
        const a = at(m.from);
        const b = at(m.to);
        const t = Math.max(0, Math.min(1, m.progress ?? 0.5));
        if (a && b)
          items.push({
            pos: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
            colour: m.colour,
            offset: [0, 0],
          });
      }
    }
    if (items.length > 0) {
      const colour = new THREE.Color();
      const pos = new Float32Array(items.length * 3);
      const tint = new Float32Array(items.length * 3);
      const offset = new Float32Array(items.length * 2);
      items.forEach((it, i) => {
        pos.set(it.pos, i * 3);
        colour.set(it.colour);
        tint.set([colour.r, colour.g, colour.b], i * 3);
        offset.set(it.offset, i * 2);
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('tint', new THREE.BufferAttribute(tint, 3));
      g.setAttribute('offset', new THREE.BufferAttribute(offset, 2));
      this.ships = new THREE.Points(g, this.shipMaterial);
      this.ships.renderOrder = 5;
      this.scene.add(this.ships);
    }
    this.invalidate(false);
  }

  /** Routes to draw: the one being planned, bright, and ships' standing orders, fainter. */
  setRoutes(routes: readonly MapRoute[]): void {
    for (const line of this.routeLines) {
      this.scene.remove(line);
      line.geometry.dispose();
    }
    this.routeLines.length = 0;
    const at = (id: SystemId) => this.content.systems[this.index.get(id) ?? -1]?.pos;
    for (const r of routes) {
      const pts: number[] = [];
      for (let i = 1; i < r.systems.length; i++) {
        const a = at(r.systems[i - 1] as SystemId);
        const b = at(r.systems[i] as SystemId);
        if (a && b) pts.push(...a, ...b);
      }
      if (pts.length === 0) continue;
      const g = new LineSegmentsGeometry();
      g.setPositions(pts);
      const material =
        this.routeMaterials[r.kind === 'plan' ? (r.blind ? 'planBlind' : 'plan') : r.blind ? 'ordersBlind' : 'orders'];
      const line = new LineSegments2(g, material);
      if (r.blind) line.computeLineDistances();
      line.renderOrder = r.kind === 'plan' ? 2 : 1;
      this.scene.add(line);
      this.routeLines.push(line);
    }
    this.invalidate(false);
  }

  dispose(): void {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.detach();
    for (const o of [
      this.stars,
      this.marks,
      this.highlight,
      this.openLanes,
      this.tuningLanes,
      this.darkLanes,
      this.drops,
      this.fields,
      this.sparks,
    ])
      o.geometry.dispose();
    this.endFlights();
    this.dropSky();
    for (const child of this.grid.children) (child as THREE.LineLoop).geometry.dispose();
    this.ships?.geometry.dispose();
    for (const line of this.routeLines) line.geometry.dispose();
    for (const d of this.disposables) d.dispose();
    this.renderer.dispose();
    this.canvas.remove();
    this.labelLayer.remove();
  }
}
