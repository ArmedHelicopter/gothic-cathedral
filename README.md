# English Perpendicular Gothic Cathedral & Open-Source Project Museum

A fully procedural, offline single-file Three.js museum in ivory stone, midnight navy and pale gold, created as an interactive counterpart to ArmedHelicopter.github.io.

## Highlights
- **Zero external assets**: geometry, marble, stained glass, project emblems, organ pipes and candle flames are generated in code; Three.js is bundled locally.
- **Perpendicular Gothic interior**: continuous pier shafts, three-storey nave elevation, stellar lierne vaults with gilt bosses, aisle vaults and a south rose window.
- **Blue-hour lighting**: navy glass and twilight fog, eight dynamic lights, emissive candle coronas and pale-gold exhibit pools, with pre-baked static shadows.
- **Ten open-source exhibits**: moulded ivory pedestals, brass nameplates, glass cloches and procedural project sculptures, plus the central veiled painting.
- **Walkable organ gallery**: climb the spiral staircase, cross the pierced parapet gallery and look back through the central organ opening toward the unobstructed rose window.
- **Seven-second reveal**: blueprint materialization, FPV descent, vault look-up and sequential candle ignition. Any click or key skips to the identical final state; reduced-motion uses a short fade instead.

## Controls
- **WASD / arrow keys**: walk; **Shift**: move faster
- **Drag**: look around; **wheel**: zoom
- **Click an exhibit**: focus it and open its project details
- **Preset buttons**: entrance, painting, organ-gallery look-back, clerestory and staircase

## Build and run

```bash
python tools/build_cathedral.py
```

Open `index.html` directly. Add `?intro=0` to start at the final illuminated state. Runtime components are exposed through `window.__CATHEDRAL_COMPONENTS__`, and deterministic capture/debug controls through `window.__CATHEDRAL_DEBUG__`.

## Acceptance captures

```bash
python tools/capture_cathedral_shots.py shots
```

This saves the entrance, vault look-up, pedestal, organ-gallery look-back and painting views locally. Screenshots are not committed.
