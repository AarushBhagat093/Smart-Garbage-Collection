// Google Maps-based GUI (map, controls, state)
let map;
let points = [];
let markers = [];
let mstEdges = [];
let polylines = [];
let addingPoint = false;

const statPoints = document.getElementById('stat-points');
const statDistance = document.getElementById('stat-distance');

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 20.5937, lng: 78.9629 }, // Center on India
        zoom: 5,
    });

    map.addListener("click", (e) => {
        if (!addingPoint) return;
        addPoint(e.latLng);
        addingPoint = false;
    });

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
}

function drawMap() {
    // Remove old polylines
    polylines.forEach(line => line.setMap(null));
    polylines = [];
    // Draw MST edges
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
}

function updateStats() {
    statPoints.textContent = `Collection Points: ${points.length}`;
    let totalDist = 0;
    mstEdges.forEach(([i, j]) => {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
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

// Google Maps will call this when the script loads
window.initMap = initMap;