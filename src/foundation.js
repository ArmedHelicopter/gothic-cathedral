import * as THREE from 'three';
import { applyWorldPlanarUVs, mergeClean, xform } from './geo.js';
import { STAIR_CONFIG } from './spiralStaircase.js';

/**
 * Independent Component: Grand Enclosed Sanctuary Floor, Cosmatesque Planar Reflection,
 * Continuous Ceremonial Runner Carpet Ascending 5-Step Sovereign Dais,
 * and 2nd-Floor Mezzanine Overlook Gallery & Triforium Balustrades.
 */
export function createFoundationComponent(mats) {
  const group = new THREE.Group();
  group.name = 'foundation';

  const floorGroup = new THREE.Group();
  const carpetGroup = new THREE.Group();
  const daisGroup = new THREE.Group();
  const mezzGroup = new THREE.Group();
  group.add(floorGroup, carpetGroup, daisGroup, mezzGroup);

  // 1. Enclosed Nave & Aisle Marble Floor (27.4m x 54.8m, strictly sealed)
  const naveFloorGeo = new THREE.PlaneGeometry(27.6, 55.2);
  const naveFloor = new THREE.Mesh(naveFloorGeo, mats.naveInlayMat);
  naveFloor.rotation.x = -Math.PI / 2;
  naveFloor.position.set(0, 0.0, 1.2);
  naveFloor.receiveShadow = true;
  floorGroup.add(naveFloor);

  // Framed Carrara Marble Aisle Divider Bands
  const floorTrimGeos = [];
  for (const bx of [-4.2, 4.2, -9.2, 9.2]) {
    const band = new THREE.BoxGeometry(0.28, 0.016, 48.0);
    xform(band, [bx, 0.008, 2.0]);
    floorTrimGeos.push(band);
  }
  const floorTrimMesh = new THREE.Mesh(mergeClean(floorTrimGeos), mats.floorTrimMat);
  floorTrimMesh.receiveShadow = true;
  floorGroup.add(floorTrimMesh);

  // Subtle Nocturnal Planar Reflection (reflects stained-glass windows & warm sanctuary cone on polished marble)
  const reflRT = new THREE.WebGLRenderTarget(512, 384, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: false,
  });
  const texMatrix = new THREE.Matrix4();
  const mirrorCam = new THREE.PerspectiveCamera();

  const mirrorMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      tRefl: { value: reflRT.texture },
      uTexMatrix: { value: texMatrix },
      uReflStrength: { value: 0.16 },
      uTint: { value: new THREE.Color('#050c20') },
    },
    vertexShader: `
      uniform mat4 uTexMatrix;
      varying vec4 vReflUv;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vReflUv = uTexMatrix * wp;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform sampler2D tRefl;
      uniform float uReflStrength;
      uniform vec3 uTint;
      varying vec4 vReflUv;
      varying vec2 vUv;
      void main() {
        vec2 uv = vReflUv.xy / max(0.0001, vReflUv.w);
        vec3 refl = texture2D(tRefl, clamp(uv, 0.002, 0.998)).rgb;
        float edgeFade = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x)
                       * smoothstep(0.0, 0.05, vUv.y) * smoothstep(1.0, 0.95, vUv.y);
        vec3 col = mix(uTint, refl, 0.76);
        gl_FragColor = vec4(col, uReflStrength * edgeFade);
      }
    `,
  });

  const mirrorGeo = new THREE.PlaneGeometry(26.0, 52.0);
  const mirrorMesh = new THREE.Mesh(mirrorGeo, mirrorMat);
  mirrorMesh.rotation.x = -Math.PI / 2;
  mirrorMesh.position.set(0, 0.012, 1.2);
  mirrorMesh.renderOrder = 1;
  floorGroup.add(mirrorMesh);

  // 2. Ceremonial Royal-Navy & Silver Runner Carpet (Z = +12.4 right under Staircase North Portal -> Z = -17.0)
  const CARPET_W = 3.20;
  const CARPET_START_Z = 12.6;
  const DAIS_FRONT_Z = -17.0;
  const flatLen = CARPET_START_Z - DAIS_FRONT_Z;
  const flatMidZ = (CARPET_START_Z + DAIS_FRONT_Z) * 0.5;

  const carpetFloorMesh = new THREE.Mesh(new THREE.BoxGeometry(CARPET_W, 0.030, flatLen), mats.carpetMat);
  carpetFloorMesh.position.set(0, 0.024, flatMidZ);
  carpetFloorMesh.receiveShadow = true;
  carpetFloorMesh.renderOrder = 2;
  carpetGroup.add(carpetFloorMesh);

  const silverCarpetGeos = [];
  for (const cx of [-CARPET_W * 0.5 - 0.02, CARPET_W * 0.5 + 0.02]) {
    const edge = new THREE.BoxGeometry(0.036, 0.034, flatLen);
    xform(edge, [cx, 0.026, flatMidZ]);
    silverCarpetGeos.push(edge);
  }
  const thresholdBar = new THREE.BoxGeometry(CARPET_W + 0.06, 0.036, 0.06);
  xform(thresholdBar, [0, 0.028, CARPET_START_Z]);
  silverCarpetGeos.push(thresholdBar);

  // 3. Five-Tier Carrara Marble & Obsidian Sovereign Dais (Z = -17.0 -> -24.8, top Y = 1.15)
  const daisWhiteGeos = [];
  const daisObsidianGeos = [];
  const TIERS = 5;
  const TIER_H = 0.23;

  for (let i = 0; i < TIERS; i++) {
    const w = 11.4 - i * 0.85;
    const frontZ = -17.0 - i * 0.65;
    const backZ = -24.8;
    const depth = Math.abs(backZ - frontZ);
    const centerZ = (frontZ + backZ) * 0.5;
    const bottomY = i * TIER_H;
    const centerY = bottomY + TIER_H * 0.5;

    const riser = new THREE.BoxGeometry(w, TIER_H, depth);
    xform(riser, [0, centerY, centerZ]);
    applyWorldPlanarUVs(riser, 0.30, 0.30);
    daisWhiteGeos.push(riser);

    const trim = new THREE.BoxGeometry(w + 0.06, 0.036, 0.07);
    xform(trim, [0, bottomY + TIER_H - 0.014, frontZ + 0.02]);
    daisObsidianGeos.push(trim);

    // Carpet riser + stair rod + tread
    const cRiser = new THREE.Mesh(new THREE.BoxGeometry(CARPET_W, TIER_H + 0.02, 0.032), mats.carpetMat);
    cRiser.position.set(0, centerY + 0.01, frontZ + 0.014);
    cRiser.receiveShadow = true;
    cRiser.renderOrder = 2;
    carpetGroup.add(cRiser);

    const rod = new THREE.CylinderGeometry(0.024, 0.024, CARPET_W + 0.10, 10);
    xform(rod, [0, bottomY + 0.024, frontZ + 0.032], [0, 0, Math.PI / 2]);
    silverCarpetGeos.push(rod);

    const nextZ = i < TIERS - 1 ? -17.0 - (i + 1) * 0.65 : -23.0;
    const treadLen = Math.abs(nextZ - frontZ) + 0.04;
    const cTread = new THREE.Mesh(new THREE.BoxGeometry(CARPET_W, 0.030, treadLen), mats.carpetMat);
    cTread.position.set(0, bottomY + TIER_H + 0.016, (frontZ + nextZ) * 0.5);
    cTread.receiveShadow = true;
    cTread.renderOrder = 2;
    carpetGroup.add(cTread);
  }

  carpetGroup.add(new THREE.Mesh(mergeClean(silverCarpetGeos), mats.silverTrimMat));
  const daisWhiteMesh = new THREE.Mesh(mergeClean(daisWhiteGeos), mats.whiteMarbleMat);
  daisWhiteMesh.castShadow = true;
  daisWhiteMesh.receiveShadow = true;
  const daisTrimMesh = new THREE.Mesh(mergeClean(daisObsidianGeos), mats.floorTrimMat);
  daisTrimMesh.receiveShadow = true;
  daisGroup.add(daisWhiteMesh, daisTrimMesh);

  // 4. 2nd-Floor Mezzanine & Side Triforium Gallery Deck (Y = 8.68 .. 9.20)
  // Shape coords are transformed with rotateX(PI/2): local (x, y) -> world (x, y_local -> +z)
  const mezzWhiteGeos = [];
  const mezzObsGeos = [];
  const mezzSilverGeos = [];
  const MEZZ_Y = STAIR_CONFIG.mezzY;
  const SLAB_THICK = 0.52;

  const mezzShape = new THREE.Shape();
  mezzShape.moveTo(-13.6, 10.8);
  mezzShape.lineTo(13.6, 10.8);
  mezzShape.lineTo(13.6, 28.5);
  mezzShape.lineTo(-13.6, 28.5);
  mezzShape.closePath();

  // Circular stairwell hole at (0, +18.0), radius = rArcade (4.52m)
  const wellHole = new THREE.Path();
  wellHole.absarc(STAIR_CONFIG.centerX, STAIR_CONFIG.centerZ, STAIR_CONFIG.rArcade, 0, Math.PI * 2, true);
  mezzShape.holes.push(wellHole);

  const mainDeckGeo = new THREE.ExtrudeGeometry(mezzShape, { depth: SLAB_THICK, bevelEnabled: false, curveSegments: 48 });
  mainDeckGeo.rotateX(Math.PI / 2);
  mainDeckGeo.translate(0, MEZZ_Y, 0);
  applyWorldPlanarUVs(mainDeckGeo, 0.22, 0.22);
  mezzWhiteGeos.push(mainDeckGeo);

  // Side Triforium Gallery Decks extending along |X| in [9.4, 13.6], Z in [-16.0, +10.8]
  for (const side of [-1, 1]) {
    const triSlab = new THREE.BoxGeometry(4.2, SLAB_THICK, 26.8);
    xform(triSlab, [side * 11.5, MEZZ_Y - SLAB_THICK * 0.5, -2.6]);
    applyWorldPlanarUVs(triSlab, 0.24, 0.24);
    mezzWhiteGeos.push(triSlab);

    // Sculpted Carrara & molded fascia beam facing central nave + Carved Gothic Pierced Balustrade
    const fascia = new THREE.BoxGeometry(0.30, 0.56, 26.8);
    xform(fascia, [side * 9.48, MEZZ_Y - 0.28, -2.6]);
    applyWorldPlanarUVs(fascia, 0.35, 0.35);
    mezzWhiteGeos.push(fascia);

    const triPlinth = new THREE.BoxGeometry(0.24, 0.14, 26.8);
    xform(triPlinth, [side * 9.55, MEZZ_Y + 0.07, -2.6]);
    mezzWhiteGeos.push(triPlinth);
    const triRail = new THREE.BoxGeometry(0.22, 0.11, 26.8);
    xform(triRail, [side * 9.55, MEZZ_Y + 0.96, -2.6]);
    mezzWhiteGeos.push(triRail);
    const triSilver = new THREE.BoxGeometry(0.08, 0.04, 26.8);
    xform(triSilver, [side * 9.55, MEZZ_Y + 1.03, -2.6]);
    mezzSilverGeos.push(triSilver);
    for (let bz = -15.4; bz <= 10.2; bz += 0.58) {
      const bal = new THREE.CylinderGeometry(0.052, 0.064, 0.78, 10);
      xform(bal, [side * 9.55, MEZZ_Y + 0.52, bz]);
      mezzWhiteGeos.push(bal);
      // Pointed Gothic tracery mini-arches uniting balustrade bays
      if (bz < 9.7) {
        const arc = new THREE.TorusGeometry(0.26, 0.036, 8, 12, Math.PI);
        xform(arc, [side * 9.55, MEZZ_Y + 0.68, bz + 0.29], [0, Math.PI / 2, 0]);
        mezzWhiteGeos.push(arc);
      }
    }
  }

  // Grand Open-Tracery Marble North Overlook Balustrade at Z = +10.85, X in [-9.4, +9.4]
  const overlookFascia = new THREE.BoxGeometry(19.2, 0.52, 0.34);
  xform(overlookFascia, [0, MEZZ_Y - 0.26, 10.85]);
  mezzWhiteGeos.push(overlookFascia);

  const overlookBase = new THREE.BoxGeometry(19.2, 0.14, 0.28);
  xform(overlookBase, [0, MEZZ_Y + 0.07, 10.90]);
  mezzWhiteGeos.push(overlookBase);

  const overlookRail = new THREE.BoxGeometry(19.2, 0.11, 0.24);
  xform(overlookRail, [0, MEZZ_Y + 0.96, 10.90]);
  mezzWhiteGeos.push(overlookRail);

  const overlookSilver = new THREE.BoxGeometry(19.2, 0.04, 0.10);
  xform(overlookSilver, [0, MEZZ_Y + 1.03, 10.90]);
  mezzSilverGeos.push(overlookSilver);

  for (let bx = -9.0; bx <= 9.0; bx += 0.50) {
    if (Math.abs(Math.abs(bx) - 2.5) < 0.08 || Math.abs(Math.abs(bx) - 6.0) < 0.08 || Math.abs(Math.abs(bx) - 9.0) < 0.08) {
      const pier = new THREE.BoxGeometry(0.26, 1.02, 0.28);
      xform(pier, [bx, MEZZ_Y + 0.51, 10.90]);
      mezzWhiteGeos.push(pier);
    } else {
      const bal = new THREE.CylinderGeometry(0.050, 0.062, 0.78, 10);
      xform(bal, [bx, MEZZ_Y + 0.52, 10.90]);
      mezzWhiteGeos.push(bal);
      if (bx < 8.6) {
        const arc = new THREE.TorusGeometry(0.22, 0.034, 8, 12, Math.PI);
        xform(arc, [bx + 0.25, MEZZ_Y + 0.68, 10.90]);
        mezzWhiteGeos.push(arc);
      }
    }
  }

  const mezzWhiteMesh = new THREE.Mesh(mergeClean(mezzWhiteGeos), mats.whiteMarbleMat);
  mezzWhiteMesh.castShadow = true;
  mezzWhiteMesh.receiveShadow = true;
  const mezzObsMesh = new THREE.Mesh(mergeClean(mezzObsGeos), mats.obsidianMat);
  mezzObsMesh.castShadow = true;
  mezzObsMesh.receiveShadow = true;
  const mezzSilMesh = new THREE.Mesh(mergeClean(mezzSilverGeos), mats.silverTrimMat);
  mezzGroup.add(mezzWhiteMesh, mezzObsMesh, mezzSilMesh);

  function updateReflection(renderer, scene, camera) {
    mirrorMesh.visible = false;

    const planeY = 0.012;
    mirrorCam.fov = camera.fov;
    mirrorCam.aspect = camera.aspect;
    mirrorCam.near = camera.near;
    mirrorCam.far = camera.far;
    mirrorCam.updateProjectionMatrix();

    mirrorCam.position.copy(camera.position);
    mirrorCam.position.y = 2 * planeY - camera.position.y;

    const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const targetPt = camera.position.clone().add(lookDir);
    targetPt.y = 2 * planeY - targetPt.y;
    mirrorCam.up.copy(camera.up);
    mirrorCam.up.y *= -1;
    mirrorCam.lookAt(targetPt);
    mirrorCam.updateMatrixWorld();

    texMatrix.set(
      0.5, 0.0, 0.0, 0.5,
      0.0, 0.5, 0.0, 0.5,
      0.0, 0.0, 0.5, 0.5,
      0.0, 0.0, 0.0, 1.0
    );
    texMatrix.multiply(mirrorCam.projectionMatrix);
    texMatrix.multiply(mirrorCam.matrixWorldInverse);

    const prevTarget = renderer.getRenderTarget();
    const prevTone = renderer.toneMapping;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setRenderTarget(reflRT);
    renderer.clear();
    renderer.render(scene, mirrorCam);
    renderer.setRenderTarget(prevTarget);
    renderer.toneMapping = prevTone;

    mirrorMesh.visible = true;
  }

  function update() {}

  function dispose() {
    reflRT.dispose();
    mirrorMat.dispose();
    mirrorGeo.dispose();
    naveFloorGeo.dispose();
  }

  return { group, update, updateReflection, dispose };
}
