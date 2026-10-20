// A colony as a living diorama (docs/design/COLONY_VIEW.md §2): its sky drawn in a shader in its
// star's colour, the painted landscape of its world's ground, and its painted buildings in their
// slots, each on a soft contact shadow, all in the star's light with haze over the far land; and
// life (colonyLife.ts): a slow day with lights coming on at dusk, people walking between doors,
// rovers, the shuttle on the shipyard's pad, the weather; and small props between the buildings.
// Seen from a ridge with an orthographic
// camera, wider than the screen: drag to pan, pinch or the wheel to zoom, tap a building for its
// card. It borrows the map's renderer while the map pauses, as the system view does, so a phone
// keeps one WebGL context. With reduced motion nothing moves: a still scene in late-afternoon light.

import * as THREE from 'three';
import { type LandscapeArt, STRUCTURES } from '../content/colonyArt.ts';
import {
  dayLight,
  shuttleAt,
  type Walker,
  type Weather,
  walkerAt,
  walkers,
  weatherAmount,
  weatherOf,
} from './colonyLife.ts';
import { artUrl, METRE, type Placed, type PlacedProp, placeAll, placeProps, townBounds } from './colonyPlace.ts';
import type { ColonyScene, SceneBuilding } from './colonyScene.ts';
import { GestureTracker } from './gestures.ts';
import type { Rect } from './mapMath.ts';

/** Sky kept above the landscape picture's top edge, in landscape heights. */
const SKY_ROOM = 0.9;

const VERTEX = /* glsl */ `
varying vec2 vUv;
varying float vWorldY;
void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldY = world.y;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

// The sky, in screen space: its colours from the horizon to the zenith, stars where there is no air
// and at night, the sun's disc and glow. Colours are sRGB throughout, as the pictures are.
const SKY_FRAGMENT = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uSun;
uniform vec2 uSunPos;
uniform float uSunR;
uniform float uSunUp;
uniform float uAir;
uniform float uHorizonY;
uniform float uTop;
uniform float uStars;
uniform float uShift;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 fc = gl_FragCoord.xy;
  float h = clamp((fc.y - uHorizonY) / max(1.0, uTop - uHorizonY), 0.0, 1.0);
  vec3 col = mix(uHorizon, uZenith, pow(h, 0.55));
  vec2 cell = floor((fc + vec2(uShift, 0.0)) / 2.0);
  float s = hash(cell);
  col += uStars * step(0.9972, s) * (0.35 + 0.65 * hash(cell + 1.7)) * vec3(0.9, 0.93, 1.0);
  float d = length(fc - uSunPos);
  col += uSun * exp(-d / (uSunR * (2.5 + uAir * 4.0))) * 0.6 * uSunUp;
  float disc = (1.0 - smoothstep(uSunR - 1.0, uSunR + 1.0, d)) * step(uHorizonY, fc.y) * uSunUp;
  col = mix(col, mix(uSun, vec3(1.0), 0.6), disc);
  gl_FragColor = vec4(col, 1.0);
}`;

