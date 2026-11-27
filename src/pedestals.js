import * as THREE from 'three';
import { PROJECTS } from './data.js';
import { applyWorldPlanarUVs, mergeClean, xform } from './geo.js';
import { createProjectIconSculpture } from './projectIcons.js';

export const PEDESTAL_COL_X = 5.6;

/**
 * Independent Component: Twin Museum Colonnades flanking the Royal Carpet
 * at X = ±5.6m (Z = 7.0, 1.5, -4.0, -9.5, -15.0), leaving the central axis open!
 */
export function createPedestalsComponent(textures, mats) {
  const group = new THREE.Group();
  group.name = 'pedestals';

  const columnsGroup = new THREE.Group();
  const plaquesGroup = new THREE.Group();
  const relicsGroup = new THREE.Group();
  const clochesGroup = new THREE.Group();
  group.add(columnsGroup, plaquesGroup, relicsGroup, clochesGroup);

  const COL_X = PEDESTAL_COL_X;
  const PEDESTAL_TOP_Y = 1.50;

  const whiteColGeos = [];
  const darkPlinthGeos = [];
  const velvetGeos = [];
  const silverRingGeos = [];
  const relicMeshes = [];
  const hitMeshes = [];
  const clocheFinials = [];
  const pinAnchors = {};
  const obstacleCircles = [];

  const clocheProfile = [];
  const R_GLASS = 0.40;
  const H_CYL = 0.64;
  clocheProfile.push(new THREE.Vector2(R_GLASS, 0));
  clocheProfile.push(new THREE.Vector2(R_GLASS, H_CYL));
  for (let i = 1; i <= 14; i++) {
    const theta = (i / 14) * (Math.PI / 2);
    clocheProfile.push(new THREE.Vector2(Math.cos(theta) * R_GLASS, H_CYL + Math.sin(theta) * 0.28));
  }
  const sharedClocheGeo = new THREE.LatheGeometry(clocheProfile, 36);

  PROJECTS.forEach((proj, idx) => {
    const sign = proj.side === 'left' ? -1 : 1;
    const px = sign * COL_X;
    const pz = proj.bayZ;
    const yaw = sign < 0 ? 0.34 : -0.34;

    pinAnchors[proj.id] = [px, PEDESTAL_TOP_Y + 1.24, pz];
    obstacleCircles.push({ x: px, z: pz, r: 0.72 });

    // 1. Stepped Obsidian Base with Silver Trim Collar
    const plinthA = new THREE.BoxGeometry(1.06, 0.15, 1.06);
    xform(plinthA, [px, 0.075, pz], [0, yaw, 0]);
    applyWorldPlanarUVs(plinthA, 0.5, 0.5);
    darkPlinthGeos.push(plinthA);

    const plinthB = new THREE.BoxGeometry(0.88, 0.14, 0.88);
    xform(plinthB, [px, 0.22, pz], [0, yaw, 0]);
    applyWorldPlanarUVs(plinthB, 0.5, 0.5);
    darkPlinthGeos.push(plinthB);

    const baseCollar = new THREE.TorusGeometry(0.32, 0.030, 8, 22);
    xform(baseCollar, [px, 0.305, pz], [Math.PI / 2, 0, 0]);
    silverRingGeos.push(baseCollar);

    // 2. Slender Fluted Carrara Marble Shaft + Capital & Abacus
    const shaft = new THREE.CylinderGeometry(0.28, 0.31, 0.98, 16);
    xform(shaft, [px, 0.80, pz]);
    whiteColGeos.push(shaft);

    for (let f = 0; f < 8; f++) {
      const a = (f / 8) * Math.PI * 2;
      const rib = new THREE.CylinderGeometry(0.026, 0.029, 0.94, 6);
      xform(rib, [px + Math.cos(a) * 0.29, 0.80, pz + Math.sin(a) * 0.29]);
      whiteColGeos.push(rib);
    }

    const capAstragal = new THREE.TorusGeometry(0.31, 0.030, 8, 22);
    xform(capAstragal, [px, 1.29, pz], [Math.PI / 2, 0, 0]);
    whiteColGeos.push(capAstragal);

    const capNeck = new THREE.CylinderGeometry(0.42, 0.31, 0.14, 16);
    xform(capNeck, [px, 1.37, pz]);
    whiteColGeos.push(capNeck);

    const abacus = new THREE.BoxGeometry(0.94, 0.10, 0.94);
    xform(abacus, [px, 1.47, pz], [0, yaw, 0]);
    applyWorldPlanarUVs(abacus, 0.5, 0.5);
    whiteColGeos.push(abacus);

    // 3. Navy Velvet Display Cushion + Silver Glass Rim
    const velvet = new THREE.CylinderGeometry(0.36, 0.39, 0.05, 24);
    xform(velvet, [px, PEDESTAL_TOP_Y + 0.045, pz]);
    velvetGeos.push(velvet);

    const silverRim = new THREE.TorusGeometry(R_GLASS + 0.004, 0.022, 10, 32);
    xform(silverRim, [px, PEDESTAL_TOP_Y + 0.042, pz], [Math.PI / 2, 0, 0]);
    silverRingGeos.push(silverRim);

    // 4. Crisp Museum Plaque angled toward central aisle
    const plaqueTex = textures.plaqueLabel(proj);
    const plaqueMat = new THREE.MeshStandardMaterial({
      map: plaqueTex,
      emissiveMap: plaqueTex,
      emissive: new THREE.Color('#7caeff'),
      emissiveIntensity: 0.30,
      roughness: 0.54,
      metalness: 0.04,
      envMapIntensity: 0.45,
    });
    const plaqueMesh = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.31, 0.05), [
      mats.obsidianMat,
      mats.obsidianMat,
      mats.obsidianMat,
      mats.obsidianMat,
      plaqueMat,
      mats.obsidianMat,
    ]);
    const dirToAisle = new THREE.Vector3(-sign * 0.90, 0, 0.44).normalize();
    const dirYaw = Math.atan2(dirToAisle.x, dirToAisle.z);
    plaqueMesh.position.set(px + dirToAisle.x * 0.46, 1.10, pz + dirToAisle.z * 0.46);
    plaqueMesh.lookAt(px + dirToAisle.x * 2.4, 1.28, pz + dirToAisle.z * 2.4);
    plaquesGroup.add(plaqueMesh);

    const bracket = new THREE.BoxGeometry(0.18, 0.12, 0.12);
    xform(bracket, [px + dirToAisle.x * 0.34, 1.08, pz + dirToAisle.z * 0.34], [0, dirYaw, 0]);
    darkPlinthGeos.push(bracket);

    // 5. True Sculpted 3D Project Icon Floating Above Velvet Cushion
    const relicHolder = createProjectIconSculpture(proj.iconKind, mats);
    relicHolder.scale.setScalar(1.14);
    relicHolder.position.set(px, PEDESTAL_TOP_Y + 0.42, pz);
    relicHolder.rotation.y = sign < 0 ? Math.PI * 0.24 : -Math.PI * 0.24;
    relicHolder.userData.baseY = PEDESTAL_TOP_Y + 0.42;
    relicHolder.userData.baseYaw = relicHolder.rotation.y;
    relicHolder.userData.phase = idx * 0.72;
    relicsGroup.add(relicHolder);
    relicMeshes.push(relicHolder);

    // 6. Crystal-Clear Glass Cloche + Silver Finial
    const glassMesh = new THREE.Mesh(sharedClocheGeo, mats.clocheGlassMat);
    glassMesh.position.set(px, PEDESTAL_TOP_Y + 0.042, pz);
    glassMesh.renderOrder = 4;
    clochesGroup.add(glassMesh);

    const finial = new THREE.SphereGeometry(0.042, 10, 8);
    xform(finial, [px, PEDESTAL_TOP_Y + 1.0, pz]);
    clocheFinials.push(finial);

    const hit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.52, 2.5, 10),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.position.set(px, 1.28, pz);
    hit.userData.exhibitId = proj.id;
    group.add(hit);
    hitMeshes.push(hit);
  });

  const whiteColMesh = new THREE.Mesh(mergeClean(whiteColGeos), mats.whiteMarbleMat);
  whiteColMesh.castShadow = true;
  whiteColMesh.receiveShadow = true;

  const darkPlinthMesh = new THREE.Mesh(mergeClean(darkPlinthGeos), mats.obsidianMat);
  darkPlinthMesh.castShadow = true;
  darkPlinthMesh.receiveShadow = true;

  const velvetMesh = new THREE.Mesh(mergeClean(velvetGeos), mats.navyVelvetMat);
  velvetMesh.receiveShadow = true;

  const silverMesh = new THREE.Mesh(mergeClean([...silverRingGeos, ...clocheFinials]), mats.silverTrimMat);

  columnsGroup.add(whiteColMesh, darkPlinthMesh, velvetMesh, silverMesh);

  let selectedId = null;
  let hoveredId = null;

  function setActiveExhibit(selId, hovId = null) {
    selectedId = selId;
    hoveredId = hovId;
  }

  function getExhibitFocusPose(id) {
    const proj = PROJECTS.find((p) => p.id === id);
    if (!proj) return null;
    const sign = proj.side === 'left' ? -1 : 1;
    const px = sign * COL_X;
    return {
      camPos: [px - sign * 2.55, 2.20, proj.bayZ + 1.85],
      camTarget: [px, 1.72, proj.bayZ],
    };
  }

  function update(dt, elapsed) {
    for (let i = 0; i < relicMeshes.length; i++) {
      const r = relicMeshes[i];
      const proj = PROJECTS[i];
      const isFocus = proj.id === selectedId || proj.id === hoveredId;
      const amp = isFocus ? 0.036 : 0.022;
      r.position.y = r.userData.baseY + Math.sin(elapsed * 1.65 + r.userData.phase) * amp;
      r.rotation.y = r.userData.baseYaw + Math.sin(elapsed * 0.55 + r.userData.phase) * (isFocus ? 0.65 : 0.36);
    }
  }

  function dispose() {
    sharedClocheGeo.dispose();
  }

  return {
    group,
    hitMeshes,
    pinAnchors,
    obstacleCircles,
    setActiveExhibit,
    getExhibitFocusPose,
    update,
    dispose,
  };
}
