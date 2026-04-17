import requests

BASE_URL = "http://127.0.0.1:5000"

def test_predict_premium():
    print("=" * 50)
    print("TEST: /predict-premium")
    print("=" * 50)
    payload = {"temp": 42, "aqi": 300, "traffic": 8}
    print(f"Sending: {payload}")
    try:
        response = requests.post(f"{BASE_URL}/predict-premium", json=payload, timeout=5)
        print(f"Status : {response.status_code}")
        print(f"Response: {response.json()}")
    except requests.exceptions.ConnectionError:
        print("[ERROR] Connection failed - make sure the Flask server is running on port 5000.")
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")

def test_detect_fraud():
    print()
    print("=" * 50)
    print("TEST: /detect-fraud")
    print("=" * 50)
    payload = {"time_hrs": 1, "distance_km": 500}
    print(f"Sending: {payload}")
    try:
        response = requests.post(f"{BASE_URL}/detect-fraud", json=payload, timeout=5)
        print(f"Status : {response.status_code}")
        print(f"Response: {response.json()}")
    except requests.exceptions.ConnectionError:
        print("[ERROR] Connection failed - make sure the Flask server is running on port 5000.")
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")

if __name__ == "__main__":
    test_predict_premium()
    test_detect_fraud()
    print()
    print("[DONE]")
