import * as THREE from 'three';
import { smooth01 } from './geo.js';

// Primary 2.5D Gallery Cutaway Overview framing ALL 10 project cloches, carpet, & central veiled painting cleanly!
const GALLERY_OVERVIEW_POS = new THREE.Vector3(15.2, 13.2, 19.2);
const GALLERY_OVERVIEW_TARGET = new THREE.Vector3(0.0, 2.05, -0.6);
const GALLERY_FOV = 45;

// Sacred Cerulean Axial Sanctuary Carpet View (comfortable clearance under top vault rib apex)
const HERO_EXPLORE_POS = new THREE.Vector3(0.0, 2.85, 13.4);
const HERO_EXPLORE_TARGET = new THREE.Vector3(0.0, 2.85, -11.5);
const AXIAL_FOV = 44;

// Wide Genshin-approach FOV during bridge paving walk so BOTH road slabs & full spires sit clearly inside!
const INTRO_WALK_FOV = 56;

// 3/4 Exterior Gothic Cathedral Diorama View
const EXTERIOR_DIORAMA_POS = new THREE.Vector3(38.0, 22.0, 44.0);
const EXTERIOR_DIORAMA_TARGET = new THREE.Vector3(0.0, 5.8, 6.0);
const EXTERIOR_FOV = 40;

