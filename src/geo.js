import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export { mergeGeometries };

export function smooth01(e0, e1, v) {
  const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

export function mergeClean(geos) {
  const valid = [];
  for (const g of geos) {
    if (!g) continue;
    const ng = g.index ? g.toNonIndexed() : g.clone();
    if (!ng.getAttribute('normal')) ng.computeVertexNormals();
    if (!ng.getAttribute('uv')) {
      const count = ng.getAttribute('position').count;
      ng.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }
    for (const k of Object.keys(ng.attributes)) {
      if (k !== 'position' && k !== 'normal' && k !== 'uv') {
        ng.deleteAttribute(k);
      }
    }
    valid.push(ng);
  }
  if (!valid.length) return new THREE.BufferGeometry();
  return mergeGeometries(valid, false);
}

export function applyWorldPlanarUVs(geo, scaleU = 0.35, scaleV = 0.35) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = geo.attributes.uv;
  if (!pos || !nor || !uv) return geo;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const nx = Math.abs(nor.getX(i));
    const ny = Math.abs(nor.getY(i));
    if (ny >= 0.55) {
      uv.setXY(i, x * scaleU, z * scaleV);
    } else if (nx >= 0.55) {
      uv.setXY(i, z * scaleU, y * scaleV);
    } else {
      uv.setXY(i, x * scaleU, y * scaleV);
    }
  }
  uv.needsUpdate = true;
  return geo;
}

export function xform(geo, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'XYZ'));
  m.compose(
    new THREE.Vector3(pos[0], pos[1], pos[2]),
    q,
    new THREE.Vector3(scale[0], scale[1], scale[2])
  );
  geo.applyMatrix4(m);
  return geo;
}

/**
 * Smooth, continuous extruded pointed-arch Gothic rib (zero segment kinks!).
 */
export function buildPointedArchRib({
  spanHalf = 6.2,
  springY = 7.2,
  apexY = 12.1,
  z = 0,
  width = 0.28,
  depth = 0.30,
  segments = 28,
}) {
  const halfT = width * 0.5;
  const shape = new THREE.Shape();
  const outerPts = [];
  const innerPts = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const cx = -spanHalf * Math.pow(1 - t, 0.88);
    const cy = springY + (apexY - springY) * Math.sin(t * Math.PI * 0.5);
    const dx = spanHalf * 0.88 * Math.pow(Math.max(0.001, 1 - t), -0.12);
    const dy = (apexY - springY) * (Math.PI * 0.5) * Math.cos(t * Math.PI * 0.5);
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    outerPts.push([cx + nx * halfT, cy + ny * halfT]);
    innerPts.push([cx - nx * halfT, cy - ny * halfT]);
  }
  for (let i = segments - 1; i >= 0; i--) {
    const t = i / segments;
    const cx = spanHalf * Math.pow(1 - t, 0.88);
    const cy = springY + (apexY - springY) * Math.sin(t * Math.PI * 0.5);
    const dx = -spanHalf * 0.88 * Math.pow(Math.max(0.001, 1 - t), -0.12);
    const dy = (apexY - springY) * (Math.PI * 0.5) * Math.cos(t * Math.PI * 0.5);
    const len = Math.hypot(dx, dy) || 1;
    const nx = dy / len;
    const ny = -dx / len;
    outerPts.push([cx + nx * halfT, cy + ny * halfT]);
    innerPts.push([cx - nx * halfT, cy - ny * halfT]);
  }

  shape.moveTo(outerPts[0][0], outerPts[0][1]);
  for (let i = 1; i < outerPts.length; i++) shape.lineTo(outerPts[i][0], outerPts[i][1]);
  for (let i = innerPts.length - 1; i >= 0; i--) shape.lineTo(innerPts[i][0], innerPts[i][1]);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.translate(0, 0, z - depth * 0.5);
  applyWorldPlanarUVs(geo, 0.42, 0.42);
  return [geo];
}

/**
 * Smooth continuous TubeGeometry diagonal quadripartite vault rib (zero chunky box segments).
 */
export function buildDiagonalVaultRib(p0, p1, apexLift = 4.85, width = 0.14, depth = 0.16, segments = 24) {
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const x = THREE.MathUtils.lerp(p0[0], p1[0], t);
    const z = THREE.MathUtils.lerp(p0[2], p1[2], t);
    const archFactor = Math.sin(t * Math.PI);
    const y = THREE.MathUtils.lerp(p0[1], p1[1], t) + apexLift * Math.pow(archFactor, 0.78);
    pts.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, segments, width * 0.72, 6, false);
  applyWorldPlanarUVs(geo, 0.45, 0.45);
  return [geo];
}
