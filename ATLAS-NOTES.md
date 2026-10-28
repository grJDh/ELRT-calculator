# Atlas update

Geographic reference: the user's “True and Accurate Map of Khorvaire” DM image,
7680 × 4837, https://i.ibb.co/HfT88jT5/True-and-Accurate-Map-of-Khorvaire-Eberron-DM-vers-sv.jpg.

The background is a simplified geographic vector tracing, not the original raster.
It contains no station or railway marks, so deleting overlay records leaves no
ghost towns or tracks. Borders remain approximate. Coordinates are digitized
from the reference at half size and divided by 3.2.

The original calculator's 23 connections (4E map distances) and 26 stations are the baseline,
not a new comprehensive certification of canon. Twenty-one extra railway towns
and 35 connections from the reference's railway diagrams are seeded as Custom.
Canonical towns can also be in this conservative unverified collection.
New reference route mileage uses the diagram's printed hours multiplied by its
stated 30 mph. The 3E mileage option has been removed; all baseline
distances are 4E.
The diagram's “Galespyre” is normalized to the map's “Galethspyre”.

Two previously fixed extra links are now Custom: Vedykar–Vulyar and
Vulyar–Gatherhold. Existing disabled choices are preserved. Thaliost–Rekkenmark
is a broken crossing, shown dashed and excluded from routing by default.
A one-time correction removes the erroneously active crossing from older saved
connections, backing up the preceding settings. Users may explicitly create a
custom repaired crossing afterwards; that choice survives reload.

Imported additions are seeded once, using atlasVersion: 1. Removing them
survives reload. Existing fares, connections and deleted baseline edges survive
the migration. Old custom town coordinates are approximately relocated by
inverse-distance weighting of the built-in stations' displacement. The original
settings are retained in lightningRailSettingsBeforeAtlas, and towns can be
repositioned manually. Current state is browser-local, as before.

Custom town rename rewrites incident connection endpoints. Removing a custom
town removes its incident custom links after confirmation. The custom toggle
excludes custom records from both display and routing. User edits to baseline
edges remain in Custom, and hiding Custom restores the baseline mileage.

Validation: JavaScript syntax, unique control IDs, local assets, initial seed,
idempotent reload after deletion, legacy-settings migration, visibility toggle,
connected/disconnected route calculation and octilinear track points.
Browser testing was not requested.
