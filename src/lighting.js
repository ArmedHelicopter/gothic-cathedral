import * as THREE from 'three';

/**
 * Independent Component: Nocturnal Deep-Navy Sanctuary Lighting & Warm-Gold Sovereign Spotlight
 * - Exterior morning sunlight streams exclusively through Deep-Navy stained glass -> cold volumetric God Rays
 * - Central Sovereign Masterpiece bathes in an isolated Warm-Ivory/Pale-Gold beam creating monarchial chiaroscuro
 * - Split async `buildEnvironment()` + `buildLightsAndRays()` for genuine loading progress
 */
export function createLightingComponent(scene, renderer, mats) {
  const group = new THREE.Group();
  group.name = 'lighting';

  scene.background = new THREE.Color('#040917');
  const BASE_FOG_DENSITY = 0.0078;
  scene.fog = new THREE.FogExp2('#061028', BASE_FOG_DENSITY);

  let envRT = null;
  let keyLight = null;
  let hemiLight = null;
  let sovereignSpot = null;
  let sovereignWarmFill = null;
  let sovereignConeMat = null;
  let beamMat = null;
  let navyDust = null;
  let goldDust = null;
  const vaultBounceLights = [];
  const navyDustBase = [];
  const goldDustBase = [];
  const beamMeshes = [];

  function buildEnvironment() {
    const pmremGen = new THREE.PMREMGenerator(renderer);
    pmremGen.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    const envMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexShader: `
        varying vec3 vDir;
        void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 col = mix(vec3(0.04, 0.09, 0.22), vec3(0.11, 0.24, 0.52), smoothstep(0.12, 0.65, h));
          col = mix(col, vec3(0.22, 0.44, 0.82), smoothstep(0.65, 0.96, h));
          vec3 eastWin = normalize(vec3(0.88, 0.36, 0.12));
          float ew = max(0.0001, dot(d, eastWin));
          col += vec3(0.45, 0.72, 1.0) * pow(ew, 10.0) * 1.15;
          vec3 spotDir = normalize(vec3(0.0, 0.85, -0.52));
          float sw = max(0.0001, dot(d, spotDir));
          col += vec3(1.0, 0.90, 0.72) * pow(sw, 24.0) * 1.15;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const envSphere = new THREE.Mesh(new THREE.SphereGeometry(16, 20, 14), envMat);
    envScene.add(envSphere);
    envRT = pmremGen.fromScene(envScene, 0.04);
    envSphere.geometry.dispose();
    envMat.dispose();
    pmremGen.dispose();

    scene.environment = envRT.texture;
    scene.environmentIntensity = 0.58;
  }

  function buildLightsAndRays() {
    // 1. Morning Sunlight Filtered Strictly Through Deep-Navy Stained Glass (Pierces East Lancets!)
    keyLight = new THREE.DirectionalLight('#3578f6', 3.05);
    keyLight.position.set(24.0, 13.6, 4.5);
    keyLight.target.position.set(-4.0, 1.5, -2.0);
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
    group.add(keyLight, keyLight.target);

    // Sculptural cold deep-navy indirect vault bounce so EVERY stone arch, wall ashlar, and ceiling web reads as 3D stone!
    hemiLight = new THREE.HemisphereLight('#2860c8', '#09142c', 0.82);
    group.add(hemiLight);

    for (const [lx, ly, lz, inten, dist] of [
      [0.0, 17.5, 20.0, 22.0, 32],
      [0.0, 17.8, 6.0, 18.0, 34],
      [0.0, 17.8, -8.0, 18.0, 34],
      [0.0, 15.0, -21.0, 14.0, 24],
    ]) {
      const vl = new THREE.PointLight('#2b66df', inten, dist, 1.12);
      vl.position.set(lx, ly, lz);
      vl.userData.baseIntensity = inten;
      group.add(vl);
      vaultBounceLights.push(vl);
    }

    // Subtle museum vitrine & under-gallery aisle bounce illuminating pedestals & 2F marble fascia soffit
    for (const pSide of [-1, 1]) {
      for (const pz of [2.0, -10.0]) {
        const vitrineWash = new THREE.PointLight('#6aa4ff', 5.4, 16.0, 1.35);
        vitrineWash.position.set(pSide * 4.0, 4.4, pz);
        vitrineWash.userData.baseIntensity = 5.4;
        group.add(vitrineWash);
        vaultBounceLights.push(vitrineWash);
      }
      const aisleWash = new THREE.PointLight('#3b78f0', 8.5, 22.0, 1.15);
      aisleWash.position.set(pSide * 11.2, 5.2, -3.5);
      aisleWash.userData.baseIntensity = 8.5;
      group.add(aisleWash);
      vaultBounceLights.push(aisleWash);
    }

    // 2. Sovereign Masterpiece Dedicated Warm-Ivory / Pale-Gold Sacred Spotlight (Vault Oculus -> Painting)
    sovereignSpot = new THREE.SpotLight('#fff0cc', 175.0, 38.0, 0.21, 0.56, 1.12);
    sovereignSpot.position.set(0.0, 23.0, -17.2);
    sovereignSpot.target.position.set(0.0, 4.45, -20.5);
    sovereignSpot.castShadow = true;
    sovereignSpot.shadow.mapSize.set(1024, 1024);
    sovereignSpot.shadow.camera.near = 4;
    sovereignSpot.shadow.camera.far = 36;
    sovereignSpot.shadow.bias = -0.0004;
    sovereignSpot.shadow.normalBias = 0.028;
    group.add(sovereignSpot, sovereignSpot.target);

    sovereignWarmFill = new THREE.PointLight('#ffe4b5', 17.5, 16.0, 1.25);
    sovereignWarmFill.position.set(0.0, 4.5, -16.8);
    group.add(sovereignWarmFill);

    // Volumetric Conical Pale-Gold Shaft Descending Exclusively from Vault Oculus Above Painting (zero spill)
    const beamTop = new THREE.Vector3(0.0, 23.0, -17.2);
    const beamBot = new THREE.Vector3(0.0, 1.4, -20.5);
    const beamVec = beamBot.clone().sub(beamTop);
    const beamLen = beamVec.length();
    const beamMid = beamTop.clone().addScaledVector(beamVec, 0.5);
    const coneGeo = new THREE.CylinderGeometry(0.58, 3.05, beamLen, 36, 1, true);

    sovereignConeMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color('#ffebc4') },
        uOpacity: { value: 0.11 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vViewDirW;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vNormalW = normalize(mat3(modelMatrix) * normal);
          vViewDirW = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vViewDirW;
        void main() {
          float vy = clamp(vUv.y, 0.0, 1.0);
          float vFade = smoothstep(0.0, 0.25, vy) * smoothstep(1.0, 0.52, vy);
          float ndotv = clamp(abs(dot(normalize(vNormalW), normalize(vViewDirW))), 0.0, 1.0);
          float rim = pow(ndotv, 1.85);
          float a = clamp(vFade * rim * uOpacity, 0.0, 1.0);
          gl_FragColor = vec4(uColor, a);
        }
      `,
    });
    const sovereignCone = new THREE.Mesh(coneGeo, sovereignConeMat);
    sovereignCone.position.copy(beamMid);
    sovereignCone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), beamVec.clone().normalize());
    sovereignCone.renderOrder = 3;
    group.add(sovereignCone);

    // 3. Cold Deep-Navy Volumetric God Rays Streaming from East Lancets Across Nave
    beamMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color('#2766e8') },
        uCoreColor: { value: new THREE.Color('#6ca8ff') },
        uOpacity: { value: 0.16 },
        uCamPos: { value: new THREE.Vector3() },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vNormalW;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uCoreColor;
        uniform float uOpacity;
        uniform vec3 uCamPos;
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vNormalW;
        void main() {
          float ux = clamp(vUv.x, 0.0, 1.0);
          float uy = clamp(vUv.y, 0.0, 1.0);
          float s = max(0.0, sin(ux * 3.14159265));
          float xFade = s * s;
          float stria = 0.72 + 0.28 * sin(ux * 22.0);
          float yFade = smoothstep(0.0, 0.36, uy) * smoothstep(1.0, 0.10, uy);

          // Grazing-angle & near-camera fade so player walking inside rays never hits hard card seams!
          vec3 V = normalize(uCamPos - vWorldPos);
          float angFade = smoothstep(0.05, 0.38, abs(dot(normalize(vNormalW), V)));
          float distFade = smoothstep(1.8, 4.8, length(uCamPos - vWorldPos));

          vec3 col = mix(uColor, uCoreColor, xFade * stria * 0.55);
          float a = clamp(xFade * yFade * stria * angFade * distFade * uOpacity, 0.0, 1.0);
          gl_FragColor = vec4(col, a);
        }
      `,
    });

    const shaftGeo = new THREE.PlaneGeometry(1, 1);
    const shaftZs = [18.25, 10.75, 3.25, -4.25, -11.75];
    for (const sz of shaftZs) {
      for (const [rotY, offZ] of [[0.24, -0.5], [-0.28, 0.5]]) {
        const shaft = new THREE.Mesh(shaftGeo, beamMat);
        shaft.position.set(6.8, 7.6, sz + offZ);
        shaft.rotation.set(0.06, rotY, 0.76);
        shaft.scale.set(3.2, 16.5, 1);
        shaft.renderOrder = 3;
        group.add(shaft);
        beamMeshes.push(shaft);
      }
    }

    // 4. Dual-Color Suspended Dust Motes (Cold Sapphire in Nave vs Pale Gold in Sovereign Light)
    function makeDustSystem(count, colorHex, size, opacity, seedVal, posFn) {
      const base = [];
      const arr = new Float32Array(count * 3);
      let s = seedVal;
      const rnd = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };
      for (let i = 0; i < count; i++) {
        const [x, y, z] = posFn(rnd);
        base.push({ bx: x, by: y, bz: z, ph: rnd() * Math.PI * 2, spd: 0.3 + rnd() * 0.5 });
        arr[i * 3] = x;
        arr[i * 3 + 1] = y;
        arr[i * 3 + 2] = z;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      const mat = new THREE.PointsMaterial({
        map: mats.bokehMap,
        color: new THREE.Color(colorHex),
        size,
        sizeAttenuation: true,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const pts = new THREE.Points(geo, mat);
      group.add(pts);
      return { pts, base };
    }

    const navyRes = makeDustSystem(90, '#629eff', 0.24, 0.30, 42, (rnd) => [
      (rnd() - 0.5) * 18.0,
      1.2 + rnd() * 14.0,
      -18.0 + rnd() * 40.0,
    ]);
    navyDust = navyRes.pts;
    navyDustBase.push(...navyRes.base);

    const goldRes = makeDustSystem(42, '#fff0c8', 0.26, 0.42, 777, (rnd) => [
      (rnd() - 0.5) * 4.4,
      1.5 + rnd() * 14.0,
      -21.5 + rnd() * 5.2,
    ]);
    goldDust = goldRes.pts;
    goldDustBase.push(...goldRes.base);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
  }

  function bakeStaticShadows() {
    renderer.shadowMap.needsUpdate = true;
  }

  function setMaterializeProgress(m01) {
    const m = THREE.MathUtils.clamp(m01, 0, 1);
    if (keyLight) keyLight.intensity = 3.05 * m;
    if (hemiLight) hemiLight.intensity = 0.82 * m;
    vaultBounceLights.forEach((vl) => {
      vl.intensity = vl.userData.baseIntensity * m;
    });
    if (sovereignSpot) sovereignSpot.intensity = 175.0 * m;
    if (sovereignWarmFill) sovereignWarmFill.intensity = 17.5 * m;
    if (sovereignConeMat) sovereignConeMat.uniforms.uOpacity.value = 0.12 * m;
    if (beamMat) beamMat.uniforms.uOpacity.value = 0.16 * m;
  }

  function update(dt, elapsed, camera) {
    if (beamMat && camera) {
      beamMat.uniforms.uCamPos.value.copy(camera.position);
    }
    for (const [pts, base] of [
      [navyDust, navyDustBase],
      [goldDust, goldDustBase],
    ]) {
      if (!pts) continue;
      const attr = pts.geometry.attributes.position;
      for (let i = 0; i < base.length; i++) {
        const b = base[i];
        attr.setXYZ(
          i,
          b.bx + Math.sin(elapsed * b.spd + b.ph) * 0.20,
          b.by + Math.cos(elapsed * (b.spd * 0.8) + b.ph) * 0.16,
          b.bz + Math.sin(elapsed * 0.35 + b.ph * 1.3) * 0.16
        );
      }
      attr.needsUpdate = true;
    }
  }

  function dispose() {
    if (envRT) envRT.dispose();
    if (beamMat) beamMat.dispose();
    if (sovereignConeMat) sovereignConeMat.dispose();
  }

  return {
    group,
    BASE_FOG_DENSITY,
    buildEnvironment,
    buildLightsAndRays,
    bakeStaticShadows,
    setMaterializeProgress,
    update,
    dispose,
  };
}
