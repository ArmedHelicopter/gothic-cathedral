import * as THREE from 'three';

/**
 * Independent Component: Pure Clear Celestial Sky Dome (Sapphire -> Cerulean -> Porcelain Horizon),
 * NaN-Proof Soft Cerulean-Azure Volumetric Shafts, Tranquil Interior Sanctuary Glow & Fine Silver Motes.
 */
export function createLightingComponent(scene, renderer, mats) {
  const group = new THREE.Group();
  group.name = 'lighting';

  // Clear luminous celestial PMREM reflection map (white/azure horizon + deep sapphire zenith)
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
        float h = d.y;
        vec3 col = mix(vec3(0.46, 0.64, 0.88), vec3(0.84, 0.91, 0.99), smoothstep(-0.25, 0.04, h));
        col = mix(col, vec3(0.18, 0.42, 0.78), smoothstep(0.04, 0.38, h));
        col = mix(col, vec3(0.06, 0.16, 0.40), smoothstep(0.38, 0.92, h));
        vec3 sunDir = normalize(vec3(0.45, 0.56, -0.58));
        float sd = max(0.0001, dot(d, sunDir));
        col += vec3(0.92, 0.96, 1.0) * (pow(sd, 14.0) * 0.45 + pow(sd, 96.0) * 1.15);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const envSphere = new THREE.Mesh(new THREE.SphereGeometry(16, 20, 14), envMat);
  envScene.add(envSphere);
  const envRT = pmremGen.fromScene(envScene, 0.035);
  envSphere.geometry.dispose();
  envMat.dispose();
  pmremGen.dispose();
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.76;

  // Clear luminous twilight-azure celestial sky dome (strict Navy & Porcelain-White aesthetic)
  const skyUniforms = {
    uZenith: { value: new THREE.Color('#0c2252') },
    uMid: { value: new THREE.Color('#2d62bd') },
    uHorizon: { value: new THREE.Color('#dceafc') },
    uGlow: { value: new THREE.Color('#eff6ff') },
    uLinearOutput: { value: 1.0 },
  };
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(180, 28, 18),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: skyUniforms,
      vertexShader: `
        varying vec3 vWp;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWp = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 uZenith;
        uniform vec3 uMid;
        uniform vec3 uHorizon;
        uniform vec3 uGlow;
        uniform float uLinearOutput;
        varying vec3 vWp;
        void main() {
          vec3 d = normalize(vWp);
          float h = d.y;
          vec3 col = mix(vec3(0.76, 0.85, 0.96), uHorizon, smoothstep(-0.22, 0.02, h));
          col = mix(col, uMid, smoothstep(0.02, 0.34, h));
          col = mix(col, uZenith, smoothstep(0.34, 0.88, h));
          vec3 sunDir = normalize(vec3(0.45, 0.54, -0.58));
          float md = max(0.0001, dot(d, sunDir));
          col += uGlow * (pow(md, 10.0) * 0.16 + pow(md, 88.0) * 0.42);
          gl_FragColor = vec4(col, 1.0);
          if (uLinearOutput < 0.5) {
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        }
      `,
    })
  );
  scene.add(skyDome);

  // Airy sky-haze during distant assembly -> tranquil sacred azure haze inside sanctuary
  const EXTERIOR_FOG_COLOR = new THREE.Color('#dceafd');
  const INTERIOR_FOG_COLOR = new THREE.Color('#5a92ea');
  const BASE_FOG_DENSITY = 0.0052;
  scene.fog = new THREE.FogExp2('#dceafd', BASE_FOG_DENSITY);

  // Celestial Key Light casting crisp diagonal exterior courtyard & interior stained-glass shadows
  const keyLight = new THREE.DirectionalLight('#f2f7ff', 2.95);
  keyLight.position.set(24, 25, -5);
  keyLight.target.position.set(0, 1.2, 2);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 2;
  keyLight.shadow.camera.far = 92;
  keyLight.shadow.camera.left = -34;
  keyLight.shadow.camera.right = 34;
  keyLight.shadow.camera.top = 34;
  keyLight.shadow.camera.bottom = -36;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.032;
  keyLight.shadow.radius = 2.0;
  group.add(keyLight, keyLight.target);

  // Sacred Cerulean-Azure Sanctuary Fill Lights (calm cathedral blue luminosity inside, never dark mud!)
  const hemiLight = new THREE.HemisphereLight('#78b4ff', '#102654', 1.12);
  const rimLight = new THREE.DirectionalLight('#8ec0ff', 0.95);
  rimLight.position.set(-20, 15, -22);
  group.add(hemiLight, rimLight);

  // Soft overhead cerulean vault wash lights along nave spine
  for (const lz of [8.0, 0.0, -8.0]) {
    const azureFill = new THREE.PointLight('#5298ff', 6.8, 28, 1.15);
    azureFill.position.set(0.0, 9.6, lz);
    group.add(azureFill);
  }

  // Dedicated serene celestial spotlight illuminating veiled centerpiece & climbing carpet
  const sanctuarySpot = new THREE.SpotLight('#eef6ff', 36.0, 28.0, Math.PI * 0.28, 0.78, 1.2);
  sanctuarySpot.position.set(2.8, 12.2, -5.8);
  sanctuarySpot.target.position.set(0, 3.0, -12.3);
  group.add(sanctuarySpot, sanctuarySpot.target);

  // 100% NaN-Proof Soft Cerulean-Azure Volumetric Clerestory Light Shafts (NO unclamped pow(sin)!)
  const beamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color('#7db8ff') },
      uOpacity: { value: 0.13 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float ux = clamp(vUv.x, 0.0, 1.0);
        float uy = clamp(vUv.y, 0.0, 1.0);
        float s = max(0.0, sin(ux * 3.14159265));
        float xFade = s * s;
        float yFade = smoothstep(0.0, 0.34, uy) * smoothstep(1.0, 0.08, uy);
        gl_FragColor = vec4(uColor, clamp(xFade * yFade * uOpacity, 0.0, 1.0));
      }
    `,
  });

  const beamGeo = new THREE.PlaneGeometry(1, 1);
  const beamGroup = new THREE.Group();
  const beamSpecs = [
    { pos: [3.6, 4.4, 7.2], rot: [0.08, 0.30, 0.56], scale: [2.8, 10.4, 1] },
    { pos: [3.6, 4.4, 2.4], rot: [0.08, 0.30, 0.56], scale: [2.8, 10.4, 1] },
    { pos: [3.6, 4.4, -2.4], rot: [0.08, 0.30, 0.56], scale: [2.8, 10.4, 1] },
    { pos: [3.6, 4.4, -7.2], rot: [0.08, 0.30, 0.56], scale: [2.8, 10.4, 1] },
    { pos: [0.0, 5.8, -11.6], rot: [0.40, 0.0, 0.0], scale: [4.2, 10.2, 1] },
  ];
  beamSpecs.forEach((b) => {
    const m = new THREE.Mesh(beamGeo, beamMat);
    m.position.set(...b.pos);
    m.rotation.set(...b.rot);
    m.scale.set(...b.scale);
    beamGroup.add(m);
  });
  group.add(beamGroup);

  const dustCount = 64;
  const dustBase = [];
  const dustPositions = new Float32Array(dustCount * 3);
  let sSeed = 42;
  const rnd = () => {
    sSeed = (sSeed * 1664525 + 1013904223) >>> 0;
    return sSeed / 4294967296;
  };
  for (let i = 0; i < dustCount; i++) {
    const x = (rnd() - 0.5) * 9.8;
    const y = 1.4 + rnd() * 6.0;
    const z = -13.2 + rnd() * 25.0;
    dustBase.push({ bx: x, by: y, bz: z, ph: rnd() * Math.PI * 2, spd: 0.35 + rnd() * 0.55 });
    dustPositions[i * 3] = x;
    dustPositions[i * 3 + 1] = y;
    dustPositions[i * 3 + 2] = z;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustPointsMat = new THREE.PointsMaterial({
    map: mats.bokehMap,
    color: new THREE.Color('#c8e2ff'),
    size: 0.22,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.26,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const dustPoints = new THREE.Points(dustGeo, dustPointsMat);
  group.add(dustPoints);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;

  function bakeStaticShadows() {
    renderer.shadowMap.needsUpdate = true;
  }

  function setFogDensity(density, interiorBlend = 0.0) {
    scene.fog.density = density;
    scene.fog.color.copy(EXTERIOR_FOG_COLOR).lerp(INTERIOR_FOG_COLOR, THREE.MathUtils.clamp(interiorBlend, 0, 1));
  }

  function setBuildProgress(p) {
    const glow = THREE.MathUtils.clamp((p - 0.2) / 0.6, 0.25, 1.0);
    beamMat.uniforms.uOpacity.value = 0.13 * glow;
    sanctuarySpot.intensity = 36.0 * glow;
  }

  function setSkyLinearOutput(enabled) {
    skyUniforms.uLinearOutput.value = enabled ? 1.0 : 0.0;
  }

  function update(dt, elapsed) {
    const attr = dustGeo.attributes.position;
    for (let i = 0; i < dustCount; i++) {
      const b = dustBase[i];
      attr.setXYZ(
        i,
        b.bx + Math.sin(elapsed * b.spd + b.ph) * 0.18,
        b.by + Math.cos(elapsed * (b.spd * 0.8) + b.ph) * 0.14,
        b.bz + Math.sin(elapsed * 0.35 + b.ph * 1.3) * 0.14
      );
    }
    attr.needsUpdate = true;
  }

  function dispose() {
    envRT.dispose();
    beamMat.dispose();
    dustGeo.dispose();
    dustPointsMat.dispose();
  }

  return {
    group,
    BASE_FOG_DENSITY,
    bakeStaticShadows,
    setFogDensity,
    setBuildProgress,
    setSkyLinearOutput,
    update,
    dispose,
  };
}
