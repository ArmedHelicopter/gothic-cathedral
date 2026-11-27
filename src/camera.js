import * as THREE from 'three';
import { smooth01 } from './geo.js';

export const PRESETS = {
  sovereign: {
    id: 'sovereign',
    label: '晋见主位',
    pos: [0.0, 1.12, 10.8],
    target: [0.0, 4.95, -20.5],
    fov: 46,
    zone: 'ground',
    eyeH: 1.12,
  },
  masterpiece: {
    id: 'masterpiece',
    label: '主画近景',
    pos: [2.35, 3.35, -12.0],
    target: [0.0, 4.85, -20.5],
    fov: 42,
    zone: 'ground',
    eyeH: 1.65,
  },
  mezzanine: {
    id: 'mezzanine',
    label: '二楼俯瞰',
    pos: [0.0, 11.55, 11.68],
    target: [0.0, 4.10, -18.5],
    fov: 52,
    zone: 'mezzanine',
    eyeH: 2.35,
  },
  stainedGlass: {
    id: 'stainedGlass',
    label: '花窗光影',
    pos: [-7.6, 3.10, 8.8],
    target: [10.8, 10.0, -1.5],
    fov: 48,
    zone: 'ground',
    eyeH: 1.65,
  },
  spiralWell: {
    id: 'spiralWell',
    label: '螺旋阶梯',
    pos: [0.0, 3.05, 25.4],
    target: [0.0, 4.10, -4.0],
    fov: 56,
    zone: 'ground',
    eyeH: 1.65,
  },
};

function computeYawPitch(posVec, tgtVec) {
  const dx = tgtVec.x - posVec.x;
  const dy = tgtVec.y - posVec.y;
  const dz = tgtVec.z - posVec.z;
  const horiz = Math.hypot(dx, dz) || 1e-5;
  return {
    yaw: Math.atan2(-dx, -dz),
    pitch: THREE.MathUtils.clamp(Math.atan2(dy, horiz), -1.56, 1.25),
  };
}

