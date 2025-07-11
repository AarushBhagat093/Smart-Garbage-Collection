// Google Maps-based GUI (map, controls, state)
let map;
let points = [];
let markers = [];
let mstEdges = [];
let polylines = [];
let addingPoint = false;

// Directions API objects for road path
let directionsService, directionsRenderer;

const statPoints = document.getElementById('stat-points');
const statDistance = document.getElementById('stat-distance');

// --------- Persistence Functions ---------
function saveRouteData() {
    localStorage.setItem('sgb_points', JSON.stringify(points));
    localStorage.setItem('sgb_mstEdges', JSON.stringify(mstEdges));
}

function loadRouteData() {
    const storedPoints = localStorage.getItem('sgb_points');
    const storedEdges = localStorage.getItem('sgb_mstEdges');
    if (storedPoints) points = JSON.parse(storedPoints);
    if (storedEdges) mstEdges = JSON.parse(storedEdges);
}

// Google Maps will call this when the script loads
function initMap() {
    loadRouteData();

    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 20.5937, lng: 78.9629 }, // Center on India
        zoom: 5,
    });

    // Initialize Directions API
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map: map });

    map.addListener("click", (e) => {
        if (!addingPoint) return;
        addPoint(e.latLng);
        addingPoint = false;
    });

    drawMap();
    updateStats();
}

function addPoint(latLng) {
    points.push({ x: latLng.lat(), y: latLng.lng() });
    const marker = new google.maps.Marker({
        position: latLng,
        map: map,
        label: `${points.length}`,
    });
    markers.push(marker);
    mstEdges = [];
    drawMap();
    updateStats();
    saveRouteData();
}

// --------- Drawing Map and Routes ---------
// Draws either the MST as straight lines or (if at least 2 points) the real road route using Directions API
function drawMap() {
    // Remove old markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    // Add all markers again
    points.forEach((pt, idx) => {
        const marker = new google.maps.Marker({
            position: { lat: pt.x, lng: pt.y },
            map: map,
            label: `${idx + 1}`,
        });
        markers.push(marker);
    });

    if (points.length < 2) {
        if (directionsRenderer) directionsRenderer.set('directions', null);
        // Remove all old polylines (in case)
        polylines.forEach(line => line.setMap(null));
        polylines = [];
        return;
    }

    // Build waypoints: skip first and last points
    let waypoints = [];
    if (points.length > 2) {
        waypoints = points.slice(1, -1).map(pt => ({
            location: { lat: pt.x, lng: pt.y },
            stopover: true
        }));
    }

    directionsService.route({
        origin: { lat: points[0].x, lng: points[0].y },
        destination: { lat: points[points.length - 1].x, lng: points[points.length - 1].y },
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false
    }, function(response, status) {
        console.log('Directions status:', status, response); // Debug log
        if (status === 'OK') {
            directionsRenderer.setDirections(response);
        } else {
            // Fallback: show straight lines if Directions API fails
            directionsRenderer.set('directions', null);
            // Remove old polylines
            polylines.forEach(line => line.setMap(null));
            polylines = [];
            // Draw MST edges as straight lines
            mstEdges.forEach(([i, j]) => {
                const line = new google.maps.Polyline({
                    path: [
                        { lat: points[i].x, lng: points[i].y },
                        { lat: points[j].x, lng: points[j].y }
                    ],
                    geodesic: true,
                    strokeColor: "#22c55e",
                    strokeOpacity: 1.0,
                    strokeWeight: 2,
                    map: map
                });
                polylines.push(line);
            });
            alert('Directions request failed: ' + status);
        }
    });
}

function updateStats() {
    statPoints.textContent = `Collection Points: ${points.length}`;
    let totalDist = 0;
    mstEdges.forEach(([i, j]) => {
        // Approximate distance in km using Haversine formula
        totalDist += haversine(points[i], points[j]);
    });
    statDistance.textContent = `Total Route Length: ${totalDist.toFixed(2)} km`;
}

function haversine(p1, p2) {
    const R = 6371; // Earth radius in km
    const dLat = (p2.x - p1.x) * Math.PI / 180;
    const dLng = (p2.y - p1.y) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(p1.x * Math.PI / 180) * Math.cos(p2.x * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

document.getElementById('add-point-btn').addEventListener('click', () => {
    addingPoint = true;
});

document.getElementById('reset-btn').addEventListener('click', () => {
    points = [];
    mstEdges = [];
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    polylines.forEach(line => line.setMap(null));
    polylines = [];
    localStorage.removeItem('sgb_points');
    localStorage.removeItem('sgb_mstEdges');
    drawMap();
    updateStats();
});

document.getElementById('optimize-btn').addEventListener('click', () => {
    if (points.length < 2) {
        alert('Add at least 2 points.');
        return;
    }
    mstEdges = simpleMST(points);
    drawMap();
    updateStats();
    saveRouteData();
});

// Simple MST mock (Prim's algorithm for small N)
function simpleMST(points) {
    const n = points.length;
    let selected = [0];
    let edges = [];
    let used = Array(n).fill(false);
    used[0] = true;
    while (selected.length < n) {
        let minDist = Infinity, u = -1, v = -1;
        for (let i of selected) {
            for (let j = 0; j < n; ++j) {
                if (!used[j]) {
                    let dist = haversine(points[i], points[j]);
                    if (dist < minDist) {
                        minDist = dist;
                        u = i; v = j;
                    }
                }
            }
        }
        if (u !== -1 && v !== -1) {
            edges.push([u, v]);
            selected.push(v);
            used[v] = true;
        }
    }
    return edges;
}

document.getElementById('vehicleType').addEventListener('change', function() {
  document.getElementById('mileageSection').style.display = this.value ? 'block' : 'none';
});

function calculateFuel() {
  const vehicleType = document.getElementById('vehicleType').value;
  const mileage = parseFloat(document.getElementById('mileage').value);
  const normalRoute = parseFloat(document.getElementById('normalRoute').value);
  const optimizedRoute = parseFloat(document.getElementById('optimizedRoute').value);

  if (!vehicleType || !mileage || !normalRoute || !optimizedRoute) {
    document.getElementById('fuelResult').innerHTML = `<span style="color:red;">Please fill all fields.</span>`;
    return;
  }

  const rates = {
    diesel: 87.38,
    petrol: 96.00
  };

  const normalFuel = normalRoute / mileage;
  const optimizedFuel = optimizedRoute / mileage;

  const normalCost = normalFuel * rates[vehicleType];
  const optimizedCost = optimizedFuel * rates[vehicleType];

  document.getElementById('fuelResult').innerHTML = `
    <h3>Results</h3>
    <p>Normal Route Fuel Needed: <b>${normalFuel.toFixed(2)} litres</b><br>
       Normal Route Cost: <b>₹${normalCost.toFixed(2)}</b></p>
    <p>Optimized Route Fuel Needed: <b>${optimizedFuel.toFixed(2)} litres</b><br>
       Optimized Route Cost: <b>₹${optimizedCost.toFixed(2)}</b></p>
  `;
}

// Google Maps will call this when the script loads
window.initMap = initMap;