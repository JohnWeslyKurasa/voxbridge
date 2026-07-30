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

class TranscribeRequest(BaseModel):
    file_url: str
    target_language: str = "Hindi"

class TranslateRequest(BaseModel):
    text: str
    source_language: str = "English"
    target_language: str = "Hindi"

class TTSRequest(BaseModel):
    text: str
    target_language: str = "Hindi"
    speaker_wav: str = ""
    preserve_voice: bool = True

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


@app.post("/api/transcribe")
def transcribe_media(req: TranscribeRequest):
    """Transcribes media audio/video URL into transcript and translated text."""
    if not req.file_url.strip():
        raise HTTPException(status_code=400, detail="file_url cannot be empty.")

    script_path = os.path.join(os.path.dirname(__file__), "transcribe.py")
    try:
        cmd = [sys.executable, script_path, req.file_url, req.target_language]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        if res.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Transcribe script error: {res.stderr}")

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
        return output
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
    """Synthesizes voice cloned speech from text using XTTS v2 or standard TTS fallback.
    Uploads the result to Cloudinary and returns the audio_url so Vercel can access it."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    script_path = os.path.join(os.path.dirname(__file__), "tts.py")
    output_base = os.path.join(tempfile.gettempdir(), f"voxbridge_backend_tts_{os.urandom(4).hex()}")

    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", delete=False, suffix=".txt") as tf:
        tf.write(req.text)
        temp_txt_path = tf.name

    try:
        preserve_str = "true" if req.preserve_voice else "false"
        cmd = [sys.executable, script_path, f"@{temp_txt_path}", req.target_language, output_base, req.speaker_wav or "", preserve_str]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=600)

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

        mp3_path = output.get("mp3_path", "")
        audio_url = mp3_path  # default fallback

        # Upload result MP3 to Cloudinary so Vercel serverless can access it via URL
        cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
        api_key = os.environ.get("CLOUDINARY_API_KEY", "")
        api_secret = os.environ.get("CLOUDINARY_API_SECRET", "")

        if cloud_name and api_key and api_secret and mp3_path and os.path.exists(mp3_path):
            try:
                import cloudinary
                import cloudinary.uploader
                cloudinary.config(cloud_name=cloud_name, api_key=api_key, api_secret=api_secret)
                upload_result = cloudinary.uploader.upload(
                    mp3_path,
                    resource_type="video",
                    folder="voxbridge_tts",
                    overwrite=True,
                    public_id=f"tts_{os.path.basename(output_base)}"
                )
                audio_url = upload_result.get("secure_url", mp3_path)
                # Cleanup local file after successful upload
                try:
                    os.remove(mp3_path)
                except Exception:
                    pass
            except Exception as cloud_err:
                sys.stderr.write(f"[main.py] Cloudinary upload warning: {cloud_err}\n")
                # Keep returning mp3_path as fallback

        return {
            "success": True,
            "mp3_path": mp3_path,
            "audio_url": audio_url,
            "language": req.target_language,
            "engine": output.get("engine"),
            "voice_cloned": output.get("voice_cloned", False)
        }
    except Exception as e:
        if os.path.exists(temp_txt_path):
            try:
                os.remove(temp_txt_path)
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

