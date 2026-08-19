# Strategy & Diplomacy — Prototype Website

This repository contains a small playable vertical-slice prototype website for "STRATEGY & DIPLOMACY".

What this upload contains (branch: website):

- index.html — Main single-page app with layout: top resource bar, left nav, central canvas map, right context panel.
- styles/style.css — Clean, restrained styling for the interface.
- scripts/app.js — JavaScript engine implementing the game clock, speed controls, nation creator, simple economy, basic construction, and an interactive canvas map with pan/zoom and selectable provinces.
- data/config.json — Data-driven definitions (government types, ideologies, resource categories) to demonstrate extensible configuration.
- data/nation-template.json — Example nation template showing fields used by the nation creator.
- LICENSE — MIT license.
- README.md — How to run and next steps.

How to run locally:
1. Open index.html in any modern browser (no build required).
2. Use the "Nation Creator" to create a custom country. The prototype saves nations in localStorage.
3. Use the top bar to pause / change simulation speed. Click provinces on the map to see province details and build a basic factory to watch construction progress.

Design goals implemented in this vertical slice:
- Real-time simulation with pause and adjustable speed.
- Custom nation creation with many identity fields (name, abbreviation, leader, colours, flag emoji).
- Data-driven category file (config.json) so categories can be extended without code changes.
- Interactive geographic map (canvas) with pan/zoom and province selection.
- Basic economy with resources, production/consumption rates, storage, and a small construction flow that consumes resources over time.
- Simple UI and restrained visual style intended for iteration and polish.

Next steps I recommend:
- Add a lightweight backend (Node + WebSocket) with authoritative simulation for multiplayer and persistence.
- Expand industry, trade, diplomacy and AI systems incrementally (follow the Phase roadmap in the project brief).
- Replace prototype map provinces with geoJSON/world map data and a better renderer (WebGL or Canvas tiled renderer) for performance and fidelity.
- Add unit design, production and logistics systems.

If you'd like, I can open a pull request from the "website" branch into your default branch, or adjust the files (add React/Vite template, CI, GitHub Pages config) — tell me which you'd prefer.
