/**
 * Extract Spoken Speech Text from Video/Audio File using Browser Web Speech Engine
 */
export async function extractSpeechFromMediaFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const win = window as unknown as Record<string, unknown>;
    const SpeechRecognitionClass = (win.SpeechRecognition || win.webkitSpeechRecognition) as {
      new (): {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        start: () => void;
        stop: () => void;
        onresult: (event: { resultIndex: number; results: Array<Array<{ transcript: string }> & { isFinal: boolean }> }) => void;
        onend: () => void;
        onerror: () => void;
      };
    } | undefined;

    if (!SpeechRecognitionClass) {
      resolve("");
      return;
    }

    try {
      const isVideo = file.type.startsWith("video/") || file.name.endsWith(".mp4") || file.name.endsWith(".webm") || file.name.endsWith(".mov");
      const mediaEl = document.createElement(isVideo ? "video" : "audio");
      const objectUrl = URL.createObjectURL(file);

      mediaEl.src = objectUrl;
      mediaEl.muted = true; // Mute element to prevent audible noise while decoding
      mediaEl.volume = 1.0;
      if (mediaEl instanceof HTMLVideoElement) {
        mediaEl.playsInline = true;
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      let capturedText = "";

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            capturedText += " " + event.results[i][0].transcript;
          }
        }
      };

      const finish = () => {
        try { recognition.stop(); } catch {}
        try { mediaEl.pause(); } catch {}
        URL.revokeObjectURL(objectUrl);
        resolve(capturedText.trim());
      };

      recognition.onend = finish;
      recognition.onerror = finish;

      // Timeout safety after 12 seconds of extraction
      setTimeout(finish, 12000);

      const startExtraction = () => {
        try {
          recognition.start();
          mediaEl.muted = false;
          mediaEl.play().then(() => {
            // Started playback successfully
          }).catch(() => {
            // Autoplay blocked fallback
            mediaEl.muted = true;
            mediaEl.play().catch(() => {});
          });
        } catch {
          finish();
        }
      };

      if (mediaEl.readyState >= 2) {
        startExtraction();
      } else {
        mediaEl.onloadeddata = startExtraction;
        mediaEl.oncanplay = startExtraction;
      }

      mediaEl.onerror = finish;
    } catch {
      resolve("");
    }
  });
}
