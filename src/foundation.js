import * as THREE from 'three';
import { applyWorldPlanarUVs, mergeClean, smooth01, xform } from './geo.js';

/**
 * Independent Component: Sanctuary Island Plinth, Luminous Cloud Sea Horizon,
 * Polished Azure-Reflecting Nave Marble, Ceremonial Runner Carpet Climbing to the Dais,
 * and 16-Segment Genshin-Style Forward-Paving Approach Causeway.
 */
export function createFoundationComponent(mats) {
  const group = new THREE.Group();
  group.name = 'foundation';

  const slabBaseGroup = new THREE.Group();
  const roadGroup = new THREE.Group();
  const carpetGroup = new THREE.Group();
  const daisGroup = new THREE.Group();
  group.add(slabBaseGroup, roadGroup, carpetGroup, daisGroup);

  const terraceWhiteGeos = [];
  const terraceNavyGeos = [];
  const terraceDarkGeos = [];

  // 1. Stepped Sanctuary Island Plinth (supports wider WALL_X = 7.8 cathedral + buttresses)
  const outerIsland = new THREE.BoxGeometry(26.5, 1.4, 38.0);
  xform(outerIsland, [0, -1.35, -0.4]);
  applyWorldPlanarUVs(outerIsland, 0.18, 0.18);
  terraceNavyGeos.push(outerIsland);

  const midCourtyard = new THREE.BoxGeometry(23.8, 0.45, 36.2);
  xform(midCourtyard, [0, -0.45, -0.4]);
  applyWorldPlanarUVs(midCourtyard, 0.24, 0.24);
  terraceDarkGeos.push(midCourtyard);

  for (const sx of [-11.65, 11.65]) {
    const curb = new THREE.BoxGeometry(0.50, 0.36, 36.2);
    xform(curb, [sx, -0.05, -0.4]);
    applyWorldPlanarUVs(curb, 0.35, 0.35);
    terraceWhiteGeos.push(curb);
  }
  const backCurb = new THREE.BoxGeometry(23.8, 0.36, 0.50);
  xform(backCurb, [0, -0.05, -18.25]);
  applyWorldPlanarUVs(backCurb, 0.35, 0.35);
  terraceWhiteGeos.push(backCurb);

  const subPlinth = new THREE.BoxGeometry(20.6, 0.45, 34.8);
  xform(subPlinth, [0, -0.22, -0.8]);
  applyWorldPlanarUVs(subPlinth, 0.26, 0.26);
  terraceWhiteGeos.push(subPlinth);

  const terraceWhiteMesh = new THREE.Mesh(mergeClean(terraceWhiteGeos), mats.whiteMarbleMat);
  terraceWhiteMesh.receiveShadow = true;
  terraceWhiteMesh.castShadow = true;
  const terraceNavyMesh = new THREE.Mesh(mergeClean(terraceNavyGeos), mats.navyStoneMat);
  terraceNavyMesh.receiveShadow = true;
  const terraceDarkMesh = new THREE.Mesh(mergeClean(terraceDarkGeos), mats.matteBasaltMat);
  terraceDarkMesh.receiveShadow = true;
  slabBaseGroup.add(terraceWhiteMesh, terraceNavyMesh, terraceDarkMesh);

  // 2. Luminous Clear-Sky Cloud Sea Plane + Soft Layered Sky Clouds around the island!
  const cloudMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uInnerColor: { value: new THREE.Color('#eef5ff') },
      uMidColor: { value: new THREE.Color('#b6d2f8') },
      uOuterColor: { value: new THREE.Color('#70a0e8') },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform vec3 uInnerColor;
      uniform vec3 uMidColor;
      uniform vec3 uOuterColor;
      varying vec2 vUv;
      void main() {
        float d = length((vUv - 0.5) * 2.0);
        float c1 = smoothstep(0.95, 0.20, d);
        float c2 = smoothstep(0.58, 0.08, d);
        vec3 col = mix(uOuterColor, uMidColor, c1);
        col = mix(col, uInnerColor, c2);
        float alpha = clamp(c1 * 0.85 + 0.12, 0.0, 0.94);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
  const cloudPlane = new THREE.Mesh(new THREE.PlaneGeometry(210, 210), cloudMat);
  cloudPlane.rotation.x = -Math.PI / 2;
  cloudPlane.position.set(0, -2.4, 16.0);
  slabBaseGroup.add(cloudPlane);

  // Stylized soft billowing sea-of-clouds wisps around plinth & bridge (zero hard box edges)
  const wispMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uColor: { value: new THREE.Color('#f4f8ff') } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float d = length((vUv - 0.5) * 2.0);
        float a = smoothstep(1.0, 0.15, d);
        gl_FragColor = vec4(uColor, a * a * 0.52);
      }
    `,
  });
  const wispGeo = new THREE.PlaneGeometry(1, 1);
  const wispSpecs = [
    [-22, -1.7, 10, 22, 26],
    [24, -1.6, 12, 24, 28],
    [-20, -1.8, -16, 26, 22],
    [22, -1.9, -14, 24, 24],
    [-16, -1.7, 36, 22, 22],
    [16, -1.7, 38, 22, 22],
  ];
  for (const [wx, wy, wz, wsx, wsz] of wispSpecs) {
    const wisp = new THREE.Mesh(wispGeo, wispMat);
    wisp.rotation.x = -Math.PI / 2;
    wisp.position.set(wx, wy, wz);
    wisp.scale.set(wsx, wsz, 1);
    slabBaseGroup.add(wisp);
  }

  // 3. Pew-Free Polished Inlaid Marble Nave Floor + Real-Time Planar Reflection (reflects azure stained glass!)
  const naveFloorGeo = new THREE.PlaneGeometry(15.6, 31.4);
  const naveFloor = new THREE.Mesh(naveFloorGeo, mats.naveInlayMat);
  naveFloor.rotation.x = -Math.PI / 2;
  naveFloor.position.set(0, 0.01, -0.5);
  naveFloor.receiveShadow = true;
  slabBaseGroup.add(naveFloor);

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
      uReflStrength: { value: 0.21 },
      uTint: { value: new THREE.Color('#0f234c') },
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
        float edgeFade = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x)
                       * smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.94, vUv.y);
        vec3 col = mix(uTint, refl, 0.72);
        gl_FragColor = vec4(col, uReflStrength * edgeFade);
      }
    `,
  });

  const mirrorGeo = new THREE.PlaneGeometry(14.8, 29.0);
  const mirrorMesh = new THREE.Mesh(mirrorGeo, mirrorMat);
  mirrorMesh.rotation.x = -Math.PI / 2;
  mirrorMesh.position.set(0, 0.015, 0.2);
  mirrorMesh.renderOrder = 1;
  slabBaseGroup.add(mirrorMesh);

  // 4. Ceremonial Royal-Navy & White Woven Runner Carpet Starting Cleanly Deep Inside Nave (zero exterior doorway bleed!)
  const portalMarbleThreshold = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.036, 2.3), mats.whiteMarbleMat);
  portalMarbleThreshold.position.set(0, 0.018, 14.35);
  portalMarbleThreshold.receiveShadow = true;
  slabBaseGroup.add(portalMarbleThreshold);

  const carpetFloorMesh = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.028, 22.8), mats.carpetMat);
  carpetFloorMesh.position.set(0, 0.025, 1.40);
  carpetFloorMesh.receiveShadow = true;
  carpetFloorMesh.renderOrder = 2;
  carpetGroup.add(carpetFloorMesh);

  const silverCarpetGeos = [];
  for (const cx of [-1.335, 1.335]) {
    const edge = new THREE.BoxGeometry(0.032, 0.032, 22.8);
    xform(edge, [cx, 0.026, 1.40]);
    silverCarpetGeos.push(edge);
  }
  const thresholdBar = new THREE.BoxGeometry(2.68, 0.032, 0.05);
  xform(thresholdBar, [0, 0.028, 12.80]);
  silverCarpetGeos.push(thresholdBar);

  // 5. Three-Tier Carrara Marble Sanctuary Dais + Continuous Climbing Altar Carpet up under Easel!
  const daisWhiteGeos = [];
  const stepSpecs = [
    { w: 7.8, frontZ: -10.0, backZ: -14.8, h: 0.22, bottomY: 0.0 },
    { w: 6.4, frontZ: -10.65, backZ: -14.8, h: 0.22, bottomY: 0.22 },
    { w: 5.0, frontZ: -11.30, backZ: -14.8, h: 0.22, bottomY: 0.44 },
  ];

  stepSpecs.forEach((st, idx) => {
    const depth = Math.abs(st.backZ - st.frontZ);
    const centerZ = (st.frontZ + st.backZ) * 0.5;
    const centerY = st.bottomY + st.h * 0.5;
    const riser = new THREE.BoxGeometry(st.w, st.h, depth);
    xform(riser, [0, centerY, centerZ]);
    applyWorldPlanarUVs(riser, 0.32, 0.32);
    daisWhiteGeos.push(riser);

    // Carpet vertical riser face + horizontal tread + polished silver stair rod!
    const cRiser = new THREE.Mesh(new THREE.BoxGeometry(2.65, st.h + 0.02, 0.028), mats.carpetMat);
    cRiser.position.set(0, centerY + 0.01, st.frontZ + 0.012);
    cRiser.receiveShadow = true;
    cRiser.renderOrder = 2;
    carpetGroup.add(cRiser);

    const rod = new THREE.CylinderGeometry(0.022, 0.022, 2.74, 10);
    xform(rod, [0, st.bottomY + 0.022, st.frontZ + 0.028], [0, 0, Math.PI / 2]);
    silverCarpetGeos.push(rod);

    const treadNextZ = idx < 2 ? stepSpecs[idx + 1].frontZ : -14.15;
    const treadLen = Math.abs(treadNextZ - st.frontZ) + 0.04;
    const cTread = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.028, treadLen), mats.carpetMat);
    cTread.position.set(0, st.bottomY + st.h + 0.016, (st.frontZ + treadNextZ) * 0.5);
    cTread.receiveShadow = true;
    cTread.renderOrder = 2;
    carpetGroup.add(cTread);
  });

  const carpetTrimMesh = new THREE.Mesh(mergeClean(silverCarpetGeos), mats.silverTrimMat);
  carpetGroup.add(carpetTrimMesh);

  const daisWhiteMesh = new THREE.Mesh(mergeClean(daisWhiteGeos), mats.whiteMarbleMat);
  daisWhiteMesh.castShadow = true;
  daisWhiteMesh.receiveShadow = true;
  daisGroup.add(daisWhiteMesh);

  // 6. 22-Segment Genshin-Style Forward-Paving Marble Causeway + 3 Entrance Steps (z = 59.6 .. 15.5)
  const roadSegments = [];
  const SEG_COUNT = 22;
  const START_Z = 59.6;
  const STEP_Z = 2.0;

  for (let i = 0; i < SEG_COUNT; i++) {
    const segZ = START_Z - i * STEP_Z;
    const segGroup = new THREE.Group();
    segGroup.position.set(0, 0, segZ);

    const wGeos = [];
    const nGeos = [];

    // Main articulated Carrara bridge stone slab + crisp inlaid flanking curbs (clean marble surface!)
    const slab = new THREE.BoxGeometry(6.4, 0.36, 1.92);
    xform(slab, [0, -0.18, 0]);
    applyWorldPlanarUVs(slab, 0.32, 0.32);
    wGeos.push(slab);

    for (const rx of [-1.25, 1.25]) {
      const borderInlay = new THREE.BoxGeometry(0.14, 0.03, 1.92);
      xform(borderInlay, [rx, 0.012, 0]);
      nGeos.push(borderInlay);
    }

    for (const sx of [-3.35, 3.35]) {
      const curb = new THREE.BoxGeometry(0.42, 0.44, 1.92);
      xform(curb, [sx, -0.06, 0]);
      applyWorldPlanarUVs(curb, 0.4, 0.4);
      wGeos.push(curb);
    }

    // Slender Gothic sentinel pillars at regular intervals
    if (i % 3 === 1 && i <= 19) {
      for (const sx of [-3.38, 3.38]) {
        const post = new THREE.BoxGeometry(0.42, 1.52, 0.42);
        xform(post, [sx, 0.80, 0]);
        applyWorldPlanarUVs(post, 0.45, 0.45);
        wGeos.push(post);

        const cap = new THREE.ConeGeometry(0.28, 0.48, 4);
        xform(cap, [sx, 1.80, 0], [0, Math.PI / 4, 0]);
        nGeos.push(cap);
      }
    }

    const wMesh = new THREE.Mesh(mergeClean(wGeos), mats.whiteMarbleMat);
    wMesh.castShadow = true;
    wMesh.receiveShadow = true;
    const nMesh = new THREE.Mesh(mergeClean(nGeos), mats.navyStoneMat);
    nMesh.castShadow = true;
    nMesh.receiveShadow = true;
    segGroup.add(wMesh, nMesh);

    segGroup.userData.segZ = segZ;
    roadGroup.add(segGroup);
    roadSegments.push(segGroup);
  }

  for (let s = 0; s < 3; s++) {
    const stepZ = 16.95 - s * 0.62;
    const stepGroup = new THREE.Group();
    stepGroup.position.set(0, 0, stepZ);
    const stepGeo = new THREE.BoxGeometry(6.8 - s * 0.45, 0.16, 0.72);
    applyWorldPlanarUVs(stepGeo, 0.4, 0.4);
    const stepMesh = new THREE.Mesh(stepGeo, mats.whiteMarbleMat);
    stepMesh.position.y = 0.04 + s * 0.05;
    stepMesh.castShadow = true;
    stepMesh.receiveShadow = true;
    stepGroup.add(stepMesh);
    stepGroup.userData.segZ = stepZ;
    roadGroup.add(stepGroup);
    roadSegments.push(stepGroup);
  }

  function updateReflection(renderer, scene, camera) {
    if (slabBaseGroup.scale.y < 0.2) return;
    mirrorMesh.visible = false;

    const planeY = 0.015;
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

  function setRoadProgress(roadP) {
    // At roadP = 0, slabs up to z = 44 are solid while z = 44..34 visibly rise out of the clouds in full view!
    // Uniform X/Z scale + pure vertical rise keeps flanking runner border rails dead-straight with zero zigzag!
    const waveZ = THREE.MathUtils.lerp(42.0, 6.0, THREE.MathUtils.clamp(roadP, 0, 1));
    for (let i = 0; i < roadSegments.length; i++) {
      const seg = roadSegments[i];
      const sz = seg.userData.segZ;
      const pSeg = roadP >= 0.999 ? 1.0 : smooth01(sz + 3.8, sz - 9.5, waveZ);
      seg.visible = pSeg > 0.01;
      seg.position.y = (1 - pSeg) * -2.6;
      seg.rotation.x = 0;
      seg.scale.set(1, 1, 1);
    }
  }

  function setBuildProgress(p, roadP = p) {
    const pBase = smooth01(0.0, 0.25, p);
    const pCarpet = smooth01(0.18, 0.55, p);
    const pDais = smooth01(0.22, 0.50, p);

    slabBaseGroup.position.y = (1 - pBase) * -1.2;
    carpetGroup.position.y = (1 - pCarpet) * -0.4;
    carpetGroup.visible = pCarpet > 0.02;
    daisGroup.position.y = (1 - pDais) * -0.9;
    daisGroup.visible = pDais > 0.02;

    setRoadProgress(roadP);
  }

  function update() {}

  function dispose() {
    reflRT.dispose();
    mirrorMat.dispose();
    cloudMat.dispose();
    mirrorGeo.dispose();
    naveFloorGeo.dispose();
  }

  return { group, setBuildProgress, setRoadProgress, update, updateReflection, dispose };
}
