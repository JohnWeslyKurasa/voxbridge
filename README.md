# VoxBridge AI 2.0 — Executive Audio & Video Localization Platform

VoxBridge AI is a high-speed audio and video translation platform featuring a **Bright Luxury Theme** UI (Cream canvas, Pure White cards, Deep Maroon CTAs, and Champagne Gold accents) and a 100% open-source, offline-ready AI processing engine.

---

## 📁 Repository Structure

```
voxbridge/
├── frontend/             # Next.js 15 Web Application (UI, Clerk Auth, Dashboard, MongoDB)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── backend/              # Dedicated Python AI Microservice (FastAPI, Whisper ASR, NLLB, gTTS/Piper)
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
│
├── DEPLOYMENT.md         # Step-by-Step Master Cloud Deployment Guide
└── README.md
```

---

## 🚀 Quick Start

### 1. Web Application (Frontend)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000`.

### 2. Python AI Engine (Backend)
```bash
cd backend
pip install -r requirements.txt
python main.py
```
Open API docs at `http://localhost:8000/docs`.

---

## ☁️ Deployment

Refer to **[DEPLOYMENT.md](DEPLOYMENT.md)** for detailed instructions on deploying:
- **Frontend** to Vercel
- **Backend** to Render / Railway / Docker
