# KavachSathi — Parametric Insurance Engine (Backend)

> **Zero-Touch Income Protection for India's Gig Workers**  
> *Traditional: Worker files claim → waits 15-30 days → maybe paid*  
> *KavachSathi: Trigger fires → system pays → done within minutes*

---

## 🏗️ Architecture

```
test/kavach/
├── main.py                    # FastAPI entry point
├── models.py                  # Pydantic schemas & domain enums
├── requirements.txt           # Python dependencies
├── ml/
│   └── premium_engine.py      # Actuarial pricing engine
├── services/
│   ├── claim_service.py       # POP Validator & fraud detection
│   ├── policy_service.py      # Safety rails & payout calculation
│   └── settlement_service.py  # Mock Razorpay settlement
├── routers/
│   ├── claims.py              # Zero-touch claims pipeline
│   ├── policies.py            # Policy enrollment & health
│   └── pricing.py             # Premium quoting endpoints
└── tests/
    └── test_stress.py         # 7-part adversarial stress suite
```

---

## 🔬 Engineered Features

### 1. Actuarial Pricing Engine (`ml/premium_engine.py`)

**Formula**: `Premium = P(Trigger) × L_avg × D_exposed × RiskMultiplier`

| Component | Description | Source |
|-----------|-------------|--------|
| `P(Trigger)` | Historical probability of parametric event in the ward (0.10 – 0.28) | IMD/CPCB historical data |
| `L_avg` | Average daily income loss (Urban: ₹800, Rural: ₹400) | Platform earnings data |
| `D_exposed` | Expected workdays lost per event (Urban: 1.5, Rural: 2.5) | Disruption severity model |
| `RiskMultiplier` | Regional adjustment factor (Delhi: 1.15, Mumbai: 1.20) | City-level hazard exposure |

**Hard Caps**: `₹20 ≤ Premium ≤ ₹50` per week — non-negotiable.

**Why weekly?** Gig workers earn daily/weekly, not monthly. Micro-premiums reduce barrier to entry.

---

### 2. POP Validator — Adversarial Fraud Defense (`services/claim_service.py`)

**The Problem**: Parametric insurance has zero human review. Fraud must be caught automatically.

**Our Defense** — 3-layer validation:

| Layer | Check | Threshold | Action |
|-------|-------|-----------|--------|
| 1 | **Impossible Jump** | GPS velocity > 100 km/h (Haversine) | Auto-block claim |
| 2 | **Trail Continuity** | Every consecutive GPS pair validated | Flag all suspicious indices |
| 3 | **Signal Cross-Check** | Login ↔ GPS ↔ Active Orders consistency | Block on mismatch |

**Example Attack Blocked**: Worker submits GPS trail showing Delhi delivery at 10:00 AM, then Mumbai delivery at 10:15 AM. Haversine calculates ~1,400 km distance in 15 minutes = **~5,600 km/h** → **FRAUD BLOCKED** with evidence chain.

---

### 3. Zero-Touch Pipeline (`routers/claims.py`)

```
Trigger Fires (Rain > 60mm / AQI > 300)
    ↓ [Auto]
System finds all active workers in affected ward
    ↓ [Auto]
POP Validator runs GPS + platform checks
    ↓ [Auto]
Payout calculated (severity-tiered)
    ↓ [Auto]
₹ transferred to worker's UPI (< 2 minutes)
```

**State Machine**: `DETECTED → VALIDATING → APPROVED → PAID`

No human approval gates. No claim forms. No waiting. The worker does nothing.

---

### 4. Emergency Stop — Circuit Breaker (`services/policy_service.py`)

**Why**: During correlated events (city-wide monsoon), multiple claims fire simultaneously. Without a safety valve, the pool drains.

**Mechanism**: When `Loss Ratio = Total Payout ÷ Total Premium ≥ 85%`, the system returns **HTTP 503** for all new enrollments, protecting existing policyholders.

**Recovery**: Once the ratio improves (new premiums collected > payouts), enrollment reopens automatically.

---

### 5. Geographical Fairness

Income loss is not equal. A disruption affects workers differently based on their area:

| Area | Normal Weekly Income | Disrupted Income | Max Payout |
|------|---------------------|------------------|------------|
| **Urban** | ₹8,000 | ₹5,000 | ₹3,000 |
| **Rural** | ₹4,000 | ₹1,000 | ₹3,000 |

**Severity Tiers** (graduated payouts):

| Tier | Condition | Payout % |
|------|-----------|----------|
| 1 | Just above threshold | 30% |
| 2 | Moderate event | 60% |
| 3 | Severe event | 100% |

---

### 6. Strict Compliance

| Rule | Enforcement |
|------|-------------|
| **Persona Lock** | Only `FOOD_DELIVERY` — enum has no `OTHER` |
| **Weekly Only** | `MONTHLY`/`YEARLY` rejected at schema + engine level |
| **Loss of Income Only** | Zero health, hospital, or vehicle repair coverage |
| **No Indemnity** | No claim forms, no human adjusters, no subjective assessment |

---

## 🚀 Quick Start

```bash
cd test/kavach
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🧪 Stress Testing

```bash
cd test/kavach
python -m pytest tests/test_stress.py -v
```

**7 Test Categories**:

| # | Test | What It Proves |
|---|------|----------------|
| 1 | Premium Bounds | 1000 random inputs → all ₹20-₹50 |
| 2 | Fraud Detection | Teleportation at 5,600 km/h → blocked |
| 3 | Circuit Breaker | 85% loss ratio → HTTP 503 |
| 4 | Weekly Enforcement | Monthly/yearly → rejected |
| 5 | Persona Lock | Non-food-delivery → rejected |
| 6 | Zero-Touch Pipeline | Full trigger → payout flow |
| 7 | Geographical Fairness | Urban ≠ Rural payout tiers |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/pricing/quote` | Get premium quote |
| `GET` | `/pricing/bounds` | Premium cap info |
| `POST` | `/pricing/batch` | Batch ward pricing |
| `POST` | `/policies/enroll` | Enroll a worker |
| `GET` | `/policies/` | List all policies |
| `GET` | `/policies/platform/health` | Solvency dashboard |
| `POST` | `/claims/triggers/ingest` | Ingest trigger event |
| `POST` | `/claims/claims/{id}/process` | Advance claim pipeline |
| `GET` | `/claims/claims/{id}` | Get claim details |
| `GET` | `/claims/` | List all claims |

---

*Built for DEVTrails Hackathon — Guidewire Insurance Technology Track*
