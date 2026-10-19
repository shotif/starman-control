// The system in 3D (docs/design/M1_SYSTEM_VIEW.md): a system's stars and worlds drawn with Starman
// Reborn's procedural art, the worlds moving round their stars, on the map's own WebGL renderer
// (the map pauses meanwhile, so a phone never holds two contexts). Labels are HTML over the canvas
// and placed by Reborn's label layout, as on the map; a tap or click chooses a world.

import * as THREE from 'three';
import { createAsteroidField, createDustRing } from './art/asteroids.ts';
import { createPlanet, type PlanetStyle } from './art/planets.ts';
import { createStar, type StarArt } from './art/stars.ts';
import type { ArtContext, ArtObject } from './art/types.ts';
import { byQuality } from './art/util.ts';
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
import type { SystemLayout, V3 } from './systemLayout.ts';

const FOV = 45;

export interface SystemSceneEvents {
  /** A world or star chosen, or none. */
  select(id: string | null): void;
  /** Desktop: the world or star under the mouse. */
  hover?(id: string | null, x: number, y: number): void;
}

/** What a label says, and the colour of the power that holds the world, if any. */
export interface SceneLabel {
  text: string;
  held?: string;
}

interface Thing {
  id: string;
  /** Where it is now, updated every frame. */
  pos: THREE.Vector3;
  radius: number;
  priority: number;
  label: HTMLDivElement;
  box: LabelBox;
  point: ScreenPoint;
}

export class SystemScene {
  readonly controller: OrbitController;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly canvas: HTMLCanvasElement;
  private readonly container: HTMLElement;
  private readonly layout: SystemLayout;
  private readonly events: SystemSceneEvents;
  private readonly ctx: ArtContext;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(FOV, 1, 20, 4_000_000);
  private readonly labelLayer: HTMLDivElement;
  private readonly gestures: GestureTracker;
  private readonly art: ArtObject[] = [];
  /** Objects made here rather than by the art builders, freed on dispose. */
  private readonly own: (THREE.Mesh | THREE.Line)[] = [];
  private readonly planets = new Map<string, { art: ArtObject; moonOrbit: THREE.Object3D | null }>();
  private readonly things: Thing[] = [];
  private readonly order: number[] = [];
  private readonly placed: number[] = [];
  private readonly viewProjection = new THREE.Matrix4();
  private readonly basis = new THREE.Matrix4();
  private readonly detach: () => void;
  private readonly savedToneMapping: THREE.ToneMapping;
  /** The map's Milky Way behind the system, when lent (IN_FLIGHT.md §2). */
  private readonly sky: { backdrop: SkyBackdrop; stars: BackgroundStars } | null = null;
  private frame = 0;
  private lastTime = 0;
  private time = 0;
  private stage: Rect = { x: 0, y: 0, w: 1, h: 1 };
  private obstacles: Rect[] = [];
  private selected: string | null = null;
  private following: string | null = null;
  private lastPointerType = 'mouse';
  private settling = true;

  /** True while the camera is still gliding, for tests. */
  get moving(): boolean {
    return this.settling || (this.frame === 0 && this.lastTime === 0);
  }

  constructor(
    renderer: THREE.WebGLRenderer,
    container: HTMLElement,
    layout: SystemLayout,
    labels: ReadonlyMap<string, SceneLabel>,
    events: SystemSceneEvents,
    opts: { reducedMotion: boolean; quality: ArtContext['quality']; sky?: THREE.CubeTexture },
  ) {
    this.renderer = renderer;
    this.canvas = renderer.domElement;
    this.container = container;
    this.layout = layout;
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
      container.dataset.systemSky = 'yes';
    }
    this.labelLayer = document.createElement('div');
    this.labelLayer.className = 'map-labels system-labels';
    this.labelLayer.setAttribute('aria-hidden', 'true');
    container.appendChild(this.labelLayer);
    this.build(labels);

