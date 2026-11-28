import * as THREE from 'three';

function smooth01(a, b, v) {
  const t = THREE.MathUtils.clamp((v - a) / Math.max(0.0001, b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

export function createLightingComponent(scene, renderer, mats) {
  const group = new THREE.Group();
  group.name = 'lighting';
  const BASE_FOG_DENSITY = 0.0075;
  scene.background = new THREE.Color('#0A1230');
  scene.fog = new THREE.FogExp2('#0B1430', BASE_FOG_DENSITY);

  let keyLight;
  let hemiLight;
  let paintingSpot;
  let paintingFill;
  let paintingCone;
  let beamMat;
  let navyDust;
  let goldDust;
  let components = {};
  let materializeProgress = 1;
  const chandelierLights = [];
  const state = {
    ambient: 1,
    lamps: [1, 1, 1, 1],
    corona: 1,
    pools: 1,
    painting: 1,
  };

  function buildEnvironment() {
    const envScene = new THREE.Scene();
    const envMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uHorizon: { value: new THREE.Color('#1A2A5A') },
        uZenith: { value: new THREE.Color('#0A1230') },
        uWarm: { value: new THREE.Color('#C9A961') },
      },
      vertexShader: `
        varying vec3 vDirection;
        void main() {
          vDirection = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vDirection;
        uniform vec3 uHorizon;
        uniform vec3 uZenith;
        uniform vec3 uWarm;
        void main() {
          float h = smoothstep(-0.15, 0.85, vDirection.y);
          vec3 color = mix(uHorizon, uZenith, h);
          float warm = pow(max(0.0001, dot(normalize(vDirection), normalize(vec3(-0.3, 0.25, -0.8)))), 18.0);
          color += uWarm * warm * 0.12;
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
    envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 40, 24), envMat));
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(envScene, 0.06, 0.1, 100);
    scene.environment = envRT.texture;
    scene.environmentIntensity = 0.58;
    envMat.dispose();
    pmrem.dispose();
  }

  function makeDustSystem(count, color, size, opacity, seed, positionFn) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const p = positionFn(i);
      positions[i * 3] = p[0];
      positions[i * 3 + 1] = p[1];
      positions[i * 3 + 2] = p[2];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color,
      size,
      map: mats.bokehMap,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    points.userData.basePositions = positions.slice();
    points.userData.seed = seed;
    points.renderOrder = 3;
    return points;
  }

  function addBeam(start, end, width) {
    const direction = end.clone().sub(start);
    const length = direction.length();
    const geo = new THREE.PlaneGeometry(width, length);
    const mesh = new THREE.Mesh(geo, beamMat);
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    mesh.renderOrder = 3;
    group.add(mesh);
  }

  function buildLightsAndRays() {
    keyLight = new THREE.DirectionalLight('#8FB6E8', 1.85);
    keyLight.position.set(24, 18.5, 4.5);
    keyLight.target.position.set(-4, 2.5, -2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 76;
    keyLight.shadow.camera.left = -32;
    keyLight.shadow.camera.right = 32;
    keyLight.shadow.camera.top = 28;
    keyLight.shadow.camera.bottom = -28;
    keyLight.shadow.bias = -0.00045;
    keyLight.shadow.normalBias = 0.036;
    keyLight.shadow.radius = 2.2;
    keyLight.userData.baseIntensity = 1.85;
    group.add(keyLight, keyLight.target);

    hemiLight = new THREE.HemisphereLight('#536FA8', '#0B1430', 0.88);
    hemiLight.userData.baseIntensity = 0.88;
    group.add(hemiLight);

    paintingSpot = new THREE.SpotLight('#FFE0A3', 165, 38, 0.21, 0.56, 1.12);
    paintingSpot.position.set(0, 23, -17.2);
    paintingSpot.target.position.set(0, 4.45, -20.5);
    paintingSpot.castShadow = true;
    paintingSpot.shadow.mapSize.set(1024, 1024);
    paintingSpot.shadow.bias = -0.0004;
    paintingSpot.shadow.normalBias = 0.025;
    paintingSpot.userData.baseIntensity = 165;
    group.add(paintingSpot, paintingSpot.target);

    paintingFill = new THREE.PointLight('#FFE4B5', 15, 16, 1.25);
    paintingFill.position.set(0, 4.5, -16.8);
    paintingFill.userData.baseIntensity = 15;
    group.add(paintingFill);

    const chandelierPositions = [
      [0, 8.35, 10.75],
      [0, 8.35, 3.25],
      [0, 8.35, -4.25],
      [0, 8.35, -11.75],
    ];
    chandelierPositions.forEach((position) => {
      const light = new THREE.PointLight('#FFC98A', 52, 12, 2);
      light.position.set(...position);
      light.castShadow = false;
      light.userData.baseIntensity = 52;
      chandelierLights.push(light);
      group.add(light);
    });

    const coneLength = Math.hypot(23 - 1.4, 20.5 - 17.2);
    const coneMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color('#FFEBC4') },
        uOpacity: { value: 0.11 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 uColor;
        uniform float uOpacity;
        void main() {
          float edge = pow(max(0.0001, sin(vUv.x * 3.14159265)), 0.65);
          float fade = smoothstep(0.0, 0.15, vUv.y) * (1.0 - smoothstep(0.82, 1.0, vUv.y));
          gl_FragColor = vec4(uColor, uOpacity * edge * fade);
        }
      `,
    });
    paintingCone = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 3.05, coneLength, 36, 1, true), coneMat);
    paintingCone.position.set(0, (23 + 1.4) * 0.5, (-17.2 - 20.5) * 0.5);
    paintingCone.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 23 - 1.4, -17.2 + 20.5).normalize()
    );
    paintingCone.renderOrder = 3;
    group.add(paintingCone);

    beamMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color('#416EAD') },
        uCoreColor: { value: new THREE.Color('#9BBCE5') },
        uOpacity: { value: 0.13 },
        uCamPos: { value: new THREE.Vector3() },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;
        void main() {
          vUv = uv;
          vec4 world = modelMatrix * vec4(position, 1.0);
          vWorldPos = world.xyz;
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;
        uniform vec3 uColor;
        uniform vec3 uCoreColor;
        uniform float uOpacity;
        uniform vec3 uCamPos;
        void main() {
          float across = pow(max(0.0001, sin(vUv.x * 3.14159265)), 1.6);
          float along = smoothstep(0.0, 0.16, vUv.y) * (1.0 - smoothstep(0.76, 1.0, vUv.y));
          vec3 viewDir = normalize(uCamPos - vWorldPos);
          float facing = abs(dot(viewDir, normalize(vWorldNormal)));
          float grazing = smoothstep(0.04, 0.38, facing);
          float dist = length(uCamPos - vWorldPos);
          float distanceFade = 1.0 - smoothstep(28.0, 58.0, dist);
          vec3 color = mix(uColor, uCoreColor, across * 0.55);
          gl_FragColor = vec4(color, uOpacity * across * along * grazing * distanceFade);
        }
      `,
    });
    for (const side of [-1, 1]) {
      for (const z of [18.25, 10.75, 3.25, -4.25, -11.75, -19.0]) {
        addBeam(
          new THREE.Vector3(side * 13.0, 14.15, z),
          new THREE.Vector3(side * 1.3, 0.55, z - 2.2),
          2.25
        );
      }
    }

    navyDust = makeDustSystem(72, '#91A9D4', 0.095, 0.32, 1.7, (i) => {
      const a = i * 2.39996;
      return [Math.sin(a) * (2 + (i % 7)), 1.2 + (i % 13) * 1.1, 22 - (i % 47)];
    });
    goldDust = makeDustSystem(30, '#FFE2AC', 0.085, 0.42, 4.1, (i) => {
      const a = i * 2.39996;
      return [Math.sin(a) * 2.3, 2.2 + (i % 9) * 0.62, -18.5 + Math.cos(a) * 2.0];
    });
    group.add(navyDust, goldDust);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    applyState();
  }

  function bindComponents(next) {
    components = next || {};
    applyState();
  }

  function applyState() {
    if (!keyLight) return;
    const materialize = 0.35 + 0.65 * materializeProgress;
    keyLight.intensity = keyLight.userData.baseIntensity * materialize * state.ambient;
    hemiLight.intensity = hemiLight.userData.baseIntensity * materialize * state.ambient;
    paintingSpot.intensity = paintingSpot.userData.baseIntensity * materializeProgress * state.painting;
    paintingFill.intensity = paintingFill.userData.baseIntensity * materializeProgress * state.painting;
    chandelierLights.forEach((light, index) => {
      light.intensity = light.userData.baseIntensity * materializeProgress * (state.lamps[index] ?? 0);
    });
    if (paintingCone) paintingCone.material.uniforms.uOpacity.value = 0.11 * state.painting;
    if (beamMat) beamMat.uniforms.uOpacity.value = 0.13 * state.ambient;

    if (components.chandeliers) {
      components.chandeliers.setIllumination(state.lamps, state.corona);
    }
    if (components.pedestals) {
      components.pedestals.setIllumination(state.pools);
    }
    if (components.gothicShell) {
      const bayProgress = Array.from({ length: 8 }, () => Math.max(0.04, state.ambient * 0.42));
      bayProgress[2] = Math.max(state.ambient * 0.10, state.lamps[0]);
      bayProgress[3] = Math.max(state.ambient * 0.10, state.lamps[1]);
      bayProgress[4] = Math.max(state.ambient * 0.10, state.lamps[2]);
      bayProgress[5] = Math.max(state.ambient * 0.10, state.lamps[3]);
      bayProgress[6] = Math.max(state.ambient * 0.10, state.corona);
      for (let bay = 0; bay < 8; bay += 1) {
        components.gothicShell.setBayIllumination(bay, bayProgress[bay] * materializeProgress);
      }
    }
  }

  function setMaterializeProgress(m) {
    materializeProgress = THREE.MathUtils.clamp(m, 0, 1);
    applyState();
  }

  function setIntroVisuals(next) {
    if (next.ambient !== undefined) state.ambient = THREE.MathUtils.clamp(next.ambient, 0, 1);
    if (next.lamps) {
      state.lamps = [0, 1, 2, 3].map((index) => THREE.MathUtils.clamp(next.lamps[index] ?? 0, 0, 1));
    }
    if (next.corona !== undefined) state.corona = THREE.MathUtils.clamp(next.corona, 0, 1);
    if (next.pools !== undefined) state.pools = THREE.MathUtils.clamp(next.pools, 0, 1);
    if (next.painting !== undefined) state.painting = THREE.MathUtils.clamp(next.painting, 0, 1);
    applyState();
  }

  function setIllumination(t, perLampProgress = []) {
    const progress = THREE.MathUtils.clamp(t, 0, 1);
    const lamps = perLampProgress.length
      ? perLampProgress
      : [0, 1, 2, 3].map((index) => smooth01(index * 0.14, index * 0.14 + 0.40, progress));
    setIntroVisuals({
      ambient: 0.15 + 0.85 * smooth01(0, 0.68, progress),
      lamps,
      corona: smooth01(0.70, 0.94, progress),
      pools: smooth01(0.28, 0.82, progress),
      painting: smooth01(0.82, 1.0, progress),
    });
  }

  function bakeStaticShadows() {
    renderer.shadowMap.needsUpdate = true;
  }

  function driftDust(points, elapsed, speed) {
    if (!points) return;
    const attr = points.geometry.attributes.position;
    const base = points.userData.basePositions;
    for (let i = 0; i < attr.count; i += 1) {
      attr.array[i * 3] = base[i * 3] + Math.sin(elapsed * speed + i * 1.7) * 0.08;
      attr.array[i * 3 + 1] = base[i * 3 + 1] + Math.sin(elapsed * speed * 0.7 + i) * 0.12;
    }
    attr.needsUpdate = true;
  }

  function update(dt, elapsed, camera) {
    if (beamMat) beamMat.uniforms.uCamPos.value.copy(camera.position);
    driftDust(navyDust, elapsed, 0.18);
    driftDust(goldDust, elapsed, 0.24);
  }

  function dispose() {}

  return {
    group,
    BASE_FOG_DENSITY,
    buildEnvironment,
    buildLightsAndRays,
    bindComponents,
    bakeStaticShadows,
    setMaterializeProgress,
    setIntroVisuals,
    setIllumination,
    update,
    dispose,
  };
}
