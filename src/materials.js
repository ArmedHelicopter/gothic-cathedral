import * as THREE from 'three';

export function createCathedralMaterials(textures) {
  const mats = {};

  mats.wireframeLineMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uWireProgress: { value: 0 },
      uWireOpacity: { value: 1 },
      uScanY: { value: 30 },
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
        float belowWave = smoothstep(uScanY + 1.35, uScanY - 0.25, vWorldY);
        float waveBand = exp(-pow(clamp((vWorldY - uScanY) / 0.85, -6.0, 6.0), 2.0));
        vec3 draftBlue = vec3(0.42, 0.72, 1.25);
        vec3 brightIce = vec3(1.15, 1.45, 1.95);
        vec3 paleGold = vec3(2.10, 1.52, 0.62);
        vec3 col = mix(draftBlue, brightIce, clamp(drawPulse * 0.75, 0.0, 1.0));
        col = mix(col, paleGold, clamp(waveBand * 0.96, 0.0, 1.0));
        float strength = (drawMask * 0.72 + drawPulse * 0.58) * belowWave + waveBand * 0.95;
        float alpha = clamp(strength * uWireOpacity, 0.0, 1.0);
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });

  const standard = (color, roughness, metalness = 0, envMapIntensity = 0.8) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity });

  mats.whiteMarbleMat = standard('#E9E1D0', 0.75, 0, 0.72);
  mats.brightAlabasterMat = standard('#F2EBDD', 0.75, 0, 0.78);
  mats.obsidianMat = standard('#111316', 0.25, 0.04, 1.0);
  mats.matteBasaltMat = standard('#111316', 0.58, 0.02, 0.65);
  mats.navyStoneMat = standard('#12306E', 0.68, 0, 0.65);
  mats.navyVelvetMat = standard('#0E1B3D', 0.94, 0, 0.28);
  mats.silverTrimMat = standard('#A9ADB3', 0.30, 1, 1.15);
  mats.paleGoldMat = standard('#C9A961', 0.35, 1, 1.25);
  mats.giltBronzeMat = mats.paleGoldMat;
  mats.brassMat = standard('#B08D57', 0.45, 1, 1.1);
  mats.pipeTinMat = standard('#A9ADB3', 0.30, 1, 1.2);
  mats.marbleBlackMat = standard('#111316', 0.25, 0.02, 1.0);
  mats.marbleWhiteMat = standard('#ECE9E3', 0.25, 0.01, 0.9);
  mats.floorTrimMat = standard('#0E1B3D', 0.38, 0.08, 0.65);
  mats.naveInlayMat = standard('#ECE9E3', 0.25, 0.01, 0.9);
  mats.wellMedallionMat = standard('#E9E1D0', 0.34, 0.02, 0.8);
  mats.carpetMat = standard('#0E1B3D', 0.92, 0, 0.3);
  mats.shroudMat = standard('#f7f6f2', 0.90, 0, 0.34);
  mats.shroudMat.side = THREE.DoubleSide;

  mats.navyWebMat = standard('#0E1B3D', 0.93, 0, 0.32);
  mats.navyWebMat.emissive = new THREE.Color('#071026');
  mats.navyWebMat.emissiveIntensity = 0.32;
  mats.navyWebMat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vStarWorld;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvStarWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vStarWorld;
        float starHash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
      `)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        vec2 starGrid = vStarWorld.xz * 1.35 + vStarWorld.y * 0.17;
        vec2 starCell = floor(starGrid);
        vec2 starLocal = fract(starGrid) - 0.5;
        float starRnd = starHash(starCell);
        vec2 starOffset = vec2(starHash(starCell + 7.3), starHash(starCell + 19.1)) - 0.5;
        float starDist = length(starLocal - starOffset * 0.55);
        float starCore = smoothstep(0.075, 0.008, starDist) * step(0.91, starRnd);
        float starCross = (smoothstep(0.022, 0.004, abs(starLocal.x - starOffset.x * 0.55))
          + smoothstep(0.022, 0.004, abs(starLocal.y - starOffset.y * 0.55)))
          * smoothstep(0.20, 0.02, starDist) * step(0.965, starRnd);
        totalEmissiveRadiance += vec3(1.35, 0.94, 0.34) * (starCore * 1.4 + starCross * 0.24);
      `);
  };
  mats.navyWebMat.customProgramCacheKey = () => 'navy-web-stars-v1';

  mats.candleFlameMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uIntensity: { value: 1 },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uIntensity;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv - vec2(0.5, 0.18);
        p.x += sin(uTime * 5.0 + vUv.y * 8.0) * 0.018 * vUv.y;
        float width = mix(0.22, 0.018, clamp(p.y / 0.78, 0.0, 1.0));
        float body = smoothstep(width, width * 0.28, abs(p.x))
          * smoothstep(-0.05, 0.08, p.y) * smoothstep(0.82, 0.54, p.y);
        float core = smoothstep(0.12, 0.01, length((vUv - vec2(0.5, 0.30)) * vec2(1.0, 1.5)));
        vec3 color = mix(vec3(1.0, 0.36, 0.055), vec3(3.8, 2.35, 0.82), core);
        float alpha = clamp(body * (0.72 + core * 0.28) * uIntensity, 0.0, 1.0);
        if (alpha < 0.008) discard;
        gl_FragColor = vec4(color * uIntensity, alpha);
      }
    `,
  });

  mats.paleGoldGlowMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color('#FFC98A') },
      uOpacity: { value: 0.24 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float r = length((vUv - 0.5) * 2.0);
        float glow = pow(max(0.0001, 1.0 - clamp(r, 0.0, 1.0)), 2.2);
        float alpha = glow * uOpacity;
        if (alpha < 0.004) discard;
        gl_FragColor = vec4(uColor * (1.0 + glow * 0.8), alpha);
      }
    `,
  });

  mats.lancetGlassMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#12306E'),
    emissive: new THREE.Color('#12306E'),
    emissiveIntensity: 1.25,
    roughness: 0.28,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  mats.lancetGoboMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#284d91'),
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  mats.roseGlassMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#12306E'),
    emissive: new THREE.Color('#12306E'),
    emissiveIntensity: 1.45,
    roughness: 0.26,
    metalness: 0.04,
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
        vec3 horizon = vec3(0.10, 0.16, 0.35);
        vec3 zenith = vec3(0.025, 0.045, 0.14);
        vec3 sky = mix(horizon, zenith, smoothstep(0.0, 0.92, y));
        gl_FragColor = vec4(sky * 1.3, 1.0);
      }
    `,
  });

  mats.clocheGlassMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    uniforms: {
      uRimColor: { value: new THREE.Color('#fff4dc') },
      uEdgeTint: { value: new THREE.Color('#8aa8d8') },
      uOpacityScale: { value: 1 },
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
    mats.whiteMarbleMat.bumpScale = 0.012;
    mats.whiteMarbleMat.needsUpdate = true;
    mats.brightAlabasterMat.map = marbleMap;
    mats.brightAlabasterMat.bumpMap = marbleBump;
    mats.brightAlabasterMat.bumpScale = 0.009;
    mats.brightAlabasterMat.needsUpdate = true;
    mats.obsidianMat.map = obsidianMap;
    mats.obsidianMat.needsUpdate = true;
    mats.matteBasaltMat.map = obsidianMap;
    mats.matteBasaltMat.needsUpdate = true;
    mats.navyStoneMat.map = navyAshlarMap;
    mats.navyStoneMat.needsUpdate = true;
    mats.floorTrimMat.map = navyAshlarMap;
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
      color: new THREE.Color('#ffe1ad'),
      transparent: true,
      opacity: 0.36,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  return { mats, buildCoreStoneAndMetal, buildFloorsAndDraperies, buildStainedGlassAndVFX };
}
