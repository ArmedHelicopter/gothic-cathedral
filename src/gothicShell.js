import * as THREE from 'three';
import {
  applyWorldPlanarUVs,
  buildDiagonalVaultRib,
  buildPointedArchRib,
  mergeClean,
  smooth01,
  xform,
} from './geo.js';

function createLancetGlassGeo(w, h) {
  const hw = w * 0.5;
  const springY = h - w * 0.85;
  const sh = new THREE.Shape();
  sh.moveTo(-hw, 0);
  sh.lineTo(-hw, springY);
  sh.quadraticCurveTo(-hw * 0.72, h - w * 0.25, 0, h);
  sh.quadraticCurveTo(hw * 0.72, h - w * 0.25, hw, springY);
  sh.lineTo(hw, 0);
  sh.closePath();
  const geo = new THREE.ShapeGeometry(sh, 12);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) + hw) / w, pos.getY(i) / h);
  }
  uv.needsUpdate = true;
  return geo;
}

function createPointedWindowBayGeo(bayW, bayH, depth, winW, winH, winBottomY) {
  const hw = bayW * 0.5;
  const wall = new THREE.Shape();
  wall.moveTo(-hw, 0);
  wall.lineTo(hw, 0);
  wall.lineTo(hw, bayH);
  wall.lineTo(-hw, bayH);
  wall.closePath();

  const wHw = winW * 0.5;
  const springY = winBottomY + winH - winW * 0.85;
  const hole = new THREE.Path();
  hole.moveTo(-wHw, winBottomY);
  hole.lineTo(-wHw, springY);
  hole.quadraticCurveTo(-wHw * 0.72, winBottomY + winH - winW * 0.25, 0, winBottomY + winH);
  hole.quadraticCurveTo(wHw * 0.72, winBottomY + winH - winW * 0.25, wHw, springY);
  hole.lineTo(wHw, winBottomY);
  hole.closePath();
  wall.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(wall, { depth, bevelEnabled: false, curveSegments: 12 });
  geo.translate(0, 0, -depth * 0.5);
  applyWorldPlanarUVs(geo, 0.32, 0.32);
  return geo;
}

/**
 * Curved Gothic half-arch flyer strut from outer buttress up to upper clerestory pier.
 */
function buildCurvedFlyer(side, xOuter, yOuter, xInner, yInner, z, segments = 12) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = THREE.MathUtils.lerp(xOuter, xInner, t);
    const y = THREE.MathUtils.lerp(yOuter, yInner, Math.pow(t, 0.68)) + Math.sin(t * Math.PI) * 0.42;
    pts.push(new THREE.Vector3(x * side, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, segments, 0.16, 6, false);
  applyWorldPlanarUVs(geo, 0.45, 0.45);
  return geo;
}

