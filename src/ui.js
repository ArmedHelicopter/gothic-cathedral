import * as THREE from 'three';
import { CENTERPIECE, PROJECTS } from './data.js';

/**
 * Restrained Navy/Silver Sanctuary Museum HUD, Wireframe Loader Readout,
 * Selected Preset Camera Switcher & 3D Floating Cloche Pins.
 */
export function createUIController({
  pinAnchors,
  onSelectExhibit,
  onStepExhibit,
  onPresetSelect,
  onToggleScrollMode,
  onReplayDive,
}) {
  const loadPctEl = document.getElementById('load-pct');
  const loadBarFillEl = document.getElementById('load-bar-fill');

  const pinsLayer = document.getElementById('pins-layer');
  const dockEl = document.getElementById('exhibit-dock');
  const cardEl = document.getElementById('exhibit-card');
  const cardIndexEl = document.getElementById('card-index');
  const cardTagEl = document.getElementById('card-tag');
  const cardTitleEl = document.getElementById('card-title');
  const cardSubEl = document.getElementById('card-sub');
  const cardDescEl = document.getElementById('card-desc');
  const cardStackEl = document.getElementById('card-stack');
  const cardLinkEl = document.getElementById('card-link');
  const cardCloseBtn = document.getElementById('card-close-btn');
  const cardPrevBtn = document.getElementById('card-prev-btn');
  const cardNextBtn = document.getElementById('card-next-btn');

  const presetButtons = {
    sovereign: document.getElementById('btn-preset-sovereign'),
    masterpiece: document.getElementById('btn-preset-masterpiece'),
    mezzanine: document.getElementById('btn-preset-mezzanine'),
    stainedGlass: document.getElementById('btn-preset-stainedglass'),
    spiralWell: document.getElementById('btn-preset-spiral'),
  };

  const btnScrollMode = document.getElementById('btn-scroll-mode');
  const btnReplay = document.getElementById('btn-replay-dive');

  const allExhibits = [CENTERPIECE, ...PROJECTS];
  const dockBtns = new Map();
  const pinItems = [];
  const projVec = new THREE.Vector3();

  if (pinsLayer && pinAnchors && Object.keys(pinAnchors).length > 0) {
    pinsLayer.innerHTML = '';
    allExhibits.forEach((ex) => {
      const anchorArr = pinAnchors[ex.id];
      if (!anchorArr) return;
      const pinBtn = document.createElement('button');
      pinBtn.type = 'button';
      pinBtn.className = 'exhibit-pin';
      pinBtn.dataset.exhibitId = ex.id;
      const shortName = ex.id === 'unfinished-opus' ? '未竟之作' : ex.name;
      pinBtn.innerHTML = `<span class="pin-idx">${ex.index}</span><span class="pin-label">${shortName}</span>`;
      pinBtn.addEventListener('click', () => onSelectExhibit?.(ex.id));
      pinsLayer.appendChild(pinBtn);
      pinItems.push({ id: ex.id, el: pinBtn, anchor: new THREE.Vector3(...anchorArr) });
    });
  }

  if (dockEl && Object.keys(pinAnchors || {}).length > 0) {
    dockEl.innerHTML = '';
    allExhibits.forEach((ex) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dock-chip';
      btn.dataset.exhibitId = ex.id;
      btn.innerHTML = `<span class="chip-num">${ex.index}</span><span class="chip-name">${
        ex.id === 'unfinished-opus' ? '未竟之作' : ex.name
      }</span>`;
      btn.addEventListener('click', () => onSelectExhibit?.(ex.id));
      dockEl.appendChild(btn);
      dockBtns.set(ex.id, btn);
    });
  }

  function setLoadProgress(p01) {
    const pct = Math.max(0, Math.min(100, Math.round(p01 * 100)));
    if (loadPctEl) loadPctEl.textContent = `${String(pct).padStart(2, '0')}%`;
    if (loadBarFillEl) loadBarFillEl.style.width = `${pct}%`;
  }

  function setActivePreset(presetKey) {
    Object.entries(presetButtons).forEach(([k, btn]) => {
      btn?.classList.toggle('is-active', k === presetKey);
    });
  }

  function showExhibit(id) {
    const ex = allExhibits.find((e) => e.id === id);
    if (!ex || !cardEl) return;

    dockBtns.forEach((b, k) => b.classList.toggle('is-active', k === id));
    pinItems.forEach((p) => p.el.classList.toggle('is-active', p.id === id));

    cardIndexEl.textContent = `NO.${ex.index}`;
    cardTagEl.textContent = ex.tag || (ex.hasRealIcon ? `${ex.lang} · REAL 3D ICON` : ex.lang);
    cardTitleEl.textContent = ex.name;
    cardSubEl.textContent = ex.subtitle;
    cardDescEl.textContent = ex.description;
    cardStackEl.innerHTML = (ex.stack || [])
      .map((s) => `<span class="stack-pill">${s}</span>`)
      .join('');
    if (ex.url) {
      cardLinkEl.href = ex.url;
      cardLinkEl.style.display = 'inline-flex';
      cardLinkEl.textContent = ex.id === 'unfinished-opus' ? '前往 GitHub 主页' : '查看开源仓库';
    } else {
      cardLinkEl.style.display = 'none';
    }
    cardEl.classList.add('is-open');
    cardEl.setAttribute('aria-hidden', 'false');
  }

  function closeExhibit() {
    dockBtns.forEach((b) => b.classList.remove('is-active'));
    pinItems.forEach((p) => p.el.classList.remove('is-active'));
    if (cardEl) {
      cardEl.classList.remove('is-open');
      cardEl.setAttribute('aria-hidden', 'true');
    }
  }

  function updatePins(camera, width, height, visible) {
    if (!pinsLayer) return;
    if (!visible) {
      pinsLayer.style.opacity = '0';
      return;
    }
    pinsLayer.style.opacity = '1';
    const candidates = [];
    for (let i = 0; i < pinItems.length; i++) {
      const item = pinItems[i];
      const dist = camera.position.distanceTo(item.anchor);
      projVec.copy(item.anchor).project(camera);
      if (projVec.z < -1 || projVec.z > 1 || dist > 38) {
        item.el.style.opacity = '0';
        item.el.style.pointerEvents = 'none';
        continue;
      }
      const x = (projVec.x * 0.5 + 0.5) * width;
      const y = (-projVec.y * 0.5 + 0.5) * height;
      if (x < 36 || x > width - 36 || y < 68 || y > height - 76) {
        item.el.style.opacity = '0';
        item.el.style.pointerEvents = 'none';
      } else {
        candidates.push({ item, x, y, dist });
      }
    }

    // De-overlap distant pins smoothly front-to-back so low-angle axial views stay legible
    candidates.sort((a, b) => a.dist - b.dist);
    const placed = [];
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      let py = c.y;
      while (placed.some((p) => Math.abs(c.x - p.x) < 168 && Math.abs(py - p.y) < 30) && py > 92) {
        py -= 30;
      }
      placed.push({ x: c.x, y: py });
      c.item.el.style.opacity = '1';
      c.item.el.style.pointerEvents = 'auto';
      c.item.el.style.transform = `translate3d(${c.x.toFixed(1)}px, ${py.toFixed(1)}px, 0) translate(-50%, -100%)`;
    }
  }

  function syncScrollMode(tourEnabled) {
    if (!btnScrollMode) return;
    btnScrollMode.textContent = tourEnabled ? '滚轮 · 巡览展品' : '滚轮 · 视野缩放';
    btnScrollMode.classList.toggle('is-active', Boolean(tourEnabled));
  }

  function setStage(stage) {
    document.body.dataset.stage = stage;
  }

  cardCloseBtn?.addEventListener('click', () => {
    closeExhibit();
    onSelectExhibit?.(null);
  });

  cardPrevBtn?.addEventListener('click', () => onStepExhibit?.(-1));
  cardNextBtn?.addEventListener('click', () => onStepExhibit?.(1));

  Object.entries(presetButtons).forEach(([key, btn]) => {
    btn?.addEventListener('click', () => {
      closeExhibit();
      onPresetSelect?.(key);
    });
  });

  btnScrollMode?.addEventListener('click', () => onToggleScrollMode?.());

  btnReplay?.addEventListener('click', () => {
    closeExhibit();
    onReplayDive?.();
  });

  return {
    setLoadProgress,
    setActivePreset,
    showExhibit,
    closeExhibit,
    updatePins,
    syncScrollMode,
    setStage,
  };
}
