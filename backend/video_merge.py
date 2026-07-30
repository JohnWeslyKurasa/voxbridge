"""
video_merge.py — FFmpeg Video+Audio Merger for VoxBridge AI
============================================================
Why it is needed:
  - Replaces the original video's audio track with Piper-generated translated speech.
  - Preserves original video quality (no video re-encoding).
  - Exports the result as an MP4 file.

How it works:
  1. Accepts: source video URL (Cloudinary), translated audio MP3 path, output MP4 path.
  2. Downloads the source video from Cloudinary to a temp file.
  3. Uses FFmpeg to merge: original video stream + new translated audio stream.
  4. Uses -c:v copy to avoid re-encoding (preserves quality, fast processing).
  5. Uses -shortest to trim audio/video to the shorter of the two.
  6. Outputs final MP4 ready for Cloudinary re-upload.

Usage:
  python python/video_merge.py "<video_url>" "<audio_mp3_path>" "<output_mp4_path>"
"""

import sys
import os
import json
import subprocess
import urllib.request
import tempfile
from static_ffmpeg import add_paths

# Initialize static-ffmpeg binaries
add_paths()


def download_video(url, dest_path):
    """
    Downloads video from a URL (e.g. Cloudinary secure URL) to a local temp file.
    
    Args:
      url (str): Source video URL.
      dest_path (str): Local path to save the downloaded video.
    """
    print(f"[VideoMerge] Downloading source video...", file=sys.stderr)
    try:
        urllib.request.urlretrieve(url, dest_path)
        print(f"[VideoMerge] Video downloaded: {os.path.getsize(dest_path)} bytes", file=sys.stderr)
    except Exception as e:
        raise Exception(f"Failed to download source video from {url}: {e}")


def merge_video_audio(video_path, audio_path, output_path):
    """
    Merges a video file with a new audio track using FFmpeg.
    
    Key FFmpeg flags explained:
      -c:v copy       → Copy video stream without re-encoding (fast, lossless quality)
      -c:a aac        → Encode audio as AAC (standard MP4 audio codec)
      -b:a 128k       → Audio bitrate 128kbps (good quality, small file)
      -map 0:v:0      → Use video stream from input 0 (source video)
      -map 1:a:0      → Use audio stream from input 1 (translated audio)
      -shortest       → Trim output to the length of the shorter stream
      -movflags +faststart → Optimize MP4 for web streaming (moov atom at start)
    
    Args:
      video_path (str): Path to source video file.
      audio_path (str): Path to translated audio MP3.
      output_path (str): Path for output merged MP4.
    """
    print(f"[VideoMerge] Merging video + translated audio...", file=sys.stderr)
    
    command = [
        "ffmpeg", "-y",
        "-i", video_path,          # Input 0: source video
        "-i", audio_path,          # Input 1: translated audio
        "-c:v", "copy",            # Copy video stream (no re-encode)
        "-c:a", "aac",             # Encode audio as AAC
        "-b:a", "128k",            # Audio bitrate
        "-map", "0:v:0",           # Take video from input 0
        "-map", "1:a:0",           # Take audio from input 1
        "-shortest",               # Trim to shorter stream
        "-movflags", "+faststart", # Web-optimized MP4
        output_path
    ]
    
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    if result.returncode != 0:
        raise Exception(f"FFmpeg merge failed: {result.stderr.decode()}")
    
    print(f"[VideoMerge] Merge complete: {os.path.getsize(output_path)} bytes", file=sys.stderr)
    return output_path


def main():
    """
    Entry point for CLI execution.
    
    Arguments:
      sys.argv[1] = source video URL (Cloudinary URL)
      sys.argv[2] = translated audio MP3 local path
      sys.argv[3] = output MP4 local path
    """
    if len(sys.argv) < 4:
        print(json.dumps({
            "success": False,
            "error": "Usage: python video_merge.py <video_url> <audio_mp3_path> <output_mp4_path>"
        }))
        sys.exit(1)

    video_url     = sys.argv[1]
    audio_path    = sys.argv[2]
    output_path   = sys.argv[3]

    # Validate that the translated audio exists
    if not os.path.exists(audio_path):
        print(json.dumps({"success": False, "error": f"Audio file not found: {audio_path}"}))
        sys.exit(1)

    # Create a temp file for the downloaded source video
    temp_dir = tempfile.gettempdir()
    video_ext = "mp4"  # Assume MP4; Cloudinary serves most videos as MP4
    temp_video_path = os.path.join(temp_dir, f"voxbridge_src_video_{os.getpid()}.{video_ext}")

    try:
        # Step 1: Download source video
        download_video(video_url, temp_video_path)

        # Step 2: Merge video + translated audio
        merge_video_audio(temp_video_path, audio_path, output_path)

        # Step 3: Return success
        print(json.dumps({
            "success": True,
            "output_path": output_path,
            "size_bytes": os.path.getsize(output_path),
        }))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

    finally:
        # Cleanup temp source video
        if os.path.exists(temp_video_path):
            try:
                os.remove(temp_video_path)
            except OSError:
                pass


if __name__ == "__main__":
    main()
