import * as THREE from 'three';

export function createCathedralMaterials(textures) {
  const marbleMap = textures.carraraMarble('carrara-main', [1, 1], 101);
  const obsidianMap = textures.obsidianStone('obsidian-main', [1, 1], 202);
  const navyAshlarMap = textures.navyAshlar('navy-ashlar-main', [1, 1], 303);
  const carpetTex = textures.ceruleanCarpetTex('cerulean-carpet-main');
  const naveInlayMap = textures.naveInlayFloor('nave-inlay-main', [5, 11]);
  const linen = textures.linenCloth('shroud-linen');
  const lancet = textures.lancetGlass('lancet-azure');
  const lancetGoboMap = textures.lancetGoboTex('lancet-gobo-main');
  const rose = textures.roseWindowGlass('rose-grisaille');
  const doorWoodMap = textures.gothicDoorWood('door-wood-main');
  const bokehMap = textures.bokehDot('dust-bokeh');

  const whiteMarbleMat = new THREE.MeshStandardMaterial({
    map: marbleMap,
    color: new THREE.Color('#eef2fa'),
    roughness: 0.48,
    metalness: 0.03,
    envMapIntensity: 0.85,
  });

  const brightAlabasterMat = new THREE.MeshStandardMaterial({
    map: marbleMap,
    color: new THREE.Color('#f7f9ff'),
    roughness: 0.42,
    metalness: 0.03,
    envMapIntensity: 0.92,
  });

  // Calibrated slate-obsidian albedo with rim readability (no crushed flat black voids)
  const obsidianMat = new THREE.MeshStandardMaterial({
    map: obsidianMap,
    color: new THREE.Color('#27334f'),
    roughness: 0.40,
    metalness: 0.16,
    envMapIntensity: 1.15,
  });

  const matteBasaltMat = new THREE.MeshStandardMaterial({
    map: obsidianMap,
    color: new THREE.Color('#1d2842'),
    roughness: 0.62,
    metalness: 0.08,
    envMapIntensity: 0.82,
  });

  const navyStoneMat = new THREE.MeshStandardMaterial({
    map: navyAshlarMap,
    color: new THREE.Color('#304f8c'),
    roughness: 0.68,
    metalness: 0.06,
    envMapIntensity: 0.85,
  });

  const navyVelvetMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#162b5c'),
    roughness: 0.92,
    metalness: 0.02,
    envMapIntensity: 0.35,
  });

  const silverTrimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e2eaf8'),
    roughness: 0.24,
    metalness: 0.78,
    envMapIntensity: 1.35,
  });

  const floorTrimMat = new THREE.MeshStandardMaterial({
    map: marbleMap,
    color: new THREE.Color('#7f94bd'),
    roughness: 0.56,
    metalness: 0.06,
    envMapIntensity: 0.7,
  });

  const naveInlayMat = new THREE.MeshStandardMaterial({
    map: naveInlayMap,
    color: new THREE.Color('#dce6fa'),
    roughness: 0.42,
    metalness: 0.08,
    envMapIntensity: 0.90,
  });

  const shroudMat = new THREE.MeshStandardMaterial({
    map: linen.map,
    bumpMap: linen.bumpMap,
    bumpScale: 0.045,
    color: new THREE.Color('#f4f6fb'),
    roughness: 0.94,
    metalness: 0.0,
    side: THREE.DoubleSide,
    envMapIntensity: 0.36,
  });

  const doorWoodMat = new THREE.MeshStandardMaterial({
    map: doorWoodMap,
    color: new THREE.Color('#1d2740'),
    roughness: 0.46,
    metalness: 0.14,
    envMapIntensity: 1.0,
  });

  const lancetGlassMat = new THREE.MeshStandardMaterial({
    map: lancet.map,
    emissiveMap: lancet.emissiveMap,
    emissive: new THREE.Color('#478df8'),
    emissiveIntensity: 0.72,
    roughness: 0.24,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });

  const carpetMat = new THREE.MeshStandardMaterial({
    map: carpetTex.map,
    bumpMap: carpetTex.bumpMap,
    bumpScale: 0.025,
    color: new THREE.Color('#dce8ff'),
    roughness: 0.90,
    metalness: 0.02,
    envMapIntensity: 0.45,
  });

  const lancetGoboMat = new THREE.MeshBasicMaterial({
    map: lancetGoboMap,
    color: new THREE.Color('#6aa8ff'),
    transparent: true,
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const roseGlassMat = new THREE.MeshStandardMaterial({
    map: rose.map,
    emissiveMap: rose.emissiveMap,
    emissive: new THREE.Color('#9ec4ff'),
    emissiveIntensity: 1.15,
    roughness: 0.22,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });

  /**
   * Crystal-Clear Blown Museum Bell-Jar Cloche Shader:
   * - Extremely clear interior (~0.028 center alpha) so icons are never milky/washed out
   * - Sharp narrow Fresnel rim + razor-crisp twin vertical studio specular streaks + base/dome glass ring glints
   */
  const clocheGlassMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    uniforms: {
      uRimColor: { value: new THREE.Color('#eef5ff') },
      uEdgeTint: { value: new THREE.Color('#7aaaff') },
      uSpecDir: { value: new THREE.Vector3(0.45, 0.72, 0.52).normalize() },
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
      uniform vec3 uSpecDir;
      uniform float uOpacityScale;
      varying vec3 vNormalW;
      varying vec3 vViewDirW;
      varying vec3 vLocalPos;
      void main() {
        vec3 N = normalize(vNormalW);
        vec3 V = normalize(vViewDirW);
        float ndotv = clamp(abs(dot(N, V)), 0.0, 1.0);
        float rim = pow(max(0.0001, 1.0 - ndotv), 4.2);

        // Razor-crisp twin vertical studio glass reflection streaks + upper dome arc glint
        vec3 H1 = normalize(V + normalize(vec3(0.56, 0.35, 0.74)));
        vec3 H2 = normalize(V + normalize(vec3(-0.74, 0.22, 0.63)));
        float spec1 = pow(max(0.0001, dot(N, H1)), 380.0);
        float spec2 = pow(max(0.0001, dot(N, H2)), 260.0) * 0.65;

        float baseLip = smoothstep(0.040, 0.0, vLocalPos.y) * 0.62;
        float domeCrest = smoothstep(0.56, 0.80, vLocalPos.y) * rim * 0.42;

        vec3 col = mix(uEdgeTint, uRimColor, clamp(rim * 0.85 + 0.40, 0.0, 1.0));
        col += vec3(1.0) * (spec1 * 1.9 + spec2 * 1.2 + baseLip + domeCrest);
        float alpha = clamp(0.022 + rim * 0.76 + spec1 * 0.88 + spec2 * 0.55 + baseLip * 0.58, 0.022, 0.94) * uOpacityScale;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });

  const dustMat = new THREE.SpriteMaterial({
    map: bokehMap,
    color: new THREE.Color('#dceaff'),
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return {
    whiteMarbleMat,
    brightAlabasterMat,
    obsidianMat,
    matteBasaltMat,
    navyStoneMat,
    navyVelvetMat,
    silverTrimMat,
    floorTrimMat,
    naveInlayMat,
    shroudMat,
    doorWoodMat,
    lancetGlassMat,
    lancetGoboMat,
    carpetMat,
    roseGlassMat,
    clocheGlassMat,
    dustMat,
    bokehMap,
  };
}
