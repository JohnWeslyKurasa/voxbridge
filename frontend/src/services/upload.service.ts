/**
 * Interface mapping secure signature responses
 */
export interface SignatureData {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

/**
 * Interface mapping successful Cloudinary responses
 */
export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  bytes: number;
  duration?: number; // Cloudinary automatically computes duration for audio/video
  format: string;
}

/**
 * Reusable Upload Service
 * 
 * Why it is needed:
 * - Manages network transfers cleanly, separating concerns from component layouts.
 * - Employs XMLHttpRequest to track granular progress and support cancel abort triggers.
 * 
 * How it works:
 * - 1. Requests a secure signature token from `/api/upload/sign`.
 * - 2. Uploads the file direct to Cloudinary API using XMLHttpRequests.
 * - 3. Triggers progress hooks dynamically on transfer events.
 */
export const uploadService = {
  /**
   * Request upload signature from server
   */
  async getSignature(folder = "voxbridge_uploads"): Promise<SignatureData> {
    const res = await fetch("/api/upload/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to fetch secure upload signature.");
    }

    return res.json();
  },

  /**
   * Upload file to Cloudinary with progress and abort support
   */
  uploadFile(
    file: File,
    onProgress: (percent: number) => void,
    onSuccess: (data: CloudinaryUploadResponse) => void,
    onError: (err: Error) => void
  ): () => void {
    const xhr = new XMLHttpRequest();
    
    this.getSignature()
      .then((sig) => {
        // Determine Cloudinary resource type. Audio and Video both go to "video" endpoint for durational extraction
        const isVideoOrAudio = file.type.startsWith("video/") || file.type.startsWith("audio/");
        const resourceType = isVideoOrAudio ? "video" : "auto";
        const uploadUrl = `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", sig.apiKey);
        formData.append("timestamp", sig.timestamp.toString());
        formData.append("signature", sig.signature);
        formData.append("folder", sig.folder);

        // Set up progress tracking
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };

        // Response handlers
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              onSuccess({
                secure_url: response.secure_url,
                public_id: response.public_id,
                bytes: response.bytes,
                duration: response.duration, // Optional returned duration
                format: response.format,
              });
            } catch {
              onError(new Error("Failed to parse Cloudinary response."));
            }
          } else {
            const errResponse = JSON.parse(xhr.responseText || "{}");
            onError(new Error(errResponse.error?.message || "Upload failed. Check settings."));
          }
        };

        xhr.onerror = () => {
          onError(new Error("Network error occurred during upload transfer."));
        };

        // Trigger open and send request
        xhr.open("POST", uploadUrl, true);
        xhr.send(formData);
      })
      .catch((err) => {
        onError(err);
      });

    // Return the cancel/abort function
    return () => {
      if (xhr.readyState > 0 && xhr.readyState < 4) {
        xhr.abort();
        console.log("🚫 Upload file aborted by user action.");
      }
    };
  },

  /**
   * Save uploaded file metadata to local MongoDB Atlas via API
   */
  async saveMetadata(data: {
    userId: string;
    projectId: string;
    originalName: string;
    mediaType: "audio" | "video";
    cloudinaryUrl: string;
    publicId: string;
    size: number;
    duration: number;
    targetLanguage?: string;
    inputType?: string;
    transcriptText?: string;
    preserveVoice?: boolean;
  }) {
    const res = await fetch("/api/upload/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to save file metadata to database.");
    }

    return res.json();
  },
};
