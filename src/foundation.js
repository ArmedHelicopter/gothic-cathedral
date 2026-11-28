import * as THREE from 'three';
import { applyWorldPlanarUVs, buildOrderedWireframe, mergeClean, xform } from './geo.js';
import { STAIR_CONFIG } from './spiralStaircase.js';

export function createFoundationComponent(mats) {
  const group = new THREE.Group();
  group.name = 'foundation';
  const floorGroup = new THREE.Group();
  const daisGroup = new THREE.Group();
  const mezzGroup = new THREE.Group();
  group.add(floorGroup, daisGroup, mezzGroup);
  const wireSourceGeos = [];

  const naveFloorGeo = new THREE.PlaneGeometry(18.4, 55.2);
  const naveFloor = new THREE.Mesh(naveFloorGeo, mats.naveInlayMat);
  naveFloor.rotation.x = -Math.PI / 2;
  naveFloor.position.set(0, 0, 1.2);
  naveFloor.receiveShadow = true;
  floorGroup.add(naveFloor);
  wireSourceGeos.push(naveFloorGeo.clone().rotateX(-Math.PI / 2).translate(0, 0, 1.2));

  const aisleGeos = [];
  for (const side of [-1, 1]) {
    const geo = new THREE.PlaneGeometry(4.4, 55.2);
    xform(geo, [side * 11.4, 0.002, 1.2], [-Math.PI / 2, 0, 0]);
    aisleGeos.push(geo);
  }
  const aisleGeo = mergeClean(aisleGeos);
  const aisleMesh = new THREE.Mesh(aisleGeo, mats.aisleFloorMat);
  aisleMesh.receiveShadow = true;
  floorGroup.add(aisleMesh);
  wireSourceGeos.push(aisleGeo.clone());

  const bandGeos = [];
  for (const bx of [-7.6, 7.6]) {
    const band = new THREE.BoxGeometry(0.25, 0.018, 52.8);
    xform(band, [bx, 0.012, 0.6]);
    bandGeos.push(band);
  }
  const bandGeo = mergeClean(bandGeos);
  const bandMesh = new THREE.Mesh(bandGeo, mats.floorTrimMat);
  bandMesh.receiveShadow = true;
  floorGroup.add(bandMesh);
  wireSourceGeos.push(bandGeo.clone());

  const ringGeos = [];
  for (const x of [-5.6, 5.6]) {
    for (const z of [14.5, 7, -0.5, -8, -15.5]) {
      const ring = new THREE.RingGeometry(0.97, 1.10, 64);
      xform(ring, [x, 0.026, z], [-Math.PI / 2, 0, 0]);
      ringGeos.push(ring);
    }
  }
  const ringGeo = mergeClean(ringGeos);
  const ringMesh = new THREE.Mesh(ringGeo, mats.navyStoneMat);
  ringMesh.receiveShadow = true;
  floorGroup.add(ringMesh);
  wireSourceGeos.push(ringGeo.clone());

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
      uReflStrength: { value: 0.12 },
      uTint: { value: new THREE.Color('#0B1430') },
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
        gl_FragColor = vec4(mix(uTint, refl, 0.76), uReflStrength * edgeFade);
      }
    `,
  });
  const mirrorGeo = new THREE.PlaneGeometry(26.0, 52.0);
  const mirrorMesh = new THREE.Mesh(mirrorGeo, mirrorMat);
  mirrorMesh.rotation.x = -Math.PI / 2;
  mirrorMesh.position.set(0, 0.012, 1.2);
  mirrorMesh.renderOrder = 1;
  floorGroup.add(mirrorMesh);

  const daisWhiteGeos = [];
  const daisGoldGeos = [];
  const dais = new THREE.BoxGeometry(11.4, 1.15, 7.8);
  xform(dais, [0, 0.575, -20.9]);
  applyWorldPlanarUVs(dais, 0.3, 0.3);
  daisWhiteGeos.push(dais);
  for (const x of [-5.35, 5.35]) {
    const line = new THREE.BoxGeometry(0.035, 0.014, 7.35);
    xform(line, [x, 1.158, -20.9]);
    daisGoldGeos.push(line);
  }
  for (const z of [-17.25, -20.9, -24.55]) {
    const line = new THREE.BoxGeometry(10.72, 0.014, 0.035);
    xform(line, [0, 1.158, z]);
    daisGoldGeos.push(line);
  }
  const frontInlay = new THREE.BoxGeometry(11.44, 0.035, 0.055);
  xform(frontInlay, [0, 1.11, -16.98]);
  daisGoldGeos.push(frontInlay);
  const daisWhiteGeo = mergeClean(daisWhiteGeos);
  const daisWhiteMesh = new THREE.Mesh(daisWhiteGeo, mats.marbleWhiteMat);
  daisWhiteMesh.castShadow = true;
  daisWhiteMesh.receiveShadow = true;
  const daisGoldGeo = mergeClean(daisGoldGeos);
  const daisGoldMesh = new THREE.Mesh(daisGoldGeo, mats.paleGoldMat);
  daisGroup.add(daisWhiteMesh, daisGoldMesh);
  wireSourceGeos.push(daisWhiteGeo.clone(), daisGoldGeo.clone());

  const mezzWhiteGeos = [];
  const mezzGoldGeos = [];
  const MEZZ_Y = STAIR_CONFIG.mezzY;
  const SLAB_THICK = 0.52;
  const mezzShape = new THREE.Shape();
  mezzShape.moveTo(-13.6, 10.8);
  mezzShape.lineTo(13.6, 10.8);
  mezzShape.lineTo(13.6, 28.5);
  mezzShape.lineTo(-13.6, 28.5);
  mezzShape.closePath();
  const wellHole = new THREE.Path();
  wellHole.absarc(STAIR_CONFIG.centerX, STAIR_CONFIG.centerZ, STAIR_CONFIG.rArcade, 0, Math.PI * 2, true);
  mezzShape.holes.push(wellHole);
  const mainDeckGeo = new THREE.ExtrudeGeometry(mezzShape, { depth: SLAB_THICK, bevelEnabled: false, curveSegments: 48 });
  mainDeckGeo.rotateX(Math.PI / 2);
  mainDeckGeo.translate(0, MEZZ_Y, 0);
  applyWorldPlanarUVs(mainDeckGeo, 0.22, 0.22);
  mezzWhiteGeos.push(mainDeckGeo);

  const overlookFascia = new THREE.BoxGeometry(19.2, 0.52, 0.34);
  xform(overlookFascia, [0, MEZZ_Y - 0.26, 10.85]);
  mezzWhiteGeos.push(overlookFascia);
  const overlookBase = new THREE.BoxGeometry(19.2, 0.14, 0.28);
  xform(overlookBase, [0, MEZZ_Y + 0.07, 10.90]);
  mezzWhiteGeos.push(overlookBase);
  const overlookRail = new THREE.BoxGeometry(19.2, 0.11, 0.24);
  xform(overlookRail, [0, MEZZ_Y + 0.96, 10.90]);
  mezzWhiteGeos.push(overlookRail);
  const overlookGold = new THREE.BoxGeometry(19.2, 0.045, 0.28);
  xform(overlookGold, [0, MEZZ_Y + 1.04, 10.90]);
  mezzGoldGeos.push(overlookGold);
  for (let panel = 0; panel < 16; panel += 1) {
    const centerX = -9 + panel * 1.2;
    const shape = new THREE.Shape();
    shape.moveTo(-0.57, 0);
    shape.lineTo(0.57, 0);
    shape.lineTo(0.57, 0.82);
    shape.lineTo(-0.57, 0.82);
    shape.closePath();
    for (const offset of [-0.25, 0.25]) {
      const hole = new THREE.Path();
      hole.moveTo(offset - 0.17, 0.09);
      hole.lineTo(offset - 0.17, 0.43);
      hole.quadraticCurveTo(offset - 0.17, 0.58, offset, 0.70);
      hole.quadraticCurveTo(offset + 0.17, 0.58, offset + 0.17, 0.43);
      hole.lineTo(offset + 0.17, 0.09);
      hole.closePath();
      shape.holes.push(hole);
    }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false, curveSegments: 8 });
    geo.translate(centerX, MEZZ_Y + 0.11, 10.84);
    applyWorldPlanarUVs(geo, 0.45, 0.45);
    mezzWhiteGeos.push(geo);
  }
  for (let post = 0; post <= 16; post += 1) {
    const geo = new THREE.BoxGeometry(post % 4 === 0 ? 0.16 : 0.09, 0.92, 0.20);
    xform(geo, [-9.6 + post * 1.2, MEZZ_Y + 0.52, 10.90]);
    mezzWhiteGeos.push(geo);
  }
  const mezzWhiteGeo = mergeClean(mezzWhiteGeos);
  const mezzGoldGeo = mergeClean(mezzGoldGeos);
  const mezzWhiteMesh = new THREE.Mesh(mezzWhiteGeo, mats.whiteMarbleMat);
  mezzWhiteMesh.castShadow = true;
  mezzWhiteMesh.receiveShadow = true;
  const mezzGoldMesh = new THREE.Mesh(mezzGoldGeo, mats.paleGoldMat);
  mezzGroup.add(mezzWhiteMesh, mezzGoldMesh);
  wireSourceGeos.push(mezzWhiteGeo.clone(), mezzGoldGeo.clone());

  const wireframeMesh = buildOrderedWireframe(mergeClean(wireSourceGeos), 28, 0, 10.4, 0.05, 0.42);
  wireframeMesh.name = 'foundationWireframe';

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
      0.5, 0, 0, 0.5,
      0, 0.5, 0, 0.5,
      0, 0, 0.5, 0.5,
      0, 0, 0, 1
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

  return { group, wireframeMesh, update, updateReflection, dispose };
}
