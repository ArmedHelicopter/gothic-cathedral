import * as THREE from 'three';
import {
  applyWorldPlanarUVs,
  buildOrderedWireframe,
  buildPointedArchRib,
  mergeClean,
  xform,
} from './geo.js';

const BAY_ZS = [22, 14.5, 7, -0.5, -8, -15.5, -22.5];
const VAULT_BOUNDARIES = [28.5, ...BAY_ZS, -26];
const PIER_X = 9.2;
const WALL_X = 13.6;
const Z_NORTH = -26;
const Z_SOUTH = 28.5;
const SPRING_Y = 15.6;
const APEX_Y = 24.5;

function box(geos, w, h, d, x, y, z, rot = [0, 0, 0]) {
  const geo = new THREE.BoxGeometry(w, h, d);
  geos.push(xform(geo, [x, y, z], rot));
  return geo;
}

function cylinder(geos, rt, rb, h, segments, x, y, z, rot = [0, 0, 0]) {
  const geo = new THREE.CylinderGeometry(rt, rb, h, segments);
  geos.push(xform(geo, [x, y, z], rot));
  return geo;
}

function tube(geos, points, radius = 0.1, tubularSegments = 24, radialSegments = 6) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const geo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
  geos.push(geo);
  return geo;
}

function pointedShape(cx, baseY, width, height) {
  const half = width * 0.5;
  const spring = baseY + height * 0.72;
  const shape = new THREE.Shape();
  shape.moveTo(cx - half, baseY);
  shape.lineTo(cx + half, baseY);
  shape.lineTo(cx + half, spring);
  shape.bezierCurveTo(cx + half * 0.96, spring + height * 0.15, cx + half * 0.40, baseY + height * 0.92, cx, baseY + height);
  shape.bezierCurveTo(cx - half * 0.40, baseY + height * 0.92, cx - half * 0.96, spring + height * 0.15, cx - half, spring);
  shape.closePath();
  return shape;
}

function archY(u, half, spring, rise) {
  const n = Math.min(1, Math.abs(u / half));
  return spring + rise * Math.pow(Math.max(0.0001, 1 - n), 0.72);
}

function sideGeometry(shape, depth, side, x, z) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 12 });
  geo.translate(0, 0, -depth * 0.5);
  geo.rotateY(side * Math.PI * 0.5);
  geo.translate(x, 0, z);
  applyWorldPlanarUVs(geo, 0.32, 0.32);
  return geo;
}

function sidePanel(shape, side, x, z) {
  const geo = new THREE.ShapeGeometry(shape, 16);
  geo.rotateY(side * Math.PI * 0.5);
  geo.translate(x, 0, z);
  return geo;
}

function makeVaultY(x) {
  const n = Math.min(1, Math.abs(x) / PIER_X);
  return SPRING_Y + (APEX_Y - SPRING_Y) * Math.pow(Math.max(0.0001, 1 - n), 0.72);
}

