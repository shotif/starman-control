// The Milky Way behind everything (docs/design/FIRST_IMPRESSION.md §1): the galactic band along the
// real galactic plane, brighter and warmer towards the centre in Sagittarius, with dust lanes and
// faint haze, baked once into a cube map so a phone pays for it once, not every frame; and a dust
// of faint background stars, thickest in the band. Where it lies is real (IAU galactic
// coordinates, J2000); how it looks is an illustration.

import * as THREE from 'three';
import { equatorialToMap } from './mapMath.ts';

const DEG = Math.PI / 180;

export type SkyQuality = 'low' | 'medium' | 'high';

/** A direction on the sky (RA, Dec in degrees) in the map's axes. */
function direction(raDeg: number, decDeg: number): THREE.Vector3 {
  const ra = raDeg * DEG;
  const dec = decDeg * DEG;
  const m = equatorialToMap([Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)]);
  return new THREE.Vector3(m[0], m[1], m[2]).normalize();
}

/** The north galactic pole and the galactic centre (J2000), and the axis between them. */
export function galacticBasis(): { pole: THREE.Vector3; centre: THREE.Vector3; east: THREE.Vector3 } {
  const pole = direction(192.85948, 27.12825);
  const centre = direction(266.40499, -28.93617);
  // Make the centre exactly perpendicular to the pole, then the third axis.
  centre.addScaledVector(pole, -centre.dot(pole)).normalize();
  const east = new THREE.Vector3().crossVectors(pole, centre).normalize();
  return { pole, centre, east };
}

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const SKY_FRAG = /* glsl */ `
precision highp float;
varying vec3 vDir;
uniform vec3 uPole;
uniform vec3 uCentre;
uniform vec3 uEast;
uniform float uOctaves;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 7; i++) {
    if (float(i) >= uOctaves) break;
    v += a * noise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 4.1);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 dir = normalize(vDir);
  float b = asin(clamp(dot(dir, uPole), -1.0, 1.0));
  float l = atan(dot(dir, uEast), dot(dir, uCentre));
  float clouds = fbm(dir * 3.0);
  float fine = fbm(dir * 8.0 + 7.0);
  float knots = fbm(dir * 20.0 - 3.0);
  float width = 0.1 + 0.05 * clouds;
  float band = exp(-pow(b / width, 2.0));
  float core = exp(-pow(b / (width * 0.45), 2.0));
  float bulge = exp(-pow(b / 0.13, 2.0)) * exp(-l * l / 0.35);
  // Star clouds: the band is clumped, not an even mist.
  float clump = smoothstep(0.28, 0.8, clouds) * (0.55 + 0.9 * knots);
  float glow = (band * 0.32 + core * 0.55) * clump * (0.4 + 0.6 * exp(-l * l / 3.0)) + bulge * (0.7 + 0.7 * clouds);
  // Dark lanes of dust down the middle of the band, as the Great Rift.
  float dust = exp(-pow((b - 0.008) / (0.028 + 0.025 * fine), 2.0)) * smoothstep(0.4, 0.66, fine) * (0.5 + 0.5 * exp(-l * l / 2.0));
  glow = max(glow * (1.0 - 0.92 * dust), 0.0);
  vec3 cool = vec3(0.45, 0.52, 0.8);
  vec3 warm = vec3(1.0, 0.8, 0.58);
  vec3 col = mix(cool, warm, clamp(bulge * 1.4 + 0.25 * core, 0.0, 1.0)) * glow * 0.5;
  // A broad, faint glow either side, so the band does not end abruptly.
  col += cool * exp(-pow(b / 0.32, 2.0)) * 0.018;
  // Faint coloured haze away from the band.
  col += vec3(0.24, 0.10, 0.34) * pow(fbm(dir * 1.3 + 3.0), 3.0) * 0.26;
  col += vec3(0.03, 0.17, 0.25) * pow(fbm(dir * 1.8 - 5.0), 3.0) * 0.22;
  gl_FragColor = vec4(col, 1.0);
}`;

/** The sky's settings for a quality: cube face size and octaves of noise. */
function bakeSize(quality: SkyQuality): { size: number; octaves: number } {
  if (quality === 'low') return { size: 512, octaves: 4 };
  if (quality === 'high') return { size: 2048, octaves: 7 };
  return { size: 1024, octaves: 6 };
}

export interface BakedSky {
  readonly texture: THREE.CubeTexture;
  dispose(): void;
}

