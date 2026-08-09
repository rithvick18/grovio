# Grovio / Instamart Ecosystem

An end-to-end quick-commerce platform designed for rapid grocery ordering, merchant store management, and delivery logistics.

---

## 📁 Repository Overview

This repository is structured as a monorepo housing the mobile applications, web dashboard, backend services, and database migration scripts:

```
.
├── customer_app/         # Flutter application for customer ordering & tracking
├── delivery_app/         # Flutter application for delivery partner logistics
├── store_portal/         # Merchant web portal & FastAPI backend server
│   ├── frontend/         # React + Vite + Tailwind CSS dashboard
│   └── backend/          # Python FastAPI REST API server
├── supabase/             # Database migrations & SQL trigger definitions
│   └── migrations/       # Schema updates & automated triggers
└── verify_e2e_flow.py    # Root test runner for backend integration testing
```

---

## 📱 Applications & Components

### 1. Customer Ordering App (`customer_app/`)
* **Technology**: Flutter (Dart)
* **Description**: Cross-platform mobile app enabling customers to browse products and store categories, manage carts, place orders, and track order fulfillment status in real time.
* **Key Dependencies**: `supabase_flutter`, `google_fonts`, `cached_network_image`.

### 2. Delivery Partner App (`delivery_app/`)
* **Technology**: Flutter (Dart)
* **Description**: Cross-platform mobile app tailored for delivery executives to accept delivery assignments, view routes, and update fulfillment statuses (`picked_up`, `delivered`, etc.).
* **Key Dependencies**: `supabase_flutter`, `flutter_riverpod`, `provider`.

### 3. Store Portal (`store_portal/`)
* **Store Portal Frontend (`store_portal/frontend/`)**
  * **Technology**: React, Vite, Tailwind CSS, Lucide Icons
  * **Description**: Web application for store managers to monitor live incoming orders, manage product catalog & inventory levels, onboard stores, and analyze sales.
* **Store Portal Backend (`store_portal/backend/`)**
  * **Technology**: Python 3, FastAPI, Uvicorn, Pydantic, PyJWT, Supabase SDK
  * **Description**: REST API backend server providing order state transitions, authentication management, and automated backend workflow handlers. Includes end-to-end test suite (`test_e2e.py`).

### 4. Supabase Database (`supabase/`)
* **Technology**: PostgreSQL / Supabase
* **Description**: Holds database migration scripts (`migrations/`) defining table schemas, Row Level Security (RLS) policies, and automated SQL triggers (e.g., inventory deduction upon order placement).

---

## 🚀 Getting Started

### Prerequisites
* **Flutter SDK**: `>= 3.11.0`
* **Node.js**: `>= 18.0.0` and `npm`
* **Python**: `>= 3.10`
* **Supabase**: Active Supabase instance with configured environment variables.

---

## 🛠️ Running the Applications

### 1. Store Portal Backend
```bash
cd store_portal/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Store Portal Frontend
```bash
cd store_portal/frontend
npm install
npm run dev
```

### 3. Customer Ordering App
```bash
cd customer_app
flutter pub get
flutter run
```

### 4. Delivery Partner App
```bash
cd delivery_app
flutter pub get
flutter run
```

---

## 🧪 End-to-End Verification

To verify the API and database integration flow across store management and ordering workflows, run the root verification script:

```bash
python3 verify_e2e_flow.py
```
