"""
============================================================
KavachSathi ML Engine — train_models.py (Excel Edition)
============================================================
Purpose : Train ML models using the professional Excel dataset.
          Exports serialised .pkl artefacts consumed by app.py.

Source Data: kavachsathi_training_data.xlsx
------------------------------------------------------------
"""

import os
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier

# ─────────────────────────────────────────────────────────────
# 0. Configuration & directory setup
# ─────────────────────────────────────────────────────────────
RANDOM_SEED = 42
MODEL_DIR   = "models"
EXCEL_FILE  = "kavachsathi_training_data.xlsx"

os.makedirs(MODEL_DIR, exist_ok=True)

print("=" * 60)
print("KavachSathi — Excel-Based Model Training Started")
print("=" * 60)

# Verify Excel file existence
if not os.path.exists(EXCEL_FILE):
    print(f"❌ ERROR: {EXCEL_FILE} not found in current directory.")
    print("Please ensure the generated Excel file is placed in the ml_engine folder.")
    exit()

# ─────────────────────────────────────────────────────────────
# 1. MODEL A — Dynamic Premium (Random Forest Regressor)
# ─────────────────────────────────────────────────────────────

print(f"\n[1/2] Loading Premium Data from sheet 'Premium_Data' ...")

try:
    df_premium = pd.read_excel(EXCEL_FILE, sheet_name='Premium_Data')
    
    # Feature selection
    X_prem = df_premium[["temperature_c", "aqi_level", "traffic_index"]]
    y_prem = df_premium["risk_multiplier"]

    print(f"   → Samples loaded: {len(df_premium)}")
    print(f"   → Features: {list(X_prem.columns)}")
    
    print("   Training Random Forest Regressor (Price Engine) ...")
    rf_model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        random_state=RANDOM_SEED,
        n_jobs=-1
    )
    rf_model.fit(X_prem, y_prem)

    # Save artefact
    rf_path = os.path.join(MODEL_DIR, "premium_rf_model.pkl")
    joblib.dump(rf_model, rf_path)
    print(f"   ✓ Saved → {rf_path}")

except Exception as e:
    print(f"   ❌ Error training Premium Model: {e}")


# ─────────────────────────────────────────────────────────────
# 2. MODEL B — Fraud Detection (Random Forest Classifier)
# ─────────────────────────────────────────────────────────────

print(f"\n[2/2] Loading Fraud Data from sheet 'Fraud_Data' ...")

try:
    df_fraud = pd.read_excel(EXCEL_FILE, sheet_name='Fraud_Data')
    
    # Feature selection
    X_fraud = df_fraud[["time_since_policy_start_hrs", "distance_from_registered_zone_km"]]
    y_fraud = df_fraud["is_fraud"]

    print(f"   → Samples loaded: {len(df_fraud)}")
    print(f"   → Fraudulent cases in data: {y_fraud.sum()} ({round((y_fraud.sum()/len(y_fraud))*100, 2)}%)")
    
    # We use a Classifier here because the Excel data contains specific 0/1 labels
    print("   Training Random Forest Classifier (Fraud Guard) ...")
    fraud_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        random_state=RANDOM_SEED,
        n_jobs=-1
    )
    fraud_model.fit(X_fraud, y_fraud)

    # Save artefact (Note: name remains consistent for the API to load)
    fraud_path = os.path.join(MODEL_DIR, "fraud_iso_model.pkl")
    joblib.dump(fraud_model, fraud_path)
    print(f"   ✓ Saved → {fraud_path}")

except Exception as e:
    print(f"   ❌ Error training Fraud Model: {e}")


# ─────────────────────────────────────────────────────────────
# 3. Finalization
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("SUCCESS: Models successfully trained from Excel data.")
print("The 'models/' directory is updated with fresh .pkl files.")
print("Action: You can now restart your Flask API (python app.py)")
print("=" * 60)