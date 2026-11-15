# AgroShakti

AgroShakti is an agricultural assistance web app for farmers, with a React dashboard backed by an Express API and PostgreSQL. It brings together an agriculture-focused chatbot, crop-disease image classification, user interaction history, government-scheme and survey tools, and farmer/admin accounts. The backend is also structured to call separate ML services for soil, resource, weather, and scheme recommendations.

## Features

- **Farmer and admin accounts:** registration, login, JWT access/refresh tokens, profile management, and role-aware dashboard navigation.
- **Agriculture chat:** session-based conversations saved to PostgreSQL, with translation hooks and optional text-to-speech support. The chat UI also offers browser speech input/output.
- **Plant disease flow:** upload a crop image, classify it with a ResNet-50 model, and request a follow-up recommendation from the language model; detections and image URLs are recorded.
- **Additional dashboard tools:** soil analysis, resource estimation, weather advisories, scheme search and management, surveys, feedback/reports, and admin operations.
- **History:** chat, disease detection, soil, resource-estimation, and weather records are associated with the signed-in user.

> **Implementation status:** the Node API has routes for the additional ML tools, but the checked-in `flask-llm/app.py` currently implements only `/health` and `/chatbot`. The backend expects further endpoints on that service for soil analysis, resource estimation, weather advisories, and scheme recommendations. Those features need a compatible ML service to be available. The disease service also requires a model checkpoint that is not included in this repository; see [Model files](#model-files).

## Architecture

```text
React + Vite frontend (:5173)
          │ HTTP /api
          ▼
Express API (:5000) ───── PostgreSQL
    │       │
    │       ├──────── Flask LLM service (:8000)
    │       └──────── Flask disease classifier (:8001)
    └──────────────── Cloudinary image storage
```

The frontend calls the Express API (default `http://localhost:5000/api`). The API applies authentication and routes requests to controllers; controllers persist user and feature history through PostgreSQL and use `src/services/flaskService.js` for ML calls. Disease uploads are classified by the service on port 8001, then the chatbot service on port 8000 is used to generate a recommendation. `source_code_for_reference/` contains research/prototype material and is not part of this running request path.

## Repository layout

```text
agroshakti-backend/          Express API, PostgreSQL migration, integrations
  src/config/                Database, constants, image-storage configuration
  src/controllers/           Authentication, hooks, history, schemes, surveys, admin
  src/middleware/            Authentication, upload, validation/error handling
  src/routes/                API route registration
  src/services/              Flask, storage, and text-to-speech integrations
  migrations/                PostgreSQL schema
flask-llm/                   Flask chatbot API using llama-cpp-python
flask_disease_detection/     Flask + PyTorch ResNet-50 image classifier
frontend/                    React 18 + Vite application and farmer/admin dashboard
source_code_for_reference/   RAG script and model/preprocessing notebooks; research only
```

## Prerequisites

- Node.js and npm for the frontend and backend.
- Python and pip for the Flask services. The disease classifier uses PyTorch and may benefit from a CUDA-capable GPU, but selects CPU when CUDA is unavailable.
- A PostgreSQL database.
- The model files required by the Flask services (not committed; see below).
- Cloudinary credentials if you want disease images stored using the configured image-storage integration.

## Configuration

### Backend

From `agroshakti-backend/`, copy `.env.example` to `.env` and set your database credentials and secrets. At minimum, configure:

| Variable | Purpose |
| --- | --- |
| `PORT` | Express port; defaults to `5000` in `server.js`. |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | PostgreSQL connection. |
| `DB_SSL` | Set to `true` for the SSL connection configuration used by the app; `false` for local PostgreSQL. |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Replace the example values with strong, unique secrets. |
| `FLASK_ML_BASE_URL` | LLM/ML service base URL; defaults to `http://localhost:8000`. |
| `FLASK_DISEASE_DETECTION_URL` | Disease service base URL; defaults to `http://localhost:8001`. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary image-storage credentials. |
| `CORS_ORIGIN` | Frontend origin setting documented in the template. |

`MAX_FILE_SIZE` defaults to `5242880` bytes in the example. Do not commit `.env` or real credentials.

The frontend reads `VITE_API_URL` at build/dev time. If unset, it uses `http://localhost:5000/api`.

### Model files

- **Chatbot:** `flask-llm/app.py` loads `flask-llm/models/meta-llama-3.1-8b.Q4_K_M.gguf`. Obtain a compatible GGUF model and place it at that exact path, or adjust the model path in the app. The model is not included in this repository.
- **Disease classifier:** `flask_disease_detection/app.py` loads `flask_disease_detection/trained_model/best_resnet50_3.pth`. Download the checkpoint referenced in that file's setup comment and put it at that path. The model is not included in this repository.

Both model services load their model during startup and will fail to start if the required file is missing or incompatible. Ensure you have the right to use any model you download.

## Run locally

Start each process in a separate terminal. First configure PostgreSQL and the backend `.env`, then install each app's dependencies.

### 1. Database and API

The migration creates the schema in `agroshakti-backend/migrations/database_migration.sql`. Run it against a fresh database; the SQL uses plain `CREATE TABLE` statements and is not an idempotent migration.

```bash
cd agroshakti-backend
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secrets
npm run migrate
npm run dev
```

The API starts on port `5000` by default. Check it with:

```bash
curl http://localhost:5000/health
```

### 2. Chatbot service

Place the GGUF model at the path above, then install and run:

```bash
cd flask-llm
python -m venv .venv
# Activate the virtual environment (see platform-specific command below)
pip install -r requirement.txt
python app.py
```

This service listens on port `8000`. `llama-cpp-python` installation may require platform-specific build tools or a compatible prebuilt package.

### 3. Disease detection service

Place the ResNet-50 checkpoint at the path above, then install and run:

```bash
cd flask_disease_detection
python -m venv .venv
# Activate the virtual environment (see platform-specific command below)
pip install -r requirements.txt
python app.py
```

This service listens on port `8001`. It exposes `/health` and accepts multipart image uploads at `/detect-disease`.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite serves the frontend at `http://localhost:5173`. To point it to a non-default API, create `frontend/.env` with:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

For production frontend assets, use `npm run build`; `npm run preview` serves the built output locally.

### Virtual environment activation

Use the activation command for your shell after creating the Python environment:

```bash
# macOS / Linux
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1
```

## API overview

The API is mounted below `/api`; most feature endpoints require a valid bearer access token.

| Route group | Purpose |
| --- | --- |
| `/api/auth` | Register, login, refresh/logout, current user, profile, account deletion. |
| `/api/hooks` | Chatbot, soil analysis, resource estimation, weather advisory, scheme search, disease detection, translation, and text-to-speech. |
| `/api/history` | Retrieve user feature history, including chat sessions. |
| `/api/schemes` | Government scheme browsing and administration. |
| `/api/surveys` | Survey administration and response submission. |
| `/api/feedback` | Feedback and issue reports. |
| `/api/admin` | Admin statistics and user-management operations. |

See `agroshakti-backend/src/routes/` and the controllers for the route handlers and request behavior. The API's ML-dependent hooks require the corresponding service endpoints and model assets to be configured.

## Development notes

- Frontend scripts: `npm run dev`, `npm run build`, and `npm run preview` (`frontend/package.json`).
- Backend scripts: `npm run dev`, `npm start`, and `npm run migrate` (`agroshakti-backend/package.json`).
- The frontend package does not define a test script, and the backend package does not define an automated test script.
- `source_code_for_reference/Rag.py` is a separate RAG experiment with local/Colab-specific data paths; it is not wired into the Flask chatbot endpoint.

## License

This repository includes an Apache-2.0 `LICENSE` file. Third-party model weights may be subject to separate licenses and terms.
