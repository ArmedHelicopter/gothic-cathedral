import * as THREE from 'three';
import { mergeClean, xform } from './geo.js';
import { MAGPIE_SVG_PATH } from './textures.js';

/**
 * Parses an SVG `M`/`C`/`Z` path into centered `THREE.Shape` loops for true 3D extrusion.
 */
function parseSvgShapes(pathStr, scale = 0.0086, cx = 22.0, cy = 22.0) {
  const tokens = pathStr.match(/[MCZ]|-?\d*\.?\d+/g) || [];
  const shapes = [];
  let current = null;
  let cmd = '';
  let i = 0;
  const tx = (x) => (x - cx) * scale;
  const ty = (y) => (cy - y) * scale;

  while (i < tokens.length) {
    const tk = tokens[i];
    if (tk === 'M' || tk === 'C' || tk === 'Z') {
      cmd = tk;
      i++;
      if (cmd === 'Z' && current) {
        current.closePath();
        shapes.push(current);
        current = null;
      }
      continue;
    }
    if (cmd === 'M') {
      const x = parseFloat(tokens[i++]);
      const y = parseFloat(tokens[i++]);
      current = new THREE.Shape();
      current.moveTo(tx(x), ty(y));
    } else if (cmd === 'C' && current) {
      const x1 = parseFloat(tokens[i++]);
      const y1 = parseFloat(tokens[i++]);
      const x2 = parseFloat(tokens[i++]);
      const y2 = parseFloat(tokens[i++]);
      const x3 = parseFloat(tokens[i++]);
      const y3 = parseFloat(tokens[i++]);
      current.bezierCurveTo(tx(x1), ty(y1), tx(x2), ty(y2), tx(x3), ty(y3));
    } else {
      i++;
    }
  }
  if (current) {
    current.closePath();
    shapes.push(current);
  }
  return shapes;
}

function extrudeCentered(shape, depth = 0.05, curveSegments = 12) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 2,
    curveSegments,
  });
  geo.translate(0, 0, -depth * 0.5);
  return geo;
}

/**
 * Builds an authentic sculpted 3D miniature icon for each project (ZERO sticker cubes!).
 * Returns a Group containing max 2 merged meshes (bright alabaster/silver + deep sapphire/obsidian) + delicate mount pin.
 */
