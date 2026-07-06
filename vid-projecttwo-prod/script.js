// Create the Leaflet map
const map = L.map('map', {
  zoomControl: false
}).setView([20, 0], 2);

// Add zoom control in bottom right
L.control.zoom({
  position: 'bottomleft'
}).addTo(map);

let viewer3D;
let is3DActive = false;


// Animation variables

let isTimelinePlaying = false;
let timelineInterval = null;
let timelineYear = 2025.00;
const timelineMin = 2004.00;
const timelineMax = 2025.00;
let playbackSpeed = 1; // default 1x





// Define base map layers
const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
});
const satellite = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenTopoMap contributors'
});
const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; CartoDB'
});
dark.addTo(map);

// Base map toggle
document.getElementById("basemap-toggle").addEventListener("click", () => {
  document.getElementById("basemap-menu").classList.toggle("hidden");
});
document.querySelectorAll("input[name='basemap']").forEach(radio => {
  radio.addEventListener("change", e => {
    const selected = e.target.value;
    map.eachLayer(layer => map.removeLayer(layer));
    if (selected === "streets") streets.addTo(map);
    else if (selected === "satellite") satellite.addTo(map);
    else if (selected === "dark") dark.addTo(map);
    if (window.earthquakeLayer) map.addLayer(window.earthquakeLayer);
  });
});

// Earthquake markers
const quakeGroup = L.layerGroup();
window.earthquakeLayer = quakeGroup;

d3.csv('/data/merged_earthquakes_2004_2025.csv').then(data => {
  data.forEach(d => {
    const lat = +d.latitude;
    const lon = +d.longitude;
    const magnitude = +d.mag;
    const depth = +d.depth;
    const place = d.place;
    const localTime = new Date(d.time).toLocaleString();

    const color = magnitude >= 6 ? '#ff0000' :
                  magnitude >= 5 ? '#ff8000' :
                  magnitude >= 4 ? '#ffff00' : '#00ff00';

    const radius = depth <= 10 ? 4 :
                   depth <= 30 ? 6 :
                   depth <= 70 ? 8 :
                   depth <= 300 ? 10 : 12;

    const circle = L.circleMarker([lat, lon], {
      radius,
      fillColor: color,
      color: "#222",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    }).bindTooltip(
      `<b>${place}</b><br/>Mag: ${magnitude}, Depth: ${depth} km<br/>${localTime}`,
      {
        direction: 'top',
        sticky: true,
        opacity: 0.9,
        className: 'quake-tooltip'
      }
    );

    quakeGroup.addLayer(circle);
  });

  quakeGroup.addTo(map);
});

let heatLayer = null;


let allData = []; // Store full dataset
let currentYear = null;



// brush tool initialisation 

let frameData = []; // holds timeline-frame-based data (month or quarter)
let drawnItems = new L.FeatureGroup().addTo(map);
let drawControl = new L.Control.Draw({
  draw: {
    polygon: false,
    circle: false,
    polyline: false,
    marker: false,
    circlemarker: false,
    rectangle: true
  },
  edit: {
    featureGroup: drawnItems,
    edit: false,
    remove: true
  }
});


// 3D Map loading 

// function initCesiumViewer(data) {
//   viewer3D = new Cesium.Viewer('cesiumContainer', {
//     timeline: false,
//     animation: false,
//     baseLayerPicker: false,
//     geocoder: false,
//     homeButton: false,
//     infoBox: false,
//     sceneModePicker: false,
//     navigationHelpButton: false,
//     scene3DOnly: true,

//   });

//   // Add earthquake points
//   data.forEach(d => {
//     const mag = +d.mag;
//     const depth = +d.depth;

//     const color = mag >= 6 ? Cesium.Color.RED :
//                   mag >= 5 ? Cesium.Color.ORANGE :
//                   mag >= 4 ? Cesium.Color.YELLOW : Cesium.Color.LIME;

