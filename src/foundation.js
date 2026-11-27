import * as THREE from 'three';
import { applyWorldPlanarUVs, mergeClean, smooth01, xform } from './geo.js';

/**
 * Independent Component: Stepped Miniature Diorama Island Plinth, Grounded Navy Mist Ring,
 * Pew-Free Marble Nave Floor, Parvis Causeway & Sanctuary Dais.
 */
export function createFoundationComponent(mats) {
  const group = new THREE.Group();
  group.name = 'foundation';

  const slabBaseGroup = new THREE.Group();
  const parvisGroup = new THREE.Group();
  const daisGroup = new THREE.Group();
  group.add(slabBaseGroup, parvisGroup, daisGroup);

  const terraceWhiteGeos = [];
  const terraceNavyGeos = [];
  const terraceDarkGeos = [];

  // Stepped miniature diorama sanctuary island plinth
  const outerIsland = new THREE.BoxGeometry(28.5, 1.4, 53.5);
  xform(outerIsland, [0, -1.35, 5.2]);
  applyWorldPlanarUVs(outerIsland, 0.18, 0.18);
  terraceNavyGeos.push(outerIsland);

  const midCourtyard = new THREE.BoxGeometry(24.0, 0.45, 48.5);
  xform(midCourtyard, [0, -0.45, 4.6]);
  applyWorldPlanarUVs(midCourtyard, 0.24, 0.24);
  terraceDarkGeos.push(midCourtyard);

  for (const sx of [-11.8, 11.8]) {
    const curb = new THREE.BoxGeometry(0.48, 0.36, 48.5);
    xform(curb, [sx, -0.05, 4.6]);
    applyWorldPlanarUVs(curb, 0.35, 0.35);
    terraceWhiteGeos.push(curb);
  }
  const backCurb = new THREE.BoxGeometry(24.0, 0.36, 0.48);
  xform(backCurb, [0, -0.05, -19.4]);
  applyWorldPlanarUVs(backCurb, 0.35, 0.35);
  terraceWhiteGeos.push(backCurb);

  const subPlinth = new THREE.BoxGeometry(19.6, 0.45, 34.8);
  xform(subPlinth, [0, -0.22, -1.0]);
  applyWorldPlanarUVs(subPlinth, 0.28, 0.28);
  terraceWhiteGeos.push(subPlinth);

  const terraceWhiteMesh = new THREE.Mesh(mergeClean(terraceWhiteGeos), mats.whiteMarbleMat);
  terraceWhiteMesh.receiveShadow = true;
  terraceWhiteMesh.castShadow = true;
  const terraceNavyMesh = new THREE.Mesh(mergeClean(terraceNavyGeos), mats.navyStoneMat);
  terraceNavyMesh.receiveShadow = true;
  const terraceDarkMesh = new THREE.Mesh(mergeClean(terraceDarkGeos), mats.matteBasaltMat);
  terraceDarkMesh.receiveShadow = true;
  slabBaseGroup.add(terraceWhiteMesh, terraceNavyMesh, terraceDarkMesh);

  // Luminous Prussian-navy mist sea plane surrounding the diorama island (grounds Shot 3 in mist!)
  const mistMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uInnerColor: { value: new THREE.Color('#274d94') },
      uOuterColor: { value: new THREE.Color('#071128') },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform vec3 uInnerColor;
      uniform vec3 uOuterColor;
      varying vec2 vUv;
      void main() {
        float d = length((vUv - 0.5) * 2.0);
        float ring = smoothstep(1.0, 0.12, d);
        float halo = smoothstep(0.65, 0.28, d) * 0.35;
        vec3 col = mix(uOuterColor, uInnerColor, min(1.0, ring + halo));
        gl_FragColor = vec4(col, clamp(ring * 0.78 + halo * 0.35, 0.0, 0.90));
      }
    `,
  });
  const mistPlane = new THREE.Mesh(new THREE.PlaneGeometry(165, 165), mistMat);
  mistPlane.rotation.x = -Math.PI / 2;
  mistPlane.position.set(0, -1.42, 4.0);
  slabBaseGroup.add(mistPlane);

  const naveFloorGeo = new THREE.PlaneGeometry(12.4, 30.8);
  const naveFloor = new THREE.Mesh(naveFloorGeo, mats.naveInlayMat);
  naveFloor.rotation.x = -Math.PI / 2;
  naveFloor.position.set(0, 0.01, -1.0);
  naveFloor.receiveShadow = true;
  slabBaseGroup.add(naveFloor);

  // Subtle dark-mirror planar reflection on central aisle (crisp, never smears over side tiles!)
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
      uTint: { value: new THREE.Color('#0c152b') },
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
        float edgeFade = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x)
                       * smoothstep(0.0, 0.10, vUv.y) * smoothstep(1.0, 0.90, vUv.y);
        vec3 col = mix(uTint, refl, 0.62);
        gl_FragColor = vec4(col, uReflStrength * edgeFade);
      }
    `,
  });

  const runnerGeo = new THREE.PlaneGeometry(4.1, 25.0);
  const runnerMesh = new THREE.Mesh(runnerGeo, mirrorMat);
  runnerMesh.rotation.x = -Math.PI / 2;
  runnerMesh.position.set(0, 0.016, 1.2);
  runnerMesh.renderOrder = 1;
  slabBaseGroup.add(runnerMesh);

  // Parvis causeway
  const parvisWhiteGeos = [];
  const parvisDarkGeos = [];
  const causewayBase = new THREE.BoxGeometry(8.4, 0.42, 23.4);
  xform(causewayBase, [0, -0.22, 27.0]);
  applyWorldPlanarUVs(causewayBase, 0.25, 0.25);
  parvisDarkGeos.push(causewayBase);

  const causewayDeck = new THREE.BoxGeometry(7.0, 0.12, 23.2);
  xform(causewayDeck, [0, -0.02, 27.0]);
  applyWorldPlanarUVs(causewayDeck, 0.35, 0.35);
  parvisWhiteGeos.push(causewayDeck);

  for (let i = 0; i < 4; i++) {
    const pz = 18.8 + i * 5.2;
    for (const sx of [-3.7, 3.7]) {
      const post = new THREE.BoxGeometry(0.46, 1.48, 0.46);
      xform(post, [sx, 0.74, pz]);
      applyWorldPlanarUVs(post, 0.5, 0.5);
      parvisWhiteGeos.push(post);

      const cap = new THREE.ConeGeometry(0.32, 0.48, 4);
      xform(cap, [sx, 1.72, pz], [0, Math.PI / 4, 0]);
      parvisDarkGeos.push(cap);
    }
  }

  for (let s = 0; s < 3; s++) {
    const step = new THREE.BoxGeometry(6.6 - s * 0.4, 0.14, 0.75);
    xform(step, [0, 0.03 + s * 0.05, 16.5 - s * 0.55]);
    applyWorldPlanarUVs(step, 0.4, 0.4);
    parvisWhiteGeos.push(step);
  }

  const parvisWhiteMesh = new THREE.Mesh(mergeClean(parvisWhiteGeos), mats.whiteMarbleMat);
  parvisWhiteMesh.castShadow = true;
  parvisWhiteMesh.receiveShadow = true;
  const parvisDarkMesh = new THREE.Mesh(mergeClean(parvisDarkGeos), mats.obsidianMat);
  parvisDarkMesh.castShadow = true;
  parvisDarkMesh.receiveShadow = true;
  parvisGroup.add(parvisWhiteMesh, parvisDarkMesh);

  // Sanctuary Dais
  const daisWhiteGeos = [];
  const daisDarkGeos = [];
  const tiers = [
    { w: 7.4, d: 5.8, h: 0.22, y: 0.11 },
    { w: 6.0, d: 4.6, h: 0.22, y: 0.33 },
    { w: 4.5, d: 3.4, h: 0.24, y: 0.56 },
  ];
  tiers.forEach((tr, idx) => {
    const riser = new THREE.BoxGeometry(tr.w, tr.h, tr.d);
    xform(riser, [0, tr.y, -12.5]);
    applyWorldPlanarUVs(riser, 0.35, 0.35);
    daisWhiteGeos.push(riser);

    const trim = new THREE.BoxGeometry(tr.w + 0.08, 0.05, tr.d + 0.08);
    xform(trim, [0, tr.y + tr.h * 0.5 + 0.02, -12.5]);
    applyWorldPlanarUVs(trim, 0.4, 0.4);
    if (idx === 2) daisDarkGeos.push(trim);
    else daisWhiteGeos.push(trim);
  });

  const daisWhiteMesh = new THREE.Mesh(mergeClean(daisWhiteGeos), mats.brightAlabasterMat);
  daisWhiteMesh.castShadow = true;
  daisWhiteMesh.receiveShadow = true;
  const daisDarkMesh = new THREE.Mesh(mergeClean(daisDarkGeos), mats.obsidianMat);
  daisDarkMesh.castShadow = true;
  daisDarkMesh.receiveShadow = true;
  daisGroup.add(daisWhiteMesh, daisDarkMesh);

  function updateReflection(renderer, scene, camera) {
    if (slabBaseGroup.scale.y < 0.2) return;
    runnerMesh.visible = false;

    const planeY = 0.016;
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

    runnerMesh.visible = true;
  }

  function setBuildProgress(p) {
    const pBase = smooth01(0.0, 0.28, p);
    const pParvis = smooth01(0.02, 0.30, p);
    const pDais = smooth01(0.22, 0.50, p);

    slabBaseGroup.position.y = (1 - pBase) * -1.45;
    slabBaseGroup.scale.set(1, 1, 1);

    parvisGroup.position.y = (1 - pParvis) * -1.35;
    parvisGroup.scale.set(1, 1, 1);

    daisGroup.position.y = (1 - pDais) * -0.9;
    daisGroup.scale.set(1, 1, 1);
  }

  function update() {}

  function dispose() {
    reflRT.dispose();
    mirrorMat.dispose();
    mistMat.dispose();
    runnerGeo.dispose();
    naveFloorGeo.dispose();
  }

  return { group, setBuildProgress, update, updateReflection, dispose };
}
