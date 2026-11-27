import * as THREE from 'three';
import { applyWorldPlanarUVs, mergeClean, smooth01, xform } from './geo.js';

/**
 * Independent Component: West Gothic Facade (wide 15.9m span, carved wheel rose window,
 * telescoping twin bell spires, & sculpted double portal doors with NaN-safe threshold rays).
 */
export function createPortalDoorsComponent(mats) {
  const group = new THREE.Group();
  group.name = 'portalDoors';

  const facadeGroup = new THREE.Group();
  const towerBaseGroup = new THREE.Group();
  const spiresGroup = new THREE.Group();
  const hingeLeft = new THREE.Group();
  const hingeRight = new THREE.Group();
  group.add(facadeGroup, towerBaseGroup, spiresGroup, hingeLeft, hingeRight);

  const FACADE_Z = 15.2;
  const DOOR_HALF_W = 1.75;
  const DOOR_H = 5.80;

  const whiteGeos = [];
  const navyGeos = [];

  const facShape = new THREE.Shape();
  facShape.moveTo(-7.9, 0);
  facShape.lineTo(7.9, 0);
  facShape.lineTo(7.9, 8.9);
  facShape.lineTo(0, 16.2);
  facShape.lineTo(-7.9, 8.9);
  facShape.closePath();

  const doorHole = new THREE.Path();
  doorHole.moveTo(-DOOR_HALF_W, 0);
  doorHole.lineTo(-DOOR_HALF_W, DOOR_H);
  doorHole.lineTo(DOOR_HALF_W, DOOR_H);
  doorHole.lineTo(DOOR_HALF_W, 0);
  doorHole.closePath();
  facShape.holes.push(doorHole);

  const roseHole = new THREE.Path();
  roseHole.absarc(0, 10.9, 1.66, 0, Math.PI * 2, true);
  facShape.holes.push(roseHole);

  const facGeo = new THREE.ExtrudeGeometry(facShape, { depth: 0.72, bevelEnabled: false, curveSegments: 24 });
  facGeo.translate(0, 0, FACADE_Z - 0.36);
  applyWorldPlanarUVs(facGeo, 0.18, 0.18);
  navyGeos.push(facGeo);

  for (const side of [-1, 1]) {
    for (let j = 0; j < 3; j++) {
      const jamb = new THREE.BoxGeometry(0.30, 5.9 + j * 0.3, 0.38);
      xform(jamb, [side * (DOOR_HALF_W + 0.15 + j * 0.26), (5.9 + j * 0.3) * 0.5, FACADE_Z + 0.42 - j * 0.08]);
      applyWorldPlanarUVs(jamb, 0.45, 0.45);
      whiteGeos.push(jamb);
    }
  }

  const tympShape = new THREE.Shape();
  tympShape.moveTo(-DOOR_HALF_W - 0.12, DOOR_H - 0.02);
  tympShape.quadraticCurveTo(-1.15, 7.3, 0, 8.1);
  tympShape.quadraticCurveTo(1.15, 7.3, DOOR_HALF_W + 0.12, DOOR_H - 0.02);
  tympShape.closePath();
  const tympGeo = new THREE.ExtrudeGeometry(tympShape, { depth: 0.24, bevelEnabled: false });
  tympGeo.translate(0, 0, FACADE_Z + 0.22);
  applyWorldPlanarUVs(tympGeo, 0.36, 0.36);
  whiteGeos.push(tympGeo);

  const archSteps = 14;
  for (const side of [-1, 1]) {
    for (let i = 0; i < archSteps; i++) {
      const t0 = i / archSteps;
      const t1 = (i + 1) / archSteps;
      const x0 = side * 2.28 * Math.pow(1 - t0, 0.85);
      const y0 = 5.75 + 2.55 * Math.sin(t0 * Math.PI * 0.5);
      const x1 = side * 2.28 * Math.pow(1 - t1, 0.85);
      const y1 = 5.75 + 2.55 * Math.sin(t1 * Math.PI * 0.5);
      const len = Math.hypot(x1 - x0, y1 - y0) + 0.05;
      const ang = Math.atan2(y1 - y0, x1 - x0);
      const voussoir = new THREE.BoxGeometry(len, 0.32, 0.56);
      xform(voussoir, [(x0 + x1) * 0.5, (y0 + y1) * 0.5, FACADE_Z + 0.38], [0, 0, ang]);
      applyWorldPlanarUVs(voussoir, 0.45, 0.45);
      whiteGeos.push(voussoir);
    }
  }

  // Carved wheel rose window ring + 12 delicate radial white stone spokes
  const roseRing = new THREE.TorusGeometry(1.72, 0.16, 10, 36);
  xform(roseRing, [0, 10.9, FACADE_Z + 0.36]);
  whiteGeos.push(roseRing);
  const roseHub = new THREE.TorusGeometry(0.38, 0.06, 8, 20);
  xform(roseHub, [0, 10.9, FACADE_Z + 0.38]);
  whiteGeos.push(roseHub);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const spoke = new THREE.BoxGeometry(0.065, 1.32, 0.10);
    xform(spoke, [Math.cos(a) * 1.02, 10.9 + Math.sin(a) * 1.02, FACADE_Z + 0.34], [0, 0, a - Math.PI / 2]);
    whiteGeos.push(spoke);
  }

  const roseMat = mats.roseGlassMat.clone();
  roseMat.transparent = true;
  const roseDisc = new THREE.Mesh(new THREE.CircleGeometry(1.68, 36), roseMat);
  roseDisc.position.set(0, 10.9, FACADE_Z + 0.24);
  facadeGroup.add(roseDisc);

  // Twin Articulated Gothic Westwork Towers split L/R so 2.5D gallery cutaway fades near-side tower cleanly!
  const leftTowerGroup = new THREE.Group();
  const rightTowerGroup = new THREE.Group();
  towerBaseGroup.add(leftTowerGroup, rightTowerGroup);
  const leftSpireGroup = new THREE.Group();
  const rightSpireGroup = new THREE.Group();
  spiresGroup.add(leftSpireGroup, rightSpireGroup);

  function buildTowerSide(side, tbOut, spOut) {
    const tbWMat = mats.whiteMarbleMat.clone();
    tbWMat.transparent = true;
    const spWMat = mats.whiteMarbleMat.clone();
    spWMat.transparent = true;
    const spNMat = mats.navyStoneMat.clone();
    spNMat.transparent = true;
    const gMat = mats.lancetGlassMat.clone();
    gMat.transparent = true;

    const tbWhiteGeos = [];
    const spWhiteGeos = [];
    const spNavyGeos = [];

    const sx = side * 6.85;
    const towerLower = new THREE.BoxGeometry(2.3, 12.0, 2.3);
    xform(towerLower, [sx, 6.0, FACADE_Z]);
    applyWorldPlanarUVs(towerLower, 0.26, 0.26);
    tbWhiteGeos.push(towerLower);

    for (const [cx, cz] of [[-1.08, -1.08], [1.08, -1.08], [-1.08, 1.08], [1.08, 1.08]]) {
      const pilLow = new THREE.BoxGeometry(0.32, 12.0, 0.32);
      xform(pilLow, [sx + cx, 6.0, FACADE_Z + cz]);
      applyWorldPlanarUVs(pilLow, 0.34, 0.34);
      tbWhiteGeos.push(pilLow);

      const pilUp = new THREE.BoxGeometry(0.32, 4.6, 0.32);
      xform(pilUp, [sx + cx, 14.3, FACADE_Z + cz]);
      applyWorldPlanarUVs(pilUp, 0.34, 0.34);
      spWhiteGeos.push(pilUp);

      const miniSpire = new THREE.ConeGeometry(0.21, 1.22, 4);
      xform(miniSpire, [sx + cx, 17.25, FACADE_Z + cz], [0, Math.PI / 4, 0]);
      spWhiteGeos.push(miniSpire);
    }

    const belt = new THREE.BoxGeometry(2.56, 0.28, 2.56);
    xform(belt, [sx, 12.05, FACADE_Z]);
    spNavyGeos.push(belt);

    const belfry = new THREE.BoxGeometry(2.12, 4.4, 2.12);
    xform(belfry, [sx, 14.4, FACADE_Z]);
    applyWorldPlanarUVs(belfry, 0.28, 0.28);
    spNavyGeos.push(belfry);

    const belfryCap = new THREE.BoxGeometry(2.46, 0.28, 2.46);
    xform(belfryCap, [sx, 16.7, FACADE_Z]);
    spWhiteGeos.push(belfryCap);

    const needle = new THREE.ConeGeometry(1.24, 5.6, 8);
    xform(needle, [sx, 19.6, FACADE_Z]);
    applyWorldPlanarUVs(needle, 0.28, 0.28);
    spNavyGeos.push(needle);

    const tbMesh = new THREE.Mesh(mergeClean(tbWhiteGeos), tbWMat);
    tbMesh.castShadow = true;
    tbMesh.receiveShadow = true;
    const towerGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 4.7), gMat);
    towerGlass.position.set(sx, 8.0, FACADE_Z + 1.18);
    tbOut.add(tbMesh, towerGlass);

    const swMesh = new THREE.Mesh(mergeClean(spWhiteGeos), spWMat);
    swMesh.castShadow = true;
    swMesh.receiveShadow = true;
    const snMesh = new THREE.Mesh(mergeClean(spNavyGeos), spNMat);
    snMesh.castShadow = true;
    snMesh.receiveShadow = true;
    spOut.add(swMesh, snMesh);

    for (const bx of [-0.44, 0.44]) {
      const louver = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 2.45), gMat);
      louver.position.set(sx + bx, 14.4, FACADE_Z + 1.08);
      spOut.add(louver);
    }

    return [tbWMat, spWMat, spNMat, gMat];
  }

  const leftTowerMats = buildTowerSide(-1, leftTowerGroup, leftSpireGroup);
  const rightTowerMats = buildTowerSide(1, rightTowerGroup, rightSpireGroup);

  const facWhiteMat = mats.brightAlabasterMat.clone();
  facWhiteMat.transparent = true;
  const facNavyMat = mats.navyStoneMat.clone();
  facNavyMat.transparent = true;
  const doorObsMat = mats.doorWoodMat.clone();
  doorObsMat.transparent = true;
  const doorSilMat = mats.silverTrimMat.clone();
  doorSilMat.transparent = true;
  const frontCutawayMats = [roseMat, facWhiteMat, facNavyMat, doorObsMat, doorSilMat];

  const facWhiteMesh = new THREE.Mesh(mergeClean(whiteGeos), facWhiteMat);
  facWhiteMesh.castShadow = true;
  facWhiteMesh.receiveShadow = true;
  const facNavyMesh = new THREE.Mesh(mergeClean(navyGeos), facNavyMat);
  facNavyMesh.castShadow = true;
  facNavyMesh.receiveShadow = true;
  facadeGroup.add(facWhiteMesh, facNavyMesh);

  function buildDoorLeaf(side) {
    const leafObsidian = [];
    const leafSilver = [];
    const offsetX = side < 0 ? DOOR_HALF_W * 0.5 : -DOOR_HALF_W * 0.5;

    const slab = new THREE.BoxGeometry(DOOR_HALF_W + 0.01, DOOR_H, 0.24);
    xform(slab, [offsetX, DOOR_H * 0.5, 0]);
    applyWorldPlanarUVs(slab, 0.45, 0.45);
    leafObsidian.push(slab);

    // Overlap astragal molding on left leaf so center door seam has zero light leak when closed
    if (side < 0) {
      const astragal = new THREE.BoxGeometry(0.12, DOOR_H - 0.1, 0.28);
      xform(astragal, [DOOR_HALF_W, DOOR_H * 0.5, 0.01]);
      leafObsidian.push(astragal);
    }

    const outerFrameL = new THREE.BoxGeometry(0.14, DOOR_H - 0.16, 0.30);
    xform(outerFrameL, [offsetX - 0.76, DOOR_H * 0.5, 0]);
    const outerFrameR = new THREE.BoxGeometry(0.14, DOOR_H - 0.16, 0.30);
    xform(outerFrameR, [offsetX + 0.76, DOOR_H * 0.5, 0]);
    const midRail = new THREE.BoxGeometry(DOOR_HALF_W - 0.16, 0.18, 0.30);
    xform(midRail, [offsetX, 2.55, 0]);
    const topRail = new THREE.BoxGeometry(DOOR_HALF_W - 0.16, 0.22, 0.30);
    xform(topRail, [offsetX, DOOR_H - 0.15, 0]);
    leafObsidian.push(outerFrameL, outerFrameR, midRail, topRail);

    for (const px of [-0.38, 0.38]) {
      const upperPanel = new THREE.BoxGeometry(0.56, 2.48, 0.27);
      xform(upperPanel, [offsetX + px, 4.05, 0]);
      const lowerPanel = new THREE.BoxGeometry(0.56, 1.92, 0.27);
      xform(lowerPanel, [offsetX + px, 1.30, 0]);
      leafObsidian.push(upperPanel, lowerPanel);

      const archL = new THREE.BoxGeometry(0.32, 0.055, 0.31);
      xform(archL, [offsetX + px - 0.11, 5.20, 0], [0, 0, 0.65]);
      const archR = new THREE.BoxGeometry(0.32, 0.055, 0.31);
      xform(archR, [offsetX + px + 0.11, 5.20, 0], [0, 0, -0.65]);
      leafSilver.push(archL, archR);
    }

    const rosette = new THREE.CylinderGeometry(0.14, 0.17, 0.06, 8);
    xform(rosette, [offsetX + (side < 0 ? 0.56 : -0.56), 2.35, 0.14], [Math.PI / 2, 0, 0]);
    const bossStud = new THREE.OctahedronGeometry(0.055, 0);
    xform(bossStud, [offsetX + (side < 0 ? 0.56 : -0.56), 2.35, 0.18]);
    const handle = new THREE.TorusGeometry(0.15, 0.036, 10, 24);
    xform(handle, [offsetX + (side < 0 ? 0.56 : -0.56), 2.16, 0.19]);
    leafSilver.push(rosette, bossStud, handle);

    const leafGroup = new THREE.Group();
    const obsMesh = new THREE.Mesh(mergeClean(leafObsidian), doorObsMat);
    obsMesh.castShadow = true;
    obsMesh.receiveShadow = true;
    const silverMesh = new THREE.Mesh(mergeClean(leafSilver), doorSilMat);
    leafGroup.add(obsMesh, silverMesh);
    return leafGroup;
  }

  hingeLeft.position.set(-DOOR_HALF_W, 0, FACADE_Z + 0.05);
  hingeRight.position.set(DOOR_HALF_W, 0, FACADE_Z + 0.05);
  hingeLeft.add(buildDoorLeaf(-1));
  hingeRight.add(buildDoorLeaf(1));

  // NaN-safe soft cerulean-ice threshold glow spilling gently across entrance stairs
  const seamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uGlow: { value: 0.0 },
      uColor: { value: new THREE.Color('#a4cbff') },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform float uGlow;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float ux = clamp(vUv.x, 0.0, 1.0);
        float uy = clamp(vUv.y, 0.0, 1.0);
        float s = max(0.0, sin(ux * 3.14159265));
        float xFade = s * s;
        float yFade = smoothstep(0.0, 0.25, uy) * smoothstep(1.0, 0.15, uy);
        gl_FragColor = vec4(uColor, clamp(xFade * yFade * uGlow, 0.0, 1.0));
      }
    `,
  });
  const floorSpillMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 5.4), seamMat);
  floorSpillMesh.rotation.x = -Math.PI / 2;
  floorSpillMesh.position.set(0, 0.06, FACADE_Z + 1.6);
  group.add(floorSpillMesh);

  function setDoorOpen(t) {
    const doorProgress = THREE.MathUtils.clamp(t, 0, 1);
    const swing = smooth01(0.04, 1.0, doorProgress) * THREE.MathUtils.degToRad(82);
    hingeLeft.rotation.y = swing;
    hingeRight.rotation.y = -swing;
    const flare = Math.sin(Math.min(1, doorProgress * 1.1) * Math.PI * 0.85);
    seamMat.uniforms.uGlow.value = flare * 0.36;
  }

  let builtFacVisible = true;
  let builtSpireVisible = true;
  let builtDoorsVisible = true;

  function setBuildProgress(p) {
    const pFac = smooth01(0.02, 0.36, p);
    const pSpire = smooth01(0.06, 0.44, p);
    const pDoors = smooth01(0.06, 0.38, p);

    builtFacVisible = pFac > 0.02;
    builtSpireVisible = pSpire > 0.02;
    builtDoorsVisible = pDoors > 0.02;

    facadeGroup.position.y = (1 - pFac) * -1.4;
    facadeGroup.visible = builtFacVisible && facNavyMat.opacity > 0.08;

    towerBaseGroup.position.y = (1 - pFac) * -1.4;
    towerBaseGroup.visible = builtFacVisible;

    const towerYOff = (1 - pFac) * -1.4;
    const spireSY = THREE.MathUtils.lerp(0.22, 1.0, pSpire);
    spiresGroup.scale.set(1, spireSY, 1);
    spiresGroup.position.y = towerYOff + 12.05 * (1 - spireSY);
    spiresGroup.visible = builtSpireVisible;

    hingeLeft.position.y = (1 - pDoors) * -1.2;
    hingeRight.position.y = (1 - pDoors) * -1.2;
  }

  function update(dt, elapsed, camera) {
    if (!camera) return;
    const camX = camera.position.x;
    const camZ = camera.position.z;
    const inCutawayBand = camZ < 24.5 && camZ > -18.5 && camera.position.y < 19.5;
    const cutLeft = inCutawayBand && camX < -8.5;
    const cutRight = inCutawayBand && camX > 8.5;
    const isOverheadGallery = cutLeft || cutRight;
    const lerp = Math.min(1, dt * 10 || 1);

    leftTowerMats.forEach((m) => {
      m.opacity += ((cutLeft ? 0.0 : 1.0) - m.opacity) * lerp;
      m.depthWrite = m.opacity > 0.95;
    });
    rightTowerMats.forEach((m) => {
      m.opacity += ((cutRight ? 0.0 : 1.0) - m.opacity) * lerp;
      m.depthWrite = m.opacity > 0.95;
    });
    frontCutawayMats.forEach((m) => {
      m.opacity += ((isOverheadGallery ? 0.0 : 1.0) - m.opacity) * lerp;
      m.depthWrite = m.opacity > 0.95;
    });

    leftTowerGroup.visible = builtFacVisible && leftTowerMats[0].opacity > 0.08;
    leftSpireGroup.visible = builtSpireVisible && leftTowerMats[0].opacity > 0.08;
    rightTowerGroup.visible = builtFacVisible && rightTowerMats[0].opacity > 0.08;
    rightSpireGroup.visible = builtSpireVisible && rightTowerMats[0].opacity > 0.08;

    const frontShow = facNavyMat.opacity > 0.08;
    facadeGroup.visible = builtFacVisible && frontShow;
    hingeLeft.visible = builtDoorsVisible && frontShow;
    hingeRight.visible = builtDoorsVisible && frontShow;
    floorSpillMesh.visible = builtDoorsVisible && frontShow;
  }

  function dispose() {
    seamMat.dispose();
  }

  return { group, setBuildProgress, setDoorOpen, update, dispose };
}
