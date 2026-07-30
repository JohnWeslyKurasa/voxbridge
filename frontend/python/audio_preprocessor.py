"""
audio_preprocessor.py — Audio Preprocessing & Multi-Speaker Detection for VoxBridge AI
========================================================================================
Features:
  - Audio extraction via FFmpeg (24kHz mono PCM WAV).
  - Preserves natural vocal formants, pitch harmonics, and speaker timbre (mild volume norm only).
  - Long silence trimming & broadcast volume normalization (-16 LUFS).
  - Main speaker detection and multi-speaker rejection.
  - Selects optimal 10-25s continuous clean speech segment for XTTS v2 speaker reference.
"""

import sys
import os
import subprocess
import tempfile
import numpy as np

try:
    import scipy.io.wavfile as wavfile
except ImportError:
    wavfile = None


def extract_raw_audio(input_file: str, output_wav: str, sample_rate: int = 24000) -> str:
    """Extracts raw mono PCM WAV at sample_rate using FFmpeg."""
    cmd = [
        "ffmpeg", "-y",
        "-i", input_file,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", str(sample_rate),
        "-ac", "1",
        output_wav
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        raise Exception(f"FFmpeg audio extraction failed: {res.stderr}")
    return output_wav


def apply_gentle_volume_norm(input_wav: str, output_wav: str) -> str:
    """
    Applies gentle loudness normalization without destructive noise gates or frequency cuts.
    Preserves exact vocal pitch formants and timbre of the speaker.
    """
    cmd = [
        "ffmpeg", "-y",
        "-i", input_wav,
        "-af", "silenceremove=stop_periods=-1:stop_duration=1.0:stop_threshold=-45dB,loudnorm=I=-16:TP=-1.5:LRA=11",
        "-ar", "24000",
        "-ac", "1",
        output_wav
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        cmd_basic = [
            "ffmpeg", "-y",
            "-i", input_wav,
            "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
            "-ar", "24000",
            "-ac", "1",
            output_wav
        ]
        res_basic = subprocess.run(cmd_basic, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res_basic.returncode != 0:
            raise Exception(f"FFmpeg audio normalization failed: {res_basic.stderr}")
    return output_wav


def detect_multi_speaker(wav_path: str) -> bool:
    """
    Analyzes audio frames to check for multi-speaker presence using pitch variance across speech chunks.
    Returns True if multi-speaker detected, False if single main speaker.
    """
    if wavfile is None:
        return False

    try:
        sr, data = wavfile.read(wav_path)
        if len(data.shape) > 1:
            data = data.mean(axis=1)

        if data.dtype == np.int16:
            data = data.astype(np.float32) / 32768.0

        chunk_samples = int(sr * 1.5)
        n_chunks = len(data) // chunk_samples
        if n_chunks < 3:
            return False

        features = []
        for i in range(n_chunks):
            chunk = data[i * chunk_samples : (i + 1) * chunk_samples]
            energy = np.mean(chunk ** 2)
            if energy < 0.001:
                continue

            zcr = np.mean(np.diff(np.sign(chunk)) != 0)
            corr = np.correlate(chunk, chunk, mode='full')
            corr = corr[len(corr)//2:]
            min_lag = int(sr / 400)
            max_lag = int(sr / 80)
            if max_lag < len(corr):
                peak_lag = min_lag + np.argmax(corr[min_lag:max_lag])
                pitch_est = sr / peak_lag if peak_lag > 0 else 0
            else:
                pitch_est = 0

            features.append([zcr, pitch_est, np.sqrt(energy)])

        if len(features) < 4:
            return False

        features = np.array(features)
        pitches = features[:, 1]
        valid_pitches = pitches[pitches > 60]

        if len(valid_pitches) >= 4:
            pitch_std = np.std(valid_pitches)
            pitch_range = np.percentile(valid_pitches, 90) - np.percentile(valid_pitches, 10)
            if pitch_std > 70.0 and pitch_range > 120.0:
                return True

    except Exception as e:
        sys.stderr.write(f"[AudioPreprocessor] Multi-speaker check warning: {e}\n")

    return False


def trim_best_reference_audio(input_wav: str, output_ref_wav: str, target_duration_sec: float = 20.0) -> str:
    """
    Extracts 10–25 seconds of clean continuous speech for XTTS v2 speaker reference.
    """
    if wavfile is None:
        subprocess.run(["ffmpeg", "-y", "-i", input_wav, "-t", str(target_duration_sec), output_ref_wav],
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return output_ref_wav

    try:
        sr, data = wavfile.read(input_wav)
        total_duration = len(data) / sr

        if total_duration <= target_duration_sec:
            subprocess.run(["ffmpeg", "-y", "-i", input_wav, "-ar", "24000", "-ac", "1", output_ref_wav],
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            return output_ref_wav

        window_samples = int(target_duration_sec * sr)
        step_samples = int(1.0 * sr)
        best_start = 0
        max_energy = 0.0

        for start in range(0, len(data) - window_samples, step_samples):
            chunk = data[start : start + window_samples]
            energy = np.mean(chunk.astype(np.float64) ** 2)
            if energy > max_energy:
                max_energy = energy
                best_start = start

        start_sec = best_start / sr
        cmd = [
            "ffmpeg", "-y",
            "-ss", f"{start_sec:.2f}",
            "-i", input_wav,
            "-t", str(target_duration_sec),
            "-ar", "24000",
            "-ac", "1",
            output_ref_wav
        ]
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return output_ref_wav

    except Exception as e:
        sys.stderr.write(f"[AudioPreprocessor] Reference trimming warning: {e}\n")
        subprocess.run(["ffmpeg", "-y", "-i", input_wav, "-t", str(target_duration_sec), output_ref_wav],
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return output_ref_wav


def preprocess_audio_pipeline(source_media_path: str, temp_dir: str) -> dict:
    """
    Full audio preprocessing workflow:
      1. Extract audio WAV.
      2. Apply gentle volume normalization (preserves vocal formants).
      3. Check multi-speaker presence.
      4. Select best 10-25s continuous speech clip for XTTS v2 reference.
    """
    raw_wav = os.path.join(temp_dir, f"raw_{os.urandom(4).hex()}.wav")
    clean_wav = os.path.join(temp_dir, f"clean_{os.urandom(4).hex()}.wav")
    ref_wav = os.path.join(temp_dir, f"ref_{os.urandom(4).hex()}.wav")

    extract_raw_audio(source_media_path, raw_wav, sample_rate=24000)
    apply_gentle_volume_norm(raw_wav, clean_wav)

    if detect_multi_speaker(clean_wav):
        raise ValueError("Multi-speaker audio detected. VoxBridge voice cloning requires a single main speaker reference.")

    trim_best_reference_audio(clean_wav, ref_wav, target_duration_sec=20.0)

    return {
        "raw_wav": raw_wav,
        "clean_wav": clean_wav,
        "reference_wav": ref_wav
    }


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python audio_preprocessor.py <input_media> <output_ref_wav>")
        sys.exit(1)

    input_media = sys.argv[1]
    output_ref_wav = sys.argv[2]
    temp_d = tempfile.gettempdir()

    try:
        res = preprocess_audio_pipeline(input_media, temp_d)
        import shutil
        shutil.copyfile(res["reference_wav"], output_ref_wav)
        print(f"Success: Preprocessed reference audio saved to {output_ref_wav}")
    except Exception as err:
        print(f"Error: {err}", file=sys.stderr)
        sys.exit(1)
