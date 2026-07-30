# VoxBridge AI — Master Deployment & Architecture Guide

VoxBridge AI is architected into two decoupled services:

1. **`frontend/`**: Next.js 15 Web Application (React, Tailwind CSS, Clerk Auth, MongoDB, Cloudinary)
2. **`backend/`**: Dedicated Python AI Microservice (FastAPI, Faster-Whisper, Meta NLLB-200, gTTS, Piper TTS, FFmpeg)

---

## 🏗️ Architecture Diagram

```
                       ┌─────────────────────────┐
                       │     User Browser /      │
                       │   Client Application    │
                       └────────────┬────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │     FRONTEND (Vercel)   │
                       │     Next.js 15 App      │
                       │ (Clerk / MongoDB / UI)  │
                       └────────────┬────────────┘
                                    │
                         REST API / Cloud Services
                                    │
              ┌─────────────────────┴─────────────────────┐
              ▼                                           ▼
┌───────────────────────────┐               ┌───────────────────────────┐
│     BACKEND (Render/AWS)  │               │   Cloudinary / MongoDB    │
│    Python FastAPI Engine  │               │    Media & DB Storage     │
│ (Whisper/NLLB/gTTS/FFmpeg)│               └───────────────────────────┘
└───────────────────────────┘
```

---

## 🌐 1. Deploying Frontend (`frontend/`) to Vercel

1. Log into [Vercel](https://vercel.com).
2. Click **Add New** → **Project**.
3. Select your GitHub repository: `JohnWeslyKurasa/voxbridge`.
4. Set the **Root Directory** to `frontend`.
5. Add the Environment Variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` = `/dashboard`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` = `/dashboard`
   - `MONGODB_URI`
   - `CLOUDINARY_CLOUD_NAME`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
6. Click **Deploy**.

---

## 🐍 2. Deploying Backend (`backend/`) to Render / Railway

### Option A: Render.com (Free / Low Cost)
1. Log into [Render](https://render.com).
2. Click **New +** → **Web Service**.
3. Connect your repository `JohnWeslyKurasa/voxbridge`.
4. Set **Root Directory** to `backend`.
5. Set **Runtime** to `Docker` (or `Python 3`).
6. Set Build Command: `pip install -r requirements.txt` (if Python runtime).
7. Set Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
8. **Add these Environment Variables** (required for Cloudinary upload of XTTS audio):
   - `CLOUDINARY_CLOUD_NAME` — your Cloudinary cloud name
   - `CLOUDINARY_API_KEY` — your Cloudinary API key
   - `CLOUDINARY_API_SECRET` — your Cloudinary API secret
9. Click **Create Web Service**.
10. Copy the deployed URL (e.g. `https://voxbridge-backend.onrender.com`).

### Option B: Railway.app
1. Log into [Railway](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `backend/` directory. Railway will automatically detect the `Dockerfile` and deploy the service.
4. Add the same **Environment Variables** as listed above for Render.

### Connect Vercel to your Python Backend
After deploying the backend, go to your **Vercel Project Settings → Environment Variables** and add:
- `PYTHON_BACKEND_URL` = `https://your-backend-url.onrender.com`

This ensures every upload on Vercel triggers XTTS v2 voice cloning via the Python microservice.

---

## 🧪 Local Testing

### Running Frontend:
```bash
cd frontend
npm install
npm run dev
```

### Running Backend:
```bash
cd backend
pip install -r requirements.txt
python main.py
```