// A painted picture (premultiplied) in the star's light, hazed towards the horizon (the landscape)
// or by its distance (a building), revealed from its foot up to uReveal (a scaffold rising), and
// mirrored for a vehicle going the other way. At night it darkens, but its lit windows and lights,
// the small bright, coloured spots brighter than what is round them, glow on (uGlow).
const ART_FRAGMENT = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uLight;
uniform vec3 uHaze;
uniform float uHazeAmount;
uniform float uHazeBand;
uniform float uHorizonY;
uniform float uReveal;
uniform float uOpacity;
uniform float uFlip;
uniform float uNight;
uniform float uGlow;
uniform float uHighlight;
varying vec2 vUv;
varying float vWorldY;
void main() {
  if (vUv.y > uReveal) discard;
  vec2 uv = vec2(uFlip > 0.5 ? 1.0 - vUv.x : vUv.x, vUv.y);
  vec4 t = texture2D(uMap, uv);
  if (t.a < 0.002) discard;
  vec3 c = t.rgb * uLight;
  float k = uHazeBand > 0.0 ? uHazeAmount * (1.0 - smoothstep(0.0, uHazeBand, uHorizonY - vWorldY)) : uHazeAmount;
  c = mix(c, uHaze * t.a, k * (1.0 - 0.6 * uNight));
  c = mix(c, c * vec3(0.22, 0.26, 0.42), uNight);
  if (uGlow > 0.0 && uNight > 0.0) {
    vec4 b = texture2D(uMap, uv, 3.0);
    vec3 s = t.rgb / t.a;
    vec3 sb = b.rgb / max(b.a, 0.001);
    float l = dot(s, vec3(0.3, 0.59, 0.11));
    float lb = dot(sb, vec3(0.3, 0.59, 0.11));
    float mx = max(s.r, max(s.g, s.b));
    float mn = min(s.r, min(s.g, s.b));
    float sat = mx > 0.0 ? (mx - mn) / mx : 0.0;
    float m = smoothstep(0.06, 0.18, l - lb) * smoothstep(0.38, 0.52, sat) * smoothstep(0.48, 0.68, mx);
    c += t.rgb * m * uNight * uGlow * 2.4;
  }
  c += t.rgb * uHighlight * vec3(0.22, 0.32, 0.4);
  gl_FragColor = vec4(c, t.a) * uOpacity;
}`;

// A soft round shape: a contact shadow (dark, normal blending) or a glow (light, added).
const SOFT_FRAGMENT = /* glsl */ `
uniform vec3 uColour;
uniform float uAlpha;
varying vec2 vUv;
void main() {
  float r = length((vUv - 0.5) * 2.0);
  float a = uAlpha * (1.0 - smoothstep(0.0, 1.0, r));
  gl_FragColor = vec4(uColour * a, a);
}`;

// A walking figure from the people's sheet: two frames side by side, mirrored to face left.
const FIGURE_FRAGMENT = /* glsl */ `
uniform sampler2D uMap;
uniform float uFrame;
uniform float uFlip;
uniform float uNight;
varying vec2 vUv;
void main() {
  float x = uFlip > 0.5 ? 1.0 - vUv.x : vUv.x;
  vec4 t = texture2D(uMap, vec2((x + uFrame) * 0.5, vUv.y));
  if (t.a < 0.01) discard;
  gl_FragColor = vec4(mix(t.rgb, t.rgb * vec3(0.25, 0.28, 0.4), uNight), t.a);
}`;

// The weather, drawn in screen space: each drop or mote falls (or drifts) and wraps round the view.
const WEATHER_VERTEX = /* glsl */ `
attribute vec3 seed;
uniform float uTime;
uniform vec2 uWind;
uniform float uSize;
uniform float uShift;
uniform float uBand;
varying float vSeed;
void main() {
  vSeed = seed.z;
  vec2 p = fract(seed.xy + uWind * uTime * (0.6 + 0.8 * seed.z) + vec2(uShift, 0.0));
  // Dust keeps low over the ground (the band of the view's foot); snow, rain and ash fill it.
  p.y *= uBand;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = uSize * (0.6 + 0.8 * seed.z);
}`;

const WEATHER_FRAGMENT = /* glsl */ `
uniform vec3 uColour;
uniform float uAlpha;
uniform float uStreak;
varying float vSeed;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  d.x *= mix(1.0, 6.0, uStreak);
  float a = uAlpha * (1.0 - smoothstep(0.15, 0.5, length(d))) * (0.5 + 0.5 * vSeed);
  gl_FragColor = vec4(uColour * a, a);
}`;

const WEATHER_LOOK: Record<
  NonNullable<Weather>,
  { colour: string; wind: [number, number]; size: number; streak: number; band: number }
> = {
  dust: { colour: '#e2cfae', wind: [0.035, 0.006], size: 5, streak: 0, band: 0.42 },
  snow: { colour: '#f2f6ff', wind: [0.012, -0.05], size: 4, streak: 0, band: 1 },
  rain: { colour: '#b8c8de', wind: [0.01, -0.6], size: 10, streak: 1, band: 1 },
  ash: { colour: '#8a8079', wind: [0.02, -0.025], size: 3.5, streak: 0, band: 1 },
};

function colour(hex: string): THREE.Vector3 {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

function mixColour(a: string, b: string, t: number): THREE.Vector3 {
  const x = new THREE.Color(a);
  x.lerp(new THREE.Color(b), t);
  return new THREE.Vector3(x.r, x.g, x.b);
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export interface ColonyViewOptions {
  reducedMotion: boolean;
  quality: 'low' | 'medium' | 'high';
  /** Where the pictures are served from (import.meta.env.BASE_URL). */
  base: string;
}

export interface ColonyViewEvents {
  /** A building tapped or clicked, or none (the ground). */
  select?(building: SceneBuilding | null): void;
}

type Mesh = THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;

interface BuildingMesh {
  placed: Placed;
  mesh: Mesh;
  shadow: Mesh;
  /** What the picture covers, coarsely, for finding what a tap touched. */
  alpha: { w: number; h: number; data: Uint8ClampedArray } | null;
}

/** A prop between the buildings: drawn like one, but never chosen by a tap. */
interface PropMesh {
  placed: PlacedProp;
  mesh: Mesh;
  shadow: Mesh;
}

interface Figure {
  walker: Walker;
  mesh: Mesh;
}

interface Vehicle {
  walker: Walker;
  mesh: Mesh;
  lights: Mesh;
  metres: number;
}

/** Something that happened, played once: a project finished (a flash and dust), new homes rising. */
interface Moment {
  slot: number;
  kind: 'built' | 'rise';
  start: number;
}

/** The camera: the world point at the stage's middle, and pixels to a world unit (a landscape height). */
interface View {
  cx: number;
  cy: number;
  k: number;
}

const MOMENT_SECONDS = 1.6;

export class ColonyView {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly canvas: HTMLCanvasElement;
  private readonly container: HTMLElement;
  private readonly land: LandscapeArt;
  private readonly opts: ColonyViewOptions;
  private readonly events: ColonyViewEvents;
  private readonly three = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  private readonly loader = new THREE.TextureLoader();
  private readonly textures = new Map<string, Promise<THREE.Texture>>();
  private readonly gestures: GestureTracker;
  private readonly detach: () => void;
  private readonly savedToneMapping: THREE.ToneMapping;
  private readonly sky: Mesh;
  /** The sky shader's uniforms, kept to set each frame. */
  private readonly skyU = {
    uZenith: { value: new THREE.Vector3() },
    uHorizon: { value: new THREE.Vector3() },
    uSun: { value: new THREE.Vector3() },
    uSunPos: { value: new THREE.Vector2() },
    uSunR: { value: 4 },
    uSunUp: { value: 1 },
    uAir: { value: 1 },
    uHorizonY: { value: 0 },
    uTop: { value: 1 },
    uStars: { value: 0 },
    uShift: { value: 0 },
  };
  /** Shared by every picture: how dark it is, and the light. */
  private readonly nightU = { value: 0 };
  private readonly lightU = { value: new THREE.Vector3(1, 1, 1) };
  private landMesh: Mesh | null = null;
  private buildings: BuildingMesh[] = [];
  private props: PropMesh[] = [];
  private figures: Figure[] = [];
  private vehicles: Vehicle[] = [];
  private shuttle: { mesh: Mesh; glow: Mesh; pad: Placed } | null = null;
  /** The power's mark, glowing above the capital's hall. */
  private emblem: { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>; y: number } | null = null;
  private weather: {
    points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
    kind: NonNullable<Weather>;
  } | null = null;
  private readonly figureMaterials: THREE.ShaderMaterial[] = [];
  private figureSheet: THREE.CanvasTexture | null = null;
  private moments: Moment[] = [];
  private selected: number | null = null;
  private scene: ColonyScene;
  private stage: Rect = { x: 0, y: 0, w: 1, h: 1 };
  private view: View = { cx: 1, cy: 0.5, k: 300 };
  private framed = false;
  private frame = 0;
  private lastTime = 0;
  private dirty = true;
  /** Milliseconds between frames while only life moves: at least 30, more on a slow device. */
  private ambientGap = 33;
  /** Seconds of the scene's own day: it stands still with reduced motion. */
  private clock = 0;
  private disposed = false;
  private loading: Promise<void>;
  /** Width over height of the world: the landscape is 1 high. */
  private readonly A: number;

  /** Resolves once the pictures are in and the first frame is drawn. */
  readonly ready: Promise<void>;

  constructor(
    renderer: THREE.WebGLRenderer,
    container: HTMLElement,
    scene: ColonyScene,
    land: LandscapeArt,
    opts: ColonyViewOptions,
    events: ColonyViewEvents = {},
  ) {
    this.renderer = renderer;
    this.canvas = renderer.domElement;
    this.container = container;
    this.scene = scene;
    this.land = land;
    this.opts = opts;
    this.events = events;
    this.A = land.aspect;
    this.savedToneMapping = renderer.toneMapping;
    renderer.toneMapping = THREE.NoToneMapping;
    // Each colony starts its day at its own hour, late in the morning or the afternoon.
    this.clock = 10 + (scene.holding % 7) * 3.5;

    this.sky = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: SKY_FRAGMENT,
        uniforms: this.skyU,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.sky.frustumCulled = false;
    this.sky.renderOrder = 0;
    this.three.add(this.sky);
    this.setSky();

    this.gestures = new GestureTracker({
      rotate: (dx, dy) => this.panBy(dx, dy),
      pan: (dx, dy) => this.panBy(dx, dy),
      zoom: (factor, x, y) => this.zoomAt(1 / factor, x, y),
      tap: (x, y, type) => this.tapAt(x, y, type),
      doubleTap: (x, y) => this.zoomAt(1.6, x, y),
    });
    this.detach = this.attachInput();
    this.loading = this.build();
    this.ready = this.loading.then(
      () =>
        new Promise<void>((done) => {
          requestAnimationFrame((t) => {
            this.draw(t);
            this.container.dataset.colonyReady = '1';
            done();
          });
        }),
    );
  }

  // ---------------------------------------------------------------- building

  private get width(): number {
    return Math.max(1, this.canvas.clientWidth);
  }

  private get height(): number {
    return Math.max(1, this.canvas.clientHeight);
  }

  private dpr(): number {
    return this.renderer.getPixelRatio();
  }

  private get still(): boolean {
    return this.opts.reducedMotion;
  }

  private texture(url: string): Promise<THREE.Texture> {
    let t = this.textures.get(url);
    if (!t) {
      t = this.loader.loadAsync(url).then((tex) => {
        tex.colorSpace = THREE.NoColorSpace;
        tex.premultiplyAlpha = true;
        tex.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
        tex.needsUpdate = true;
        return tex;
      });
      this.textures.set(url, t);
    }
    return t;
  }

  /** How wide a picture will be on screen at the view's sharpest, in device pixels, to choose its file. */
  private wantedWidth(worldWidth: number): number {
    if (this.opts.quality === 'low') return 1;
    const k = Math.max(this.view.k, this.fitK() * 1.6);
    return worldWidth * k * this.dpr();
  }

  private artMaterial(map: THREE.Texture, haze: { amount: number; band: number }, glow: number): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: ART_FRAGMENT,
      uniforms: {
        uMap: { value: map },
        uLight: this.lightU,
        uHaze: { value: colour(this.scene.sky.horizon) },
        uHazeAmount: { value: haze.amount },
        uHazeBand: { value: haze.band },
        uHorizonY: { value: 1 - this.land.horizon },
        uReveal: { value: 1 },
        uOpacity: { value: 1 },
        uFlip: { value: 0 },
        uNight: this.nightU,
        uGlow: { value: glow },
        uHighlight: { value: 0 },
      },
      transparent: true,
      premultipliedAlpha: true,
      depthTest: false,
      depthWrite: false,
    });
  }

  private softMesh(hex: string, alpha: number, additive: boolean): Mesh {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: SOFT_FRAGMENT,
        uniforms: { uColour: { value: colour(hex) }, uAlpha: { value: alpha } },
        transparent: true,
        premultipliedAlpha: true,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthTest: false,
        depthWrite: false,
      }),
    );
    return mesh;
  }

  private async build(): Promise<void> {
    const land = await this.texture(artUrl(this.opts.base, 'landscape', this.land.id, this.wantedWidth(this.A)));
    if (this.disposed) return;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.A, 1),
      this.artMaterial(land, { amount: this.scene.sky.haze * 0.7, band: 0.22 }, 0),
    );
    mesh.position.set(this.A / 2, 0.5, 0);
    mesh.renderOrder = 1;
    this.three.add(mesh);
    this.landMesh = mesh;
    this.buildWeather();
    await this.buildBuildings();
  }

  /** How many people walk about: fewer on the low quality setting. */
  private peopleCount(): number {
    return Math.min(this.opts.quality === 'low' ? 20 : 40, this.scene.people);
  }

  private async buildBuildings(): Promise<void> {
    const placed = placeAll(this.scene, this.land);
    const propsPlaced = placeProps(this.scene, this.land, placed);
    const maps = await Promise.all(
      placed.map((p) => this.texture(artUrl(this.opts.base, 'structure', p.art.id, this.wantedWidth(p.w * this.A)))),
    );
    const propMaps = await Promise.all(
      // A prop's picture fits a square: its size is its longer side.
      propsPlaced.map((p) =>
        this.texture(artUrl(this.opts.base, 'prop', p.art.id, this.wantedWidth(Math.max(p.w * this.A, p.h)))),
      ),
    );
    const shuttleArt = STRUCTURES[`${this.scene.architecture}-shuttle`];
    const yard = placed.find((p) => p.building.kind === 'shipyard');
    const roverArt = STRUCTURES.rover;
    const [shuttleMap, roverMap] = await Promise.all([
      shuttleArt && yard ? this.texture(artUrl(this.opts.base, 'structure', shuttleArt.id, 300)) : null,
      roverArt ? this.texture(artUrl(this.opts.base, 'structure', roverArt.id, 200)) : null,
    ]);
    if (this.disposed) return;
    for (const b of this.buildings) this.drop(b.mesh, b.shadow);
    this.buildings = placed.map((p, i) => {
      const map = maps[i] as THREE.Texture;
      const w = p.w * this.A;
      const h = p.h;
      const far = Math.max(0, Math.min(1, 1 - (p.v - this.land.horizon) / 0.45));
      const mesh: Mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        this.artMaterial(map, { amount: this.scene.sky.haze * far * 0.35, band: 0 }, 1),
      );
      const baseY = 1 - p.v;
      mesh.position.set(p.u * this.A, baseY + h / 2, 0);
      mesh.renderOrder = 3 + i * 2 + 1;
      const shadow = this.softMesh('#0a0806', 0.42, false);
      shadow.scale.set(w * 1.2, w * 0.36, 1);
      shadow.position.set(p.u * this.A + w * 0.08, baseY + h * 0.05, 0);
      shadow.renderOrder = 3 + i * 2;
      this.three.add(shadow, mesh);
      return { placed: p, mesh, shadow, alpha: alphaOf(map) };
    });
    for (const p of this.props) this.drop(p.mesh, p.shadow);
    this.props = propsPlaced.map((p, i) => {
      const w = p.w * this.A;
      const far = Math.max(0, Math.min(1, 1 - (p.v - this.land.horizon) / 0.45));
      const mesh: Mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(w, p.h),
        this.artMaterial(propMaps[i] as THREE.Texture, { amount: this.scene.sky.haze * far * 0.35, band: 0 }, 1),
      );
      const baseY = 1 - p.v;
      mesh.position.set(p.u * this.A, baseY + p.h / 2, 0);
      // In depth among the buildings, just behind anyone walking at the same depth.
      const behind = placed.filter((b) => b.v <= p.v).length;
      mesh.renderOrder = 3 + behind * 2 - 0.6;
      const shadow = this.softMesh('#0a0806', 0.36, false);
      shadow.scale.set(w * 1.2, w * 0.32, 1);
      shadow.position.set(p.u * this.A + w * 0.08, baseY + p.h * 0.04, 0);
      shadow.renderOrder = mesh.renderOrder - 0.1;
      this.three.add(shadow, mesh);
      return { placed: p, mesh, shadow };
    });
    this.applyScaffolds();
    this.buildEmblem();
    this.buildLife(
      placed,
      shuttleMap && yard && shuttleArt ? { map: shuttleMap, pad: yard, metres: shuttleArt.metres } : null,
      roverMap,
    );
    this.setSelected(this.selected);
    this.invalidate();
  }

  /** The owner's mark in its colour, like a hologram above the capital's hall (COLONY_VIEW.md §1). */
  private buildEmblem(): void {
    if (this.emblem) {
      this.three.remove(this.emblem.mesh);
      this.emblem.mesh.geometry.dispose();
      this.emblem.mesh.material.map?.dispose();
      this.emblem.mesh.material.dispose();
      this.emblem = null;
    }
    const hall = this.buildings.find((b) => b.placed.building.kind === 'hall');
    if (!hall) return;
    const p = hall.placed;
    const size = 14 * this.metreAt(p.v);
    const map = new THREE.CanvasTexture(markSheet(this.scene.mark, this.scene.colour));
    map.colorSpace = THREE.NoColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({ map, transparent: true, depthTest: false, depthWrite: false }),
    );
    const y = 1 - p.v + p.h + size * 0.45;
    mesh.position.set(p.u * this.A, y, 0);
    mesh.renderOrder = hall.mesh.renderOrder + 0.05;
    this.three.add(mesh);
    this.emblem = { mesh, y };
  }

  /** People, rovers and the shuttle, set out again whenever the buildings are. */
  private buildLife(
    placed: Placed[],
    shuttle: { map: THREE.Texture; pad: Placed; metres: number } | null,
    roverMap: THREE.Texture | null,
  ): void {
    for (const f of this.figures) this.three.remove(f.mesh);
    this.figures[0]?.mesh.geometry.dispose();
    for (const v of this.vehicles) this.drop(v.mesh, v.lights);
    if (this.shuttle) this.drop(this.shuttle.mesh, this.shuttle.glow);
    this.figures = [];
    this.vehicles = [];
    this.shuttle = null;
    if (this.still) return;
    const seed = this.scene.holding * 977 + 13;
    if (this.figureMaterials.length === 0) this.makeFigures();
    const geometry = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
    this.figures = walkers(placed, this.peopleCount(), seed, 'people').map((walker) => {
      const mesh: Mesh = new THREE.Mesh(geometry, this.figureMaterials[0]);
      this.three.add(mesh);
      return { walker, mesh };
    });
    const works = placed.filter((p) => p.building.kind !== 'homes').length;
    if (roverMap && works > 0) {
      const art = STRUCTURES.rover;
      const count = this.opts.quality === 'high' ? 2 : 1;
      this.vehicles = walkers(placed, count, seed + 1, 'rovers').map((walker) => {
        const mesh: Mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0),
          this.artMaterial(roverMap, { amount: 0, band: 0 }, 1),
        );
        const lights = this.softMesh('#ffe7b0', 0.9, true);
        this.three.add(mesh, lights);
        return { walker, mesh, lights, metres: art?.metres ?? 9 };
      });
    }
    if (shuttle) {
      const mesh: Mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0),
        this.artMaterial(shuttle.map, { amount: 0, band: 0 }, 1),
      );
      const glow = this.softMesh('#ffb070', 0.9, true);
      this.three.add(mesh, glow);
      this.shuttle = { mesh, glow, pad: shuttle.pad };
      mesh.userData.metres = shuttle.metres;
    }
  }

  /** The people's sheet, drawn once: two frames of a figure in the owner's colour, helmeted where needed. */
  private makeFigures(): void {
    const sheet = figureSheet(this.scene.colour, this.scene.envelope === 'domed');
    sheet.colorSpace = THREE.NoColorSpace;
    this.figureSheet = sheet;
    for (const frame of [0, 1])
      for (const flip of [0, 1])
        this.figureMaterials.push(
          new THREE.ShaderMaterial({
            vertexShader: VERTEX,
            fragmentShader: FIGURE_FRAGMENT,
            uniforms: { uMap: { value: sheet }, uFrame: { value: frame }, uFlip: { value: flip }, uNight: this.nightU },
            transparent: true,
            depthTest: false,
            depthWrite: false,
          }),
        );
  }

  private buildWeather(): void {
    const kind = weatherOf(this.scene.biome, this.scene.sky.atmosphere !== 'none');
    const count = this.still ? 0 : { low: 0, medium: 140, high: 260 }[this.opts.quality];
    if (!kind || count === 0) return;
    const look = WEATHER_LOOK[kind];
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < seeds.length; i++) seeds[i] = hashUnit(i * 7.13 + 1.7);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 3));
    const points = new THREE.Points(
      geometry,
      new THREE.ShaderMaterial({
        vertexShader: WEATHER_VERTEX,
        fragmentShader: WEATHER_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uWind: { value: new THREE.Vector2(...look.wind) },
          uSize: { value: look.size * this.dpr() },
          uShift: { value: 0 },
          uBand: { value: look.band },
          uColour: { value: colour(look.colour) },
          uAlpha: { value: 0.5 },
          uStreak: { value: look.streak },
        },
        transparent: true,
        premultipliedAlpha: true,
        depthTest: false,
        depthWrite: false,
      }),
    );
    points.frustumCulled = false;
    points.renderOrder = 900;
    this.three.add(points);
    this.weather = { points, kind };
  }

  private drop(...meshes: Mesh[]): void {
    for (const m of meshes) {
      this.three.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    }
  }

  private setSky(): void {
    const u = this.skyU;
    u.uSun.value.copy(colour(this.scene.sun.colour));
    u.uAir.value = { none: 0.15, thin: 0.6, dense: 1, toxic: 1.3 }[this.scene.sky.atmosphere];
  }

  /** The colony changed (a turn ended, something was queued): its buildings are set out again. */
  setScene(scene: ColonyScene): void {
    const before = this.scene;
    this.scene = scene;
    this.setSky();
    if (!this.still) {
      // What happened: a project finished where its scaffold stood; new homes.
      for (const b of scene.buildings) {
        const was = before.buildings.find((x) => x.slot === b.slot);
        if (b.kind !== 'homes' && b.kind !== 'scaffold' && was?.kind === 'scaffold')
          this.moments.push({ slot: b.slot, kind: 'built', start: this.clock });
        else if (b.kind === 'homes' && !was) this.moments.push({ slot: b.slot, kind: 'rise', start: this.clock });
      }
    }
    this.loading = this.loading.then(() => this.buildBuildings());
  }

  // ---------------------------------------------------------------- choosing a building

  /** The building whose picture is under a point (CSS pixels), nearest first; a finger reaches a little. */
  private buildingAt(x: number, y: number, pointerType: string): BuildingMesh | null {
    const front = [...this.buildings].sort((a, b) => b.placed.v - a.placed.v);
    for (const b of front) {
      const r = this.rectOf(b.placed);
      const fx = (x - r.x) / r.w;
      const fy = (y - r.y) / r.h;
      if (fx < 0 || fx > 1 || fy < 0 || fy > 1) continue;
      if (!b.alpha) return b;
      const ax = Math.min(b.alpha.w - 1, Math.floor(fx * b.alpha.w));
      const ay = Math.min(b.alpha.h - 1, Math.floor(fy * b.alpha.h));
      if ((b.alpha.data[ay * b.alpha.w + ax] ?? 0) > 60) return b;
    }
    if (pointerType === 'mouse') return null;
    // A finger: the nearest building within reach of its middle.
    let best: BuildingMesh | null = null;
    let bestD = 30;
    for (const b of front) {
      const r = this.rectOf(b.placed);
      const d = Math.hypot(x - (r.x + r.w / 2), y - (r.y + r.h * 0.65)) - Math.min(r.w, r.h) / 2;
      if (d < bestD) {
        best = b;
        bestD = d;
      }
    }
    return best;
  }

  private tapAt(x: number, y: number, pointerType: string): void {
    const b = this.buildingAt(x, y, pointerType);
    this.setSelected(b ? b.placed.building.slot : null);
    this.events.select?.(b ? b.placed.building : null);
  }

  /** Lights a building (by its slot), or none. */
  setSelected(slot: number | null): void {
    this.selected = slot;
    for (const b of this.buildings) {
      const u = b.mesh.material.uniforms.uHighlight;
      if (u) u.value = b.placed.building.slot === slot ? 1 : 0;
    }
    this.invalidate();
  }

  // ---------------------------------------------------------------- the camera

  /** Pixels to a world unit that shows the whole landscape's width, or the stage's height of it and sky. */
  private fitK(): number {
    return Math.max(this.stage.w / this.A, this.stage.h / (1 + SKY_ROOM));
  }

  private maxK(): number {
    return Math.max(this.fitK() * 1.05, this.stage.h / 0.32);
  }

  /** Keeps the view on the picture: never past its sides or below its foot, nor too far up the sky. */
  private clamp(v: View): View {
    const k = Math.min(this.maxK(), Math.max(this.fitK(), v.k));
    const halfW = this.stage.w / 2 / k;
    const halfH = this.stage.h / 2 / k;
    const cx = halfW * 2 >= this.A ? this.A / 2 : Math.min(this.A - halfW, Math.max(halfW, v.cx));
    const cy = Math.min(1 + SKY_ROOM - halfH, Math.max(halfH, v.cy));
    return { cx, cy, k };
  }

  /**
   * Frames the town: from just below its foot to a little sky above the horizon, filling the
   * stage's height, centred on the town; a frame narrower than the town is panned along it.
   * The frame keeps its foot and shows more sky rather than cut the town's middle off.
   */
  showTown(): void {
    const t = townBounds(placeAll(this.scene, this.land));
    const skyAbove = this.stage.h > this.stage.w ? 0.3 : 0.22;
    const top = 1 - this.land.horizon + skyAbove;
    const foot = 1 - t.bottom - 0.05;
    const needH = top - foot;
    // Fill the height, but give up to half as much again to sky to fit more of the town's width.
    const townW = (t.right - t.left) * this.A;
    const k = Math.max(this.stage.h / (needH * 1.45), Math.min(this.stage.h / needH, this.stage.w / (townW * 1.05)));
    this.view = this.clamp({ cx: ((t.left + t.right) / 2) * this.A, cy: foot + this.stage.h / 2 / k, k });
    this.invalidate();
  }

  /** The part of the canvas not covered by bars and sheets. */
  setStage(stage: Rect): void {
    this.stage = stage;
    if (!this.framed && stage.w > 1) {
      this.framed = true;
      this.showTown();
    } else this.view = this.clamp(this.view);
    this.invalidate();
  }

  panBy(dx: number, dy: number): void {
    this.view = this.clamp({ ...this.view, cx: this.view.cx - dx / this.view.k, cy: this.view.cy + dy / this.view.k });
    this.invalidate();
  }

  /** Zooms by a factor (more than 1 is closer) about a point on the canvas. */
  zoomAt(factor: number, x: number, y: number): void {
    const before = this.toWorld(x, y);
    const k = this.view.k * factor;
    const next = this.clamp({ ...this.view, k });
    // Keep the point under the finger where it was.
    const sx = this.stage.x + this.stage.w / 2;
    const sy = this.stage.y + this.stage.h / 2;
    this.view = this.clamp({ k: next.k, cx: before.x - (x - sx) / next.k, cy: before.y + (y - sy) / next.k });
    this.invalidate();
  }

  zoomBy(factor: number): void {
    this.zoomAt(factor, this.stage.x + this.stage.w / 2, this.stage.y + this.stage.h / 2);
  }

  /** A canvas point (CSS pixels) in the world. */
  private toWorld(x: number, y: number): { x: number; y: number } {
    const sx = this.stage.x + this.stage.w / 2;
    const sy = this.stage.y + this.stage.h / 2;
    return { x: this.view.cx + (x - sx) / this.view.k, y: this.view.cy - (y - sy) / this.view.k };
  }

  /** A world point on the canvas (CSS pixels). */
  private toScreen(x: number, y: number): { x: number; y: number } {
    const sx = this.stage.x + this.stage.w / 2;
    const sy = this.stage.y + this.stage.h / 2;
    return { x: sx + (x - this.view.cx) * this.view.k, y: sy - (y - this.view.cy) * this.view.k };
  }

  /** Where a building's picture is on the canvas (CSS pixels). */
  private rectOf(p: { u: number; v: number; w: number; h: number }): { x: number; y: number; w: number; h: number } {
    const foot = this.toScreen(p.u * this.A, 1 - p.v);
    const w = p.w * this.A * this.view.k;
    const h = p.h * this.view.k;
    return { x: foot.x - w / 2, y: foot.y - h, w, h };
  }

  // ---------------------------------------------------------------- drawing

  /** Whether anything moves on its own: never with reduced motion. */
  get animating(): boolean {
    return !this.still;
  }

  invalidate(): void {
    this.dirty = true;
    this.schedule();
  }

  private schedule(): void {
    if (!this.frame && !this.disposed) this.frame = requestAnimationFrame((t) => this.draw(t));
  }

  /** Draw order for something standing at a depth: in front of the buildings behind it, behind those before it. */
  private orderAt(v: number): number {
    let n = 0;
    for (const b of this.buildings) if (b.placed.v <= v) n++;
    return 3 + n * 2 - 0.25;
  }

  /** How big a metre is at a depth, in world units. */
  private metreAt(v: number): number {
    return METRE * Math.max(0.01, v - this.land.horizon) * this.A;
  }

  private draw(time: number): void {
    this.frame = 0;
    if (this.disposed) return;
    // Only life is moving: at most 30 frames a second, fewer on a slow device.
    if (!this.dirty && this.lastTime && time - this.lastTime < this.ambientGap) {
      this.schedule();
      return;
    }
    const ambientOnly = !this.dirty;
    const interval = this.lastTime ? time - this.lastTime : 0;
    const started = performance.now();
    const dt = this.lastTime ? Math.min(0.1, (time - this.lastTime) / 1000) : 0;
    this.lastTime = time;
    this.dirty = false;
    if (!this.still) this.clock += dt;

    const w = this.width;
    const h = this.height;
    const { cx, cy, k } = this.view;
    const sx = this.stage.x + this.stage.w / 2;
    const sy = this.stage.y + this.stage.h / 2;
    const cam = this.camera;
    cam.left = cx - sx / k;
    cam.right = cx + (w - sx) / k;
    cam.top = cy + sy / k;
    cam.bottom = cy - (h - sy) / k;
    cam.updateProjectionMatrix();

    const light = dayLight(this.clock, { locked: this.scene.sun.locked, still: this.still });
    this.nightU.value = light.night;
    this.drawSky(light.night, light.sun);
    this.drawLife(light.night);
    this.drawMoments();

    this.renderer.render(this.three, cam);
    const cost = performance.now() - started;
    const behind = ambientOnly && interval > this.ambientGap * 1.6 ? interval * 1.25 : 0;
    this.ambientGap = Math.min(400, this.ambientGap * 0.7 + Math.max(33, cost * 5, behind) * 0.3);
    if (this.animating || this.moments.length > 0) this.schedule();
  }

  private drawSky(night: number, sun: number): void {
    const w = this.width;
    const h = this.height;
    const dpr = this.dpr();
    const u = this.skyU;
    const horizon = this.toScreen(0, 1 - this.land.horizon).y;
    const top = Math.max(0, this.toScreen(0, 1 + SKY_ROOM).y);
    const up = Math.sin(Math.PI * Math.min(1, Math.max(0, sun)));
    // Low sun and twilight: a warm horizon; night: the deep sky and its stars.
    const air = this.scene.sky.atmosphere === 'none' ? 0 : 1;
    const twilight = 4 * night * (1 - night);
    const dusk = air * Math.min(0.6, (sun <= 1 ? (1 - smooth(0, 0.35, up)) * 0.45 : 0) + twilight * 0.55);
    const horizonDay = mixColour(this.scene.sky.horizon, '#ff9c5c', dusk);
    const horizonNight = mixColour(this.scene.sky.horizon, '#0b1222', 0.88);
    u.uHorizon.value.copy(horizonDay).lerp(horizonNight, night);
    u.uZenith.value.copy(colour(this.scene.sky.zenith)).lerp(colour('#03050c'), night);
    u.uStars.value = Math.max(this.scene.sky.starsByDay ? 1 : 0, night);
    u.uHorizonY.value = (h - horizon) * dpr;
    u.uTop.value = h * dpr;
    // The sun crosses from the right to the left, low and still on a locked world. It moves a
    // little with the view, as something very far away does.
    const along = Math.min(1, Math.max(0, sun));
    const sunX = ((0.88 - 0.76 * along) * w - (this.view.cx - this.A / 2) * this.view.k * 0.08) * dpr;
    const sunY = horizon - Math.max(0.02 * h, (horizon - top) * 0.75 * up);
    u.uSunPos.value.set(sunX, (h - sunY) * dpr);
    u.uSunUp.value = sun <= 1 ? 1 : 0;
    u.uSunR.value = Math.max(2.5, Math.min(h * 0.08, this.scene.sun.size * 0.0045 * this.A * this.view.k)) * dpr;
    u.uShift.value = this.view.cx * this.view.k * 0.15 * dpr;
    // The pictures' light: the star's, warmer when it is low.
    this.lightU.value
      .copy(mixColour('#ffffff', this.scene.sun.colour, 0.45))
      .multiply(new THREE.Vector3(1, 1 - 0.15 * dusk, 1 - 0.3 * dusk));
  }

  private drawLife(night: number): void {
    const t = this.clock;
    const horizon = this.land.horizon;
    const frameOf = Math.floor(t * 4) % 2;
    for (const f of this.figures) {
      const p = walkerAt(f.walker, t, horizon);
      const m = this.metreAt(p.v);
      f.mesh.scale.set(m * 0.9, m * 1.8, 1);
      f.mesh.position.set(p.u * this.A, 1 - p.v, 0);
      f.mesh.material = this.figureMaterials[(p.moving ? frameOf : 1) * 2 + (p.facing < 0 ? 1 : 0)] ?? f.mesh.material;
      f.mesh.renderOrder = this.orderAt(p.v);
    }
    for (const v of this.vehicles) {
      const p = walkerAt(v.walker, t, horizon);
      const m = this.metreAt(p.v);
      const art = STRUCTURES.rover;
      const width = v.metres * m;
      const height = width / (art?.aspect ?? 1.3);
      v.mesh.scale.set(width, height, 1);
      v.mesh.position.set(p.u * this.A, 1 - p.v, 0);
      // The pictures face left; going right, mirrored.
      const flip = p.facing > 0 ? 1 : 0;
      const fu = v.mesh.material.uniforms.uFlip;
      if (fu) fu.value = flip;
      v.mesh.renderOrder = this.orderAt(p.v);
      const lights = v.lights.material.uniforms.uAlpha;
      if (lights) lights.value = 0.9 * night;
      v.lights.scale.set(width * 0.7, height * 0.5, 1);
      v.lights.position.set(p.u * this.A + (flip ? 0.42 : -0.42) * width, 1 - p.v + height * 0.32, 0);
      v.lights.renderOrder = v.mesh.renderOrder + 0.01;
    }
    if (this.shuttle) {
      const s = shuttleAt(t, this.scene.holding * 5);
      const pad = this.shuttle.pad;
      const m = this.metreAt(pad.v);
      const width = (this.shuttle.mesh.userData.metres as number) * m;
      const aspect = STRUCTURES[`${this.scene.architecture}-shuttle`]?.aspect ?? 1.4;
      const height = width / aspect;
      // The pad: the front left of the shipyard, where its pictures put it.
      const padX = (pad.u - pad.w * 0.2) * this.A;
      const padY = 1 - pad.v + pad.h * 0.06;
      this.shuttle.mesh.visible = !s.away;
      this.shuttle.glow.visible = !s.away && s.thrust > 0;
      const x = padX + s.across * width * 1.5;
      const y = padY + s.height * 0.45;
      this.shuttle.mesh.scale.set(width, height, 1);
      this.shuttle.mesh.position.set(x, y, 0);
      this.shuttle.mesh.renderOrder = this.orderAt(pad.v) + 0.1;
      this.shuttle.glow.scale.set(width * 0.6, height * 0.9, 1);
      this.shuttle.glow.position.set(x + width * 0.3, y + height * 0.1, 0);
      this.shuttle.glow.renderOrder = this.shuttle.mesh.renderOrder - 0.01;
      const g = this.shuttle.glow.material.uniforms.uAlpha;
      if (g) g.value = 0.85 * s.thrust;
    }
    if (this.emblem) this.emblem.mesh.position.y = this.emblem.y + Math.sin(t * 1.3) * this.emblem.mesh.scale.y * 0.004;
    if (this.weather) {
      const u = this.weather.points.material.uniforms;
      if (u.uTime) u.uTime.value = t;
      if (u.uShift) u.uShift.value = -(this.view.cx * this.view.k) / Math.max(1, this.width);
      if (u.uAlpha) u.uAlpha.value = 0.55 * weatherAmount(this.weather.kind, t) * (1 - 0.5 * night);
    }
  }

  private drawMoments(): void {
    if (this.moments.length === 0) return;
    this.moments = this.moments.filter((m) => this.clock - m.start < MOMENT_SECONDS);
    for (const b of this.buildings) {
      const m = this.moments.find((x) => x.slot === b.placed.building.slot);
      const f = m ? Math.min(1, (this.clock - m.start) / MOMENT_SECONDS) : 1;
      const reveal = b.mesh.material.uniforms.uReveal;
      const light = b.mesh.material.uniforms.uHighlight;
      if (m?.kind === 'rise' && reveal) reveal.value = smooth(0, 1, f);
      else if (b.placed.building.kind !== 'scaffold' && reveal) reveal.value = 1;
      if (m?.kind === 'built' && light) light.value = Math.max(this.selected === m.slot ? 1 : 0, 1.4 * (1 - f));
    }
  }

  /** A scaffold rises from its foot as industry goes in; set when the buildings are made. */
  private applyScaffolds(): void {
    for (const b of this.buildings) {
      const reveal = b.mesh.material.uniforms.uReveal;
      if (b.placed.building.kind === 'scaffold' && reveal) reveal.value = 0.3 + 0.7 * (b.placed.building.progress ?? 0);
    }
  }

  // ---------------------------------------------------------------- input

  private attachInput(): () => void {
    const el = this.canvas;
    const local = (e: PointerEvent | WheelEvent) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'touch' && !this.gestures.tracks('touch')) this.gestures.releaseAll();
      const p = local(e);
      if (this.gestures.down(e.pointerId, p.x, p.y, e.timeStamp, e.pointerType, true, e.button === 0))
        el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const p = local(e);
      if (this.gestures.activePointers > 0) {
        this.gestures.move(e.pointerId, p.x, p.y);
        return;
      }
      if (e.pointerType === 'mouse') el.style.cursor = this.buildingAt(p.x, p.y, 'mouse') ? 'pointer' : '';
    };
    const up = (e: PointerEvent) => {
      const p = local(e);
      this.gestures.up(e.pointerId, p.x, p.y, e.timeStamp);
    };
    const cancel = (e: PointerEvent) => this.gestures.cancel(e.pointerId);
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = local(e);
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      this.zoomAt(Math.exp(-delta * 0.0015), p.x, p.y);
    };
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
      el.style.cursor = '';
    };
  }

  // ---------------------------------------------------------------- for tests

  /** Every building drawn, where it is on the canvas (CSS pixels), for tests. */
  buildingsOnScreen(): { kind: string; slot: number; x: number; y: number; w: number; h: number }[] {
    return this.buildings.map((b) => ({
      kind: b.placed.building.kind,
      slot: b.placed.building.slot,
      ...this.rectOf(b.placed),
    }));
  }

  /**
   * A point (CSS pixels) where a building, by its slot, is what a click finds: on its picture and
   * not behind another; null if it is hidden or out of view. For tests.
   */
  pointOn(slot: number): { x: number; y: number } | null {
    const b = this.buildings.find((x) => x.placed.building.slot === slot);
    if (!b) return null;
    const r = this.rectOf(b.placed);
    for (const fy of [0.75, 0.6, 0.85, 0.45, 0.3])
      for (const fx of [0.5, 0.35, 0.65, 0.2, 0.8]) {
        const x = r.x + r.w * fx;
        const y = r.y + r.h * fy;
        if (x < this.stage.x || x > this.stage.x + this.stage.w || y < this.stage.y || y > this.stage.y + this.stage.h)
          continue;
        if (this.buildingAt(x, y, 'mouse') === b) return { x, y };
      }
    return null;
  }

  /** The view's middle and scale, for tests. */
  get look(): View {
    return { ...this.view };
  }

  /** Every prop drawn, where it is on the canvas (CSS pixels), for tests. */
  propsOnScreen(): { kind: string; x: number; y: number; w: number; h: number }[] {
    return this.props.map((p) => ({ kind: p.placed.prop.kind, ...this.rectOf(p.placed) }));
  }

  /** What is drawn and how dark it is, for tests. */
  get info(): { biome: string; architecture: string; buildings: number; props: number; pictures: string[] } {
    return {
      biome: this.scene.biome,
      architecture: this.scene.architecture,
      buildings: this.buildings.length,
      props: this.props.length,
      pictures: [...this.buildings.map((b) => b.placed.art.id), ...this.props.map((p) => p.placed.art.id)],
    };
  }

  /** Life in the scene, for tests. */
  get life(): {
    people: number;
    vehicles: number;
    shuttle: boolean;
    weather: string | null;
    night: number;
    clock: number;
  } {
    return {
      people: this.figures.length,
      vehicles: this.vehicles.length,
      shuttle: this.shuttle !== null,
      weather: this.weather?.kind ?? null,
      night: this.nightU.value,
      clock: this.clock,
    };
  }

  /** Sets the scene's hour, for tests and screenshots (seconds into its day). */
  setClock(seconds: number): void {
    this.clock = seconds;
    this.invalidate();
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.detach();
    this.gestures.releaseAll();
    for (const b of this.buildings) this.drop(b.mesh, b.shadow);
    for (const p of this.props) this.drop(p.mesh, p.shadow);
    for (const v of this.vehicles) this.drop(v.mesh, v.lights);
    if (this.shuttle) this.drop(this.shuttle.mesh, this.shuttle.glow);
    for (const f of this.figures) this.three.remove(f.mesh);
    this.figures[0]?.mesh.geometry.dispose();
    for (const m of this.figureMaterials) m.dispose();
    this.figureSheet?.dispose();
    if (this.weather) {
      this.weather.points.geometry.dispose();
      this.weather.points.material.dispose();
    }
    this.buildings = [];
    this.props = [];
    if (this.landMesh) this.drop(this.landMesh);
    if (this.emblem) {
      this.emblem.mesh.geometry.dispose();
      this.emblem.mesh.material.map?.dispose();
      this.emblem.mesh.material.dispose();
    }
    this.sky.geometry.dispose();
    this.sky.material.dispose();
    for (const t of this.textures.values()) void t.then((tex) => tex.dispose()).catch(() => {});
    this.renderer.toneMapping = this.savedToneMapping;
    delete this.container.dataset.colonyReady;
  }
}

/** A repeatable number from 0 to 1. */
function hashUnit(x: number): number {
  const s = Math.sin(x * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

/** A picture's coverage on a coarse grid, for finding what a tap touched; null if it cannot be read. */
function alphaOf(tex: THREE.Texture): { w: number; h: number; data: Uint8ClampedArray } | null {
  const img = tex.image as CanvasImageSource & { width: number; height: number };
  if (!img?.width) return null;
  const w = 48;
  const h = Math.max(8, Math.round((48 * img.height) / img.width));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return null;
  g.drawImage(img, 0, 0, w, h);
  const rgba = g.getImageData(0, 0, w, h).data;
  const data = new Uint8ClampedArray(w * h);
  for (let i = 0; i < data.length; i++) data[i] = rgba[i * 4 + 3] ?? 0;
  return { w, h, data };
}

/** A power's mark, glowing: its shape in its colour on a soft halo, with a pale edge. */
function markSheet(mark: 'square' | 'circle' | 'triangle', hex: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  if (!g) return c;
  const halo = g.createRadialGradient(32, 32, 4, 32, 32, 31);
  halo.addColorStop(0, `${hex}aa`);
  halo.addColorStop(1, `${hex}00`);
  g.fillStyle = halo;
  g.fillRect(0, 0, 64, 64);
  g.beginPath();
  if (mark === 'square') g.rect(20, 20, 24, 24);
  else if (mark === 'circle') g.arc(32, 32, 13, 0, Math.PI * 2);
  else {
    g.moveTo(32, 17);
    g.lineTo(46, 43);
    g.lineTo(18, 43);
    g.closePath();
  }
  g.fillStyle = hex;
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = 'rgba(240, 248, 255, 0.85)';
  g.stroke();
  return c;
}

/**
 * The people's sheet: a walking figure in two frames (legs apart, legs together), in a work suit
 * with a stripe of its power's colour, helmeted on a world where people need domes.
 */
function figureSheet(stripe: string, helmet: boolean): THREE.CanvasTexture {
  const fw = 16;
  const fh = 32;
  const c = document.createElement('canvas');
  c.width = fw * 2;
  c.height = fh;
  const g = c.getContext('2d');
  if (g) {
    for (const frame of [0, 1]) {
      const x0 = frame * fw;
      g.lineCap = 'round';
      g.strokeStyle = '#3a3f4a';
      g.lineWidth = 3;
      g.beginPath();
      if (frame === 0) {
        g.moveTo(x0 + 7, 20);
        g.lineTo(x0 + 4, 31);
        g.moveTo(x0 + 9, 20);
        g.lineTo(x0 + 12, 31);
      } else {
        g.moveTo(x0 + 7, 20);
        g.lineTo(x0 + 7, 31);
        g.moveTo(x0 + 9, 20);
        g.lineTo(x0 + 9, 31);
      }
      g.stroke();
      g.fillStyle = helmet ? '#d9dde3' : '#8a8f99';
      g.fillRect(x0 + 4, 9, 8, 12);
      g.fillStyle = stripe;
      g.fillRect(x0 + 4, 13, 8, 2);
      g.fillStyle = helmet ? '#eef1f5' : '#9c7a62';
      g.beginPath();
      g.arc(x0 + 8, 5.5, helmet ? 4.2 : 3.2, 0, Math.PI * 2);
      g.fill();
      if (helmet) {
        g.fillStyle = '#2b3550';
        g.fillRect(x0 + 6, 4, 5, 2.5);
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  return t;
}
