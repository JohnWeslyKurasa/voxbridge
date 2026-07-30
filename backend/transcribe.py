import sys
import os
import json
import tempfile
import subprocess
import gc
import urllib.request
from static_ffmpeg import add_paths

# Initialize static-ffmpeg to append static binaries into PATH environment
add_paths()

try:
    from faster_whisper import WhisperModel
except ImportError:
    print(json.dumps({"error": "Missing faster-whisper package. Install via pip."}))
    sys.exit(1)

try:
    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
    import torch
except ImportError:
    print(json.dumps({"error": "Missing transformers, torch packages. Install via pip."}))
    sys.exit(1)

# BCP-47 Target NLLB Code Mappings for Indian & Global Languages
LANG_MAPPING = {
    "English": "eng_Latn",
    "Hindi": "hin_Deva",
    "Telugu": "tel_Telu",
    "Tamil": "tam_Taml",
    "Kannada": "kan_Knda",
    "Malayalam": "mal_Mlym",
    "Bengali": "ben_Beng",
    "Marathi": "mar_Deva",
    "Gujarati": "guj_Gujr",
    "Punjabi": "pan_Guru",
    "Odia": "ory_Orya",
    "Assamese": "asm_Beng",
    "Urdu": "urd_Arab"
}

# Mapping Whisper detected ISO-639 codes to NLLB codes
WHISPER_TO_NLLB = {
    "en": "eng_Latn",
    "hi": "hin_Deva",
    "te": "tel_Telu",
    "ta": "tam_Taml",
    "kn": "kan_Knda",
    "ml": "mal_Mlym",
    "bn": "ben_Beng",
    "mr": "mar_Deva",
    "gu": "guj_Gujr",
    "pa": "pan_Guru",
    "or": "ory_Orya",
    "as": "asm_Beng",
    "ur": "urd_Arab"
}

def extract_audio(input_file, output_wav):
    """
    Extracts audio from video or converts existing audio to 16kHz mono PCM WAV.
    Handles HTTP/HTTPS URLs by downloading locally first.
    """
    temp_dl_file = None
    if input_file.startswith("http://") or input_file.startswith("https://"):
        ext = ".mp4" if ".mp4" in input_file.lower() else ".wav" if ".wav" in input_file.lower() else ".mp3"
        temp_dl_file = os.path.join(tempfile.gettempdir(), f"voxbridge_dl_{os.urandom(4).hex()}{ext}")
        try:
            urllib.request.urlretrieve(input_file, temp_dl_file)
            input_file = temp_dl_file
        except Exception as dl_err:
            sys.stderr.write(f"[Transcribe] URL download warning: {dl_err}\n")

    command = [
        "ffmpeg",
        "-y",
        "-i", input_file,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        output_wav
    ]
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    if temp_dl_file and os.path.exists(temp_dl_file):
        try:
            os.remove(temp_dl_file)
        except Exception:
            pass

    if result.returncode != 0:
        raise Exception(f"FFmpeg extraction failed: {result.stderr}")

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing input file path or URL argument."}))
        sys.exit(1)

    input_file = sys.argv[1]
    target_lang_name = sys.argv[2] if len(sys.argv) > 2 else "English"
    tgt_nllb = LANG_MAPPING.get(target_lang_name, "eng_Latn")

    temp_dir = tempfile.gettempdir()
    temp_wav_path = os.path.join(temp_dir, f"voxbridge_temp_{os.getpid()}.wav")
    
    try:
        extract_audio(input_file, temp_wav_path)
        
        # 1. Initialize Whisper Model (Use CUDA if available, fallback CPU; 'base' model for high accuracy)
        use_gpu = torch.cuda.is_available()
        device = "cuda" if use_gpu else "cpu"
        compute_type = "float16" if use_gpu else "int8"
        
        try:
            whisper_model = WhisperModel("base", device=device, compute_type=compute_type)
        except Exception:
            whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8")

        segments, info = whisper_model.transcribe(temp_wav_path, beam_size=5)
        
        compiled_segments = []
        full_text_list = []
        for segment in segments:
            text_val = segment.text.strip()
            if text_val:
                compiled_segments.append({
                    "start": round(segment.start, 2),
                    "end": round(segment.end, 2),
                    "text": text_val
                })
                full_text_list.append(text_val)
            
        full_transcript = " ".join(full_text_list)
        detected_iso = info.language
        src_nllb = WHISPER_TO_NLLB.get(detected_iso, "eng_Latn")

        del whisper_model
        gc.collect()

        translated_text = ""
        translated_segments = []

        if src_nllb != tgt_nllb and full_transcript.strip():
            def translate_text(text):
                if not text.strip():
                    return text
                try:
                    from deep_translator import GoogleTranslator
                    res = GoogleTranslator(source="auto", target=target_lang_name.lower()).translate(text)
                    if res and res.strip():
                        return res
                except Exception:
                    pass

                try:
                    tokenizer = AutoTokenizer.from_pretrained("facebook/nllb-200-distilled-600M", src_lang=src_nllb)
                    nllb_model = AutoModelForSeq2SeqLM.from_pretrained("facebook/nllb-200-distilled-600M")
                    forced_bos_id = tokenizer.convert_tokens_to_ids(tgt_nllb)
                    inputs = tokenizer(text, return_tensors="pt")
                    with torch.no_grad():
                        translated_tokens = nllb_model.generate(**inputs, forced_bos_token_id=forced_bos_id, max_length=512)
                    return tokenizer.batch_decode(translated_tokens, skip_special_tokens=True)[0]
                except Exception as e:
                    return text

            translated_text = translate_text(full_transcript)
            for seg in compiled_segments:
                translated_val = translate_text(seg["text"])
                translated_segments.append({
                    "start": seg["start"],
                    "end": seg["end"],
                    "text": translated_val
                })
        else:
            translated_text = full_transcript
            translated_segments = compiled_segments

        output_data = {
            "success": True,
            "language": detected_iso,
            "language_probability": round(info.language_probability, 2),
            "transcript": full_transcript,
            "segments": compiled_segments,
            "translated_text": translated_text,
            "translated_segments": translated_segments
        }
        print(json.dumps(output_data))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)
        
    finally:
        if os.path.exists(temp_wav_path):
            try:
                os.remove(temp_wav_path)
            except OSError:
                pass

if __name__ == "__main__":
    main()
