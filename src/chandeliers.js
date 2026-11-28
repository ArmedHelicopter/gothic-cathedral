import * as THREE from 'three';
import { buildOrderedWireframe, mergeClean, xform } from './geo.js';

const FIXTURES = [
  { z: 10.75, y: 8.0, radius: 1.25, arms: 10 },
  { z: 3.25, y: 8.0, radius: 1.25, arms: 10 },
  { z: -4.25, y: 8.0, radius: 1.25, arms: 10 },
  { z: -11.75, y: 8.0, radius: 1.25, arms: 10 },
  { z: -19.0, y: 10.0, radius: 0.82, arms: 8 },
];

export function createChandeliersComponent(mats) {
  const group = new THREE.Group();
  group.name = 'chandeliers';
  const fixtures = [];
  const wireSourceGeos = [];
  const flameGeo = new THREE.PlaneGeometry(0.16, 0.30);
  flameGeo.translate(0, 0.15, 0);

  FIXTURES.forEach((config, fixtureIndex) => {
    const brassGeos = [];
    const goldGeos = [];
    const candleGeos = [];
    const flamePositions = [];
    const scale = config.radius / 1.25;
    const lowerRadius = config.radius * 0.68;
    const tiers = [
      { radius: config.radius, y: config.y, arms: config.arms },
      { radius: lowerRadius, y: config.y - 0.62 * scale, arms: Math.max(8, config.arms - 2) },
    ];

    tiers.forEach((tier, tierIndex) => {
      const ring = new THREE.TorusGeometry(tier.radius, 0.055 * scale, 8, 64);
      xform(ring, [0, tier.y, config.z], [Math.PI / 2, 0, 0]);
      brassGeos.push(ring);
      const goldRing = new THREE.TorusGeometry(tier.radius, 0.018 * scale, 6, 64);
      xform(goldRing, [0, tier.y + 0.055 * scale, config.z], [Math.PI / 2, 0, 0]);
      goldGeos.push(goldRing);

      for (let arm = 0; arm < tier.arms; arm += 1) {
        const a = (arm / tier.arms) * Math.PI * 2 + tierIndex * 0.16;
        const radial = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
        const start = new THREE.Vector3(0, tier.y - 0.22 * scale, config.z).addScaledVector(radial, 0.20 * scale);
        const end = new THREE.Vector3(0, tier.y + 0.02, config.z).addScaledVector(radial, tier.radius);
        const control = start.clone().lerp(end, 0.55);
        control.y -= 0.16 * scale;
        const curve = new THREE.QuadraticBezierCurve3(start, control, end);
        brassGeos.push(new THREE.TubeGeometry(curve, 10, 0.028 * scale, 6, false));
        const cup = new THREE.CylinderGeometry(0.085 * scale, 0.045 * scale, 0.08 * scale, 10);
        xform(cup, [end.x, tier.y + 0.075 * scale, end.z]);
        goldGeos.push(cup);
        const candle = new THREE.CylinderGeometry(0.033 * scale, 0.038 * scale, 0.30 * scale, 8);
        xform(candle, [end.x, tier.y + 0.25 * scale, end.z]);
        candleGeos.push(candle);
        flamePositions.push(new THREE.Vector3(end.x, tier.y + 0.40 * scale, end.z));
      }
    });

    const stem = new THREE.CylinderGeometry(0.055 * scale, 0.075 * scale, 1.30 * scale, 10);
    xform(stem, [0, config.y - 0.30 * scale, config.z]);
    brassGeos.push(stem);
    const lowerDrop = new THREE.SphereGeometry(0.15 * scale, 12, 8);
    xform(lowerDrop, [0, config.y - 1.02 * scale, config.z], [0, 0, 0], [1, 1.5, 1]);
    goldGeos.push(lowerDrop);
    for (const offset of [-0.72, -0.18, 0.28]) {
      const knop = new THREE.SphereGeometry(0.11 * scale, 10, 8);
      xform(knop, [0, config.y + offset * scale, config.z], [0, 0, 0], [1, 0.72, 1]);
      brassGeos.push(knop);
    }

    const chainBottom = config.y + 0.38 * scale;
    const chainTop = 24.35;
    const links = Math.ceil((chainTop - chainBottom) / 0.58);
    for (let link = 0; link < links; link += 1) {
      const t = links <= 1 ? 0 : link / (links - 1);
      const geo = new THREE.TorusGeometry(0.082, 0.012, 4, 8);
      xform(
        geo,
        [0, THREE.MathUtils.lerp(chainBottom, chainTop, t), config.z],
        [0, link % 2 ? Math.PI / 2 : 0, 0],
        [1, 1.35, 1]
      );
      brassGeos.push(geo);
    }

    const coronaMat = mats.brassMat.clone();
    coronaMat.emissive = new THREE.Color('#FFC98A');
    coronaMat.emissiveIntensity = 0.12;
    const brassMesh = new THREE.Mesh(mergeClean(brassGeos), coronaMat);
    brassMesh.name = `chandelier-brass-${fixtureIndex}`;
    const goldMesh = new THREE.Mesh(mergeClean(goldGeos), mats.paleGoldMat);
    const candleMesh = new THREE.Mesh(mergeClean(candleGeos), mats.brightAlabasterMat);
    const flameMat = mats.candleFlameMat.clone();
    const flames = new THREE.InstancedMesh(flameGeo, flameMat, flamePositions.length);
    flames.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    flames.frustumCulled = false;
    flames.renderOrder = 5;
    group.add(brassMesh, goldMesh, candleMesh, flames);
    fixtures.push({ config, coronaMat, flameMat, flames, flamePositions });
    wireSourceGeos.push(brassMesh.geometry.clone(), goldMesh.geometry.clone(), candleMesh.geometry.clone());
    flamePositions.forEach((position) => {
      const geo = flameGeo.clone();
      geo.translate(position.x, position.y, position.z);
      wireSourceGeos.push(geo);
    });
  });

  const wireframeMesh = buildOrderedWireframe(mergeClean(wireSourceGeos), 28, 6.5, 24.6, 0.52, 0.96);
  wireframeMesh.name = 'chandeliersWireframe';
  const matrix = new THREE.Matrix4();
  const scale = new THREE.Vector3(1, 1, 1);

  function setIllumination(perLampProgress = [1, 1, 1, 1], coronaProgress = 1) {
    fixtures.forEach((fixture, index) => {
      const progress = THREE.MathUtils.clamp(index < 4 ? (perLampProgress[index] ?? 0) : coronaProgress, 0, 1);
      fixture.flameMat.uniforms.uIntensity.value = progress;
      fixture.coronaMat.emissiveIntensity = 0.02 + progress * 0.34;
      fixture.flames.visible = progress > 0.002;
    });
  }

  function update(dt, elapsed, camera) {
    fixtures.forEach((fixture) => {
      fixture.flameMat.uniforms.uTime.value = elapsed;
      if (!fixture.flames.visible) return;
      fixture.flamePositions.forEach((position, index) => {
        matrix.compose(position, camera.quaternion, scale);
        fixture.flames.setMatrixAt(index, matrix);
      });
      fixture.flames.instanceMatrix.needsUpdate = true;
    });
  }

  function dispose() {
    flameGeo.dispose();
    fixtures.forEach((fixture) => {
      fixture.coronaMat.dispose();
      fixture.flameMat.dispose();
    });
  }

  return {
    group,
    wireframeMesh,
    lightPositions: FIXTURES.slice(0, 4).map((fixture) => [0, fixture.y + 0.35, fixture.z]),
    setIllumination,
    update,
    dispose,
  };
}
