import os
import subprocess
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow CORS for local development

# ---- Place your Google Maps API key here (if needed for future enhancement) ----
GOOGLE_MAPS_API_KEY = "AIzaSyAxqFxe6Ml6PmwbGmB0RoFOMi4h6JkKefk"

@app.route('/api/optimize', methods=['POST'])
def optimize_route():
    data = request.get_json()
    points = data.get("points", [])
    if not points or len(points) < 2:
        return jsonify({"error": "At least two points required."}), 400

    # Prepare input for C++ program
    input_lines = [str(len(points))]
    for pt in points:
        input_lines.append(f"{pt['x']} {pt['y']}")
    input_str = "\n".join(input_lines)

    # Write to a temporary file and call C++ executable
    with tempfile.NamedTemporaryFile(mode='w+', delete=False) as temp_input:
        temp_input.write(input_str)
        temp_input.flush()
        temp_input_name = temp_input.name

    # Assume compiled C++ binary is named 'mst'
    mst_exe = os.path.abspath("./mst")
    try:
        result = subprocess.run(
            [mst_exe],
            input=input_str.encode(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=10
        )
        if result.returncode != 0:
            return jsonify({"error": result.stderr.decode()}), 500

        # Parse MST edges from output
        edges = []
        started = False
        for line in result.stdout.decode().splitlines():
            if line.strip().startswith("MST Edges"):
                started = True
                continue
            if started and line.strip():
                parts = line.strip().split()
                if len(parts) == 2:
                    u, v = map(int, parts)
                    edges.append([u, v])
        return jsonify({"edges": edges})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        os.unlink(temp_input_name)

@app.route('/api/maps-key', methods=['GET'])
def get_maps_key():
    # Return Google Maps API key (placeholder)
    return jsonify({"key": GOOGLE_MAPS_API_KEY})

if __name__ == "__main__":
    app.run(debug=True)