    this.controller = new OrbitController(
      { target: [0, 0, 0], yaw: 0.6, pitch: 0.5, distance: this.fitDistance() },
      {
        minDistance: 400,
        maxDistance: layout.extent * 8,
        minPitch: -1.45,
        maxPitch: 1.45,
        maxTargetRadius: layout.extent * 1.5,
      },
    );
    this.controller.reducedMotion = opts.reducedMotion;
    this.gestures = new GestureTracker({
      rotate: (dx, dy) => {
        this.controller.rotateByPixels(dx, dy);
        this.invalidate();
      },
      pan: (dx, dy) => {
        this.following = null;
        this.controller.pan(dx, dy, this.height, FOV);
        this.invalidate();
      },
      zoom: (factor, x, y) => {
        const c = this.centre();
        this.controller.zoomAt(factor, x - c.x, y - c.y, this.height, FOV);
        this.invalidate();
      },
      tap: (x, y) => this.events.select(this.thingAt(x, y, this.lastPointerType)),
      doubleTap: (x, y, type) => {
        const id = this.thingAt(x, y, type);
        if (id) this.focus(id);
      },
    });
    this.detach = this.attachInput();
    this.invalidate();
  }

  // ---------------------------------------------------------------- building

  private get width(): number {
    return Math.max(1, this.canvas.clientWidth);
  }

  private get height(): number {
    return Math.max(1, this.canvas.clientHeight);
  }

  private add<T extends ArtObject>(a: T): T {
    this.art.push(a);
    this.scene.add(a.object);
    return a;
  }

  private build(labels: ReadonlyMap<string, SceneLabel>): void {
    const { layout } = this;
    this.scene.add(new THREE.HemisphereLight(0x9aa8c8, 0x0a0c14, 0.35));
    const starAt = new Map<string, V3>();
    for (const s of layout.stars) {
      starAt.set(s.id, s.pos);
      const star: StarArt = this.add(
        createStar(
          { radius: s.radius, color: s.colour, kind: s.kind, activity: s.activity, seed: hashSeed(s.id) },
          this.ctx,
        ),
      );
      star.object.position.set(...s.pos);
      const light = new THREE.PointLight(s.colour, 2.2, 0, 0);
      light.position.set(...s.pos);
      this.scene.add(light);
      this.addThing(s.id, new THREE.Vector3(...s.pos), s.radius, 900, labels);
    }
    if (layout.habitableZone && layout.stars[0]) {
      const hz = layout.habitableZone;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(hz.inner, hz.outer, 160),
        new THREE.MeshBasicMaterial({
          color: 0x3fbf6f,
          transparent: true,
          opacity: 0.07,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(...layout.stars[0].pos);
      this.scene.add(ring);
      this.own.push(ring);
    }
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x7eaaff, transparent: true, opacity: 0.18 });
    for (const b of layout.bodies) {
      const host = starAt.get(b.star) ?? [0, 0, 0];
      const art = this.add(
        this.ctx.quality === 'low'
          ? plainPlanet(b.radius, b.style)
          : createPlanet(
              {
                radius: b.radius,
                style: b.style,
                seed: hashSeed(b.id),
                lightPosition: new THREE.Vector3(...host),
                lightColor: layout.stars.find((s) => s.id === b.star)?.colour ?? '#ffffff',
                ...(b.rings ? { rings: b.rings } : {}),
                tilt: b.tilt,
                spinSpeed: this.ctx.reducedMotion ? 0 : 0.08,
              },
              this.ctx,
            ),
      );
      const orbit = circle(b.orbit, orbitMaterial);
      let moonOrbit: THREE.Object3D | null = null;
      if (b.parent) {
        moonOrbit = orbit;
      } else {
        orbit.position.set(...host);
      }
      this.scene.add(orbit);
      this.own.push(orbit);
      this.planets.set(b.id, { art, moonOrbit });
      this.addThing(b.id, new THREE.Vector3(), b.radius, b.parent ? 300 : 500 + b.radius / 10, labels);
    }
    for (const belt of layout.belts) {
      const host = starAt.get(belt.star) ?? [0, 0, 0];
      const field = this.add(
        createAsteroidField(
          {
            seed: hashSeed(belt.id),
            count: byQuality(this.ctx.quality, 220, 420, 700),
            shape: 'ring',
            innerRadius: belt.inner,
            outerRadius: belt.outer,
            thickness: 500,
            sizeMin: 40,
            sizeMax: 140,
            color: '#8c8476',
          },
          this.ctx,
        ),
      );
      field.object.position.set(...host);
      const dust = this.add(
        createDustRing(
          {
            innerRadius: belt.inner,
            outerRadius: belt.outer,
            color: '#a39883',
            opacity: 0.25,
            seed: hashSeed(belt.id),
          },
          this.ctx,
        ),
      );
      dust.object.position.set(...host);
      const mid = (belt.inner + belt.outer) / 2;
      this.addThing(belt.id, new THREE.Vector3(host[0] + mid, host[1], host[2]), belt.outer - mid, 200, labels);
    }
    this.place(0);
  }

  private addThing(
    id: string,
    pos: THREE.Vector3,
    radius: number,
    priority: number,
    labels: ReadonlyMap<string, SceneLabel>,
  ): void {
    const info = labels.get(id);
    const el = document.createElement('div');
    el.className = 'map-label system-label';
    el.textContent = info?.text ?? id;
    el.dataset.body = id;
    if (info?.held) {
      el.classList.add('is-held');
      el.style.setProperty('--held', info.held);
    }
    el.hidden = true;
    this.labelLayer.appendChild(el);
    const box = createLabelBox();
    const size = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    box.height = Math.round(size * 0.8125 * 1.385);
    box.width = Math.round((info?.text ?? id).length * size * 0.44 + 12);
    this.things.push({ id, pos, radius, priority, label: el, box, point: createScreenPoint() });
  }

  /** Puts every world where it is at a time, in seconds. */
  private place(time: number): void {
    const { layout } = this;
    const at = new Map<string, THREE.Vector3>(layout.stars.map((s) => [s.id, new THREE.Vector3(...s.pos)]));
    // Planets first, then the moons round them.
    for (const pass of [false, true]) {
      for (const b of layout.bodies) {
        if (Boolean(b.parent) !== pass) continue;
        const centre = (b.parent ? at.get(b.parent) : at.get(b.star)) ?? new THREE.Vector3();
        const angle = b.phase + (time / b.period) * Math.PI * 2;
        const pos = new THREE.Vector3(
          centre.x + Math.cos(angle) * b.orbit,
          centre.y,
          centre.z + Math.sin(angle) * b.orbit,
        );
        at.set(b.id, pos);
        const p = this.planets.get(b.id);
        p?.art.object.position.copy(pos);
        if (p?.moonOrbit) p.moonOrbit.position.copy(centre);
        const thing = this.things.find((t) => t.id === b.id);
        thing?.pos.copy(pos);
      }
    }
  }

  // ---------------------------------------------------------------- the camera

  /** Far enough back to see the whole system within the stage. */
  private fitDistance(): number {
    const e = this.layout.extent;
    const pts: Vec3[] = [
      [e, 0, 0],
      [-e, 0, 0],
      [0, 0, e],
      [0, 0, -e],
    ];
    return fitOrbitDistance(pts, [0, 0, 0], 0.6, 0.5, FOV, this.stage.w, this.stage.h, this.height, 24, 400, e * 8);
  }

  private centre(): { x: number; y: number } {
    return { x: this.stage.x + this.stage.w / 2, y: this.stage.y + this.stage.h / 2 };
  }

  /** The part of the canvas not covered by bars and sheets, and what labels must avoid. */
  setStage(stage: Rect, obstacles: Rect[] = []): void {
    const first = this.stage.w <= 1;
    this.stage = stage;
    this.obstacles = obstacles;
    if (first) this.controller.jumpTo({ ...this.controller.current, distance: this.fitDistance() });
    this.invalidate();
  }

  /** Glides to a world or star and follows it round its orbit. */
  focus(id: string): void {
    const t = this.things.find((x) => x.id === id);
    if (!t) return;
    this.following = id;
    const distance = Math.max(t.radius * 9, 2500);
    this.controller.transitionTo({ target: [t.pos.x, t.pos.y, t.pos.z], distance });
    this.invalidate();
  }

  /** Back to the whole system. */
  showAll(): void {
    this.following = null;
    this.controller.transitionTo({ target: [0, 0, 0], distance: this.fitDistance() });
    this.invalidate();
  }

  setSelected(id: string | null): void {
    this.selected = id;
    for (const t of this.things) t.label.classList.toggle('is-selected', t.id === id);
    this.invalidate();
  }

  // ---------------------------------------------------------------- drawing

  private get animating(): boolean {
    return !this.ctx.reducedMotion;
  }

  invalidate(): void {
    if (!this.frame) this.frame = requestAnimationFrame((t) => this.draw(t));
  }

  private draw(now: number): void {
    this.frame = 0;
    const dt = this.lastTime ? Math.min(0.1, (now - this.lastTime) / 1000) : 1 / 60;
    this.lastTime = now;
    if (this.animating) this.time += dt;
    this.place(this.time);
    if (this.following) {
      const t = this.things.find((x) => x.id === this.following);
      if (t) {
        const c = this.controller.current;
        const g = this.controller.goal;
        // Keep the target on it as it moves: the glide continues towards where it now is.
        g.target = [t.pos.x, t.pos.y, t.pos.z];
        if (this.ctx.reducedMotion) c.target = [t.pos.x, t.pos.y, t.pos.z];
      }
    }
    const moving = this.controller.update(dt);
    this.settling = moving;
    this.updateCamera();
    this.sky?.backdrop.update(this.camera, FOV, this.camera.aspect);
    this.sky?.stars.update(this.camera, this.time, FOV, this.camera.aspect);
    for (const a of this.art) a.update?.(dt, this.time, this.camera);
    this.renderer.render(this.scene, this.camera);
    this.layoutLabels();
    this.container.dataset.ready = '1';
    if (this.animating || moving || this.following) this.invalidate();
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

  private layoutLabels(): void {
    const m = this.viewProjection.elements;
    const w = this.width;
    const h = this.height;
    const perPx = (2 * Math.tan((FOV * Math.PI) / 360)) / h;
    for (const t of this.things) {
      projectPoint(m, t.pos.x, t.pos.y, t.pos.z, w, h, t.point);
      const inside = t.point.visible && t.point.x >= 0 && t.point.y >= 0 && t.point.x <= w && t.point.y <= h;
      t.box.anchorX = t.point.x;
      t.box.anchorY = t.point.y;
      t.box.active = inside;
      t.box.gap = Math.max(8, Math.min(60, t.radius / (t.point.depth * perPx || 1)));
      t.box.priority = (t.id === this.selected ? 2000 : 0) + t.priority;
    }
    layoutLabels(
      this.things.map((t) => t.box),
      { x: 4, y: 4, w: w - 8, h: h - 8 },
      this.obstacles,
      this.order,
      this.placed,
    );
    for (const t of this.things) {
      t.label.hidden = !t.box.visible;
      if (t.box.visible) t.label.style.transform = `translate(${Math.round(t.box.x)}px, ${Math.round(t.box.y)}px)`;
    }
  }

  // ---------------------------------------------------------------- input

  /** The world or star nearest a point on screen, within reach of a finger or the mouse. */
  thingAt(x: number, y: number, pointerType: string): string | null {
    const reach = pointerType === 'mouse' ? 18 : 28;
    const i = pickNearestPoint(
      this.things.map((t) => t.point),
      x,
      y,
      reach,
    );
    return i >= 0 ? (this.things[i]?.id ?? null) : null;
  }

  /** Where a world or star is on screen, for tests. */
  screenOf(id: string): { x: number; y: number; visible: boolean } | null {
    const t = this.things.find((x) => x.id === id);
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
      const p = local(e);
      if (this.gestures.activePointers > 0) {
        this.gestures.move(e.pointerId, p.x, p.y);
        return;
      }
      if (e.pointerType === 'mouse') this.events.hover?.(this.thingAt(p.x, p.y, 'mouse'), p.x, p.y);
    };
    const up = (e: PointerEvent) => {
      const p = local(e);
      this.gestures.up(e.pointerId, p.x, p.y, e.timeStamp);
    };
    const cancel = (e: PointerEvent) => this.gestures.cancel(e.pointerId);
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
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
    cancelAnimationFrame(this.frame);
    this.detach();
    for (const a of this.art) a.dispose();
    for (const o of this.own) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
    this.renderer.toneMapping = this.savedToneMapping;
    this.sky?.backdrop.dispose();
    this.sky?.stars.dispose();
    delete this.container.dataset.systemSky;
    this.labelLayer.remove();
  }
}

