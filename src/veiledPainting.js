import * as THREE from 'three';
import { applyWorldPlanarUVs, mergeClean, smooth01, xform } from './geo.js';

/**
 * Independent Component: Central Sanctuary Unfinished Painting & Sculpted Gravity-Draped Cloth Shroud.
 */
export function createVeiledPaintingComponent(textures, mats) {
  const group = new THREE.Group();
  group.name = 'veiledPainting';
  group.position.set(0, 0.68, -12.5);

  const easelGroup = new THREE.Group();
  const canvasGroup = new THREE.Group();
  const shroudGroup = new THREE.Group();
  group.add(easelGroup, canvasGroup, shroudGroup);

  const CANVAS_W = 2.75;
  const CANVAS_H = 3.55;
  const CANVAS_CENTER_Y = 2.74;
  const TILT_RAD = -0.075;

  // 1. Carved Architectural Obsidian Easel (all 3 feet have matching stepped obsidian shoes)
  const easelDark = [];
  const easelSilver = [];

  for (const [lx, tiltZ] of [[-1.08, -0.055], [1.08, 0.055]]) {
    const leg = new THREE.BoxGeometry(0.18, 5.15, 0.20);
    xform(leg, [lx, 2.52, 0.14], [TILT_RAD, 0, tiltZ]);
    applyWorldPlanarUVs(leg, 0.5, 0.5);
    easelDark.push(leg);

    const foot = new THREE.BoxGeometry(0.30, 0.12, 0.34);
    xform(foot, [lx * 1.07, 0.06, 0.31]);
    easelDark.push(foot);
  }

  const centerMast = new THREE.BoxGeometry(0.20, 5.35, 0.20);
  xform(centerMast, [0, 2.62, 0.04], [TILT_RAD, 0, 0]);
  easelDark.push(centerMast);

  const centerFoot = new THREE.BoxGeometry(0.30, 0.12, 0.34);
  xform(centerFoot, [0, 0.06, 0.22]);
  easelDark.push(centerFoot);

  const crossBrace = new THREE.BoxGeometry(2.05, 0.14, 0.14);
  xform(crossBrace, [0, 1.55, 0.08], [TILT_RAD, 0, 0]);
  easelDark.push(crossBrace);

  const rearStrut = new THREE.BoxGeometry(0.18, 4.6, 0.18);
  xform(rearStrut, [0, 2.1, -1.02], [0.42, 0, 0]);
  easelDark.push(rearStrut);

  const ledge = new THREE.BoxGeometry(3.15, 0.15, 0.36);
  xform(ledge, [0, 0.88, 0.36], [TILT_RAD, 0, 0]);
  applyWorldPlanarUVs(ledge, 0.5, 0.5);
  easelDark.push(ledge);

  for (const bx of [-1.45, 1.45]) {
    const bracket = new THREE.BoxGeometry(0.10, 0.17, 0.38);
    xform(bracket, [bx, 0.88, 0.36], [TILT_RAD, 0, 0]);
    easelSilver.push(bracket);
  }
  // Subtle inlaid silver hairline edge accents so the obsidian easel silhouette separates cleanly from the apse wall
  for (const [lx, tiltZ] of [[-1.08, -0.055], [1.08, 0.055]]) {
    const legTrim = new THREE.BoxGeometry(0.03, 4.95, 0.03);
    xform(legTrim, [lx, 2.52, 0.25], [TILT_RAD, 0, tiltZ]);
    easelSilver.push(legTrim);
  }
  const mastTrim = new THREE.BoxGeometry(0.032, 5.15, 0.032);
  xform(mastTrim, [0, 2.62, 0.15], [TILT_RAD, 0, 0]);
  const ledgeTrim = new THREE.BoxGeometry(3.16, 0.028, 0.03);
  xform(ledgeTrim, [0, 0.94, 0.53], [TILT_RAD, 0, 0]);
  easelSilver.push(mastTrim, ledgeTrim);

  const easelDarkMesh = new THREE.Mesh(mergeClean(easelDark), mats.obsidianMat);
  easelDarkMesh.castShadow = true;
  easelDarkMesh.receiveShadow = true;
  const easelSilverMesh = new THREE.Mesh(mergeClean(easelSilver), mats.silverTrimMat);
  easelGroup.add(easelDarkMesh, easelSilverMesh);

  // 2. Stretched Unfinished Canvas
  const easelTiltGroup = new THREE.Group();
  easelTiltGroup.position.set(0, CANVAS_CENTER_Y, 0.20);
  easelTiltGroup.rotation.x = TILT_RAD;
  canvasGroup.add(easelTiltGroup);

  const canvasTex = textures.unfinishedCanvasTex('sanctuary-unfinished-canvas');
  const canvasMat = new THREE.MeshStandardMaterial({
    map: canvasTex,
    roughness: 0.78,
    metalness: 0.02,
  });
  const canvasBox = new THREE.Mesh(new THREE.BoxGeometry(CANVAS_W, CANVAS_H, 0.11), [
    mats.whiteMarbleMat,
    mats.whiteMarbleMat,
    mats.whiteMarbleMat,
    mats.whiteMarbleMat,
    canvasMat,
    mats.matteBasaltMat,
  ]);
  canvasBox.castShadow = true;
  canvasBox.receiveShadow = true;
  easelTiltGroup.add(canvasBox);

  // 3. Sculpted Gravity-Draped Ceremonial Linen Shroud (continuous C-infinity folds across entire cloth!)
  const shroudTiltGroup = new THREE.Group();
  shroudTiltGroup.position.set(0, CANVAS_CENTER_Y, 0.20);
  shroudTiltGroup.rotation.x = TILT_RAD;
  shroudGroup.add(shroudTiltGroup);

  const SEGS_X = 84;
  const SEGS_Y = 96;
  const clothGeo = new THREE.PlaneGeometry(CANVAS_W + 0.32, CANVAS_H + 0.16, SEGS_X, SEGS_Y);
  const posAttr = clothGeo.attributes.position;
  const baseZ = new Float32Array(posAttr.count);
  const baseX = new Float32Array(posAttr.count);
  const baseY = new Float32Array(posAttr.count);

  const halfW = (CANVAS_W + 0.32) * 0.5;
  const halfH = (CANVAS_H + 0.16) * 0.5;

  for (let i = 0; i < posAttr.count; i++) {
    let x = posAttr.getX(i);
    let y = posAttr.getY(i);
    const u = (x + halfW) / (2 * halfW); // 0 = left, 1 = right
    const v = (y + halfH) / (2 * halfH); // 0 = bottom, 1 = top

    // Global smoothstep lift (v=0.96..0.0) eliminates any horizontal shading band across the cloth midsection!
    const revealMask = Math.pow(smooth01(0.28, 0.96, u) * smooth01(0.96, 0.02, v), 1.55);
    y += revealMask * 1.72;
    x -= revealMask * 0.34;

    const minBottomY = -CANVAS_H * 0.5 + 0.07;
    if (y < minBottomY) y = minBottomY;

    // Gentle organic gravity taper along left vertical edge
    if (u < 0.14) {
      const edgeT = 1 - u / 0.14;
      x += Math.sin(v * Math.PI * 2.0) * 0.032 * edgeT;
    }

    let z = 0.176;
    if (v > 0.92) {
      const topT = smooth01(0.92, 1.0, v);
      z = THREE.MathUtils.lerp(0.176, -0.10, topT);
      y -= topT * 0.12;
    } else {
      const topSag = Math.sin(u * Math.PI) * 0.068 * smooth01(0.60, 0.92, v);
      y -= topSag;
    }

    const sideWrap = smooth01(0.90, 1.0, Math.abs(x) / halfW) * (1 - revealMask * 0.9);
    z -= sideWrap * 0.10;

    // Deep full-height gravity folds & radiating gather pleats without any hard Z clamp kink
    const hangFade = smooth01(1.0, 0.72, v);
    const vertFoldA = Math.sin(u * 14.5 + Math.sin(v * 2.2) * 0.45) * 0.062;
    const vertFoldB = Math.sin(u * 27.0 - v * 2.0 + 0.8) * 0.024;
    const radialFold = Math.sin((u * 1.2 - v * 0.85) * 18.0) * 0.044 * Math.pow(revealMask, 0.75);
    const sweptBillow = Math.sin(revealMask * Math.PI) * 0.16;

    z += (vertFoldA + vertFoldB) * (0.28 + 0.72 * hangFade) + radialFold + sweptBillow;

    posAttr.setXYZ(i, x, y, z);
    baseX[i] = x;
    baseY[i] = y;
    baseZ[i] = z;
  }
  clothGeo.computeVertexNormals();

  const clothMesh = new THREE.Mesh(clothGeo, mats.shroudMat);
  clothMesh.castShadow = true;
  clothMesh.receiveShadow = true;
  shroudTiltGroup.add(clothMesh);

  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 4.4, 1.2),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitMesh.position.set(0, CANVAS_CENTER_Y, 0.2);
  hitMesh.userData.exhibitId = 'unfinished-opus';
  group.add(hitMesh);

  function setBuildProgress(p) {
    const pEasel = smooth01(0.22, 0.50, p);
    const pCanvas = smooth01(0.30, 0.56, p);
    const pShroud = smooth01(0.40, 0.66, p);

    easelGroup.position.y = (1 - pEasel) * -1.4;
    easelGroup.visible = pEasel > 0.02;
    canvasGroup.position.y = (1 - pCanvas) * 1.4;
    canvasGroup.visible = pCanvas > 0.02;
    shroudGroup.position.y = (1 - pShroud) * 2.2;
    shroudGroup.visible = pShroud > 0.02;
  }

  function update(dt, elapsed) {
    for (let i = 0; i < posAttr.count; i++) {
      const yNorm = THREE.MathUtils.clamp(1.0 - (baseY[i] + halfH) / (2 * halfH), 0, 1);
      const sway = Math.sin(elapsed * 1.25 + baseX[i] * 2.0 + baseY[i] * 1.3) * 0.012 * yNorm * yNorm;
      posAttr.setZ(i, baseZ[i] + sway);
    }
    posAttr.needsUpdate = true;
  }

  function dispose() {
    clothGeo.dispose();
    canvasMat.dispose();
  }

  return { group, hitMesh, setBuildProgress, update, dispose };
}
