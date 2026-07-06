# Quakes over Time — Global Earthquake Visualization (2004–2025)

An interactive web-based visualization of **330,000+ earthquakes worldwide from 2004 to 2025**, built with **Leaflet** and **D3.js**. The app combines an animated timeline map, a heatmap overlay, linked bar charts, and rich filtering tools (country search, date range, and spatial brush) to let users explore global seismic activity over two decades.

## Features

### Interactive Map (Leaflet)
- **Circle markers** for each earthquake, encoded on two channels:
  - **Color → Magnitude:** green (< 4.0), yellow (4.0–4.9), orange (5.0–5.9), red (≥ 6.0)
  - **Size → Depth:** five size tiers from shallow (≤ 10 km) to very deep (> 300 km)
- **Heatmap overlay** (Leaflet.heat) showing earthquake density hotspots
- **Basemap switcher** — Streets (OpenStreetMap), Satellite, and Dark (CartoDB) themes
- **Toggleable overlays** — turn circle markers and the heatmap on/off independently
- **Collapsible legend** explaining the color and size encodings

### Timeline Animation
- **Play/pause animation** that steps through earthquakes month-by-month from 2004 to 2025
- **Adjustable playback speed** (1×, 2×, 4×)
- **Scrubbable timeline slider** to jump to any point in time

### Filtering & Search
- **Advanced country search** with autocomplete suggestions, powered by a countries GeoJSON layer, including a **mini-map preview** of the selected country
- **Date range filter** — pick a custom start and end date and view only quakes in that window
- **Brush tool** (Leaflet Draw) — draw a region on the map to filter the charts and heatmap down to just the earthquakes inside your selection

### Linked Visual Insights Panel (D3.js)
- **Earthquake frequency by magnitude** bar chart
- **Earthquake frequency by depth** bar chart
- Both charts update dynamically in response to the timeline, date range, and brush selections

## Project Structure

```
vid-projecttwo-prod/
├── index.html                              # App layout, controls, and panels
├── script.js                               # Map, timeline, charts, and filtering logic
├── style.css                               # Styling for map controls and panels
├── dataCleaner.py                          # Python script that merges & cleans yearly USGS CSVs
└── data/
    ├── merged_earthquakes_2004_2025.csv    # ~330K cleaned earthquake records
    └── countries.geo.json                  # Country boundaries for the search feature
```

## Data

- **`merged_earthquakes_2004_2025.csv`** — ~330,000 earthquake records with the following columns:
  | Column | Description |
  |---|---|
  | `time` | UTC timestamp of the event |
  | `latitude`, `longitude` | Epicenter coordinates |
  | `depth` | Depth in kilometers |
  | `mag` | Magnitude |
  | `place` | Human-readable location description |
  | `year` | Event year (derived) |
- **Source:** [USGS Earthquake Catalog](https://earthquake.usgs.gov/earthquakes/search/) — yearly CSV exports merged and cleaned with `dataCleaner.py`
- **`countries.geo.json`** — country boundary polygons used for the country search and mini-map

### Data Pipeline (`dataCleaner.py`)
The cleaning script loops over yearly USGS CSV exports (2004–2025), keeps only the required columns (`time`, `latitude`, `longitude`, `depth`, `mag`, `place`), drops rows with missing values, derives a `year` column, and merges everything into a single CSV.

```bash
pip install pandas
python dataCleaner.py
```
(Update `FOLDER_PATH` in the script to point at the folder containing your yearly CSVs.)

## Technologies

- [Leaflet](https://leafletjs.com/) — interactive map rendering
- [Leaflet.heat](https://github.com/Leaflet/Leaflet.heat) — heatmap layer
- [Leaflet Draw](https://github.com/Leaflet/Leaflet.draw) — brush/region selection
- [D3.js v7](https://d3js.org/) — data loading and bar charts
- [Lucide](https://lucide.dev/) — UI icons
- [CesiumJS](https://cesium.com/platform/cesiumjs/) — included for an experimental 3D globe view
- Vanilla HTML/CSS/JavaScript — no build step required

## Getting Started

The app loads the CSV and GeoJSON files with `d3.csv`/`d3.json`, so it must be served over HTTP (opening `index.html` directly via `file://` will fail due to browser CORS restrictions).

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   cd vid-projecttwo-prod
   ```
2. Start a local server:
   ```bash
   # Python 3
   python -m http.server 8000
   ```
3. Open [http://localhost:8000](http://localhost:8000) in your browser.

> **Note:** The merged dataset is ~29 MB, so the first load may take a few seconds.

## How to Use

1. Press **▶️ Play** to animate earthquakes through time, or drag the slider to a specific year/month.
2. Use the **layers button** to switch basemaps or toggle circle markers and the heatmap.
3. Open the **legend** to interpret marker colors (magnitude) and sizes (depth).
4. Use the **search button** to find a country — matching quakes are highlighted and a mini-map previews the region.
5. Open the **calendar** to filter quakes to a custom date range.
6. Use the **brush tool** to draw a region on the map and see the magnitude/depth charts update for just that area.
7. Open the **bar chart button** to view the Visual Insights panel with magnitude and depth distributions.

## Insights You Can Explore

- The Ring of Fire lighting up as the dominant hotspot of global seismic activity
- Major events like the 2004 Sumatra and 2011 Tōhoku earthquakes and their aftershock sequences
- How deep-focus earthquakes cluster around subduction zones
- The distribution of earthquake magnitudes — small quakes vastly outnumber large ones

## License

This project was created for academic purposes. Earthquake data courtesy of the USGS Earthquake Hazards Program.
