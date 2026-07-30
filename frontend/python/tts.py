"""
tts.py — Premium Clear Voice Text-to-Speech Engine for VoxBridge AI
====================================================================
Features:
  - Synthesizes crystal-clear, high-definition natural human speech.
  - Hybrid architecture: Uses gTTS (Google Speech Engine) for 40+ languages with fallback to Piper TTS.
  - Applies FFmpeg audio normalization (loudnorm filter + 256kbps stereo MP3 encoding) for broadcast-quality clarity.
  - Guaranteed safe JSON output on stdout.

Usage:
  python python/tts.py "<text|@filepath>" "<language>" "<output_base_path>"
"""

import sys
import os
import json
import subprocess
import urllib.request
try:
    from unidecode import unidecode
except ImportError:
    unidecode = lambda x: x
from static_ffmpeg import add_paths

# Add static FFmpeg paths
try:
    add_paths()
except Exception:
    pass

# Language Code Mapping for gTTS
GTTS_LANG_MAP = {
    "English": "en",
    "Hindi": "hi",
    "Spanish": "es",
    "French": "fr",
    "German": "de",
    "Italian": "it",
    "Japanese": "ja",
    "Chinese": "zh-CN",
    "Portuguese": "pt",
    "Russian": "ru",
    "Arabic": "ar",
    "Korean": "ko",
    "Dutch": "nl",
    "Polish": "pl",
    "Turkish": "tr",
    "Vietnamese": "vi",
    "Telugu": "te",
    "Tamil": "ta",
    "Kannada": "kn",
    "Malayalam": "ml",
    "Bengali": "bn",
    "Marathi": "mr",
    "Gujarati": "gu",
    "Punjabi": "pa",
    "Urdu": "ur",
}

PIPER_VOICE_MAP = {
    "English": ("en_US-lessac-medium", "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx", "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json"),
    "Hindi": ("hi_IN-pratham-medium", "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/hi/hi_IN/pratham/medium/hi_IN-pratham-medium.onnx", "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/hi/hi_IN/pratham/medium/hi_IN-pratham-medium.onnx.json"),
}

VOICES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "voices")


def ensure_voices_dir():
    os.makedirs(VOICES_DIR, exist_ok=True)


def download_file(url, dest_path):
    if os.path.exists(dest_path):
        return
    tmp_path = dest_path + ".tmp"
    try:
        urllib.request.urlretrieve(url, tmp_path)
        os.rename(tmp_path, dest_path)
    except Exception as e:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise Exception(f"Failed to download voice model from {url}: {e}")


def find_piper_executable():
    import shutil
    python_scripts = os.path.join(os.path.dirname(sys.executable), "Scripts")
    candidates = [
        os.path.join(python_scripts, "piper.exe"),
        os.path.join(python_scripts, "piper"),
        os.path.join(os.path.dirname(sys.executable), "piper.exe"),
        os.path.join(os.path.dirname(sys.executable), "piper"),
    ]
    for candidate in candidates:
        if os.path.isfile(candidate):
            return candidate

    found = shutil.which("piper")
    if found:
        return found
    return None


def synthesize_with_gtts(text, lang_code, raw_audio_path):
    """Synthesizes clear speech using gTTS."""
    from gtts import gTTS
    tts = gTTS(text=text, lang=lang_code, slow=False)
    tts.save(raw_audio_path)


def synthesize_with_piper(text, language, raw_audio_path):
    """Synthesizes speech using Piper TTS."""
    ensure_voices_dir()
    voice_info = PIPER_VOICE_MAP.get(language, PIPER_VOICE_MAP["English"])
    model_name, onnx_url, json_url = voice_info

    onnx_path = os.path.join(VOICES_DIR, f"{model_name}.onnx")
    json_path = os.path.join(VOICES_DIR, f"{model_name}.onnx.json")

    download_file(onnx_url, onnx_path)
    download_file(json_url, json_path)

    if "en_US" in model_name and language != "English":
        text = unidecode(text)

    piper_exe = find_piper_executable()
    if not piper_exe:
        raise Exception("Piper executable not found.")

    piper_result = subprocess.run(
        [piper_exe, "--model", onnx_path, "--output_file", raw_audio_path],
        input=text.encode("utf-8"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if piper_result.returncode != 0:
        raise Exception(f"Piper TTS failed: {piper_result.stderr.decode()}")


def enhance_and_convert_audio(raw_audio_path, output_mp3_path):
    """
    Converts raw audio to high-definition 256kbps stereo MP3 with loudness normalization filter.
    """
    cmd = [
        "ffmpeg",
        "-y",
        "-i", raw_audio_path,
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11,volume=1.1",
        "-codec:a", "libmp3lame",
        "-b:a", "256k",
        "-ar", "44100",
        "-ac", "2",
        output_mp3_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode != 0:
        # Fallback to standard MP3 conversion if loudnorm filter fails
        cmd_simple = [
            "ffmpeg",
            "-y",
            "-i", raw_audio_path,
            "-codec:a", "libmp3lame",
            "-b:a", "192k",
            output_mp3_path
        ]
        res_simple = subprocess.run(cmd_simple, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if res_simple.returncode != 0:
            raise Exception(f"FFmpeg audio enhancement failed: {res_simple.stderr.decode()}")


def synthesize_speech(text, language, output_base_path):
    raw_audio_path = output_base_path + "_raw.mp3"
    final_mp3_path = output_base_path + ".mp3"

    # Step 1: Synthesize Raw Audio (Try gTTS first for ultra-clear natural speech)
    lang_code = GTTS_LANG_MAP.get(language, "en")
    synthesized = False

    try:
        synthesize_with_gtts(text, lang_code, raw_audio_path)
        synthesized = True
    except Exception as gtts_err:
        sys.stderr.write(f"[TTS] gTTS failed, falling back to Piper: {gtts_err}\n")

    if not synthesized:
        try:
            raw_wav = output_base_path + "_raw.wav"
            synthesize_with_piper(text, language, raw_wav)
            raw_audio_path = raw_wav
            synthesized = True
        except Exception as piper_err:
            raise Exception(f"Both gTTS and Piper TTS engines failed: {piper_err}")

    # Step 2: Apply Audio Enhancements (Broadcast Quality 256kbps Stereo MP3)
    enhance_and_convert_audio(raw_audio_path, final_mp3_path)

    # Cleanup temporary raw audio file
    if os.path.exists(raw_audio_path):
        try:
            os.remove(raw_audio_path)
        except Exception:
            pass

    return final_mp3_path


def main():
    if len(sys.argv) < 4:
        print(json.dumps({"success": False, "error": "Usage: python tts.py <text|@filepath> <language> <output_base_path>"}))
        sys.exit(1)

    text_arg = sys.argv[1]
    language = sys.argv[2]
    output_base_path = sys.argv[3]

    if text_arg.startswith("@"):
        text_file_path = text_arg[1:]
        try:
            with open(text_file_path, "r", encoding="utf-8") as f:
                text = f.read()
        except Exception as e:
            print(json.dumps({"success": False, "error": f"Failed to read input text file '{text_file_path}': {e}"}))
            sys.exit(1)
    else:
        text = text_arg

    if not text.strip():
        print(json.dumps({"success": False, "error": "Input text is empty. Cannot generate speech."}))
        sys.exit(1)

    try:
        mp3_path = synthesize_speech(text, language, output_base_path)
        print(json.dumps({
            "success": True,
            "mp3_path": mp3_path,
            "language": language,
        }))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
