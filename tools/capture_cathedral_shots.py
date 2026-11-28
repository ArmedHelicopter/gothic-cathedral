# -*- coding: utf-8 -*-
import os
import sys
import time
from playwright.sync_api import sync_playwright

out_dir = sys.argv[1] if len(sys.argv) > 1 else 'shots_v18'
os.makedirs(out_dir, exist_ok=True)

html_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html')).replace('\\', '/')
file_url = f'file:///{html_path}?intro=0'

shots = [
    ('01_entrance.png', 'preset', 'sovereign', True),
    ('02_vault_lookup.png', 'camera', ([0.0, 3.2, 4.0], [0.0, 23.0, -4.0], 58), True),
    ('03_pedestal.png', 'camera', ([3.05, 2.2, 16.35], [5.6, 1.72, 14.5], 40), True),
    ('04_organ_gallery_lookback.png', 'preset', 'mezzanine', True),
    ('05_veiled_painting.png', 'preset', 'masterpiece', True),
]

console_errors = []
external_requests = []

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'],
    )
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    page.on('console', lambda msg: console_errors.append(f'{msg.text} @ {msg.location}') if msg.type == 'error' else None)
    page.on('pageerror', lambda err: console_errors.append(str(err)))
    page.on(
        'request',
        lambda req: external_requests.append(req.url)
        if not req.url.startswith('file://') and not req.url.startswith('data:')
        else None,
    )

    page.goto(file_url)
    page.wait_for_function('() => window.__CATHEDRAL_READY__ === true', timeout=25000)

    gpu_renderer = page.evaluate('''() => {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2');
      if (!gl) return 'no-webgl2';
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      return dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    }''')
    print('GPU_RENDERER:', gpu_renderer)
    time.sleep(0.45)

    for fname, mode, arg, hide_ui in shots:
        hide_js = str(hide_ui).lower()
        if mode == 'load':
            page.evaluate(f'() => window.__CATHEDRAL_DEBUG__.setLoadingProgress({arg}, {{ hideUi: {hide_js} }})')
        elif mode == 'mat':
            page.evaluate(f'() => window.__CATHEDRAL_DEBUG__.setMaterializeProgress({arg}, {{ hideUi: {hide_js} }})')
        elif mode == 'dive':
            page.evaluate(f'() => window.__CATHEDRAL_DEBUG__.setDiveTime({arg}, {{ hideUi: {hide_js} }})')
        elif mode == 'camera':
            pos, target, fov = arg
            page.evaluate(f'() => window.__CATHEDRAL_DEBUG__.setCamera({list(pos)}, {list(target)}, {{ hideUi: {hide_js}, fov: {fov} }})')
        else:
            page.evaluate(f"() => window.__CATHEDRAL_DEBUG__.goToPreset('{arg}', {{ hideUi: {hide_js} }})")
        time.sleep(0.35)
        out_path = os.path.join(out_dir, fname)
        page.screenshot(path=out_path)
        print(f'Saved {out_path}')

    metrics = page.evaluate('() => window.__CATHEDRAL_DEBUG__.getMetrics()')
    print('METRICS:', metrics)
    print('CONSOLE_ERRORS:', len(console_errors), console_errors)
    print('EXTERNAL_REQUESTS:', len(external_requests), external_requests)
    browser.close()
