import * as THREE from 'three';
import { applyWorldPlanarUVs, buildOrderedWireframe, mergeClean, xform } from './geo.js';

export const STAIR_CONFIG = {
  centerX: 0.0,
  centerZ: 18.0,
  rWell: 2.15,
  rOuter: 3.96,
  rArcade: 4.72,
  mezzY: 9.20,
  thetaStart: 0.24 * Math.PI,
  thetaSpan: 2.02 * Math.PI,
  stepCount: 56,
};

/**
 * Independent Component: Sculpted Carrara Marble Axial Spiral Staircase
 * - Smooth continuous helical under-carriage stone soffit & carved stringers (zero sawtooth underside clipping!)
 * - Carved veined marble octagonal plinths, Attic bases, foliated capitals & smooth turned urn finials
 * - Inset silver medallion rim (r = 3.92m, never intersects arcade columns!)
 */
export function createSpiralStaircaseComponent(mats) {
  const group = new THREE.Group();
  group.name = 'spiralStaircase';

  const { centerX: CX, centerZ: CZ, rWell, rOuter, rArcade, mezzY, thetaStart, thetaSpan, stepCount } = STAIR_CONFIG;

  const whiteGeos = [];
  const alabasterGeos = [];
  const trimObsGeos = [];
  const silverGeos = [];

  // 1. Compass-Star Medallion & Non-Clipping Inset Silver Rings (r = 2.15m & r = 3.92m strictly inside columns!)
  const medallionMesh = new THREE.Mesh(new THREE.CircleGeometry(rOuter + 0.05, 64), mats.wellMedallionMat);
  medallionMesh.rotation.x = -Math.PI / 2;
  medallionMesh.position.set(CX, 0.022, CZ);
  medallionMesh.receiveShadow = true;
  group.add(medallionMesh);

  const rimInner = new THREE.TorusGeometry(rWell, 0.045, 10, 48);
  xform(rimInner, [CX, 0.030, CZ], [Math.PI / 2, 0, 0]);
  silverGeos.push(rimInner);

  const rimInset = new THREE.TorusGeometry(4.06, 0.048, 10, 64);
  xform(rimInset, [CX, 0.030, CZ], [Math.PI / 2, 0, 0]);
  silverGeos.push(rimInset);

  // 2. Smooth Continuous Helical Stone Soffit Vault & Sculpted Marble Stringers
  function buildHelicalTube(radius, yOffset, tubeRadius, radialSegs = 10) {
    const pts = [];
    const samples = 80;
    for (let i = 0; i <= samples; i++) {
      const f = i / samples;
      const th = thetaStart + thetaSpan * f;
      pts.push(new THREE.Vector3(CX + Math.cos(th) * radius, f * mezzY + yOffset, CZ + Math.sin(th) * radius));
    }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, tubeRadius, radialSegs, false);
    applyWorldPlanarUVs(geo, 0.35, 0.35);
    return geo;
  }

  // Smooth helical structural under-carriage slab spanning [rWell, rOuter] so underside has ZERO serrated step edges!
  const soffitSegs = 112;
  const soffitPos = [];
  const soffitUV = [];
  const soffitIdx = [];
  const thickSoffit = 0.28;
  for (let i = 0; i <= soffitSegs; i++) {
    const f = i / soffitSegs;
    const th = thetaStart + thetaSpan * f;
    const yTop = f * mezzY - 0.04;
    const yBot = yTop - thickSoffit;
    const cosT = Math.cos(th);
    const sinT = Math.sin(th);
    // 4 verts per slice: innerTop, outerTop, outerBot, innerBot
    soffitPos.push(
      CX + cosT * (rWell - 0.02), yTop, CZ + sinT * (rWell - 0.02),
      CX + cosT * (rOuter + 0.02), yTop, CZ + sinT * (rOuter + 0.02),
      CX + cosT * (rOuter + 0.02), yBot, CZ + sinT * (rOuter + 0.02),
      CX + cosT * (rWell - 0.02), yBot, CZ + sinT * (rWell - 0.02)
    );
    soffitUV.push(f * 12, 0, f * 12, 1, f * 12, 0.2, f * 12, 0.8);
    if (i < soffitSegs) {
      const a = i * 4;
      const b = (i + 1) * 4;
      soffitIdx.push(a + 2, b + 2, b + 3, a + 2, b + 3, a + 3); // smooth marble underside belly
      soffitIdx.push(a + 1, b + 1, b + 2, a + 1, b + 2, a + 2); // smooth outer stringer cheek
      soffitIdx.push(a + 3, b + 3, b + 0, a + 3, b + 0, a + 0); // smooth inner well cheek
    }
  }
  const soffitGeo = new THREE.BufferGeometry();
  soffitGeo.setAttribute('position', new THREE.Float32BufferAttribute(soffitPos, 3));
  soffitGeo.setAttribute('uv', new THREE.Float32BufferAttribute(soffitUV, 2));
  soffitGeo.setIndex(soffitIdx);
  soffitGeo.computeVertexNormals();
  applyWorldPlanarUVs(soffitGeo, 0.36, 0.36);
  whiteGeos.push(soffitGeo);

  // Carved Carrara stringer lip moldings along bottom edges of helical carriage
  alabasterGeos.push(buildHelicalTube(rWell + 0.04, -0.34, 0.12, 8));
  alabasterGeos.push(buildHelicalTube(rOuter - 0.02, -0.34, 0.14, 8));

  // 3. 56 Cantilevered Carrara Marble Steps Seated Cleanly Above Helical Soffit + Turned Balusters
  const dTheta = thetaSpan / stepCount;
  const stepRise = mezzY / stepCount;
  const latheProfile = [
    new THREE.Vector2(0.056, 0.0),
    new THREE.Vector2(0.056, 0.10),
    new THREE.Vector2(0.032, 0.24),
    new THREE.Vector2(0.054, 0.46),
    new THREE.Vector2(0.028, 0.72),
    new THREE.Vector2(0.048, 0.90),
    new THREE.Vector2(0.048, 1.02),
  ];
  const baseBalusterGeo = new THREE.LatheGeometry(latheProfile, 10);

  for (let i = 0; i < stepCount; i++) {
    const th0 = thetaStart + i * dTheta;
    const th1 = th0 + dTheta * 1.12;
    const yTop = (i + 1) * stepRise;
    const rMid = (rWell + rOuter) * 0.5;
    const chordInner = 2 * rWell * Math.sin((th1 - th0) * 0.5);
    const chordOuter = 2 * rOuter * Math.sin((th1 - th0) * 0.5);
    const thMid = (th0 + th1) * 0.5;

    const sShape = new THREE.Shape();
    sShape.moveTo(rWell - 0.02, -chordInner * 0.52);
    sShape.lineTo(rOuter + 0.01, -chordOuter * 0.52);
    sShape.lineTo(rOuter + 0.01, chordOuter * 0.52);
    sShape.lineTo(rWell - 0.02, chordInner * 0.52);
    sShape.closePath();

    // Depth = stepRise + 0.08 so bottom of every step sits neatly INSIDE the helical carriage slab (zero underside poke-through!)
    const stepBlock = new THREE.ExtrudeGeometry(sShape, { depth: stepRise + 0.08, bevelEnabled: false });
    stepBlock.rotateX(-Math.PI / 2);
    stepBlock.rotateY(-thMid);
    stepBlock.translate(CX, yTop - (stepRise + 0.08), CZ);
    applyWorldPlanarUVs(stepBlock, 0.42, 0.42);
    whiteGeos.push(stepBlock);

    const radLen = rOuter - rWell;
    const nosing = new THREE.BoxGeometry(radLen, 0.046, 0.072);
    xform(nosing, [CX + Math.cos(th0) * rMid, yTop - 0.014, CZ + Math.sin(th0) * rMid], [0, -th0, 0]);
    alabasterGeos.push(nosing);

    const silverTreadFillet = new THREE.BoxGeometry(radLen - 0.14, 0.014, 0.024);
    xform(silverTreadFillet, [CX + Math.cos(th0) * rMid, yTop + 0.008, CZ + Math.sin(th0) * rMid], [0, -th0, 0]);
    silverGeos.push(silverTreadFillet);

    for (const br of [rWell + 0.11, rOuter - 0.11]) {
      const bal = baseBalusterGeo.clone();
      bal.translate(CX + Math.cos(thMid) * br, yTop, CZ + Math.sin(thMid) * br);
      alabasterGeos.push(bal);
    }
  }
  baseBalusterGeo.dispose();

  // 4. Sculpted Carrara Marble Handrails + Brushed-Silver Cap Strip + Turned Spherical Urn Newel Finials
  for (const hr of [rWell + 0.11, rOuter - 0.11]) {
    alabasterGeos.push(buildHelicalTube(hr, 1.03, 0.075, 10));
    silverGeos.push(buildHelicalTube(hr, 1.09, 0.032, 8));
  }

  for (const [thPost, pyBase] of [
    [thetaStart - 0.02, 0.0],
    [thetaStart + thetaSpan + 0.02, mezzY],
  ]) {
    for (const nr of [rWell + 0.11, rOuter - 0.11]) {
      const nx = CX + Math.cos(thPost) * nr;
      const nz = CZ + Math.sin(thPost) * nr;

      const postPlinth = new THREE.CylinderGeometry(0.18, 0.21, 0.24, 8);
      xform(postPlinth, [nx, pyBase + 0.12, nz]);
      whiteGeos.push(postPlinth);

      const postShaft = new THREE.CylinderGeometry(0.13, 0.15, 0.96, 12);
      xform(postShaft, [nx, pyBase + 0.72, nz]);
      alabasterGeos.push(postShaft);

      const collar = new THREE.TorusGeometry(0.145, 0.024, 8, 18);
      xform(collar, [nx, pyBase + 1.20, nz], [Math.PI / 2, 0, 0]);
      silverGeos.push(collar);

      const neckCap = new THREE.CylinderGeometry(0.17, 0.12, 0.10, 12);
      xform(neckCap, [nx, pyBase + 1.26, nz]);
      whiteGeos.push(neckCap);

      // Smooth classical marble finial orb (never low-poly jagged octahedron!)
      const orb = new THREE.SphereGeometry(0.095, 18, 14);
      xform(orb, [nx, pyBase + 1.40, nz]);
      alabasterGeos.push(orb);
    }
  }

  // 5. Monumental 8-Column Carved Marble Arcade Carrying 2nd-Floor Mezzanine Ring
  // Multi-tiered octagonal marble plinths + Attic torus bases + fluted shafts + carved octagonal capitals!
  const arcadeCols = [];
  for (let k = 0; k < 8; k++) {
    const th = (k + 0.5) * (Math.PI / 4);
    const ax = CX + Math.cos(th) * rArcade;
    const az = CZ + Math.sin(th) * rArcade;
    arcadeCols.push({ th, x: ax, z: az });

    const plinthLower = new THREE.CylinderGeometry(0.50, 0.56, 0.24, 8);
    xform(plinthLower, [ax, 0.12, az], [0, th + Math.PI / 8, 0]);
    applyWorldPlanarUVs(plinthLower, 0.45, 0.45);
    whiteGeos.push(plinthLower);

    const plinthUpper = new THREE.CylinderGeometry(0.42, 0.48, 0.22, 8);
    xform(plinthUpper, [ax, 0.35, az], [0, th + Math.PI / 8, 0]);
    applyWorldPlanarUVs(plinthUpper, 0.45, 0.45);
    alabasterGeos.push(plinthUpper);

    const atticBase = new THREE.TorusGeometry(0.36, 0.055, 10, 20);
    xform(atticBase, [ax, 0.54, az], [Math.PI / 2, 0, 0]);
    alabasterGeos.push(atticBase);

    const shaft = new THREE.CylinderGeometry(0.28, 0.32, 7.45, 16);
    xform(shaft, [ax, 4.28, az]);
    whiteGeos.push(shaft);

    for (let f = 0; f < 4; f++) {
      const fa = th + (f * Math.PI) / 2;
      const rib = new THREE.CylinderGeometry(0.072, 0.078, 7.36, 8);
      xform(rib, [ax + Math.cos(fa) * 0.28, 4.28, az + Math.sin(fa) * 0.28]);
      alabasterGeos.push(rib);
    }

    const neck = new THREE.TorusGeometry(0.32, 0.045, 8, 20);
    xform(neck, [ax, 8.02, az], [Math.PI / 2, 0, 0]);
    silverGeos.push(neck);

    const bellCap = new THREE.CylinderGeometry(0.50, 0.30, 0.42, 16);
    xform(bellCap, [ax, 8.26, az]);
    alabasterGeos.push(bellCap);

    const octAbacus = new THREE.CylinderGeometry(0.58, 0.50, 0.22, 8);
    xform(octAbacus, [ax, 8.58, az], [0, th + Math.PI / 8, 0]);
    applyWorldPlanarUVs(octAbacus, 0.45, 0.45);
    whiteGeos.push(octAbacus);
  }

  for (let k = 0; k < 8; k++) {
    const a = arcadeCols[k];
    const b = arcadeCols[(k + 1) % 8];
    const pts = [];
    for (let s = 0; s <= 14; s++) {
      const f = s / 14;
      const px = THREE.MathUtils.lerp(a.x, b.x, f);
      const pz = THREE.MathUtils.lerp(a.z, b.z, f);
      const peakLift = k === 5 ? 2.45 : 1.95;
      const baseSpring = k === 5 ? 6.10 : 6.45;
      const py = baseSpring + Math.sin(f * Math.PI) * peakLift;
      pts.push(new THREE.Vector3(px, py, pz));
    }
    const archGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 18, 0.16, 8, false);
    applyWorldPlanarUVs(archGeo, 0.4, 0.4);
    whiteGeos.push(archGeo);
  }

  // 6. Upper Circular Stairwell Marble Balustrade Ring on 2nd-Floor Mezzanine
  const balPts = [];
  const balSegs = 46;
  for (let i = 0; i <= balSegs; i++) {
    const f = i / balSegs;
    const th = thetaStart + 0.13 * Math.PI + f * (2 * Math.PI - 0.16 * Math.PI);
    const bx = CX + Math.cos(th) * rArcade;
    const bz = CZ + Math.sin(th) * rArcade;
    balPts.push(new THREE.Vector3(bx, mezzY + 1.04, bz));
    if (i % 2 === 0) {
      const post = new THREE.CylinderGeometry(0.055, 0.065, 1.0, 10);
      xform(post, [bx, mezzY + 0.50, bz]);
      alabasterGeos.push(post);
    }
  }
  const topRingCurve = new THREE.CatmullRomCurve3(balPts);
  alabasterGeos.push(new THREE.TubeGeometry(topRingCurve, 56, 0.085, 10, false));
  const topRingSilver = new THREE.TubeGeometry(topRingCurve, 56, 0.036, 8, false);
  topRingSilver.translate(0, 0.055, 0);
  silverGeos.push(topRingSilver);

  for (const gateAngle of [0.21 * Math.PI, 0.37 * Math.PI]) {
    const inner = new THREE.Vector3(
      CX + Math.cos(gateAngle) * (rOuter - 0.10),
      mezzY + 1.04,
      CZ + Math.sin(gateAngle) * (rOuter - 0.10)
    );
    const outer = new THREE.Vector3(
      CX + Math.cos(gateAngle) * (rArcade + 0.12),
      mezzY + 1.04,
      CZ + Math.sin(gateAngle) * (rArcade + 0.12)
    );
    alabasterGeos.push(new THREE.TubeGeometry(new THREE.LineCurve3(inner, outer), 4, 0.085, 10, false));
    const post = new THREE.CylinderGeometry(0.09, 0.11, 1.04, 10);
    xform(post, [outer.x, mezzY + 0.52, outer.z]);
    alabasterGeos.push(post);
    const cap = new THREE.SphereGeometry(0.11, 10, 8);
    xform(cap, [outer.x, mezzY + 1.08, outer.z]);
    silverGeos.push(cap);
  }

  const whiteMerged = mergeClean(whiteGeos);
  const alaMerged = mergeClean(alabasterGeos);
  const obsMerged = mergeClean(trimObsGeos);
  const silMerged = mergeClean(silverGeos);

  const whiteMesh = new THREE.Mesh(whiteMerged, mats.whiteMarbleMat);
  whiteMesh.castShadow = true;
  whiteMesh.receiveShadow = true;

  const alaMesh = new THREE.Mesh(alaMerged, mats.brightAlabasterMat);
  alaMesh.castShadow = true;
  alaMesh.receiveShadow = true;

  const obsMesh = new THREE.Mesh(obsMerged, mats.obsidianMat);
  obsMesh.castShadow = true;
  obsMesh.receiveShadow = true;

  const silMesh = new THREE.Mesh(silMerged, mats.silverTrimMat);

  group.add(whiteMesh, alaMesh, obsMesh, silMesh);

  // Rich structural wireframe + concentric compass star medallion lines (sweeps 0 -> 0.72)
  const wireCombined = mergeClean([whiteMerged, alaMerged]);
  const baseWireGeo = buildOrderedWireframe(wireCombined, 18, 0.0, 10.6, 0.0, 0.68);
  wireCombined.dispose();

  const basePos = baseWireGeo.attributes.position.array;
  const baseOrd = baseWireGeo.attributes.aOrder.array;

  const compassPos = [];
  const compassOrd = [];
  const ringSegs = 64;
  for (const [rad, ordVal] of [
    [0.65, 0.62],
    [1.35, 0.64],
    [rWell, 0.66],
    [3.88, 0.68],
    [rArcade, 0.70],
  ]) {
    for (let i = 0; i < ringSegs; i++) {
      const a0 = (i / ringSegs) * Math.PI * 2;
      const a1 = ((i + 1) / ringSegs) * Math.PI * 2;
      compassPos.push(
        CX + Math.cos(a0) * rad, 0.04, CZ + Math.sin(a0) * rad,
        CX + Math.cos(a1) * rad, 0.04, CZ + Math.sin(a1) * rad
      );
      compassOrd.push(ordVal, ordVal);
    }
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    compassPos.push(
      CX + Math.cos(a) * 0.65, 0.04, CZ + Math.sin(a) * 0.65,
      CX + Math.cos(a) * 3.88, 0.04, CZ + Math.sin(a) * 3.88
    );
    compassOrd.push(0.65, 0.65);
  }

  const totalPos = new Float32Array(basePos.length + compassPos.length);
  totalPos.set(basePos, 0);
  totalPos.set(compassPos, basePos.length);
  const totalOrd = new Float32Array(baseOrd.length + compassOrd.length);
  totalOrd.set(baseOrd, 0);
  totalOrd.set(compassOrd, baseOrd.length);
  baseWireGeo.dispose();

  const wireGeo = new THREE.BufferGeometry();
  wireGeo.setAttribute('position', new THREE.BufferAttribute(totalPos, 3));
  wireGeo.setAttribute('aOrder', new THREE.BufferAttribute(totalOrd, 1));

  const wireframeMesh = new THREE.LineSegments(wireGeo, mats.wireframeLineMat);
  wireframeMesh.name = 'spiralStaircaseWireframe';

  function getStairHeightAt(unwrappedTheta) {
    const f = THREE.MathUtils.clamp((unwrappedTheta - thetaStart) / thetaSpan, 0, 1);
    return f * mezzY;
  }

  function dispose() {
    whiteMerged.dispose();
    alaMerged.dispose();
    obsMerged.dispose();
    silMerged.dispose();
    wireGeo.dispose();
  }

  return { group, wireframeMesh, getStairHeightAt, STAIR_CONFIG, dispose };
}
