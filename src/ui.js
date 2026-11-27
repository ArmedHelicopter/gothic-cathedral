import * as THREE from 'three';
import { CENTERPIECE, PROJECTS } from './data.js';

/**
 * Minimalist Navy/Black/White Museum HUD, 3D Floating Cloche Pins & Exhibit Card Stepper.
 */
export function createUIController({
  pinAnchors,
  onSelectExhibit,
  onStepExhibit,
  onResetGallery,
  onResetInterior,
  onResetExterior,
  onToggleScrollMode,
  onReplayIntro,
}) {
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

  const btnGallery = document.getElementById('btn-gallery');
  const btnInterior = document.getElementById('btn-interior');
  const btnExterior = document.getElementById('btn-exterior');
  const btnScrollMode = document.getElementById('btn-scroll-mode');
  const btnReplay = document.getElementById('btn-replay');

  const allExhibits = [CENTERPIECE, ...PROJECTS];
  const dockBtns = new Map();
  const pinItems = [];
  const projVec = new THREE.Vector3();

  // Build 3D projected floating pins above every exhibit pedestal + centerpiece
  if (pinsLayer && pinAnchors) {
    allExhibits.forEach((ex) => {
      const anchorArr = pinAnchors[ex.id];
      if (!anchorArr) return;
      const pinBtn = document.createElement('button');
      pinBtn.type = 'button';
      pinBtn.className = 'exhibit-pin';
      pinBtn.dataset.exhibitId = ex.id;
      const shortName = ex.id === 'unfinished-opus' ? '未竟之作' : ex.name;
      pinBtn.innerHTML = `<span class="pin-idx">${ex.index}</span><span class="pin-label">${shortName}</span>`;
      pinBtn.addEventListener('click', () => {
        onSelectExhibit?.(ex.id);
      });
      pinsLayer.appendChild(pinBtn);
      pinItems.push({ id: ex.id, el: pinBtn, anchor: new THREE.Vector3(...anchorArr) });
    });
  }

  if (dockEl) {
    allExhibits.forEach((ex) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dock-chip';
      btn.dataset.exhibitId = ex.id;
      btn.innerHTML = `<span class="chip-num">${ex.index}</span><span class="chip-name">${
        ex.id === 'unfinished-opus' ? '未竟之作' : ex.name
      }</span>`;
      btn.addEventListener('click', () => {
        onSelectExhibit?.(ex.id);
      });
      dockEl.appendChild(btn);
      dockBtns.set(ex.id, btn);
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
    for (let i = 0; i < pinItems.length; i++) {
      const item = pinItems[i];
      projVec.copy(item.anchor).project(camera);
      if (projVec.z < -1 || projVec.z > 1) {
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
        item.el.style.opacity = '1';
        item.el.style.pointerEvents = 'auto';
        item.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
      }
    }
  }

  function syncScrollMode(tourEnabled) {
    if (!btnScrollMode) return;
    btnScrollMode.textContent = tourEnabled ? '滚轮 · 巡览展品' : '滚轮 · 缩放';
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

  btnGallery?.addEventListener('click', () => {
    closeExhibit();
    onResetGallery?.();
  });

  btnInterior?.addEventListener('click', () => {
    closeExhibit();
    onResetInterior?.();
  });

  btnExterior?.addEventListener('click', () => {
    closeExhibit();
    onResetExterior?.();
  });

  btnScrollMode?.addEventListener('click', () => onToggleScrollMode?.());

  btnReplay?.addEventListener('click', () => {
    closeExhibit();
    onReplayIntro?.();
  });

  return {
    showExhibit,
    closeExhibit,
    updatePins,
    syncScrollMode,
    setStage,
  };
}