//     viewer3D.entities.add({
//       position: Cesium.Cartesian3.fromDegrees(+d.longitude, +d.latitude),
//       point: {
//         pixelSize: depth <= 10 ? 4 :
//                    depth <= 30 ? 6 :
//                    depth <= 70 ? 8 :
//                    depth <= 300 ? 10 : 12,
//         color: color,
//         outlineColor: Cesium.Color.BLACK,
//         outlineWidth: 1,
//       },
//       description: `Mag: ${mag}<br>Depth: ${depth} km<br>Place: ${d.place}`
//     });
//   });

//   viewer3D.zoomTo(viewer3D.entities);
// }


// document.getElementById('toggle-3d').addEventListener('click', () => {
//   is3DActive = !is3DActive;

//   if (is3DActive) {
//     if (heatLayer) {
//       map.removeLayer(heatLayer);
//     }
//     // Hide Leaflet map, show Cesium
//     document.getElementById('map').style.display = 'none';
//     document.getElementById('cesiumContainer').style.display = 'block';
//     document.getElementById('toggle-3d').textContent = '🗺️';

//     if (!viewer3D) {
//       initCesiumViewer(currentFilteredData); // use full data or filtered if desired
//     }
//   } else {
//     // Show Leaflet map, hide Cesium
//     document.getElementById('map').style.display = 'block';
//     document.getElementById('cesiumContainer').style.display = 'none';
//     document.getElementById('toggle-3d').textContent = '🌍';

//     // 🔁 If user had heatmap enabled, re-render it
//     if (document.getElementById('toggle-heatmap').checked) {
//       renderHeatmap(currentFilteredData); // or allData if not filtering
//     }

    
//   }
// });



// Load full data once and keep in memory
d3.csv('/data/merged_earthquakes_2004_2025.csv').then(data => {
  data.forEach(d => {
    d.latitude = +d.latitude;
    d.longitude = +d.longitude;
    d.mag = +d.mag;
    d.depth = +d.depth;
    d.year = +d.year;
  });

  allData = data;
  renderMapByYear(2025); // Load latest year initially
  renderYearDropdown();
  // renderMagnitudeChart(allData);
});

// let currentFilteredData = allData;


// Function to render map for a specific year
function renderMapByYear(year) {
  currentYear = year;
  const filtered = allData.filter(d => d.year === year);

  quakeGroup.clearLayers();

  filtered.forEach(d => {
    const color = d.mag >= 6 ? '#ff0000' :
                  d.mag >= 5 ? '#ff8000' :
                  d.mag >= 4 ? '#ffff00' : '#00ff00';

    const radius = d.depth <= 10 ? 4 :
                   d.depth <= 30 ? 6 :
                   d.depth <= 70 ? 8 :
                   d.depth <= 300 ? 10 : 12;

    const localTime = new Date(d.time).toLocaleString();

    const circle = L.circleMarker([d.latitude, d.longitude], {
      radius,
      fillColor: color,
      color: "#222",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    }).bindTooltip(
      `<b>${d.place}</b><br/>Mag: ${d.mag}, Depth: ${d.depth} km<br/>${localTime}`,
      {
        direction: 'top',
        sticky: true,
        opacity: 0.9,
        className: 'quake-tooltip'
      }
    );

    quakeGroup.addLayer(circle);
  });

  quakeGroup.addTo(map);

  // Update active year UI
  document.querySelectorAll('.year-item').forEach(el => {
    el.classList.toggle('active', +el.dataset.year === year);
  });
  // currentFilteredData = filtered; // Update global tracker
  renderMagnitudeChart(filtered);  // Update chart
  renderDepthChart(filtered);
  renderHeatmap(filtered);



}
// Overlay toggle logic
document.getElementById('toggle-circles').addEventListener('change', function () {
  if (this.checked) {
    map.addLayer(quakeGroup);
    map.addLayer(mainFrameLayer); // 🔁 Add animated points too
  } else {
    map.removeLayer(quakeGroup);
    map.removeLayer(mainFrameLayer);
  }
});


document.getElementById('toggle-heatmap').addEventListener('change', function () {
  if (this.checked && heatLayer) {
    map.addLayer(heatLayer);
  } else if (heatLayer) {
    map.removeLayer(heatLayer);
  }
});

