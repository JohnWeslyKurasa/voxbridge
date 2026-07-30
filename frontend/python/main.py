"""
VoxBridge AI — Dedicated Python AI Microservice (FastAPI Backend)
===================================================================
Why it is needed:
  - Decouples heavy AI processing (Whisper ASR, NLLB translation, Piper/gTTS voice synthesis, FFmpeg video merging)
    from the Next.js Web App frontend.
  - Allows independent 1-click deployment on Render, Railway, AWS ECS, GCP Cloud Run, or Docker containers.
  - Provides RESTful API endpoints for all audio/video localization tasks.

Endpoints:
  - GET  /                    : API info & Status
  - GET  /health              : System & Model Healthcheck
  - POST /api/transcribe      : Transcribe audio/video to text (Faster-Whisper)
  - POST /api/translate       : Translate text into 40+ languages (NLLB/DeepL)
  - POST /api/tts             : Synthesize clear voice MP3 (gTTS + Piper)
  - POST /api/video-merge     : Merge target MP3 into source video (FFmpeg)
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import sys
import json
import subprocess
import shutil
import tempfile

app = FastAPI(
    title="VoxBridge AI Engine API",
    description="Microservice backend for speech-to-text, translation, TTS voice synthesis, and video dubbing.",
    version="2.0.0",
)

# Enable CORS for Next.js frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class TranslateRequest(BaseModel):
    text: str
    source_language: str = "English"
    target_language: str = "Hindi"

class TTSRequest(BaseModel):
    text: str
    target_language: str = "Hindi"

class VideoMergeRequest(BaseModel):
    video_url: str
    audio_url: str


@app.get("/")
def read_root():
    return {
        "service": "VoxBridge AI Engine Microservice",
        "status": "online",
        "version": "2.0.0",
        "endpoints": {
            "health": "/health",
            "transcribe": "/api/transcribe",
            "translate": "/api/translate",
            "tts": "/api/tts",
            "video_merge": "/api/video-merge",
        }
    }


@app.get("/health")
def healthcheck():
    return {
        "status": "healthy",
        "python_version": sys.version,
        "ffmpeg": shutil.which("ffmpeg") is not None,
    }


@app.post("/api/translate")
def translate_text(req: TranslateRequest):
    """Translates text from source language into target language."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    script_path = os.path.join(os.path.dirname(__file__), "translate_text.py")
    
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", delete=False, suffix=".txt") as tf:
        tf.write(req.text)
        temp_txt_path = tf.name

    try:
        cmd = [sys.executable, script_path, f"@{temp_txt_path}", req.source_language, req.target_language]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        if os.path.exists(temp_txt_path):
            os.remove(temp_txt_path)

        if res.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Translation error: {res.stderr}")

        output = json.loads(res.stdout)
        if not output.get("success"):
            raise HTTPException(status_code=500, detail=output.get("error", "Translation failed."))

        return {
            "success": True,
            "translated_text": output.get("translatedText"),
            "source_language": req.source_language,
            "target_language": req.target_language,
        }
    except Exception as e:
        if os.path.exists(temp_txt_path):
            os.remove(temp_txt_path)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tts")
def generate_tts(req: TTSRequest):
    """Synthesizes crystal-clear speech from text."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    script_path = os.path.join(os.path.dirname(__file__), "tts.py")
    output_base = os.path.join(tempfile.gettempdir(), f"voxbridge_backend_tts_{os.urandom(4).hex()}")

    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", delete=False, suffix=".txt") as tf:
        tf.write(req.text)
        temp_txt_path = tf.name

    try:
        cmd = [sys.executable, script_path, f"@{temp_txt_path}", req.target_language, output_base]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        if os.path.exists(temp_txt_path):
            os.remove(temp_txt_path)

        if res.returncode != 0:
            raise HTTPException(status_code=500, detail=f"TTS script error: {res.stderr}")

        # Parse JSON output line-by-line
        lines = res.stdout.strip().split("\n")
        json_str = ""
        for line in reversed(lines):
            l = line.strip()
            if l.startswith("{") and l.endswith("}"):
                json_str = l
                break

        if not json_str:
            json_str = res.stdout

        output = json.loads(json_str)
        if not output.get("success"):
            raise HTTPException(status_code=500, detail=output.get("error", "TTS synthesis failed."))

        return {
            "success": True,
            "mp3_path": output.get("mp3_path"),
            "language": req.target_language,
        }
    except Exception as e:
        if os.path.exists(temp_txt_path):
            os.remove(temp_txt_path)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
