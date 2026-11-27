import * as THREE from 'three';
import { applyWorldPlanarUVs, mergeClean, smooth01, xform } from './geo.js';

/**
 * Independent Component: Tall Classical Studio A-Frame Artist Easel (2 splayed front legs + rear prop + tall upper mast/clamp),
 * Unfinished Azure Sanctuary Canvas & Soft Fluid Draped Linen Drop-Cloth (curved shoulder + smooth diagonal hem).
 */
export function createVeiledPaintingComponent(textures, mats) {
  const group = new THREE.Group();
  group.name = 'veiledPainting';
  group.position.set(0, 0.68, -12.3);

  const easelGroup = new THREE.Group();
  const canvasGroup = new THREE.Group();
  const shroudGroup = new THREE.Group();
  group.add(easelGroup, canvasGroup, shroudGroup);

  const CANVAS_W = 2.18;
  const CANVAS_H = 2.82;
  const CANVAS_CENTER_Y = 2.78;
  const TILT_RAD = -0.075;

  // 1. Classical Studio A-Frame Easel: 2 tall splayed A-frame legs (no 3rd center leg!) + shelf at y=1.30 + upper ratcheted mast to y=5.20
  const easelDark = [];
  const easelSilver = [];
  const easelWhite = [];

  for (const [lx, tiltZ] of [[-0.86, -0.145], [0.86, 0.145]]) {
    const leg = new THREE.BoxGeometry(0.13, 5.28, 0.15);
    xform(leg, [lx * 0.56, 2.58, 0.14], [TILT_RAD, 0, tiltZ]);
    applyWorldPlanarUVs(leg, 0.5, 0.5);
    easelDark.push(leg);

    const foot = new THREE.BoxGeometry(0.24, 0.09, 0.28);
    xform(foot, [lx, 0.045, 0.33]);
    easelDark.push(foot);
  }

  // Upper center mast starts at shelf y = 1.28 and rises proudly up to y = 5.20 (clearly A-frame, NOT a 3-leg bench!)
  const upperMast = new THREE.BoxGeometry(0.15, 3.92, 0.15);
  xform(upperMast, [0, 3.24, -0.02], [TILT_RAD, 0, 0]);
  easelDark.push(upperMast);

  const apexCrown = new THREE.BoxGeometry(0.32, 0.14, 0.22);
  xform(apexCrown, [0, 5.18, -0.16], [TILT_RAD, 0, 0]);
  easelDark.push(apexCrown);

  const topClamp = new THREE.BoxGeometry(0.34, 0.16, 0.26);
  xform(topClamp, [0, 4.28, 0.09], [TILT_RAD, 0, 0]);
  easelDark.push(topClamp);
  const topClampPlate = new THREE.BoxGeometry(0.36, 0.035, 0.28);
  xform(topClampPlate, [0, 4.24, 0.09], [TILT_RAD, 0, 0]);
  easelSilver.push(topClampPlate);

  // Lower horizontal structural tie bar tying the two A-frame legs cleanly at ankle height
  const lowerBar = new THREE.BoxGeometry(1.56, 0.10, 0.12);
  xform(lowerBar, [0, 0.68, 0.24], [TILT_RAD, 0, 0]);
  easelDark.push(lowerBar);

  // Rear A-frame prop leg extending cleanly to rear foot pad
  const rearStrut = new THREE.BoxGeometry(0.14, 4.85, 0.14);
  xform(rearStrut, [0, 2.24, -0.94], [0.40, 0, 0]);
  easelDark.push(rearStrut);

  const rearFoot = new THREE.BoxGeometry(0.24, 0.09, 0.28);
  xform(rearFoot, [0, 0.045, -1.86]);
  easelDark.push(rearFoot);

  // Canvas shelf ledge cleanly flush to canvas width (y = 1.32 -> tall graceful leg stance underneath!)
  const ledge = new THREE.BoxGeometry(2.38, 0.13, 0.32);
  xform(ledge, [0, 1.32, 0.33], [TILT_RAD, 0, 0]);
  applyWorldPlanarUVs(ledge, 0.5, 0.5);
  easelDark.push(ledge);

  const ledgeTrim = new THREE.BoxGeometry(2.39, 0.026, 0.03);
  xform(ledgeTrim, [0, 1.36, 0.49], [TILT_RAD, 0, 0]);
  easelSilver.push(ledgeTrim);

  // Ceramic brush jar + 3 studio brushes on right end of shelf + flat palette on left
  const brushPot = new THREE.CylinderGeometry(0.072, 0.060, 0.14, 12);
  xform(brushPot, [0.98, 1.45, 0.38]);
  easelWhite.push(brushPot);

  for (const [bx, rz] of [[0.96, -0.18], [0.98, 0.05], [1.00, 0.22]]) {
    const brushShaft = new THREE.CylinderGeometry(0.009, 0.007, 0.26, 6);
    xform(brushShaft, [bx, 1.56, 0.38], [0.08, 0, rz]);
    easelDark.push(brushShaft);
    const tip = new THREE.ConeGeometry(0.012, 0.034, 6);
    xform(tip, [bx - rz * 0.12, 1.68, 0.39], [0.08, 0, rz]);
    easelWhite.push(tip);
  }

  const paletteDisc = new THREE.CylinderGeometry(0.16, 0.16, 0.02, 16);
  paletteDisc.scale(1.2, 1, 0.85);
  xform(paletteDisc, [-0.94, 1.39, 0.38], [0.06, 0.3, 0]);
  easelWhite.push(paletteDisc);

  const easelDarkMesh = new THREE.Mesh(mergeClean(easelDark), mats.obsidianMat);
  easelDarkMesh.castShadow = true;
  easelDarkMesh.receiveShadow = true;
  const easelSilverMesh = new THREE.Mesh(mergeClean(easelSilver), mats.silverTrimMat);
  const easelWhiteMesh = new THREE.Mesh(mergeClean(easelWhite), mats.brightAlabasterMat);
  easelGroup.add(easelDarkMesh, easelSilverMesh, easelWhiteMesh);

  // 2. Stretched Unfinished Canvas Frame
  const easelTiltGroup = new THREE.Group();
  easelTiltGroup.position.set(0, CANVAS_CENTER_Y, 0.21);
  easelTiltGroup.rotation.x = TILT_RAD;
  canvasGroup.add(easelTiltGroup);

  const canvasTex = textures.unfinishedCanvasTex('sanctuary-unfinished-canvas');
  const canvasMat = new THREE.MeshStandardMaterial({
    map: canvasTex,
    roughness: 0.78,
    metalness: 0.02,
  });
  const canvasBox = new THREE.Mesh(new THREE.BoxGeometry(CANVAS_W, CANVAS_H, 0.10), [
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

  // 3. Soft Flowing Linen Drop-Cloth (natural slumped rounded shoulders, ZERO 90-degree rigid plastic box corner!)
  const shroudTiltGroup = new THREE.Group();
  shroudTiltGroup.position.set(0, CANVAS_CENTER_Y, 0.21);
  shroudTiltGroup.rotation.x = TILT_RAD;
  shroudGroup.add(shroudTiltGroup);

  const SEGS_X = 84;
  const SEGS_Y = 96;
  const clothGeo = new THREE.PlaneGeometry(CANVAS_W + 0.26, CANVAS_H + 0.08, SEGS_X, SEGS_Y);
  const posAttr = clothGeo.attributes.position;
  const baseZ = new Float32Array(posAttr.count);
  const baseX = new Float32Array(posAttr.count);
  const baseY = new Float32Array(posAttr.count);

  const halfW = (CANVAS_W + 0.26) * 0.5;
  const halfH = (CANVAS_H + 0.08) * 0.5;

  for (let i = 0; i < posAttr.count; i++) {
    let x = posAttr.getX(i);
    let y = posAttr.getY(i);
    const u = (x + halfW) / (2 * halfW); // 0 = left, 1 = right
    const v = (y + halfH) / (2 * halfH); // 0 = bottom, 1 = top

    // Diagonal sweep lifting lower-right cloth gracefully upward-left to reveal unfinished canvas
    const revealMask = Math.pow(smooth01(0.22, 0.96, u) * smooth01(0.98, 0.0, v), 1.38);
    y += revealMask * (1.62 * smooth01(0.0, 0.94, 1.0 - v * 0.35));
    x -= revealMask * 0.36;

    // Rounded organic draped shoulders (eliminates boxy 90-degree plastic corner!)
    const shoulder = smooth01(0.76, 1.0, v);
    const edgeFactor = Math.pow(Math.abs(u - 0.5) * 2.0, 1.6);
    y -= shoulder * edgeFactor * 0.26;
    x -= Math.sign(x) * shoulder * edgeFactor * 0.10;

    if (u < 0.20) {
      const edgeT = 1 - u / 0.20;
      x -= smooth01(0.84, 0.0, v) * 0.04 * edgeT;
      y -= smooth01(0.72, 0.0, v) * 0.03 * edgeT;
    }

    let z = 0.172;
    if (v > 0.86) {
      const topT = smooth01(0.86, 1.0, v);
      z = THREE.MathUtils.lerp(0.172, -0.095, topT);
      y -= topT * 0.12;
    } else {
      const topSag = Math.sin(u * Math.PI) * 0.048 * smooth01(0.55, 0.86, v);
      y -= topSag;
    }

    const sideWrap = smooth01(0.86, 1.0, Math.abs(x) / halfW) * (1 - revealMask * 0.92);
    z -= sideWrap * 0.12;

    const hangFade = smooth01(1.0, 0.68, v);
    const vertFoldA = Math.sin(u * 15.0 + Math.sin(v * 2.3) * 0.5) * 0.055;
    const vertFoldB = Math.sin(u * 29.0 - v * 2.2 + 0.6) * 0.022;
    const radialFold = Math.sin((u * 1.25 - v * 0.85) * 18.0) * 0.046 * Math.pow(revealMask, 0.72);
    const sweptBillow = Math.sin(revealMask * Math.PI) * 0.15;

    z += (vertFoldA + vertFoldB) * (0.28 + 0.72 * hangFade) + radialFold + sweptBillow;

    posAttr.setXYZ(i, x, y, z);
    baseX[i] = x;
    baseY[i] = y;
    baseZ[i] = z;
  }
  clothGeo.computeVertexNormals();

  const clothMesh = new THREE.Mesh(clothGeo, mats.shroudMat);
  clothMesh.castShadow = true;
  clothMesh.receiveShadow = false;
  shroudTiltGroup.add(clothMesh);

  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 4.2, 1.2),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitMesh.position.set(0, CANVAS_CENTER_Y, 0.21);
  hitMesh.userData.exhibitId = 'unfinished-opus';
  group.add(hitMesh);

  function setBuildProgress(p) {
    const pEasel = smooth01(0.22, 0.52, p);
    const pCanvas = smooth01(0.32, 0.58, p);
    const pShroud = smooth01(0.42, 0.68, p);

    easelGroup.position.y = (1 - pEasel) * -1.4;
    easelGroup.visible = pEasel > 0.02;
    canvasGroup.position.y = (1 - pCanvas) * 1.2;
    canvasGroup.visible = pCanvas > 0.02;
    shroudGroup.position.y = (1 - pShroud) * 1.8;
    shroudGroup.visible = pShroud > 0.02;
  }

  function update(dt, elapsed) {
    for (let i = 0; i < posAttr.count; i++) {
      const yNorm = THREE.MathUtils.clamp(1.0 - (baseY[i] + halfH) / (2 * halfH), 0, 1);
      const sway = Math.sin(elapsed * 1.2 + baseX[i] * 2.0 + baseY[i] * 1.3) * 0.011 * yNorm * yNorm;
      posAttr.setZ(i, baseZ[i] + sway);
    }
    posAttr.needsUpdate = true;
  }

  function dispose() {
    clothGeo.dispose();
    canvasMat.dispose();
  }

  return {
    group,
    hitMesh,
    pinAnchor: [0, 5.25, -12.3],
    setBuildProgress,
    update,
    dispose,
  };
}