function circle(radius: number, material: THREE.LineBasicMaterial): THREE.LineLoop {
  const n = 160;
  const pts = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts[i * 3] = Math.cos(a) * radius;
    pts[i * 3 + 2] = Math.sin(a) * radius;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  return new THREE.LineLoop(g, material);
}

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0) % 100000;
}

/** Plain colours for each look, for the low quality setting's simply lit spheres (D-25). */
const PLAIN: Record<PlanetStyle, number> = {
  mercury: 0x9a8f86,
  venus: 0xd9c38f,
  earth: 0x4f7fbf,
  moon: 0x9c9c9c,
  io: 0xd8c25a,
  europa: 0xc9c2b0,
  ganymede: 0x9a8f80,
  callisto: 0x6f665c,
  titan: 0xc79a4f,
  mars: 0xb5603a,
  jupiter: 0xc9a27a,
  saturn: 0xd8c08a,
  uranus: 0x9fd3dd,
  neptune: 0x4f75c9,
  'exo-rocky-warm': 0xa8805f,
  'exo-scorched': 0x7a5a4a,
  'exo-rocky-cold': 0x8a97a8,
  'exo-gas-giant': 0xc8a882,
};

function plainPlanet(radius: number, style: PlanetStyle): ArtObject {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 24, 16),
    new THREE.MeshStandardMaterial({ color: PLAIN[style], roughness: 0.9, metalness: 0 }),
  );
  return {
    object: mesh,
    dispose: () => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    },
  };
}
