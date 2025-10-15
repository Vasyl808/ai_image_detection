# Deepfake Detection Platform

AI-powered system for detecting deepfake images with Grad-CAM visual explanations.

## Features

- FastAPI backend with EfficientNet-B0 model and Grad-CAM support
- React + TypeScript frontend with modern landing & detection pages
- REST API (`/detect`, `/health`, `/cleanup`, `/stats`)
- Results stored as files and served via `/results/<filename>`
- Dockerized backend & frontend, each with dedicated `docker-compose.yml`

## Project Structure

```
ai_image_detection/
├── backend/
│   ├── app/                 # FastAPI application package
│   ├── Dockerfile           # Backend container build
│   ├── requirements.txt     # Python dependencies
│   └── run.py               # Entry point (uvicorn wrapper)
├── frontend/
│   ├── src/                 # React application source
│   ├── Dockerfile           # Frontend container build
│   └── nginx.conf           # Production web server config
├── docker-compose.yml       # Backend + frontend stack
├── .gitignore
└── results/                 # Generated Grad-CAM images (gitignored)
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker 24+ / Docker Compose v2
- (Optional) Trained weights `best_efficientnet_model.pth` in `backend/`

---

## Quick Start

- **Run with Docker Compose**
  1. **Backend**: `cd backend` → `docker compose up --build`
  2. **Frontend** *(new terminal)*: `cd frontend` → `docker compose up --build`
  3. Access API at http://localhost:8000 and UI at http://localhost:8080
  4. Stop each service with `docker compose down`
- **Run locally without Docker**
  1. Copy `backend/.env.example` to `.env` and adjust values as needed
  2. Start backend (FastAPI) using the virtualenv instructions below
  3. Copy `frontend/.env.example` to `.env` if you need a custom `VITE_API_URL`
  4. Start frontend with Vite dev server; it proxies `/api` to `http://localhost:8000`

---

## Local Development (Detailed)

### Backend (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .\.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Configure MODEL_CHECKPOINT_PATH if needed
python run.py
```

Backend API: http://localhost:8000  
Docs (Swagger): http://localhost:8000/docs

### Frontend (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env  # Optional: override VITE_API_URL
npm run dev
```

Frontend: http://localhost:3000 (proxies API to `http://localhost:8000`)

---

## Docker Usage (Detailed)

### Backend Container

```bash
cd backend
docker build -t deepfake-backend .
docker run --rm -p 8000:8000 deepfake-backend
```

### Frontend Container

```bash
cd frontend
docker build -t deepfake-frontend .
docker run --rm -p 8080:8080 \
  -e NGINX_BACKEND_URL=http://localhost:8000/ \
  deepfake-frontend
```

Frontend will be served at http://localhost:8080. Configure the API URL at build time if you need a different backend endpoint:

```bash
docker build -t deepfake-frontend \
  --build-arg VITE_API_URL=http://localhost:8000 \
  .
```

### Backend via Docker Compose

```bash
cd backend
docker compose up --build
```

Backend: http://localhost:8000

Stop service:

```bash
docker compose down
```

### Frontend via Docker Compose

```bash
cd frontend
docker compose up --build
```

Frontend: http://localhost:8080

Stop service:

```bash
docker compose down
```

---

## Testing the API

```bash
curl -X POST "http://localhost:8000/detect" \
  -F "file=@path/to/image.jpg"
```

---

## Environment Variables

Backend uses `.env` (see `backend/.env.example`). Key settings include:

- `MODEL_CHECKPOINT_PATH`
- `RESULTS_DIR`
- `CORS_ORIGINS`

Result files are cleaned automatically every day at midnight server time.

Frontend build-time variable:

- `VITE_API_URL` (defaults to `/api` in Docker image, `/api` proxies to backend)

---

## Preparing for GitHub

1. Ensure `best_efficientnet_model.pth` is excluded from git (already via `.gitignore`).
2. Run linting/tests as needed.
3. Commit all relevant source files and documentation.

Example initial commit:

```bash
git init
git add .
git commit -m "feat: add deepfake detection platform"
```

Push to GitHub:

```bash
git remote add origin https://github.com/<username>/ai_image_detection.git
git branch -M main
git push -u origin main
```

---

## Useful Commands

- `npm run lint` (frontend linting)
- `npm run build` (frontend production build)
- `pip install -r requirements.txt` (backend dependencies)
- `python run.py` (start backend API)
- `docker compose logs -f` (follow container logs)

---

## License

Add your preferred license (e.g., MIT) before publishing publicly.
