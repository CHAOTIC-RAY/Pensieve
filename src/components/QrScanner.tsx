import React, { useEffect, useRef, useState, ChangeEvent } from "react";
import jsQR from "jsqr";
import { Camera, X, RefreshCw, AlertCircle, ExternalLink, Image as ImageIcon } from "lucide-react";

interface QrScannerProps {
  onScan: (text: string) => void;
  onClose: () => void;
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [permissionState, setPermissionState] = useState<
    "prompt" | "granted" | "denied" | "unsupported"
  >("prompt");
  const [errorMessage, setErrorMessage] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Initialize Camera
  useEffect(() => {
    async function startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionState("unsupported");
        setErrorMessage("Camera access is not supported by your browser or connection. Make sure you are using HTTPS or localhost.");
        return;
      }
      try {
        setPermissionState("prompt");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        streamRef.current = stream;

        // Ensure videoRef is available, even if we just rendered
        // In React, refs might not be instantly available if conditional rendering was just evaluated, but we made it unconditional now.
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true"); // required for iOS
          videoRef.current.play();
          setPermissionState("granted");
          setIsScanning(true);
        }
      } catch (err: any) {
        console.error("Error accessing camera:", err);
        setPermissionState("denied");
        setErrorMessage(
          err.message ||
            "Could not access your camera. Please ensure camera permissions are granted."
        );
      }
    }

    startCamera();

    // Cleanup tracks and animation on unmount
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Processing loops
  useEffect(() => {
    if (permissionState !== "granted" || !isScanning) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const scanFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          // Found a code!
          stopCamera();
          onScan(code.data);
          return;
        }
      }
      animationFrameId.current = requestAnimationFrame(scanFrame);
    };

    animationFrameId.current = requestAnimationFrame(scanFrame);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [permissionState, isScanning, onScan]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    stopCamera();
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
           setIsProcessingImage(false);
           return;
        }
        
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
           setIsProcessingImage(false);
           return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          onScan(code.data);
        } else {
          setPermissionState("unsupported");
          setErrorMessage("No valid QR code found in the uploaded image. Please try another image.");
        }
        setIsProcessingImage(false);
      };
      img.onerror = () => {
        setIsProcessingImage(false);
        setPermissionState("unsupported");
        setErrorMessage("Failed to load image.");
      }
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
        setIsProcessingImage(false);
        setPermissionState("unsupported");
        setErrorMessage("Failed to read file.");
    }
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center md:p-4 text-white select-none">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 px-4 py-4 md:top-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
        <h3 className="text-base font-bold flex items-center gap-2 drop-shadow-md">
          <Camera className="w-5 h-5 text-emerald-400" />
          Scan QR Code
        </h3>
        <button
          onClick={onClose}
          className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md active:scale-95 rounded-xl transition text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Camera / Permission States */}
      <div className="relative w-full h-full md:max-w-md md:aspect-video md:h-auto md:rounded-3xl overflow-hidden border-0 md:border border-white/10 bg-neutral-950 flex flex-col items-center justify-center shadow-none md:shadow-2xl">
        
        {/* We ALWAYS render video and canvas so refs are available for startCamera */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${permissionState !== 'granted' ? 'hidden' : ''}`}
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />

        {isProcessingImage && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm gap-3">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm font-semibold text-emerald-400">Processing image...</p>
          </div>
        )}

        {permissionState === "prompt" && !isProcessingImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center z-10 bg-neutral-950">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm font-semibold">Requesting camera access...</p>
            <p className="text-xs text-white/50">Please allow camera permissions if prompted by your browser.</p>
          </div>
        )}

        {permissionState === "denied" && !isProcessingImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center z-10 bg-neutral-950">
            <AlertCircle className="w-10 h-10 text-rose-500" />
            <h4 className="text-sm font-bold text-rose-400">Camera Access Denied</h4>
            <p className="text-xs text-white/60 leading-relaxed max-w-xs">
              {errorMessage}
            </p>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-left w-full mt-2">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Troubleshooting:</span>
              <p className="text-[11px] text-white/70 leading-normal">
                1. Ensure browser camera permission is allowed for this site.<br />
                2. If running inside an iframe, open the app in a new tab using the icon in the top header.
              </p>
            </div>
            <a
              href={window.location.href}
              target="_blank"
              rel="noreferrer"
              className="mt-2 py-2 px-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in New Tab
            </a>
          </div>
        )}

        {permissionState === "unsupported" && !isProcessingImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center z-10 bg-neutral-950">
            <AlertCircle className="w-10 h-10 text-rose-500" />
            <h4 className="text-sm font-bold text-rose-400">Scan Failed / Unsupported</h4>
            <p className="text-xs text-white/60 leading-relaxed">
              {errorMessage}
            </p>
          </div>
        )}

        {permissionState === "granted" && !isProcessingImage && (
          <>
            {/* Glowing Finder overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-2/3 max-w-[240px] aspect-square border-2 border-emerald-500/40 rounded-2xl bg-black/5 flex flex-col justify-between p-4 shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden">
                {/* Visual scanning line */}
                <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#10b981] animate-[scan_2s_infinite_ease-in-out]" />
                
                {/* Corners visual indicators */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Instructions & Actions */}
      <div className="absolute bottom-8 text-center max-w-sm flex flex-col items-center w-full z-10">
        <p className="text-sm font-semibold text-emerald-400">Align QR Code</p>
        <p className="text-xs text-white/50 mt-1 leading-relaxed px-4">
          Position the settings QR code inside the viewfinder to automatically link your device.
        </p>

        <div className="mt-6 flex items-center justify-center gap-4 w-full">
            <div className="relative overflow-hidden group">
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                />
                <div className="flex items-center gap-2 py-3 px-5 bg-black/50 backdrop-blur-md hover:bg-white/10 border border-white/20 rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 group-hover:border-emerald-500/50 group-hover:text-emerald-400 text-sm font-semibold">
                    <ImageIcon className="w-4 h-4" />
                    Upload Photo
                </div>
            </div>
        </div>
      </div>

      {/* Embedded CSS animation for scanning line */}
      <style>{`
        @keyframes scan {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(220px);
          }
        }
      `}</style>
    </div>
  );
}
