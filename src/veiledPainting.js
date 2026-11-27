import * as THREE from 'three';
import { applyWorldPlanarUVs, mergeClean, smooth01, xform } from './geo.js';

/**
 * Independent Component: Sovereign Sanctuary Easel & Chiaroscuro Masterpiece (CANVAS 3.6m x 4.8m),
 * framed in sculpted Carrara stone, honed obsidian timber & champagne-gilt metalwork,
 * with a refined 25% upper-left silk drape revealing the commanding royal composition beneath.
 */
export function createVeiledPaintingComponent(textures, mats) {
  const group = new THREE.Group();
  group.name = 'veiledPainting';
  group.position.set(0, 1.15, -20.5);

  const easelGroup = new THREE.Group();
  const canvasGroup = new THREE.Group();
  const shroudGroup = new THREE.Group();
  group.add(easelGroup, canvasGroup, shroudGroup);

  const CANVAS_W = 3.60;
  const CANVAS_H = 4.80;
  const CANVAS_CENTER_Y = 4.30;
  const TILT_RAD = -0.062;

  // 1. Sculpted Architectural Easel Frame (octagonal bronze-obsidian uprights + Carrara shoes + champagne-gilt finials)
  const easelDark = [];
  const easelGilt = [];
  const easelMarble = [];

  for (const [lx, tiltZ] of [[-1.42, -0.13], [1.42, 0.13]]) {
    const leg = new THREE.CylinderGeometry(0.11, 0.13, 7.65, 8);
    xform(leg, [lx * 0.56, 3.74, 0.22], [TILT_RAD, 0, tiltZ]);
    applyWorldPlanarUVs(leg, 0.45, 0.45);
    easelDark.push(leg);

    const shoeBase = new THREE.CylinderGeometry(0.24, 0.28, 0.14, 8);
    xform(shoeBase, [lx, 0.07, 0.48]);
    easelMarble.push(shoeBase);

    const shoeCollar = new THREE.CylinderGeometry(0.15, 0.19, 0.12, 8);
    xform(shoeCollar, [lx, 0.18, 0.48]);
    easelGilt.push(shoeCollar);
  }

  const upperMast = new THREE.CylinderGeometry(0.12, 0.14, 5.80, 8);
  xform(upperMast, [0, 4.78, -0.02], [TILT_RAD, 0, 0]);
  easelDark.push(upperMast);

  const apexCrown = new THREE.BoxGeometry(0.56, 0.22, 0.32);
  xform(apexCrown, [0, 7.62, -0.20], [TILT_RAD, 0, 0]);
  easelDark.push(apexCrown);
  const apexMold = new THREE.BoxGeometry(0.64, 0.07, 0.36);
  xform(apexMold, [0, 7.75, -0.21], [TILT_RAD, 0, 0]);
  easelGilt.push(apexMold);
  // Smooth continuous bronze-gold crown orb mounted directly atop apexMold stem
  const crownStem = new THREE.CylinderGeometry(0.05, 0.07, 0.18, 10);
  xform(crownStem, [0, 7.86, -0.22]);
  easelGilt.push(crownStem);
  const crownOrb = new THREE.SphereGeometry(0.13, 16, 12);
  xform(crownOrb, [0, 8.01, -0.22]);
  easelGilt.push(crownOrb);

  const topClamp = new THREE.BoxGeometry(0.62, 0.24, 0.38);
  xform(topClamp, [0, 6.82, 0.16], [TILT_RAD, 0, 0]);
  easelDark.push(topClamp);
  const topClampPlate = new THREE.BoxGeometry(0.66, 0.06, 0.42);
  xform(topClampPlate, [0, 6.72, 0.16], [TILT_RAD, 0, 0]);
  easelGilt.push(topClampPlate);

  const lowerBar = new THREE.BoxGeometry(2.50, 0.14, 0.16);
  xform(lowerBar, [0, 0.96, 0.36], [TILT_RAD, 0, 0]);
  easelDark.push(lowerBar);

  const rearStrut = new THREE.CylinderGeometry(0.11, 0.13, 7.0, 8);
  xform(rearStrut, [0, 3.22, -1.36], [0.38, 0, 0]);
  easelDark.push(rearStrut);

  const rearShoe = new THREE.CylinderGeometry(0.24, 0.28, 0.14, 8);
  xform(rearShoe, [0, 0.07, -2.68]);
  easelMarble.push(rearShoe);

  const ledge = new THREE.BoxGeometry(4.02, 0.20, 0.46);
  xform(ledge, [0, 1.84, 0.46], [TILT_RAD, 0, 0]);
  applyWorldPlanarUVs(ledge, 0.45, 0.45);
  easelDark.push(ledge);

  const ledgeTrim = new THREE.BoxGeometry(4.06, 0.055, 0.06);
  xform(ledgeTrim, [0, 1.91, 0.69], [TILT_RAD, 0, 0]);
  easelGilt.push(ledgeTrim);

  const easelDarkMesh = new THREE.Mesh(mergeClean(easelDark), mats.obsidianMat);
  easelDarkMesh.castShadow = true;
  easelDarkMesh.receiveShadow = true;
  const easelGiltMesh = new THREE.Mesh(mergeClean(easelGilt), mats.giltBronzeMat);
  const easelMarbleMesh = new THREE.Mesh(mergeClean(easelMarble), mats.brightAlabasterMat);
  easelGroup.add(easelDarkMesh, easelGiltMesh, easelMarbleMesh);

  // 2. Monumental Sovereign Canvas + Dual-Stepped Champagne-Gilt & Obsidian Frame
  const easelTiltGroup = new THREE.Group();
  easelTiltGroup.position.set(0, CANVAS_CENTER_Y, 0.30);
  easelTiltGroup.rotation.x = TILT_RAD;
  canvasGroup.add(easelTiltGroup);

  const canvasTex = textures.unfinishedCanvasTex('sanctuary-unfinished-canvas');
  const canvasMat = new THREE.MeshStandardMaterial({
    map: canvasTex,
    roughness: 0.62,
    metalness: 0.04,
    envMapIntensity: 0.55,
  });
  const canvasBox = new THREE.Mesh(new THREE.BoxGeometry(CANVAS_W, CANVAS_H, 0.14), [
    mats.giltBronzeMat,
    mats.giltBronzeMat,
    mats.giltBronzeMat,
    mats.giltBronzeMat,
    canvasMat,
    mats.matteBasaltMat,
  ]);
  canvasBox.castShadow = true;
  canvasBox.receiveShadow = true;
  easelTiltGroup.add(canvasBox);

  const frameObs = [];
  const frameGilt = [];
  const fThick = 0.22;
  const fDepth = 0.24;
  for (const [w, h, px, py] of [
    [CANVAS_W + fThick * 2, fThick, 0, CANVAS_H * 0.5 + fThick * 0.42],
    [CANVAS_W + fThick * 2, fThick, 0, -CANVAS_H * 0.5 - fThick * 0.42],
    [fThick, CANVAS_H, -CANVAS_W * 0.5 - fThick * 0.42, 0],
    [fThick, CANVAS_H, CANVAS_W * 0.5 + fThick * 0.42, 0],
  ]) {
    const b = new THREE.BoxGeometry(w, h, fDepth);
    xform(b, [px, py, 0.03]);
    frameObs.push(b);
  }
  const gThick = 0.07;
  for (const [w, h, px, py] of [
    [CANVAS_W + gThick * 2, gThick, 0, CANVAS_H * 0.5 + gThick * 0.3],
    [CANVAS_W + gThick * 2, gThick, 0, -CANVAS_H * 0.5 - gThick * 0.3],
    [gThick, CANVAS_H, -CANVAS_W * 0.5 - gThick * 0.3, 0],
    [gThick, CANVAS_H, CANVAS_W * 0.5 + gThick * 0.3, 0],
  ]) {
    const g = new THREE.BoxGeometry(w, h, fDepth + 0.04);
    xform(g, [px, py, 0.04]);
    frameGilt.push(g);
  }
  const frameObsMesh = new THREE.Mesh(mergeClean(frameObs), mats.obsidianMat);
  frameObsMesh.castShadow = true;
  const frameGiltMesh = new THREE.Mesh(mergeClean(frameGilt), mats.giltBronzeMat);
  easelTiltGroup.add(frameObsMesh, frameGiltMesh);

  // 3. Sculpted Ivory-Silk Corner Veil (~25% upper-left corner swag so ~75% of the Royal Painting commands the hall!)
  const shroudTiltGroup = new THREE.Group();
  shroudTiltGroup.position.set(0, CANVAS_CENTER_Y, 0.30);
  shroudTiltGroup.rotation.x = TILT_RAD;
  shroudGroup.add(shroudTiltGroup);

  const clothW = CANVAS_W * 0.62;
  const clothH = CANVAS_H * 0.68;
  const SEGS_X = 64;
  const SEGS_Y = 72;
  const clothGeo = new THREE.PlaneGeometry(clothW, clothH, SEGS_X, SEGS_Y);
  const posAttr = clothGeo.attributes.position;
  const baseZ = new Float32Array(posAttr.count);
  const baseX = new Float32Array(posAttr.count);
  const baseY = new Float32Array(posAttr.count);

  const halfW = clothW * 0.5;
  const halfH = clothH * 0.5;
  const xOff = -CANVAS_W * 0.21;
  const yOff = CANVAS_H * 0.17;

  for (let i = 0; i < posAttr.count; i++) {
    let lx = posAttr.getX(i);
    let ly = posAttr.getY(i);
    const u = (lx + halfW) / clothW; // 0=outer-left edge, 1=inner-right edge
    const v = (ly + halfH) / clothH; // 0=bottom hem, 1=top corner

    // Diagonal sweep peeling back right & bottom edges into soft gathered folds
    const peel = Math.pow(smooth01(0.08, 0.96, u) * smooth01(0.95, 0.05, v), 1.15);
    lx -= peel * 0.95;
    ly += peel * 1.45;

    // Rounded shoulder over top frame lip
    let z = 0.25;
    if (v > 0.88) {
      const topT = smooth01(0.88, 1.0, v);
      z = THREE.MathUtils.lerp(0.25, -0.14, topT);
      ly -= topT * 0.14;
    } else {
      ly -= Math.sin(u * Math.PI) * 0.06 * smooth01(0.55, 0.88, v);
    }
    const leftWrap = smooth01(0.14, 0.0, u);
    z -= leftWrap * 0.22;

    const swagFold = Math.sin((u * 1.4 - v * 0.9) * 16.0) * 0.085 * (0.35 + 0.65 * smooth01(0.9, 0.1, v));
    const microFold = Math.sin(u * 26.0 + v * 6.0) * 0.028;
    const x = lx + xOff;
    const y = ly + yOff;
    z += swagFold + microFold;

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
    new THREE.BoxGeometry(4.4, 6.2, 1.6),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitMesh.position.set(0, CANVAS_CENTER_Y, 0.30);
  hitMesh.userData.exhibitId = 'unfinished-opus';
  group.add(hitMesh);

  function update(dt, elapsed) {
    for (let i = 0; i < posAttr.count; i++) {
      const yNorm = THREE.MathUtils.clamp(1.0 - (baseY[i] - yOff + halfH) / clothH, 0, 1);
      const sway = Math.sin(elapsed * 1.2 + baseX[i] * 1.5 + baseY[i] * 1.0) * 0.014 * yNorm * yNorm;
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
    pinAnchor: [0, 8.95, -20.5],
    update,
    dispose,
  };
}
