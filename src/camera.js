import * as THREE from 'three';
import { smooth01 } from './geo.js';

const HERO_EXPLORE_POS = new THREE.Vector3(0.0, 3.25, 13.4);
const HERO_EXPLORE_TARGET = new THREE.Vector3(0.0, 2.75, -8.5);
const EXTERIOR_DIORAMA_POS = new THREE.Vector3(31.0, 22.0, 37.5);
const EXTERIOR_DIORAMA_TARGET = new THREE.Vector3(0.0, 6.4, 0.5);

export function createCameraController(camera, domElement, { onIntroStep, onStageChange }) {
  let stage = 'intro';
  let introElapsed = 0;
  let introFrozen = false;
  const INTRO_DURATION = 5.6;

  const target = HERO_EXPLORE_TARGET.clone();
  const desiredTarget = HERO_EXPLORE_TARGET.clone();
  const spherical = new THREE.Spherical();
  const desiredSpherical = new THREE.Spherical();

  function syncSpherical(posVec, tgtVec) {
    const off = posVec.clone().sub(tgtVec);
    spherical.setFromVector3(off);
    desiredSpherical.copy(spherical);
  }

  let tweenActive = false;
  let tweenElapsed = 0;
  const TWEEN_DURATION = 0.95;
  const tweenStartPos = new THREE.Vector3();
  const tweenEndPos = new THREE.Vector3();
  const tweenStartTgt = new THREE.Vector3();
  const tweenEndTgt = new THREE.Vector3();

  const introPosCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(24.0, 17.5, 56.0),
    new THREE.Vector3(16.0, 12.5, 42.0),
    new THREE.Vector3(4.5, 5.2, 26.5),
    new THREE.Vector3(0.0, 3.1, 19.6),
    HERO_EXPLORE_POS.clone(),
  ]);

  const introLookCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, 6.2, 4.0),
    new THREE.Vector3(0.0, 6.0, 6.0),
    new THREE.Vector3(0.0, 4.2, 12.0),
    new THREE.Vector3(0.0, 3.2, 4.0),
    HERO_EXPLORE_TARGET.clone(),
  ]);

  function applyIntroAt(t01) {
    const t = THREE.MathUtils.clamp(t01, 0, 1);
    const pos = introPosCurve.getPoint(t);
    const look = introLookCurve.getPoint(t);

    camera.position.copy(pos);
    camera.lookAt(look);

    const buildProgress = smooth01(0.0, 0.68, t);
    const doorOpen = smooth01(0.58, 0.86, t);
    const fogClarity = smooth01(0.0, 0.74, t);

    onIntroStep?.({ t, buildProgress, doorOpen, fogClarity });
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
    onIntroStep?.({ t: 1, buildProgress: 1, doorOpen: 1, fogClarity: 1 });
    onStageChange?.('explore');
    if (snap) {
      tweenActive = false;
      camera.position.copy(HERO_EXPLORE_POS);
      target.copy(HERO_EXPLORE_TARGET);
      desiredTarget.copy(HERO_EXPLORE_TARGET);
      syncSpherical(HERO_EXPLORE_POS, HERO_EXPLORE_TARGET);
      camera.lookAt(target);
    } else {
      focusPose(HERO_EXPLORE_POS.toArray(), HERO_EXPLORE_TARGET.toArray(), false);
    }
  }

  function focusPose(posArr, tgtArr, snap = false) {
    if (stage !== 'explore') {
      stage = 'explore';
      introFrozen = false;
      onIntroStep?.({ t: 1, buildProgress: 1, doorOpen: 1, fogClarity: 1 });
      onStageChange?.('explore');
    }
    const nextPos = new THREE.Vector3(...posArr);
    const nextTgt = new THREE.Vector3(...tgtArr);
    if (snap) {
      tweenActive = false;
      camera.position.copy(nextPos);
      target.copy(nextTgt);
      desiredTarget.copy(nextTgt);
      syncSpherical(nextPos, nextTgt);
      camera.lookAt(target);
      return;
    }
    tweenStartPos.copy(camera.position);
    tweenStartTgt.copy(target);
    tweenEndPos.copy(nextPos);
    tweenEndTgt.copy(nextTgt);
    tweenElapsed = 0;
    tweenActive = true;
  }

  function resetInteriorView(snap = false) {
    focusPose(HERO_EXPLORE_POS.toArray(), HERO_EXPLORE_TARGET.toArray(), snap);
  }

  function resetExteriorView(snap = false) {
    focusPose(EXTERIOR_DIORAMA_POS.toArray(), EXTERIOR_DIORAMA_TARGET.toArray(), snap);
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
          3.2,
          56.0
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
      desiredSpherical.phi = THREE.MathUtils.clamp(desiredSpherical.phi - dy * 0.0052, 0.24, 1.52);
    } else if (dragMode === 'pan') {
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      fwd.y = 0;
      if (fwd.lengthSq() > 0.001) fwd.normalize();
      const panScale = desiredSpherical.radius * 0.0014;
      desiredTarget.addScaledVector(right, -dx * panScale);
      desiredTarget.addScaledVector(fwd, dy * panScale);
      desiredTarget.x = THREE.MathUtils.clamp(desiredTarget.x, -9.0, 9.0);
      desiredTarget.z = THREE.MathUtils.clamp(desiredTarget.z, -16.0, 22.0);
      desiredTarget.y = THREE.MathUtils.clamp(desiredTarget.y, 0.8, 7.5);
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
    desiredSpherical.radius = THREE.MathUtils.clamp(desiredSpherical.radius + deltaY * 0.014, 3.2, 56.0);
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
          camera.position.copy(HERO_EXPLORE_POS);
          target.copy(HERO_EXPLORE_TARGET);
          desiredTarget.copy(HERO_EXPLORE_TARGET);
          syncSpherical(HERO_EXPLORE_POS, HERO_EXPLORE_TARGET);
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