export function createGothicShellComponent(mats) {
  const group = new THREE.Group();
  group.name = 'gothicShell';

  const piersGroup = new THREE.Group();
  const leftButtressGroup = new THREE.Group();
  const rightButtressGroup = new THREE.Group();
  const vaultsGroup = new THREE.Group();
  const roofLeftGroup = new THREE.Group();
  const roofRightGroup = new THREE.Group();
  const roofRidgeGroup = new THREE.Group();
  const apseGroup = new THREE.Group();
  const leftSideWallGroup = new THREE.Group();
  const rightSideWallGroup = new THREE.Group();

  group.add(
    piersGroup,
    leftButtressGroup,
    rightButtressGroup,
    vaultsGroup,
    roofLeftGroup,
    roofRightGroup,
    roofRidgeGroup,
    apseGroup,
    leftSideWallGroup,
    rightSideWallGroup
  );

  const bayZs = [12.0, 6.8, 1.6, -3.6, -8.8, -14.0];
  const PIER_X = 6.2;

  // 1. Clustered Nave Piers with Molded Bases & Capitals
  const pierWhiteGeos = [];
  const pierDarkGeos = [];
  const pierTrimGeos = [];
  for (const bz of bayZs) {
    for (const side of [-1, 1]) {
      const px = side * PIER_X;
      const plinth = new THREE.BoxGeometry(1.06, 0.44, 1.06);
      xform(plinth, [px, 0.22, bz]);
      applyWorldPlanarUVs(plinth, 0.5, 0.5);
      pierDarkGeos.push(plinth);

      const baseMolding = new THREE.CylinderGeometry(0.46, 0.52, 0.18, 12);
      xform(baseMolding, [px, 0.52, bz]);
      pierWhiteGeos.push(baseMolding);

      const core = new THREE.BoxGeometry(0.62, 6.45, 0.62);
      xform(core, [px, 3.82, bz]);
      applyWorldPlanarUVs(core, 0.4, 0.4);
      pierWhiteGeos.push(core);

      for (const [ox, oz] of [[0.32, 0], [-0.32, 0], [0, 0.32], [0, -0.32]]) {
        const shaft = new THREE.CylinderGeometry(0.11, 0.12, 6.45, 10);
        xform(shaft, [px + ox, 3.82, bz + oz]);
        pierWhiteGeos.push(shaft);
      }

      // Molded Gothic bell capital + abacus
      const capBell = new THREE.CylinderGeometry(0.54, 0.36, 0.28, 12);
      xform(capBell, [px, 7.12, bz]);
      pierWhiteGeos.push(capBell);

      const capRing = new THREE.TorusGeometry(0.40, 0.045, 8, 16);
      xform(capRing, [px, 6.96, bz], [Math.PI / 2, 0, 0]);
      pierTrimGeos.push(capRing);

      const abacus = new THREE.BoxGeometry(1.12, 0.16, 1.12);
      xform(abacus, [px, 7.32, bz]);
      applyWorldPlanarUVs(abacus, 0.5, 0.5);
      pierWhiteGeos.push(abacus);
    }
  }

  const pierWhiteMesh = new THREE.Mesh(mergeClean(pierWhiteGeos), mats.whiteMarbleMat);
  pierWhiteMesh.castShadow = true;
  pierWhiteMesh.receiveShadow = true;
  const pierDarkMesh = new THREE.Mesh(mergeClean(pierDarkGeos), mats.obsidianMat);
  pierDarkMesh.castShadow = true;
  pierDarkMesh.receiveShadow = true;
  const pierTrimMesh = new THREE.Mesh(mergeClean(pierTrimGeos), mats.silverTrimMat);
  piersGroup.add(pierWhiteMesh, pierDarkMesh, pierTrimMesh);

  // 2. Stepped Exterior Flying Buttresses with Curved Arched Flyers
  function buildSideButtresses(side) {
    const bGroup = new THREE.Group();
    const whiteMat = mats.whiteMarbleMat.clone();
    whiteMat.transparent = true;
    const navyMat = mats.navyStoneMat.clone();
    navyMat.transparent = true;

    const wGeos = [];
    const nGeos = [];
    const bx = side * 8.6;
    for (const bz of bayZs) {
      // Stepped lower buttress pier
      const baseFoot = new THREE.BoxGeometry(1.26, 2.2, 1.26);
      xform(baseFoot, [bx, 1.1, bz]);
      applyWorldPlanarUVs(baseFoot, 0.38, 0.38);
      wGeos.push(baseFoot);

      const midShaft = new THREE.BoxGeometry(0.96, 3.6, 0.96);
      xform(midShaft, [bx, 4.0, bz]);
      applyWorldPlanarUVs(midShaft, 0.38, 0.38);
      wGeos.push(midShaft);

      const collar = new THREE.BoxGeometry(1.12, 0.24, 1.12);
      xform(collar, [bx, 5.88, bz]);
      nGeos.push(collar);

      const pinnacleBody = new THREE.BoxGeometry(0.58, 1.65, 0.58);
      xform(pinnacleBody, [bx, 6.8, bz]);
      wGeos.push(pinnacleBody);

      const spire = new THREE.ConeGeometry(0.40, 1.75, 8);
      xform(spire, [bx, 8.50, bz]);
      nGeos.push(spire);

      // Curved flying buttress arch + white clerestory receiving corbel locking directly into the eave cornice
      wGeos.push(buildCurvedFlyer(side, 8.4, 5.2, 6.5, 7.65, bz, 12));
      const corbel = new THREE.BoxGeometry(0.42, 0.94, 0.44);
      xform(corbel, [side * 6.58, 7.66, bz]);
      wGeos.push(corbel);
    }
    const wm = new THREE.Mesh(mergeClean(wGeos), whiteMat);
    wm.castShadow = true;
    wm.receiveShadow = true;
    const nm = new THREE.Mesh(mergeClean(nGeos), navyMat);
    nm.castShadow = true;
    nm.receiveShadow = true;
    bGroup.add(wm, nm);
    bGroup.userData.mats = [whiteMat, navyMat];
    return bGroup;
  }
  const leftButt = buildSideButtresses(-1);
  const rightButt = buildSideButtresses(1);
  leftButtressGroup.add(leftButt);
  rightButtressGroup.add(rightButt);

  // 3. Smooth Continuous Pointed Rib Vaults + Keystones
  const ribGeos = [];
  const bossGeos = [];
  const VAULT_APEX_Y = 12.1;

  for (const bz of bayZs) {
    ribGeos.push(
      ...buildPointedArchRib({
        spanHalf: PIER_X,
        springY: 7.35,
        apexY: VAULT_APEX_Y,
        z: bz,
        width: 0.26,
        depth: 0.28,
        segments: 28,
      })
    );
    const transBoss = new THREE.OctahedronGeometry(0.24, 0);
    xform(transBoss, [0, VAULT_APEX_Y, bz]);
    bossGeos.push(transBoss);
  }
  for (let i = 0; i < bayZs.length - 1; i++) {
    const z0 = bayZs[i];
    const z1 = bayZs[i + 1];
    const midZ = (z0 + z1) * 0.5;
    ribGeos.push(...buildDiagonalVaultRib([-PIER_X, 7.35, z0], [PIER_X, 7.35, z1], 4.7, 0.14, 0.16, 24));
    ribGeos.push(...buildDiagonalVaultRib([PIER_X, 7.35, z0], [-PIER_X, 7.35, z1], 4.7, 0.14, 0.16, 24));
    const bayBoss = new THREE.OctahedronGeometry(0.26, 0);
    xform(bayBoss, [0, VAULT_APEX_Y - 0.05, midZ]);
    bossGeos.push(bayBoss);
  }
  const ridgeRib = new THREE.BoxGeometry(0.22, 0.22, 26.4);
  xform(ridgeRib, [0, VAULT_APEX_Y, -1.0]);
  applyWorldPlanarUVs(ridgeRib, 0.4, 0.4);
  ribGeos.push(ridgeRib);

  const ribMesh = new THREE.Mesh(mergeClean(ribGeos), mats.brightAlabasterMat);
  ribMesh.receiveShadow = true;
  const bossMesh = new THREE.Mesh(mergeClean(bossGeos), mats.silverTrimMat);
  vaultsGroup.add(ribMesh, bossMesh);

  // 4. Articulated Pitched Gothic Roof Slopes with Carved Marble Bay Ribs, Eave Cornice & Ridge Finials
  const roofMatLeft = mats.navyStoneMat.clone();
  roofMatLeft.transparent = true;
  const roofMatRight = mats.navyStoneMat.clone();
  roofMatRight.transparent = true;
  const roofTrimMatLeft = mats.whiteMarbleMat.clone();
  roofTrimMatLeft.transparent = true;
  const roofTrimMatRight = mats.whiteMarbleMat.clone();
  roofTrimMatRight.transparent = true;

  function buildRoofSlope(side, mat, trimMat) {
    const rGroup = new THREE.Group();
    // Strict Z span (-15.35 .. +13.90, length = 29.25) & X fit (6.62m) so roof eaves NEVER poke past West Towers (z>=13.9)!
    const dx = 6.62;
    const dy = 14.95 - 8.20;
    const slopeLen = Math.hypot(dx, dy) + 0.14;
    const pitch = Math.atan2(dy, dx);
    const roofZCenter = -0.725;
    const roofLen = 29.25;

    const slopeGeo = new THREE.BoxGeometry(slopeLen, 0.34, roofLen);
    xform(slopeGeo, [side * dx * 0.5, (14.95 + 8.20) * 0.5, roofZCenter], [0, 0, -side * pitch]);
    applyWorldPlanarUVs(slopeGeo, 0.34, 0.34);
    const mesh = new THREE.Mesh(slopeGeo, mat);
    mesh.castShadow = side < 0;
    mesh.receiveShadow = true;

    // Articulated white marble eaves cornice (buttress corbels lock into it!) + transverse slate-bay ribs
    const trimGeos = [];
    const eaveCornice = new THREE.BoxGeometry(0.46, 0.36, roofLen);
    xform(eaveCornice, [side * 6.58, 8.24, roofZCenter]);
    applyWorldPlanarUVs(eaveCornice, 0.4, 0.4);
    trimGeos.push(eaveCornice);

    for (const bz of bayZs) {
      if (bz > 13.5) continue;
      const rib = new THREE.BoxGeometry(slopeLen, 0.14, 0.24);
      xform(rib, [side * dx * 0.5, (14.95 + 8.20) * 0.5 + 0.18, bz], [0, 0, -side * pitch]);
      applyWorldPlanarUVs(rib, 0.4, 0.4);
      trimGeos.push(rib);
    }
    const trimMesh = new THREE.Mesh(mergeClean(trimGeos), trimMat);
    trimMesh.castShadow = side < 0;
    trimMesh.receiveShadow = true;

    rGroup.add(mesh, trimMesh);
    rGroup.userData.mats = [mat, trimMat];
    return rGroup;
  }
  const roofSlopeLeft = buildRoofSlope(-1, roofMatLeft, roofTrimMatLeft);
  const roofSlopeRight = buildRoofSlope(1, roofMatRight, roofTrimMatRight);
  roofLeftGroup.add(roofSlopeLeft);
  roofRightGroup.add(roofSlopeRight);

  const ridgeGeos = [];
  const ridgeCrest = new THREE.BoxGeometry(0.44, 0.42, 29.25);
  xform(ridgeCrest, [0, 15.05, -0.725]);
  ridgeGeos.push(ridgeCrest);
  for (let z = 13.5; z >= -14.5; z -= 2.8) {
    const finial = new THREE.ConeGeometry(0.18, 0.65, 4);
    xform(finial, [0, 15.55, z], [0, Math.PI / 4, 0]);
    ridgeGeos.push(finial);
  }
  const ridgeCrestMesh = new THREE.Mesh(mergeClean(ridgeGeos), mats.whiteMarbleMat);
  roofRidgeGroup.add(ridgeCrestMesh);

  // 5. Sanctuary East Apse Wall + Pointed Lancet Trio (z = -15.4)
  const apseStoneGeos = [];
  const apseDarkGeos = [];

  const apseShape = new THREE.Shape();
  apseShape.moveTo(-6.7, 0);
  apseShape.lineTo(6.7, 0);
  apseShape.lineTo(6.7, 8.25);
  apseShape.lineTo(0, 14.95);
  apseShape.lineTo(-6.7, 8.25);
  apseShape.closePath();

  const apseGeo = new THREE.ExtrudeGeometry(apseShape, { depth: 0.68, bevelEnabled: false });
  apseGeo.translate(0, 0, -15.75);
  applyWorldPlanarUVs(apseGeo, 0.32, 0.32);
  apseStoneGeos.push(apseGeo);

  for (const [lx, h] of [[-2.45, 7.0], [0, 8.6], [2.45, 7.0]]) {
    const winW = 1.24;
    const baseY = 3.1;
    const glassGeo = createLancetGlassGeo(winW, h);
    const glassMesh = new THREE.Mesh(glassGeo, mats.lancetGlassMat);
    glassMesh.position.set(lx, baseY, -15.02);
    apseGroup.add(glassMesh);

    const sill = new THREE.BoxGeometry(winW + 0.32, 0.18, 0.24);
    xform(sill, [lx, baseY - 0.08, -15.04]);
    apseDarkGeos.push(sill);
  }

  const apseStoneMesh = new THREE.Mesh(mergeClean(apseStoneGeos), mats.navyStoneMat);
  apseStoneMesh.castShadow = true;
  apseStoneMesh.receiveShadow = true;
  const apseDarkMesh = new THREE.Mesh(mergeClean(apseDarkGeos), mats.obsidianMat);
  apseGroup.add(apseStoneMesh, apseDarkMesh);

  // 6. Solid Masonry Clerestory Side Walls + West-Tower Connector Bay (Seals Exterior Gap!)
  function buildSideWall(side) {
    const sGroup = new THREE.Group();
    const stoneMat = mats.navyStoneMat.clone();
    stoneMat.transparent = true;
    const glassMat = mats.lancetGlassMat.clone();
    glassMat.transparent = true;
    const trimMat = mats.whiteMarbleMat.clone();
    trimMat.transparent = true;

    const wallX = side * 6.52;
    const wallGeos = [];
    const trimGeos = [];

    // Connector masonry sealing gap between West Facade (z=15.0) and first nave bay (z=12.0)
    const frontConn = new THREE.BoxGeometry(0.46, 8.25, 3.1);
    xform(frontConn, [wallX, 4.125, 13.5]);
    applyWorldPlanarUVs(frontConn, 0.32, 0.32);
    wallGeos.push(frontConn);

    // Connector masonry sealing rear bay (z=-14.0) to Apse wall (z=-15.4)
    const rearConn = new THREE.BoxGeometry(0.46, 8.25, 1.6);
    xform(rearConn, [wallX, 4.125, -14.7]);
    applyWorldPlanarUVs(rearConn, 0.32, 0.32);
    wallGeos.push(rearConn);

    for (let i = 0; i < bayZs.length - 1; i++) {
      const z0 = bayZs[i];
      const z1 = bayZs[i + 1];
      const bayW = Math.abs(z0 - z1);
      const midZ = (z0 + z1) * 0.5;

      const bayWall = createPointedWindowBayGeo(bayW + 0.06, 8.25, 0.44, 2.05, 5.45, 1.55);
      xform(bayWall, [wallX, 0, midZ], [0, Math.PI / 2, 0]);
      wallGeos.push(bayWall);

      // Flush dark navy stone sill (tucked cleanly into wall so zero stark white tab crosses glass cloches!)
      const sill = new THREE.BoxGeometry(0.48, 0.14, 2.12);
      xform(sill, [wallX, 1.50, midZ]);
      wallGeos.push(sill);

      const glassGeo = createLancetGlassGeo(2.02, 5.42);
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(wallX, 1.55, midZ);
      glass.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      sGroup.add(glass);
    }

    const wallMesh = new THREE.Mesh(mergeClean(wallGeos), stoneMat);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    if (trimGeos.length) {
      const trimMesh = new THREE.Mesh(mergeClean(trimGeos), trimMat);
      sGroup.add(trimMesh);
    }
    sGroup.add(wallMesh);

    sGroup.userData.mats = [stoneMat, glassMat, trimMat];
    return sGroup;
  }

  const leftWall = buildSideWall(-1);
  const rightWall = buildSideWall(1);
  leftSideWallGroup.add(leftWall);
  rightSideWallGroup.add(rightWall);

  let builtVaultsVisible = true;
  let builtRoofVisible = true;

  function setBuildProgress(p) {
    const pPiers = smooth01(0.04, 0.34, p);
    const pWalls = smooth01(0.08, 0.42, p);
    const pButtress = smooth01(0.12, 0.46, p);
    const pVaults = smooth01(0.24, 0.62, p);
    const pRoof = smooth01(0.32, 0.68, p);

    // Cohesive telescoping/ground-upward rise so no roofs, vaults, or buttresses float detached in empty air!
    piersGroup.position.y = (1 - pPiers) * -1.4;
    piersGroup.visible = pPiers > 0.02;

    leftButtressGroup.position.y = (1 - pButtress) * -1.4;
    leftButtressGroup.visible = pButtress > 0.02;
    rightButtressGroup.position.y = (1 - pButtress) * -1.4;
    rightButtressGroup.visible = pButtress > 0.02;

    apseGroup.position.y = (1 - pWalls) * -1.4;
    apseGroup.visible = pWalls > 0.02;
    leftSideWallGroup.position.y = (1 - pWalls) * -1.4;
    leftSideWallGroup.visible = pWalls > 0.02;
    rightSideWallGroup.position.y = (1 - pWalls) * -1.4;
    rightSideWallGroup.visible = pWalls > 0.02;

    const vaultSY = THREE.MathUtils.lerp(0.10, 1.0, pVaults);
    vaultsGroup.scale.set(1, vaultSY, 1);
    vaultsGroup.position.y = 7.35 * (1 - vaultSY) + (1 - pWalls) * -1.4;
    builtVaultsVisible = pVaults > 0.04;
    vaultsGroup.visible = builtVaultsVisible;

    const roofSY = THREE.MathUtils.lerp(0.08, 1.0, pRoof);
    const roofY = 8.20 * (1 - roofSY) + (1 - pWalls) * -1.4;
    roofLeftGroup.scale.set(1, roofSY, 1);
    roofLeftGroup.position.y = roofY;
    roofLeftGroup.visible = pRoof > 0.04;
    roofRightGroup.scale.set(1, roofSY, 1);
    roofRightGroup.position.y = roofY;
    roofRightGroup.visible = pRoof > 0.04;
    roofRidgeGroup.scale.set(1, roofSY, 1);
    roofRidgeGroup.position.y = roofY;
    builtRoofVisible = pRoof > 0.04;
    roofRidgeGroup.visible = builtRoofVisible;
  }

  function update(dt, elapsed, camera) {
    if (!camera) return;
    const camX = camera.position.x;
    const camZ = camera.position.z;
    const inCutawayBand = camZ < 17.5 && camZ > -17.5 && camera.position.y < 16.5;
    const cutLeft = inCutawayBand && camX < -7.6;
    const cutRight = inCutawayBand && camX > 7.6;

    const alphaLerp = Math.min(1, dt * 10 || 1);

    leftWall.userData.mats.forEach((m) => {
      m.opacity += ((cutLeft ? 0.0 : 1.0) - m.opacity) * alphaLerp;
      m.depthWrite = m.opacity > 0.95;
    });
    leftButt.userData.mats.forEach((m) => {
      m.opacity += ((cutLeft ? 0.0 : 1.0) - m.opacity) * alphaLerp;
      m.depthWrite = m.opacity > 0.95;
    });
    roofSlopeLeft.userData.mats.forEach((m) => {
      m.opacity += ((cutLeft ? 0.0 : 1.0) - m.opacity) * alphaLerp;
      m.depthWrite = m.opacity > 0.95;
    });

    rightWall.userData.mats.forEach((m) => {
      m.opacity += ((cutRight ? 0.0 : 1.0) - m.opacity) * alphaLerp;
      m.depthWrite = m.opacity > 0.95;
    });
    rightButt.userData.mats.forEach((m) => {
      m.opacity += ((cutRight ? 0.0 : 1.0) - m.opacity) * alphaLerp;
      m.depthWrite = m.opacity > 0.95;
    });
    roofSlopeRight.userData.mats.forEach((m) => {
      m.opacity += ((cutRight ? 0.0 : 1.0) - m.opacity) * alphaLerp;
      m.depthWrite = m.opacity > 0.95;
    });

    leftWall.visible = leftWall.userData.mats[0].opacity > 0.08;
    leftButt.visible = leftButt.userData.mats[0].opacity > 0.08;
    roofLeftGroup.visible = roofMatLeft.opacity > 0.08;

    rightWall.visible = rightWall.userData.mats[0].opacity > 0.08;
    rightButt.visible = rightButt.userData.mats[0].opacity > 0.08;
    roofRightGroup.visible = roofMatRight.opacity > 0.08;

    // During elevated 2.5D cutaway, keep pointed Gothic vault arches & keystones visible overhead!
    // Only hide the camera-facing roof slope so the sanctuary ceiling architecture stays unmistakably Gothic.
    vaultsGroup.visible = builtVaultsVisible;
    roofRidgeGroup.visible = builtRoofVisible;
  }

  function dispose() {}

  return { group, setBuildProgress, update, dispose };
}