export function createProjectIconSculpture(iconKind, mats) {
  const lightGeos = [];
  const darkGeos = [];
  const silverGeos = [];

  // Slender mounting pin resting cleanly onto the navy velvet cushion
  const pin = new THREE.CylinderGeometry(0.011, 0.017, 0.14, 10);
  xform(pin, [0, -0.22, 0]);
  silverGeos.push(pin);

  switch (iconKind) {
    case 'magpie-real': {
      // Exact 3D extruded Magpie SVG bird silhouette gracefully framed inside wider silver orbital ring (zero overlap!)
      const shapes = parseSvgShapes(MAGPIE_SVG_PATH, 0.0072, 21.5, 22.0);
      if (shapes.length > 0) {
        lightGeos.push(extrudeCentered(shapes[0], 0.048, 10));
        for (let k = 1; k < shapes.length; k++) {
          const accent = extrudeCentered(shapes[k], 0.056, 8);
          darkGeos.push(accent);
        }
      }
      const haloRing = new THREE.TorusGeometry(0.228, 0.012, 8, 32);
      xform(haloRing, [0, 0.0, 0], [0.14, 0.22, 0]);
      silverGeos.push(haloRing);
      break;
    }

    case 'claude-switcher-real': {
      // 3D Heraldic Shield with proud opposing dual swap arrows front & back
      const shield = new THREE.Shape();
      shield.moveTo(0, 0.175);
      shield.bezierCurveTo(-0.07, 0.16, -0.14, 0.14, -0.16, 0.12);
      shield.lineTo(-0.16, -0.02);
      shield.bezierCurveTo(-0.16, -0.10, -0.07, -0.155, 0, -0.185);
      shield.bezierCurveTo(0.07, -0.155, 0.16, -0.10, 0.16, -0.02);
      shield.lineTo(0.16, 0.12);
      shield.bezierCurveTo(0.14, 0.14, 0.07, 0.16, 0, 0.175);
      shield.closePath();
      darkGeos.push(extrudeCentered(shield, 0.055, 14));

      for (const zDir of [1, -1]) {
        const zOff = zDir * 0.036;
        const barA = new THREE.BoxGeometry(0.14, 0.028, 0.018);
        xform(barA, [-0.02 * zDir, 0.045, zOff]);
        const headA = new THREE.ConeGeometry(0.036, 0.06, 3);
        xform(headA, [0.068 * zDir, 0.045, zOff], [Math.PI / 2, 0, -Math.PI / 2 * zDir]);
        const barB = new THREE.BoxGeometry(0.14, 0.028, 0.018);
        xform(barB, [0.02 * zDir, -0.045, zOff]);
        const headB = new THREE.ConeGeometry(0.036, 0.06, 3);
        xform(headB, [-0.068 * zDir, -0.045, zOff], [Math.PI / 2, 0, Math.PI / 2 * zDir]);
        lightGeos.push(barA, headA, barB, headB);
      }
      break;
    }

    case 'sivtr-real': {
      // 3D Rounded Navy Obsidian Memory Slate with 4 raised Alabaster & Silver horizontal rows front & back
      const slate = new THREE.BoxGeometry(0.28, 0.30, 0.055);
      darkGeos.push(slate);
      const border = new THREE.BoxGeometry(0.30, 0.32, 0.035);
      silverGeos.push(border);

      const barSpecs = [
        { y: 0.085, w: 0.095, xOff: -0.055, light: true },
        { y: 0.028, w: 0.195, xOff: -0.005, light: false },
        { y: -0.028, w: 0.145, xOff: -0.030, light: true },
        { y: -0.085, w: 0.175, xOff: -0.015, light: false },
      ];
      for (const zDir of [1, -1]) {
        for (const bs of barSpecs) {
          const row = new THREE.BoxGeometry(bs.w, 0.032, 0.018);
          xform(row, [bs.xOff * zDir, bs.y, zDir * 0.034]);
          if (bs.light) lightGeos.push(row);
          else silverGeos.push(row);
        }
      }
      break;
    }

    case 'easycliproxy-real': {
      // 3D 4-Point Astroid Spark Star interlocked with a tilted 3D Hexagonal Silver Ring
      const star = new THREE.Shape();
      star.moveTo(0, 0.19);
      star.quadraticCurveTo(0.042, 0.042, 0.19, 0);
      star.quadraticCurveTo(0.042, -0.042, 0, -0.19);
      star.quadraticCurveTo(-0.042, -0.042, -0.19, 0);
      star.quadraticCurveTo(-0.042, 0.042, 0, 0.19);
      star.closePath();
      lightGeos.push(extrudeCentered(star, 0.046, 12));

      const hexRing = new THREE.TorusGeometry(0.14, 0.016, 8, 6);
      xform(hexRing, [0, 0, 0], [0.42, 0.25, 0]);
      silverGeos.push(hexRing);

      const centerGem = new THREE.OctahedronGeometry(0.052, 0);
      darkGeos.push(centerGem);
      break;
    }

    case 'whu-archway-real': {
      // Miniature 3D 4-Pillar WHU Stone Archway (国立武汉大学牌坊)
      for (const px of [-0.145, -0.055, 0.055, 0.145]) {
        const col = new THREE.BoxGeometry(0.028, 0.24, 0.034);
        xform(col, [px, -0.02, 0]);
        lightGeos.push(col);
      }
      const lowerLintel = new THREE.BoxGeometry(0.34, 0.032, 0.048);
      xform(lowerLintel, [0, 0.05, 0]);
      const midBeam = new THREE.BoxGeometry(0.16, 0.036, 0.044);
      xform(midBeam, [0, 0.10, 0]);
      const plinth = new THREE.BoxGeometry(0.36, 0.024, 0.075);
      xform(plinth, [0, -0.14, 0]);
      lightGeos.push(lowerLintel, midBeam, plinth);

      const topRoof = new THREE.ConeGeometry(0.105, 0.065, 4);
      xform(topRoof, [0, 0.155, 0], [0, Math.PI / 4, 0]);
      topRoof.scale(1.2, 1, 0.65);
      darkGeos.push(topRoof);
      for (const sx of [-0.11, 0.11]) {
        const sideRoof = new THREE.BoxGeometry(0.11, 0.028, 0.064);
        xform(sideRoof, [sx, 0.085, 0]);
        darkGeos.push(sideRoof);
      }
      break;
    }

    case 'research-loop-emblem': {
      // 3D Tripartite Loop: 3 orbital alabaster spheres connected by silver cycle struts around navy core octo
      const nodes = [
        [0, 0.15, 0],
        [0.14, -0.10, 0.03],
        [-0.14, -0.10, -0.03],
      ];
      for (let i = 0; i < 3; i++) {
        const [x, y, z] = nodes[i];
        const sph = new THREE.SphereGeometry(0.048, 12, 10);
        xform(sph, [x, y, z]);
        lightGeos.push(sph);

        const next = nodes[(i + 1) % 3];
        const mid = [(x + next[0]) * 0.5, (y + next[1]) * 0.5, (z + next[2]) * 0.5];
        const dir = new THREE.Vector3(next[0] - x, next[1] - y, next[2] - z);
        const len = dir.length();
        const rod = new THREE.CylinderGeometry(0.013, 0.013, len, 8);
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        rod.applyQuaternion(quat);
        rod.translate(mid[0], mid[1], mid[2]);
        silverGeos.push(rod);
      }
      const core = new THREE.OctahedronGeometry(0.062, 0);
      xform(core, [0, -0.01, 0]);
      darkGeos.push(core);
      break;
    }

    case 'ai4s-gate-emblem': {
      // Miniature 3D Gothic Arch Gate framing a suspended celestial navy & silver sphere
      const leftP = new THREE.BoxGeometry(0.044, 0.24, 0.052);
      xform(leftP, [-0.11, -0.02, 0]);
      const rightP = new THREE.BoxGeometry(0.044, 0.24, 0.052);
      xform(rightP, [0.11, -0.02, 0]);
      const sill = new THREE.BoxGeometry(0.30, 0.026, 0.072);
      xform(sill, [0, -0.145, 0]);
      const archL = new THREE.BoxGeometry(0.042, 0.16, 0.052);
      xform(archL, [-0.06, 0.13, 0], [0, 0, -0.62]);
      const archR = new THREE.BoxGeometry(0.042, 0.16, 0.052);
      xform(archR, [0.06, 0.13, 0], [0, 0, 0.62]);
      lightGeos.push(leftP, rightP, sill, archL, archR);

      const orb = new THREE.SphereGeometry(0.062, 14, 12);
      xform(orb, [0, -0.01, 0]);
      darkGeos.push(orb);
      const eq = new THREE.TorusGeometry(0.088, 0.010, 8, 22);
      xform(eq, [0, -0.01, 0], [1.1, 0.4, 0]);
      silverGeos.push(eq);
      break;
    }

    case 'hankel-emblem': {
      // 3D Standing Harmonic Sinusoid Wave Tube inside a silver resonator ring
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const wx = (t - 0.5) * 0.30;
        const wy = Math.sin(t * Math.PI * 2.5) * 0.088;
        const wz = Math.cos(t * Math.PI * 2.5) * 0.032;
        pts.push(new THREE.Vector3(wx, wy, wz));
      }
      const waveGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, 0.020, 8, false);
      lightGeos.push(waveGeo);

      const frame = new THREE.TorusGeometry(0.185, 0.014, 8, 28);
      silverGeos.push(frame);
      const backPlate = new THREE.CylinderGeometry(0.14, 0.14, 0.014, 20);
      xform(backPlate, [0, 0, -0.028], [Math.PI / 2, 0, 0]);
      darkGeos.push(backPlate);
      break;
    }

    case 'self-study-emblem': {
      // Miniature 3D Open Marble Codex Book + Floating Silver Rhombus Crystal
      const spine = new THREE.BoxGeometry(0.026, 0.024, 0.22);
      xform(spine, [0, -0.08, 0]);
      darkGeos.push(spine);

      const leftPage = new THREE.BoxGeometry(0.16, 0.022, 0.21);
      xform(leftPage, [-0.082, -0.05, 0], [0, 0, -0.32]);
      const rightPage = new THREE.BoxGeometry(0.16, 0.022, 0.21);
      xform(rightPage, [0.082, -0.05, 0], [0, 0, 0.32]);
      lightGeos.push(leftPage, rightPage);

      const crystal = new THREE.OctahedronGeometry(0.068, 0);
      xform(crystal, [0, 0.11, 0], [0.2, 0.4, 0]);
      silverGeos.push(crystal);
      break;
    }

    case 'opencode-auth-emblem':
    default: {
      // Sculpted 3D Ornate Gothic Skeleton Key inside a deep sapphire seal ring
      const bow = new THREE.TorusGeometry(0.072, 0.018, 8, 22);
      xform(bow, [-0.095, 0.02, 0]);
      const shaft = new THREE.CylinderGeometry(0.016, 0.016, 0.20, 10);
      xform(shaft, [0.05, 0.02, 0], [0, 0, Math.PI / 2]);
      const toothA = new THREE.BoxGeometry(0.024, 0.068, 0.024);
      xform(toothA, [0.13, -0.025, 0]);
      const toothB = new THREE.BoxGeometry(0.022, 0.048, 0.024);
      xform(toothB, [0.085, -0.015, 0]);
      lightGeos.push(bow, shaft, toothA, toothB);

      const seal = new THREE.TorusGeometry(0.195, 0.014, 8, 28);
      darkGeos.push(seal);
      break;
    }
  }

  const group = new THREE.Group();
  if (lightGeos.length > 0) {
    const m = new THREE.Mesh(mergeClean(lightGeos), mats.brightAlabasterMat);
    m.castShadow = true;
    group.add(m);
  }
  if (darkGeos.length > 0) {
    const m = new THREE.Mesh(mergeClean(darkGeos), mats.navyStoneMat);
    m.castShadow = true;
    group.add(m);
  }
  if (silverGeos.length > 0) {
    const m = new THREE.Mesh(mergeClean(silverGeos), mats.silverTrimMat);
    group.add(m);
  }
  return group;
}
