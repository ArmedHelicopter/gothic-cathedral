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
  const geo = new THREE.ShapeGeometry(sh, 14);
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

  const geo = new THREE.ExtrudeGeometry(wall, { depth, bevelEnabled: false, curveSegments: 14 });
  geo.translate(0, 0, -depth * 0.5);
  applyWorldPlanarUVs(geo, 0.18, 0.18);
  return geo;
}

function createApseWithLancetHolesGeo(halfW, eaveY, apexY, depth, windows) {
  const wall = new THREE.Shape();
  wall.moveTo(-halfW, 0);
  wall.lineTo(halfW, 0);
  wall.lineTo(halfW, eaveY);
  wall.lineTo(0, apexY);
  wall.lineTo(-halfW, eaveY);
  wall.closePath();

  for (const [wx, winW, winH, baseY] of windows) {
    const hw = winW * 0.5;
    const springY = baseY + winH - winW * 0.85;
    const hole = new THREE.Path();
    hole.moveTo(wx - hw, baseY);
    hole.lineTo(wx - hw, springY);
    hole.quadraticCurveTo(wx - hw * 0.72, baseY + winH - winW * 0.25, wx, baseY + winH);
    hole.quadraticCurveTo(wx + hw * 0.72, baseY + winH - winW * 0.25, wx + hw, springY);
    hole.lineTo(wx + hw, baseY);
    hole.closePath();
    wall.holes.push(hole);
  }

  const geo = new THREE.ExtrudeGeometry(wall, { depth, bevelEnabled: false, curveSegments: 14 });
  applyWorldPlanarUVs(geo, 0.18, 0.18);
  return geo;
}

function buildCurvedFlyer(side, xOuter, yOuter, xInner, yInner, z, segments = 14) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = THREE.MathUtils.lerp(xOuter, xInner, t);
    const y = THREE.MathUtils.lerp(yOuter, yInner, Math.pow(t, 0.68)) + Math.sin(t * Math.PI) * 0.45;
    pts.push(new THREE.Vector3(x * side, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, segments, 0.16, 6, false);
  applyWorldPlanarUVs(geo, 0.45, 0.45);
  return geo;
}

/**
 * Independent Component: Wide Minimalist Gothic Sanctuary Shell with Split Left/Right Cutaway Piers,
 * Smooth Pointed Rib Vaults, Real Stone Window Tracery, Gable Seam Sealing & Cerulean Light Pools.
 */
