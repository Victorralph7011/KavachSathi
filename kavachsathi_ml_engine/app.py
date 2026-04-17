"""
============================================================
KavachSathi ML Engine — app.py (Final Sync)
============================================================
"""

import os
import sys
import logging
import joblib
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# --- Load Models ---
MODEL_DIR = "models"
PREMIUM_MODEL_PATH = os.path.join(MODEL_DIR, "premium_rf_model.pkl")
FRAUD_MODEL_PATH = os.path.join(MODEL_DIR, "fraud_iso_model.pkl")

def load_models():
    models = {}
    for label, path in [("premium", PREMIUM_MODEL_PATH), ("fraud", FRAUD_MODEL_PATH)]:
        if not os.path.exists(path):
            logger.error(f"Model file not found: '{path}'")
            sys.exit(1)
        models[label] = joblib.load(path)
        logger.info(f"✓ {label.capitalize()} model loaded.")
    return models

MODELS = load_models()
BASE_PREMIUM_INR = 20.0

def _missing_fields_response(required: list, received: dict):
    missing = [f for f in required if f not in received]
    if missing:
        return jsonify({"status": "error", "message": f"Missing fields: {missing}"}), 400
    return None

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "ML Engine Online"}), 200

# --- Premium Prediction ---
@app.route("/predict-premium", methods=["POST"])
def predict_premium():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"status": "error", "message": "Invalid JSON"}), 400

    required = ["temperature_c", "aqi_level", "traffic_index"]
    err = _missing_fields_response(required, data)
    if err: return err

    try:
        features = np.array([[float(data["temperature_c"]), float(data["aqi_level"]), float(data["traffic_index"])]])
        risk_multiplier = float(MODELS["premium"].predict(features)[0])
        
        logger.info(f"PREMIUM: Multiplier {risk_multiplier:.2f}")
        return jsonify({
            "status": "ok",
            "risk_multiplier": round(risk_multiplier, 4),
            "dynamic_premium": round(BASE_PREMIUM_INR * risk_multiplier, 2)
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# --- Fraud Detection ---
@app.route("/detect-fraud", methods=["POST"])
def detect_fraud():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"status": "error", "message": "Invalid JSON"}), 400

    required = ["time_since_policy_start_hrs", "distance_from_registered_zone_km"]
    err = _missing_fields_response(required, data)
    if err: return err

    try:
        features = np.array([[float(data["time_since_policy_start_hrs"]), float(data["distance_from_registered_zone_km"])]])
        # Classifier output: 1 = Fraud, 0 = Normal
        is_fraud_val = int(MODELS["fraud"].predict(features)[0])
        
        is_fraud = is_fraud_val == 1
        action = "flag_for_review" if is_fraud else "auto_approve"
        
        logger.info(f"FRAUD CHECK: Action -> {action}")
        return jsonify({
            "status": "ok",
            "is_fraud": is_fraud,
            "action": action
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)