// Respect toggle states on each render
if (!document.getElementById('toggle-circles').checked) {
  map.removeLayer(quakeGroup);
}

if (!document.getElementById('toggle-heatmap').checked && heatLayer) {
  map.removeLayer(heatLayer);
}



function renderMapByDateRange(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  quakeGroup.clearLayers();
  mainFrameLayer.clearLayers();
  ghostLayer.clearLayers();

  const filtered = allData.filter(d => {
    const quakeTime = new Date(d.time);
    return quakeTime >= start && quakeTime <= end;
  });

  filtered.forEach(d => {
    const color = d.mag >= 6 ? '#ff0000' :
                  d.mag >= 5 ? '#ff8000' :
                  d.mag >= 4 ? '#ffff00' : '#00ff00';

    const radius = d.depth <= 10 ? 4 :
                   d.depth <= 30 ? 6 :
                   d.depth <= 70 ? 8 :
                   d.depth <= 300 ? 10 : 12;

    const localTime = new Date(d.time).toLocaleString();

    const circle = L.circleMarker([d.latitude, d.longitude], {
      radius,
      fillColor: color,
      color: "#222",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    }).bindTooltip(
      `<b>${d.place}</b><br/>Mag: ${d.mag}, Depth: ${d.depth} km<br/>${localTime}`,
      {
        direction: 'top',
        sticky: true,
        opacity: 0.9,
        className: 'quake-tooltip'
      }
    );

    quakeGroup.addLayer(circle);
  });
  // currentFilteredData = filtered; // Update global tracker
  renderMagnitudeChart(filtered);  // Update chart
  renderDepthChart(filtered);
  renderHeatmap(filtered);



}


function renderYearDropdown() {
  const dropdown = document.getElementById('year-dropdown');
  for (let y = 2004; y <= 2025; y++) {
    const option = document.createElement('option');
    option.value = y;
    option.textContent = y;
    dropdown.appendChild(option);
  }

  dropdown.value = 2025; // default year

  dropdown.addEventListener('change', () => {
    renderMapByYear(+dropdown.value);
  });
}

document.getElementById('date-range-toggle').addEventListener('click', () => {
  document.getElementById('date-range-panel').classList.toggle('hidden');
});

document.getElementById('apply-date-range').addEventListener('click', () => {
  const start = document.getElementById('start-date').value;
  const end = document.getElementById('end-date').value;

  if (!start || !end) {
    alert('Please select both start and end dates.');
    return;
  }

  renderMapByDateRange(start, end);
});

document.getElementById('reset-date-range').addEventListener('click', () => {
  document.getElementById('start-date').value = '';
  document.getElementById('end-date').value = '';
  document.getElementById('date-range-panel').classList.add('hidden');

  // Clear date filter & restore timeline view
  quakeGroup.clearLayers();
  mainFrameLayer.clearLayers();
  ghostLayer.clearLayers();

  updateTimelineYear(2025.00); // Reset to Jan 2025
});


// Visualisations section

