import * as THREE from 'three';

/**
 * Granular PBR material synthesis factory (supports immediate Frame-1 wireframe
 * and incremental async procedural texture population during 0% -> 100% loading).
 */
export function createCathedralMaterials(textures) {
  const mats = {};

  // Stage 1 & 2 Prominent Architectural Blueprint Wireframe + Top-Down Scan-Wave Conversion Shader
  mats.wireframeLineMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uWireProgress: { value: 0.0 },
      uWireOpacity: { value: 1.0 },
      uScanY: { value: 30.0 },
    },
    vertexShader: `
      attribute float aOrder;
      varying float vOrder;
      varying float vWorldY;
      void main() {
        vOrder = aOrder;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldY = wp.y;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uWireProgress;
      uniform float uWireOpacity;
      uniform float uScanY;
      varying float vOrder;
      varying float vWorldY;
      void main() {
        float head = clamp(uWireProgress * 1.10, 0.0, 1.10);
        float drawMask = smoothstep(head + 0.04, head - 0.08, vOrder);
        float drawPulse = exp(-pow(clamp((vOrder - head + 0.03) * 14.0, -6.0, 6.0), 2.0));

        // During Spatial Materialization Wave (uScanY sweeps 16.5 -> -1.4):
        // keep bright wireframe below uScanY, emit an intense conversion halo at uScanY, dissolve above!
        float belowWave = smoothstep(uScanY + 1.35, uScanY - 0.25, vWorldY);
        float waveBand = exp(-pow(clamp((vWorldY - uScanY) / 0.85, -6.0, 6.0), 2.0));

        vec3 draftBlue = vec3(0.42, 0.72, 1.25);
        vec3 brightIce = vec3(1.15, 1.45, 1.95);
        vec3 col = mix(draftBlue, brightIce, clamp(drawPulse * 0.75 + waveBand * 0.95, 0.0, 1.0));

        float strength = (drawMask * 0.72 + drawPulse * 0.58) * belowWave + waveBand * 0.85;
        float alpha = clamp(strength * uWireOpacity, 0.0, 1.0);
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });

  // Pre-create core PBR materials so Task 0 can instantiate Spiral Staircase wireframe & geometry immediately!
  mats.whiteMarbleMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#eef2fa'),
    roughness: 0.34,
    metalness: 0.04,
    envMapIntensity: 0.85,
  });

  mats.brightAlabasterMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f8faff'),
    roughness: 0.28,
    metalness: 0.04,
    envMapIntensity: 0.95,
  });

  mats.obsidianMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#3b4b70'),
    roughness: 0.26,
    metalness: 0.28,
    envMapIntensity: 1.45,
  });

  mats.matteBasaltMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1a2540'),
    roughness: 0.52,
    metalness: 0.14,
    envMapIntensity: 0.95,
  });

  mats.navyStoneMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#34579e'),
    roughness: 0.56,
    metalness: 0.08,
    envMapIntensity: 1.05,
  });

  mats.navyVelvetMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#10224e'),
    roughness: 0.92,
    metalness: 0.02,
    envMapIntensity: 0.32,
  });

  mats.silverTrimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e6eefc'),
    roughness: 0.18,
    metalness: 0.86,
    envMapIntensity: 1.45,
  });

  mats.giltBronzeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ead8b1'),
    roughness: 0.24,
    metalness: 0.82,
    envMapIntensity: 1.35,
  });

  mats.floorTrimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#6880af'),
    roughness: 0.48,
    metalness: 0.08,
    envMapIntensity: 0.72,
  });

  mats.naveInlayMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d8e4fb'),
    roughness: 0.26,
    metalness: 0.14,
    envMapIntensity: 1.15,
  });

  mats.wellMedallionMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#eef4ff'),
    roughness: 0.28,
    metalness: 0.10,
    envMapIntensity: 1.05,
  });

  mats.carpetMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#dce8ff'),
    roughness: 0.88,
    metalness: 0.02,
    envMapIntensity: 0.42,
  });

  mats.shroudMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f7f6f2'),
    roughness: 0.90,
    metalness: 0.0,
    side: THREE.DoubleSide,
    envMapIntensity: 0.34,
  });

  mats.lancetGlassMat = new THREE.MeshStandardMaterial({
    emissive: new THREE.Color('#3b7cff'),
    emissiveIntensity: 1.95,
    roughness: 0.20,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });

  mats.lancetGoboMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#4284ff'),
    transparent: true,
    opacity: 0.32,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  mats.roseGlassMat = new THREE.MeshStandardMaterial({
    emissive: new THREE.Color('#4b8aff'),
    emissiveIntensity: 1.75,
    roughness: 0.22,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });

  mats.windowSunBackingMat = new THREE.ShaderMaterial({
    side: THREE.FrontSide,
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        float y = clamp(vUv.y, 0.0, 1.0);
        vec3 sky = mix(vec3(0.45, 0.68, 0.98), vec3(0.95, 0.98, 1.0), smoothstep(0.15, 0.85, y));
        gl_FragColor = vec4(sky * 1.45, 1.0);
      }
    `,
  });

  mats.clocheGlassMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    uniforms: {
      uRimColor: { value: new THREE.Color('#eef5ff') },
      uEdgeTint: { value: new THREE.Color('#5a94ff') },
      uOpacityScale: { value: 1.0 },
    },
    vertexShader: `
      varying vec3 vNormalW;
      varying vec3 vViewDirW;
      varying vec3 vLocalPos;
      void main() {
        vLocalPos = position;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vViewDirW = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uRimColor;
      uniform vec3 uEdgeTint;
      uniform float uOpacityScale;
      varying vec3 vNormalW;
      varying vec3 vViewDirW;
      varying vec3 vLocalPos;
      void main() {
        vec3 N = normalize(vNormalW);
        vec3 V = normalize(vViewDirW);
        float ndotv = clamp(abs(dot(N, V)), 0.0, 1.0);
        float rim = pow(max(0.0001, 1.0 - ndotv), 4.0);

        vec3 H1 = normalize(V + normalize(vec3(0.56, 0.35, 0.74)));
        vec3 H2 = normalize(V + normalize(vec3(-0.74, 0.22, 0.63)));
        float spec1 = pow(max(0.0001, dot(N, H1)), 130.0) * 0.45;
        float spec2 = pow(max(0.0001, dot(N, H2)), 110.0) * 0.32;

        float baseLip = smoothstep(0.045, 0.0, vLocalPos.y) * 0.52;
        float domeCrest = smoothstep(0.60, 0.88, vLocalPos.y) * rim * 0.38;

        vec3 col = mix(uEdgeTint, uRimColor, clamp(rim * 0.85 + 0.40, 0.0, 1.0));
        col += vec3(1.0) * (spec1 + spec2 + baseLip + domeCrest);
        float alpha = clamp(0.020 + rim * 0.64 + spec1 * 0.55 + spec2 * 0.40 + baseLip * 0.48, 0.020, 0.86) * uOpacityScale;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });

  function buildCoreStoneAndMetal() {
    const marbleMap = textures.carraraMarble('carrara-main', [1, 1], 101);
    const marbleBump = textures.carraraBump('carrara-bump-main', [1, 1], 109);
    const obsidianMap = textures.obsidianStone('obsidian-main', [1, 1], 202);
    const navyAshlarMap = textures.navyAshlar('navy-ashlar-main', [1, 1], 303);

    mats.whiteMarbleMat.map = marbleMap;
    mats.whiteMarbleMat.bumpMap = marbleBump;
    mats.whiteMarbleMat.bumpScale = 0.018;
    mats.whiteMarbleMat.needsUpdate = true;

    mats.brightAlabasterMat.map = marbleMap;
    mats.brightAlabasterMat.bumpMap = marbleBump;
    mats.brightAlabasterMat.bumpScale = 0.012;
    mats.brightAlabasterMat.needsUpdate = true;

    mats.obsidianMat.map = obsidianMap;
    mats.obsidianMat.needsUpdate = true;

    mats.matteBasaltMat.map = obsidianMap;
    mats.matteBasaltMat.needsUpdate = true;

    mats.navyStoneMat.map = navyAshlarMap;
    mats.navyStoneMat.needsUpdate = true;

    mats.floorTrimMat.map = marbleMap;
    mats.floorTrimMat.needsUpdate = true;
  }

  function buildFloorsAndDraperies() {
    const carpetTex = textures.ceruleanCarpetTex('cerulean-carpet-main');
    const naveInlayMap = textures.naveInlayFloor('nave-inlay-main', [8, 16]);
    const medallionMap = textures.wellMedallionTex('well-medallion-main');
    const linen = textures.linenCloth('shroud-linen');

    mats.naveInlayMat.map = naveInlayMap;
    mats.naveInlayMat.needsUpdate = true;

    mats.wellMedallionMat.map = medallionMap;
    mats.wellMedallionMat.needsUpdate = true;

    mats.carpetMat.map = carpetTex.map;
    mats.carpetMat.bumpMap = carpetTex.bumpMap;
    mats.carpetMat.bumpScale = 0.028;
    mats.carpetMat.needsUpdate = true;

    mats.shroudMat.map = linen.map;
    mats.shroudMat.bumpMap = linen.bumpMap;
    mats.shroudMat.bumpScale = 0.045;
    mats.shroudMat.needsUpdate = true;
  }

  function buildStainedGlassAndVFX() {
    const lancet = textures.lancetGlass('lancet-navy');
    const lancetGoboMap = textures.lancetGoboTex('lancet-gobo-main');
    const rose = textures.roseWindowGlass('rose-navy');
    const bokehMap = textures.bokehDot('dust-bokeh');

    mats.lancetGlassMat.map = lancet.map;
    mats.lancetGlassMat.emissiveMap = lancet.emissiveMap;
    mats.lancetGlassMat.needsUpdate = true;

    mats.lancetGoboMat.map = lancetGoboMap;
    mats.lancetGoboMat.needsUpdate = true;

    mats.roseGlassMat.map = rose.map;
    mats.roseGlassMat.emissiveMap = rose.emissiveMap;
    mats.roseGlassMat.needsUpdate = true;

    mats.bokehMap = bokehMap;
    mats.dustMat = new THREE.SpriteMaterial({
      map: bokehMap,
      color: new THREE.Color('#dceaff'),
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  return {
    mats,
    buildCoreStoneAndMetal,
    buildFloorsAndDraperies,
    buildStainedGlassAndVFX,
  };
}