function shortestAngleDiff(targetAngle, currentAngle) {
  let d = (targetAngle - currentAngle) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Sovereign FPV Camera Controller:
 * - Stage 1 ('loading'): Top-down stairwell view bound to real async load progress 0..1
 * - Stage 2 ('dive'): Exact 1.70s high-speed axial plunge through the 4.3m spiral shaft -> sharp late brake
 *   -> low-angle upward frame directly facing Central Masterpiece with back against staircase
 * - Stage 3 ('explore'): Damped WASD/Arrow free-roam (climbs 56-step spiral stairs <-> 2nd-floor Mezzanine)
 *   + Mouse-drag look + Preset Camera Lerps strictly confined inside enclosure by `collider`
 */
export function createCameraController(camera, domElement, collider, { onDiveStep, onStageChange }) {
  camera.rotation.order = 'YXZ';

  let stage = 'loading';
  let diveElapsed = 0;
  let diveFrozen = false;
  const DIVE_DURATION = 1.70;

  let yaw = 0;
  let pitch = -1.555;
  let targetYaw = 0;
  let targetPitch = -1.555;
  let desiredFov = 54;

  const roamPos = new THREE.Vector3(0.0, 15.6, 18.0);
  const vel = new THREE.Vector3();
  const moveState = { zone: 'ground', footY: 0.0, stairTheta: 0.24 * Math.PI };
  let eyeH = 1.08;
  let targetEyeH = 1.08;

  // Dive path through open vertical shaft (rWell=2.15) exiting smoothly under Y=5.15m North arch (z=13.65)
  const divePosCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, 15.6, 18.0),
    new THREE.Vector3(0.0, 10.4, 18.0),
    new THREE.Vector3(0.0, 5.2, 17.6),
    new THREE.Vector3(0.0, 2.25, 14.4),
    new THREE.Vector3(0.0, 1.32, 11.8),
    new THREE.Vector3(0.0, 1.12, 10.8),
  ]);
  const sovereignYP = computeYawPitch(
    new THREE.Vector3(...PRESETS.sovereign.pos),
    new THREE.Vector3(...PRESETS.sovereign.target)
  );

  // Preset Camera Transition Tween State
  let tweenActive = false;
  let tweenElapsed = 0;
  const TWEEN_DURATION = 1.15;
  let tweenCurve = null;
  let tweenStartYaw = 0;
  let tweenEndYaw = 0;
  let tweenStartPitch = 0;
  let tweenEndPitch = 0;
  let tweenStartFov = 44;
  let tweenEndFov = 44;
  let tweenEndZone = 'ground';
  let tweenEndEyeH = 1.65;

  function applyLoadingPose(p01) {
    const p = THREE.MathUtils.clamp(p01, 0, 1);
    camera.position.set(0.0, 16.0 - p * 0.4, 18.0);
    camera.rotation.set(-1.555, 0, 0);
    if (Math.abs(camera.fov - 54) > 0.05) {
      camera.fov = 54;
      camera.updateProjectionMatrix();
    }
    onDiveStep?.({ motionBlur: 0.0 });
  }

  function applyDiveAt(t01) {
    const u = THREE.MathUtils.clamp(t01, 0, 1);
    const pos = divePosCurve.getPoint(u);
    camera.position.copy(pos);

    // Pitch whips cleanly up from -1.555 rad straight down to +0.126 rad Sovereign upward gaze
    const whipT = smooth01(0.36, 0.96, u);
    const divePitch = THREE.MathUtils.lerp(-1.555, sovereignYP.pitch, whipT);
    camera.rotation.set(divePitch, 0, 0);

    // Dynamic FOV stretch during peak plunge then sharp compression into final framing
    const peakStretch = Math.sin(smooth01(0.02, 0.92, u) * Math.PI);
    const nextFov = THREE.MathUtils.lerp(54, 44, u) + peakStretch * 28.0;
    if (Math.abs(camera.fov - nextFov) > 0.05) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }

    const blur = Math.sin(smooth01(0.05, 0.90, u) * Math.PI) * 0.68;
    onDiveStep?.({ motionBlur: blur, u });
  }

  function setStage(next) {
    if (stage === next) return;
    stage = next;
    onStageChange?.(next);
  }

  function setLoadingProgress(p01) {
    setStage('loading');
    diveFrozen = false;
    tweenActive = false;
    applyLoadingPose(p01);
  }

  function startDive() {
    setStage('dive');
    diveElapsed = 0;
    diveFrozen = false;
    tweenActive = false;
    applyDiveAt(0);
  }

  function setDiveTime(sec) {
    setStage('dive');
    diveFrozen = true;
    tweenActive = false;
    diveElapsed = THREE.MathUtils.clamp(sec, 0, DIVE_DURATION);
    applyDiveAt(diveElapsed / DIVE_DURATION);
  }

  function finishDiveToExplore() {
    const sov = PRESETS.sovereign;
    roamPos.set(...sov.pos);
    moveState.zone = 'ground';
    moveState.footY = 0.0;
    moveState.stairTheta = 0.24 * Math.PI;
    eyeH = sov.eyeH;
    targetEyeH = sov.eyeH;
    yaw = sovereignYP.yaw;
    targetYaw = sovereignYP.yaw;
    pitch = sovereignYP.pitch;
    targetPitch = sovereignYP.pitch;
    desiredFov = sov.fov;
    vel.set(0, 0, 0);
    tweenActive = false;
    camera.position.copy(roamPos);
    camera.rotation.set(pitch, yaw, 0);
    camera.fov = desiredFov;
    camera.updateProjectionMatrix();
    onDiveStep?.({ motionBlur: 0.0 });
    setStage('explore');
  }

  function focusPose(posArr, targetArr, instant = false, fov = 44, endZone = 'ground', endEye = 1.65) {
    setStage('explore');
    const endPos = new THREE.Vector3(...posArr);
    const tgtVec = new THREE.Vector3(...targetArr);
    const endYP = computeYawPitch(endPos, tgtVec);
    onDiveStep?.({ motionBlur: 0.0 });

    if (instant) {
      tweenActive = false;
      roamPos.copy(endPos);
      moveState.zone = endZone;
      moveState.footY = endZone === 'mezzanine' ? 9.20 : 0.0;
      eyeH = endEye;
      targetEyeH = endEye;
      collider.resolvePosition(roamPos, moveState);
      yaw = endYP.yaw;
      targetYaw = endYP.yaw;
      pitch = endYP.pitch;
      targetPitch = endYP.pitch;
      desiredFov = fov;
      camera.position.copy(roamPos);
      camera.rotation.set(pitch, yaw, 0);
      camera.fov = desiredFov;
      camera.updateProjectionMatrix();
      return;
    }

    tweenActive = true;
    tweenElapsed = 0;
    tweenCurve = collider.buildSafeTweenCurve(roamPos, endPos);
    tweenStartYaw = yaw;
    tweenEndYaw = endYP.yaw;
    tweenStartPitch = pitch;
    tweenEndPitch = endYP.pitch;
    tweenStartFov = camera.fov;
    tweenEndFov = fov;
    tweenEndZone = endZone;
    tweenEndEyeH = endEye;
  }

  function goToPreset(presetKey, instant = false) {
    const p = PRESETS[presetKey] || PRESETS.sovereign;
    focusPose(p.pos, p.target, instant, p.fov, p.zone, p.eyeH);
    return p;
  }

  // Input listeners: Mouse Drag Look + WASD / Arrow Keys Free Roam
  const keys = new Set();
  let dragging = false;
  let downX = 0;
  let downY = 0;
  let prevX = 0;
  let prevY = 0;
  let movedDistance = 0;
  let lastWasClick = false;

  domElement.addEventListener('pointerdown', (e) => {
    if (stage !== 'explore') return;
    dragging = true;
    downX = prevX = e.clientX;
    downY = prevY = e.clientY;
    movedDistance = 0;
    domElement.setPointerCapture?.(e.pointerId);
  });

  window.addEventListener('pointermove', (e) => {
    if (!dragging || stage !== 'explore') return;
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    prevX = e.clientX;
    prevY = e.clientY;
    movedDistance += Math.hypot(dx, dy);
    if (Math.abs(dx) + Math.abs(dy) > 1.5) tweenActive = false;

    targetYaw += dx * 0.0038;
    targetPitch = THREE.MathUtils.clamp(targetPitch + dy * 0.0032, -1.22, 1.22);
  });

  window.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    lastWasClick = movedDistance < 6 && Math.hypot(e.clientX - downX, e.clientY - downY) < 6;
    domElement.releasePointerCapture?.(e.pointerId);
  });

  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    keys.add(e.code);
  });

  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
  });

  window.addEventListener('blur', () => {
    keys.clear();
    dragging = false;
  });

  function zoomBy(deltaY) {
    if (stage !== 'explore') return;
    desiredFov = THREE.MathUtils.clamp(desiredFov + deltaY * 0.016, 30, 62);
  }

  function update(dt) {
    if (stage === 'loading') return;

    if (stage === 'dive') {
      if (!diveFrozen) {
        diveElapsed += dt;
        const u = THREE.MathUtils.clamp(diveElapsed / DIVE_DURATION, 0, 1);
        applyDiveAt(u);
        if (diveElapsed >= DIVE_DURATION) {
          finishDiveToExplore();
        }
      }
      return;
    }

    // Explore Stage
    if (tweenActive && tweenCurve) {
      tweenElapsed += dt;
      const u = THREE.MathUtils.clamp(tweenElapsed / TWEEN_DURATION, 0, 1);
      const ease = u * u * u * (u * (u * 6 - 15) + 10);
      const pt = tweenCurve.getPoint(ease);
      roamPos.copy(pt);
      yaw = tweenStartYaw + shortestAngleDiff(tweenEndYaw, tweenStartYaw) * ease;
      pitch = THREE.MathUtils.lerp(tweenStartPitch, tweenEndPitch, ease);
      targetYaw = yaw;
      targetPitch = pitch;
      desiredFov = THREE.MathUtils.lerp(tweenStartFov, tweenEndFov, ease);

      camera.position.copy(roamPos);
      camera.rotation.set(pitch, yaw, 0);
      if (Math.abs(camera.fov - desiredFov) > 0.04) {
        camera.fov = desiredFov;
        camera.updateProjectionMatrix();
      }

      if (u >= 1) {
        tweenActive = false;
        moveState.zone = tweenEndZone;
        moveState.footY = tweenEndZone === 'mezzanine' ? 9.20 : 0.0;
        eyeH = tweenEndEyeH;
        targetEyeH = tweenEndEyeH;
      }
      return;
    }

    // Check WASD / Arrow movement
    const fwdIn = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
    const sideIn = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
    const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 1.55 : 1.0;

    const rotDamp = 1 - Math.exp(-dt * 14);
    yaw += shortestAngleDiff(targetYaw, yaw) * rotDamp;
    pitch += (targetPitch - pitch) * rotDamp;

    if (fwdIn !== 0 || sideIn !== 0) {
      targetEyeH = 1.65;
      const fwdX = -Math.sin(yaw);
      const fwdZ = -Math.cos(yaw);
      const rightX = Math.cos(yaw);
      const rightZ = -Math.sin(yaw);

      let wishX = fwdX * fwdIn + rightX * sideIn;
      let wishZ = fwdZ * fwdIn + rightZ * sideIn;
      const len = Math.hypot(wishX, wishZ) || 1;
      wishX /= len;
      wishZ /= len;

      const speed = 6.2 * sprint;
      const accelDamp = 1 - Math.exp(-dt * 10);
      vel.x += (wishX * speed - vel.x) * accelDamp;
      vel.z += (wishZ * speed - vel.z) * accelDamp;
    } else {
      const decelDamp = 1 - Math.exp(-dt * 12);
      vel.x *= 1 - decelDamp;
      vel.z *= 1 - decelDamp;
    }

    eyeH += (targetEyeH - eyeH) * (1 - Math.exp(-dt * 7));
    roamPos.x += vel.x * dt;
    roamPos.z += vel.z * dt;
    collider.resolvePosition(roamPos, moveState);
    roamPos.y = Math.min(23.5, moveState.footY + eyeH);

    camera.position.copy(roamPos);
    camera.rotation.set(pitch, yaw, 0);

    if (Math.abs(camera.fov - desiredFov) > 0.04) {
      camera.fov += (desiredFov - camera.fov) * (1 - Math.exp(-dt * 10));
      camera.updateProjectionMatrix();
    }
  }

  return {
    getStage: () => stage,
    getMoveZone: () => moveState.zone,
    wasClick: () => lastWasClick,
    setLoadingProgress,
    startDive,
    setDiveTime,
    finishDiveToExplore,
    goToPreset,
    focusPose,
    zoomBy,
    update,
  };
}
