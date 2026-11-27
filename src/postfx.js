import * as THREE from 'three';

export function createCathedralPostFX(renderer, width, height, dpr = 1) {
  const isWebGL2 = renderer.capabilities.isWebGL2;
  const maxSamples = isWebGL2 ? Math.min(2, renderer.capabilities.maxSamples || 0) : 0;
  const rtType = isWebGL2 ? THREE.HalfFloatType : THREE.UnsignedByteType;

  let curW = Math.max(1, Math.round(width * dpr));
  let curH = Math.max(1, Math.round(height * dpr));

  const sceneRT = new THREE.WebGLRenderTarget(curW, curH, {
    type: rtType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: false,
    samples: maxSamples,
  });

  const blurW = Math.max(64, Math.round(curW / 3));
  const blurH = Math.max(64, Math.round(curH / 3));

  const blurA = new THREE.WebGLRenderTarget(blurW, blurH, {
    type: rtType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: false,
    depthBuffer: false,
    stencilBuffer: false,
  });

  const blurB = new THREE.WebGLRenderTarget(blurW, blurH, {
    type: rtType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: false,
    depthBuffer: false,
    stencilBuffer: false,
  });

  const orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadGeo = new THREE.PlaneGeometry(2, 2);

  const blurMat = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tInput: { value: sceneRT.texture },
      uDir: { value: new THREE.Vector2(1 / blurW, 0) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: `
      uniform sampler2D tInput;
      uniform vec2 uDir;
      varying vec2 vUv;
      void main() {
        vec3 sum = texture2D(tInput, vUv).rgb * 0.227027;
        sum += texture2D(tInput, vUv + uDir * 1.3846).rgb * 0.316216;
        sum += texture2D(tInput, vUv - uDir * 1.3846).rgb * 0.316216;
        sum += texture2D(tInput, vUv + uDir * 3.2308).rgb * 0.070270;
        sum += texture2D(tInput, vUv - uDir * 3.2308).rgb * 0.070270;
        gl_FragColor = vec4(sum, 1.0);
      }
    `,
  });

  const compositeMat = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tScene: { value: sceneRT.texture },
      tBlur: { value: blurB.texture },
      uBloomThreshold: { value: 1.28 },
      uBloomStrength: { value: 0.11 },
      uBloomTint: { value: new THREE.Vector3(0.88, 0.94, 1.08) },
      uVignetteTint: { value: new THREE.Vector3(0.02, 0.04, 0.11) },
      uDofStrength: { value: 0.78 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: `
      uniform sampler2D tScene;
      uniform sampler2D tBlur;
      uniform float uBloomThreshold;
      uniform float uBloomStrength;
      uniform vec3 uBloomTint;
      uniform vec3 uVignetteTint;
      uniform float uDofStrength;
      varying vec2 vUv;
      void main() {
        vec3 sharp = texture2D(tScene, vUv).rgb;
        vec3 blurCol = texture2D(tBlur, vUv).rgb;

        // Crisp 2.5D HD-2D tilt-shift focal band (center razor-sharp, upper & lower bands gently soft-focus)
        float dy = max(0.0, 0.22 - vUv.y) * 1.45 + max(0.0, vUv.y - 0.78) * 1.45;
        float coc = smoothstep(0.0, 0.24, dy);
        vec3 col = mix(sharp, blurCol, coc * uDofStrength);

        // Restrained celestial bloom (only true high-luminance highlights glow, zero fuzzy haloing)
        vec3 hi = max(blurCol - vec3(uBloomThreshold), vec3(0.0));
        col += hi * uBloomTint * uBloomStrength;

        float rDist = length((vUv - 0.5) * vec2(1.18, 1.0));
        float vig = smoothstep(0.48, 0.99, rDist);
        col = mix(col, mix(col * 0.52, uVignetteTint, 0.38), vig * 0.40);

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });

  const fsScene = new THREE.Scene();
  const fsMesh = new THREE.Mesh(quadGeo, blurMat);
  fsMesh.frustumCulled = false;
  fsScene.add(fsMesh);

  const lastStats = { calls: 0, triangles: 0 };

  function setSize(w, h, nextDpr = 1) {
    const nw = Math.max(1, Math.round(w * nextDpr));
    const nh = Math.max(1, Math.round(h * nextDpr));
    if (nw === curW && nh === curH) return;
    curW = nw;
    curH = nh;
    sceneRT.setSize(curW, curH);
    const nbw = Math.max(64, Math.round(curW / 3));
    const nbh = Math.max(64, Math.round(curH / 3));
    blurA.setSize(nbw, nbh);
    blurB.setSize(nbw, nbh);
  }

  function render(scene, camera) {
    const prevTarget = renderer.getRenderTarget();
    const prevTone = renderer.toneMapping;
    const prevXr = renderer.xr.enabled;

    renderer.toneMapping = THREE.NoToneMapping;
    renderer.xr.enabled = false;

    renderer.setRenderTarget(sceneRT);
    renderer.clear();
    renderer.render(scene, camera);
    lastStats.calls = renderer.info.render.calls;
    lastStats.triangles = renderer.info.render.triangles;

    const bw = blurA.width;
    const bh = blurA.height;
    fsMesh.material = blurMat;
    blurMat.uniforms.tInput.value = sceneRT.texture;
    blurMat.uniforms.uDir.value.set(1.6 / bw, 0);
    renderer.setRenderTarget(blurA);
    renderer.render(fsScene, orthoCam);

    blurMat.uniforms.tInput.value = blurA.texture;
    blurMat.uniforms.uDir.value.set(0, 1.6 / bh);
    renderer.setRenderTarget(blurB);
    renderer.render(fsScene, orthoCam);

    renderer.toneMapping = prevTone;
    fsMesh.material = compositeMat;
    renderer.setRenderTarget(prevTarget);
    renderer.render(fsScene, orthoCam);

    renderer.xr.enabled = prevXr;
  }

  function dispose() {
    sceneRT.dispose();
    blurA.dispose();
    blurB.dispose();
    quadGeo.dispose();
    blurMat.dispose();
    compositeMat.dispose();
  }

  return {
    group: new THREE.Group(),
    render,
    setSize,
    setBuildProgress() {},
    update() {},
    getSceneStats: () => lastStats,
    dispose,
  };
}
