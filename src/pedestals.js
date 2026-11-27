import * as THREE from 'three';
import { PROJECTS } from './data.js';
import { applyWorldPlanarUVs, mergeClean, smooth01, xform } from './geo.js';

/**
 * Independent Component: Museum Colonnades of Molded Carrara Marble Columns,
 * Crystal-Clear Blown Glass Bell-Jar Cloches & Sculpted 3D Relic Prisms inside.
 */
export function createPedestalsComponent(textures, mats) {
  const group = new THREE.Group();
  group.name = 'pedestals';

  const columnsGroup = new THREE.Group();
  const plaquesGroup = new THREE.Group();
  const relicsGroup = new THREE.Group();
  const clochesGroup = new THREE.Group();
  group.add(columnsGroup, plaquesGroup, relicsGroup, clochesGroup);

  const COL_X = 3.85;
  const PEDESTAL_TOP_Y = 1.44;

  const whiteColGeos = [];
  const darkPlinthGeos = [];
  const velvetGeos = [];
  const silverRingGeos = [];
  const relicMeshes = [];
  const hitMeshes = [];
  const clocheFinials = [];

  const clocheProfile = [];
  const R_GLASS = 0.44;
  const H_CYL = 0.68;
  clocheProfile.push(new THREE.Vector2(R_GLASS, 0));
  clocheProfile.push(new THREE.Vector2(R_GLASS, H_CYL));
  for (let i = 1; i <= 14; i++) {
    const theta = (i / 14) * (Math.PI / 2);
    clocheProfile.push(new THREE.Vector2(Math.cos(theta) * R_GLASS, H_CYL + Math.sin(theta) * 0.30));
  }
  const sharedClocheGeo = new THREE.LatheGeometry(clocheProfile, 36);

  // Sculpted 3D Museum Relic Shrine Housing:
  // Obsidian core recessed strictly INSIDE 4 unobstructed corner silver posts + top/bottom filigree caps,
  // leaving all 4 front/back/left/right icon plates 100% open & legible with generous headspace under dome!
  const relicCoreGeo = new THREE.BoxGeometry(0.33, 0.33, 0.33);

  const silverParts = [];
  for (const [cx, cz] of [[-0.172, -0.172], [0.172, -0.172], [-0.172, 0.172], [0.172, 0.172]]) {
    const post = new THREE.BoxGeometry(0.026, 0.36, 0.026);
    post.translate(cx, 0, cz);
    silverParts.push(post);
  }
  const topCap = new THREE.BoxGeometry(0.38, 0.024, 0.38);
  topCap.translate(0, 0.18, 0);
  const botCap = new THREE.BoxGeometry(0.38, 0.024, 0.38);
  botCap.translate(0, -0.18, 0);
  const crownBase = new THREE.CylinderGeometry(0.08, 0.15, 0.042, 8);
  crownBase.translate(0, 0.21, 0);
  const crestDiamond = new THREE.OctahedronGeometry(0.032, 0);
  crestDiamond.translate(0, 0.26, 0);
  const stemGeo = new THREE.CylinderGeometry(0.024, 0.040, 0.21, 8);
  stemGeo.translate(0, -0.24, 0);
  silverParts.push(topCap, botCap, crownBase, crestDiamond, stemGeo);
  const relicSilverGeo = mergeClean(silverParts);

  const f1 = new THREE.PlaneGeometry(0.305, 0.305);
  f1.translate(0, 0, 0.171);
  const f2 = new THREE.PlaneGeometry(0.305, 0.305);
  f2.rotateY(Math.PI);
  f2.translate(0, 0, -0.171);
  const f3 = new THREE.PlaneGeometry(0.305, 0.305);
  f3.rotateY(Math.PI / 2);
  f3.translate(0.171, 0, 0);
  const f4 = new THREE.PlaneGeometry(0.305, 0.305);
  f4.rotateY(-Math.PI / 2);
  f4.translate(-0.171, 0, 0);
  const relicFacesGeo = mergeClean([f1, f2, f3, f4]);

  PROJECTS.forEach((proj, idx) => {
    const sign = proj.side === 'left' ? -1 : 1;
    const px = sign * COL_X;
    const pz = proj.bayZ;
    const yaw = sign < 0 ? 0.34 : -0.34;

    // 1. Stepped obsidian plinth with crisp silver trim collar so base separates from dark floor
    const plinthA = new THREE.BoxGeometry(1.18, 0.15, 1.18);
    xform(plinthA, [px, 0.075, pz], [0, yaw, 0]);
    applyWorldPlanarUVs(plinthA, 0.5, 0.5);
    darkPlinthGeos.push(plinthA);

    const plinthB = new THREE.BoxGeometry(0.98, 0.14, 0.98);
    xform(plinthB, [px, 0.22, pz], [0, yaw, 0]);
    applyWorldPlanarUVs(plinthB, 0.5, 0.5);
    darkPlinthGeos.push(plinthB);

    const baseCollar = new THREE.TorusGeometry(0.38, 0.032, 8, 20);
    xform(baseCollar, [px, 0.31, pz], [Math.PI / 2, 0, 0]);
    silverRingGeos.push(baseCollar);

    // 2. Fluted Carrara marble shaft + molded classical collar + Gothic capital
    const shaft = new THREE.CylinderGeometry(0.32, 0.35, 0.94, 16);
    xform(shaft, [px, 0.78, pz]);
    whiteColGeos.push(shaft);

    for (let f = 0; f < 8; f++) {
      const a = (f / 8) * Math.PI * 2;
      const rib = new THREE.CylinderGeometry(0.03, 0.033, 0.90, 6);
      xform(rib, [px + Math.cos(a) * 0.33, 0.78, pz + Math.sin(a) * 0.33]);
      whiteColGeos.push(rib);
    }

    const capAstragal = new THREE.TorusGeometry(0.35, 0.032, 8, 20);
    xform(capAstragal, [px, 1.24, pz], [Math.PI / 2, 0, 0]);
    whiteColGeos.push(capAstragal);

    const capNeck = new THREE.CylinderGeometry(0.48, 0.35, 0.14, 16);
    xform(capNeck, [px, 1.32, pz]);
    whiteColGeos.push(capNeck);

    const abacus = new THREE.BoxGeometry(1.06, 0.10, 1.06);
    xform(abacus, [px, 1.42, pz], [0, yaw, 0]);
    applyWorldPlanarUVs(abacus, 0.5, 0.5);
    whiteColGeos.push(abacus);

    // 3. Navy Velvet Pad + Silver Cloche Base Ring
    const velvet = new THREE.CylinderGeometry(0.41, 0.43, 0.05, 24);
    xform(velvet, [px, PEDESTAL_TOP_Y + 0.05, pz]);
    velvetGeos.push(velvet);

    const silverRim = new THREE.TorusGeometry(0.445, 0.024, 10, 32);
    xform(silverRim, [px, PEDESTAL_TOP_Y + 0.045, pz], [Math.PI / 2, 0, 0]);
    silverRingGeos.push(silverRim);

    // 4. Museum Stone Plaque mounted cleanly in front of column shaft via rear corbel bracket (zero column-flute clipping!)
    const plaqueTex = textures.plaqueLabel(proj);
    const plaqueMat = new THREE.MeshStandardMaterial({
      map: plaqueTex,
      roughness: 0.45,
      metalness: 0.08,
    });
    const plaqueMesh = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.31, 0.05), [
      mats.obsidianMat,
      mats.obsidianMat,
      mats.obsidianMat,
      mats.obsidianMat,
      plaqueMat,
      mats.obsidianMat,
    ]);
    const dirToAisle = new THREE.Vector3(-sign * 0.90, 0, 0.44).normalize();
    const dirYaw = Math.atan2(dirToAisle.x, dirToAisle.z);
    plaqueMesh.position.set(px + dirToAisle.x * 0.50, 1.03, pz + dirToAisle.z * 0.50);
    plaqueMesh.lookAt(px + dirToAisle.x * 2.2, 1.18, pz + dirToAisle.z * 2.2);
    plaquesGroup.add(plaqueMesh);

    const bracket = new THREE.BoxGeometry(0.20, 0.14, 0.12);
    xform(bracket, [px + dirToAisle.x * 0.40, 1.01, pz + dirToAisle.z * 0.40], [0, dirYaw, 0]);
    darkPlinthGeos.push(bracket);

    // 5. Sculpted 4-Faced 3D Relic Prism inside Glass Cloche (crisp unobstructed project icons!)
    const iconTex = textures.projectIcon(proj);
    const relicHolder = new THREE.Group();
    relicHolder.position.set(px, PEDESTAL_TOP_Y + 0.39, pz);
    relicHolder.rotation.y = sign < 0 ? Math.PI * 0.26 : -Math.PI * 0.26;

    const coreMesh = new THREE.Mesh(relicCoreGeo, mats.obsidianMat);
    const frameMesh = new THREE.Mesh(relicSilverGeo, mats.silverTrimMat);
    const iconMat = new THREE.MeshStandardMaterial({
      map: iconTex,
      emissiveMap: iconTex,
      emissive: new THREE.Color('#b6d2ff'),
      emissiveIntensity: 0.62,
      roughness: 0.28,
      metalness: 0.08,
    });
    const facesMesh = new THREE.Mesh(relicFacesGeo, iconMat);

    relicHolder.add(coreMesh, frameMesh, facesMesh);
    relicHolder.userData.baseY = PEDESTAL_TOP_Y + 0.39;
    relicHolder.userData.baseYaw = relicHolder.rotation.y;
    relicHolder.userData.phase = idx * 0.72;
    relicHolder.userData.frontMat = iconMat;
    relicsGroup.add(relicHolder);
    relicMeshes.push(relicHolder);

    // 6. Crystal-Clear Blown Glass Cloche + Silver Finial
    const glassMesh = new THREE.Mesh(sharedClocheGeo, mats.clocheGlassMat);
    glassMesh.position.set(px, PEDESTAL_TOP_Y + 0.045, pz);
    glassMesh.renderOrder = 4;
    clochesGroup.add(glassMesh);

    const finial = new THREE.SphereGeometry(0.044, 10, 8);
    xform(finial, [px, PEDESTAL_TOP_Y + 1.045, pz]);
    clocheFinials.push(finial);

    const hit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 2.35, 10),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.position.set(px, 1.2, pz);
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
      camPos: [px - sign * 2.15, 2.15, proj.bayZ + 1.55],
      camTarget: [px, 1.84, proj.bayZ],
    };
  }

  function setBuildProgress(p) {
    const pCols = smooth01(0.18, 0.52, p);
    const pRelics = smooth01(0.34, 0.66, p);
    const pGlass = smooth01(0.46, 0.74, p);

    columnsGroup.position.y = (1 - pCols) * -1.4;
    columnsGroup.visible = pCols > 0.02;
    plaquesGroup.position.y = (1 - pCols) * -1.4;
    plaquesGroup.visible = pCols > 0.02;
    relicsGroup.position.y = (1 - pRelics) * 1.2;
    relicsGroup.visible = pRelics > 0.02;
    clochesGroup.position.y = (1 - pGlass) * 1.8;
    clochesGroup.visible = pGlass > 0.02;
  }

  function update(dt, elapsed) {
    for (let i = 0; i < relicMeshes.length; i++) {
      const r = relicMeshes[i];
      const proj = PROJECTS[i];
      const isFocus = proj.id === selectedId || proj.id === hoveredId;
      r.position.y = r.userData.baseY + Math.sin(elapsed * 1.65 + r.userData.phase) * 0.024;
      r.rotation.y = r.userData.baseYaw + Math.sin(elapsed * 0.55 + r.userData.phase) * 0.42;
      const targetEmissive = isFocus ? 1.1 : 0.55;
      r.userData.frontMat.emissiveIntensity +=
        (targetEmissive - r.userData.frontMat.emissiveIntensity) * Math.min(1, dt * 8 || 1);
    }
  }

  function dispose() {
    sharedClocheGeo.dispose();
    relicCoreGeo.dispose();
    relicSilverGeo.dispose();
    relicFacesGeo.dispose();
  }

  return {
    group,
    hitMeshes,
    setActiveExhibit,
    getExhibitFocusPose,
    setBuildProgress,
    update,
    dispose,
  };
}
