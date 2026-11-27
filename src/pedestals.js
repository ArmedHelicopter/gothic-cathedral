import * as THREE from 'three';
import { PROJECTS } from './data.js';
import { applyWorldPlanarUVs, mergeClean, smooth01, xform } from './geo.js';
import { createProjectIconSculpture } from './projectIcons.js';

/**
 * Independent Component: Twin Museum Colonnades of Slender Carrara Marble Pedestals,
 * Crystal-Clear Bell-Jar Cloches & True Sculpted 3D Project Icons inside.
 */
export function createPedestalsComponent(textures, mats) {
  const group = new THREE.Group();
  group.name = 'pedestals';

  const columnsGroup = new THREE.Group();
  const plaquesGroup = new THREE.Group();
  const relicsGroup = new THREE.Group();
  const clochesGroup = new THREE.Group();
  group.add(columnsGroup, plaquesGroup, relicsGroup, clochesGroup);

  const COL_X = 4.65;
  const PEDESTAL_TOP_Y = 1.32;

  const whiteColGeos = [];
  const darkPlinthGeos = [];
  const velvetGeos = [];
  const silverRingGeos = [];
  const relicMeshes = [];
  const hitMeshes = [];
  const clocheFinials = [];
  const pinAnchors = {};

  const clocheProfile = [];
  const R_GLASS = 0.35;
  const H_CYL = 0.56;
  clocheProfile.push(new THREE.Vector2(R_GLASS, 0));
  clocheProfile.push(new THREE.Vector2(R_GLASS, H_CYL));
  for (let i = 1; i <= 14; i++) {
    const theta = (i / 14) * (Math.PI / 2);
    clocheProfile.push(new THREE.Vector2(Math.cos(theta) * R_GLASS, H_CYL + Math.sin(theta) * 0.24));
  }
  const sharedClocheGeo = new THREE.LatheGeometry(clocheProfile, 36);

  PROJECTS.forEach((proj, idx) => {
    const sign = proj.side === 'left' ? -1 : 1;
    const px = sign * COL_X;
    const pz = proj.bayZ;
    const yaw = sign < 0 ? 0.32 : -0.32;

    pinAnchors[proj.id] = [px, PEDESTAL_TOP_Y + 1.05, pz];

    // 1. Compact Stepped Obsidian Base with Silver Trim Collar
    const plinthA = new THREE.BoxGeometry(0.92, 0.13, 0.92);
    xform(plinthA, [px, 0.065, pz], [0, yaw, 0]);
    applyWorldPlanarUVs(plinthA, 0.5, 0.5);
    darkPlinthGeos.push(plinthA);

    const plinthB = new THREE.BoxGeometry(0.76, 0.12, 0.76);
    xform(plinthB, [px, 0.19, pz], [0, yaw, 0]);
    applyWorldPlanarUVs(plinthB, 0.5, 0.5);
    darkPlinthGeos.push(plinthB);

    const baseCollar = new THREE.TorusGeometry(0.28, 0.026, 8, 20);
    xform(baseCollar, [px, 0.265, pz], [Math.PI / 2, 0, 0]);
    silverRingGeos.push(baseCollar);

    // 2. Slender Fluted Carrara Marble Shaft + Molded Capital & Abacus
    const shaft = new THREE.CylinderGeometry(0.24, 0.265, 0.88, 16);
    xform(shaft, [px, 0.70, pz]);
    whiteColGeos.push(shaft);

    for (let f = 0; f < 8; f++) {
      const a = (f / 8) * Math.PI * 2;
      const rib = new THREE.CylinderGeometry(0.022, 0.025, 0.84, 6);
      xform(rib, [px + Math.cos(a) * 0.25, 0.70, pz + Math.sin(a) * 0.25]);
      whiteColGeos.push(rib);
    }

    const capAstragal = new THREE.TorusGeometry(0.27, 0.026, 8, 20);
    xform(capAstragal, [px, 1.13, pz], [Math.PI / 2, 0, 0]);
    whiteColGeos.push(capAstragal);

    const capNeck = new THREE.CylinderGeometry(0.37, 0.27, 0.12, 16);
    xform(capNeck, [px, 1.20, pz]);
    whiteColGeos.push(capNeck);

    const abacus = new THREE.BoxGeometry(0.82, 0.09, 0.82);
    xform(abacus, [px, 1.29, pz], [0, yaw, 0]);
    applyWorldPlanarUVs(abacus, 0.5, 0.5);
    whiteColGeos.push(abacus);

    // 3. Navy Velvet Display Cushion + Silver Glass Rim
    const velvet = new THREE.CylinderGeometry(0.32, 0.34, 0.045, 24);
    xform(velvet, [px, PEDESTAL_TOP_Y + 0.04, pz]);
    velvetGeos.push(velvet);

    const silverRim = new THREE.TorusGeometry(0.352, 0.020, 10, 32);
    xform(silverRim, [px, PEDESTAL_TOP_Y + 0.036, pz], [Math.PI / 2, 0, 0]);
    silverRingGeos.push(silverRim);

    // 4. Museum Plaque cleanly cantilevered toward aisle (zero flute clipping, razor sharp)
    const plaqueTex = textures.plaqueLabel(proj);
    const plaqueMat = new THREE.MeshStandardMaterial({
      map: plaqueTex,
      roughness: 0.62,
      metalness: 0.04,
      envMapIntensity: 0.35,
    });
    const plaqueMesh = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.27, 0.045), [
      mats.obsidianMat,
      mats.obsidianMat,
      mats.obsidianMat,
      mats.obsidianMat,
      plaqueMat,
      mats.obsidianMat,
    ]);
    const dirToAisle = new THREE.Vector3(-sign * 0.90, 0, 0.44).normalize();
    const dirYaw = Math.atan2(dirToAisle.x, dirToAisle.z);
    plaqueMesh.position.set(px + dirToAisle.x * 0.40, 0.96, pz + dirToAisle.z * 0.40);
    plaqueMesh.lookAt(px + dirToAisle.x * 2.2, 1.12, pz + dirToAisle.z * 2.2);
    plaquesGroup.add(plaqueMesh);

    const bracket = new THREE.BoxGeometry(0.16, 0.11, 0.11);
    xform(bracket, [px + dirToAisle.x * 0.30, 0.94, pz + dirToAisle.z * 0.30], [0, dirYaw, 0]);
    darkPlinthGeos.push(bracket);

    // 5. True Sculpted 3D Project Icon Floating Gently Above Velvet Cushion
    const relicHolder = createProjectIconSculpture(proj.iconKind, mats);
    relicHolder.position.set(px, PEDESTAL_TOP_Y + 0.36, pz);
    relicHolder.rotation.y = sign < 0 ? Math.PI * 0.24 : -Math.PI * 0.24;
    relicHolder.userData.baseY = PEDESTAL_TOP_Y + 0.36;
    relicHolder.userData.baseYaw = relicHolder.rotation.y;
    relicHolder.userData.phase = idx * 0.72;
    relicsGroup.add(relicHolder);
    relicMeshes.push(relicHolder);

    // 6. Crystal-Clear Blown Glass Cloche + Silver Finial Sphere
    const glassMesh = new THREE.Mesh(sharedClocheGeo, mats.clocheGlassMat);
    glassMesh.position.set(px, PEDESTAL_TOP_Y + 0.036, pz);
    glassMesh.renderOrder = 4;
    clochesGroup.add(glassMesh);

    const finial = new THREE.SphereGeometry(0.036, 10, 8);
    xform(finial, [px, PEDESTAL_TOP_Y + 0.87, pz]);
    clocheFinials.push(finial);

    const hit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.46, 2.2, 10),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.position.set(px, 1.15, pz);
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
      camPos: [px - sign * 2.45, 2.08, proj.bayZ + 1.65],
      camTarget: [px, 1.48, proj.bayZ],
    };
  }

  function setBuildProgress(p) {
    const pCols = smooth01(0.18, 0.52, p);
    const pRelics = smooth01(0.32, 0.66, p);
    const pGlass = smooth01(0.44, 0.74, p);

    columnsGroup.position.y = (1 - pCols) * -1.4;
    columnsGroup.visible = pCols > 0.02;
    plaquesGroup.position.y = (1 - pCols) * -1.4;
    plaquesGroup.visible = pCols > 0.02;
    relicsGroup.position.y = (1 - pRelics) * 0.9;
    relicsGroup.visible = pRelics > 0.02;
    clochesGroup.position.y = (1 - pGlass) * 1.4;
    clochesGroup.visible = pGlass > 0.02;
  }

  function update(dt, elapsed) {
    for (let i = 0; i < relicMeshes.length; i++) {
      const r = relicMeshes[i];
      const proj = PROJECTS[i];
      const isFocus = proj.id === selectedId || proj.id === hoveredId;
      const amp = isFocus ? 0.032 : 0.020;
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
    setActiveExhibit,
    getExhibitFocusPose,
    setBuildProgress,
    update,
    dispose,
  };
}
