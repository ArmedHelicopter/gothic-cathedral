import * as THREE from 'three';
import {
  applyWorldPlanarUVs,
  buildDiagonalVaultRib,
  buildOrderedWireframe,
  buildPointedArchRib,
  mergeClean,
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
  const geo = new THREE.ShapeGeometry(sh, 16);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) + hw) / w, pos.getY(i) / h);
  }
  uv.needsUpdate = true;
  return geo;
}

function createDoubleLancetBayGeo(bayW, bayH, depth, winW, winH, winBottomY, offsetSep) {
  const hw = bayW * 0.5;
  const wall = new THREE.Shape();
  wall.moveTo(-hw, 0);
  wall.lineTo(hw, 0);
  wall.lineTo(hw, bayH);
  wall.lineTo(-hw, bayH);
  wall.closePath();

  const wHw = winW * 0.5;
  for (const cx of [-offsetSep, offsetSep]) {
    const springY = winBottomY + winH - winW * 0.85;
    const hole = new THREE.Path();
    hole.moveTo(cx - wHw, winBottomY);
    hole.lineTo(cx - wHw, springY);
    hole.quadraticCurveTo(cx - wHw * 0.72, winBottomY + winH - winW * 0.25, cx, winBottomY + winH);
    hole.quadraticCurveTo(cx + wHw * 0.72, winBottomY + winH - winW * 0.25, cx + wHw, springY);
    hole.lineTo(cx + wHw, winBottomY);
    hole.closePath();
    wall.holes.push(hole);
  }

  const geo = new THREE.ExtrudeGeometry(wall, { depth, bevelEnabled: false, curveSegments: 16 });
  geo.translate(0, 0, -depth * 0.5);
  applyWorldPlanarUVs(geo, 0.14, 0.14);
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

  const geo = new THREE.ExtrudeGeometry(wall, { depth, bevelEnabled: false, curveSegments: 16 });
  applyWorldPlanarUVs(geo, 0.14, 0.14);
  return geo;
}

