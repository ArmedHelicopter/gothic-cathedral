import * as THREE from 'three';
import { PROJECTS } from './data.js';
import { applyWorldPlanarUVs, buildOrderedWireframe, mergeClean, xform } from './geo.js';
import { createProjectIconSculpture } from './projectIcons.js';

export const PEDESTAL_COL_X = 5.6;

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
  const ivoryGeos = [];
  const panelGeos = [];
  const brassGeos = [];
  const velvetGeos = [];
  const poolGeos = [];
  const wireSourceGeos = [];
  const relicMeshes = [];
  const hitMeshes = [];
  const pinAnchors = {};
  const obstacleCircles = [];

  const clocheProfile = [new THREE.Vector2(0.40, 0), new THREE.Vector2(0.40, 0.64)];
  for (let i = 1; i <= 14; i += 1) {
    const theta = (i / 14) * (Math.PI / 2);
    clocheProfile.push(new THREE.Vector2(Math.cos(theta) * 0.40, 0.64 + Math.sin(theta) * 0.28));
  }
  const sharedClocheGeo = new THREE.LatheGeometry(clocheProfile, 36);
  const poolMat = mats.paleGoldGlowMat.clone();
  poolMat.uniforms.uOpacity.value = 0.34;

  function addMoulding(width, height, depth, y, px, pz) {
    const geo = new THREE.BoxGeometry(width, height, depth);
    xform(geo, [px, y, pz]);
    applyWorldPlanarUVs(geo, 0.5, 0.5);
    ivoryGeos.push(geo);
  }

  PROJECTS.forEach((proj, idx) => {
    const sign = proj.side === 'left' ? -1 : 1;
    const px = sign * COL_X;
    const pz = proj.bayZ;
    pinAnchors[proj.id] = [px, PEDESTAL_TOP_Y + 1.24, pz];
    obstacleCircles.push({ x: px, z: pz, r: 0.72 });

    addMoulding(1.12, 0.12, 1.12, 0.06, px, pz);
    addMoulding(1.00, 0.10, 1.00, 0.17, px, pz);
    addMoulding(0.90, 0.08, 0.90, 0.26, px, pz);
    addMoulding(0.78, 0.84, 0.78, 0.73, px, pz);
    addMoulding(0.88, 0.10, 0.88, 1.18, px, pz);
    addMoulding(1.00, 0.10, 1.00, 1.28, px, pz);
    addMoulding(1.08, 0.12, 1.08, 1.44, px, pz);

    for (let face = 0; face < 4; face += 1) {
      const angle = face * Math.PI * 0.5;
      const normal = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
      const tangent = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));
      for (const panelCenter of [-0.19, 0.19]) {
        const center = new THREE.Vector3(px, 0.73, pz)
          .addScaledVector(normal, 0.402)
          .addScaledVector(tangent, panelCenter);
        const inset = new THREE.BoxGeometry(0.28, 0.58, 0.018);
        xform(inset, center.toArray(), [0, angle, 0]);
        panelGeos.push(inset);
        for (const edge of [-0.155, 0.155]) {
          const vertical = new THREE.BoxGeometry(0.025, 0.66, 0.035);
          const pos = center.clone().addScaledVector(tangent, edge).addScaledVector(normal, 0.014);
          xform(vertical, pos.toArray(), [0, angle, 0]);
          ivoryGeos.push(vertical);
        }
        for (const y of [0.405, 1.055]) {
          const horizontal = new THREE.BoxGeometry(0.335, 0.025, 0.035);
          const pos = new THREE.Vector3(px, y, pz)
            .addScaledVector(normal, 0.416)
            .addScaledVector(tangent, panelCenter);
          xform(horizontal, pos.toArray(), [0, angle, 0]);
          ivoryGeos.push(horizontal);
        }
      }
    }

    const velvet = new THREE.CylinderGeometry(0.36, 0.39, 0.05, 24);
    xform(velvet, [px, PEDESTAL_TOP_Y + 0.045, pz]);
    velvetGeos.push(velvet);
    const rim = new THREE.TorusGeometry(0.404, 0.022, 10, 32);
    xform(rim, [px, PEDESTAL_TOP_Y + 0.042, pz], [Math.PI / 2, 0, 0]);
    brassGeos.push(rim);
    const finial = new THREE.SphereGeometry(0.042, 10, 8);
    xform(finial, [px, PEDESTAL_TOP_Y + 1.0, pz]);
    brassGeos.push(finial);

    const plaqueTex = textures.plaqueLabel(proj);
    const plaqueMat = new THREE.MeshStandardMaterial({
      map: plaqueTex,
      emissiveMap: plaqueTex,
      emissive: new THREE.Color('#C9A961'),
      emissiveIntensity: 0.24,
      roughness: 0.42,
      metalness: 0.28,
      envMapIntensity: 0.75,
    });
    const plaque = new THREE.Group();
    const plaqueBackGeo = new THREE.BoxGeometry(1.04, 0.37, 0.055);
    const plaqueBack = new THREE.Mesh(plaqueBackGeo, mats.brassMat);
    const plaqueFace = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.29), plaqueMat);
    plaqueFace.position.z = 0.030;
    plaque.add(plaqueBack, plaqueFace);
    const dirToAxis = new THREE.Vector3(-sign * 0.94, 0, 0.34).normalize();
    plaque.position.set(px + dirToAxis.x * 0.48, 0.80, pz + dirToAxis.z * 0.48);
    plaque.lookAt(plaque.position.clone().add(dirToAxis));
    plaque.rotateX(-0.20);
    plaquesGroup.add(plaque);
    plaque.updateMatrixWorld(true);
    wireSourceGeos.push(plaqueBackGeo.clone().applyMatrix4(plaque.matrixWorld));
    const bracket = new THREE.BoxGeometry(0.16, 0.20, 0.16);
    xform(bracket, [px + dirToAxis.x * 0.35, 0.73, pz + dirToAxis.z * 0.35]);
    brassGeos.push(bracket);

    const relicHolder = createProjectIconSculpture(proj.iconKind, mats);
    relicHolder.scale.setScalar(1.14);
    relicHolder.position.set(px, PEDESTAL_TOP_Y + 0.42, pz);
    relicHolder.rotation.y = sign < 0 ? Math.PI * 0.24 : -Math.PI * 0.24;
    relicHolder.userData.baseY = PEDESTAL_TOP_Y + 0.42;
    relicHolder.userData.baseYaw = relicHolder.rotation.y;
    relicHolder.userData.phase = idx * 0.72;
    relicsGroup.add(relicHolder);
    relicMeshes.push(relicHolder);

    const glassMesh = new THREE.Mesh(sharedClocheGeo, mats.clocheGlassMat);
    glassMesh.position.set(px, PEDESTAL_TOP_Y + 0.042, pz);
    glassMesh.renderOrder = 4;
    clochesGroup.add(glassMesh);

    const pool = new THREE.CircleGeometry(1.08, 48);
    xform(pool, [px, 0.034, pz], [-Math.PI / 2, 0, 0]);
    poolGeos.push(pool);

    const hit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.52, 2.5, 10),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.position.set(px, 1.28, pz);
    hit.userData.exhibitId = proj.id;
    group.add(hit);
    hitMeshes.push(hit);
  });

  const ivoryGeo = mergeClean(ivoryGeos);
  const ivoryMesh = new THREE.Mesh(ivoryGeo, mats.whiteMarbleMat);
  ivoryMesh.castShadow = true;
  ivoryMesh.receiveShadow = true;
  const panelMesh = new THREE.Mesh(mergeClean(panelGeos), mats.brightAlabasterMat);
  panelMesh.receiveShadow = true;
  const brassGeo = mergeClean(brassGeos);
  const brassMesh = new THREE.Mesh(brassGeo, mats.brassMat);
  const velvetGeo = mergeClean(velvetGeos);
  const velvetMesh = new THREE.Mesh(velvetGeo, mats.navyVelvetMat);
  velvetMesh.receiveShadow = true;
  columnsGroup.add(ivoryMesh, panelMesh, brassMesh, velvetMesh);

  const poolMesh = new THREE.Mesh(mergeClean(poolGeos), poolMat);
  poolMesh.renderOrder = 2;
  group.add(poolMesh);
  const wireframeMesh = buildOrderedWireframe(
    mergeClean([ivoryGeo.clone(), brassGeo.clone(), velvetGeo.clone(), ...wireSourceGeos]),
    24, 0, 3, 0.40, 0.58
  );
  wireframeMesh.name = 'pedestalsWireframe';

  let selectedId = null;
  let hoveredId = null;
  function setActiveExhibit(selId, hovId = null) {
    selectedId = selId;
    hoveredId = hovId;
  }
  function getExhibitFocusPose(id) {
    const proj = PROJECTS.find((p) => p.id === id);
    if (!proj) return null;
    return { camPos: [...proj.camPos], camTarget: [...proj.camTarget] };
  }
  function setIllumination(progress) {
    poolMat.uniforms.uOpacity.value = 0.34 * THREE.MathUtils.clamp(progress, 0, 1);
  }
  function update(dt, elapsed) {
    for (let i = 0; i < relicMeshes.length; i += 1) {
      const r = relicMeshes[i];
      const proj = PROJECTS[i];
      const isFocus = proj.id === selectedId || proj.id === hoveredId;
      r.position.y = r.userData.baseY + Math.sin(elapsed * 1.65 + r.userData.phase) * (isFocus ? 0.036 : 0.022);
      r.rotation.y = r.userData.baseYaw + Math.sin(elapsed * 0.55 + r.userData.phase) * (isFocus ? 0.65 : 0.36);
    }
  }
  function dispose() {
    sharedClocheGeo.dispose();
  }

  return {
    group,
    wireframeMesh,
    hitMeshes,
    pinAnchors,
    obstacleCircles,
    setActiveExhibit,
    getExhibitFocusPose,
    setIllumination,
    update,
    dispose,
  };
}
