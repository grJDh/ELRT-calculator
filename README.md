# Lightning Rail Planner

House Orien lightning rail journey planner for Eberron. Vanilla HTML, CSS and JavaScript, with no build step.

The application includes an interactive schematic map, shortest-path search, 3E/4E official baseline mileages from `grJDh/eberron-trains`, ticket prices from published Eberron sources, and locally stored custom stations, routes and fares.

## Run

Open `index.html` in a browser, or serve the directory with any static web server. To publish via GitHub Pages: open this repository's Settings > Pages, choose **Deploy from a branch**, branch **main**, directory **/(root)**, and save.

## Data provenance

- The 3E/4E baseline network and source tariffs are copied from the author's original `grJDh/eberron-trains` project, **read-only**. The original repository was not modified.
- The additional Marketplace-Tellyn-Sigilstar connection and its 150-mile segments were recovered from the previously published Lightning Rail Planner's Sharn-Flamekeep example (1,468 miles, 7 intermediate stops).
- Optional custom connections and custom stations created in the editor are user-supplied and stored only in the local browser.
- This is a reconstructed maintainable version, not an export of the previously published ChatGPT Site. An original source-code export was not available.

Distances are in Eberron miles, time assumes an adjustable train speed plus intermediate-stop layovers, and fares are estimates.