export function createCameraController(camera, domElement, { onIntroStep, onStageChange }) {
  let stage = 'intro';
  let introElapsed = 0;
  let introFrozen = false;
  const INTRO_DURATION = 6.6;

  const target = GALLERY_OVERVIEW_TARGET.clone();
  const desiredTarget = GALLERY_OVERVIEW_TARGET.clone();
  const spherical = new THREE.Spherical();
  const desiredSpherical = new THREE.Spherical();
  let desiredFov = GALLERY_FOV;

  function syncSpherical(posVec, tgtVec) {
    const off = posVec.clone().sub(tgtVec);
    spherical.setFromVector3(off);
    desiredSpherical.copy(spherical);
  }

  let tweenActive = false;
  let tweenElapsed = 0;
  const TWEEN_DURATION = 1.0;
  const tweenStartPos = new THREE.Vector3();
  const tweenEndPos = new THREE.Vector3();
  const tweenStartTgt = new THREE.Vector3();
  const tweenEndTgt = new THREE.Vector3();
  let tweenStartFov = GALLERY_FOV;
  let tweenEndFov = GALLERY_FOV;

  // Strictly centered X = 0.0 straight Genshin-style axial walk: sees forward rising stone bridge AND full clear-sky cathedral spires!
  const walkPosCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, 4.8, 62.0),
    new THREE.Vector3(0.0, 4.3, 50.0),
    new THREE.Vector3(0.0, 3.6, 30.0),
    new THREE.Vector3(0.0, 2.85, 14.0),
  ]);

  const walkLookCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, 7.6, 16.0),
    new THREE.Vector3(0.0, 7.3, 13.0),
    new THREE.Vector3(0.0, 3.8, 0.0),
    new THREE.Vector3(0.0, 2.85, -10.5),
  ]);

  function applyIntroAt(t01) {
    const t = THREE.MathUtils.clamp(t01, 0, 1);

    if (t <= 0.82) {
      const wt = t / 0.82;
      const pos = walkPosCurve.getPoint(wt);
      const look = walkLookCurve.getPoint(wt);
      camera.position.copy(pos);
      camera.lookAt(look);
      const wfov = THREE.MathUtils.lerp(INTRO_WALK_FOV, AXIAL_FOV, smooth01(0.45, 0.95, wt));
      if (Math.abs(camera.fov - wfov) > 0.02) {
        camera.fov = wfov;
        camera.updateProjectionMatrix();
      }
    } else {
      // Smooth reveal lift from the nave carpet up into the unobstructed 2.5D Gallery Overview
      const gt = smooth01(0.82, 1.0, t);
      const walkEndPos = walkPosCurve.getPoint(1);
      const walkEndLook = walkLookCurve.getPoint(1);
      camera.position.lerpVectors(walkEndPos, GALLERY_OVERVIEW_POS, gt);
      const look = new THREE.Vector3().lerpVectors(walkEndLook, GALLERY_OVERVIEW_TARGET, gt);
      camera.lookAt(look);
      const nextFov = THREE.MathUtils.lerp(AXIAL_FOV, GALLERY_FOV, gt);
      if (Math.abs(camera.fov - nextFov) > 0.02) {
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
      }
    }

    const buildProgress = smooth01(0.0, 0.50, t);
    const roadProgress = smooth01(0.0, 0.54, t);
    const doorOpen = smooth01(0.48, 0.74, t);
    const fogClarity = smooth01(0.04, 0.78, t);
    const interiorBlend = smooth01(0.68, 0.90, t);

    onIntroStep?.({ t, buildProgress, roadProgress, doorOpen, fogClarity, interiorBlend });
  }

  function startIntro() {
    stage = 'intro';
    introElapsed = 0;
    introFrozen = false;
    tweenActive = false;
    onStageChange?.('intro');
    applyIntroAt(0);
  }

  function setIntroProgress(t01) {
    stage = 'intro';
    introFrozen = true;
    tweenActive = false;
    introElapsed = THREE.MathUtils.clamp(t01, 0, 1) * INTRO_DURATION;
    onStageChange?.('intro');
    applyIntroAt(t01);
  }

  function enterExplore(snap = false) {
    stage = 'explore';
    introFrozen = false;
    onIntroStep?.({
      t: 1,
      buildProgress: 1,
      roadProgress: 1,
      doorOpen: 1,
      fogClarity: 1,
      interiorBlend: 1,
    });
    onStageChange?.('explore');
    if (snap) {
      tweenActive = false;
      camera.position.copy(GALLERY_OVERVIEW_POS);
      target.copy(GALLERY_OVERVIEW_TARGET);
      desiredTarget.copy(GALLERY_OVERVIEW_TARGET);
      syncSpherical(GALLERY_OVERVIEW_POS, GALLERY_OVERVIEW_TARGET);
      camera.fov = GALLERY_FOV;
      desiredFov = GALLERY_FOV;
      camera.updateProjectionMatrix();
      camera.lookAt(target);
    } else {
      focusPose(GALLERY_OVERVIEW_POS.toArray(), GALLERY_OVERVIEW_TARGET.toArray(), false, GALLERY_FOV);
    }
  }

  function focusPose(posArr, tgtArr, snap = false, fov = 40) {
    if (stage !== 'explore') {
      stage = 'explore';
      introFrozen = false;
      onIntroStep?.({
        t: 1,
        buildProgress: 1,
        roadProgress: 1,
        doorOpen: 1,
        fogClarity: 1,
        interiorBlend: 1,
      });
      onStageChange?.('explore');
    }
    const nextPos = new THREE.Vector3(...posArr);
    const nextTgt = new THREE.Vector3(...tgtArr);
    desiredFov = fov;
    if (snap) {
      tweenActive = false;
      camera.position.copy(nextPos);
      target.copy(nextTgt);
      desiredTarget.copy(nextTgt);
      syncSpherical(nextPos, nextTgt);
      if (Math.abs(camera.fov - fov) > 0.02) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      camera.lookAt(target);
      return;
    }
    tweenStartPos.copy(camera.position);
    tweenStartTgt.copy(target);
    tweenEndPos.copy(nextPos);
    tweenEndTgt.copy(nextTgt);
    tweenStartFov = camera.fov;
    tweenEndFov = fov;
    tweenElapsed = 0;
    tweenActive = true;
  }

  function resetGalleryView(snap = false) {
    focusPose(GALLERY_OVERVIEW_POS.toArray(), GALLERY_OVERVIEW_TARGET.toArray(), snap, GALLERY_FOV);
  }

  function resetInteriorView(snap = false) {
    focusPose(HERO_EXPLORE_POS.toArray(), HERO_EXPLORE_TARGET.toArray(), snap, AXIAL_FOV);
  }

  function resetExteriorView(snap = false) {
    focusPose(EXTERIOR_DIORAMA_POS.toArray(), EXTERIOR_DIORAMA_TARGET.toArray(), snap, EXTERIOR_FOV);
  }

  const activePointers = new Map();
  let dragMode = null;
  let prevDrag = { x: 0, y: 0 };
  let lastPinchDist = null;
  let movedDist = 0;

  function onPointerDown(e) {
    if (stage === 'intro') {
      enterExplore(false);
    }
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.size === 1) {
      dragMode = e.button === 2 || e.shiftKey ? 'pan' : 'orbit';
      prevDrag = { x: e.clientX, y: e.clientY };
      movedDist = 0;
    }
    lastPinchDist = null;
  }

  function onPointerMove(e) {
    if (stage !== 'explore') return;
    if (activePointers.has(e.pointerId)) {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    if (activePointers.size === 2) {
      const pts = Array.from(activePointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (lastPinchDist !== null) {
        desiredSpherical.radius = THREE.MathUtils.clamp(
          desiredSpherical.radius + (lastPinchDist - dist) * 0.06,
          2.8,
          62.0
        );
      }
      lastPinchDist = dist;
      tweenActive = false;
      return;
    }
    if (!dragMode) return;
    const dx = e.clientX - prevDrag.x;
    const dy = e.clientY - prevDrag.y;
    movedDist += Math.hypot(dx, dy);
    prevDrag = { x: e.clientX, y: e.clientY };

    if (dragMode === 'orbit') {
      desiredSpherical.theta -= dx * 0.0062;
      desiredSpherical.phi = THREE.MathUtils.clamp(desiredSpherical.phi - dy * 0.0052, 0.22, 1.52);
    } else if (dragMode === 'pan') {
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      fwd.y = 0;
      if (fwd.lengthSq() > 0.001) fwd.normalize();
      const panScale = desiredSpherical.radius * 0.0014;
      desiredTarget.addScaledVector(right, -dx * panScale);
      desiredTarget.addScaledVector(fwd, dy * panScale);
      desiredTarget.x = THREE.MathUtils.clamp(desiredTarget.x, -10.0, 10.0);
      desiredTarget.z = THREE.MathUtils.clamp(desiredTarget.z, -16.0, 22.0);
      desiredTarget.y = THREE.MathUtils.clamp(desiredTarget.y, 0.8, 8.0);
    }
    tweenActive = false;
  }

  function onPointerUp(e) {
    activePointers.delete(e.pointerId);
    if (activePointers.size < 2) lastPinchDist = null;
    if (activePointers.size === 0) dragMode = null;
  }

  function zoomBy(deltaY) {
    if (stage === 'intro') {
      enterExplore(false);
    }
    desiredSpherical.radius = THREE.MathUtils.clamp(desiredSpherical.radius + deltaY * 0.014, 2.8, 62.0);
    tweenActive = false;
  }

  function onContextMenu(e) {
    e.preventDefault();
  }

  domElement.addEventListener('pointerdown', onPointerDown);
  domElement.addEventListener('pointermove', onPointerMove);
  domElement.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  function update(dt) {
    if (stage === 'intro') {
      if (!introFrozen) {
        introElapsed += dt;
        const rawT = Math.min(1, introElapsed / INTRO_DURATION);
        applyIntroAt(rawT);
        if (rawT >= 1) {
          stage = 'explore';
          camera.position.copy(GALLERY_OVERVIEW_POS);
          target.copy(GALLERY_OVERVIEW_TARGET);
          desiredTarget.copy(GALLERY_OVERVIEW_TARGET);
          syncSpherical(GALLERY_OVERVIEW_POS, GALLERY_OVERVIEW_TARGET);
          camera.fov = GALLERY_FOV;
          desiredFov = GALLERY_FOV;
          camera.updateProjectionMatrix();
          camera.lookAt(target);
          onStageChange?.('explore');
        }
      }
      return;
    }

    if (tweenActive) {
      tweenElapsed += dt;
      const raw = Math.min(1, tweenElapsed / TWEEN_DURATION);
      const e = raw * raw * raw * (raw * (raw * 6 - 15) + 10);
      camera.position.lerpVectors(tweenStartPos, tweenEndPos, e);
      target.lerpVectors(tweenStartTgt, tweenEndTgt, e);
      desiredTarget.copy(target);
      syncSpherical(camera.position, target);
      const curFov = THREE.MathUtils.lerp(tweenStartFov, tweenEndFov, e);
      if (Math.abs(camera.fov - curFov) > 0.02) {
        camera.fov = curFov;
        camera.updateProjectionMatrix();
      }
      camera.lookAt(target);
      if (raw >= 1) tweenActive = false;
      return;
    }

    const damp = Math.min(1, dt * 8.5);
    spherical.theta += (desiredSpherical.theta - spherical.theta) * damp;
    spherical.phi += (desiredSpherical.phi - spherical.phi) * damp;
    spherical.radius += (desiredSpherical.radius - spherical.radius) * damp;
    target.lerp(desiredTarget, damp);

    const offset = new THREE.Vector3().setFromSpherical(spherical);
    camera.position.copy(target).add(offset);
    if (camera.position.y < 0.72) {
      camera.position.y = 0.72;
    }
    if (Math.abs(camera.fov - desiredFov) > 0.04) {
      camera.fov += (desiredFov - camera.fov) * damp;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(target);
  }

  function dispose() {
    domElement.removeEventListener('pointerdown', onPointerDown);
    domElement.removeEventListener('pointermove', onPointerMove);
    domElement.removeEventListener('contextmenu', onContextMenu);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
  }

  return {
    startIntro,
    setIntroProgress,
    enterExplore,
    focusPose,
    resetGalleryView,
    resetInteriorView,
    resetExteriorView,
    zoomBy,
    wasClick: () => movedDist < 6,
    getStage: () => stage,
    getSpherical: () => ({
      theta: +spherical.theta.toFixed(4),
      phi: +spherical.phi.toFixed(4),
      radius: +spherical.radius.toFixed(3),
    }),
    update,
    dispose,
  };
}
