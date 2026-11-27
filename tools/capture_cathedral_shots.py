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
    ('01_intro_building_assembly.png', 'intro', 0.28, True),
    ('02_intro_doors_opening.png', 'intro', 0.78, True),
    ('03_exterior_gothic_diorama.png', 'cam', ([31.0, 22.0, 37.5], [0.0, 6.4, 0.5]), True),
    ('04_nave_axial_interior.png', 'cam', ([0.0, 3.25, 13.4], [0.0, 2.75, -12.5]), True),
    ('05_interior_25d_cutaway.png', 'cam', ([13.2, 10.6, 11.4], [-0.6, 2.2, -3.6]), True),
    ('06_veiled_painting_closeup.png', 'cam', ([2.2, 3.05, -6.6], [0.0, 2.95, -12.5]), True),
    ('07_pedestal_cloches_closeup.png', 'cam', ([-0.95, 2.25, 6.6], [-3.85, 1.85, 3.2]), True),
]

console_errors = []
external_requests = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
    page.on('pageerror', lambda err: console_errors.append(str(err)))
    page.on('request', lambda req: external_requests.append(req.url) if not req.url.startswith('file://') and not req.url.startswith('data:') else None)

    page.goto(file_url)
    page.wait_for_function('() => window.__CATHEDRAL_READY__ === true', timeout=15000)
    time.sleep(0.5)

    for fname, mode, arg, hide_ui in shots:
        if mode == 'intro':
            page.evaluate(f'() => window.__CATHEDRAL_DEBUG__.setIntroProgress({arg}, {{ hideUi: {str(hide_ui).lower()} }})')
        else:
            pos, tgt = arg
            page.evaluate(f'() => window.__CATHEDRAL_DEBUG__.setCamera({pos}, {tgt}, {{ hideUi: {str(hide_ui).lower()} }})')
        time.sleep(0.35)
        out_path = os.path.join(out_dir, fname)
        page.screenshot(path=out_path)
        print(f'Saved {out_path}')

    metrics = page.evaluate('() => window.__CATHEDRAL_DEBUG__.getMetrics()')
    print('METRICS:', metrics)
    print('CONSOLE_ERRORS:', len(console_errors), console_errors)
    print('EXTERNAL_REQUESTS:', len(external_requests), external_requests)
    browser.close()
