# TiruppurTex — Production Order Tracking & Run-Rate Delay Warning System

> **Client**: Company A, Tiruppur, Tamil Nadu (Knitwear Exporter to UK and EU Retailers)  
> **Problem Addressed**: Problem 4 — Production Order Tracking App with Buyer View  
> **Turnover Scale**: ₹95–110 Crore / year • 900 factory workers • 3 owned units + subcontracted printing & washing

---

## 📌 Executive Summary

TiruppurTex solves the **₹1.08 Crore annual loss** incurred by Company A from delayed export orders:
- **₹52.5 Lakhs**: 15 orders/year requiring emergency air freight instead of sea shipping (@ ₹3.5L surcharge).
- **₹26.25 Lakhs**: 25 orders/year incurring contractual 5% buyer discounts for late delivery (@ ₹1.05L deduction).
- **₹28.8 Lakhs**: 12 merchandisers spending 2 hours daily chasing status across fragmented Excel sheets and frantic phone calls.

The platform provides a **mathematical run-rate projection engine** that surfaces delay warnings **two weeks early** instead of two days before delivery. Factory supervisors log shift output on budget phones in Tamil with offline queuing, while UK and European buyers track their orders through an isolated, read-only portal.

---

## 🛠️ Technology Stack

| Layer | Technology | Key Responsibility |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | High-performance SPA, sub-second loads, ~114 kB gzip bundle for 2–3 GB RAM phones |
| **Styling** | Tailwind CSS | Clean, minimal typography, restrained color palette, purposeful whitespace |
| **Backend** | Python 3.13 + FastAPI | High-concurrency async REST API with Pydantic v2 runtime validation |
| **Database** | MongoDB | Document store for order hierarchies + zero-config embedded engine for local runs |
| **Authentication** | JWT + RBAC | Role-based claims (`merchandiser`, `supervisor`, `buyer`) with strict tenant isolation |
| **AI Classification** | Gemini / OpenAI + Lexicon | Tamil voice/text translation into standard reason categories with human review gate |
| **Testing** | Pytest | 100% pass rate across math engine, buyer isolation, and workflow APIs |
| **Deployment** | Vercel + Render | Decoupled cloud hosting with environment variable configuration |

---

## 🚀 Quick Local Setup (Zero-Config)

### 1. Clone & Setup Backend
```bash
git clone https://github.com/thedevanshshukla/TiruppurTex.git
cd TiruppurTex/backend

# Create & activate Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1    # On Windows PowerShell (or source venv/bin/activate on Mac/Linux)

# Install dependencies & run tests
pip install -r requirements.txt
python -m pytest tests -v

# Start FastAPI server (auto-seeds sample data)
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```
Interactive Swagger docs: **`http://127.0.0.1:8001/docs`**

### 2. Setup Frontend
```bash
# In a new terminal window:
cd TiruppurTex/frontend

npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 👤 Reviewer Demo Logins (1-Click in UI)

| Role | Email | Password | What to Test |
| :--- | :--- | :--- | :--- |
| **Lead Merchandiser** | `merchandiser@company-a.com` | `admin123` | Order Board, Run-Rate Math breakdown, Date revision audit log, AI issue triage |
| **Floor Supervisor** | `supervisor@company-a.com` | `admin123` | Mobile Tamil/English toggle, pieces keypad, camera proof, offline queue |
| **UK Buyer (Company B)** | `buyer.uk@company-b.co.uk` | `admin123` | Strict isolation to Company B orders (`B-PO-88213`, `B-PO-88240`), photos, milestones |
| **German Buyer (Company C)** | `buyer.de@company-c.de` | `admin123` | Strict isolation to Company C order (`C-PO-0488`), Company B orders strictly hidden |

---

## 📖 Project Documentation Index

- **`Technical_Design_Document.docx`**: Official Technical Design Document (Word format requested in submission brief).
- **`TECHNICAL_DESIGN_DOCUMENT.md`**: Complete Technical Design Document (Markdown format) with system architecture diagrams, mathematical run-rate derivations, multi-tenant buyer isolation model, and offline sync mechanics.
- **`deployment.md`**: Step-by-step local setup guide, automated test suite verification, environment variable reference, reviewer credentials, and cloud deployment procedures (Render & Vercel).
