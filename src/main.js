import * as THREE from 'three';
import { CENTERPIECE, PROJECTS } from './data.js';
import { createCathedralTextures } from './textures.js';
import { createCathedralMaterials } from './materials.js';
import { createFoundationComponent } from './foundation.js';
import { createGothicShellComponent } from './gothicShell.js';
import { createPortalDoorsComponent } from './portalDoors.js';
import { createVeiledPaintingComponent } from './veiledPainting.js';
import { createPedestalsComponent } from './pedestals.js';
import { createLightingComponent } from './lighting.js';
import { createCathedralPostFX } from './postfx.js';
import { createCameraController } from './camera.js';
import { createUIController } from './ui.js';

function showFallback() {
  const fb = document.getElementById('webgl-fallback');
  if (fb) fb.hidden = false;
}

function init() {
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
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.2, 260);

  const textures = createCathedralTextures(renderer);
  const mats = createCathedralMaterials(textures);

  const lighting = createLightingComponent(scene, renderer, mats);
  const foundation = createFoundationComponent(mats);
  const gothicShell = createGothicShellComponent(mats);
  const portalDoors = createPortalDoorsComponent(mats);
  const veiledPainting = createVeiledPaintingComponent(textures, mats);
  const pedestals = createPedestalsComponent(textures, mats);
  const postfx = createCathedralPostFX(renderer, window.innerWidth, window.innerHeight, currentDpr);

  scene.add(
    lighting.group,
    foundation.group,
    gothicShell.group,
    portalDoors.group,
    veiledPainting.group,
    pedestals.group
  );

  // Register every major object independently for future modification
  window.__CATHEDRAL_COMPONENTS__ = {
    foundation,
    gothicShell,
    portalDoors,
    veiledPainting,
    pedestals,
    lighting,
    postfx,
  };

  const exhibitOrder = [CENTERPIECE.id, ...PROJECTS.map((p) => p.id)];
  let activeExhibitId = null;
  let hoveredExhibitId = null;
  let scrollTourMode = false;
  let lastWheelStep = 0;

  let ui = null;
  const cameraRig = createCameraController(camera, canvas, {
    onIntroStep({ buildProgress, roadProgress, doorOpen, fogClarity, interiorBlend }) {
      foundation.setBuildProgress(buildProgress, roadProgress);
      gothicShell.setBuildProgress(buildProgress);
      portalDoors.setBuildProgress(buildProgress);
      veiledPainting.setBuildProgress(buildProgress);
      pedestals.setBuildProgress(buildProgress);
      lighting.setBuildProgress(buildProgress);
      portalDoors.setDoorOpen(doorOpen);
      const fogDensity = THREE.MathUtils.lerp(0.013, lighting.BASE_FOG_DENSITY, fogClarity);
      lighting.setFogDensity(fogDensity, interiorBlend);
    },
    onStageChange(stage) {
      ui?.setStage(stage);
      if (stage === 'explore') {
        lighting.bakeStaticShadows();
      }
    },
  });

  function selectExhibit(id) {
    activeExhibitId = id;
    pedestals.setActiveExhibit(activeExhibitId, hoveredExhibitId);
    if (!id) {
      ui?.closeExhibit();
      return;
    }
    ui?.showExhibit(id);
    if (id === CENTERPIECE.id) {
      cameraRig.focusPose(CENTERPIECE.camPos, CENTERPIECE.camTarget, false, 40);
    } else {
      const pose = pedestals.getExhibitFocusPose(id);
      if (pose) cameraRig.focusPose(pose.camPos, pose.camTarget, false, 40);
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

  ui = createUIController({
    pinAnchors: {
      ...pedestals.pinAnchors,
      [CENTERPIECE.id]: veiledPainting.pinAnchor,
    },
    onSelectExhibit: selectExhibit,
    onStepExhibit: stepExhibit,
    onResetGallery: () => {
      activeExhibitId = null;
      pedestals.setActiveExhibit(null, hoveredExhibitId);
      cameraRig.resetGalleryView(false);
    },
    onResetInterior: () => {
      activeExhibitId = null;
      pedestals.setActiveExhibit(null, hoveredExhibitId);
      cameraRig.resetInteriorView(false);
    },
    onResetExterior: () => {
      activeExhibitId = null;
      pedestals.setActiveExhibit(null, hoveredExhibitId);
      cameraRig.resetExteriorView(false);
    },
    onToggleScrollMode: () => {
      scrollTourMode = !scrollTourMode;
      ui?.syncScrollMode(scrollTourMode);
    },
    onReplayIntro: () => {
      activeExhibitId = null;
      pedestals.setActiveExhibit(null, null);
      cameraRig.startIntro();
    },
  });

  // Mouse wheel: smooth zoom OR step through exhibits when tour mode enabled
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

  // Raycasting for pedestal cloches & central veiled painting
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
  if (params.get('intro') === '0') {
    cameraRig.enterExplore(true);
  } else {
    cameraRig.startIntro();
  }

  function renderAll() {
    foundation.updateReflection(renderer, scene, camera);
    lighting.setSkyLinearOutput(true);
    postfx.render(scene, camera);
    lighting.setSkyLinearOutput(false);
    ui?.updatePins(
      camera,
      window.innerWidth,
      window.innerHeight,
      cameraRig.getStage() === 'explore' && document.body.dataset.hideUi !== 'true'
    );
  }

  lighting.bakeStaticShadows();
  renderer.compile(scene, camera);
  renderAll();
  window.__CATHEDRAL_READY__ = true;

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
    gothicShell.update(dt, elapsed, camera);
    portalDoors.update(dt, elapsed, camera);
    veiledPainting.update(dt, elapsed);
    pedestals.update(dt, elapsed);
    lighting.update(dt, elapsed);

    renderAll();
  }
  requestAnimationFrame(animate);

  window.__CATHEDRAL_DEBUG__ = {
    setCamera(posArr, targetArr, { hideUi = true, fov = 40 } = {}) {
      document.body.dataset.hideUi = hideUi ? 'true' : 'false';
      cameraRig.focusPose(posArr, targetArr, true, fov);
      gothicShell.update(1, performance.now() * 0.001, camera);
      portalDoors.update(1, performance.now() * 0.001, camera);
      veiledPainting.update(0, 0);
      pedestals.update(1, 0);
      lighting.bakeStaticShadows();
      renderAll();
    },
    setIntroProgress(t01, { hideUi = true } = {}) {
      document.body.dataset.hideUi = hideUi ? 'true' : 'false';
      cameraRig.setIntroProgress(t01);
      gothicShell.update(1, performance.now() * 0.001, camera);
      portalDoors.update(1, performance.now() * 0.001, camera);
      veiledPainting.update(0, 0);
      pedestals.update(1, 0);
      lighting.bakeStaticShadows();
      renderAll();
    },
    selectExhibit,
    getCameraState() {
      return {
        stage: cameraRig.getStage(),
        position: camera.position.toArray().map((n) => +n.toFixed(3)),
        fov: +camera.fov.toFixed(1),
        spherical: cameraRig.getSpherical(),
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
      };
    },
  };
}

init();
