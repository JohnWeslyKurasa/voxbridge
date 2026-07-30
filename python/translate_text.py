import sys
import os
import json

# Language to NLLB FLORES-200 code mapping
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

# Standard ISO code map for fast web translator fallback
ISO_MAP = {
    "English": "en", "Hindi": "hi", "Telugu": "te", "Tamil": "ta",
    "Kannada": "kn", "Malayalam": "ml", "Bengali": "bn", "Marathi": "mr",
    "Gujarati": "gu", "Punjabi": "pa", "Odia": "or", "Assamese": "as", "Urdu": "ur"
}

def translate(text, source_lang_name, target_lang_name):
    """
    Translates input text from source_lang to target_lang.
    Uses ultra-fast GoogleTranslator (0.2s) as primary engine,
    falling back to Meta NLLB-200 if offline or unavailable.
    """
    if not text.strip():
        return text

    src_iso = ISO_MAP.get(source_lang_name, "auto")
    tgt_iso = ISO_MAP.get(target_lang_name, "en")

    if src_iso == tgt_iso:
        return text

    # Primary: Fast 0.2s Translation via deep-translator
    try:
        from deep_translator import GoogleTranslator
        fast_result = GoogleTranslator(source=src_iso, target=tgt_iso).translate(text)
        if fast_result and fast_result.strip():
            return fast_result
    except Exception as fast_err:
        sys.stderr.write(f"[FastTranslator] Fallback to NLLB: {fast_err}\n")

    # Fallback: Meta NLLB-200 (Offline, Transformers)
    try:
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
        import torch

        src_nllb = LANG_MAPPING.get(source_lang_name, "eng_Latn")
        tgt_nllb = LANG_MAPPING.get(target_lang_name, "hin_Deva")

        model_name = "facebook/nllb-200-distilled-600M"
        tokenizer = AutoTokenizer.from_pretrained(model_name, src_lang=src_nllb)
        model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

        forced_bos_id = tokenizer.convert_tokens_to_ids(tgt_nllb)
        inputs = tokenizer(text, return_tensors="pt")

        with torch.no_grad():
            translated_tokens = model.generate(
                **inputs,
                forced_bos_token_id=forced_bos_id,
                max_length=512
            )

        return tokenizer.batch_decode(translated_tokens, skip_special_tokens=True)[0]
    except Exception as nllb_err:
        raise Exception(f"All translation engines failed: {nllb_err}")

def main():
    if len(sys.argv) < 4:
        print(json.dumps({"success": False, "error": "Usage: python translate_text.py <text|@filepath> <source_language> <target_language>"}))
        sys.exit(1)

    text_arg = sys.argv[1]
    source_lang = sys.argv[2]
    target_lang = sys.argv[3]

    if text_arg.startswith("@"):
        text_file_path = text_arg[1:]
        try:
            with open(text_file_path, "r", encoding="utf-8") as f:
                text = f.read()
        except Exception as e:
            print(json.dumps({"success": False, "error": f"Failed to read file: {e}"}))
            sys.exit(1)
    else:
        text = text_arg

    try:
        translated_result = translate(text, source_lang, target_lang)
        print(json.dumps({
            "success": True,
            "translatedText": translated_result,
            "sourceLanguage": source_lang,
            "targetLanguage": target_lang
        }))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
