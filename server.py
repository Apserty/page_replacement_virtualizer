"""
The Hyper-Visual Virtual Memory & Page Replacement Virtualizer
Python Backend Server (Flask)

Serves the front-end dashboard and provides REST API simulation endpoints.
"""

import os
import json
from flask import Flask, request, jsonify, send_from_directory
from algorithms import run_page_replacement

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=BASE_DIR)

# Enable CORS and disable caching during development
@app.after_request
def after_request(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return response

# 1. API Endpoints (Must be registered before catch-all static proxy)
@app.route("/api/status", methods=["GET"])
def api_status():
    return jsonify({
        "status": "online",
        "backend": "Python Flask",
        "supportedAlgorithms": ["FIFO", "LRU", "OPTIMAL"]
    })

@app.route("/api/simulate", methods=["GET", "POST", "OPTIONS"])
def api_simulate():
    if request.method == "OPTIONS":
        return "", 200

    if request.method == "GET":
        algorithm = request.args.get("algorithm", "FIFO")
        ref_raw = request.args.get("reference", request.args.get("referenceString", "7,0,1,2,0,3,0,4,2,3,0,3,2"))
        frame_count = int(request.args.get("frames", request.args.get("frameCount", 3)))
        try:
            reference_string = [int(t) for t in ref_raw.replace(';', ' ').replace(',', ' ').split() if t]
        except Exception:
            return jsonify({"error": "Invalid reference parameter format"}), 400
    else:
        data = request.get_json(force=True, silent=True)
        if not data:
            raw_text = request.get_data(as_text=True)
            if raw_text:
                try:
                    data = json.loads(raw_text)
                except Exception:
                    data = None
        if not data:
            return jsonify({"error": "Invalid JSON payload"}), 400

        algorithm = data.get("algorithm", "FIFO")
        reference_string = data.get("referenceString", [])
        frame_count = int(data.get("frameCount", 3))

    if not isinstance(reference_string, list) or len(reference_string) == 0:
        return jsonify({"error": "referenceString must be a non-empty list of page numbers"}), 400

    if frame_count < 1:
        return jsonify({"error": "frameCount must be at least 1"}), 400

    try:
        result = run_page_replacement(algorithm, reference_string, frame_count)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 2. Frontend Static File Routes
@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")

@app.route("/<path:path>")
def static_proxy(path):
    return send_from_directory(BASE_DIR, path)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    print(f"Starting Virtual Memory Virtualizer server at http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
