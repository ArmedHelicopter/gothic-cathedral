import { CENTERPIECE, PROJECTS } from './data.js';

/**
 * Minimalist Navy/Black/White Museum HUD & Exhibit Placard Drawer.
 */
export function createUIController({
  onSelectExhibit,
  onResetInterior,
  onResetExterior,
  onReplayIntro,
}) {
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

  const btnInterior = document.getElementById('btn-interior');
  const btnExterior = document.getElementById('btn-exterior');
  const btnReplay = document.getElementById('btn-replay');

  const allExhibits = [CENTERPIECE, ...PROJECTS];
  const dockBtns = new Map();

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

    cardIndexEl.textContent = `NO.${ex.index}`;
    cardTagEl.textContent = ex.tag || (ex.hasRealIcon ? `${ex.lang} · REAL ICON` : ex.lang);
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
    if (cardEl) {
      cardEl.classList.remove('is-open');
      cardEl.setAttribute('aria-hidden', 'true');
    }
  }

  function setStage(stage) {
    document.body.dataset.stage = stage;
  }

  cardCloseBtn?.addEventListener('click', () => {
    closeExhibit();
    onSelectExhibit?.(null);
  });

  btnInterior?.addEventListener('click', () => {
    closeExhibit();
    onResetInterior?.();
  });

  btnExterior?.addEventListener('click', () => {
    closeExhibit();
    onResetExterior?.();
  });

  btnReplay?.addEventListener('click', () => {
    closeExhibit();
    onReplayIntro?.();
  });

  return {
    showExhibit,
    closeExhibit,
    setStage,
  };
}
