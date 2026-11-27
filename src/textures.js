import * as THREE from 'three';

/**
 * Procedural pixel-art & crisp vector-emblem texture factory for the Minimalist Gothic Cathedral.
 * Strict Navy · Black · White palette, zero external image/font dependencies.
 */

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.max(1, Math.floor(w)), Math.max(1, Math.floor(h)));
}

export const MAGPIE_SVG_PATH =
  'M1.5 5.5C1.3 5.7 1.2 6.5 1.2 6.9C1.2 6.9 1.2 7 1.2 7.1C1.1 7.4 1.3 8 1.4 8.3C1.4 8.4 1.5 8.5 1.5 8.7C1.5 8.9 1.7 9 1.8 9.3C2.2 9.9 2.2 10 2.3 10.1C2.4 10.2 2.5 10.3 2.6 10.5C2.8 10.8 3 11.1 3.2 11.3C3.3 11.3 3.4 11.6 3.6 11.8C3.8 12 4.1 12.4 4.2 12.5C4.7 13 5.2 13.7 5.4 13.9C6 14.5 6.5 15.1 6.7 15.3C6.7 15.4 6.9 15.5 6.9 15.7C7.3 15.9 7.7 16.5 7.9 16.8C7.9 16.8 8 16.9 8 16.9C8.1 16.9 8.2 17.2 8.2 17.3C8.2 17.3 8.1 17.2 8.1 17.1C7.9 16.9 7.9 16.9 7.6 16.6C7.5 16.5 7.4 16.5 7.4 16.3C7.2 16.2 6.7 15.7 6.3 15.2C6.1 15.1 6 14.9 6 14.9C5.9 14.8 5.7 14.7 5.7 14.6C5.6 14.5 5.4 14.3 5.3 14.2C5.1 14.1 4.9 13.8 4.7 13.5C4.5 13.3 4.2 13.1 4.1 12.9C4.1 12.9 3.8 12.7 3.8 12.5C3.5 12.3 3 11.8 2.8 11.4C1.8 10.5 0.9 9.6 0.7 9.6C0.6 9.7 0.6 9.8 0.5 10C0.5 10.1 0.6 10.2 0.5 10.3C0.5 10.4 0.6 10.5 0.6 10.6C0.5 10.7 0.5 10.9 0.6 11C0.5 11.1 0.6 11.4 0.6 11.5C0.9 12.9 1.3 13.8 2.8 14.9C2.9 15.1 3.3 15.3 3.4 15.4C3.4 15.5 3.6 15.6 3.7 15.7C4.2 16 6.4 17.8 7 18.4C7.4 18.8 7.4 18.8 7.5 18.9C7.6 19 7.7 19 7.7 19.1C7.7 19.2 7.8 19.2 7.9 19.2C7.9 19.3 8.1 19.4 8.1 19.5C8.2 19.6 8.2 19.7 8.3 19.7C8.3 19.7 8.3 19.7 8.2 19.7C8.2 19.6 8.1 19.6 8 19.6C7.9 19.5 7.9 19.4 7.8 19.4C7.7 19.3 7.6 19.2 7.6 19.2C7.6 19.1 7.5 19 7.3 18.9C7.2 18.9 6.9 18.6 6.7 18.4C6.1 17.8 4.5 16.6 3.5 16C3.4 15.8 3 15.6 2.9 15.5C2.6 15.3 1.5 14.6 0.9 14.3C0.7 14.1 0.6 14.1 0.6 14.2C0.5 14.5 0.8 15.9 0.9 16.1C0.9 16.2 1 16.2 0.9 16.3C1.2 16.8 1.9 17.6 2.7 18.3C2.8 18.5 4 19.2 4.7 19.5C6.2 20.5 6.6 20.7 7.4 21.5C8.2 22.2 8.7 22.7 9.3 23.6C9.5 24.1 9.9 24.4 10.3 25.3C10.4 25.5 10.5 25.8 10.5 25.8C10.7 25.8 10.8 25.7 11 25.4C11.6 25 11.9 24.6 12.3 24.3C12.8 24 13 23.8 13 23.7C13.1 23.7 13.1 23.8 13 24C12 24.8 11 26 10.2 26.9C10.1 27.1 9.9 27.5 9.7 27.7C9.5 27.8 9.4 28 9.4 28C9.4 28 9.3 28.3 9.1 28.5C8.6 29.2 7.7 30.8 7.7 30.9C7.7 31 7.8 31 8.3 30.8C9 30.4 9.5 30.2 10.4 30C11.7 29.6 12.5 29.6 11.6 30C10.5 30.2 9.7 30.6 9.2 31.2C8.8 31.7 8.8 31.7 9.3 31.7C10.1 31.8 10.9 31.9 11.6 32.2C12.8 32.7 13.5 33.1 15.5 34.8C16.4 35.5 17.3 36.2 17.8 36.4C17.9 36.5 18.1 36.7 18.2 36.8C19.1 37.3 21.2 38.1 22.3 38.3C22.4 38.3 22.7 38.3 22.8 38.3C22.8 38.5 23 38.5 23 38.5C23.1 38.5 23.2 38.5 23.3 38.5C23.6 38.6 25.9 38.6 26.1 38.5C26.2 38.5 26.3 38.5 26.4 38.5C26.5 38.5 26.6 38.5 26.7 38.3C26.7 38.3 27 38.3 27.1 38.3C28.3 38.1 30.2 37.3 31.4 36.7C31.5 36.7 31.7 36.4 31.8 36.4C32.2 36.2 33.2 35.4 33.4 35.2C34.2 34.5 35.5 33 35.8 32.6C35.8 32.5 36 32.2 36.1 32C36.4 31.8 36.6 31.4 36.6 31.2C36.7 31.1 36.8 30.9 36.9 30.8C37.2 30.4 37.5 29.6 37.7 29.2C37.7 29.1 37.8 28.7 37.9 28.7C38.1 28.5 38.4 27.1 38.5 26.8C39 25.2 39.1 23.7 39 22.4C39 22.2 38.9 21.9 38.9 21.8C38.9 21.7 38.9 21.6 38.9 21.4C38.6 20.5 38.5 19.9 38.2 19C37.9 18.5 37.5 17.5 37.3 17.2C37 16.8 36.8 15.8 36.8 15.2C36.8 13.8 37.7 12.7 39.6 12.2C40.1 12.1 41.3 11.8 42.1 11.7C43.5 11.5 43.5 11.5 43.4 11.3C42.9 10.7 40.9 9.9 39.2 9.7C37.9 9.5 38.1 9.5 37.6 9C37 8.6 36.4 8 36 7.9C36 7.8 35.8 7.8 35.7 7.7C35.1 7.3 34.2 7 33.1 6.9C32.6 6.7 31.6 6.9 31 7C29.6 7.3 28.3 8 27.3 9.2C26.7 9.8 26.2 10.8 25.7 11.7C25.5 12.1 24.8 13.4 24.7 13.7C24.6 13.9 24.5 14.1 24.1 14.7C23.5 15.7 22.1 16.9 20.6 17.8C20.5 18 20.3 18.2 20.1 18.3C19.7 18.5 19.4 18.8 19.1 19C18.9 19.1 18.7 19.3 18.5 19.4C18 19.8 17.2 20.3 17 20.5C16.9 20.5 16.8 20.6 16.7 20.7C16.3 20.8 16.1 20.9 16 20.9C15.5 20.8 14.9 20.5 14.2 20.2C13.7 19.8 12.7 18.9 12.4 18.6C12.3 18.5 12.2 18.4 12.1 18.2C11.9 18 11.2 17.1 11 16.6C10.9 16.5 10.8 16.4 10.7 16.3C10.7 16.2 10.6 16.1 10.6 15.9C10.5 15.9 10.4 15.7 10.4 15.6C10.3 15.5 10.2 15.2 10.1 15C10 14.8 9.8 14.4 9.7 14.2C9.6 14 9.5 13.7 9.4 13.6C9.4 13.4 9.3 13.2 9.2 13C9.2 12.8 9 12.6 9 12.5C8.9 12.3 8.7 12.1 8.7 12C8.7 12 8.5 11.7 8.5 11.7C8.3 11.2 8.2 10.9 7.5 10C6.4 8.3 4.2 6.4 2.7 5.8C2 5.5 1.6 5.4 1.5 5.5ZM28.4 16.7C29.2 16.9 29.7 17.2 29.9 17.7C30.1 18.2 30 18.9 29.6 19.4C29.2 19.9 28.2 20.9 27.6 21.2C26.8 21.7 25.3 22.4 24.2 22.7C23.9 22.8 23.6 22.9 23.5 22.9C22.8 23.2 20.7 23.7 19.6 24C19 24.2 18.4 24.3 18.1 24.4C17.9 24.4 16.1 24.9 15.3 25.1C14.6 25.2 14.7 25.1 15.7 23.6C16.4 22.7 18.5 20.6 19.4 19.9C20.8 18.8 21.4 18.4 23.2 17.6C23.8 17.4 25.6 16.8 25.9 16.8C25.9 16.8 26.3 16.8 26.6 16.7C26.8 16.7 28.2 16.7 28.4 16.7ZM30.4 20.2C30.5 20.3 30.6 20.6 30.6 20.7C31.7 23.1 33.4 24.6 35.6 25.3C36.1 25.5 36.7 25.7 37.2 25.8C37.7 25.8 37.8 25.9 37.8 26.1C37.7 26.2 37.7 26.3 37.7 26.5C37.7 26.6 37.7 26.8 37.6 27C37.4 28.5 36.8 29.9 36.1 31C36.1 31.2 35.9 31.4 35.9 31.6C35.7 31.9 35.2 32.6 34.7 33.3C32.6 35.6 29.7 37.3 26.6 37.8C26.5 37.8 26.3 37.9 26.2 37.9C25.8 37.9 23.7 37.9 23.3 37.9C23.2 37.9 23 37.8 22.9 37.8C21.1 37.6 19.3 36.8 18 35.7C17.7 35.4 17 34.7 16.8 34.5C16.3 33.8 16.1 33 16.3 32.5C16.5 31.8 16.8 31.6 17.9 31.1C19.1 30.5 19.4 30.4 20.2 30C21.4 29.4 23.2 28.4 23.9 27.9C23.9 27.8 24.2 27.7 24.5 27.6C26.3 26.3 28 24.6 28.9 22.9C29.5 22.2 29.7 21.6 29.9 20.7C30.1 20 30.2 19.9 30.4 20.2Z';