/** Draws the Milky Way once into a cube map, to use as a scene's background. */
export function bakeMilkyWay(renderer: THREE.WebGLRenderer, quality: SkyQuality = 'medium'): BakedSky {
  const g = galacticBasis();
  const { size, octaves } = bakeSize(quality);
  // An sRGB target keeps the darkest glow free of bands in eight bits.
  const target = new THREE.WebGLCubeRenderTarget(size, { colorSpace: THREE.SRGBColorSpace });
  const geometry = new THREE.SphereGeometry(10, 64, 32);
  const material = new THREE.ShaderMaterial({
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uPole: { value: g.pole },
      uCentre: { value: g.centre },
      uEast: { value: g.east },
      uOctaves: { value: octaves },
    },
  });
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(geometry, material));
  const camera = new THREE.CubeCamera(0.1, 100, target);
  const toneMapping = renderer.toneMapping;
  renderer.toneMapping = THREE.NoToneMapping;
  camera.update(renderer, scene);
  renderer.toneMapping = toneMapping;
  geometry.dispose();
  material.dispose();
  return {
    texture: target.texture,
    dispose: () => target.dispose(),
  };
}

/** A small, seeded random source (mulberry32), so the background is the same on every visit. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Where the sky is seen from: the camera's turn, and a lens (its own, or a nominal one for the flat map). */
class SkyLens {
  /** World to view, rotation only: the sky is at infinity, so where the camera stands does not matter. */
  readonly view = new THREE.Matrix3();
  /** View to world, rotation only. */
  readonly inverseView = new THREE.Matrix3();
  readonly projection = new THREE.Matrix4();
  readonly inverseProjection = new THREE.Matrix4();
  private readonly rotation = new THREE.Matrix4();
  private readonly nominal = new THREE.PerspectiveCamera(50, 1, 0.1, 10);

  /** A perspective camera lends its own lens (with any view offset); any other gets a nominal one. */
  update(camera: THREE.Camera, fovDeg: number, aspect: number): void {
    this.rotation.extractRotation(camera.matrixWorld);
    this.inverseView.setFromMatrix4(this.rotation);
    this.view.copy(this.inverseView).transpose();
    const lens = (camera as THREE.PerspectiveCamera).isPerspectiveCamera ? camera : this.nominal;
    if (lens === this.nominal && (this.nominal.fov !== fovDeg || this.nominal.aspect !== aspect)) {
      this.nominal.fov = fovDeg;
      this.nominal.aspect = aspect;
      this.nominal.updateProjectionMatrix();
    }
    this.projection.copy(lens.projectionMatrix);
    this.inverseProjection.copy(lens.projectionMatrixInverse);
  }
}

const BACKDROP_VERT = /* glsl */ `
varying vec2 vNdc;
void main() {
  vNdc = position.xy;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}`;

const BACKDROP_FRAG = /* glsl */ `
uniform samplerCube uSky;
uniform mat4 uInverseProjection;
uniform mat3 uInverseView;
uniform float uStrength;
varying vec2 vNdc;
void main() {
  vec4 p = uInverseProjection * vec4(vNdc, 1.0, 1.0);
  vec3 dir = normalize(uInverseView * (p.xyz / p.w));
  gl_FragColor = linearToOutputTexel(vec4(textureCube(uSky, dir).rgb * uStrength, 1.0));
}`;

export interface SkyBackdrop {
  readonly mesh: THREE.Mesh;
  /** Turns the sky with the camera; a flat map's camera is given a nominal lens of this field of view. */
  update(camera: THREE.Camera, fovDeg: number, aspect: number): void;
  setStrength(strength: number): void;
  dispose(): void;
}

