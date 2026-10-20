// A colony as a living diorama (docs/design/COLONY_VIEW.md §2): its sky drawn in a shader in its
// star's colour, the painted landscape of its world's ground, and its painted buildings in their
// slots, each on a soft contact shadow, all in the star's light with haze over the far land. Seen
// from a ridge with an orthographic camera, wider than the screen: drag to pan, pinch or the wheel
// to zoom. It borrows the map's renderer while the map pauses, as the system view does, so a phone
// keeps one WebGL context. Nothing moves on its own here; life comes in increment 16.

import * as THREE from 'three';
import type { LandscapeArt } from '../content/colonyArt.ts';
import { artUrl, type Placed, placeAll, townBounds } from './colonyPlace.ts';
import type { ColonyScene } from './colonyScene.ts';
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

// The sky, in screen space: day colours from the horizon to the zenith, stars where there is no
// air, the sun's disc and glow. Colours are sRGB throughout, as the pictures are.
const SKY_FRAGMENT = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uSun;
uniform vec2 uSunPos;
uniform float uSunR;
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
  col += uSun * exp(-d / (uSunR * (2.5 + uAir * 4.0))) * 0.6;
  float disc = 1.0 - smoothstep(uSunR - 1.0, uSunR + 1.0, d);
  col = mix(col, mix(uSun, vec3(1.0), 0.6), disc);
  gl_FragColor = vec4(col, 1.0);
}`;

// A painted picture (premultiplied) in the star's light, hazed towards the horizon (the landscape)
// or by its distance (a building), and revealed from its foot up to `uReveal` (a scaffold rising).
const ART_FRAGMENT = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uLight;
uniform vec3 uHaze;
uniform float uHazeAmount;
uniform float uHazeBand;
uniform float uHorizonY;
uniform float uReveal;
uniform float uOpacity;
varying vec2 vUv;
varying float vWorldY;
void main() {
  if (vUv.y > uReveal) discard;
  vec4 t = texture2D(uMap, vUv);
  vec3 c = t.rgb * uLight;
  float k = uHazeBand > 0.0 ? uHazeAmount * (1.0 - smoothstep(0.0, uHazeBand, uHorizonY - vWorldY)) : uHazeAmount;
  c = mix(c, uHaze * t.a, k);
  gl_FragColor = vec4(c, t.a) * uOpacity;
}`;

const SHADOW_FRAGMENT = /* glsl */ `
varying vec2 vUv;
void main() {
  float r = length((vUv - 0.5) * 2.0);
  float a = 0.42 * (1.0 - smoothstep(0.0, 1.0, r));
  gl_FragColor = vec4(0.04, 0.03, 0.02, 1.0) * a;
}`;

