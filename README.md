# Lightning Rail Planner

Actual source export of the Eberron Lightning Rail Planner developed in ChatGPT Sites, including the geographic atlas, editable custom collection and right-click map tools. This replaces the reconstructed version previously committed here. Its earlier commits remain in Git history.

## Run

No build step or dependencies are required. Serve this directory using any static web server (for example `python -m http.server 8000`) and open http://localhost:8000. For GitHub Pages use Settings > Pages > Deploy from a branch > main > /(root).

## Files

- index.html: application interface
- styles.css: application styling
- app.js: routing, fares, local storage and map editor
- atlas.js: reference-map station positions and optional railways
- atlas.svg: simplified geographic background
- ATLAS-NOTES.md: provenance, mileage assumptions and migration notes

## Features and data

Shortest-path routing, 3E/4E baseline distances, configurable fares and speed, custom towns and connections, edit/remove controls, right-click actions and network backup export. The Thaliost–Rekkenmark bridge is broken and excluded from routing by default.

Additional reference-map towns and railways are in the Custom collection and can be edited, removed or excluded from display and routing. Unverified does not necessarily mean non-canon. See ATLAS-NOTES.md for limitations.

Settings are stored locally in the browser. Settings on the old Sites domain do not automatically transfer to the GitHub Pages domain.

## Source

Exported from the actual Site checkout at source commit cb5a82c25a7608f252e27b2ea05e4d2723f8460d. Original calculator: https://github.com/grJDh/eberron-trains (read-only reference; not modified by this transfer).

The obsolete style.css belongs to the previous reconstructed version and is not loaded by the exported application.
