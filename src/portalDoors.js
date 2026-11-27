import * as THREE from 'three';
import { applyWorldPlanarUVs, mergeClean, smooth01, xform } from './geo.js';

export function createPortalDoorsComponent(mats) {
  const group = new THREE.Group();
  group.name = 'portalDoors';

  const facadeGroup = new THREE.Group();
  const towerBaseGroup = new THREE.Group();
  const spiresGroup = new THREE.Group();
  const hingeLeft = new THREE.Group();
  const hingeRight = new THREE.Group();
  group.add(facadeGroup, towerBaseGroup, spiresGroup, hingeLeft, hingeRight);

  const FACADE_Z = 15.0;
  const DOOR_HALF_W = 1.66;
  const DOOR_H = 5.45;

  const whiteGeos = [];
  const navyGeos = [];

  const facShape = new THREE.Shape();
  facShape.moveTo(-6.7, 0);
  facShape.lineTo(6.7, 0);
  facShape.lineTo(6.7, 8.25);
  facShape.lineTo(0, 14.95);
  facShape.lineTo(-6.7, 8.25);
  facShape.closePath();

  const doorHole = new THREE.Path();
  doorHole.moveTo(-DOOR_HALF_W, 0);
  doorHole.lineTo(-DOOR_HALF_W, DOOR_H);
  doorHole.lineTo(DOOR_HALF_W, DOOR_H);
  doorHole.lineTo(DOOR_HALF_W, 0);
  doorHole.closePath();
  facShape.holes.push(doorHole);

  const roseHole = new THREE.Path();
  roseHole.absarc(0, 10.1, 1.48, 0, Math.PI * 2, true);
  facShape.holes.push(roseHole);

  const facGeo = new THREE.ExtrudeGeometry(facShape, { depth: 0.72, bevelEnabled: false, curveSegments: 20 });
  facGeo.translate(0, 0, FACADE_Z - 0.36);
  applyWorldPlanarUVs(facGeo, 0.32, 0.32);
  navyGeos.push(facGeo);

  for (const side of [-1, 1]) {
    for (let j = 0; j < 3; j++) {
      const jamb = new THREE.BoxGeometry(0.28, 5.55 + j * 0.3, 0.36);
      xform(jamb, [side * (DOOR_HALF_W + 0.14 + j * 0.24), (5.55 + j * 0.3) * 0.5, FACADE_Z + 0.40 - j * 0.08]);
      applyWorldPlanarUVs(jamb, 0.5, 0.5);
      whiteGeos.push(jamb);
    }
  }

  const tympShape = new THREE.Shape();
  tympShape.moveTo(-DOOR_HALF_W - 0.12, DOOR_H - 0.02);
  tympShape.quadraticCurveTo(-1.1, 6.9, 0, 7.65);
  tympShape.quadraticCurveTo(1.1, 6.9, DOOR_HALF_W + 0.12, DOOR_H - 0.02);
  tympShape.closePath();
  const tympGeo = new THREE.ExtrudeGeometry(tympShape, { depth: 0.24, bevelEnabled: false });
  tympGeo.translate(0, 0, FACADE_Z + 0.22);
  applyWorldPlanarUVs(tympGeo, 0.4, 0.4);
  whiteGeos.push(tympGeo);

  const archSteps = 14;
  for (const side of [-1, 1]) {
    for (let i = 0; i < archSteps; i++) {
      const t0 = i / archSteps;
      const t1 = (i + 1) / archSteps;
      const x0 = side * 2.15 * Math.pow(1 - t0, 0.85);
      const y0 = 5.4 + 2.45 * Math.sin(t0 * Math.PI * 0.5);
      const x1 = side * 2.15 * Math.pow(1 - t1, 0.85);
      const y1 = 5.4 + 2.45 * Math.sin(t1 * Math.PI * 0.5);
      const len = Math.hypot(x1 - x0, y1 - y0) + 0.05;
      const ang = Math.atan2(y1 - y0, x1 - x0);
      const voussoir = new THREE.BoxGeometry(len, 0.32, 0.54);
      xform(voussoir, [(x0 + x1) * 0.5, (y0 + y1) * 0.5, FACADE_Z + 0.36], [0, 0, ang]);
      applyWorldPlanarUVs(voussoir, 0.5, 0.5);
      whiteGeos.push(voussoir);
    }
  }

  const roseRing = new THREE.TorusGeometry(1.55, 0.16, 10, 32);
  xform(roseRing, [0, 10.1, FACADE_Z + 0.36]);
  whiteGeos.push(roseRing);

  const roseDisc = new THREE.Mesh(new THREE.CircleGeometry(1.50, 32), mats.roseGlassMat);
  roseDisc.position.set(0, 10.1, FACADE_Z + 0.26);
  facadeGroup.add(roseDisc);

  // Articulated Gothic Westwork Bell Towers (white marble corner pilasters + navy belfry + faceted octagonal spire + corner spirelets)
  // Articulated Gothic Westwork Bell Towers:
  // Lower tower piers stay grounded on the plinth (`towerBaseGroup`) while upper belfries & spires (`spiresGroup`) settle cleanly onto them!
  const towerBaseWhiteGeos = [];
  const spireWhiteGeos = [];
  const spireNavyGeos = [];
  for (const side of [-1, 1]) {
    const sx = side * 5.85;
    const towerLower = new THREE.BoxGeometry(2.2, 11.4, 2.2);
    xform(towerLower, [sx, 5.7, FACADE_Z]);
    applyWorldPlanarUVs(towerLower, 0.32, 0.32);
    towerBaseWhiteGeos.push(towerLower);

    // Lower corner pilasters (grounded y = 0..11.4)
    for (const [cx, cz] of [[-1.02, -1.02], [1.02, -1.02], [-1.02, 1.02], [1.02, 1.02]]) {
      const pilLow = new THREE.BoxGeometry(0.32, 11.4, 0.32);
      xform(pilLow, [sx + cx, 5.7, FACADE_Z + cz]);
      applyWorldPlanarUVs(pilLow, 0.38, 0.38);
      towerBaseWhiteGeos.push(pilLow);

      const pilUp = new THREE.BoxGeometry(0.32, 4.4, 0.32);
      xform(pilUp, [sx + cx, 13.6, FACADE_Z + cz]);
      applyWorldPlanarUVs(pilUp, 0.38, 0.38);
      spireWhiteGeos.push(pilUp);

      const miniSpire = new THREE.ConeGeometry(0.20, 1.15, 4);
      xform(miniSpire, [sx + cx, 16.45, FACADE_Z + cz], [0, Math.PI / 4, 0]);
      spireWhiteGeos.push(miniSpire);
    }

    const belt = new THREE.BoxGeometry(2.44, 0.26, 2.44);
    xform(belt, [sx, 11.45, FACADE_Z]);
    spireNavyGeos.push(belt);

    const belfry = new THREE.BoxGeometry(2.04, 4.2, 2.04);
    xform(belfry, [sx, 13.7, FACADE_Z]);
    applyWorldPlanarUVs(belfry, 0.35, 0.35);
    spireNavyGeos.push(belfry);

    const belfryCap = new THREE.BoxGeometry(2.36, 0.26, 2.36);
    xform(belfryCap, [sx, 15.9, FACADE_Z]);
    spireWhiteGeos.push(belfryCap);

    const needle = new THREE.ConeGeometry(1.18, 5.2, 8);
    xform(needle, [sx, 18.6, FACADE_Z]);
    applyWorldPlanarUVs(needle, 0.35, 0.35);
    spireNavyGeos.push(needle);

    for (const bx of [-0.42, 0.42]) {
      const louver = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 2.3), mats.lancetGlassMat);
      louver.position.set(sx + bx, 13.7, FACADE_Z + 1.04);
      spiresGroup.add(louver);
    }

    const towerGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 4.4), mats.lancetGlassMat);
    towerGlass.position.set(sx, 7.6, FACADE_Z + 1.12);
    towerBaseGroup.add(towerGlass);
  }

  const facWhiteMesh = new THREE.Mesh(mergeClean(whiteGeos), mats.brightAlabasterMat);
  facWhiteMesh.castShadow = true;
  facWhiteMesh.receiveShadow = true;
  const facNavyMesh = new THREE.Mesh(mergeClean(navyGeos), mats.navyStoneMat);
  facNavyMesh.castShadow = true;
  facNavyMesh.receiveShadow = true;
  facadeGroup.add(facWhiteMesh, facNavyMesh);

  const tbWhiteMesh = new THREE.Mesh(mergeClean(towerBaseWhiteGeos), mats.whiteMarbleMat);
  tbWhiteMesh.castShadow = true;
  tbWhiteMesh.receiveShadow = true;
  towerBaseGroup.add(tbWhiteMesh);

  const spWhiteMesh = new THREE.Mesh(mergeClean(spireWhiteGeos), mats.whiteMarbleMat);
  spWhiteMesh.castShadow = true;
  spWhiteMesh.receiveShadow = true;
  const spNavyMesh = new THREE.Mesh(mergeClean(spireNavyGeos), mats.navyStoneMat);
  spNavyMesh.castShadow = true;
  spNavyMesh.receiveShadow = true;
  spiresGroup.add(spWhiteMesh, spNavyMesh);

  // Carved Minimalist Gothic Portal Doors (recessed navy blind-arch tracery panels + silver moldings, NOT cage bars!)
  function buildDoorLeaf(side) {
    const leafObsidian = [];
    const leafNavy = [];
    const leafSilver = [];
    const offsetX = side < 0 ? DOOR_HALF_W * 0.5 : -DOOR_HALF_W * 0.5;

    // Solid sculpted oak/obsidian door slab
    const slab = new THREE.BoxGeometry(DOOR_HALF_W - 0.02, DOOR_H, 0.24);
    xform(slab, [offsetX, DOOR_H * 0.5, 0]);
    applyWorldPlanarUVs(slab, 0.45, 0.45);
    leafObsidian.push(slab);

    // Outer raised carved border frame + middle mullion
    const outerFrameL = new THREE.BoxGeometry(0.14, DOOR_H - 0.16, 0.30);
    xform(outerFrameL, [offsetX - 0.72, DOOR_H * 0.5, 0]);
    const outerFrameR = new THREE.BoxGeometry(0.14, DOOR_H - 0.16, 0.30);
    xform(outerFrameR, [offsetX + 0.72, DOOR_H * 0.5, 0]);
    const midRail = new THREE.BoxGeometry(DOOR_HALF_W - 0.16, 0.18, 0.30);
    xform(midRail, [offsetX, 2.45, 0]);
    const topRail = new THREE.BoxGeometry(DOOR_HALF_W - 0.16, 0.22, 0.30);
    xform(topRail, [offsetX, DOOR_H - 0.15, 0]);
    leafObsidian.push(outerFrameL, outerFrameR, midRail, topRail);

    // Twin recessed Prussian-navy Gothic pointed tracery panels per leaf
    for (const px of [-0.36, 0.36]) {
      const upperPanel = new THREE.BoxGeometry(0.56, 2.35, 0.27);
      xform(upperPanel, [offsetX + px, 3.85, 0]);
      leafNavy.push(upperPanel);

      const lowerPanel = new THREE.BoxGeometry(0.56, 1.85, 0.27);
      xform(lowerPanel, [offsetX + px, 1.25, 0]);
      leafNavy.push(lowerPanel);

      // Pointed Gothic arch crown inside each upper panel
      const archL = new THREE.BoxGeometry(0.32, 0.05, 0.31);
      xform(archL, [offsetX + px - 0.11, 4.92, 0], [0, 0, 0.65]);
      const archR = new THREE.BoxGeometry(0.32, 0.05, 0.31);
      xform(archR, [offsetX + px + 0.11, 4.92, 0], [0, 0, -0.65]);
      leafSilver.push(archL, archR);
    }

    // Crisp silver door pull ring & escutcheon plate
    const plate = new THREE.BoxGeometry(0.18, 0.42, 0.31);
    xform(plate, [offsetX + (side < 0 ? 0.54 : -0.54), 2.15, 0]);
    leafSilver.push(plate);

    const handle = new THREE.TorusGeometry(0.14, 0.032, 8, 20);
    xform(handle, [offsetX + (side < 0 ? 0.54 : -0.54), 2.08, 0.18]);
    leafSilver.push(handle);

    const leafGroup = new THREE.Group();
    const obsMesh = new THREE.Mesh(mergeClean(leafObsidian), mats.doorWoodMat);
    obsMesh.castShadow = true;
    obsMesh.receiveShadow = true;
    const navyMesh = new THREE.Mesh(mergeClean(leafNavy), mats.doorWoodMat);
    navyMesh.receiveShadow = true;
    const silverMesh = new THREE.Mesh(mergeClean(leafSilver), mats.silverTrimMat);
    leafGroup.add(obsMesh, navyMesh, silverMesh);
    return leafGroup;
  }

  hingeLeft.position.set(-DOOR_HALF_W, 0, FACADE_Z + 0.05);
  hingeRight.position.set(DOOR_HALF_W, 0, FACADE_Z + 0.05);
  hingeLeft.add(buildDoorLeaf(-1));
  hingeRight.add(buildDoorLeaf(1));

  // Soft floor-hugging threshold light carpet + subtle door-crack rim (zero horizontal lintel smears!)
  const seamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uGlow: { value: 0.0 },
      uColor: { value: new THREE.Color('#dceaff') },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform float uGlow;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float xFade = pow(sin(vUv.x * 3.1415926), 2.2);
        float yFade = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.15, vUv.y);
        gl_FragColor = vec4(uColor, xFade * yFade * uGlow);
      }
    `,
  });
  const floorSpillMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 5.2), seamMat);
  floorSpillMesh.rotation.x = -Math.PI / 2;
  floorSpillMesh.position.set(0, 0.06, FACADE_Z + 1.6);
  group.add(floorSpillMesh);

  // Subtle slanting silver-ice doorway threshold rays spilling outward when portals swing wide
  const portalRayLeft = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 5.8), seamMat);
  portalRayLeft.position.set(-0.65, 2.2, FACADE_Z + 1.1);
  portalRayLeft.rotation.set(-0.58, 0.16, -0.14);
  const portalRayRight = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 5.8), seamMat);
  portalRayRight.position.set(0.65, 2.2, FACADE_Z + 1.1);
  portalRayRight.rotation.set(-0.58, -0.16, 0.14);
  group.add(portalRayLeft, portalRayRight);

  function setDoorOpen(t) {
    const doorProgress = THREE.MathUtils.clamp(t, 0, 1);
    const swing = smooth01(0.04, 1.0, doorProgress) * THREE.MathUtils.degToRad(78);
    hingeLeft.rotation.y = swing;
    hingeRight.rotation.y = -swing;
    const flare = Math.sin(Math.min(1, doorProgress * 1.15) * Math.PI * 0.85);
    seamMat.uniforms.uGlow.value = flare * 0.42;
  }

  function setBuildProgress(p) {
    const pFac = smooth01(0.04, 0.36, p);
    const pSpire = smooth01(0.24, 0.64, p);
    const pDoors = smooth01(0.08, 0.38, p);

    facadeGroup.position.y = (1 - pFac) * -1.4;
    facadeGroup.visible = pFac > 0.02;

    towerBaseGroup.position.y = (1 - pFac) * -1.4;
    towerBaseGroup.visible = pFac > 0.02;

    // Telescope belfry & spires directly upward from tower belt (y = 11.45) with ZERO air gap!
    const towerYOff = (1 - pFac) * -1.4;
    const spireSY = THREE.MathUtils.lerp(0.08, 1.0, pSpire);
    spiresGroup.scale.set(1, spireSY, 1);
    spiresGroup.position.y = towerYOff + 11.45 * (1 - spireSY);
    spiresGroup.visible = pSpire > 0.02;

    hingeLeft.position.y = (1 - pDoors) * -1.2;
    hingeRight.position.y = (1 - pDoors) * -1.2;
  }

  function update() {}

  function dispose() {
    seamMat.dispose();
  }

  return { group, setBuildProgress, setDoorOpen, update, dispose };
}