function renderMagnitudeChart(data) {
  // Binning buckets
  const bins = {
    "2.0–2.9": 0,
    "3.0–3.9": 0,
    "4.0–4.9": 0,
    "5.0–5.9": 0,
    "6.0–6.9": 0,
    "7.0–7.9": 0,
    "8.0+": 0
  };

  // Bin the data
  data.forEach(d => {
    const mag = +d.mag;
    if (mag >= 2 && mag < 3) bins["2.0–2.9"]++;
    else if (mag < 4) bins["3.0–3.9"]++;
    else if (mag < 5) bins["4.0–4.9"]++;
    else if (mag < 6) bins["5.0–5.9"]++;
    else if (mag < 7) bins["6.0–6.9"]++;
    else if (mag < 8) bins["7.0–7.9"]++;
    else bins["8.0+"]++;
  });

  const svg = d3.select("#magnitude-chart");
  const width = 400;
const height = 250;
svg.attr("width", width).attr("height", height);
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };

  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  svg.selectAll("*").remove(); // ✅ Clear old content
  

  const x = d3.scaleBand()
    .domain(Object.keys(bins))
    .range([0, chartWidth])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(Object.values(bins))])
    .range([chartHeight, 0]);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  
  

  // Bars
  g.selectAll(".bar")
    .data(Object.entries(bins))
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1]))
    .attr("width", x.bandwidth())
    .attr("height", d => chartHeight - y(d[1]))
    .attr("fill", "#f7c948")
    .on("mouseover", function (event, d) {
      const [label, count] = d;
      d3.select(this).attr("fill", "#e67e22");
      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#333")
        .style("color", "#fff")
        .style("padding", "6px")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .html(`<strong>${label}</strong><br>${count} quakes`);

        tooltip.style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 40) + "px")
        .style("display", "block");
 
    })
    .on("mousemove", function (event) {
      d3.select(".tooltip")
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 40) + "px");
    })
    .on("mouseout", function () {
      d3.select(this).attr("fill", "#f7c948");
      d3.selectAll(".tooltip").remove();
    });

  // X-axis
  g.append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x));

  // Y-axis
  g.append("g")
    .call(d3.axisLeft(y));
}



function renderDepthChart(data) {
  const depthBins = {
    "0–10 km": 0,
    "11–30 km": 0,
    "31–70 km": 0,
    "71–300 km": 0,
    "300+ km": 0
  };

  data.forEach(d => {
    const depth = +d.depth;
    if (depth <= 10) depthBins["0–10 km"]++;
    else if (depth <= 30) depthBins["11–30 km"]++;
    else if (depth <= 70) depthBins["31–70 km"]++;
    else if (depth <= 300) depthBins["71–300 km"]++;
    else depthBins["300+ km"]++;
  });

  const svg = d3.select("#depth-chart");
  svg.selectAll("*").remove(); // Clear previous chart

  const width = 400;
  const height = 250;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  svg.attr("width", width).attr("height", height);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(Object.keys(depthBins))
    .range([0, chartWidth])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(Object.values(depthBins))])
    .range([chartHeight, 0]);

  // Bars
  g.selectAll(".bar")
    .data(Object.entries(depthBins))
    .enter()
    .append("rect")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1]))
    .attr("width", x.bandwidth())
    .attr("height", d => chartHeight - y(d[1]))
    .attr("fill", "#3498db")
    .on("mouseover", function (event, d) {
      const [label, count] = d;
      d3.select(this).attr("fill", "#2980b9");
      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#333")
        .style("color", "#fff")
        .style("padding", "6px 10px")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("z-index", 9999)
        .html(`<strong>${label}</strong><br>${count} quakes`)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 40) + "px");
    })
    .on("mousemove", function (event) {
      d3.select(".tooltip")
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 40) + "px");
    })
    .on("mouseout", function () {
      d3.select(this).attr("fill", "#3498db");
      d3.selectAll(".tooltip").remove();
    });

  // Axes
  g.append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x));

  g.append("g")
    .call(d3.axisLeft(y));
}


function renderHeatmap(data) {
  // Remove previous heat layer
  if (heatLayer) {
    map.removeLayer(heatLayer);
  }

  // Build heatmap data: [lat, lon, intensity]
  const heatData = data.map(d => {
    const lat = +d.latitude;
    const lon = +d.longitude;
    const intensity = Math.min(+d.mag, 7) / 7; // Normalize mag (0–1)
    return [lat, lon, intensity];
  });

  // Create heat layer
  heatLayer = L.heatLayer(heatData, {
    radius: 20,
    blur: 15,
    maxZoom: 6,
    gradient: {
      0.2: '#00f',
      0.4: '#0f0',
      0.6: '#ff0',
      0.8: '#f90',
      1.0: '#f00'
    }
  }).addTo(map);
}








// Legend toggle
document.getElementById("legend-toggle").addEventListener("click", () => {
  document.getElementById("legend-box").classList.toggle("hidden");
});

// Advanced Search Panel
let miniMap;
let miniQuakeLayer = L.layerGroup();
let countryGeoJSON;