/** The baked sky drawn behind everything, for any camera: a full-screen triangle, drawn first. */
export function createSkyBackdrop(sky: THREE.CubeTexture, strength = 1): SkyBackdrop {
  const lens = new SkyLens();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const material = new THREE.ShaderMaterial({
    vertexShader: BACKDROP_VERT,
    fragmentShader: BACKDROP_FRAG,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uSky: { value: sky },
      uInverseProjection: { value: lens.inverseProjection },
      uInverseView: { value: lens.inverseView },
      uStrength: { value: strength },
    },
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -100;
  return {
    mesh,
    update: (camera, fovDeg, aspect) => lens.update(camera, fovDeg, aspect),
    setStrength(value) {
      const u = material.uniforms.uStrength;
      if (u) u.value = value;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

const STARS_VERT = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute vec3 aColour;
uniform mat3 uView;
uniform mat4 uProjection;
uniform float uDpr;
uniform float uTime;
uniform float uTwinkle;
uniform float uBrightness;
varying vec3 vColour;
varying float vBright;
void main() {
  vColour = aColour;
  vBright = uBrightness * (1.0 - uTwinkle * 0.35 * (0.5 + 0.5 * sin(uTime * (0.6 + aPhase) + aPhase * 40.0)));
  // A direction, not a place: the stars are at infinity, seen through the sky's lens.
  gl_Position = uProjection * vec4(uView * position, 1.0);
  gl_Position.z = gl_Position.w * 0.9999;
  gl_PointSize = aSize * uDpr;
}`;

const STARS_FRAG = /* glsl */ `
precision mediump float;
varying vec3 vColour;
varying float vBright;
void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(uv, uv);
  if (r2 > 1.0) discard;
  float a = exp(-r2 * 5.0);
  gl_FragColor = vec4(vColour * a * vBright, 1.0);
}`;

export interface BackgroundStars {
  readonly points: THREE.Points;
  /** Turns the stars with the camera (a flat map's with a nominal lens); time in seconds, for the twinkle. */
  update(camera: THREE.Camera, timeS: number, fovDeg: number, aspect: number): void;
  setBrightness(brightness: number): void;
  dispose(): void;
}

/**
 * Faint stars far beyond the neighbourhood, an illustration: more in the band of the Milky Way,
 * a few bright ones, tinted from red to blue. They twinkle a little unless motion is reduced.
 */
export function createBackgroundStars(
  opts: { quality?: SkyQuality; dpr?: number; twinkle?: boolean; brightness?: number } = {},
): BackgroundStars {
  const scattered = opts.quality === 'low' ? 1800 : opts.quality === 'high' ? 6000 : 3800;
  // The star clouds of the band: many faint stars close to the galactic plane, more towards the centre.
  const clouded = opts.quality === 'low' ? 6000 : opts.quality === 'high' ? 24000 : 15000;
  const count = scattered + clouded;
  const g = galacticBasis();
  const random = seeded(2177);
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const colours = new Float32Array(count * 3);
  const v = new THREE.Vector3();
  const tint = new THREE.Color();
  const brightness = opts.brightness ?? 1;
  const gauss = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  for (let i = 0; i < count; ) {
    let m: number;
    if (i < scattered) {
      const z = random() * 2 - 1;
      const t = random() * Math.PI * 2;
      const r = Math.sqrt(1 - z * z);
      v.set(r * Math.cos(t), z, r * Math.sin(t));
      const b = Math.asin(v.dot(g.pole));
      if (random() > 0.3 + 0.7 * Math.exp(-((b / 0.3) ** 2))) continue;
      m = random() ** 6;
    } else {
      const l = random() < 0.3 ? gauss() * 0.9 : (random() * 2 - 1) * Math.PI;
      const b = gauss() * (0.06 + 0.05 * Math.exp(-l * l));
      v.copy(g.centre)
        .multiplyScalar(Math.cos(l) * Math.cos(b))
        .addScaledVector(g.east, Math.sin(l) * Math.cos(b))
        .addScaledVector(g.pole, Math.sin(b));
      m = random() ** 10 * 0.5;
    }
    v.normalize()
      .multiplyScalar(900)
      .toArray(positions, i * 3);
    sizes[i] = (i < scattered ? 1.4 : 2) + m * 4.2;
    phases[i] = random();
    const warmth = random();
    tint.setRGB(0.8 + 0.2 * warmth, 0.82 + 0.08 * Math.sin(warmth * Math.PI), 1.0 - 0.25 * warmth);
    const level = (i < scattered ? 0.25 + 0.75 * m + 0.25 * random() : 0.3 + 0.45 * random() + m) * brightness;
    tint.multiplyScalar(level).toArray(colours, i * 3);
    i++;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aColour', new THREE.BufferAttribute(colours, 3));
  const lens = new SkyLens();
  const material = new THREE.ShaderMaterial({
    vertexShader: STARS_VERT,
    fragmentShader: STARS_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uView: { value: lens.view },
      uProjection: { value: lens.projection },
      uDpr: { value: opts.dpr ?? 1 },
      uTime: { value: 0 },
      uTwinkle: { value: opts.twinkle === false ? 0 : 1 },
      uBrightness: { value: 1 },
    },
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = -90;
  return {
    points,
    update(camera, timeS, fovDeg, aspect) {
      lens.update(camera, fovDeg, aspect);
      const u = material.uniforms.uTime;
      if (u) u.value = timeS;
    },
    setBrightness(value) {
      const u = material.uniforms.uBrightness;
      if (u) u.value = value;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