export function createCathedralTextures(renderer) {
  const registry = [];
  const cache = new Map();
  const maxAniso = renderer ? Math.min(4, renderer.capabilities.getMaxAnisotropy()) : 4;

  function register(label, canvas, { srgb = true, repeat = [1, 1], mip = true, wrap = true, pixel = true } = {}) {
    if (cache.has(label)) return cache.get(label);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = wrap ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    tex.wrapT = wrap ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
    if (pixel) {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = mip ? THREE.NearestMipmapLinearFilter : THREE.NearestFilter;
    } else {
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
    }
    tex.generateMipmaps = mip;
    tex.anisotropy = pixel ? 1 : maxAniso;
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    const bytes = Math.round(canvas.width * canvas.height * 4 * (mip ? 1.333 : 1));
    registry.push({ label, width: canvas.width, height: canvas.height, bytes, texture: tex });
    cache.set(label, tex);
    return tex;
  }

  /** Smooth 256x256 honed Carrara marble with subtle organic veining & zero pixelated blocks up close. */
  function carraraMarble(label = 'carrara-marble', repeat = [1, 1], seed = 101) {
    const S = 256;
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');
    const rand = mulberry32(seed);
    ctx.fillStyle = '#eff3fa';
    ctx.fillRect(0, 0, S, S);

    // Subtle soft mineral veining + cloud variation
    for (let k = 0; k < 14; k++) {
      ctx.strokeStyle = k % 2 === 0 ? 'rgba(136, 156, 194, 0.14)' : 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2 + rand() * 2.2;
      ctx.beginPath();
      const y0 = rand() * S;
      ctx.moveTo(0, y0);
      ctx.bezierCurveTo(S * 0.35, y0 + (rand() - 0.5) * 44, S * 0.65, y0 + (rand() - 0.5) * 44, S, y0);
      ctx.stroke();
    }

    for (let i = 0; i < 2400; i++) {
      px(ctx, rand() * S, rand() * S, 1.5, 1.5, rand() > 0.5 ? 'rgba(220,228,244,0.32)' : 'rgba(255,255,255,0.4)');
    }

    // Fine hairline architectural ashlar courses
    ctx.strokeStyle = 'rgba(138, 158, 194, 0.22)';
    ctx.lineWidth = 1;
    for (let y = 0; y < S; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(S, y);
      ctx.stroke();
      const off = ((y / 64) % 2) * 64;
      for (let x = off; x < S; x += 128) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 64);
        ctx.stroke();
      }
    }

    return register(label, c, { repeat, pixel: false, mip: true });
  }

  /** Crisp 64x64 honed obsidian-slate with clear block seams & silver-navy rim highlights. */
  function obsidianStone(label = 'obsidian-stone', repeat = [1, 1], seed = 202) {
    const S = 64;
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');
    const rand = mulberry32(seed);
    px(ctx, 0, 0, S, S, '#1b243a');
    const tones = ['#212c46', '#161e31', '#283554'];
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        if (y % 16 === 0 || x % 16 === 0) {
          px(ctx, x, y, 1, 1, '#0e1422');
        } else if (y % 16 === 1 || x % 16 === 1) {
          px(ctx, x, y, 1, 1, '#394b74');
        } else if (rand() < 0.30) {
          px(ctx, x, y, 1, 1, tones[Math.floor(rand() * tones.length)]);
        }
      }
    }
    return register(label, c, { repeat, pixel: true, mip: true });
  }

  /** Fine 128x128 honed Prussian-sapphire limestone ashlar (quiet Minimalist Gothic wall planes, no chunky subway brick). */
  function navyAshlar(label = 'navy-ashlar', repeat = [1, 1], seed = 303) {
    const S = 128;
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');
    const rand = mulberry32(seed);
    px(ctx, 0, 0, S, S, '#152c5c');
    const rows = 4;
    const rh = S / rows;
    const cw = 64;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * 32;
      for (let sx = -cw; sx < S; sx += cw) {
        const x = sx + off;
        const y = r * rh;
        const d = Math.floor((rand() - 0.5) * 10);
        const rr = Math.max(14, Math.min(48, 22 + d));
        const gg = Math.max(32, Math.min(84, 48 + d));
        const bb = Math.max(72, Math.min(148, 102 + d));
        ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
        ctx.fillRect(x + 1, y + 1, cw - 2, rh - 2);
        ctx.fillStyle = 'rgba(196, 222, 255, 0.08)';
        ctx.fillRect(x + 1, y + 1, cw - 2, 1);
        ctx.fillStyle = 'rgba(7, 14, 34, 0.24)';
        ctx.fillRect(x + 1, y + rh - 1, cw - 2, 1);
      }
    }
    for (let i = 0; i < 1600; i++) {
      px(ctx, rand() * S, rand() * S, 1, 1, rand() > 0.5 ? 'rgba(180,210,255,0.05)' : 'rgba(6,12,28,0.08)');
    }
    return register(label, c, { repeat, pixel: false, mip: true });
  }

  /** Ceremonial Royal-Navy & Alabaster woven sanctuary carpet runner with delicate Gothic borders. */
  function ceruleanCarpetTex(label = 'cerulean-carpet') {
    const W = 256;
    const H = 512;
    const albedo = makeCanvas(W, H);
    const bump = makeCanvas(W, H);
    const ctx = albedo.getContext('2d');
    const btx = bump.getContext('2d');
    const rand = mulberry32(818);

    ctx.fillStyle = '#11295c';
    ctx.fillRect(0, 0, W, H);
    btx.fillStyle = 'rgb(130,130,130)';
    btx.fillRect(0, 0, W, H);

    // Subtle woven tufted grain + sapphire inner pile gradient
    const pileGrad = ctx.createLinearGradient(0, 0, W, 0);
    pileGrad.addColorStop(0.0, '#0d1e45');
    pileGrad.addColorStop(0.16, '#132e68');
    pileGrad.addColorStop(0.5, '#193b82');
    pileGrad.addColorStop(0.84, '#132e68');
    pileGrad.addColorStop(1.0, '#0d1e45');
    ctx.fillStyle = pileGrad;
    ctx.fillRect(0, 0, W, H);

    for (let y = 0; y < H; y += 2) {
      for (let x = 0; x < W; x += 2) {
        const v = rand();
        if (v < 0.28) {
          ctx.fillStyle = v < 0.14 ? 'rgba(130, 178, 255, 0.06)' : 'rgba(6, 14, 34, 0.12)';
          ctx.fillRect(x, y, 2, 2);
          btx.fillStyle = v < 0.14 ? 'rgb(165,165,165)' : 'rgb(96,96,96)';
          btx.fillRect(x, y, 2, 2);
        }
      }
    }

    // Repeating Gothic damask diamond filigree down carpet center
    ctx.strokeStyle = 'rgba(164, 204, 255, 0.22)';
    ctx.lineWidth = 2;
    for (let cy = 64; cy < H; cy += 128) {
      ctx.beginPath();
      ctx.moveTo(W / 2, cy - 42);
      ctx.lineTo(W / 2 + 42, cy);
      ctx.lineTo(W / 2, cy + 42);
      ctx.lineTo(W / 2 - 42, cy);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(W / 2, cy, 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Crisp outer silver-white & alabaster double borders on both edges
    for (const bx of [10, W - 26]) {
      ctx.fillStyle = '#e8f0ff';
      ctx.fillRect(bx, 0, 16, H);
      btx.fillStyle = 'rgb(200,200,200)';
      btx.fillRect(bx, 0, 16, H);
    }
    for (const sx of [32, W - 36]) {
      ctx.fillStyle = '#8db4f2';
      ctx.fillRect(sx, 0, 4, H);
    }

    return {
      map: register(`${label}-albedo`, albedo, { repeat: [1, 8], pixel: false, mip: true }),
      bumpMap: register(`${label}-bump`, bump, { srgb: false, repeat: [1, 8], pixel: false, mip: true }),
    };
  }

  /** Crisp 256x256 polished Gothic sapphire-marble inlaid floor tile (antialiased diagonal borders, zero stairstep pixels). */
  function naveInlayFloor(label = 'nave-inlay-floor', repeat = [5, 11]) {
    const S = 256;
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');
    const rand = mulberry32(404);
    ctx.fillStyle = '#131d34';
    ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 3200; i++) {
      px(ctx, rand() * S, rand() * S, 1.5, 1.5, rand() > 0.5 ? '#1b2847' : '#0f172b');
    }
    ctx.strokeStyle = 'rgba(72, 102, 162, 0.55)';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, S - 8, S - 8);

    ctx.fillStyle = '#1b3469';
    ctx.beginPath();
    ctx.moveTo(S / 2, 34);
    ctx.lineTo(S - 34, S / 2);
    ctx.lineTo(S / 2, S - 34);
    ctx.lineTo(34, S / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6c92d4';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#b4c9eb';
    ctx.beginPath();
    ctx.moveTo(S / 2, S / 2 - 14);
    ctx.lineTo(S / 2 + 14, S / 2);
    ctx.lineTo(S / 2, S / 2 + 14);
    ctx.lineTo(S / 2 - 14, S / 2);
    ctx.closePath();
    ctx.fill();

    return register(label, c, { repeat, pixel: false, mip: true });
  }

  function linenCloth(label = 'linen-cloth') {
    const S = 96;
    const albedo = makeCanvas(S, S);
    const bump = makeCanvas(S, S);
    const a = albedo.getContext('2d');
    const b = bump.getContext('2d');
    const rand = mulberry32(505);

    px(a, 0, 0, S, S, '#eceff7');
    px(b, 0, 0, S, S, 'rgb(128,128,128)');

    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const warp = (x + (y % 2)) % 2 === 0;
        const slub = (x % 6 === 0 ? -7 : 0) + (y % 8 === 0 ? -5 : 0);
        const threadNoise = Math.floor((rand() - 0.5) * 14) + slub;
        if (warp) {
          px(a, x, y, 1, 1, `rgb(${242 + threadNoise},${246 + threadNoise},${252})`);
          px(b, x, y, 1, 1, 'rgb(205,205,205)');
        } else {
          px(a, x, y, 1, 1, `rgb(${214 + threadNoise},${222 + threadNoise},${236 + threadNoise})`);
          px(b, x, y, 1, 1, 'rgb(74,74,74)');
        }
      }
    }
    return {
      map: register(`${label}-albedo`, albedo, { repeat: [10, 12], pixel: false, mip: true }),
      bumpMap: register(`${label}-bump`, bump, { srgb: false, repeat: [10, 12], pixel: false, mip: true }),
    };
  }

  /**
   * Painterly unfinished chiaroscuro oil & charcoal study on raw linen canvas:
   * - Sweeping charcoal construction rays & compass tracery circles
   * - Rich tonal Prussian-navy colonnade arches & illuminated rose study with visible impasto palette strokes
   */
  function unfinishedCanvasTex(label = 'unfinished-canvas') {
    const W = 512;
    const H = 640;
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    const rand = mulberry32(606);

    // Primed warm-cool raw linen canvas ground
    ctx.fillStyle = '#e7ecf5';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 9500; i++) {
      px(ctx, rand() * W, rand() * H, 2, 2, rand() > 0.5 ? '#dce2ee' : '#f4f7fc');
    }

    // Charcoal golden-ratio construction lines & compass rose rings
    const vx = W * 0.42;
    const vy = H * 0.36;
    ctx.strokeStyle = 'rgba(20, 36, 76, 0.36)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i <= 11; i++) {
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.lineTo(W * (0.20 + i * 0.075), H);
      ctx.stroke();
    }
    for (const r of [68, 108, 134]) {
      ctx.beginPath();
      ctx.arc(W * 0.68, H * 0.44, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Painterly navy-indigo chiaroscuro wash across lower-right unfinished composition
    const deepWash = ctx.createRadialGradient(W * 0.66, H * 0.66, 20, W * 0.66, H * 0.66, 240);
    deepWash.addColorStop(0.0, 'rgba(225, 238, 255, 0.35)');
    deepWash.addColorStop(0.45, 'rgba(34, 66, 132, 0.68)');
    deepWash.addColorStop(0.85, 'rgba(11, 24, 56, 0.86)');
    deepWash.addColorStop(1.0, 'rgba(18, 36, 78, 0.20)');
    ctx.fillStyle = deepWash;
    ctx.fillRect(W * 0.30, H * 0.32, W * 0.68, H * 0.66);

    // Radiating unfinished stained rose medallion upper-right
    ctx.save();
    ctx.translate(W * 0.68, H * 0.54);
    for (let p = 0; p < 8; p++) {
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = p % 2 === 0 ? 'rgba(220, 234, 255, 0.62)' : 'rgba(28, 56, 114, 0.72)';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.quadraticCurveTo(18, -48, 0, -78);
      ctx.quadraticCurveTo(-18, -48, 0, -14);
      ctx.fill();
    }
    ctx.restore();

    // Gothic pointed sanctuary colonnade emerging out of ink wash + light puddle on floor
    for (let bay = 0; bay < 3; bay++) {
      const bx = W * (0.44 + bay * 0.145);
      const w = 54 - bay * 8;
      const topY = H * (0.48 + bay * 0.03);
      const botY = H * 0.90 - bay * 12;

      const archGrad = ctx.createLinearGradient(bx, topY, bx, botY);
      archGrad.addColorStop(0, 'rgba(232, 242, 255, 0.78)');
      archGrad.addColorStop(0.45, 'rgba(38, 72, 138, 0.65)');
      archGrad.addColorStop(1, 'rgba(10, 22, 50, 0.86)');
      ctx.fillStyle = archGrad;
      ctx.beginPath();
      ctx.moveTo(bx, botY);
      ctx.lineTo(bx, topY + 34);
      ctx.quadraticCurveTo(bx + w * 0.5, topY - 14, bx + w, topY + 34);
      ctx.lineTo(bx + w, botY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(218, 232, 255, 0.62)';
      ctx.lineWidth = 2.0;
      ctx.stroke();
    }

    // Rich palette-knife impasto white-silver light streaks & raw ink brush marks
    for (let s = 0; s < 28; s++) {
      const sx = W * (0.40 + rand() * 0.48);
      const sy = H * (0.50 + rand() * 0.40);
      ctx.strokeStyle = s % 3 === 0 ? 'rgba(248, 251, 255, 0.68)' : s % 3 === 1 ? 'rgba(98, 138, 212, 0.52)' : 'rgba(10, 20, 44, 0.58)';
      ctx.lineWidth = 1.8 + rand() * 4.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 22 + rand() * 52, sy - 10 - rand() * 24);
      ctx.stroke();
    }

    // Raw unpainted gesso margin border + artist proportion ticks
    ctx.strokeStyle = 'rgba(22, 40, 82, 0.42)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    return register(label, c, { wrap: false, pixel: false, mip: true });
  }

  /** Dark carved Gothic oak & iron door texture (distinct vertical planking, NOT brick masonry!). */
  function gothicDoorWood(label = 'gothic-door-wood') {
    const S = 64;
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');
    const rand = mulberry32(707);
    px(ctx, 0, 0, S, S, '#131b2e');
    for (let x = 0; x < S; x++) {
      const isSeam = x % 16 === 0;
      const isHighlight = x % 16 === 1;
      for (let y = 0; y < S; y++) {
        if (isSeam) {
          px(ctx, x, y, 1, 1, '#090d18');
        } else if (isHighlight) {
          px(ctx, x, y, 1, 1, '#243252');
        } else if (rand() < 0.35) {
          px(ctx, x, y, 1, 1, rand() > 0.5 ? '#18223a' : '#0f1628');
        }
      }
    }
    return register(label, c, { repeat: [2, 3], pixel: true, mip: true });
  }

  /** Serene Cerulean-Azure Cathedral Leaded Stained Glass (tranquil Sainte-Chapelle azure sky gradient + delicate leadwork). */
  function lancetGlass(label = 'lancet-glass') {
    const W = 128;
    const H = 384;
    const albedo = makeCanvas(W, H);
    const emissive = makeCanvas(W, H);

    for (const [ctx, isEmissive] of [[albedo.getContext('2d'), false], [emissive.getContext('2d'), true]]) {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      if (isEmissive) {
        grad.addColorStop(0.0, '#7eb4ff');
        grad.addColorStop(0.32, '#4184f2');
        grad.addColorStop(0.75, '#2558be');
        grad.addColorStop(1.0, '#163884');
      } else {
        grad.addColorStop(0.0, '#8cc0ff');
        grad.addColorStop(0.35, '#4688f0');
        grad.addColorStop(0.80, '#2252b2');
        grad.addColorStop(1.0, '#133172');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Subtle translucent celestial panes with soft inner vertical halo
      const centerHalo = ctx.createRadialGradient(W * 0.5, H * 0.38, 6, W * 0.5, H * 0.42, W * 0.65);
      centerHalo.addColorStop(0, 'rgba(220, 240, 255, 0.42)');
      centerHalo.addColorStop(0.65, 'rgba(130, 184, 255, 0.14)');
      centerHalo.addColorStop(1, 'rgba(24, 62, 142, 0.0)');
      ctx.fillStyle = centerHalo;
      ctx.fillRect(0, 0, W, H);

      // Crisp dark navy-iron leaded rectangular & arched lancet mullions
      ctx.strokeStyle = '#0c1630';
      ctx.lineWidth = 2.5;
      const rows = 9;
      for (let r = 0; r <= rows; r++) {
        const y = (r / rows) * H;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      for (const x of [W * 0.25, W * 0.5, W * 0.75]) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      // Subtle frosted alabaster rosette diamond accents along center spine
      ctx.fillStyle = 'rgba(232, 244, 255, 0.34)';
      for (let r = 1; r < rows - 1; r++) {
        const y = ((r + 0.5) / rows) * H;
        ctx.beginPath();
        ctx.moveTo(W * 0.5, y - 10);
        ctx.lineTo(W * 0.5 + 8, y);
        ctx.lineTo(W * 0.5, y + 10);
        ctx.lineTo(W * 0.5 - 8, y);
        ctx.closePath();
        ctx.fill();
      }
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, W - 6, H - 6);
    }

    return {
      map: register(`${label}-albedo`, albedo, { wrap: false, pixel: false, mip: true }),
      emissiveMap: register(`${label}-emissive`, emissive, { wrap: false, pixel: false, mip: true }),
    };
  }

  /** Soft cerulean-azure stained-glass light-pool projection gobo for nave marble floors. */
  function lancetGoboTex(label = 'lancet-gobo') {
    const W = 128;
    const H = 256;
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    const g = ctx.createRadialGradient(W * 0.5, H * 0.52, 8, W * 0.5, H * 0.52, W * 0.55);
    g.addColorStop(0.0, 'rgba(130, 194, 255, 0.85)');
    g.addColorStop(0.55, 'rgba(60, 128, 242, 0.45)');
    g.addColorStop(1.0, 'rgba(20, 60, 150, 0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Subtle soft twin lancet light silhouette
    ctx.fillStyle = 'rgba(195, 226, 255, 0.42)';
    for (const bx of [W * 0.34, W * 0.66]) {
      ctx.beginPath();
      ctx.ellipse(bx, H * 0.52, 16, 72, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    return register(label, c, { wrap: false, pixel: false, mip: true });
  }

  function roseWindowGlass(label = 'rose-window') {
    const S = 256;
    const albedo = makeCanvas(S, S);
    const emissive = makeCanvas(S, S);

    for (const ctx of [albedo.getContext('2d'), emissive.getContext('2d')]) {
      ctx.fillStyle = '#0a142c';
      ctx.fillRect(0, 0, S, S);
      const cx = S / 2;
      const cy = S / 2;

      ctx.strokeStyle = '#cfe0ff';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, 112, 0, Math.PI * 2);
      ctx.stroke();

      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang);
        ctx.fillStyle = i % 2 === 0 ? '#d8e6ff' : '#2d569e';
        ctx.beginPath();
        ctx.moveTo(0, -28);
        ctx.lineTo(16, -84);
        ctx.lineTo(0, -104);
        ctx.lineTo(-16, -84);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0a0f1c';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = '#eef4ff';
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    return {
      map: register(`${label}-albedo`, albedo, { wrap: false, pixel: false, mip: true }),
      emissiveMap: register(`${label}-emissive`, emissive, { wrap: false, pixel: false, mip: true }),
    };
  }

  function bokehDot(label = 'bokeh-dot') {
    const S = 64;
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(S / 2, S / 2, 1, S / 2, S / 2, S / 2);
    g.addColorStop(0.0, 'rgba(244, 248, 255, 1.0)');
    g.addColorStop(0.28, 'rgba(198, 220, 255, 0.72)');
    g.addColorStop(0.65, 'rgba(72, 118, 204, 0.18)');
    g.addColorStop(1.0, 'rgba(10, 20, 48, 0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    return register(label, c, { wrap: false, pixel: false, mip: false });
  }

  /** Ultra-crisp 768x256 museum placard in matte sapphire-slate & crisp ivory typography (zero bloom smear). */
  function plaqueLabel(project) {
    const W = 768;
    const H = 256;
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0c1833';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#c4d6f4';
    ctx.lineWidth = 7;
    ctx.strokeRect(8, 8, W - 16, H - 16);
    ctx.strokeStyle = '#3b5fa6';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    ctx.fillStyle = '#99bbea';
    ctx.font = '700 32px "JetBrains Mono", Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`NO.${project.index} · ${project.lang.toUpperCase()}`, W / 2, 86);

    ctx.fillStyle = '#dde7fa';
    const fontSize = project.name.length > 20 ? 44 : project.name.length > 14 ? 54 : 64;
    ctx.font = `700 ${fontSize}px Inter, "PingFang SC", system-ui, sans-serif`;
    ctx.fillText(project.name, W / 2, 180);

    return register(`plaque-${project.id}`, c, { wrap: false, pixel: false, mip: true });
  }

  function projectIcon(project) {
    const S = 256;
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');

    const bg = ctx.createRadialGradient(S * 0.5, S * 0.38, 12, S * 0.5, S * 0.5, S * 0.65);
    bg.addColorStop(0, '#224485');
    bg.addColorStop(0.68, '#102046');
    bg.addColorStop(1, '#080e1d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, S, S);

    ctx.strokeStyle = 'rgba(220, 234, 255, 0.42)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(128, 128, 104, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    switch (project.iconKind) {
      case 'magpie-real': {
        ctx.translate(28, 28);
        ctx.scale(200 / 44, 200 / 44);
        const path = new Path2D(MAGPIE_SVG_PATH);
        ctx.fillStyle = '#f5f8ff';
        ctx.fill(path, 'evenodd');
        break;
      }
      case 'claude-switcher-real': {
        ctx.fillStyle = '#f5f8ff';
        ctx.beginPath();
        ctx.moveTo(128, 42);
        ctx.bezierCurveTo(100, 48, 66, 56, 54, 62);
        ctx.lineTo(54, 134);
        ctx.bezierCurveTo(54, 174, 92, 204, 128, 218);
        ctx.bezierCurveTo(164, 204, 202, 174, 202, 134);
        ctx.lineTo(202, 62);
        ctx.bezierCurveTo(190, 56, 156, 48, 128, 42);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#173266';
        ctx.beginPath();
        ctx.roundRect(84, 102, 66, 14, 7);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(146, 92);
        ctx.lineTo(176, 109);
        ctx.lineTo(146, 126);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.roundRect(106, 142, 66, 14, 7);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(110, 132);
        ctx.lineTo(80, 149);
        ctx.lineTo(110, 166);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'sivtr-real': {
        ctx.fillStyle = '#0d1b36';
        ctx.strokeStyle = 'rgba(220,234,255,0.5)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(36, 36, 184, 184, 28);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f8fafd';
        ctx.fillRect(62, 66, 52, 16);
        ctx.fillStyle = '#89b8ff';
        ctx.fillRect(62, 96, 132, 22);
        ctx.fillStyle = '#dbe9ff';
        ctx.fillRect(62, 134, 92, 22);
        ctx.fillStyle = '#89b8ff';
        ctx.fillRect(62, 172, 118, 22);
        break;
      }
      case 'easycliproxy-real': {
        ctx.strokeStyle = '#f2f6ff';
        ctx.lineWidth = 10;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(128, 32);
        ctx.quadraticCurveTo(148, 108, 224, 128);
        ctx.quadraticCurveTo(148, 148, 128, 224);
        ctx.quadraticCurveTo(108, 148, 32, 128);
        ctx.quadraticCurveTo(108, 108, 128, 32);
        ctx.closePath();
        ctx.stroke();

        ctx.strokeStyle = '#9fc3ff';
        ctx.lineWidth = 6.5;
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          const x1 = 128 + Math.cos(a) * 28;
          const y1 = 128 + Math.sin(a) * 28;
          const x2 = 128 + Math.cos(a + Math.PI / 3) * 44;
          const y2 = 128 + Math.sin(a + Math.PI / 3) * 44;
          ctx.beginPath();
          ctx.arc(x2 * 0.65 + 128 * 0.35, y2 * 0.65 + 128 * 0.35, 22, a - 0.8, a + 1.6);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(128 + Math.cos(a + 1.05) * 28, 128 + Math.sin(a + 1.05) * 28);
          ctx.stroke();
        }
        break;
      }
      case 'whu-archway-real': {
        ctx.fillStyle = '#f4f7ff';
        for (const cx of [54, 96, 146, 188]) {
          ctx.fillRect(cx, 76, 14, 124);
        }
        ctx.fillRect(88, 68, 80, 22);
        ctx.fillRect(46, 98, 164, 18);
        ctx.fillStyle = '#96baf8';
        ctx.fillRect(40, 92, 176, 8);
        ctx.fillRect(84, 60, 88, 9);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(36, 198, 184, 10);
        break;
      }
      case 'research-loop-emblem': {
        ctx.strokeStyle = '#f2f6ff';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(128, 52);
        ctx.lineTo(198, 176);
        ctx.lineTo(58, 176);
        ctx.closePath();
        ctx.stroke();
        for (const [nx, ny] of [[128, 52], [198, 176], [58, 176]]) {
          ctx.fillStyle = '#0f1f42';
          ctx.beginPath();
          ctx.arc(nx, ny, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.fillStyle = '#9ac0ff';
        ctx.beginPath();
        ctx.moveTo(128, 108);
        ctx.lineTo(152, 134);
        ctx.lineTo(128, 160);
        ctx.lineTo(104, 134);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'ai4s-gate-emblem': {
        ctx.strokeStyle = '#f4f8ff';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(64, 200);
        ctx.lineTo(64, 114);
        ctx.quadraticCurveTo(64, 66, 128, 44);
        ctx.quadraticCurveTo(192, 66, 192, 114);
        ctx.lineTo(192, 200);
        ctx.stroke();

        ctx.strokeStyle = '#95bcff';
        ctx.lineWidth = 6;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
          const hx = 128 + Math.cos(a) * 38;
          const hy = 136 + Math.sin(a) * 38;
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(128, 136, 9, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'hankel-emblem': {
        ctx.strokeStyle = 'rgba(154,192,255,0.45)';
        ctx.lineWidth = 4;
        ctx.strokeRect(56, 56, 144, 144);
        for (let k = -2; k <= 2; k++) {
          ctx.beginPath();
          ctx.moveTo(64, 128 + k * 24);
          ctx.lineTo(128 + k * 24, 64);
          ctx.stroke();
        }
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8;
        ctx.beginPath();
        for (let x = 48; x <= 208; x += 4) {
          const t = (x - 48) / 160;
          const y = 128 - Math.sin(t * Math.PI * 2) * 42 * Math.sin(t * Math.PI);
          if (x === 48) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        break;
      }
      case 'self-study-emblem': {
        ctx.strokeStyle = '#f5f8ff';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(128, 114, 52, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 5;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(128, 114);
          ctx.lineTo(128 + Math.cos(a) * 52, 114 + Math.sin(a) * 52);
          ctx.stroke();
        }
        ctx.fillStyle = '#9cc0ff';
        ctx.fillRect(46, 178, 164, 9);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(46, 194, 164, 7);
        break;
      }
      case 'opencode-auth-emblem':
      default: {
        ctx.strokeStyle = '#f5f8ff';
        ctx.lineWidth = 9;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.arc(92, 116, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(122, 116);
        ctx.lineTo(202, 116);
        ctx.lineTo(202, 140);
        ctx.moveTo(176, 116);
        ctx.lineTo(176, 134);
        ctx.stroke();
        ctx.strokeStyle = '#97bfff';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(76, 166);
        ctx.lineTo(96, 178);
        ctx.lineTo(76, 190);
        ctx.moveTo(112, 190);
        ctx.lineTo(148, 190);
        ctx.stroke();
        break;
      }
    }
    ctx.restore();

    return register(`icon-${project.id}`, c, { wrap: false, pixel: false, mip: true });
  }

  function getStats() {
    const totalBytes = registry.reduce((acc, r) => acc + r.bytes, 0);
    return { count: registry.length, totalKB: Math.round(totalBytes / 1024), totalBytes };
  }

  return {
    carraraMarble,
    obsidianStone,
    navyAshlar,
    ceruleanCarpetTex,
    naveInlayFloor,
    linenCloth,
    unfinishedCanvasTex,
    gothicDoorWood,
    lancetGlass,
    lancetGoboTex,
    roseWindowGlass,
    bokehDot,
    plaqueLabel,
    projectIcon,
    getStats,
  };
}
