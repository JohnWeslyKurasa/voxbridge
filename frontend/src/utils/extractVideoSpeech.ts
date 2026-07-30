/**
 * Extract Spoken Speech Text from Video/Audio File using Browser Web Speech Engine
 */
export async function extractSpeechFromMediaFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    // Check for browser SpeechRecognition support
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
      const mediaEl = document.createElement(file.type.startsWith("video/") ? "video" : "audio");
      const objectUrl = URL.createObjectURL(file);
      mediaEl.src = objectUrl;
      mediaEl.muted = false;
      mediaEl.volume = 1.0;

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
        URL.revokeObjectURL(objectUrl);
        resolve(capturedText.trim());
      };

      recognition.onend = finish;
      recognition.onerror = finish;

      // Timeout safety after 10 seconds of extraction
      setTimeout(finish, 10000);

      mediaEl.onloadeddata = () => {
        try {
          recognition.start();
          mediaEl.play().catch(() => {});
        } catch {
          finish();
        }
      };

      mediaEl.onerror = finish;
    } catch {
      resolve("");
    }
  });
}
