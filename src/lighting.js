import * as THREE from 'three';

/**
 * Independent Component: Celestial Moonlight (Exterior + Interior Clerestory Directional Shadows),
 * Layered Navy Atmospheric Mist, Soft Volumetric God-Rays & Silver Dust Bokeh.
 */
export function createLightingComponent(scene, renderer, mats) {
  const group = new THREE.Group();
  group.name = 'lighting';

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
        vec3 col = mix(vec3(0.03, 0.06, 0.14), vec3(0.11, 0.22, 0.46), smoothstep(-0.3, 0.45, h));
        col = mix(col, vec3(0.02, 0.04, 0.10), smoothstep(0.45, 0.95, h));
        vec3 sunDir = normalize(vec3(0.55, 0.62, 0.35));
        float sd = max(0.0, dot(d, sunDir));
        col += vec3(0.86, 0.92, 1.0) * (pow(sd, 14.0) * 0.5 + pow(sd, 96.0) * 1.4);
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
  scene.environmentIntensity = 0.62;

  const skyUniforms = {
    uZenith: { value: new THREE.Color('#040814') },
    uMid: { value: new THREE.Color('#0c1b3b') },
    uHorizon: { value: new THREE.Color('#1c3a74') },
    uGlow: { value: new THREE.Color('#a4c6ff') },
    uLinearOutput: { value: 1.0 },
  };
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(160, 28, 18),
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
          vec3 col = mix(uZenith, uHorizon, smoothstep(-0.35, 0.02, h));
          col = mix(col, uMid, smoothstep(0.02, 0.28, h));
          col = mix(col, uZenith, smoothstep(0.28, 0.85, h));
          vec3 moonDir = normalize(vec3(0.48, 0.52, -0.45));
          float md = max(0.0, dot(d, moonDir));
          col += uGlow * (pow(md, 10.0) * 0.16 + pow(md, 96.0) * 0.44);
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

  const BASE_FOG_DENSITY = 0.0145;
  scene.fog = new THREE.FogExp2('#132856', BASE_FOG_DENSITY);

  // Primary Raking Celestial Moonlight: 3/4 cross-angle casts dramatic exterior courtyard/parvis shadows AND crisp interior nave shadows!
  const keyLight = new THREE.DirectionalLight('#e6f0ff', 3.25);
  keyLight.position.set(22, 21, -4);
  keyLight.target.position.set(0, 1.2, 4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 2;
  keyLight.shadow.camera.far = 86;
  keyLight.shadow.camera.left = -30;
  keyLight.shadow.camera.right = 30;
  keyLight.shadow.camera.top = 32;
  keyLight.shadow.camera.bottom = -34;
  keyLight.shadow.bias = -0.00055;
  keyLight.shadow.normalBias = 0.036;
  keyLight.shadow.radius = 2.2;
  group.add(keyLight, keyLight.target);

  // Disciplined cool sky hemisphere fill (keeps shadows rich navy without washing out directional contrast!)
  const hemiLight = new THREE.HemisphereLight('#78a4ed', '#0a142c', 0.62);
  const rimLight = new THREE.DirectionalLight('#9ec4ff', 0.82);
  rimLight.position.set(-20, 14, -20);
  group.add(hemiLight, rimLight);

  // Sanctuary SpotLight highlighting the veiled easel painting & dais
  const sanctuarySpot = new THREE.SpotLight('#eef5ff', 32.0, 26.0, Math.PI * 0.25, 0.78, 1.3);
  sanctuarySpot.position.set(2.5, 11.2, -6.2);
  sanctuarySpot.target.position.set(0, 3.1, -12.5);
  group.add(sanctuarySpot, sanctuarySpot.target);

  // Soft high interior fill so dark stone/cloth shadows retain Prussian-navy richness
  const naveFillFront = new THREE.PointLight('#c6ddff', 4.6, 26, 1.3);
  naveFillFront.position.set(-1.5, 8.8, 5.5);
  const naveFillMid = new THREE.PointLight('#b4cffc', 4.2, 24, 1.3);
  naveFillMid.position.set(-1.5, 8.8, -3.5);
  group.add(naveFillFront, naveFillMid);

  // Volumetric Lancet God-Ray Shafts slanting visibly from the right clerestory lancet windows across nave (Shots 04 & 05!)
  const beamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color('#cce0ff') },
      uOpacity: { value: 0.21 },
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
        float xFade = pow(sin(vUv.x * 3.1415926), 1.6);
        float yFade = smoothstep(0.0, 0.30, vUv.y) * smoothstep(1.0, 0.06, vUv.y);
        gl_FragColor = vec4(uColor, xFade * yFade * uOpacity);
      }
    `,
  });

  const beamGeo = new THREE.PlaneGeometry(1, 1);
  const beamGroup = new THREE.Group();
  const beamSpecs = [
    { pos: [2.8, 4.1, 6.2], rot: [0.10, 0.32, 0.56], scale: [2.7, 9.6, 1] },
    { pos: [2.8, 4.1, 2.0], rot: [0.10, 0.32, 0.56], scale: [2.7, 9.6, 1] },
    { pos: [2.8, 4.1, -2.2], rot: [0.10, 0.32, 0.56], scale: [2.7, 9.6, 1] },
    { pos: [2.8, 4.1, -6.4], rot: [0.10, 0.32, 0.56], scale: [2.7, 9.6, 1] },
    { pos: [0.0, 5.4, -11.4], rot: [0.42, 0.0, 0.0], scale: [4.2, 9.8, 1] },
  ];
  beamSpecs.forEach((b) => {
    const m = new THREE.Mesh(beamGeo, beamMat);
    m.position.set(...b.pos);
    m.rotation.set(...b.rot);
    m.scale.set(...b.scale);
    beamGroup.add(m);
  });
  group.add(beamGroup);

  // Volumetric Intro Mist Veil Banks enveloping the rising cathedral silhouette during Genshin-style intro
  const introMistMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color('#345da8') },
      uOpacity: { value: 0.0 },
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
        float radial = smoothstep(1.0, 0.15, length((vUv - 0.5) * 2.0));
        gl_FragColor = vec4(uColor, radial * radial * uOpacity);
      }
    `,
  });
  const introMistGroup = new THREE.Group();
  const mistVeils = [
    { pos: [0, 3.2, 22.0], rot: [-0.15, 0.2, 0], scale: [44, 15, 1] },
    { pos: [-5, 4.2, 12.0], rot: [-0.12, 0.25, 0], scale: [48, 17, 1] },
    { pos: [4, 2.2, 28.0], rot: [-0.25, 0.15, 0], scale: [40, 12, 1] },
  ];
  mistVeils.forEach((mv) => {
    const plane = new THREE.Mesh(beamGeo, introMistMat);
    plane.position.set(...mv.pos);
    plane.rotation.set(...mv.rot);
    plane.scale.set(...mv.scale);
    introMistGroup.add(plane);
  });
  group.add(introMistGroup);

  const dustCount = 72;
  const dustBase = [];
  const dustPositions = new Float32Array(dustCount * 3);
  let sSeed = 42;
  const rnd = () => {
    sSeed = (sSeed * 1664525 + 1013904223) >>> 0;
    return sSeed / 4294967296;
  };
  for (let i = 0; i < dustCount; i++) {
    const x = (rnd() - 0.5) * 8.6;
    const y = 1.4 + rnd() * 5.2;
    const z = -13.5 + rnd() * 25.0;
    dustBase.push({ bx: x, by: y, bz: z, ph: rnd() * Math.PI * 2, spd: 0.4 + rnd() * 0.6 });
    dustPositions[i * 3] = x;
    dustPositions[i * 3 + 1] = y;
    dustPositions[i * 3 + 2] = z;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustPointsMat = new THREE.PointsMaterial({
    map: mats.bokehMap,
    color: new THREE.Color('#dceaff'),
    size: 0.15,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.44,
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

  function setFogDensity(density) {
    scene.fog.density = density;
  }

  function setBuildProgress(p) {
    const glow = THREE.MathUtils.clamp((p - 0.2) / 0.6, 0.25, 1.0);
    beamMat.uniforms.uOpacity.value = 0.21 * glow;
    sanctuarySpot.intensity = 32.0 * glow;
    const mistStrength = Math.max(0, 1.0 - THREE.MathUtils.smoothstep(p, 0.18, 0.62));
    introMistMat.uniforms.uOpacity.value = mistStrength * 0.48;
    introMistGroup.visible = mistStrength > 0.01;
  }

  function update(dt, elapsed) {
    const posAttr = dustGeo.attributes.position;
    for (let i = 0; i < dustCount; i++) {
      const d = dustBase[i];
      posAttr.setXYZ(
        i,
        d.bx + Math.cos(elapsed * d.spd * 0.7 + d.ph) * 0.18,
        d.by + Math.sin(elapsed * d.spd + d.ph) * 0.28,
        d.bz
      );
    }
    posAttr.needsUpdate = true;
  }

  function dispose() {
    envRT.dispose();
    beamGeo.dispose();
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
    setSkyLinearOutput: (enabled) => {
      skyUniforms.uLinearOutput.value = enabled ? 1.0 : 0.0;
    },
    update,
    dispose,
  };
}
