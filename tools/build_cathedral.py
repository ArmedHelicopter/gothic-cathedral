# -*- coding: utf-8 -*-
"""
Builds a 100% self-contained single-file HTML for the Sovereign Gothic Sanctuary
and Open-Source Museum (`index.html`):
- Bundles `src/main.js` + local Three.js (`vendor/three.module.min.js`) via esbuild
- Inlines `styles.css`
- Zero external script/image/model/font/audio requests
"""

import glob
import os
import subprocess


def find_esbuild():
    candidates = [
        os.path.join('node_modules', '.bin', 'esbuild.cmd'),
        os.path.join('node_modules', 'esbuild', 'bin', 'esbuild'),
        r'E:\_ryanDev\github_front\node_modules\.bin\esbuild.cmd',
    ]
    candidates += glob.glob(
        os.path.expandvars(
            r'%LOCALAPPDATA%\npm-cache\_npx\*\node_modules\@esbuild\win32-x64\esbuild.exe'
        )
    )
    for c in candidates:
        if c and os.path.exists(c):
            return c
    return 'npx esbuild'


os.makedirs('dist', exist_ok=True)
subprocess.run(
    [
        find_esbuild(),
        'src/main.js',
        '--bundle',
        '--format=esm',
        '--alias:three=./vendor/three.module.min.js',
        '--alias:three/addons/utils/BufferGeometryUtils.js=./vendor/jsm/utils/BufferGeometryUtils.js',
        '--outfile=dist/cathedral.bundle.js',
    ],
    check=True,
    shell=True,
)

with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

with open('dist/cathedral.bundle.js', 'r', encoding='utf-8') as f:
    bundle_js = f.read()

html_out = f"""<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ruining Yang · 极简哥特式圣殿与开源项目博物馆</title>
    <link
      rel="icon"
      type="image/svg+xml"
      href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23040814'/%3E%3Cpath d='M16 4L24 14V27H8V14Z' fill='none' stroke='%23f2f5fc' stroke-width='2'/%3E%3Cpath d='M13 27V18L16 14L19 18V27' fill='%232c5298'/%3E%3C/svg%3E"
    />
    <style>
{css}
    </style>
  </head>
  <body data-stage="loading">
    <canvas id="cathedral-canvas" aria-label="极简哥特式圣殿与开源项目博物馆"></canvas>

    <div id="loading-overlay" aria-live="polite">
      <div class="load-meta">
        <span>SANCTUARY WIREFRAME SYNTHESIS</span>
        <span id="load-pct">00%</span>
      </div>
      <div class="load-bar-track">
        <div id="load-bar-fill" class="load-bar-fill"></div>
      </div>
    </div>

    <div id="cathedral-hud">
      <header class="hud-topbar">
        <div class="brand-pill">
          <span class="brand-dot" aria-hidden="true"></span>
          <span class="brand-title">未竟圣殿 · Sanctuary Museum</span>
          <span class="brand-sub">@ArmedHelicopter</span>
        </div>
        <div class="hud-actions">
          <a id="btn-home" class="pill-btn" href="https://armedhelicopter.github.io/">← 珞珈主页</a>
          <button type="button" id="btn-preset-sovereign" class="pill-btn is-active">晋见主位</button>
          <button type="button" id="btn-preset-masterpiece" class="pill-btn">主画近景</button>
          <button type="button" id="btn-preset-mezzanine" class="pill-btn">二楼俯瞰</button>
          <button type="button" id="btn-preset-stainedglass" class="pill-btn">花窗光影</button>
          <button type="button" id="btn-preset-spiral" class="pill-btn">螺旋阶梯</button>
          <button type="button" id="btn-scroll-mode" class="pill-btn">滚轮 · 视野缩放</button>
          <button type="button" id="btn-replay-dive" class="pill-btn">重播俯冲</button>
        </div>
      </header>

      <div id="pins-layer" class="pins-layer" aria-label="开源项目展品标签"></div>

      <aside id="exhibit-card" class="exhibit-card" aria-hidden="true" role="region" aria-label="展品详情">
        <div class="card-head">
          <div class="card-meta">
            <span id="card-index" class="card-index">NO.00</span>
            <span id="card-tag">IN PROGRESS</span>
          </div>
          <button type="button" id="card-close-btn" class="card-close" aria-label="关闭展品说明">✕</button>
        </div>
        <h2 id="card-title" class="card-title">未竟之作</h2>
        <p id="card-sub" class="card-sub"></p>
        <p id="card-desc" class="card-desc"></p>
        <div id="card-stack" class="card-stack"></div>
        <a id="card-link" class="card-link" href="https://github.com/ArmedHelicopter" target="_blank" rel="noopener noreferrer">
          查看开源仓库
        </a>
        <div class="card-nav">
          <button type="button" id="card-prev-btn" class="card-step-btn">← 上一件</button>
          <button type="button" id="card-next-btn" class="card-step-btn">下一件 →</button>
        </div>
      </aside>

      <div class="controls-hint">WASD / 方向键漫游 · 沿南侧螺旋阶梯可登二楼 · 拖拽环视</div>
      <nav id="exhibit-dock" class="exhibit-dock" aria-label="展品快速导航"></nav>
    </div>

    <main id="webgl-fallback" class="webgl-fallback" hidden>
      <div class="fallback-card">
        <h1>Ruining Yang · @ArmedHelicopter</h1>
        <p>当前浏览器环境未开启 WebGL，无法渲染 3D 教堂博物馆场景。</p>
      </div>
    </main>

    <!--
      Independent Modular Components (window.__CATHEDRAL_COMPONENTS__):
      - src/spiralStaircase.js : Axial Carrara marble spiral staircase & open central well
      - src/foundation.js      : Enclosed marble sanctuary floor, dais carpet & 2nd-floor mezzanine
      - src/gothicShell.js     : 24.5m enclosed gothic nave, ribbed vaults & deep-navy stained glass
      - src/veiledPainting.js  : Sovereign dais A-frame easel & draped unfinished masterpiece
      - src/pedestals.js       : 10 flanking Carrara columns, crystal cloches & 3D project icons
      - src/lighting.js        : Cold deep-navy morning sun rays & isolated warm-gold sovereign beam
      - src/postfx.js          : HDR bloom, NaN-safe toning & radial FPV dive motion blur
      - src/collision.js       : Airtight enclosed bounds, obstacles & spiral staircase collider
    -->
    <script type="module">
{bundle_js}
    </script>
  </body>
</html>
"""

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html_out)

print(f'Successfully built single-file index.html ({len(html_out) / 1024:.1f} KB)')