function createSouthWallWithRoseGeo(halfW, eaveY, apexY, depth) {
  const wall = new THREE.Shape();
  wall.moveTo(-halfW, 0);
  wall.lineTo(halfW, 0);
  wall.lineTo(halfW, eaveY);
  wall.lineTo(0, apexY);
  wall.lineTo(-halfW, eaveY);
  wall.closePath();

  const rose = new THREE.Path();
  rose.absarc(0, 17.6, 3.35, 0, Math.PI * 2, true);
  wall.holes.push(rose);

  for (const [wx, winW, winH, baseY] of [
    [-7.0, 2.2, 10.0, 5.8],
    [7.0, 2.2, 10.0, 5.8],
  ]) {
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

  const geo = new THREE.ExtrudeGeometry(wall, { depth, bevelEnabled: false, curveSegments: 24 });
  applyWorldPlanarUVs(geo, 0.14, 0.14);
  return geo;
}

/** Adds 3D carved marble tracery mullions + circular oculus inside a lancet window bay. */
function pushLancetStoneTracery(traceryGeos, w, h, pos, rotY = 0) {
  const cen = new THREE.BoxGeometry(0.11, h - w * 0.55, 0.14);
  const sinY = Math.sin(rotY);
  const cosY = Math.cos(rotY);
  xform(cen, [pos[0], pos[1] + (h - w * 0.55) * 0.5, pos[2]], [0, rotY, 0]);
  traceryGeos.push(cen);

  const oculusR = w * 0.28;
  const oculusY = pos[1] + h - w * 0.60;
  const ring = new THREE.TorusGeometry(oculusR, 0.055, 8, 20);
  xform(ring, [pos[0], oculusY, pos[2]], [0, rotY, 0]);
  traceryGeos.push(ring);

  for (const tBarY of [pos[1] + h * 0.26, pos[1] + h * 0.52]) {
    const trans = new THREE.BoxGeometry(w - 0.08, 0.085, 0.13);
    xform(trans, [pos[0], tBarY, pos[2]], [0, rotY, 0]);
    traceryGeos.push(trans);
  }

  // Side jamb marble colonnettes framing the window reveal
  for (const s of [-1, 1]) {
    const jamb = new THREE.CylinderGeometry(0.08, 0.08, h - w * 0.75, 8);
    xform(
      jamb,
      [pos[0] + s * w * 0.5 * cosY, pos[1] + (h - w * 0.75) * 0.5, pos[2] - s * w * 0.5 * sinY],
      [0, rotY, 0]
    );
    traceryGeos.push(jamb);
  }
}

/**
 * Independent Component: Grand 100% Enclosed Gothic Cathedral Architecture
 * - Sculpted deep Prussian-navy ashlar walls, 3D stone tracery lancets, zero black-void dropouts
 * - Properly terminated aisle ribs into wall pilasters (zero overshooting mid-air tips)
 * - Solid carved stone North Sanctuary apse center bay behind Sovereign Painting + flanking navy lancets
 */
export function createGothicShellComponent(mats) {
  const group = new THREE.Group();
  group.name = 'gothicShell';

  const bayZs = [22.0, 14.5, 7.0, -0.5, -8.0, -15.5, -22.5];
  const PIER_X = 9.2;
  const WALL_X = 13.6;
  const Z_NORTH = -26.0;
  const Z_SOUTH = 28.5;
  const VAULT_SPRING_Y = 15.6;
  const VAULT_APEX_Y = 24.5;
  const WALL_TOP_Y = 19.6;
  const SHELL_APEX_Y = 24.95;

  const whiteGeos = [];
  const alabasterGeos = [];
  const obsidianGeos = [];
  const navyGeos = [];
  const silverGeos = [];
  const wireSourceGeos = [];

  // 1. Monumental Clustered Nave Piers (14 Piers, Stepped Octagonal Marble Plinths — ZERO black cubes!)
  for (const side of [-1, 1]) {
    const px = side * PIER_X;
    for (const bz of bayZs) {
      const plinthLower = new THREE.CylinderGeometry(0.86, 0.94, 0.32, 8);
      xform(plinthLower, [px, 0.16, bz], [0, Math.PI / 8, 0]);
      applyWorldPlanarUVs(plinthLower, 0.35, 0.35);
      whiteGeos.push(plinthLower);

      const plinthUpper = new THREE.CylinderGeometry(0.74, 0.82, 0.28, 8);
      xform(plinthUpper, [px, 0.46, bz], [0, Math.PI / 8, 0]);
      applyWorldPlanarUVs(plinthUpper, 0.35, 0.35);
      alabasterGeos.push(plinthUpper);

      const atticTorus = new THREE.TorusGeometry(0.66, 0.065, 10, 20);
      xform(atticTorus, [px, 0.64, bz], [Math.PI / 2, 0, 0]);
      silverGeos.push(atticTorus);

      const core = new THREE.BoxGeometry(0.92, 14.32, 0.92);
      xform(core, [px, 7.72, bz]);
      applyWorldPlanarUVs(core, 0.25, 0.25);
      whiteGeos.push(core);

      for (let c = 0; c < 8; c++) {
        const ang = (c / 8) * Math.PI * 2;
        const rad = c % 2 === 0 ? 0.48 : 0.44;
        const shaft = new THREE.CylinderGeometry(0.14, 0.16, 14.32, 10);
        xform(shaft, [px + Math.cos(ang) * rad, 7.72, bz + Math.sin(ang) * rad]);
        alabasterGeos.push(shaft);
      }

      const midBand = new THREE.BoxGeometry(1.28, 0.28, 1.28);
      xform(midBand, [px, 9.20, bz]);
      whiteGeos.push(midBand);

      const capRing = new THREE.TorusGeometry(0.58, 0.06, 8, 20);
      xform(capRing, [px, 14.88, bz], [Math.PI / 2, 0, 0]);
      silverGeos.push(capRing);

      const capBell = new THREE.CylinderGeometry(0.84, 0.56, 0.54, 16);
      xform(capBell, [px, 15.20, bz]);
      alabasterGeos.push(capBell);

      const abacus = new THREE.BoxGeometry(1.64, 0.24, 1.64);
      xform(abacus, [px, 15.56, bz]);
      applyWorldPlanarUVs(abacus, 0.35, 0.35);
      whiteGeos.push(abacus);
    }

    // Longitudinal Nave Arcade Pointed Arches spanning bays cleanly from pier capital to pier capital
    for (let i = 0; i < bayZs.length - 1; i++) {
      const z0 = bayZs[i];
      const z1 = bayZs[i + 1];
      const pts = [];
      for (let s = 0; s <= 16; s++) {
        const f = s / 16;
        const z = THREE.MathUtils.lerp(z0, z1, f);
        const archY = 9.20 + Math.sin(f * Math.PI) * 5.65;
        pts.push(new THREE.Vector3(px, archY, z));
      }
      const arc = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.26, 8, false);
      applyWorldPlanarUVs(arc, 0.35, 0.35);
      whiteGeos.push(arc);
      wireSourceGeos.push(arc);
    }

    const stringBeam = new THREE.BoxGeometry(0.68, 0.42, Z_SOUTH - Z_NORTH);
    xform(stringBeam, [px, 15.56, (Z_SOUTH + Z_NORTH) * 0.5]);
    applyWorldPlanarUVs(stringBeam, 0.25, 0.25);
    whiteGeos.push(stringBeam);
  }

  // 2. Soaring Ribbed Nave Vaults + Properly Terminated Aisle Transverse Arches (bz -> bz at wall pilaster!)
  for (const bz of bayZs) {
    const trans = buildPointedArchRib({
      spanHalf: PIER_X,
      springY: VAULT_SPRING_Y,
      apexY: VAULT_APEX_Y,
      z: bz,
      width: 0.42,
      depth: 0.46,
      segments: 40,
    });
    whiteGeos.push(...trans);
    wireSourceGeos.push(...trans);

    const transBoss = new THREE.OctahedronGeometry(0.38, 0);
    xform(transBoss, [0, VAULT_APEX_Y, bz]);
    silverGeos.push(transBoss);

    // Side aisle transverse arches cleanly connecting pier (X=±9.2, Y=9.2, bz) -> outer wall pilaster (X=±13.3, Y=16.8, bz)
    for (const side of [-1, 1]) {
      const aislePts = [];
      for (let s = 0; s <= 12; s++) {
        const f = s / 12;
        const ax = side * THREE.MathUtils.lerp(PIER_X, WALL_X - 0.35, f);
        const ay = THREE.MathUtils.lerp(9.2, 16.8, Math.pow(f, 0.72)) + Math.sin(f * Math.PI) * 1.45;
        aislePts.push(new THREE.Vector3(ax, ay, bz));
      }
      const aArch = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(aislePts), 14, 0.17, 8, false);
      applyWorldPlanarUVs(aArch, 0.35, 0.35);
      whiteGeos.push(aArch);
    }
  }

  for (let i = 0; i < bayZs.length - 1; i++) {
    const z0 = bayZs[i];
    const z1 = bayZs[i + 1];
    const midZ = (z0 + z1) * 0.5;

    const d1 = buildDiagonalVaultRib([-PIER_X, VAULT_SPRING_Y, z0], [PIER_X, VAULT_SPRING_Y, z1], 8.75, 0.22, 0.24, 30);
    const d2 = buildDiagonalVaultRib([PIER_X, VAULT_SPRING_Y, z0], [-PIER_X, VAULT_SPRING_Y, z1], 8.75, 0.22, 0.24, 30);
    alabasterGeos.push(...d1, ...d2);
    wireSourceGeos.push(...d1, ...d2);

    const bayBoss = new THREE.OctahedronGeometry(0.42, 0);
    xform(bayBoss, [0, VAULT_APEX_Y - 0.04, midZ]);
    silverGeos.push(bayBoss);
  }

  const ridgeRib = new THREE.BoxGeometry(0.38, 0.38, Z_SOUTH - Z_NORTH);
  xform(ridgeRib, [0, VAULT_APEX_Y, (Z_SOUTH + Z_NORTH) * 0.5]);
  alabasterGeos.push(ridgeRib);
  wireSourceGeos.push(ridgeRib);

  // Completely Sealed Vault Ceiling Shells (visible sculpted Prussian-navy ceiling stonework!)
  for (const side of [-1, 1]) {
    const dx = WALL_X + 0.3;
    const dy = SHELL_APEX_Y - WALL_TOP_Y;
    const len = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    const roofWeb = new THREE.BoxGeometry(len, 0.45, Z_SOUTH - Z_NORTH + 1.0);
    xform(
      roofWeb,
      [side * dx * 0.5, (SHELL_APEX_Y + WALL_TOP_Y) * 0.5, (Z_SOUTH + Z_NORTH) * 0.5],
      [0, 0, -side * ang]
    );
    applyWorldPlanarUVs(roofWeb, 0.12, 0.12);
    navyGeos.push(roofWeb);
  }

  // Carved Vault Oculus Collar in Ceiling at (0, 22.8, -16.8) housing the Sovereign Gold Light Source
  const oculusRing = new THREE.TorusGeometry(0.86, 0.16, 12, 28);
  xform(oculusRing, [0, 23.6, -16.8], [Math.PI / 2 - 0.28, 0, 0]);
  silverGeos.push(oculusRing);

  // 3. Outer Side Walls (`X = ±13.6`) + 3D Carved Stone Lancet Tracery + Deep-Navy Glass
  const bayCenters = [25.25, 18.25, 10.75, 3.25, -4.25, -11.75, -19.0, -24.25];
  const glassGeos = [];
  const backingGeos = [];
  const sealGeos = [];
  const lancetWindowGeo = createLancetGlassGeo(2.05, 11.4);

  for (const side of [-1, 1]) {
    const wx = side * WALL_X;
    for (let i = 0; i < bayCenters.length; i++) {
      const bz = bayCenters[i];
      const bayLen = i === 0 || i === bayCenters.length - 1 ? 6.8 : 7.6;

      if (i === 0 || i === bayCenters.length - 1) {
        const endWall = new THREE.BoxGeometry(0.85, WALL_TOP_Y + 0.6, bayLen);
        xform(endWall, [wx, (WALL_TOP_Y + 0.6) * 0.5, bz]);
        applyWorldPlanarUVs(endWall, 0.14, 0.14);
        navyGeos.push(endWall);
      } else {
        const bayWallGeo = createDoubleLancetBayGeo(bayLen, WALL_TOP_Y + 0.6, 0.85, 2.05, 11.4, 5.2, 1.55);
        xform(bayWallGeo, [wx, 0, bz], [0, Math.PI / 2, 0]);
        navyGeos.push(bayWallGeo);

        const dadoCornice = new THREE.BoxGeometry(0.32, 0.26, bayLen);
        xform(dadoCornice, [wx - side * 0.44, 4.95, bz]);
        whiteGeos.push(dadoCornice);

        for (const off of [-1.55, 1.55]) {
          const wz = bz + off;
          // 3D Carved Marble Mullions, Oculus Tracery & Jamb Colonnettes inside every lancet
          pushLancetStoneTracery(
            whiteGeos,
            2.05,
            11.4,
            [wx - side * 0.20, 5.2, wz],
            -side * Math.PI * 0.5
          );

          const g = lancetWindowGeo.clone();
          xform(g, [wx - side * 0.22, 5.2, wz], [0, -side * Math.PI * 0.5, 0]);
          glassGeos.push(g);

          const back = new THREE.PlaneGeometry(2.6, 12.2);
          xform(back, [wx + side * 0.36, 10.9, wz], [0, -side * Math.PI * 0.5, 0]);
          backingGeos.push(back);

          const hood = new THREE.BoxGeometry(0.65, 13.0, 3.2);
          xform(hood, [wx + side * 0.72, 10.9, wz]);
          sealGeos.push(hood);
        }
      }

      if (i < bayZs.length) {
        const pilZ = bayZs[i];
        const pil = new THREE.BoxGeometry(0.68, WALL_TOP_Y, 0.74);
        xform(pil, [wx - side * 0.45, WALL_TOP_Y * 0.5, pilZ]);
        applyWorldPlanarUVs(pil, 0.24, 0.24);
        whiteGeos.push(pil);

        const pilCap = new THREE.BoxGeometry(0.92, 0.36, 0.94);
        xform(pilCap, [wx - side * 0.45, 16.8, pilZ]);
        whiteGeos.push(pilCap);
      }
    }
  }

  // 4. North Sanctuary Apse Wall (`Z = -26.0`)
  // Solid sculpted central Sanctuary bay behind Sovereign Painting + twin flanking deep-navy lancets (`x = ±6.2`)
  const apseWinSpecs = [
    [-6.2, 2.55, 13.2, 7.8],
    [6.2, 2.55, 13.2, 7.8],
  ];
  const apseWallGeo = createApseWithLancetHolesGeo(WALL_X + 0.4, WALL_TOP_Y + 0.4, SHELL_APEX_Y + 0.3, 1.0, apseWinSpecs);
  xform(apseWallGeo, [0, 0, Z_NORTH - 0.5]);
  navyGeos.push(apseWallGeo);

  for (const [ax, aw, ah, aby] of apseWinSpecs) {
    pushLancetStoneTracery(whiteGeos, aw, ah, [ax, aby, Z_NORTH + 0.14], 0);
    const ag = createLancetGlassGeo(aw, ah);
    xform(ag, [ax, aby, Z_NORTH + 0.08]);
    glassGeos.push(ag);

    const aBack = new THREE.PlaneGeometry(aw + 0.6, ah + 0.6);
    xform(aBack, [ax, aby + ah * 0.5, Z_NORTH - 0.45]);
    backingGeos.push(aBack);

    const aHood = new THREE.BoxGeometry(aw + 1.2, ah + 1.2, 0.6);
    xform(aHood, [ax, aby + ah * 0.5, Z_NORTH - 0.85]);
    sealGeos.push(aHood);
  }

  // Monumental Sovereign Stone Reredos & Flush Gothic Canopy Arch behind Painting (zero T-bar overhang!)
  const reredosScreen = new THREE.BoxGeometry(7.8, 12.2, 0.85);
  xform(reredosScreen, [0, 7.25, Z_NORTH + 0.65]);
  applyWorldPlanarUVs(reredosScreen, 0.20, 0.20);
  navyGeos.push(reredosScreen);

  const reredosCornice = new THREE.BoxGeometry(7.96, 0.36, 1.08);
  xform(reredosCornice, [0, 13.45, Z_NORTH + 0.72]);
  whiteGeos.push(reredosCornice);

  // Crown gable arch tying outer reredos finials cleanly into a Gothic altar canopy
  const reredosCanopy = buildPointedArchRib({
    spanHalf: 3.8,
    springY: 13.45,
    apexY: 16.6,
    z: Z_NORTH + 0.95,
    width: 0.32,
    depth: 0.38,
    segments: 28,
  });
  whiteGeos.push(...reredosCanopy);

  for (const rx of [-3.8, -1.9, 1.9, 3.8]) {
    const fin = new THREE.CylinderGeometry(0.18, 0.22, 12.2, 10);
    xform(fin, [rx, 7.25, Z_NORTH + 1.08]);
    whiteGeos.push(fin);
    const pin = new THREE.ConeGeometry(0.26, 1.35, 4);
    xform(pin, [rx, 14.22, Z_NORTH + 1.08], [0, Math.PI / 4, 0]);
    alabasterGeos.push(pin);
  }
  const reredosArch = buildPointedArchRib({
    spanHalf: 2.1,
    springY: 9.2,
    apexY: 12.4,
    z: Z_NORTH + 1.10,
    width: 0.34,
    depth: 0.36,
    segments: 24,
  });
  alabasterGeos.push(...reredosArch);
  // Blind carved rose relief inside reredos arch above easel (zero floating geometry!)
  const reredosOculus = new THREE.TorusGeometry(0.85, 0.08, 10, 24);
  xform(reredosOculus, [0, 10.65, Z_NORTH + 1.10]);
  whiteGeos.push(reredosOculus);

  // 5. South Stair-Hall Wall (`Z = +28.5`) + Grand Rose Window Behind Spiral Staircase
  const southWallGeo = createSouthWallWithRoseGeo(WALL_X + 0.4, WALL_TOP_Y + 0.4, SHELL_APEX_Y + 0.3, 1.0);
  xform(southWallGeo, [0, 0, Z_SOUTH - 0.5]);
  navyGeos.push(southWallGeo);

  const roseGlassMesh = new THREE.Mesh(new THREE.CircleGeometry(3.38, 48), mats.roseGlassMat);
  roseGlassMesh.rotation.y = Math.PI;
  roseGlassMesh.position.set(0, 17.6, Z_SOUTH - 0.08);
  group.add(roseGlassMesh);

  const roseBack = new THREE.PlaneGeometry(7.2, 7.2);
  xform(roseBack, [0, 17.6, Z_SOUTH + 0.45], [0, Math.PI, 0]);
  backingGeos.push(roseBack);
  const roseHood = new THREE.BoxGeometry(8.0, 8.0, 0.6);
  xform(roseHood, [0, 17.6, Z_SOUTH + 0.85]);
  sealGeos.push(roseHood);

  const roseRing = new THREE.TorusGeometry(3.42, 0.24, 12, 44);
  xform(roseRing, [0, 17.6, Z_SOUTH - 0.16]);
  alabasterGeos.push(roseRing);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const spoke = new THREE.BoxGeometry(0.11, 3.1, 0.16);
    xform(spoke, [Math.cos(a) * 1.72, 17.6 + Math.sin(a) * 1.72, Z_SOUTH - 0.14], [0, 0, a - Math.PI / 2]);
    alabasterGeos.push(spoke);
  }

  for (const sx of [-7.0, 7.0]) {
    pushLancetStoneTracery(whiteGeos, 2.2, 10.0, [sx, 5.8, Z_SOUTH - 0.14], Math.PI);
    const sg = createLancetGlassGeo(2.2, 10.0);
    xform(sg, [sx, 5.8, Z_SOUTH - 0.08], [0, Math.PI, 0]);
    glassGeos.push(sg);
    const sb = new THREE.PlaneGeometry(2.6, 10.6);
    xform(sb, [sx, 10.8, Z_SOUTH + 0.45], [0, Math.PI, 0]);
    backingGeos.push(sb);
    const sh = new THREE.BoxGeometry(3.2, 11.2, 0.6);
    xform(sh, [sx, 10.8, Z_SOUTH + 0.85]);
    sealGeos.push(sh);
  }

  const whiteMesh = new THREE.Mesh(mergeClean(whiteGeos), mats.whiteMarbleMat);
  whiteMesh.castShadow = true;
  whiteMesh.receiveShadow = true;

  const alaMesh = new THREE.Mesh(mergeClean(alabasterGeos), mats.brightAlabasterMat);
  alaMesh.castShadow = true;
  alaMesh.receiveShadow = true;

  const obsMesh = new THREE.Mesh(mergeClean(obsidianGeos), mats.obsidianMat);
  obsMesh.castShadow = true;
  obsMesh.receiveShadow = true;

  const navyMesh = new THREE.Mesh(mergeClean(navyGeos), mats.navyStoneMat);
  navyMesh.castShadow = true;
  navyMesh.receiveShadow = true;

  const silMesh = new THREE.Mesh(mergeClean(silverGeos), mats.silverTrimMat);
  const glassMesh = new THREE.Mesh(mergeClean(glassGeos), mats.lancetGlassMat);
  const backingMesh = new THREE.Mesh(mergeClean(backingGeos), mats.windowSunBackingMat);
  const sealMesh = new THREE.Mesh(mergeClean(sealGeos), mats.obsidianMat);
  sealMesh.castShadow = false;
  sealMesh.receiveShadow = false;

  group.add(whiteMesh, alaMesh, obsMesh, navyMesh, silMesh, glassMesh, backingMesh, sealMesh);

  // Mottled Deep-Navy Stained-Glass Floor Light Pools streaming from East Lancets
  const goboGeo = new THREE.PlaneGeometry(5.6, 10.8);
  for (const gz of [10.75, 3.25, -4.25, -11.75]) {
    const gobo = new THREE.Mesh(goboGeo, mats.lancetGoboMat);
    gobo.rotation.x = -Math.PI / 2;
    gobo.rotation.z = -Math.PI * 0.44;
    gobo.position.set(4.8, 0.026, gz - 0.6);
    gobo.renderOrder = 2;
    group.add(gobo);
  }

  const wireCombined = mergeClean(wireSourceGeos);
  const wireGeo = buildOrderedWireframe(wireCombined, 28, 8.8, 24.8, 0.36, 1.0);
  wireCombined.dispose();
  const wireframeMesh = new THREE.LineSegments(wireGeo, mats.wireframeLineMat);
  wireframeMesh.name = 'gothicVaultWireframe';

  function update() {}

  function dispose() {
    wireGeo.dispose();
    goboGeo.dispose();
    lancetWindowGeo.dispose();
  }

  return { group, wireframeMesh, update, dispose };
}
