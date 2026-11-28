import * as THREE from 'three';
import { applyWorldPlanarUVs, buildOrderedWireframe, mergeClean, xform } from './geo.js';

export function createOrganComponent(mats) {
  const group = new THREE.Group();
  group.name = 'organ';
  const ivoryGeos = [];
  const goldGeos = [];
  const tinGeos = [];
  const navyGeos = [];
  const mezzY = 9.20;

  function box(bucket, size, position) {
    const geo = new THREE.BoxGeometry(...size);
    xform(geo, position);
    applyWorldPlanarUVs(geo, 0.45, 0.45);
    bucket.push(geo);
  }

  for (const side of [-1, 1]) {
    const centerX = side * 6.4;
    box(navyGeos, [4.20, 3.90, 0.34], [centerX, mezzY + 2.35, 27.48]);
    box(ivoryGeos, [4.35, 0.92, 1.10], [centerX, mezzY + 0.46, 27.02]);
    box(ivoryGeos, [4.48, 0.16, 1.18], [centerX, mezzY + 0.98, 27.02]);
    box(ivoryGeos, [4.42, 0.18, 1.10], [centerX, 13.76, 27.02]);
    box(goldGeos, [4.50, 0.055, 1.14], [centerX, 13.88, 27.02]);

    for (const edge of [-1, 1]) {
      const x = centerX + edge * 2.02;
      const column = new THREE.CylinderGeometry(0.13, 0.16, 3.70, 12);
      xform(column, [x, 11.66, 26.54]);
      ivoryGeos.push(column);
      const crown = new THREE.ConeGeometry(0.22, 0.32, 8);
      xform(crown, [x, 13.99, 26.54]);
      ivoryGeos.push(crown);
      const finial = new THREE.SphereGeometry(0.055, 8, 6);
      xform(finial, [x, 14.16, 26.54]);
      goldGeos.push(finial);
    }

    for (let pipe = 0; pipe < 13; pipe += 1) {
      const f = pipe / 12;
      const x = centerX + (f - 0.5) * 3.56;
      const arch = 1 - Math.abs(f - 0.5) * 2;
      const height = 1.72 + arch * 1.48 + (pipe % 2) * 0.12;
      const baseY = 10.34;
      const radius = 0.092 + arch * 0.018;
      const geo = new THREE.CylinderGeometry(radius * 0.92, radius, height, 12, 1, false);
      xform(geo, [x, baseY + height * 0.5, 26.72]);
      tinGeos.push(geo);
      const lip = new THREE.BoxGeometry(radius * 1.35, 0.17, 0.035);
      xform(lip, [x, baseY + 0.38, 26.615]);
      goldGeos.push(lip);
      const foot = new THREE.CylinderGeometry(radius * 0.62, radius * 0.82, 0.30, 10);
      xform(foot, [x, baseY - 0.10, 26.72]);
      tinGeos.push(foot);
    }

    for (let panel = 0; panel < 4; panel += 1) {
      const x = centerX + (panel - 1.5) * 0.93;
      box(ivoryGeos, [0.055, 0.62, 0.055], [x, mezzY + 0.47, 26.44]);
    }
  }

  box(ivoryGeos, [6.50, 0.62, 0.82], [0, mezzY + 0.31, 27.10]);
  box(goldGeos, [6.58, 0.045, 0.88], [0, mezzY + 0.65, 27.10]);
  for (const side of [-1, 1]) {
    const column = new THREE.CylinderGeometry(0.16, 0.20, 2.25, 12);
    xform(column, [side * 3.48, mezzY + 1.55, 26.65]);
    ivoryGeos.push(column);
    const cap = new THREE.BoxGeometry(0.48, 0.16, 0.48);
    xform(cap, [side * 3.48, mezzY + 2.72, 26.65]);
    goldGeos.push(cap);
  }

  const ivoryGeo = mergeClean(ivoryGeos);
  const goldGeo = mergeClean(goldGeos);
  const tinGeo = mergeClean(tinGeos);
  const navyGeo = mergeClean(navyGeos);
  const ivoryMesh = new THREE.Mesh(ivoryGeo, mats.whiteMarbleMat);
  const goldMesh = new THREE.Mesh(goldGeo, mats.paleGoldMat);
  const tinMesh = new THREE.Mesh(tinGeo, mats.pipeTinMat);
  const navyMesh = new THREE.Mesh(navyGeo, mats.navyStoneMat);
  ivoryMesh.receiveShadow = true;
  tinMesh.receiveShadow = true;
  group.add(navyMesh, ivoryMesh, goldMesh, tinMesh);
  const wireframeMesh = buildOrderedWireframe(
    mergeClean([ivoryGeo.clone(), goldGeo.clone(), tinGeo.clone(), navyGeo.clone()]),
    25, 9.0, 14.3, 0.34, 0.52
  );
  wireframeMesh.name = 'organWireframe';

  return {
    group,
    wireframeMesh,
    update() {},
    dispose() {},
  };
}
