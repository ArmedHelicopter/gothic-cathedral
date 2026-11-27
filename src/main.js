import * as THREE from 'three';
import { CENTERPIECE, PROJECTS } from './data.js';
import { createCathedralTextures } from './textures.js';
import { createCathedralMaterials } from './materials.js';
import { createSpiralStaircaseComponent } from './spiralStaircase.js';
import { createFoundationComponent } from './foundation.js';
import { createGothicShellComponent } from './gothicShell.js';
import { createVeiledPaintingComponent } from './veiledPainting.js';
import { createPedestalsComponent } from './pedestals.js';
import { createLightingComponent } from './lighting.js';
import { createCathedralPostFX } from './postfx.js';
import { createInteriorCollider } from './collision.js';
import { createCameraController, PRESETS } from './camera.js';
import { createUIController } from './ui.js';

function showFallback() {
  const fb = document.getElementById('webgl-fallback');
  if (fb) fb.hidden = false;
}

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

async function init() {
  const canvas = document.getElementById('cathedral-canvas');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
  } catch {
    showFallback();
    return;
  }
  if (!renderer || !renderer.getContext()) {
    showFallback();
    return;
  }

  let currentDpr = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(currentDpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.12, 180);

  const textures = createCathedralTextures(renderer);
  const matFactory = createCathedralMaterials(textures);
  const { mats } = matFactory;

  const lighting = createLightingComponent(scene, renderer, mats);
  const postfx = createCathedralPostFX(renderer, window.innerWidth, window.innerHeight, currentDpr);
  const collider = createInteriorCollider();

  const wireframeGroup = new THREE.Group();
  wireframeGroup.name = 'architecturalWireframe';
  const solidWorldGroup = new THREE.Group();
  solidWorldGroup.name = 'sanctuarySolidWorld';
  solidWorldGroup.visible = false;
  scene.add(wireframeGroup, solidWorldGroup);

  let ui = null;
  let cameraRig = null;
  let scrollTourMode = false;
  let activeExhibitId = null;
  let hoveredExhibitId = null;
  let realLoadProgress = 0.0;

  let foundation = null;
  let gothicShell = null;
  let spiralStaircase = null;
  let veiledPainting = null;
  let pedestals = null;

  function applyLoadingVisuals(p01) {
    const p = THREE.MathUtils.clamp(p01, 0, 1);
    realLoadProgress = p;
    const wireDraw = Math.min(1, p / 0.84);
    const wireOpacity = p < 0.80 ? 1.0 : Math.max(0.0, 1.0 - (p - 0.80) / 0.20);
    mats.wireframeLineMat.uniforms.uWireProgress.value = wireDraw * wireDraw * (3 - 2 * wireDraw);
    mats.wireframeLineMat.uniforms.uWireOpacity.value = wireOpacity;
    wireframeGroup.visible = wireOpacity > 0.01;

    const matAlpha = p < 0.64 ? 0.0 : Math.min(1.0, (p - 0.64) / 0.36);
    solidWorldGroup.visible = p > 0.64 && (lighting !== null);
    lighting.setMaterializeProgress(matAlpha * matAlpha * (3 - 2 * matAlpha));

    ui?.setLoadProgress(p);
    cameraRig?.setLoadingProgress(p);
  }

  cameraRig = createCameraController(camera, canvas, collider, {
    onDiveStep({ motionBlur }) {
      postfx.setMotionBlur(motionBlur || 0);
    },
    onStageChange(stage) {
      ui?.setStage(stage);
      if (stage === 'loading') {
        solidWorldGroup.visible = false;
        wireframeGroup.visible = true;
      } else {
        wireframeGroup.visible = false;
        mats.wireframeLineMat.uniforms.uWireOpacity.value = 0.0;
        solidWorldGroup.visible = true;
        lighting.setMaterializeProgress(1.0);
        if (stage === 'explore') {
          postfx.setMotionBlur(0.0);
        }
      }
    },
  });

  function renderAll() {
    if (foundation && solidWorldGroup.visible) {
      foundation.updateReflection(renderer, scene, camera);
    }
    postfx.render(scene, camera);
    const showHud = cameraRig.getStage() === 'explore' && document.body.dataset.hideUi !== 'true';
    ui?.updatePins(camera, window.innerWidth, window.innerHeight, showHud);
  }

  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(currentDpr);
    renderer.setSize(w, h);
    postfx.setSize(w, h, currentDpr);
  }
  window.addEventListener('resize', onResize);

  // Start lightweight render loop immediately so Frame 1 shows genuine 0% wireframe sketch
  let lastTime = null;
  let perfFrames = 0;
  let perfSum = 0;
  let fps = 60;
  let fpsFrames = 0;
  let fpsTimer = 0;

  function animate(now) {
    requestAnimationFrame(animate);
    if (document.hidden) {
      lastTime = null;
      return;
    }
    const rawDt = lastTime === null ? 0 : Math.max(0, (now - lastTime) / 1000);
    lastTime = now;

    if (rawDt > 0 && rawDt < 0.25) {
      perfFrames += 1;
      perfSum += rawDt;
      if (perfFrames >= 45) {
        const avgMs = (perfSum / perfFrames) * 1000;
        perfFrames = 0;
        perfSum = 0;
        if (avgMs > 22 && currentDpr > 0.85) {
          currentDpr = Math.max(0.85, +(currentDpr - 0.2).toFixed(2));
          onResize();
        }
      }
      fpsFrames += 1;
      fpsTimer += rawDt;
      if (fpsTimer >= 0.5) {
        fps = Math.max(1, Math.round(fpsFrames / fpsTimer));
        fpsFrames = 0;
        fpsTimer = 0;
      }
    }

    const dt = Math.min(0.05, rawDt);
    const elapsed = now * 0.001;

    cameraRig.update(dt);
    veiledPainting?.update(dt, elapsed);
    pedestals?.update(dt, elapsed);
    lighting.update(dt, elapsed, camera);

    renderAll();
  }
  requestAnimationFrame(animate);

  // Genuine Async Resource Pipeline (0% -> 100%, each step executes real synthesis/GPU work!)
  const earlyUI = createUIController({ pinAnchors: {} });
  ui = earlyUI;
  applyLoadingVisuals(0.0);

  const loadTasks = [
    { weight: 10, run: () => matFactory.buildCoreStoneAndMetal() },
    { weight: 10, run: () => matFactory.buildFloorsAndDraperies() },
    { weight: 8, run: () => matFactory.buildStainedGlassAndVFX() },
    { weight: 10, run: () => textures.uploadAllToGPU(renderer) },
    {
      weight: 14,
      run: () => {
        spiralStaircase = createSpiralStaircaseComponent(mats);
        wireframeGroup.add(spiralStaircase.wireframeMesh);
        solidWorldGroup.add(spiralStaircase.group);
      },
    },
    {
      weight: 10,
      run: () => {
        foundation = createFoundationComponent(mats);
        solidWorldGroup.add(foundation.group);
      },
    },
    {
      weight: 14,
      run: () => {
        gothicShell = createGothicShellComponent(mats);
        wireframeGroup.add(gothicShell.wireframeMesh);
        solidWorldGroup.add(gothicShell.group);
      },
    },
    {
      weight: 8,
      run: () => {
        veiledPainting = createVeiledPaintingComponent(textures, mats);
        solidWorldGroup.add(veiledPainting.group);
      },
    },
    {
      weight: 8,
      run: () => {
        pedestals = createPedestalsComponent(textures, mats);
        solidWorldGroup.add(pedestals.group);
        textures.uploadAllToGPU(renderer);
      },
    },
    {
      weight: 8,
      run: () => {
        lighting.buildEnvironment();
        lighting.buildLightsAndRays();
        solidWorldGroup.add(lighting.group);
      },
    },
    {
      weight: 10,
      run: () => {
        lighting.setMaterializeProgress(1.0);
        solidWorldGroup.visible = true;
        lighting.bakeStaticShadows();
        renderer.compile(scene, camera);
      },
    },
  ];

  const totalWeight = loadTasks.reduce((a, t) => a + t.weight, 0);
  let doneWeight = 0;

  for (let i = 0; i < loadTasks.length; i++) {
    loadTasks[i].run();
    doneWeight += loadTasks[i].weight;
    const pct = doneWeight / totalWeight;
    applyLoadingVisuals(pct);
    renderAll();
    // Pause at least 2 animation frames per pipeline batch so real loading progress visibly sketches out the staircase!
    await nextFrame();
    await nextFrame();
  }

  // Register modular components for external inspection/modification
  window.__CATHEDRAL_COMPONENTS__ = {
    spiralStaircase,
    foundation,
    gothicShell,
    veiledPainting,
    pedestals,
    lighting,
    postfx,
    collider,
  };

  const exhibitOrder = [CENTERPIECE.id, ...PROJECTS.map((p) => p.id)];

  function selectExhibit(id) {
    activeExhibitId = id;
    pedestals.setActiveExhibit(activeExhibitId, hoveredExhibitId);
    if (!id) {
      ui?.closeExhibit();
      return;
    }
    ui?.showExhibit(id);
    if (id === CENTERPIECE.id) {
      ui?.setActivePreset('masterpiece');
      cameraRig.focusPose(CENTERPIECE.camPos, CENTERPIECE.camTarget, false, 42, 'ground', 1.65);
    } else {
      ui?.setActivePreset(null);
      const pose = pedestals.getExhibitFocusPose(id);
      if (pose) cameraRig.focusPose(pose.camPos, pose.camTarget, false, 40, 'ground', 1.65);
    }
  }

  function stepExhibit(dir) {
    const curIdx = activeExhibitId ? exhibitOrder.indexOf(activeExhibitId) : -1;
    const nextIdx =
      curIdx === -1
        ? dir > 0
          ? 1
          : exhibitOrder.length - 1
        : (curIdx + dir + exhibitOrder.length) % exhibitOrder.length;
    selectExhibit(exhibitOrder[nextIdx]);
  }

  // Bind full Explore HUD controller
  ui = createUIController({
    pinAnchors: {
      ...pedestals.pinAnchors,
      [CENTERPIECE.id]: veiledPainting.pinAnchor,
    },
    onSelectExhibit: selectExhibit,
    onStepExhibit: stepExhibit,
    onPresetSelect: (presetKey) => {
      activeExhibitId = null;
      pedestals.setActiveExhibit(null, hoveredExhibitId);
      ui?.setActivePreset(presetKey);
      cameraRig.goToPreset(presetKey, false);
    },
    onToggleScrollMode: () => {
      scrollTourMode = !scrollTourMode;
      ui?.syncScrollMode(scrollTourMode);
    },
    onReplayDive: () => {
      activeExhibitId = null;
      pedestals.setActiveExhibit(null, null);
      ui?.setActivePreset('sovereign');
      cameraRig.startDive();
    },
  });
  ui.setActivePreset('sovereign');

  // Mouse wheel: zoom FOV or cycle exhibits
  let lastWheelStep = 0;
  window.addEventListener(
    'wheel',
    (e) => {
      const insideCard = e.target && e.target.closest && e.target.closest('#exhibit-card');
      if (insideCard) return;
      e.preventDefault();
      if (scrollTourMode && cameraRig.getStage() === 'explore') {
        const now = performance.now();
        if (now - lastWheelStep > 280 && Math.abs(e.deltaY) > 6) {
          lastWheelStep = now;
          stepExhibit(e.deltaY > 0 ? 1 : -1);
        }
      } else {
        cameraRig.zoomBy(e.deltaY);
      }
    },
    { passive: false }
  );

  // Raycasting for pedestal cloches & Sovereign Painting
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const interactiveMeshes = [...pedestals.hitMeshes, veiledPainting.hitMesh];

  canvas.addEventListener('pointermove', (e) => {
    if (cameraRig.getStage() !== 'explore') return;
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(interactiveMeshes, false);
    hoveredExhibitId = hits.length > 0 ? hits[0].object.userData.exhibitId : null;
    canvas.style.cursor = hoveredExhibitId ? 'pointer' : 'grab';
    pedestals.setActiveExhibit(activeExhibitId, hoveredExhibitId);
  });

  canvas.addEventListener('click', (e) => {
    if (cameraRig.getStage() !== 'explore' || !cameraRig.wasClick()) return;
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(interactiveMeshes, false);
    if (hits.length > 0) {
      selectExhibit(hits[0].object.userData.exhibitId);
    }
  });

  const params = new URLSearchParams(window.location.search);
  window.__CATHEDRAL_READY__ = true;

  if (params.get('intro') === '0') {
    cameraRig.finishDiveToExplore();
  } else {
    // 100% Loaded -> Immediately launch exact 1.70s FPV dive down Spiral Staircase well!
    cameraRig.startDive();
  }

  window.__CATHEDRAL_DEBUG__ = {
    setLoadingProgress(p01, { hideUi = true } = {}) {
      document.body.dataset.hideUi = hideUi ? 'true' : 'false';
      cameraRig.setLoadingProgress(p01);
      applyLoadingVisuals(p01);
      if (p01 > 0.68) lighting.bakeStaticShadows();
      renderAll();
    },
    setDiveTime(sec, { hideUi = true } = {}) {
      document.body.dataset.hideUi = hideUi ? 'true' : 'false';
      wireframeGroup.visible = false;
      solidWorldGroup.visible = true;
      lighting.setMaterializeProgress(1.0);
      cameraRig.setDiveTime(sec);
      lighting.update(0, 1.0, camera);
      renderAll();
    },
    goToPreset(presetKey, { hideUi = true } = {}) {
      document.body.dataset.hideUi = hideUi ? 'true' : 'false';
      wireframeGroup.visible = false;
      solidWorldGroup.visible = true;
      lighting.setMaterializeProgress(1.0);
      ui?.setActivePreset(presetKey);
      cameraRig.goToPreset(presetKey, true);
      lighting.update(0, 1.0, camera);
      renderAll();
    },
    setCamera(posArr, targetArr, { hideUi = true, fov = 44 } = {}) {
      document.body.dataset.hideUi = hideUi ? 'true' : 'false';
      wireframeGroup.visible = false;
      solidWorldGroup.visible = true;
      lighting.setMaterializeProgress(1.0);
      cameraRig.focusPose(posArr, targetArr, true, fov, posArr[1] > 8.5 ? 'mezzanine' : 'ground', 1.65);
      lighting.update(0, 1.0, camera);
      renderAll();
    },
    selectExhibit,
    getCameraState() {
      return {
        stage: cameraRig.getStage(),
        zone: cameraRig.getMoveZone(),
        loadProgress: +realLoadProgress.toFixed(3),
        position: camera.position.toArray().map((n) => +n.toFixed(3)),
        rotation: [camera.rotation.x, camera.rotation.y, camera.rotation.z].map((n) => +n.toFixed(3)),
        fov: +camera.fov.toFixed(1),
      };
    },
    getMetrics() {
      const texStats = textures.getStats();
      const sceneStats = postfx.getSceneStats();
      return {
        drawCalls: sceneStats.calls,
        triangles: sceneStats.triangles,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures,
        textureKB: texStats.totalKB,
        fps,
        stage: cameraRig.getStage(),
        loadProgress: +realLoadProgress.toFixed(3),
      };
    },
  };
}

init();
