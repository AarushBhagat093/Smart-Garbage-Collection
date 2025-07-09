#include <iostream>
#include <vector>
#include <cmath>
#include <queue>

using namespace std;

struct Point {
    double x, y;
};

struct Edge {
    int u, v;
    double dist;
    bool operator<(const Edge& other) const {
        return dist > other.dist; // For min-heap
    }
};

vector<pair<int, int>> primMST(const vector<Point>& points) {
    int n = points.size();
    vector<bool> inMST(n, false);
    priority_queue<Edge> pq;
    vector<pair<int, int>> mstEdges;

    // Start from node 0
    inMST[0] = true;
    for (int j = 1; j < n; ++j) {
        double dx = points[0].x - points[j].x, dy = points[0].y - points[j].y;
        pq.push({0, j, sqrt(dx * dx + dy * dy)});
    }

    while (!pq.empty() && mstEdges.size() < n - 1) {
        Edge e = pq.top(); pq.pop();
        if (inMST[e.v]) continue;
        inMST[e.v] = true;
        mstEdges.push_back({e.u, e.v});
        for (int j = 0; j < n; ++j) {
            if (!inMST[j]) {
                double dx = points[e.v].x - points[j].x, dy = points[e.v].y - points[j].y;
                pq.push({e.v, j, sqrt(dx * dx + dy * dy)});
            }
        }
    }
    return mstEdges;
}

int main() {
    int n;
    cin >> n;
    vector<Point> points(n);
    for (int i = 0; i < n; ++i) {
        cin >> points[i].x >> points[i].y;
    }
    vector<pair<int, int>> mst = primMST(points);
    cout << "MST Edges:\n";
    for (auto [u, v] : mst) {
        cout << u << " " << v << "\n";
    }
    return 0;
}