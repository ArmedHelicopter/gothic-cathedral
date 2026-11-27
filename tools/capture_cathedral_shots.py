# -*- coding: utf-8 -*-
import os
import sys
import time
from playwright.sync_api import sync_playwright

out_dir = sys.argv[1] if len(sys.argv) > 1 else 'audit_cathedral'
os.makedirs(out_dir, exist_ok=True)

html_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html')).replace('\\', '/')
file_url = f'file:///{html_path}?intro=0'

shots = [
    ('01_intro_road_paving_early.png', 'intro', 0.14, True, 56),
    ('02_intro_road_and_cathedral_rising.png', 'intro', 0.36, True, 55),
    ('03_intro_doors_opening.png', 'intro', 0.68, True, 44),
    ('04_nave_axial_interior.png', 'cam', ([0.0, 2.85, 13.4], [0.0, 2.85, -11.5]), True, 44),
    ('05_exterior_gothic_diorama.png', 'cam', ([38.0, 22.0, 44.0], [0.0, 5.8, 6.0]), True, 40),
    ('06_interior_25d_cutaway.png', 'cam', ([15.2, 13.2, 19.2], [0.0, 2.05, -0.6]), True, 45),
    ('07_veiled_painting_closeup.png', 'cam', ([2.45, 2.95, -5.6], [0.0, 2.75, -12.3]), True, 44),
    ('08_pedestal_cloches_closeup.png', 'cam', ([-2.45, 2.08, 11.25], [-4.65, 1.48, 9.6]), True, 40),
    ('09_gallery_hud_showcase.png', 'cam', ([15.2, 13.2, 19.2], [0.0, 2.05, -0.6]), False, 45),
]

console_errors = []
external_requests = []

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'],
    )
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
    page.on('pageerror', lambda err: console_errors.append(str(err)))
    page.on(
        'request',
        lambda req: external_requests.append(req.url)
        if not req.url.startswith('file://') and not req.url.startswith('data:')
        else None,
    )

    page.goto(file_url)
    page.wait_for_function('() => window.__CATHEDRAL_READY__ === true', timeout=15000)

    gpu_renderer = page.evaluate('''() => {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2');
      if (!gl) return 'no-webgl2';
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      return dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    }''')
    print('GPU_RENDERER:', gpu_renderer)
    time.sleep(0.45)

    for fname, mode, arg, hide_ui, fov in shots:
        if mode == 'intro':
            page.evaluate(
                f'() => window.__CATHEDRAL_DEBUG__.setIntroProgress({arg}, {{ hideUi: {str(hide_ui).lower()} }})'
            )
        else:
            pos, tgt = arg
            page.evaluate(
                f'() => window.__CATHEDRAL_DEBUG__.setCamera({pos}, {tgt}, {{ hideUi: {str(hide_ui).lower()}, fov: {fov} }})'
            )
        time.sleep(0.35)
        out_path = os.path.join(out_dir, fname)
        page.screenshot(path=out_path)
        print(f'Saved {out_path}')

    metrics = page.evaluate('() => window.__CATHEDRAL_DEBUG__.getMetrics()')
    print('METRICS:', metrics)
    print('CONSOLE_ERRORS:', len(console_errors), console_errors)
    print('EXTERNAL_REQUESTS:', len(external_requests), external_requests)
    browser.close()
