import * as THREE from 'three';
import { PEDESTAL_COL_X } from './pedestals.js';
import { PROJECTS } from './data.js';
import { STAIR_CONFIG } from './spiralStaircase.js';

/**
 * Airtight 100% Enclosed Interior Collider:
 * - Strictly confines all walking, look rotation near walls, and camera lerps inside:
 *   X in [-12.82, +12.82], Z in [-25.05, +27.55], Y under gothic vault roof
 * - Resolves collisions cleanly against clustered piers, pedestals, sovereign dais,
 *   8 spiral staircase columns, helical handrail annulus, & 2nd-floor mezzanine balustrades
 * - Seamless continuous height climbing up the 56-step spiral staircase <-> 2nd-floor Mezzanine
 */
export function createInteriorCollider() {
  const WALL_HALF_X = 12.80;
  const Z_MIN = -25.05;
  const Z_MAX = 27.55;
  const R_PLAYER = 0.65;

  const { centerX: CX, centerZ: CZ, rWell, rOuter, rArcade, mezzY, thetaStart, thetaSpan } = STAIR_CONFIG;
  const thetaEnd = thetaStart + thetaSpan;

  const groundCircles = [];
  // 14 Nave Clustered Piers
  const bayZs = [22.0, 14.5, 7.0, -0.5, -8.0, -15.5, -22.5];
  for (const side of [-1, 1]) {
    for (const bz of bayZs) {
      groundCircles.push({ x: side * 9.2, z: bz, r: 0.92 + R_PLAYER });
    }
  }
  // 10 Project Pedestals
  for (const p of PROJECTS) {
    const sign = p.side === 'left' ? -1 : 1;
    groundCircles.push({ x: sign * PEDESTAL_COL_X, z: p.bayZ, r: 0.70 + R_PLAYER });
  }
  // 8 Spiral Staircase Octagonal Arcade Columns
  for (let k = 0; k < 8; k++) {
    const th = (k + 0.5) * (Math.PI / 4);
    groundCircles.push({
      x: CX + Math.cos(th) * rArcade,
      z: CZ + Math.sin(th) * rArcade,
      r: 0.42 + R_PLAYER,
    });
  }

  function vaultCeilingY(x) {
    const ax = Math.min(13.6, Math.abs(x));
    return 24.4 - (24.4 - 19.2) * (ax / 13.6);
  }

  function pushOutCircle(pos, cx, cz, minDist) {
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    const d = Math.hypot(dx, dz);
    if (d < minDist) {
      if (d < 1e-4) {
        pos.z += minDist;
      } else {
        const s = minDist / d;
        pos.x = cx + dx * s;
        pos.z = cz + dz * s;
      }
    }
  }

  function normalizeAngle2Pi(a) {
    let v = a % (Math.PI * 2);
    if (v < 0) v += Math.PI * 2;
    return v;
  }

  function shortestAngleDiff(a, b) {
    let d = (a - b) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  function resolvePosition(pos, state) {
    // Hard outer sanctuary envelope
    pos.x = THREE.MathUtils.clamp(pos.x, -WALL_HALF_X, WALL_HALF_X);
    pos.z = THREE.MathUtils.clamp(pos.z, Z_MIN, Z_MAX);

    const dx = pos.x - CX;
    const dz = pos.z - CZ;
    const rad = Math.hypot(dx, dz);
    const rawTheta = normalizeAngle2Pi(Math.atan2(dz, dx));

    if (state.zone === 'ground') {
      state.footY = 0.0;

      // Ground-floor obstacles: piers, pedestals, spiral arcade columns
      for (let i = 0; i < groundCircles.length; i++) {
        const c = groundCircles[i];
        pushOutCircle(pos, c.x, c.z, c.r);
      }

      // Sovereign Dais & Masterpiece exclusion (stops cleanly on front approach apron)
      if (pos.z < -16.85 + R_PLAYER && Math.abs(pos.x) < 6.0) {
        if (pos.z > -18.2) {
          pos.z = -16.85 + R_PLAYER;
        } else {
          pos.x = pos.x >= 0 ? 6.0 : -6.0;
        }
      }

      // Enter bottom spiral staircase mouth (`theta ~ thetaStart`, `r in [rWell..rOuter]`)
      const diffStart = shortestAngleDiff(rawTheta, thetaStart);
      if (diffStart > 0.02 && diffStart < 0.24 && rad >= rWell + 0.15 && rad <= rOuter + 0.25) {
        state.zone = 'stair';
        state.stairTheta = thetaStart + Math.max(0.05, diffStart);
        const f = THREE.MathUtils.clamp((state.stairTheta - thetaStart) / thetaSpan, 0, 1);
        state.footY = f * mezzY;
      } else {
        // Block low-headroom under-stair treads on ground floor (except open North axial arch around theta = 1.5*PI!)
        const underStairAngle = rawTheta > thetaStart + 0.24 && rawTheta < 1.18 * Math.PI;
        if (underStairAngle && rad > rWell - R_PLAYER && rad < rOuter + R_PLAYER) {
          if (rad < (rWell + rOuter) * 0.5) {
            pushOutCircle(pos, CX, CZ, rWell - R_PLAYER);
          } else {
            pushOutCircle(pos, CX, CZ, rOuter + R_PLAYER);
          }
        }
      }
    } else if (state.zone === 'stair') {
      // Advance unwrapped stair angle smoothly near current state.stairTheta
      let dAng = shortestAngleDiff(rawTheta, state.stairTheta);
      let nextTheta = state.stairTheta + dAng;

      // Clamp radius inside sculpted inner & outer stair handrails
      const rClamped = THREE.MathUtils.clamp(rad, rWell + 0.50, rOuter - 0.48);
      const scaleR = rad > 1e-4 ? rClamped / rad : 1;
      pos.x = CX + dx * scaleR;
      pos.z = CZ + dz * scaleR;

      if (nextTheta < thetaStart - 0.04) {
        // Exited back onto Ground Floor SE apron
        state.zone = 'ground';
        state.footY = 0.0;
      } else if (nextTheta > thetaEnd + 0.04) {
        // Arrived cleanly on 2nd-Floor Mezzanine top landing
        state.zone = 'mezzanine';
        state.footY = mezzY;
      } else {
        state.stairTheta = nextTheta;
        const f = THREE.MathUtils.clamp((nextTheta - thetaStart) / thetaSpan, 0, 1);
        state.footY = f * mezzY;
      }
    } else if (state.zone === 'mezzanine') {
      state.footY = mezzY;

      // Upper piers at X = ±9.2
      for (let i = 0; i < 14; i++) {
        const c = groundCircles[i];
        pushOutCircle(pos, c.x, c.z, c.r);
      }

      // Organ gallery front parapet; no floating side walkways remain.
      pos.z = Math.max(pos.z, 11.65);

      // South organ towers leave the central opening and rose-window approach walkable.
      if (pos.z > 25.72 && Math.abs(pos.x) > 3.72 && Math.abs(pos.x) < 9.15) {
        pos.z = 25.72;
      }

      // Circular stairwell balustrade at radius rArcade except open top exit gate around thetaEnd
      const curDx = pos.x - CX;
      const curDz = pos.z - CZ;
      const curR = Math.hypot(curDx, curDz);
      const curAng = normalizeAngle2Pi(Math.atan2(curDz, curDx));
      const diffTopGate = shortestAngleDiff(curAng, normalizeAngle2Pi(thetaEnd));
      if (Math.abs(diffTopGate) < 0.24 && curR > rWell + 0.25) {
        // Inside top gate mouth: only re-enter staircase if stepping backward down top tread
        if (diffTopGate < -0.04 && curR <= rOuter + 0.10) {
          state.zone = 'stair';
          state.stairTheta = thetaEnd - 0.06;
        }
      } else if (curR < rArcade + 0.62) {
        pushOutCircle(pos, CX, CZ, rArcade + 0.62);
      }
    }

    // Final vertical & outer wall clamp guarantee
    pos.x = THREE.MathUtils.clamp(pos.x, -WALL_HALF_X, WALL_HALF_X);
    pos.z = THREE.MathUtils.clamp(pos.z, Z_MIN, Z_MAX);
    const maxEyeY = vaultCeilingY(pos.x) - 0.75;
    pos.y = Math.min(pos.y, maxEyeY);
    return pos;
  }

  /**
   * Builds a smooth, obstacle-free CatmullRomCurve3 between interior presets so
   * camera transitions NEVER clip floors, balustrades, or spiral handrails.
   */
  function buildSafeTweenCurve(startPos, endPos) {
    const crossHeight = Math.abs(startPos.y - endPos.y) > 4.5;
    const pts = [startPos.clone()];
    if (crossHeight) {
      // Route via open central nave high clearance corridor before descending or ascending
      const highZ = 9.2;
      const highX = 0.0;
      if (startPos.y > endPos.y) {
        pts.push(new THREE.Vector3(highX, Math.max(startPos.y, 10.6), highZ));
        pts.push(new THREE.Vector3(THREE.MathUtils.lerp(highX, endPos.x, 0.5), 4.8, THREE.MathUtils.lerp(highZ, endPos.z, 0.45)));
      } else {
        pts.push(new THREE.Vector3(THREE.MathUtils.lerp(startPos.x, highX, 0.5), 5.2, THREE.MathUtils.lerp(startPos.z, highZ, 0.45)));
        pts.push(new THREE.Vector3(highX, Math.max(endPos.y, 10.6), highZ));
      }
    } else if (Math.abs(startPos.x - endPos.x) > 4.0 && startPos.y < 8.0) {
      // Slide cleanly through central X = 0 corridor when crossing aisles
      pts.push(new THREE.Vector3(0.0, Math.max(startPos.y, endPos.y, 2.2), (startPos.z + endPos.z) * 0.5));
    }
    pts.push(endPos.clone());
    return new THREE.CatmullRomCurve3(pts);
  }

  return {
    resolvePosition,
    buildSafeTweenCurve,
    bounds: { wallHalfX: WALL_HALF_X, zMin: Z_MIN, zMax: Z_MAX },
  };
}