function makeNaveWeb(zA, zB) {
  const nx = 28;
  const nz = 12;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let j = 0; j <= nz; j += 1) {
    const z = THREE.MathUtils.lerp(zA, zB, j / nz);
    for (let i = 0; i <= nx; i += 1) {
      const x = THREE.MathUtils.lerp(-PIER_X, PIER_X, i / nx);
      positions.push(x, makeVaultY(x), z);
      uvs.push(i / nx, j / nz);
    }
  }
  for (let j = 0; j < nz; j += 1) {
    for (let i = 0; i < nx; i += 1) {
      const a = j * (nx + 1) + i;
      const b = a + 1;
      const c = a + nx + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function makeAisleWeb(side, zA, zB) {
  const nx = 10;
  const nz = 8;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let j = 0; j <= nz; j += 1) {
    const z = THREE.MathUtils.lerp(zA, zB, j / nz);
    for (let i = 0; i <= nx; i += 1) {
      const t = i / nx;
      const x = side * THREE.MathUtils.lerp(PIER_X, WALL_X, t);
      const n = Math.abs(t - 0.5) * 2;
      const y = 6.8 + 2.2 * Math.pow(Math.max(0.0001, 1 - n), 0.72);
      positions.push(x, y, z);
      uvs.push(t, j / nz);
    }
  }
  for (let j = 0; j < nz; j += 1) {
    for (let i = 0; i < nx; i += 1) {
      const a = j * (nx + 1) + i;
      const b = a + 1;
      const c = a + nx + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function addQuatrefoil(geos, side, x, y, z, radius = 0.11) {
  for (let i = 0; i < 4; i += 1) {
    const a = i * Math.PI * 0.5;
    const geo = new THREE.TorusGeometry(radius, 0.022, 4, 10);
    geo.rotateY(Math.PI * 0.5);
    geo.translate(x, y + Math.sin(a) * radius * 0.72, z + Math.cos(a) * radius * 0.72);
    geos.push(geo);
  }
}

function addBoss(geos, x, y, z, radius) {
  const sphere = new THREE.SphereGeometry(radius, 12, 8);
  sphere.scale(1, 0.48, 1);
  sphere.translate(x, y - radius * 0.22, z);
  geos.push(sphere);
  const ring = new THREE.TorusGeometry(radius * 0.92, radius * 0.12, 5, 16);
  ring.rotateX(Math.PI * 0.5);
  ring.translate(x, y - radius * 0.38, z);
  geos.push(ring);
}

export function createGothicShellComponent(mats) {
  const group = new THREE.Group();
  group.name = 'perpendicularGothicShell';
  const stoneGeos = [];
  const ribGeos = [];
  const navyGeos = [];
  const goldGeos = [];
  const tinGeos = [];
  const outerGlassGeos = [];
  const backingGeos = [];
  const webGeos = [];
  const bayVisuals = [];
  const wireGeos = [];
  const allStatic = [stoneGeos, ribGeos, navyGeos, goldGeos, tinGeos, outerGlassGeos, backingGeos, webGeos];

  for (const side of [-1, 1]) {
    for (const z of BAY_ZS) {
      const x = side * PIER_X;
      box(stoneGeos, 1.55, 0.34, 1.55, x, 0.17, z);
      box(stoneGeos, 1.34, 0.22, 1.34, x, 0.45, z);
      cylinder(stoneGeos, 0.58, 0.66, 6.55, 12, x, 3.83, z);
      cylinder(stoneGeos, 0.76, 0.62, 0.34, 12, x, 7.04, z);
      box(stoneGeos, 1.42, 0.20, 1.42, x, 7.26, z);
      for (const dz of [-0.42, 0, 0.42]) {
        cylinder(ribGeos, dz === 0 ? 0.18 : 0.13, dz === 0 ? 0.20 : 0.15, 14.95, 10,
          side * (PIER_X - 0.54), 7.92, z + dz);
        cylinder(goldGeos, dz === 0 ? 0.205 : 0.155, dz === 0 ? 0.205 : 0.155, 0.10, 10,
          side * (PIER_X - 0.54), 15.43, z + dz);
      }
      for (const dx of [-0.42, 0.42]) {
        cylinder(stoneGeos, 0.13, 0.16, 6.45, 8, x + dx, 3.78, z + side * 0.18);
      }
      cylinder(ribGeos, 0.31, 0.34, 5.45, 10, x, 12.75, z);
      box(ribGeos, 1.10, 0.18, 1.10, x, 15.48, z);
    }

    for (const z of [28.1, -25.55]) {
      cylinder(ribGeos, 0.24, 0.28, 15.0, 10, side * (PIER_X - 0.18), 7.8, z);
      cylinder(stoneGeos, 0.42, 0.48, 0.46, 10, side * (PIER_X - 0.18), 0.23, z);
    }

    for (let bay = 0; bay < VAULT_BOUNDARIES.length - 1; bay += 1) {
      const zA = VAULT_BOUNDARIES[bay];
      const zB = VAULT_BOUNDARIES[bay + 1];
      const zc = (zA + zB) * 0.5;
      const half = Math.abs(zA - zB) * 0.5;
      const clearHalf = Math.max(1.1, half - 0.58);
      const arcadeRise = Math.min(2.6, clearHalf * 2 * 0.35);
      const spandrel = new THREE.Shape();
      spandrel.moveTo(-clearHalf, 10.2);
      spandrel.lineTo(clearHalf, 10.2);
      spandrel.lineTo(clearHalf, 7.2);
      for (let i = 24; i >= 0; i -= 1) {
        const u = -clearHalf + (i / 24) * clearHalf * 2;
        spandrel.lineTo(u, archY(u, clearHalf, 7.2, arcadeRise));
      }
      spandrel.closePath();
      stoneGeos.push(sideGeometry(spandrel, 0.46, side, side * PIER_X, zc));
      const archPoints = [];
      for (let i = 0; i <= 24; i += 1) {
        const u = THREE.MathUtils.lerp(-clearHalf, clearHalf, i / 24);
        archPoints.push([side * (PIER_X - 0.27), archY(u, clearHalf, 7.2, arcadeRise), zc + u]);
      }
      tube(ribGeos, archPoints, 0.13, 32, 6);
      const hoodPoints = archPoints.map(([x, y, z]) => [x - side * 0.07, y + 0.23, z]);
      tube(ribGeos, hoodPoints, 0.065, 32, 5);

      box(stoneGeos, 0.40, 2.40, clearHalf * 2, side * PIER_X, 11.40, zc);
      box(navyGeos, 0.055, 1.88, clearHalf * 2 - 0.18, side * (PIER_X - 0.225), 11.40, zc);
      const panelCount = Math.max(3, Math.round(clearHalf * 2 / 1.35));
      const panelW = (clearHalf * 2 - 0.22) / panelCount;
      for (let p = 0; p < panelCount; p += 1) {
        const pz = zc - clearHalf + 0.11 + panelW * (p + 0.5);
        const fx = side * (PIER_X - 0.27);
        box(ribGeos, 0.075, 1.80, 0.065, fx, 11.38, pz - panelW * 0.45);
        box(ribGeos, 0.075, 1.80, 0.065, fx, 11.38, pz + panelW * 0.45);
        box(ribGeos, 0.075, 0.065, panelW * 0.9, fx, 10.52, pz);
        const head = [];
        const headHalf = panelW * 0.43;
        for (let i = 0; i <= 12; i += 1) {
          const u = THREE.MathUtils.lerp(-headHalf, headHalf, i / 12);
          head.push([fx, archY(u, headHalf, 11.74, 0.48), pz + u]);
        }
        tube(ribGeos, head, 0.038, 14, 5);
        addQuatrefoil(goldGeos, side, side * (PIER_X - 0.29), 10.30, pz, 0.095);
      }
      box(goldGeos, 0.075, 0.055, clearHalf * 2, side * (PIER_X - 0.29), 10.20, zc);

      const winBase = 12.92;
      const winTop = 15.28;
      const winHalf = clearHalf - 0.10;
      box(stoneGeos, 0.44, 0.26, clearHalf * 2, side * PIER_X, 12.72, zc);
      box(stoneGeos, 0.44, 0.24, clearHalf * 2, side * PIER_X, 15.46, zc);
      box(stoneGeos, 0.44, winTop - winBase, 0.20, side * PIER_X, (winBase + winTop) * 0.5, zc - clearHalf + 0.10);
      box(stoneGeos, 0.44, winTop - winBase, 0.20, side * PIER_X, (winBase + winTop) * 0.5, zc + clearHalf - 0.10);
      const glassShape = new THREE.Shape();
      glassShape.moveTo(-winHalf, winBase);
      glassShape.lineTo(winHalf, winBase);
      glassShape.lineTo(winHalf, winTop);
      glassShape.lineTo(-winHalf, winTop);
      glassShape.closePath();
      const glassMat = new THREE.MeshStandardMaterial({
        color: '#12306E',
        emissive: '#12306E',
        emissiveIntensity: 0.52,
        roughness: 0.26,
        metalness: 0.02,
        side: THREE.DoubleSide,
      });
      const glassGeo = sidePanel(glassShape, side, side * (PIER_X + 0.15), zc);
      const glassMesh = new THREE.Mesh(glassGeo, glassMat);
      glassMesh.name = `clerestory-${side}-${bay}`;
      group.add(glassMesh);
      wireGeos.push(glassGeo);
      const mullions = 4;
      for (let m = 0; m <= mullions; m += 1) {
        const mz = zc + THREE.MathUtils.lerp(-winHalf, winHalf, m / mullions);
        box(ribGeos, 0.12, winTop - winBase, m === 0 || m === mullions ? 0.13 : 0.065,
          side * (PIER_X - 0.04), (winBase + winTop) * 0.5, mz);
      }
      box(ribGeos, 0.12, 0.075, winHalf * 2, side * (PIER_X - 0.04), 14.08, zc);
      box(ribGeos, 0.12, 0.095, winHalf * 2 + 0.18, side * (PIER_X - 0.04), winBase, zc);
      box(ribGeos, 0.12, 0.095, winHalf * 2 + 0.18, side * (PIER_X - 0.04), winTop, zc);
      for (let f = 0; f < 7; f += 1) {
        const fz = zc + THREE.MathUtils.lerp(-winHalf * 0.86, winHalf * 0.86, f / 6);
        const fleck = new THREE.OctahedronGeometry(0.055, 0);
        fleck.scale(0.45, 1, 1);
        fleck.translate(side * (PIER_X - 0.005), 13.18 + (f % 3) * 0.58, fz);
        goldGeos.push(fleck);
      }

      const outerBase = 2.4;
      const outerTop = Math.min(8.25, 6.3 + half * 0.25);
      const outerHalf = Math.max(0.85, clearHalf - 0.10);
      box(stoneGeos, 0.72, outerBase, clearHalf * 2, side * WALL_X, outerBase * 0.5, zc);
      box(stoneGeos, 0.72, 1.25, clearHalf * 2, side * WALL_X, 9.20, zc);
      box(stoneGeos, 0.72, outerTop - outerBase, 0.30, side * WALL_X, (outerBase + outerTop) * 0.5, zc - clearHalf + 0.15);
      box(stoneGeos, 0.72, outerTop - outerBase, 0.30, side * WALL_X, (outerBase + outerTop) * 0.5, zc + clearHalf - 0.15);
      const outerShape = pointedShape(0, outerBase, outerHalf * 2, outerTop - outerBase);
      outerGlassGeos.push(sidePanel(outerShape, side, side * (WALL_X - 0.20), zc));
      const outerBackingShape = pointedShape(0, outerBase - 0.08, outerHalf * 2 + 0.16, outerTop - outerBase + 0.16);
      backingGeos.push(sidePanel(outerBackingShape, side, side * (WALL_X + 0.28), zc));
      for (let m = 0; m <= 3; m += 1) {
        const mz = zc + THREE.MathUtils.lerp(-outerHalf, outerHalf, m / 3);
        box(ribGeos, 0.15, outerTop - outerBase, 0.075, side * (WALL_X - 0.28), (outerBase + outerTop) * 0.5, mz);
      }
      box(ribGeos, 0.15, 0.085, outerHalf * 2, side * (WALL_X - 0.28), 5.35, zc);
      const outerArch = [];
      for (let i = 0; i <= 16; i += 1) {
        const u = THREE.MathUtils.lerp(-outerHalf, outerHalf, i / 16);
        const shapeTop = outerBase + (outerTop - outerBase) * 0.72;
        outerArch.push([side * (WALL_X - 0.30), archY(u, outerHalf, shapeTop, (outerTop - outerBase) * 0.28), zc + u]);
      }
      tube(ribGeos, outerArch, 0.10, 20, 6);

      const aisleCenterX = side * ((PIER_X + WALL_X) * 0.5);
      const aisleApexY = 9.0;
      for (const cornerZ of [zA, zB]) {
        tube(ribGeos, [
          [side * PIER_X, 6.8, cornerZ],
          [aisleCenterX, aisleApexY, zc],
          [side * WALL_X, 6.8, cornerZ],
        ], 0.09, 20, 6);
      }
      tube(ribGeos, [
        [side * PIER_X, 6.8, zA],
        [aisleCenterX, aisleApexY, zc],
        [side * PIER_X, 6.8, zB],
      ], 0.075, 20, 6);
      tube(ribGeos, [
        [side * WALL_X, 6.8, zA],
        [aisleCenterX, aisleApexY, zc],
        [side * WALL_X, 6.8, zB],
      ], 0.075, 20, 6);
    }
  }

  for (let bay = 0; bay < VAULT_BOUNDARIES.length - 1; bay += 1) {
    const zA = VAULT_BOUNDARIES[bay];
    const zB = VAULT_BOUNDARIES[bay + 1];
    const zc = (zA + zB) * 0.5;
    const half = Math.abs(zA - zB) * 0.5;
    webGeos.push(makeNaveWeb(zA, zB));
    for (const side of [-1, 1]) webGeos.push(makeAisleWeb(side, zA, zB));

    const bossMat = new THREE.MeshStandardMaterial({
      color: '#C9A961',
      emissive: '#E2BE72',
      emissiveIntensity: 0.45,
      metalness: 0.85,
      roughness: 0.32,
    });
    const bossGeos = [];
    addBoss(bossGeos, 0, APEX_Y - 0.04, zc, 0.35);
    const outer = [
      [3.0, 0], [0, Math.min(2.4, half * 0.58)], [-3.0, 0], [0, -Math.min(2.4, half * 0.58)],
    ];
    for (const [x, dz] of outer) addBoss(bossGeos, x, makeVaultY(x) - 0.04, zc + dz, 0.175);
    const bossMesh = new THREE.Mesh(mergeClean(bossGeos), bossMat);
    bossMesh.name = `gilt-bosses-${bay}`;
    group.add(bossMesh);
    wireGeos.push(...bossGeos);
    bayVisuals.push({ bossMat });

    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const cornerZ = zc + sz * half;
        tube(ribGeos, [
          [sx * PIER_X, SPRING_Y, cornerZ],
          [sx * 4.6, makeVaultY(4.6), zc + sz * half * 0.48],
          [0, APEX_Y, zc],
        ], 0.13, 24, 7);
        tube(ribGeos, [
          [sx * PIER_X, SPRING_Y, cornerZ],
          [sx * 6.0, makeVaultY(6.0), THREE.MathUtils.lerp(cornerZ, zc, 0.55)],
          [sx * 3.0, makeVaultY(3.0), zc],
        ], 0.075, 20, 6);
        tube(ribGeos, [
          [sx * PIER_X, SPRING_Y, cornerZ],
          [sx * 4.7, makeVaultY(4.7), zc + sz * Math.min(1.4, half * 0.34)],
          [0, APEX_Y, zc + sz * Math.min(2.4, half * 0.58)],
        ], 0.075, 20, 6);
      }
    }
    const starPoints = [];
    const starPlan = [
      [3, 0], [1.15, 0.85], [0, Math.min(2.4, half * 0.58)], [-1.15, 0.85],
      [-3, 0], [-1.15, -0.85], [0, -Math.min(2.4, half * 0.58)], [1.15, -0.85], [3, 0],
    ];
    for (const [x, dz] of starPlan) starPoints.push([x, makeVaultY(x) - 0.025, zc + dz]);
    tube(ribGeos, starPoints, 0.11, 48, 6);
  }

  for (const z of VAULT_BOUNDARIES) {
    const ribs = buildPointedArchRib({
      spanHalf: PIER_X,
      springY: SPRING_Y,
      apexY: APEX_Y,
      z,
      width: 0.24,
      depth: 0.26,
      segments: 32,
    });
    ribGeos.push(...ribs);
  }
  tube(ribGeos, [[0, APEX_Y, Z_SOUTH], [0, APEX_Y, 1.25], [0, APEX_Y, Z_NORTH]], 0.13, 72, 7);

  const south = new THREE.Shape();
  south.moveTo(-WALL_X, 0);
  south.lineTo(WALL_X, 0);
  south.lineTo(WALL_X, 19.6);
  south.lineTo(0, 24.95);
  south.lineTo(-WALL_X, 19.6);
  south.closePath();
  const roseHole = new THREE.Path();
  roseHole.absarc(0, 17.6, 3.35, 0, Math.PI * 2, true);
  south.holes.push(roseHole);
  for (const cx of [-7.0, 7.0]) south.holes.push(pointedShape(cx, 5.8, 2.2, 10.0));
  const southGeo = new THREE.ExtrudeGeometry(south, { depth: 0.85, bevelEnabled: false, curveSegments: 24 });
  southGeo.translate(0, 0, Z_SOUTH - 0.50);
  applyWorldPlanarUVs(southGeo, 0.30, 0.30);
  stoneGeos.push(southGeo);
  const roseGlass = new THREE.Mesh(new THREE.CircleGeometry(3.38, 64), mats.roseGlassMat);
  roseGlass.rotation.y = Math.PI;
  roseGlass.position.set(0, 17.6, Z_SOUTH - 0.08);
  group.add(roseGlass);
  wireGeos.push(new THREE.CircleGeometry(3.38, 32).rotateY(Math.PI).translate(0, 17.6, Z_SOUTH - 0.08));
  const roseRing = new THREE.TorusGeometry(3.46, 0.22, 8, 64);
  roseRing.translate(0, 17.6, Z_SOUTH - 0.40);
  ribGeos.push(roseRing);
  for (let i = 0; i < 16; i += 1) {
    const a = (i / 16) * Math.PI * 2;
    tube(ribGeos, [
      [Math.cos(a) * 0.42, 17.6 + Math.sin(a) * 0.42, Z_SOUTH - 0.43],
      [Math.cos(a) * 1.75, 17.6 + Math.sin(a) * 1.75, Z_SOUTH - 0.43],
      [Math.cos(a) * 3.34, 17.6 + Math.sin(a) * 3.34, Z_SOUTH - 0.43],
    ], i % 4 === 0 ? 0.09 : 0.05, 8, 5);
  }
  for (const cx of [-7, 7]) {
    const glassGeo = new THREE.ShapeGeometry(pointedShape(cx, 5.8, 2.2, 10.0), 20);
    glassGeo.translate(0, 0, Z_SOUTH - 0.10);
    outerGlassGeos.push(glassGeo);
    for (const dx of [-0.36, 0.36]) box(ribGeos, 0.075, 7.4, 0.10, cx + dx, 9.5, Z_SOUTH - 0.42);
    box(ribGeos, 2.1, 0.09, 0.10, cx, 10.3, Z_SOUTH - 0.42);
  }

  const north = new THREE.Shape();
  north.moveTo(-WALL_X, 0);
  north.lineTo(WALL_X, 0);
  north.lineTo(WALL_X, 19.6);
  north.lineTo(0, 24.95);
  north.lineTo(-WALL_X, 19.6);
  north.closePath();
  for (const cx of [-6.2, 6.2]) north.holes.push(pointedShape(cx, 7.8, 2.55, 13.2));
  const northGeo = new THREE.ExtrudeGeometry(north, { depth: 0.85, bevelEnabled: false, curveSegments: 20 });
  northGeo.translate(0, 0, Z_NORTH - 0.50);
  applyWorldPlanarUVs(northGeo, 0.30, 0.30);
  stoneGeos.push(northGeo);
  for (const cx of [-6.2, 6.2]) {
    const geo = new THREE.ShapeGeometry(pointedShape(cx, 7.8, 2.55, 13.2), 20);
    geo.translate(0, 0, Z_NORTH + 0.40);
    outerGlassGeos.push(geo);
    for (const dx of [-0.42, 0.42]) box(ribGeos, 0.085, 9.6, 0.12, cx + dx, 12.6, Z_NORTH + 0.32);
    box(ribGeos, 2.4, 0.10, 0.12, cx, 13.2, Z_NORTH + 0.32);
  }
  box(stoneGeos, 7.8, 12.2, 0.85, 0, 7.25, Z_NORTH + 0.65);
  box(ribGeos, 8.25, 0.28, 1.05, 0, 13.45, Z_NORTH + 0.68);
  for (const x of [-3.6, -1.8, 0, 1.8, 3.6]) {
    cylinder(ribGeos, 0.07, 0.10, 9.8, 8, x, 7.4, Z_NORTH + 1.12);
    const finial = new THREE.OctahedronGeometry(0.24, 0);
    finial.scale(0.72, 1.8, 0.72);
    finial.translate(x, 13.98, Z_NORTH + 0.70);
    goldGeos.push(finial);
  }

  const addMerged = (geos, material, name, shadows = true) => {
    if (!geos.length) return null;
    const merged = mergeClean(geos);
    const mesh = new THREE.Mesh(merged, material);
    mesh.name = name;
    mesh.castShadow = shadows;
    mesh.receiveShadow = shadows;
    group.add(mesh);
    return mesh;
  };

  addMerged(stoneGeos, mats.whiteMarbleMat, 'ivory-three-storey-elevation');
  addMerged(ribGeos, mats.brightAlabasterMat, 'ivory-ribs-shafts-and-tracery');
  addMerged(navyGeos, mats.navyStoneMat, 'triforium-recesses', false);
  addMerged(goldGeos, mats.paleGoldMat, 'pale-gold-nodes-and-quatrefoils');
  addMerged(tinGeos, mats.pipeTinMat, 'tin-details');
  addMerged(outerGlassGeos, mats.lancetGlassMat, 'navy-aisle-and-end-glass', false);
  addMerged(backingGeos, mats.windowSunBackingMat, 'twilight-window-backing', false);
  const webMesh = addMerged(webGeos, mats.navyWebMat, 'navy-stellar-vault-webs', false);
  if (webMesh) webMesh.material.side = THREE.DoubleSide;

  for (const geos of allStatic) wireGeos.push(...geos);
  const wireGeo = buildOrderedWireframe(mergeClean(wireGeos), 31, 0, 25.0, 0.24, 1.0);
  const wireframeMesh = new THREE.LineSegments(wireGeo, mats.wireframeLineMat);
  wireframeMesh.name = 'perpendicularGothicWireframe';

  function setBayIllumination(bayIndex, progress) {
    const p = Number.isFinite(progress) ? THREE.MathUtils.clamp(progress, 0, 1) : 0;
    const visual = bayVisuals[bayIndex];
    if (visual) visual.bossMat.emissiveIntensity = 0.20 + p * 0.85;
    const prefixA = `clerestory--1-${bayIndex}`;
    const prefixB = `clerestory-1-${bayIndex}`;
    for (const child of group.children) {
      if (child.name === prefixA || child.name === prefixB) {
        child.material.emissiveIntensity = 0.20 + p * 1.15;
      }
    }
  }

  function setIllumination(progress, perBay = []) {
    for (let i = 0; i < bayVisuals.length; i += 1) setBayIllumination(i, perBay[i] ?? progress);
  }

  function update() {}

  function dispose() {
    group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material && obj.material !== mats.whiteMarbleMat && obj.material !== mats.brightAlabasterMat
        && obj.material !== mats.navyStoneMat && obj.material !== mats.paleGoldMat
        && obj.material !== mats.pipeTinMat && obj.material !== mats.lancetGlassMat
        && obj.material !== mats.windowSunBackingMat && obj.material !== mats.navyWebMat
        && obj.material !== mats.roseGlassMat) obj.material.dispose();
    });
    wireframeMesh.geometry.dispose();
  }

  return { group, wireframeMesh, setBayIllumination, setIllumination, update, dispose };
}
