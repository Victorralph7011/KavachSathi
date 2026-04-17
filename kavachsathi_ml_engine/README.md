# KavachSathi ML Engine 🛡️

Standalone Python/Flask ML microservice for dynamic premium pricing and fraud anomaly detection — cleanly separated from the Node.js/Firebase main backend.

---

## Project Structure

```
kavachsathi_ml_engine/
├── requirements.txt        # Python dependencies
├── train_models.py         # Generates synthetic data & trains .pkl models
├── app.py                  # Flask REST API (port 5000)
├── node_integration.js     # Node.js bridge → ML → Firestore
├── models/                 # Created automatically by train_models.py
│   ├── premium_rf_model.pkl
│   └── fraud_iso_model.pkl
└── README.md
```

---

## Quick Start

### Step 1 — Python ML Engine

```bash
# Create & activate a virtual environment (recommended)
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Train models (generates models/*.pkl)
python train_models.py

# Start the Flask API
python app.py
# → Listening on http://localhost:5000
```

### Step 2 — Node.js Integration

```bash
# In your kavachsathi_backend directory
npm install axios firebase-admin

# Set your Firebase service account credentials
$env:GOOGLE_APPLICATION_CREDENTIALS = "path/to/serviceAccountKey.json"

# Run the smoke test (requires ML server running)
node node_integration.js
```

---

## API Reference

### `GET /health`
```json
{ "status": "ok", "message": "ML Engine Online" }
```

### `POST /predict-premium`
**Request:**
```json
{ "temp": 38.5, "aqi": 320, "traffic": 7.2 }
```
**Response:**
```json
{
  "status": "ok",
  "risk_multiplier": 1.6230,
  "dynamic_premium": 16.23,
  "base_premium": 10.0
}
```

### `POST /detect-fraud`
**Request:**
```json
{ "time_hrs": 2.5, "distance_km": 145 }
```
**Response:**
```json
{
  "status": "ok",
  "iso_score": -1,
  "is_fraud": true,
  "action": "flag_for_review"
}
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Flask server port |
| `FLASK_DEBUG` | `false` | Enable Flask debug mode |
| `ML_ENGINE_URL` | `http://localhost:5000` | ML service URL (used by Node.js) |
| `GOOGLE_APPLICATION_CREDENTIALS` | — | Path to Firebase service account JSON |

---

## Firestore Schema

Documents written to `claims/{userId}`:

```json
{
  "userId": "firebase_uid",
  "claim_id": "CLAIM-001",
  "time_hrs": 2.5,
  "distance_km": 145,
  "ml_fraud_flag": true,
  "ml_action": "flag_for_review",
  "status": "flagged",
  "ml_raw_score": -1,
  "ml_engine_error": false,
  "processed_at": "<serverTimestamp>"
}
```

**Status values:**
- `"approved"` — ML auto-approved, no fraud detected
- `"flagged"` — ML flagged as anomalous, requires review
- `"pending_manual_review"` — ML engine was unreachable, fallback mode
