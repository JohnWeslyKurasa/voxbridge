# VoxBridge AI — Dedicated Python AI Microservice (Backend)

This is the dedicated Python AI microservice backend for **VoxBridge AI**. It performs heavy audio/video processing tasks:

- 🎙️ **Speech-to-Text Transcription**: Faster-Whisper ASR
- 🌍 **Multilingual Translation**: Meta NLLB-200 / DeepL
- 🗣️ **Clear Voice Speech Synthesis**: gTTS (Google Speech Engine) + Piper Neural TTS
- 🎬 **Video Dubbing & Audio Stream Replacement**: FFmpeg

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Start FastAPI Server
```bash
python main.py
```
Or with Uvicorn:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API docs will be available at:
- **Interactive Swagger UI**: `http://localhost:8000/docs`
- **ReDoc UI**: `http://localhost:8000/redoc`

---

## 🐳 Docker Deployment

To build and run the Docker container locally or in production:

```bash
docker build -t voxbridge-backend .
docker run -p 8000:8000 voxbridge-backend
```

---

## ☁️ Cloud Deployment Options

1. **Render.com**: Connect GitHub repository, select `backend/` directory, set environment to `Python 3` or `Docker`.
2. **Railway.app**: Select `backend/` directory and deploy using the included `Dockerfile`.
3. **AWS / GCP Cloud Run**: Push Docker image to AWS ECR / GCP Artifact Registry and launch as a containerized service.
