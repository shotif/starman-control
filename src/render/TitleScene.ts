// The title's live scene (docs/design/FIRST_IMPRESSION.md §2): the 356 real systems as glowing
// points in their true places, Reborn's old lanes as faint threads, each power's home web lit in
// its colour with light running out from the capital, and each capital ringed by its mark, slowly
// turning under the Milky Way. Loaded after the menu is up; it holds still when motion is reduced.

import * as THREE from 'three';
import { world } from '../app/world.ts';
import { FACTIONS, PLAYABLE_IDS } from '../content/factions.ts';
import type { SystemId } from '../data/types.ts';
import { homeWebs } from '../sim/homeWeb.ts';
import { laneEnds } from '../sim/world.ts';
import { equatorialToMap } from './mapMath.ts';
import { glyphPx } from './mapModel.ts';
import { bakeMilkyWay, createBackgroundStars, galacticBasis, type SkyQuality } from './milkyWay.ts';

const STAR_VERT = /* glsl */ `
attribute float aSize;
attribute vec3 aColour;
attribute float aSpikes;
uniform float uDpr;
uniform float uScale;
uniform vec2 uFade;
varying vec3 vColour;
varying float vSpikes;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vColour = aColour * (1.0 - 0.6 * smoothstep(uFade.x, uFade.y, -mv.z));
  vSpikes = aSpikes;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aSize * uScale / max(-mv.z, 0.1), 4.0, 72.0) * uDpr;
}`;

const STAR_FRAG = /* glsl */ `
precision mediump float;
varying vec3 vColour;
varying float vSpikes;
void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float r = length(uv);
  if (r > 1.0) discard;
  float core = exp(-r * r * 60.0);
  float glow = exp(-r * 5.5) * 0.55;
  float spikes = (exp(-abs(uv.x) * 70.0) * exp(-abs(uv.y) * 3.2) + exp(-abs(uv.y) * 70.0) * exp(-abs(uv.x) * 3.2)) * 0.5 * vSpikes;
  float edge = 1.0 - smoothstep(0.7, 1.0, r);
  vec3 col = (vColour * (glow + spikes) + vec3(1.0) * core) * edge;
  gl_FragColor = vec4(col, 1.0);
}`;

const MARK_VERT = /* glsl */ `
attribute vec3 aColour;
attribute float aShape;
uniform float uDpr;
uniform float uScale;
uniform float uTime;
varying vec3 vColour;
varying float vShape;
varying float vPulse;
void main() {
  vColour = aColour;
  vShape = aShape;
  vPulse = 0.5 + 0.5 * sin(uTime * 1.3 + aShape * 2.1);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(uScale / max(-mv.z, 0.1), 22.0, 96.0) * uDpr;
}`;

// Each capital is ringed by its power's mark (D-08: colour always with shape).
const MARK_FRAG = /* glsl */ `
precision mediump float;
varying vec3 vColour;
varying float vShape;
varying float vPulse;
float shapeDistance(vec2 p) {
  if (vShape < 0.5) return max(abs(p.x), abs(p.y)) * 1.12;
  if (vShape < 1.5) return length(p);
  if (vShape > 2.5) return (abs(p.x) + abs(p.y)) * 0.85;
  // An equilateral triangle, point up.
  vec2 q = vec2(abs(p.x), -p.y + 0.12);
  return max(q.x * 0.866 + q.y * 0.5, -q.y) * 1.7;
}
void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float d = shapeDistance(uv);
  float ring = exp(-pow((d - 0.62) / 0.045, 2.0));
  float halo = exp(-pow((d - 0.62) / 0.2, 2.0)) * (0.18 + 0.12 * vPulse);
  float inner = exp(-d * d * 18.0) * 0.35;
  gl_FragColor = vec4(vColour * (ring * 0.95 + halo + inner), 1.0);
}`;

