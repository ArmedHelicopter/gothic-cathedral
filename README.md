# 2.5D Minimalist Gothic Cathedral & Open-Source Project Museum

100% procedural single-file Three.js 2.5D museum gallery in **Navy / Black / White**, built as an interactive counterpart to [ArmedHelicopter.github.io](https://armedhelicopter.github.io/).

## Highlights
- **Zero External Assets**: All geometries, procedural marble/slate/linen textures, stained glass, and open-source project emblems are generated in code with local Three.js bundled inline.
- **Genshin-Style Door-Opening Assembly**: No loading progress bar — launches straight into a far-to-near atmospheric emergence as twin carved Gothic doors swing open.
- **Pew-Free Open Nave & Sanctuary**: Unveils a draped cloth shroud over the central unfinished canvas flanked by 10 Carrara marble pedestals topped with crystal bell-jar cloches.
- **Modular Architecture (`window.__CATHEDRAL_COMPONENTS__`)**: Independent `foundation`, `gothicShell`, `portalDoors`, `veiledPainting`, `pedestals`, `lighting`, and `postfx` modules for isolated iteration.

## Build Single-File `index.html`

```bash
python tools/build_cathedral.py
```
