"""
tts.py — XTTS v2 Voice Cloning & Premium Speech Synthesis Engine for VoxBridge AI
===================================================================================
Features:
  - XTTS v2 Multilingual Voice Cloning (preserves speaker identity, pitch, style, emotion, speed).
  - Handles remote Cloudinary media URLs & local files as speaker reference (`speaker_wav`).
  - Preprocesses reference audio using `audio_preprocessor` (noise removal, volume normalization, silence removal).
  - GPU auto-detection (`cuda`) with automatic fallback to CPU.
  - Generates high-definition 24kHz broadcast audio.
  - Hybrid fallback architecture: gTTS + Piper TTS when `preserve_voice=False` or when reference audio is unavailable.
"""

import sys
import os
import json
import subprocess
import urllib.request
import tempfile
import torch

try:
    from unidecode import unidecode
except ImportError:
    unidecode = lambda x: x

from static_ffmpeg import add_paths
add_paths()

try:
    from audio_preprocessor import preprocess_audio_pipeline
except ImportError:
    preprocess_audio_pipeline = None

XTTS_LANG_MAP = {
    "English": "en",
    "Hindi": "hi",
    "Spanish": "es",
    "French": "fr",
    "German": "de",
    "Italian": "it",
    "Portuguese": "pt",
    "Polish": "pl",
    "Turkish": "tr",
    "Russian": "ru",
    "Dutch": "nl",
    "Czech": "cs",
    "Arabic": "ar",
    "Chinese": "zh-cn",
    "Japanese": "ja",
    "Hungarian": "hu",
    "Korean": "ko",
    "Telugu": "hi",
    "Tamil": "hi",
    "Kannada": "hi",
    "Malayalam": "hi",
    "Bengali": "hi",
    "Marathi": "hi",
    "Gujarati": "hi",
    "Punjabi": "hi",
    "Assamese": "hi",
    "Odia": "hi",
    "Urdu": "ur",
}

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

_XTTS_MODEL = None


def get_xtts_model():
    global _XTTS_MODEL
    if _XTTS_MODEL is not None:
        return _XTTS_MODEL

    try:
        from TTS.api import TTS
        use_gpu = torch.cuda.is_available()
        sys.stderr.write(f"[XTTS v2] Initializing model on {'GPU (CUDA)' if use_gpu else 'CPU'}...\n")
        
        os.environ["COQUI_TOS_AGREED"] = "1"
        _XTTS_MODEL = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2", progress_bar=False, gpu=use_gpu)
        return _XTTS_MODEL
    except Exception as e:
        sys.stderr.write(f"[XTTS v2] Failed to initialize XTTS v2 model: {e}\n")
        return None


def synthesize_with_xtts(text: str, language: str, speaker_wav_path: str, output_wav_path: str) -> bool:
    """
    Clones the speaker's voice from `speaker_wav_path` (local file or HTTP URL) using XTTS v2.
    """
    model = get_xtts_model()
    if model is None:
        raise Exception("XTTS v2 model unavailable.")

    lang_code = XTTS_LANG_MAP.get(language, "en")
    temp_dir = tempfile.gettempdir()
    downloaded_temp_path = None

    try:
        # Step 1: Download speaker reference media if provided as a remote HTTP/HTTPS URL
        if speaker_wav_path.startswith("http://") or speaker_wav_path.startswith("https://"):
            sys.stderr.write(f"[XTTS v2] Downloading reference media from URL: {speaker_wav_path[:70]}...\n")
            ext = ".mp4" if ".mp4" in speaker_wav_path.lower() else ".wav" if ".wav" in speaker_wav_path.lower() else ".mp3"
            downloaded_temp_path = os.path.join(temp_dir, f"voxbridge_speaker_ref_{os.urandom(4).hex()}{ext}")
            urllib.request.urlretrieve(speaker_wav_path, downloaded_temp_path)
            speaker_wav_path = downloaded_temp_path
            sys.stderr.write(f"[XTTS v2] Downloaded reference media: {os.path.getsize(downloaded_temp_path)} bytes\n")

        if not os.path.exists(speaker_wav_path):
            raise Exception(f"Speaker reference audio file does not exist: {speaker_wav_path}")

        # Step 2: Preprocess reference audio (noise removal, volume normalization, silence removal, multi-speaker check)
        ref_wav = speaker_wav_path
        if preprocess_audio_pipeline is not None:
            try:
                sys.stderr.write("[XTTS v2] Preprocessing reference audio (noise removal, normalization, single-speaker check)...\n")
                prep_res = preprocess_audio_pipeline(speaker_wav_path, temp_dir)
                ref_wav = prep_res["reference_wav"]
            except ValueError as multi_spk_err:
                raise ValueError(str(multi_spk_err))
            except Exception as prep_err:
                sys.stderr.write(f"[XTTS v2] Reference preprocessing warning: {prep_err}. Using downloaded audio directly.\n")

        sys.stderr.write(f"[XTTS v2] Synthesizing speech in '{language}' (code: '{lang_code}') using reference '{ref_wav}'...\n")
        
        # Step 3: Run XTTS v2 voice cloning
        model.tts_to_file(
            text=text,
            speaker_wav=ref_wav,
            language=lang_code,
            file_path=output_wav_path
        )

        if not os.path.exists(output_wav_path) or os.path.getsize(output_wav_path) == 0:
            raise Exception("XTTS v2 synthesis generated an empty output file.")

        return True

    finally:
        if downloaded_temp_path and os.path.exists(downloaded_temp_path):
            try:
                os.remove(downloaded_temp_path)
            except Exception:
                pass