const LANE_VERT = /* glsl */ `
attribute float aAlong;
attribute float aLength;
attribute vec3 aColour;
attribute float aPulse;
attribute float aPhase;
uniform vec2 uFade;
varying float vAlong;
varying float vFade;
varying float vLength;
varying vec3 vColour;
varying float vPulse;
varying float vPhase;
void main() {
  vAlong = aAlong;
  vLength = aLength;
  vColour = aColour;
  vPulse = aPulse;
  vPhase = aPhase;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vFade = 1.0 - 0.8 * smoothstep(uFade.x, uFade.y, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;

// Light runs along a lit lane, from the capital outward, a spark every few light-years.
const LANE_FRAG = /* glsl */ `
precision mediump float;
uniform float uTime;
varying float vAlong;
varying float vLength;
varying vec3 vColour;
varying float vPulse;
varying float vPhase;
varying float vFade;
void main() {
  float p = fract(vAlong * vLength / 5.0 - uTime * 0.4 + vPhase);
  float spark = pow(smoothstep(0.82, 1.0, p), 2.0) * vPulse;
  float ends = smoothstep(0.0, 0.06, vAlong) * smoothstep(1.0, 0.94, vAlong);
  gl_FragColor = vec4(vColour * (1.0 + spark * 4.0) * (0.55 + 0.45 * ends) * vFade, 1.0);
}`;

export interface TitleSceneOptions {
  quality: SkyQuality;
  reducedMotion: boolean;
}

const SHAPES = { square: 0, circle: 1, triangle: 2, diamond: 3 } as const;

/** The scene's centre: between the capitals of the powers one can lead, so each is in view. */
function centreOfPowers(): THREE.Vector3 {
  const c = new THREE.Vector3();
  for (const id of PLAYABLE_IDS) {
    const p = equatorialToMap(world.system(FACTIONS[id].capital.systemId).positionLy);
    c.add(new THREE.Vector3(p[0], p[1], p[2]));
  }
  return c.divideScalar(PLAYABLE_IDS.length);
}

export class TitleScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 3000);
  private readonly host: HTMLElement;
  private readonly opts: TitleSceneOptions;
  private readonly disposers: (() => void)[] = [];
  private readonly centre = centreOfPowers();
  /** The camera turns in the plane of the galaxy, so the Milky Way always arches across the view. */
  private readonly galaxy = galacticBasis();
  private readonly around = new THREE.Vector3();
  private readonly tangent = new THREE.Vector3();
  private readonly timed: THREE.IUniform<number>[] = [];
  /** Where things start and finish fading with distance from the camera, for depth. */
  private readonly fade = { value: new THREE.Vector2(30, 90) };
  private readonly sky: ReturnType<typeof createBackgroundStars>;
  private readonly observer: ResizeObserver;
  private frame = 0;
  private distance = 52;
  private time = 0;
  private last = performance.now();
  private hidden = false;
  /** Frames drawn: for tests, and to fade the canvas in after the first. */
  frames = 0;

  constructor(host: HTMLElement, opts: TitleSceneOptions) {
    this.host = host;
    this.opts = opts;
    this.renderer = new THREE.WebGLRenderer({ antialias: opts.quality !== 'low', powerPreference: 'high-performance' });
    const dpr = Math.min(window.devicePixelRatio || 1, opts.quality === 'low' ? 1 : opts.quality === 'high' ? 2.5 : 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(this.renderer.domElement);

    const baked = bakeMilkyWay(this.renderer, opts.quality);
    this.scene.background = baked.texture;
    this.scene.backgroundIntensity = 1;
    this.disposers.push(() => baked.dispose());

    this.sky = createBackgroundStars({ quality: opts.quality, dpr, twinkle: !opts.reducedMotion });
    this.scene.add(this.sky.points);
    this.disposers.push(() => this.sky.dispose());

    this.addLanes();
    this.addStars(dpr);
    this.addCapitals(dpr);

    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();
    document.addEventListener('visibilitychange', this.onVisibility);
    this.loop();
  }

  private addStars(dpr: number): void {
    const n = world.systems.length;
    const positions = new Float32Array(n * 3);
    const colours = new Float32Array(n * 3);
    const sizes = new Float32Array(n);
    const spikes = new Float32Array(n);
    const colour = new THREE.Color();
    world.systems.forEach((s, i) => {
      const primary = s.sky.stars[0];
      equatorialToMap(s.positionLy).forEach((v, k) => {
        positions[i * 3 + k] = v;
      });
      colour.set(primary?.colorHex ?? '#ffffff').toArray(colours, i * 3);
      const px = glyphPx(primary?.spectralType ?? '');
      sizes[i] = px * (s.sky.stars.length > 1 ? 1.15 : 1);
      spikes[i] = px >= 10 ? 1 : px >= 8 ? 0.4 : 0;
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColour', new THREE.BufferAttribute(colours, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aSpikes', new THREE.BufferAttribute(spikes, 1));
    const material = new THREE.ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uDpr: { value: dpr }, uScale: { value: 190 }, uFade: this.fade },
    });
    this.scene.add(new THREE.Points(geometry, material));
    this.disposers.push(() => {
      geometry.dispose();
      material.dispose();
    });
  }

  private addCapitals(dpr: number): void {
    const n = PLAYABLE_IDS.length;
    const positions = new Float32Array(n * 3);
    const colours = new Float32Array(n * 3);
    const shapes = new Float32Array(n);
    PLAYABLE_IDS.forEach((id, i) => {
      const f = FACTIONS[id];
      equatorialToMap(world.system(f.capital.systemId).positionLy).forEach((v, k) => {
        positions[i * 3 + k] = v;
      });
      new THREE.Color(f.colour).toArray(colours, i * 3);
      shapes[i] = SHAPES[f.mark];
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColour', new THREE.BufferAttribute(colours, 3));
    geometry.setAttribute('aShape', new THREE.BufferAttribute(shapes, 1));
    const time = { value: 0 };
    this.timed.push(time);
    const material = new THREE.ShaderMaterial({
      vertexShader: MARK_VERT,
      fragmentShader: MARK_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uDpr: { value: dpr }, uScale: { value: 900 }, uTime: time },
    });
    this.scene.add(new THREE.Points(geometry, material));
    this.disposers.push(() => {
      geometry.dispose();
      material.dispose();
    });
  }

  private addLanes(): void {
    // Each power's home web, worked out as a new game does, lit in its colour; the rest dark.
    const webs = homeWebs(
      world,
      PLAYABLE_IDS.map((id) => ({ faction: id, capital: FACTIONS[id].capital.systemId })),
    );
    const lit = new Map<string, { colour: string; jumps: Map<SystemId, number> }>();
    for (const w of webs) for (const id of w.lanes) lit.set(id, { colour: FACTIONS[w.faction].colour, jumps: w.jumps });
    const n = world.catalogue.length;
    const positions = new Float32Array(n * 6);
    const along = new Float32Array(n * 2);
    const length = new Float32Array(n * 2);
    const colours = new Float32Array(n * 6);
    const pulse = new Float32Array(n * 2);
    const phase = new Float32Array(n * 2);
    const dark = new THREE.Color(0.07, 0.11, 0.2);
    const colour = new THREE.Color();
    world.catalogue.forEach((lane, i) => {
      const web = lit.get(lane.id);
      let [a, b] = laneEnds(lane.id);
      // Light runs from the end nearer the capital.
      if (web && (web.jumps.get(a) ?? 0) > (web.jumps.get(b) ?? 0)) [a, b] = [b, a];
      const pa = equatorialToMap(world.system(a).positionLy);
      const pb = equatorialToMap(world.system(b).positionLy);
      positions.set(pa, i * 6);
      positions.set(pb, i * 6 + 3);
      along[i * 2] = 0;
      along[i * 2 + 1] = 1;
      const ly = Math.hypot(pa[0] - pb[0], pa[1] - pb[1], pa[2] - pb[2]);
      length[i * 2] = ly;
      length[i * 2 + 1] = ly;
      if (web) colour.set(web.colour).multiplyScalar(0.7);
      else colour.copy(dark);
      colour.toArray(colours, i * 6);
      colour.toArray(colours, i * 6 + 3);
      pulse[i * 2] = web ? 1 : 0;
      pulse[i * 2 + 1] = web ? 1 : 0;
      const ph = ((i * 0.618034) % 1) * (web ? 0.2 : 1);
      phase[i * 2] = ph;
      phase[i * 2 + 1] = ph;
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aAlong', new THREE.BufferAttribute(along, 1));
    geometry.setAttribute('aLength', new THREE.BufferAttribute(length, 1));
    geometry.setAttribute('aColour', new THREE.BufferAttribute(colours, 3));
    geometry.setAttribute('aPulse', new THREE.BufferAttribute(pulse, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    const time = { value: 0 };
    this.timed.push(time);
    const material = new THREE.ShaderMaterial({
      vertexShader: LANE_VERT,
      fragmentShader: LANE_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: time, uFade: this.fade },
    });
    this.scene.add(new THREE.LineSegments(geometry, material));
    this.disposers.push(() => {
      geometry.dispose();
      material.dispose();
    });
  }

  private resize(): void {
    const w = Math.max(1, this.host.clientWidth);
    const h = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // The neighbourhood sits right of the menu on a wide screen, above it on a tall one.
    const wide = w / h > 1.15;
    this.camera.setViewOffset(w, h, wide ? -w * 0.2 : 0, wide ? 0 : h * 0.16, w, h);
    this.camera.fov = wide ? 40 : 56;
    this.distance = wide ? 52 : 58;
    this.fade.value.set(this.distance - 20, this.distance + 30);
    this.camera.updateProjectionMatrix();
    if (this.opts.reducedMotion) this.draw(0);
  }

  private readonly onVisibility = () => {
    this.hidden = document.hidden;
    if (!this.hidden && !this.opts.reducedMotion) {
      this.last = performance.now();
      this.loop();
    }
  };

  /** Milliseconds between frames: 16, or more on a device that takes long over one. */
  private gap = 16;

  private loop = () => {
    if (this.hidden) return;
    const now = performance.now();
    if (this.frames > 0 && now - this.last < this.gap - 2) {
      this.frame = requestAnimationFrame(this.loop);
      return;
    }
    // Time stops while the page is hidden, so the turn picks up where it left off.
    this.time += Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.draw(this.time);
    const cost = performance.now() - now;
    this.gap = Math.min(250, this.gap * 0.7 + Math.max(16, cost * 4) * 0.3);
    if (!this.opts.reducedMotion) this.frame = requestAnimationFrame(this.loop);
  };

  /** Places the camera for a moment of the slow turn, and draws. */
  private draw(t: number): void {
    const motion = !this.opts.reducedMotion;
    const yaw = 0.9 + (motion ? t * 0.022 : 0);
    // The scene drifts in from further away over the first seconds.
    const arrive = motion ? 1 - Math.exp(-t / 2.2) : 1;
    const distance = this.distance + 30 * (1 - arrive);
    const pitch = 0.2 + (motion ? 0.04 * Math.sin(t * 0.07) : 0);
    const { pole, centre, east } = this.galaxy;
    this.around.copy(centre).multiplyScalar(Math.cos(yaw)).addScaledVector(east, Math.sin(yaw));
    this.tangent.copy(east).multiplyScalar(Math.cos(yaw)).addScaledVector(centre, -Math.sin(yaw));
    this.camera.position
      .copy(this.centre)
      .addScaledVector(this.around, distance * Math.cos(pitch))
      .addScaledVector(pole, distance * Math.sin(pitch));
    // A slight roll, so the band runs across the view on a slant.
    this.camera.up.copy(pole).addScaledVector(this.tangent, 0.28).normalize();
    this.camera.lookAt(this.centre);
    this.camera.updateMatrixWorld();
    this.sky.update(this.camera, t, this.camera.fov, this.camera.aspect);
    for (const u of this.timed) u.value = motion ? t : 0;
    this.renderer.render(this.scene, this.camera);
    this.frames++;
    if (this.frames === 1) this.host.dataset.ready = 'yes';
  }

  dispose(): void {
    cancelAnimationFrame(this.frame);
    this.hidden = true;
    this.observer.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    for (const d of this.disposers) d();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
