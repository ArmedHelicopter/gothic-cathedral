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
      vec3 safeHDR(vec3 c) {
        return vec3(
          (c.r >= 0.0 && c.r < 32000.0) ? c.r : 0.0,
          (c.g >= 0.0 && c.g < 32000.0) ? c.g : 0.0,
          (c.b >= 0.0 && c.b < 32000.0) ? c.b : 0.0
        );
      }
      void main() {
        vec3 sum = safeHDR(texture2D(tInput, vUv).rgb) * 0.227027;
        sum += safeHDR(texture2D(tInput, vUv + uDir * 1.3846).rgb) * 0.316216;
        sum += safeHDR(texture2D(tInput, vUv - uDir * 1.3846).rgb) * 0.316216;
        sum += safeHDR(texture2D(tInput, vUv + uDir * 3.2308).rgb) * 0.070270;
        sum += safeHDR(texture2D(tInput, vUv - uDir * 3.2308).rgb) * 0.070270;
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
      uBloomThreshold: { value: 1.38 },
      uBloomStrength: { value: 0.09 },
      uBloomTint: { value: new THREE.Vector3(0.80, 0.91, 1.12) },
      uVignetteTint: { value: new THREE.Vector3(0.04, 0.08, 0.22) },
      uDofStrength: { value: 0.42 },
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
      vec3 safeHDR(vec3 c) {
        return vec3(
          (c.r >= 0.0 && c.r < 32000.0) ? c.r : 0.0,
          (c.g >= 0.0 && c.g < 32000.0) ? c.g : 0.0,
          (c.b >= 0.0 && c.b < 32000.0) ? c.b : 0.0
        );
      }
      void main() {
        vec3 sharp = safeHDR(texture2D(tScene, vUv).rgb);
        vec3 blurCol = safeHDR(texture2D(tBlur, vUv).rgb);

        // Crisp 2.5D focal band: preserves lower plaques & foreground pedestals razor-sharp while softening extreme edges
        float dy = max(0.0, 0.07 - vUv.y) * 1.4 + max(0.0, vUv.y - 0.86) * 1.4;
        float coc = smoothstep(0.0, 0.22, dy);
        vec3 col = mix(sharp, blurCol, coc * uDofStrength);

        // Serene cerulean-ice sanctuary highlight bloom (NaN-proof)
        vec3 hi = clamp(blurCol - vec3(uBloomThreshold), vec3(0.0), vec3(12.0));
        col += hi * uBloomTint * uBloomStrength;

        float rDist = length((vUv - 0.5) * vec2(1.18, 1.0));
        float vig = smoothstep(0.50, 0.99, rDist);
        col = mix(col, mix(col * 0.60, uVignetteTint, 0.32), vig * 0.34);

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
