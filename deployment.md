# Deployment & Local Setup Guide

## 1. Quick Local Setup (Step-by-Step)

The project is structured with a FastAPI Python backend and a React + Vite frontend. It includes a zero-config embedded database engine so it can run immediately without requiring local MongoDB or Docker installations.

### Prerequisites:
- Python 3.10+ (tested on Python 3.13)
- Node.js 18+ (tested on Node v22)
- Git

---

### Step 1: Clone the Repository
```bash
git clone <GITHUB_REPOSITORY_URL>
cd isocode
```

---

### Step 2: Set Up and Run the Backend

```bash
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
.\venv\Scripts\activate.bat
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server (port 8001 default)
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

The backend will start on **`http://127.0.0.1:8001`**.  
Interactive OpenAPI documentation is available at **`http://127.0.0.1:8001/docs`**.

> **Note**: On first startup, the database automatically pre-seeds all sample orders from the brief (`B-PO-88213`, `B-PO-88240`, `C-PO-0488`), production units, and demo accounts.

---

### Step 3: Run the Backend Automated Test Suite
In a separate terminal (with the virtual environment activated):
```bash
cd backend
python -m pytest tests -v
```
All 12 unit, integration, and workflow tests will execute and pass.

---

### Step 4: Set Up and Run the Frontend

```bash
# In another terminal window:
cd frontend

# Install npm dependencies
npm install

# Start the Vite development server
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 2. Reviewer Demo Login Credentials

The login screen features **1-Click Reviewer Demo Login** buttons for instant access to any persona:

| Persona / Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Lead Merchandiser** | `merchandiser@company-a.com` | `admin123` | Full access to Order Board, PO Setup, Run-Rate Math, Date Revision Audit Log, and AI Issue Triage Inbox. |
| **Floor Supervisor** | `supervisor@company-a.com` | `admin123` | Mobile-first Tamil/English interface for logging daily pieces, inspection photos, voice/text notes, and offline queueing. |
| **UK Buyer (Company B)** | `buyer.uk@company-b.co.uk` | `admin123` | Read-only portal strictly isolated to Company B orders (`B-PO-88213`, `B-PO-88240`). Company C orders are inaccessible. |
| **Germany Buyer (Company C)** | `buyer.de@company-c.de` | `admin123` | Read-only portal strictly isolated to Company C orders (`C-PO-0488`). Company B orders are inaccessible. |

---

## 3. Environment Variables (Names Only)

No secrets or credentials are hardcoded into the repository. The application operates out of the box with safe development defaults and accepts the following environment variables:

### Backend Variables:
- `MONGODB_URI`: Connection string for MongoDB (e.g. MongoDB Atlas in production). If omitted, falls back to the embedded zero-config engine.
- `DB_NAME`: Database name (e.g. `tiruppur_tex`).
- `JWT_SECRET`: Secret key for signing JSON Web Tokens.
- `ENVIRONMENT`: Set to `development`, `test`, or `production`.
- `GEMINI_API_KEY`: *(Optional)* Google Gemini API key for Tamil LLM translation and structured JSON output. If omitted, seamlessly falls back to the local domain lexicon.
- `OPENAI_API_KEY`: *(Optional)* OpenAI API key as an alternative LLM provider.

### Frontend Variables:
- `VITE_API_URL`: Backend API URL (defaults to `/api` proxy in development, or the Render backend URL in production).

---

## 4. Production Deployment Guide

### A. Deploy Backend to Render (Free Web Service)
1. Fork or push this repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** $\rightarrow$ **Web Service**.
3. Connect your GitHub repository.
4. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add:
   - `ENVIRONMENT` = `production`
   - `JWT_SECRET` = `<your-secure-random-secret>`
   - `MONGODB_URI` = `<your-mongodb-atlas-uri>` (or leave empty to use in-memory engine)
   - `GEMINI_API_KEY` = `<your-gemini-key>` *(optional)*
6. Click **Create Web Service**. Note the deployed URL (e.g. `https://tiruppur-tex-api.onrender.com`).

---

### B. Deploy Frontend to Vercel
1. In the [Vercel Dashboard](https://vercel.com), click **Add New...** $\rightarrow$ **Project**.
2. Select your repository.
3. Configure settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://tiruppur-tex-api.onrender.com/api`
5. Click **Deploy**. Vercel will provide your live URL (e.g. `https://tiruppur-tex.vercel.app`).