d3.json('/data/countries.geo.json').then(geoData => {
  countryGeoJSON = geoData;
  const countryNames = geoData.features.map(f => f.properties.name);

  const input = document.getElementById('country-input');
  const suggestionsBox = document.getElementById('suggestions');

  input.addEventListener('input', () => {
    const value = input.value.toLowerCase();
    suggestionsBox.innerHTML = '';
    if (value.length < 1) return;
    const matches = countryNames.filter(name =>
      name.toLowerCase().includes(value)
    );
    matches.slice(0, 5).forEach(name => {
      const div = document.createElement('div');
      div.textContent = name;
      div.addEventListener('click', () => {
        input.value = name;
        suggestionsBox.innerHTML = '';
      });
      suggestionsBox.appendChild(div);
    });
  });

  document.getElementById('country-search-btn').addEventListener('click', () => {
    const selectedCountry = input.value.trim();
    const feature = geoData.features.find(
      f => f.properties.name.toLowerCase() === selectedCountry.toLowerCase()
    );
    if (!feature) {
      alert('Country not found!');
      return;
    }

    // RESET: clean previous search
    document.getElementById('mini-map-container').classList.remove('hidden');
    // Remove old mini-map instance if it exists
if (miniMap) {
  miniMap.remove();
  miniMap = null;
}
document.getElementById('mini-map-container').innerHTML = '<div id="mini-map"></div>';


    if (window.countryHighlightLayer) {
      window.countryHighlightLayer.clearLayers();
    }

    if (miniQuakeLayer) miniQuakeLayer.clearLayers();

    // Create or reuse mini-map
    if (!miniMap) {
      miniMap = L.map('mini-map').setView([20, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(miniMap);
    }

    const boundary = L.geoJSON(feature).addTo(miniMap);
    miniMap.fitBounds(boundary.getBounds());
    // map.fitBounds(boundary.getBounds());

    boundary.setStyle({
      color: "#0077cc",
      weight: 2,
      fillOpacity: 0.05
    });

    const bounds = boundary.getBounds();
    let totalMag = 0, totalDepth = 0, count = 0;

    if (!window.countryHighlightLayer) {
      window.countryHighlightLayer = L.layerGroup().addTo(map);
    } else {
      window.countryHighlightLayer.clearLayers();
    }

    d3.csv('/data/merged_earthquakes_2004_2025.csv').then(data => {
      data.forEach(d => {
        const lat = +d.latitude;
        const lon = +d.longitude;
        const magnitude = +d.mag;
        const depth = +d.depth;
        const place = d.place;
        const time = new Date(d.time).toLocaleString();

        if (!bounds.contains([lat, lon])) return;

        totalMag += magnitude;
        totalDepth += depth;
        count++;

        const color = magnitude >= 6 ? '#ff0000' :
                      magnitude >= 5 ? '#ff8000' :
                      magnitude >= 4 ? '#ffff00' : '#00ff00';
        const radius = depth <= 10 ? 4 :
                       depth <= 30 ? 6 :
                       depth <= 70 ? 8 :
                       depth <= 300 ? 10 : 12;

        const miniCircle = L.circleMarker([lat, lon], {
          radius,
          fillColor: color,
          color: "#222",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        }).bindTooltip(
          `<b>${place}</b><br/>Mag: ${magnitude}, Depth: ${depth} km<br/>${time}`,
          { direction: 'top', sticky: true, opacity: 0.9, className: 'quake-tooltip' }
        );
        miniQuakeLayer.addLayer(miniCircle);

        const highlightCircle = L.circleMarker([lat, lon], {
          radius: 4,
          color: '#00ffff',
          fillColor: '#00ffff',
          fillOpacity: 0.6,
          weight: 1
        }).bindTooltip(`${place}<br>Mag: ${magnitude}, Depth: ${depth} km`);
        window.countryHighlightLayer.addLayer(highlightCircle);
      });

      miniQuakeLayer.addTo(miniMap);

      // Show stats
      const quakeCount = count;
      const avgMag = (totalMag / count).toFixed(2);
      const avgDepth = (totalDepth / count).toFixed(1);
      const statsHTML = `
        <p><strong>${quakeCount}</strong> earthquakes found in <strong>${selectedCountry}</strong></p>
        <p><strong>Average Magnitude:</strong> ${avgMag}</p>
        <p><strong>Average Depth:</strong> ${avgDepth} km</p>
      `;
      const statsDiv = document.createElement('div');
      statsDiv.innerHTML = statsHTML;
      document.getElementById('mini-map-container').appendChild(statsDiv);
    });
  });
});

// Toggle panel
document.getElementById("advanced-search-toggle").addEventListener("click", () => {
  document.getElementById("advanced-search-panel").classList.toggle("hidden");
});

// Close panel button
document.getElementById("close-search-panel").addEventListener("click", () => {
  document.getElementById("advanced-search-panel").classList.add("hidden");
});

// Clear search
document.getElementById('clear-search-btn').addEventListener('click', () => {
  document.getElementById('country-input').value = '';
  document.getElementById('suggestions').innerHTML = '';
  document.getElementById('mini-map-container').classList.add('hidden');

  if (miniMap) {
    miniMap.eachLayer(layer => {
      if (layer instanceof L.TileLayer) return;
      miniMap.removeLayer(layer);
    });
    miniQuakeLayer.clearLayers();
  }

  if (window.countryHighlightLayer) {
    map.removeLayer(window.countryHighlightLayer);
  }
});


document.getElementById('viz-toggle').addEventListener('click', () => {
  const panel = document.getElementById('viz-panel');
  panel.classList.toggle('visible');
});


// Animation logic 

let ghostLayer = L.layerGroup().addTo(map); // holds faded points
let mainFrameLayer = L.layerGroup().addTo(map); // main quarter points

function getMonthRange(monthYear) {
  const year = Math.floor(monthYear);
  const monthFloat = monthYear % 1;
  const monthIndex = Math.round(monthFloat * 12); // 0–11

  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0); // last day of month

  return { start, end };
}



function updateTimelineYear(monthYear) {
  timelineYear = parseFloat(monthYear.toFixed(3));
  const { start, end } = getMonthRange(timelineYear);

  // One-month ghost trail
  const previousMonth = parseFloat((timelineYear - 0.083).toFixed(3));
  const { start: ghostStart, end: ghostEnd } = getMonthRange(previousMonth);

  const filtered = allData.filter(d => {
    const t = new Date(d.time);
    return t >= start && t <= end;
  });

  const ghostData = allData.filter(d => {
    const t = new Date(d.time);
    return t >= ghostStart && t < start;
  });

  frameData = filtered;

  // Clear old layers
  ghostLayer.clearLayers();
  mainFrameLayer.clearLayers();

  // 🔁 Remove 2025 static layer if active
  if (map.hasLayer(quakeGroup)) {
    map.removeLayer(quakeGroup);
  }

  // 🔁 Ensure mainFrameLayer is active
  if (!map.hasLayer(mainFrameLayer) && document.getElementById('toggle-circles').checked) {
    map.addLayer(mainFrameLayer);
  }

  // Ghost trail (faded points)
  ghostData.forEach(d => {
    L.circleMarker([+d.latitude, +d.longitude], {
      radius: 4,
      fillColor: "#888",
      color: "#666",
      weight: 1,
      opacity: 0.3,
      fillOpacity: 0.1
    }).addTo(ghostLayer);
  });

  // Main animated points
  filtered.forEach(d => {
    const mag = +d.mag;
    const depth = +d.depth;
    const place = d.place;
    const color = mag >= 6 ? '#ff0000' :
                  mag >= 5 ? '#ff8000' :
                  mag >= 4 ? '#ffff00' : '#00ff00';

    const radius = depth <= 10 ? 4 :
                   depth <= 30 ? 6 :
                   depth <= 70 ? 8 :
                   depth <= 300 ? 10 : 12;

    const circle = L.circleMarker([+d.latitude, +d.longitude], {
      radius,
      fillColor: color,
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    }).bindTooltip(
      `<b>${place}</b><br/>Mag: ${mag}, Depth: ${depth} km<br/>${new Date(d.time).toLocaleString()}`,
      { direction: 'top', sticky: true, className: 'quake-tooltip' }
    ).addTo(mainFrameLayer);
    
  });

  // Update visuals
  renderMagnitudeChart(filtered);
  renderDepthChart(filtered);
  renderHeatmap(filtered);

  // Update timeline label and slider
  const labelMonth = start.toLocaleString('default', { month: 'short', year: 'numeric' });
  document.getElementById('timeline-label').textContent = labelMonth;
  document.getElementById('timeline-slider').value = timelineYear;
}




function startTimelineAnimation() {
  clearInterval(timelineInterval); // ✅ cancel any previous interval

  const frameDuration = Math.max(60, 180 / playbackSpeed); // 👈 ensure it's at least 60ms

  timelineInterval = setInterval(() => {
    if (timelineYear < timelineMax) {
      updateTimelineYear(parseFloat((timelineYear + 0.083).toFixed(3))); // monthly step
    } else {
      stopTimelineAnimation();
    }
  }, frameDuration);

  console.log(`Animation started at ${playbackSpeed}x → ${frameDuration}ms/frame`);
}





function stopTimelineAnimation() {
  clearInterval(timelineInterval);
  isTimelinePlaying = false;
  document.getElementById('timeline-play-btn').textContent = '▶️';
}


document.getElementById('timeline-play-btn').addEventListener('click', () => {
  if (isTimelinePlaying) {
    stopTimelineAnimation(); // ✅ pauses
  } else {
    isTimelinePlaying = true;
    document.getElementById('timeline-play-btn').textContent = '⏸️';
    startTimelineAnimation(); // ✅ resumes
  }
});


document.getElementById('timeline-slider').addEventListener('input', (e) => {
  updateTimelineYear(parseFloat(e.target.value));
});

document.getElementById('speed-selector').addEventListener('change', (e) => {
  playbackSpeed = parseInt(e.target.value);

  if (isTimelinePlaying) {
    stopTimelineAnimation();        // 🔁 clear old speed
    isTimelinePlaying = true;       // 🔁 preserve state
    document.getElementById('timeline-play-btn').textContent = '⏸️';
    startTimelineAnimation();       // 🔁 start with new speed
  }
});



updateTimelineYear(timelineYear);



// brush tool logic

let isBrushing = false;

document.getElementById("brush-toggle").addEventListener("click", () => {
  isBrushing = !isBrushing;

  if (isBrushing) {
    map.addControl(drawControl);
  } else {
    map.removeControl(drawControl);
    drawnItems.clearLayers();
    // Optional: Reset to all data
    updateTimelineYear(timelineYear);
  }
});

map.on(L.Draw.Event.CREATED, function (e) {
  drawnItems.clearLayers();
  const layer = e.layer;
  drawnItems.addLayer(layer);

  const bounds = layer.getBounds();

  // Filter the currently visible (timeline-selected) data
  const brushedData = frameData.filter(d => {
    const lat = +d.latitude;
    const lon = +d.longitude;
    return bounds.contains([lat, lon]);
  });
  

  // ✅ Update the charts and heatmap with brushedData
  renderMagnitudeChart(brushedData);
  renderDepthChart(brushedData);
  renderHeatmap(brushedData);

  // ✅ Replace only visible map points
  mainFrameLayer.clearLayers();

  brushedData.forEach(d => {
    const mag = +d.mag;
    const depth = +d.depth;
    const color = mag >= 6 ? '#ff0000' :
                  mag >= 5 ? '#ff8000' :
                  mag >= 4 ? '#ffff00' : '#00ff00';

    const radius = depth <= 10 ? 4 :
                   depth <= 30 ? 6 :
                   depth <= 70 ? 8 :
                   depth <= 300 ? 10 : 12;

    const circle = L.circleMarker([+d.latitude, +d.longitude], {
      radius,
      fillColor: color,
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(mainFrameLayer);
  });
});