def synthesize_with_gtts(text: str, lang_code: str, raw_audio_path: str):
    """Synthesizes speech using gTTS."""
    from gtts import gTTS
    tts = gTTS(text=text, lang=lang_code, slow=False)
    tts.save(raw_audio_path)


def synthesize_with_piper(text: str, language: str, raw_audio_path: str):
    """Synthesizes speech using Piper TTS."""
    os.makedirs(VOICES_DIR, exist_ok=True)
    voice_info = PIPER_VOICE_MAP.get(language, PIPER_VOICE_MAP["English"])
    model_name, onnx_url, json_url = voice_info

    onnx_path = os.path.join(VOICES_DIR, f"{model_name}.onnx")
    json_path = os.path.join(VOICES_DIR, f"{model_name}.onnx.json")

    if not os.path.exists(onnx_path):
        urllib.request.urlretrieve(onnx_url, onnx_path)
    if not os.path.exists(json_path):
        urllib.request.urlretrieve(json_url, json_path)

    if "en_US" in model_name and language != "English":
        text = unidecode(text)

    import shutil
    piper_exe = shutil.which("piper") or os.path.join(os.path.dirname(sys.executable), "Scripts", "piper.exe")
    if not os.path.exists(piper_exe):
        raise Exception("Piper executable not found.")

    piper_result = subprocess.run(
        [piper_exe, "--model", onnx_path, "--output_file", raw_audio_path],
        input=text.encode("utf-8"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if piper_result.returncode != 0:
        raise Exception(f"Piper TTS failed: {piper_result.stderr.decode()}")


def enhance_and_convert_audio(raw_audio_path: str, output_mp3_path: str, sample_rate: int = 24000):
    """
    Converts raw output to high-definition 24kHz 256kbps MP3 with broadcast loudness normalization.
    """
    cmd = [
        "ffmpeg",
        "-y",
        "-i", raw_audio_path,
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11,volume=1.1",
        "-codec:a", "libmp3lame",
        "-b:a", "256k",
        "-ar", str(sample_rate),
        "-ac", "2",
        output_mp3_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode != 0:
        cmd_simple = [
            "ffmpeg",
            "-y",
            "-i", raw_audio_path,
            "-codec:a", "libmp3lame",
            "-b:a", "192k",
            "-ar", str(sample_rate),
            output_mp3_path
        ]
        res_simple = subprocess.run(cmd_simple, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if res_simple.returncode != 0:
            raise Exception(f"FFmpeg audio enhancement failed: {res_simple.stderr.decode()}")


def synthesize_speech(
    text: str,
    language: str,
    output_base_path: str,
    speaker_wav_path: str = None,
    preserve_voice: bool = True
) -> tuple:
    raw_audio_path = output_base_path + "_raw.wav"
    final_mp3_path = output_base_path + ".mp3"

    synthesized = False
    used_engine = "gTTS/Piper"

    if preserve_voice and speaker_wav_path and speaker_wav_path.strip():
        try:
            synthesize_with_xtts(text, language, speaker_wav_path, raw_audio_path)
            synthesized = True
            used_engine = "XTTS v2 Voice Cloning"
        except ValueError as multi_spk_err:
            raise multi_spk_err
        except Exception as xtts_err:
            sys.stderr.write(f"[TTS] XTTS v2 voice cloning error: {xtts_err}. Falling back to standard engine.\n")

    if not synthesized:
        lang_code = GTTS_LANG_MAP.get(language, "en")
        try:
            raw_gtts = output_base_path + "_raw_gtts.mp3"
            synthesize_with_gtts(text, lang_code, raw_gtts)
            raw_audio_path = raw_gtts
            synthesized = True
            used_engine = "gTTS Standard Engine"
        except Exception as gtts_err:
            sys.stderr.write(f"[TTS] gTTS failed, falling back to Piper: {gtts_err}\n")

    if not synthesized:
        try:
            synthesize_with_piper(text, language, raw_audio_path)
            synthesized = True
            used_engine = "Piper TTS Standard Engine"
        except Exception as piper_err:
            raise Exception(f"All TTS engines (XTTS v2, gTTS, Piper) failed: {piper_err}")

    enhance_and_convert_audio(raw_audio_path, final_mp3_path, sample_rate=24000)

    if os.path.exists(raw_audio_path):
        try:
            os.remove(raw_audio_path)
        except Exception:
            pass

    return final_mp3_path, used_engine


def main():
    if len(sys.argv) < 4:
        print(json.dumps({"success": False, "error": "Usage: python tts.py <text|@filepath> <language> <output_base_path> [<speaker_wav_path>] [<preserve_voice: true/false>]"}))
        sys.exit(1)

    text_arg = sys.argv[1]
    language = sys.argv[2]
    output_base_path = sys.argv[3]
    speaker_wav_path = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4].strip() != "" else None
    preserve_voice_arg = sys.argv[5] if len(sys.argv) > 5 else "true"
    preserve_voice = preserve_voice_arg.lower() in ("true", "1", "yes")

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
        mp3_path, engine_used = synthesize_speech(
            text=text,
            language=language,
            output_base_path=output_base_path,
            speaker_wav_path=speaker_wav_path,
            preserve_voice=preserve_voice
        )
        print(json.dumps({
            "success": True,
            "mp3_path": mp3_path,
            "language": language,
            "engine": engine_used,
            "voice_cloned": engine_used == "XTTS v2 Voice Cloning"
        }))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
