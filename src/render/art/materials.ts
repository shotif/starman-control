// The one shared material setting the copied asteroid art needs: the faint rim light every lit
// surface gets. From Starman Reborn, src/world/art/materials.ts at ba4ef73 (D-10); the rest of that
// file (station and ship panels) is not needed here.

import * as THREE from 'three';

export const rimUniform = { value: new THREE.Color(0.03, 0.045, 0.07) };