export function createGothicShellComponent(mats) {
  const group = new THREE.Group();
  group.name = 'gothicShell';

  const leftPierBasesGroup = new THREE.Group();
  const rightPierBasesGroup = new THREE.Group();
  const leftPiersGroup = new THREE.Group();
  const rightPiersGroup = new THREE.Group();
  const leftButtressGroup = new THREE.Group();
  const rightButtressGroup = new THREE.Group();
  const vaultsGroup = new THREE.Group();
  const roofLeftGroup = new THREE.Group();
  const roofRightGroup = new THREE.Group();
  const roofRidgeGroup = new THREE.Group();
  const apseGroup = new THREE.Group();
  const leftSideWallGroup = new THREE.Group();
  const rightSideWallGroup = new THREE.Group();
  const gobosGroup = new THREE.Group();

  group.add(
    leftPierBasesGroup,
    rightPierBasesGroup,
    leftPiersGroup,
    rightPiersGroup,
    leftButtressGroup,
    rightButtressGroup,
    vaultsGroup,
    roofLeftGroup,
    roofRightGroup,
    roofRidgeGroup,
    apseGroup,
    leftSideWallGroup,
    rightSideWallGroup,
    gobosGroup
  );

  const bayZs = [12.0, 7.2, 2.4, -2.4, -7.2, -12.0];
  const PIER_X = 6.8;
  const WALL_X = 7.8;
  const VAULT_SPRING_Y = 8.2;
  const VAULT_APEX_Y = 13.8;
  const WALL_TOP_Y = 8.9;
  const ROOF_APEX_Y = 16.2;

  // 1. Split Clustered Nave Piers (both column shafts AND bases fade on camera cutaway side -> ZERO orphan floor stumps!)
  function buildPierSide(side, piersOutGroup, basesOutGroup) {
    const bGroup = new THREE.Group();
    const pGroup = new THREE.Group();
    const bDarkMat = mats.obsidianMat.clone();
    bDarkMat.transparent = true;
    const bWhiteMat = mats.whiteMarbleMat.clone();
    bWhiteMat.transparent = true;
    const wMat = mats.whiteMarbleMat.clone();
    wMat.transparent = true;
    const tMat = mats.silverTrimMat.clone();
    tMat.transparent = true;

    const bdGeos = [];
    const bwGeos = [];
    const wGeos = [];
    const tGeos = [];

    for (const bz of bayZs) {
      const px = side * PIER_X;

      const plinth = new THREE.BoxGeometry(1.06, 0.44, 1.06);
      xform(plinth, [px, 0.22, bz]);
      applyWorldPlanarUVs(plinth, 0.45, 0.45);
      bdGeos.push(plinth);

      const baseMolding = new THREE.CylinderGeometry(0.46, 0.52, 0.18, 14);
      xform(baseMolding, [px, 0.52, bz]);
      bwGeos.push(baseMolding);

      const core = new THREE.BoxGeometry(0.60, 7.25, 0.60);
      xform(core, [px, 4.22, bz]);
      applyWorldPlanarUVs(core, 0.36, 0.36);
      wGeos.push(core);

      for (const [ox, oz] of [[0.31, 0], [-0.31, 0], [0, 0.31], [0, -0.31]]) {
        const shaft = new THREE.CylinderGeometry(0.11, 0.12, 7.25, 10);
        xform(shaft, [px + ox, 4.22, bz + oz]);
        wGeos.push(shaft);
      }

      const capRing = new THREE.TorusGeometry(0.40, 0.045, 8, 16);
      xform(capRing, [px, 7.84, bz], [Math.PI / 2, 0, 0]);
      tGeos.push(capRing);

      const capBell = new THREE.CylinderGeometry(0.54, 0.36, 0.28, 14);
      xform(capBell, [px, 8.0, bz]);
      wGeos.push(capBell);

      const abacus = new THREE.BoxGeometry(1.14, 0.16, 1.14);
      xform(abacus, [px, 8.20, bz]);
      applyWorldPlanarUVs(abacus, 0.45, 0.45);
      wGeos.push(abacus);
    }

    const bdMesh = new THREE.Mesh(mergeClean(bdGeos), bDarkMat);
    bdMesh.castShadow = true;
    bdMesh.receiveShadow = true;
    const bwMesh = new THREE.Mesh(mergeClean(bwGeos), bWhiteMat);
    bwMesh.receiveShadow = true;
    bGroup.add(bdMesh, bwMesh);
    bGroup.userData.mats = [bDarkMat, bWhiteMat];
    basesOutGroup.add(bGroup);

    const wMesh = new THREE.Mesh(mergeClean(wGeos), wMat);
    wMesh.castShadow = true;
    wMesh.receiveShadow = true;
    const tMesh = new THREE.Mesh(mergeClean(tGeos), tMat);
    pGroup.add(wMesh, tMesh);
    pGroup.userData.mats = [wMat, tMat];
    piersOutGroup.add(pGroup);

    return { bGroup, pGroup };
  }

  const leftSide = buildPierSide(-1, leftPiersGroup, leftPierBasesGroup);
  const rightSide = buildPierSide(1, rightPiersGroup, rightPierBasesGroup);
  const leftPiers = leftSide.pGroup;
  const rightPiers = rightSide.pGroup;
  const leftBases = leftSide.bGroup;
  const rightBases = rightSide.bGroup;

  // 2. Stepped Exterior Flying Buttresses with Curved Arched Flyers
  function buildSideButtresses(side) {
    const bGroup = new THREE.Group();
    const whiteMat = mats.whiteMarbleMat.clone();
    whiteMat.transparent = true;
    const navyMat = mats.navyStoneMat.clone();
    navyMat.transparent = true;

    const wGeos = [];
    const nGeos = [];
    const bx = side * 9.8;
    for (const bz of bayZs) {
      const baseFoot = new THREE.BoxGeometry(1.26, 2.3, 1.26);
      xform(baseFoot, [bx, 1.15, bz]);
      applyWorldPlanarUVs(baseFoot, 0.34, 0.34);
      wGeos.push(baseFoot);

      const midShaft = new THREE.BoxGeometry(0.96, 4.1, 0.96);
      xform(midShaft, [bx, 4.35, bz]);
      applyWorldPlanarUVs(midShaft, 0.34, 0.34);
      wGeos.push(midShaft);

      const collar = new THREE.BoxGeometry(1.12, 0.24, 1.12);
      xform(collar, [bx, 6.50, bz]);
      nGeos.push(collar);

      const pinnacleBody = new THREE.BoxGeometry(0.58, 1.75, 0.58);
      xform(pinnacleBody, [bx, 7.45, bz]);
      wGeos.push(pinnacleBody);

      const spire = new THREE.ConeGeometry(0.40, 1.85, 8);
      xform(spire, [bx, 9.25, bz]);
      nGeos.push(spire);

      wGeos.push(buildCurvedFlyer(side, 9.6, 5.6, 7.8, 8.35, bz, 14));
      const corbel = new THREE.BoxGeometry(0.42, 0.96, 0.44);
      xform(corbel, [side * 7.88, 8.32, bz]);
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

  // 3. Smooth Continuous Pointed Rib Vaults (40 segments for silky curvature) + Enclosed Vault Webbing
  const ribGeos = [];
  const bossGeos = [];
  const webGeos = [];

  for (const bz of bayZs) {
    ribGeos.push(
      ...buildPointedArchRib({
        spanHalf: PIER_X,
        springY: VAULT_SPRING_Y,
        apexY: VAULT_APEX_Y,
        z: bz,
        width: 0.28,
        depth: 0.30,
        segments: 40,
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
    ribGeos.push(...buildDiagonalVaultRib([-PIER_X, VAULT_SPRING_Y, z0], [PIER_X, VAULT_SPRING_Y, z1], 5.4, 0.15, 0.17, 32));
    ribGeos.push(...buildDiagonalVaultRib([PIER_X, VAULT_SPRING_Y, z0], [-PIER_X, VAULT_SPRING_Y, z1], 5.4, 0.15, 0.17, 32));
    const bayBoss = new THREE.OctahedronGeometry(0.26, 0);
    xform(bayBoss, [0, VAULT_APEX_Y - 0.04, midZ]);
    bossGeos.push(bayBoss);
  }
  const ridgeRib = new THREE.BoxGeometry(0.24, 0.24, 27.6);
  xform(ridgeRib, [0, VAULT_APEX_Y, -0.6]);
  applyWorldPlanarUVs(ridgeRib, 0.36, 0.36);
  ribGeos.push(ridgeRib);

  // Enclosed vault ceiling web spans z = -15.2 .. +14.0 strictly behind West Facade (zero gable poke-through!)
  for (const side of [-1, 1]) {
    const dx = WALL_X;
    const dy = ROOF_APEX_Y - WALL_TOP_Y;
    const len = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    const web = new THREE.BoxGeometry(len, 0.16, 29.2);
    xform(web, [side * dx * 0.5, (ROOF_APEX_Y + WALL_TOP_Y) * 0.5 - 0.55, -0.6], [0, 0, -side * ang]);
    applyWorldPlanarUVs(web, 0.18, 0.18);
    webGeos.push(web);
  }

  const ribMat = mats.brightAlabasterMat.clone();
  ribMat.transparent = true;
  const ribMesh = new THREE.Mesh(mergeClean(ribGeos), ribMat);
  ribMesh.receiveShadow = true;
  const bossMat = mats.silverTrimMat.clone();
  bossMat.transparent = true;
  const bossMesh = new THREE.Mesh(mergeClean(bossGeos), bossMat);
  const webMat = mats.navyStoneMat.clone();
  webMat.transparent = true;
  const webMesh = new THREE.Mesh(mergeClean(webGeos), webMat);
  webMesh.receiveShadow = true;
  vaultsGroup.add(ribMesh, bossMesh, webMesh);

  // 4. Articulated Pitched Gothic Roof Slopes with Sealed Front Gable Cap & Smooth Classical Ridge Rail
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
    const dx = 7.95;
    const dy = ROOF_APEX_Y - WALL_TOP_Y;
    const slopeLen = Math.hypot(dx, dy) + 0.14;
    const pitch = Math.atan2(dy, dx);
    const roofZCenter = -0.7;
    const roofLen = 29.4;

    const rGeos = [];
    const slopeGeo = new THREE.BoxGeometry(slopeLen, 0.34, roofLen);
    xform(slopeGeo, [side * dx * 0.5, (ROOF_APEX_Y + WALL_TOP_Y) * 0.5, roofZCenter], [0, 0, -side * pitch]);
    applyWorldPlanarUVs(slopeGeo, 0.22, 0.22);
    rGeos.push(slopeGeo);

    // Narrow front gable roof cap (x <= 5.64 inside towers) sealing z = 14.0 .. 15.10 without tower poke-through or Z-fighting!
    const capDx = 5.62;
    const capLen = Math.hypot(capDx, capDx * (dy / dx));
    const capSlope = new THREE.BoxGeometry(capLen, 0.34, 1.35);
    xform(
      capSlope,
      [side * capDx * 0.5, ROOF_APEX_Y - capDx * (dy / dx) * 0.5, 14.52],
      [0, 0, -side * pitch]
    );
    applyWorldPlanarUVs(capSlope, 0.22, 0.22);
    rGeos.push(capSlope);

    const mesh = new THREE.Mesh(mergeClean(rGeos), mat);
    mesh.castShadow = side < 0;
    mesh.receiveShadow = true;

    const trimGeos = [];
    const eaveCornice = new THREE.BoxGeometry(0.48, 0.36, roofLen);
    xform(eaveCornice, [side * 7.88, WALL_TOP_Y + 0.04, roofZCenter]);
    applyWorldPlanarUVs(eaveCornice, 0.38, 0.38);
    trimGeos.push(eaveCornice);

    for (const bz of bayZs) {
      if (bz > 11.5) continue;
      const rib = new THREE.BoxGeometry(slopeLen, 0.14, 0.24);
      xform(rib, [side * dx * 0.5, (ROOF_APEX_Y + WALL_TOP_Y) * 0.5 + 0.18, bz], [0, 0, -side * pitch]);
      applyWorldPlanarUVs(rib, 0.38, 0.38);
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

  // Smooth classical molded marble ridge coping (zero spiky triangle teeth)
  const ridgeGeos = [];
  const ridgeCrest = new THREE.BoxGeometry(0.48, 0.38, 30.6);
  xform(ridgeCrest, [0, ROOF_APEX_Y + 0.10, -0.1]);
  ridgeGeos.push(ridgeCrest);
  const ridgeCap = new THREE.BoxGeometry(0.28, 0.22, 30.6);
  xform(ridgeCap, [0, ROOF_APEX_Y + 0.36, -0.1]);
  ridgeGeos.push(ridgeCap);
  const ridgeCrestMesh = new THREE.Mesh(mergeClean(ridgeGeos), mats.whiteMarbleMat);
  roofRidgeGroup.add(ridgeCrestMesh);

  // 5. Sanctuary East Apse Wall + Real Extruded Pointed Lancet Trio & Marble Tracery (z = -15.4)
  const apseWindows = [
    [-3.1, 1.52, 7.6, 3.1],
    [0.0, 1.72, 9.4, 3.1],
    [3.1, 1.52, 7.6, 3.1],
  ];
  const apseWallGeo = createApseWithLancetHolesGeo(7.9, WALL_TOP_Y, ROOF_APEX_Y, 0.68, apseWindows);
  apseWallGeo.translate(0, 0, -15.75);
  const apseStoneMesh = new THREE.Mesh(apseWallGeo, mats.navyStoneMat);
  apseStoneMesh.castShadow = true;
  apseStoneMesh.receiveShadow = true;

  const apseTrimGeos = [];
  const apseDarkGeos = [];
  for (const [lx, winW, winH, baseY] of apseWindows) {
    const glassGeo = createLancetGlassGeo(winW, winH);
    const glassMesh = new THREE.Mesh(glassGeo, mats.lancetGlassMat);
    glassMesh.position.set(lx, baseY, -15.42);
    apseGroup.add(glassMesh);

    const mullion = new THREE.BoxGeometry(0.08, winH - winW * 0.65, 0.16);
    xform(mullion, [lx, baseY + (winH - winW * 0.65) * 0.5, -15.38]);
    apseTrimGeos.push(mullion);

    const oculus = new THREE.TorusGeometry(winW * 0.24, 0.045, 8, 20);
    xform(oculus, [lx, baseY + winH - winW * 0.48, -15.36]);
    apseTrimGeos.push(oculus);

    const sill = new THREE.BoxGeometry(winW + 0.36, 0.18, 0.28);
    xform(sill, [lx, baseY - 0.08, -15.35]);
    apseDarkGeos.push(sill);
  }
  const apseTrimMesh = new THREE.Mesh(mergeClean(apseTrimGeos), mats.whiteMarbleMat);
  const apseDarkMesh = new THREE.Mesh(mergeClean(apseDarkGeos), mats.obsidianMat);
  apseGroup.add(apseStoneMesh, apseTrimMesh, apseDarkMesh);

  // 6. Solid Masonry Clerestory Side Walls + Real Stone Window Tracery
  function buildSideWall(side) {
    const sGroup = new THREE.Group();
    const stoneMat = mats.navyStoneMat.clone();
    stoneMat.transparent = true;
    const glassMat = mats.lancetGlassMat.clone();
    glassMat.transparent = true;
    const trimMat = mats.whiteMarbleMat.clone();
    trimMat.transparent = true;

    const wallX = side * WALL_X;
    const wallGeos = [];
    const trimGeos = [];

    const frontConn = new THREE.BoxGeometry(0.46, WALL_TOP_Y, 3.3);
    xform(frontConn, [wallX, WALL_TOP_Y * 0.5, 13.6]);
    applyWorldPlanarUVs(frontConn, 0.18, 0.18);
    wallGeos.push(frontConn);

    const rearConn = new THREE.BoxGeometry(0.46, WALL_TOP_Y, 3.5);
    xform(rearConn, [wallX, WALL_TOP_Y * 0.5, -13.7]);
    applyWorldPlanarUVs(rearConn, 0.18, 0.18);
    wallGeos.push(rearConn);

    for (let i = 0; i < bayZs.length - 1; i++) {
      const z0 = bayZs[i];
      const z1 = bayZs[i + 1];
      const bayW = Math.abs(z0 - z1);
      const midZ = (z0 + z1) * 0.5;
      const winW = 2.15;
      const winH = 5.95;
      const winBottomY = 1.65;

      const bayWall = createPointedWindowBayGeo(bayW + 0.06, WALL_TOP_Y, 0.44, winW, winH, winBottomY);
      xform(bayWall, [wallX, 0, midZ], [0, Math.PI / 2, 0]);
      wallGeos.push(bayWall);

      const sill = new THREE.BoxGeometry(0.50, 0.16, winW + 0.18);
      xform(sill, [wallX, winBottomY - 0.07, midZ]);
      wallGeos.push(sill);

      const mullion = new THREE.BoxGeometry(0.16, winH - winW * 0.65, 0.09);
      xform(mullion, [wallX, winBottomY + (winH - winW * 0.65) * 0.5, midZ]);
      trimGeos.push(mullion);

      const oculus = new THREE.TorusGeometry(winW * 0.22, 0.045, 8, 20);
      xform(oculus, [wallX, winBottomY + winH - winW * 0.48, midZ], [0, Math.PI / 2, 0]);
      trimGeos.push(oculus);

      const glassGeo = createLancetGlassGeo(winW - 0.02, winH - 0.02);
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(wallX, winBottomY, midZ);
      glass.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      sGroup.add(glass);
    }

    const wallMesh = new THREE.Mesh(mergeClean(wallGeos), stoneMat);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    const trimMesh = new THREE.Mesh(mergeClean(trimGeos), trimMat);
    sGroup.add(wallMesh, trimMesh);

    sGroup.userData.mats = [stoneMat, glassMat, trimMat];
    return sGroup;
  }

  const leftWall = buildSideWall(-1);
  const rightWall = buildSideWall(1);
  leftSideWallGroup.add(leftWall);
  rightSideWallGroup.add(rightWall);

  // 7. Cerulean Stained-Glass Floor Light Projections
  const goboGeo = new THREE.PlaneGeometry(3.8, 5.2);
  for (let i = 0; i < bayZs.length - 1; i++) {
    const midZ = (bayZs[i] + bayZs[i + 1]) * 0.5;
    const pool = new THREE.Mesh(goboGeo, mats.lancetGoboMat);
    pool.rotation.set(-Math.PI / 2, 0, 0.22);
    pool.position.set(2.8, 0.021, midZ - 0.4);
    gobosGroup.add(pool);
  }

  let builtVaultsVisible = true;
  let builtRoofVisible = true;

  function setBuildProgress(p) {
    const pPiers = smooth01(0.04, 0.36, p);
    const pWalls = smooth01(0.08, 0.44, p);
    const pButtress = smooth01(0.14, 0.48, p);
    const pVaults = smooth01(0.24, 0.64, p);
    const pRoof = smooth01(0.32, 0.70, p);

    leftPierBasesGroup.position.y = (1 - pPiers) * -1.4;
    leftPierBasesGroup.visible = pPiers > 0.02;
    rightPierBasesGroup.position.y = (1 - pPiers) * -1.4;
    rightPierBasesGroup.visible = pPiers > 0.02;
    leftPiersGroup.position.y = (1 - pPiers) * -1.8;
    leftPiersGroup.visible = pPiers > 0.02;
    rightPiersGroup.position.y = (1 - pPiers) * -1.8;
    rightPiersGroup.visible = pPiers > 0.02;

    leftButtressGroup.position.y = (1 - pButtress) * -1.8;
    leftButtressGroup.visible = pButtress > 0.02;
    rightButtressGroup.position.y = (1 - pButtress) * -1.8;
    rightButtressGroup.visible = pButtress > 0.02;

    apseGroup.position.y = (1 - pWalls) * -1.8;
    apseGroup.visible = pWalls > 0.02;
    leftSideWallGroup.position.y = (1 - pWalls) * -1.8;
    leftSideWallGroup.visible = pWalls > 0.02;
    rightSideWallGroup.position.y = (1 - pWalls) * -1.8;
    rightSideWallGroup.visible = pWalls > 0.02;

    const vaultSY = THREE.MathUtils.lerp(0.10, 1.0, pVaults);
    vaultsGroup.scale.set(1, vaultSY, 1);
    vaultsGroup.position.y = VAULT_SPRING_Y * (1 - vaultSY) + (1 - pWalls) * -1.8;
    builtVaultsVisible = pVaults > 0.04;
    vaultsGroup.visible = builtVaultsVisible;

    const roofSY = THREE.MathUtils.lerp(0.08, 1.0, pRoof);
    const roofY = WALL_TOP_Y * (1 - roofSY) + (1 - pWalls) * -1.8;
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

    gobosGroup.visible = pWalls > 0.55;
  }

  function update(dt, elapsed, camera) {
    if (!camera) return;
    const camX = camera.position.x;
    const camZ = camera.position.z;
    const inCutawayBand = camZ < 24.5 && camZ > -18.5 && camera.position.y < 19.5;
    const cutLeft = inCutawayBand && camX < -8.5;
    const cutRight = inCutawayBand && camX > 8.5;
    const isOverheadGallery = inCutawayBand && (cutLeft || cutRight);

    const alphaLerp = Math.min(1, dt * 10 || 1);

    // Cutaway hides obstructing near-side walls, buttresses, roof, AND near-side column shafts so all 10 cloches are unobstructed!
    leftBases.userData.mats.forEach((m) => {
      m.opacity += ((cutLeft ? 0.0 : 1.0) - m.opacity) * alphaLerp;
      m.depthWrite = m.opacity > 0.95;
    });
    rightBases.userData.mats.forEach((m) => {
      m.opacity += ((cutRight ? 0.0 : 1.0) - m.opacity) * alphaLerp;
      m.depthWrite = m.opacity > 0.95;
    });
    leftPiers.userData.mats.forEach((m) => {
      m.opacity += ((cutLeft ? 0.0 : 1.0) - m.opacity) * alphaLerp;
      m.depthWrite = m.opacity > 0.95;
    });
    rightPiers.userData.mats.forEach((m) => {
      m.opacity += ((cutRight ? 0.0 : 1.0) - m.opacity) * alphaLerp;
      m.depthWrite = m.opacity > 0.95;
    });

    leftWall.userData.mats.forEach((m) => {
      m.opacity += ((cutLeft ? 0.0 : 1.0) - m.opacity) * alphaLerp;
      m.depthWrite = m.opacity > 0.95;
    });
    leftButt.userData.mats.forEach((m) => {
      m.opacity += ((cutLeft ? 0.0 : 1.0) - m.opacity) * alphaLerp;
      m.depthWrite = m.opacity > 0.95;
    });
    roofSlopeLeft.userData.mats.forEach((m) => {
      m.opacity += ((isOverheadGallery ? 0.0 : 1.0) - m.opacity) * alphaLerp;
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
      m.opacity += ((isOverheadGallery ? 0.0 : 1.0) - m.opacity) * alphaLerp;
      m.depthWrite = m.opacity > 0.95;
    });

    // In 2.5D gallery view, keep far-side columns & clear open vista unobstructed (fade solid ceiling web + thick foreground ribs)
    const vaultAlpha = isOverheadGallery ? 0.0 : 1.0;
    webMat.opacity += (vaultAlpha - webMat.opacity) * alphaLerp;
    webMat.depthWrite = webMat.opacity > 0.95;
    webMesh.visible = webMat.opacity > 0.08;

    ribMat.opacity += (vaultAlpha - ribMat.opacity) * alphaLerp;
    ribMat.depthWrite = ribMat.opacity > 0.95;
    bossMat.opacity += (vaultAlpha - bossMat.opacity) * alphaLerp;
    bossMat.depthWrite = bossMat.opacity > 0.95;

    leftBases.visible = leftBases.userData.mats[0].opacity > 0.08;
    rightBases.visible = rightBases.userData.mats[0].opacity > 0.08;
    leftPiers.visible = leftPiers.userData.mats[0].opacity > 0.08;
    rightPiers.visible = rightPiers.userData.mats[0].opacity > 0.08;

    leftWall.visible = leftWall.userData.mats[0].opacity > 0.08;
    leftButt.visible = leftButt.userData.mats[0].opacity > 0.08;
    roofLeftGroup.visible = roofMatLeft.opacity > 0.08;

    rightWall.visible = rightWall.userData.mats[0].opacity > 0.08;
    rightButt.visible = rightButt.userData.mats[0].opacity > 0.08;
    roofRightGroup.visible = roofMatRight.opacity > 0.08;

    vaultsGroup.visible = builtVaultsVisible && ribMat.opacity > 0.08;
    roofRidgeGroup.visible = builtRoofVisible && !isOverheadGallery;
  }

  function dispose() {}

  return { group, setBuildProgress, update, dispose };
}
