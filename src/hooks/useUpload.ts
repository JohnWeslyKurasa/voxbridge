import { useState, useRef, useEffect } from "react";
import { uploadService, CloudinaryUploadResponse } from "@/services/upload.service";

/**
 * Interface mapping configuration parameters for useUpload
 */
export interface UseUploadOptions {
  maxSizeMB?: number;
  allowedExtensions?: string[];
  userId?: string;
  onSuccess?: (projectId: string) => void;
}

/**
 * Custom React Hook for Managing Media Uploads
 * 
 * Why it is needed:
 * - Coordinates drag-and-drop state machines, validations, progress indicators, and cancel operations.
 * - Prevents UI pollution by containing React state handlers (progress, previews, status) in a hook.
 * 
 * How it works:
 * - 1. Validates files by extension and maximum size thresholds.
 * - 2. Creates local HTML blob URLs so the browser can play previews immediately.
 * - 3. Initiates signed uploads, tracking XMLHttpRequest percentages.
 * - 4. Stores abort functions inside a mutable useRef, which cancels transfer payloads when triggered.
 */
export function useUpload(options: UseUploadOptions = {}) {
  const {
    maxSizeMB = 100, // Default 100MB
    allowedExtensions = ["mp4", "mov", "avi", "mkv", "webm", "mp3", "wav", "aac", "flac", "m4a"],
    userId = "mock-user-johnk",
    onSuccess,
  } = options;

  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "validating" | "uploading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<{ duration: number; width?: number; height?: number } | null>(null);

  const abortRef = useRef<(() => void) | null>(null);

  // Cleanup blob URLs on unmount to prevent browser memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  /**
   * Validate file constraints
   */
  const validateFile = (selectedFile: File): boolean => {
    setError(null);
    setStatus("validating");

    // 1. Validate File Size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      setError(`File is too large. Maximum allowed size is ${maxSizeMB}MB.`);
      setStatus("error");
      return false;
    }

    // 2. Validate File Extension
    const extension = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      setError(`Invalid file format. Supported types: ${allowedExtensions.join(", ").toUpperCase()}`);
      setStatus("error");
      return false;
    }

    return true;
  };

  /**
   * Start files validation and upload flow
   */
  const startUpload = async (selectedFile: File, targetLanguage?: string, inputType?: string) => {
    if (!validateFile(selectedFile)) return;

    setFile(selectedFile);
    setProgress(0);
    setStatus("uploading");

    // Create browser local preview URL
    const blobUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(blobUrl);

    // Extract local audio/video duration before uploading as back up
    const isVideo = selectedFile.type.startsWith("video/") || selectedFile.name.endsWith(".mp4") || selectedFile.name.endsWith(".webm") || selectedFile.name.endsWith(".mov") || selectedFile.name.endsWith(".mkv") || selectedFile.name.endsWith(".avi");
    const mediaType: "audio" | "video" = isVideo ? "video" : "audio";

    // Set duration loader
    const mediaElement = document.createElement(mediaType);
    mediaElement.src = blobUrl;
    mediaElement.onloadedmetadata = () => {
      if (mediaType === "video") {
        const videoEl = mediaElement as HTMLVideoElement;
        setVideoMetadata({
          duration: videoEl.duration,
          width: videoEl.videoWidth,
          height: videoEl.videoHeight,
        });
      } else {
        setVideoMetadata({
          duration: mediaElement.duration,
        });
      }
    };

    // Run direct signature and file transfer
    const cancelUpload = uploadService.uploadFile(
      selectedFile,
      (percent) => {
        setProgress(percent);
      },
      async (cloudinaryResponse: CloudinaryUploadResponse) => {
        try {
          // Cloudinary succeeded, now save metadata in our MongoDB database
          const durationToSave = cloudinaryResponse.duration || videoMetadata?.duration || 0;
          
          const saveRes = await uploadService.saveMetadata({
            userId,
            projectId: "", // Automatically created in route backend
            originalName: selectedFile.name,
            mediaType,
            cloudinaryUrl: cloudinaryResponse.secure_url,
            publicId: cloudinaryResponse.public_id,
            size: selectedFile.size,
            duration: durationToSave,
            targetLanguage,
            inputType,
          });

          setStatus("success");
          setProgress(100);
          
          if (onSuccess && saveRes.projectId) {
            onSuccess(saveRes.projectId);
          }
        } catch (dbErr: unknown) {
          setError(dbErr instanceof Error ? dbErr.message : "File uploaded, but database saving failed.");
          setStatus("error");
        }
      },
      (uploadErr: { message?: string }) => {
        setError(uploadErr.message || "Network error occurred during Cloudinary transfer.");
        setStatus("error");
      }
    );

    // Save cancel/abort callback ref
    abortRef.current = cancelUpload;
  };

  /**
   * Cancel active uploads
   */
  const cancel = () => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }
    setStatus("idle");
    setFile(null);
    setProgress(0);
    setError("Upload canceled by user.");
  };

  /**
   * Reset states
   */
  const reset = () => {
    setStatus("idle");
    setFile(null);
    setProgress(0);
    setError(null);
    setPreviewUrl(null);
    setVideoMetadata(null);
    abortRef.current = null;
  };

  return {
    file,
    progress,
    status,
    error,
    previewUrl,
    videoMetadata,
    startUpload,
    cancel,
    reset,
  };
}