function colour(hex: string): THREE.Vector3 {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

function mixColour(a: string, b: string, t: number): THREE.Vector3 {
  const x = new THREE.Color(a);
  x.lerp(new THREE.Color(b), t);
  return new THREE.Vector3(x.r, x.g, x.b);
}

export interface ColonyViewOptions {
  reducedMotion: boolean;
  quality: 'low' | 'medium' | 'high';
  /** Where the pictures are served from (import.meta.env.BASE_URL). */
  base: string;
}

interface BuildingMesh {
  placed: Placed;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
}

/** The camera: the world point at the stage's middle, and pixels to a world unit (a landscape height). */
interface View {
  cx: number;
  cy: number;
  k: number;
}

export class ColonyView {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly canvas: HTMLCanvasElement;
  private readonly container: HTMLElement;
  private readonly land: LandscapeArt;
  private readonly opts: ColonyViewOptions;
  private readonly three = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  private readonly loader = new THREE.TextureLoader();
  private readonly textures = new Map<string, Promise<THREE.Texture>>();
  private readonly gestures: GestureTracker;
  private readonly detach: () => void;
  private readonly savedToneMapping: THREE.ToneMapping;
  private readonly sky: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  /** The sky shader's uniforms, kept to set each frame. */
  private readonly skyU = {
    uZenith: { value: new THREE.Vector3() },
    uHorizon: { value: new THREE.Vector3() },
    uSun: { value: new THREE.Vector3() },
    uSunPos: { value: new THREE.Vector2() },
    uSunR: { value: 4 },
    uAir: { value: 1 },
    uHorizonY: { value: 0 },
    uTop: { value: 1 },
    uStars: { value: 0 },
    uShift: { value: 0 },
  };
  private landMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null = null;
  private buildings: BuildingMesh[] = [];
  private scene: ColonyScene;
  private stage: Rect = { x: 0, y: 0, w: 1, h: 1 };
  private view: View = { cx: 1, cy: 0.5, k: 300 };
  private framed = false;
  private frame = 0;
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
  ) {
    this.renderer = renderer;
    this.canvas = renderer.domElement;
    this.container = container;
    this.scene = scene;
    this.land = land;
    this.opts = opts;
    this.A = land.aspect;
    this.savedToneMapping = renderer.toneMapping;
    renderer.toneMapping = THREE.NoToneMapping;

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
      tap: () => {},
      doubleTap: (x, y) => this.zoomAt(1.6, x, y),
    });
    this.detach = this.attachInput();
    this.loading = this.build();
    this.ready = this.loading.then(
      () =>
        new Promise<void>((done) => {
          requestAnimationFrame(() => {
            this.draw();
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

  private artMaterial(map: THREE.Texture, haze: { amount: number; band: number }): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: ART_FRAGMENT,
      uniforms: {
        uMap: { value: map },
        uLight: { value: this.light() },
        uHaze: { value: colour(this.scene.sky.horizon) },
        uHazeAmount: { value: haze.amount },
        uHazeBand: { value: haze.band },
        uHorizonY: { value: 1 - this.land.horizon },
        uReveal: { value: 1 },
        uOpacity: { value: 1 },
      },
      transparent: true,
      premultipliedAlpha: true,
      depthTest: false,
      depthWrite: false,
    });
  }

  /** The star's light: white tinted by its colour. */
  private light(): THREE.Vector3 {
    return mixColour('#ffffff', this.scene.sun.colour, 0.45);
  }

  private async build(): Promise<void> {
    const land = await this.texture(artUrl(this.opts.base, 'landscape', this.land.id, this.wantedWidth(this.A)));
    if (this.disposed) return;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.A, 1),
      this.artMaterial(land, { amount: this.scene.sky.haze * 0.7, band: 0.22 }),
    );
    mesh.position.set(this.A / 2, 0.5, 0);
    mesh.renderOrder = 1;
    this.three.add(mesh);
    this.landMesh = mesh;
    await this.buildBuildings();
  }

  private async buildBuildings(): Promise<void> {
    const placed = placeAll(this.scene, this.land);
    const maps = await Promise.all(
      placed.map((p) => this.texture(artUrl(this.opts.base, 'structure', p.art.id, this.wantedWidth(p.w * this.A)))),
    );
    if (this.disposed) return;
    for (const b of this.buildings) this.drop(b);
    this.buildings = placed.map((p, i) => {
      const map = maps[i] as THREE.Texture;
      const w = p.w * this.A;
      const h = p.h;
      const far = Math.max(0, Math.min(1, 1 - (p.v - this.land.horizon) / 0.45));
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        this.artMaterial(map, { amount: this.scene.sky.haze * far * 0.35, band: 0 }),
      );
      const baseY = 1 - p.v;
      mesh.position.set(p.u * this.A, baseY + h / 2, 0);
      mesh.renderOrder = 3 + i * 2 + 1;
      if (p.building.kind === 'scaffold') mesh.material.uniforms.uReveal.value = 0.3 + 0.7 * (p.building.progress ?? 0);
      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(w * 1.2, w * 0.36),
        new THREE.ShaderMaterial({
          vertexShader: VERTEX,
          fragmentShader: SHADOW_FRAGMENT,
          transparent: true,
          premultipliedAlpha: true,
          depthTest: false,
          depthWrite: false,
        }),
      );
      shadow.position.set(p.u * this.A + w * 0.08, baseY + h * 0.05, 0);
      shadow.renderOrder = 3 + i * 2;
      this.three.add(shadow, mesh);
      return { placed: p, mesh, shadow };
    });
    this.invalidate();
  }

  private drop(b: BuildingMesh): void {
    this.three.remove(b.mesh, b.shadow);
    b.mesh.geometry.dispose();
    b.mesh.material.dispose();
    b.shadow.geometry.dispose();
    b.shadow.material.dispose();
  }

  private setSky(): void {
    const u = this.skyU;
    u.uZenith.value.copy(colour(this.scene.sky.zenith));
    u.uHorizon.value.copy(colour(this.scene.sky.horizon));
    u.uSun.value.copy(colour(this.scene.sun.colour));
    u.uStars.value = this.scene.sky.starsByDay ? 1 : 0;
    u.uAir.value = { none: 0.15, thin: 0.6, dense: 1, toxic: 1.3 }[this.scene.sky.atmosphere];
  }

  /** The colony changed (a turn ended, something was queued): its buildings are set out again. */
  setScene(scene: ColonyScene): void {
    this.scene = scene;
    this.setSky();
    this.loading = this.loading.then(() => this.buildBuildings());
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

  // ---------------------------------------------------------------- drawing

  invalidate(): void {
    if (!this.frame && !this.disposed) this.frame = requestAnimationFrame(() => this.draw());
  }

  private draw(): void {
    this.frame = 0;
    if (this.disposed) return;
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

    // The sky's uniforms are in device pixels from the canvas's foot, as gl_FragCoord is.
    const dpr = this.dpr();
    const u = this.skyU;
    const horizon = this.toScreen(0, 1 - this.land.horizon).y;
    u.uHorizonY.value = (h - horizon) * dpr;
    u.uTop.value = h * dpr;
    // The sun hangs at the upper left of the sky, where the buildings are lit from; low and still
    // on a locked world. It moves a little with the view, as something very far away does.
    const sunX = (0.22 * w - (cx - this.A / 2) * k * 0.08) * dpr;
    const sunUp = this.scene.sun.locked ? 0.03 : 0.42;
    const top = this.toScreen(0, 1 + SKY_ROOM).y;
    const sunY = horizon - Math.max(0.03 * h, (horizon - Math.max(0, top)) * sunUp);
    u.uSunPos.value.set(sunX, (h - sunY) * dpr);
    u.uSunR.value = Math.max(2.5, Math.min(h * 0.08, this.scene.sun.size * 0.0045 * this.A * k)) * dpr;
    u.uShift.value = cx * k * 0.15 * dpr;

    this.renderer.render(this.three, cam);
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
      if (this.gestures.activePointers === 0) return;
      const p = local(e);
      this.gestures.move(e.pointerId, p.x, p.y);
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
    };
  }

  // ---------------------------------------------------------------- for tests

  /** Every building drawn, where it is on the canvas (CSS pixels), for tests. */
  buildingsOnScreen(): { kind: string; slot: number; x: number; y: number; w: number; h: number }[] {
    return this.buildings.map((b) => {
      const p = b.placed;
      const foot = this.toScreen(p.u * this.A, 1 - p.v);
      const w = p.w * this.A * this.view.k;
      const h = p.h * this.view.k;
      return { kind: p.building.kind, slot: p.building.slot, x: foot.x - w / 2, y: foot.y - h, w, h };
    });
  }

  /** The view's middle and scale, for tests. */
  get look(): View {
    return { ...this.view };
  }

  /** What is drawn, for tests. */
  get info(): { biome: string; architecture: string; buildings: number } {
    return { biome: this.scene.biome, architecture: this.scene.architecture, buildings: this.buildings.length };
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.detach();
    this.gestures.releaseAll();
    for (const b of this.buildings) this.drop(b);
    this.buildings = [];
    if (this.landMesh) {
      this.landMesh.geometry.dispose();
      this.landMesh.material.dispose();
    }
    this.sky.geometry.dispose();
    this.sky.material.dispose();
    for (const t of this.textures.values()) void t.then((tex) => tex.dispose()).catch(() => {});
    this.renderer.toneMapping = this.savedToneMapping;
    delete this.container.dataset.colonyReady;
  }
}
