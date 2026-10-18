"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Download,
  RefreshCw,
  FlipHorizontal,
  Sparkles,
  Film,
  Trash2,
  Volume2,
  VolumeX,
  Heart,
  Palette,
  Layers,
  Smile,
  Type,
  Upload,
  Check,
  RotateCcw,
  Sliders,
  Image as ImageIcon,
} from "lucide-react";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  calcStripMetrics,
  getLayoutConfig,
  FILTER_CSS,
  FRAME_STYLES,
  STICKER_PRESETS,
  Sound,
  type FilterKind,
  type FrameTheme,
  type GridLayout,
  type FontTheme,
  type PlacedSticker,
} from "@/src/booth.utils";

export default function BoothPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stripCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Camera & Stream State
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamLoading, setStreamLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [mirrored, setMirrored] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Booth Layout & Preferences
  const [layout, setLayout] = useState<GridLayout>("3x1");
  const [filter, setFilter] = useState<FilterKind>("beauty-glow");
  const [frameTheme, setFrameTheme] = useState<FrameTheme>("blush-pink");
  const [fontTheme, setFontTheme] = useState<FontTheme>("sans");
  const [customFrameUrl, setCustomFrameUrl] = useState<string | null>(null);

  // Live Photo Feature Toggle
  const [livePhotoEnabled, setLivePhotoEnabled] = useState(true);

  // Watermark Customization
  const [title, setTitle] = useState("LOVE IS FUN");
  const [subtitle, setSubtitle] = useState("STUDIO MEMORIES");
  const [showDate, setShowDate] = useState(true);

  // Capture & Retake State
  const [shots, setShots] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);

  // Stickers State
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartPos = useRef<{ x: number; y: number; initialXPercent: number; initialYPercent: number } | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  // GIF Export State
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);

  // Total required shots based on layout
  const totalShots = getLayoutConfig(layout).totalShots;

  // Start Camera Stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isMounted = true;
    setStreamLoading(true);

    if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      setStreamError("Browser Anda tidak mendukung akses webcam langsung.");
      setStreamLoading(false);
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 960 },
          facingMode: "user",
        },
        audio: false,
      })
      .then((stream) => {
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        activeStream = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            video.play().catch(console.error);
            if (isMounted) {
              setStreamLoading(false);
              setCameraActive(true);
            }
          };
        } else {
          if (isMounted) {
            setStreamLoading(false);
            setCameraActive(true);
          }
        }
      })
      .catch((err: Error) => {
        if (!isMounted) return;
        setStreamError(
          err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
            ? "Izin kamera ditolak. Silakan izinkan akses webcam di pengaturan browser Anda."
            : `Gagal mengakses kamera: ${err.message}`
        );
        setStreamLoading(false);
      });

    return () => {
      isMounted = false;
      activeStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Capture a single frame from video element
  const captureCurrentFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;

    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.filter = FILTER_CSS[filter];
    if (mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  }, [filter, mirrored]);

  // Automated Multi-Shot Session Loop
  const startSession = async () => {
    if (isCapturing || streamError || streamLoading) return;
    setShots([]);
    setIsCapturing(true);

    const capturedFrames: string[] = [];

    for (let shotIndex = 0; shotIndex < totalShots; shotIndex++) {
      for (let sec = 3; sec >= 1; sec--) {
        setCountdown(sec);
        if (soundEnabled) Sound.playBeep();
        await new Promise((r) => setTimeout(r, 950));
      }

      setCountdown(null);
      setFlash(true);
      if (soundEnabled) Sound.playShutter();

      const dataUrl = captureCurrentFrame();
      if (dataUrl) {
        capturedFrames.push(dataUrl);
        setShots([...capturedFrames]);
      }

      setTimeout(() => setFlash(false), 200);
      await new Promise((r) => setTimeout(r, 650));
    }

    setIsCapturing(false);
  };

  // Retake a specific photo slot
  const retakeSingleSlot = async (slotIdx: number) => {
    if (isCapturing || streamError || streamLoading) return;
    setRetakeIndex(slotIdx);
    setIsCapturing(true);

    for (let sec = 3; sec >= 1; sec--) {
      setCountdown(sec);
      if (soundEnabled) Sound.playBeep();
      await new Promise((r) => setTimeout(r, 950));
    }

    setCountdown(null);
    setFlash(true);
    if (soundEnabled) Sound.playShutter();

    const dataUrl = captureCurrentFrame();
    if (dataUrl) {
      setShots((prev) => {
        const updated = [...prev];
        updated[slotIdx] = dataUrl;
        return updated;
      });
    }

    setTimeout(() => setFlash(false), 200);
    setRetakeIndex(null);
    setIsCapturing(false);
  };

  // Custom Frame File Upload
  const handleCustomFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomFrameUrl(dataUrl);
        setFrameTheme("custom");
      }
    };
    reader.readAsDataURL(file);
  };

  // Sticker Placement Helper
  const addSticker = (emoji: string) => {
    if (shots.length === 0) return;
    const newSticker: PlacedSticker = {
      id: `sticker_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      emoji,
      xPercent: 50,
      yPercent: 30 + Math.random() * 40,
      size: 48,
    };
    setPlacedStickers((prev) => [...prev, newSticker]);
  };

  const removeSticker = (id: string) => {
    setPlacedStickers((prev) => prev.filter((s) => s.id !== id));
  };

  // Pointer drag for stickers
  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const sticker = placedStickers.find((s) => s.id === id);
    if (!sticker || !canvasContainerRef.current) return;

    setDraggingId(id);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      initialXPercent: sticker.xPercent,
      initialYPercent: sticker.yPercent,
    };
  };

  const handlePointerMove = (id: string, e: React.PointerEvent) => {
    if (draggingId !== id || !dragStartPos.current || !canvasContainerRef.current) return;

    const rect = canvasContainerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;

    const deltaXPercent = (deltaX / rect.width) * 100;
    const deltaYPercent = (deltaY / rect.height) * 100;

    const newX = Math.max(5, Math.min(95, dragStartPos.current.initialXPercent + deltaXPercent));
    const newY = Math.max(5, Math.min(95, dragStartPos.current.initialYPercent + deltaYPercent));

    setPlacedStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, xPercent: newX, yPercent: newY } : s))
    );
  };

  const handlePointerUp = (id: string, e: React.PointerEvent) => {
    if (draggingId === id) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
      setDraggingId(null);
      dragStartPos.current = null;
    }
  };

  // Draw Composite Strip on HTML5 Canvas
  useEffect(() => {
    const canvas = stripCanvasRef.current;
    if (!canvas || shots.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const metrics = calcStripMetrics(shots.length, 640, 480, layout);
    canvas.width = metrics.width;
    canvas.height = metrics.height;

    const theme = FRAME_STYLES[frameTheme];

    // Background fill
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, metrics.width, metrics.height);

    // If custom Canva frame is active and loaded, draw it as background texture
    const renderCanvasContent = (customImg?: HTMLImageElement) => {
      if (customImg) {
        ctx.drawImage(customImg, 0, 0, metrics.width, metrics.height);
      }

      // Draw Top Brand Tag
      ctx.fillStyle = theme.sub;
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("★ LOVEFUN PHOTO STUDIO ★", metrics.width / 2, 22);

      let loadedCount = 0;
      const images: HTMLImageElement[] = [];

      shots.forEach((src) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          if (loadedCount === shots.length) {
            // Render each photo slot according to columns and rows
            shots.forEach((_, photoIdx) => {
              const photoImg = images[photoIdx];
              const col = photoIdx % metrics.columns;
              const row = Math.floor(photoIdx / metrics.columns);

              const x = metrics.pad + col * (metrics.photoW + metrics.pad);
              const y = metrics.pad + row * (metrics.photoH + metrics.pad);

              ctx.save();
              // Rounded corners for photo
              const radius = 16;
              ctx.beginPath();
              ctx.moveTo(x + radius, y);
              ctx.lineTo(x + metrics.photoW - radius, y);
              ctx.quadraticCurveTo(x + metrics.photoW, y, x + metrics.photoW, y + radius);
              ctx.lineTo(x + metrics.photoW, y + metrics.photoH - radius);
              ctx.quadraticCurveTo(x + metrics.photoW, y + metrics.photoH, x + metrics.photoW - radius, y + metrics.photoH);
              ctx.lineTo(x + radius, y + metrics.photoH);
              ctx.quadraticCurveTo(x, y + metrics.photoH, x, y + metrics.photoH - radius);
              ctx.lineTo(x, y + radius);
              ctx.quadraticCurveTo(x, y, x + radius, y);
              ctx.closePath();
              ctx.clip();

              ctx.drawImage(photoImg, x, y, metrics.photoW, metrics.photoH);
              ctx.restore();

              // Inner border stroke
              ctx.strokeStyle = theme.border;
              ctx.lineWidth = 3;
              ctx.stroke();
            });

            // Footer Watermark Text
            const fontMap: Record<FontTheme, string> = {
              sans: "sans-serif",
              serif: "serif",
              mono: "monospace",
              cursive: "cursive",
            };
            const chosenFont = fontMap[fontTheme];

            const footerCenterY = metrics.height - metrics.footerH / 2;
            ctx.fillStyle = theme.text;
            ctx.font = `bold 26px ${chosenFont}`;
            ctx.textAlign = "center";
            ctx.fillText(
              (title || "LOVE IS FUN").slice(0, 28),
              metrics.width / 2,
              footerCenterY - (showDate ? 8 : -2)
            );

            if (subtitle || showDate) {
              ctx.fillStyle = theme.sub;
              ctx.font = `bold 13px ${chosenFont}`;
              const todayStr = new Date().toISOString().slice(0, 10);
              const subText = [subtitle, showDate ? todayStr : null].filter(Boolean).join(" · ");
              ctx.fillText(subText, metrics.width / 2, footerCenterY + 18);
            }

            // Draw Stickers
            if (!draggingId) {
              placedStickers.forEach((sticker) => {
                const sx = (sticker.xPercent / 100) * metrics.width;
                const sy = (sticker.yPercent / 100) * metrics.height;
                ctx.font = `${sticker.size}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(sticker.emoji, sx, sy);
              });
            }
          }
        };
        img.src = src;
        images.push(img);
      });
    };

    if (customFrameUrl && frameTheme === "custom") {
      const cImg = new Image();
      cImg.onload = () => renderCanvasContent(cImg);
      cImg.src = customFrameUrl;
    } else {
      renderCanvasContent();
    }
  }, [shots, layout, frameTheme, fontTheme, title, subtitle, showDate, placedStickers, draggingId, customFrameUrl]);

  // Export PNG Strip
  const downloadPng = () => {
    const canvas = stripCanvasRef.current;
    if (!canvas || shots.length === 0) return;

    // Draw stickers onto final canvas prior to export
    const ctx = canvas.getContext("2d");
    if (ctx) {
      placedStickers.forEach((sticker) => {
        const sx = (sticker.xPercent / 100) * canvas.width;
        const sy = (sticker.yPercent / 100) * canvas.height;
        ctx.font = `${sticker.size}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(sticker.emoji, sx, sy);
      });
    }

    const link = document.createElement("a");
    link.download = `lovefun-strip-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Export Animated GIF using gifenc (when Live Photo toggle is active)
  const downloadGif = async () => {
    if (shots.length === 0 || isGeneratingGif || !livePhotoEnabled) return;
    setIsGeneratingGif(true);
    setGifProgress(10);

    try {
      const gifWidth = 480;
      const gifHeight = 360;
      const gif = GIFEncoder();

      const loadedImgs = await Promise.all(
        shots.map((src) => {
          return new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = src;
          });
        })
      );

      const frameCanvas = document.createElement("canvas");
      frameCanvas.width = gifWidth;
      frameCanvas.height = gifHeight;
      const frameCtx = frameCanvas.getContext("2d", { willReadFrequently: true });
      if (!frameCtx) throw new Error("Canvas context 2D not supported");

      for (let i = 0; i < loadedImgs.length; i++) {
        setGifProgress(Math.round(20 + ((i + 1) / loadedImgs.length) * 60));
        const img = loadedImgs[i];
        frameCtx.clearRect(0, 0, gifWidth, gifHeight);
        frameCtx.drawImage(img, 0, 0, gifWidth, gifHeight);

        // Watermark on GIF frame
        frameCtx.fillStyle = "rgba(0,0,0,0.55)";
        frameCtx.fillRect(10, gifHeight - 34, 180, 24);
        frameCtx.fillStyle = "#ffffff";
        frameCtx.font = "bold 12px sans-serif";
        frameCtx.fillText(`LOVEFUN · POSE ${i + 1}`, 16, gifHeight - 18);

        const imageData = frameCtx.getImageData(0, 0, gifWidth, gifHeight);
        const palette = quantize(imageData.data, 128);
        const index = applyPalette(imageData.data, palette);

        gif.writeFrame(index, gifWidth, gifHeight, { palette, delay: 600 });
      }

      gif.finish();
      setGifProgress(95);

      const buffer = gif.bytes();
      const blob = new Blob([new Uint8Array(buffer)], { type: "image/gif" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.download = `lovefun-live-${Date.now()}.gif`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("GIF export failed:", err);
    } finally {
      setIsGeneratingGif(false);
      setGifProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9FB] text-[#2B2D42] flex flex-col selection:bg-[#FB6F92] selection:text-white">
      {/* Top Floating Header */}
      <header className="sticky top-3 z-40 max-w-6xl w-full mx-auto px-4 py-2">
        <div className="rounded-full bg-white/85 backdrop-blur-md border border-[#FB6F92]/20 px-5 py-3 flex items-center justify-between shadow-xs">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#7D7F9A] hover:text-[#FB6F92] transition"
          >
            <ArrowLeft className="size-4" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSoundEnabled((s) => !s)}
              className="size-8 rounded-full bg-[#FFE5EC] border border-[#FB6F92]/20 text-[#FB6F92] flex items-center justify-center transition hover:scale-105 active:scale-95 cursor-pointer"
              title={soundEnabled ? "Nonaktifkan Efek Suara" : "Aktifkan Efek Suara"}
            >
              {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4 text-[#7D7F9A]" />}
            </button>
            <div className="flex items-center gap-1.5 text-xs font-mono font-extrabold text-[#2B2D42]">
              <Heart className="size-4 text-[#FB6F92] fill-[#FB6F92]" />
              <span>PHOTO STRIP STUDIO 2.0</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Studio Area */}
      <main className="max-w-6xl w-full mx-auto px-4 lg:px-6 py-4 lg:py-6 grid lg:grid-cols-12 gap-8 flex-1 items-start">
        {/* Left Side: Camera Viewfinder, Retake Slot Controls & Settings */}
        <section className="lg:col-span-7 space-y-6">
          {/* Camera Viewfinder Box */}
          <div className="rounded-[2.25rem] p-3 bg-white/90 border border-[#FB6F92]/20 shadow-xl shadow-[#FB6F92]/10 backdrop-blur-xs">
            <div className="relative aspect-[4/3] w-full rounded-[1.75rem] overflow-hidden bg-[#2B2D42] border border-[#2B2D42]/10 flex items-center justify-center">
              {streamError ? (
                <div className="p-8 text-center space-y-3 max-w-md">
                  <div className="size-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 mx-auto flex items-center justify-center">
                    <Camera className="size-6" />
                  </div>
                  <p className="text-red-500 font-semibold text-sm leading-relaxed">{streamError}</p>
                </div>
              ) : null}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  filter: FILTER_CSS[filter],
                  transform: mirrored ? "scaleX(-1)" : "none",
                }}
                className={`w-full h-full object-cover ${streamLoading || streamError ? "hidden" : "block"}`}
              />

              {streamLoading && !streamError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#2B2D42] text-white/70 text-xs space-y-2">
                  <div className="size-7 border-2 border-[#FB6F92] border-t-transparent rounded-full animate-spin" />
                  <p className="font-medium tracking-wide">Menghubungkan ke kamera...</p>
                </div>
              ) : null}

              {/* Countdown Overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center z-20 space-y-2">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">
                    {retakeIndex !== null ? `RETAKE POSE #${retakeIndex + 1}` : "GET READY!"}
                  </span>
                  <div className="size-24 rounded-full bg-[#FB6F92] text-white flex items-center justify-center text-5xl font-mono font-black shadow-2xl animate-pulse">
                    {countdown}
                  </div>
                </div>
              )}

              {/* Camera Flash Effect */}
              {flash && <div className="absolute inset-0 bg-white camera-flash z-30" />}

              {/* Mirror Toggle Button */}
              {!streamError && (
                <button
                  type="button"
                  onClick={() => setMirrored((m) => !m)}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white text-xs inline-flex items-center gap-1.5 transition border border-white/20 active:scale-95 cursor-pointer"
                  title="Putar Balik Kamera"
                >
                  <FlipHorizontal className="size-3.5" />
                  <span>Flip</span>
                </button>
              )}
            </div>
          </div>

          {/* INDIVIDUAL POSE RETAKE GRID (Live Foto Grid & Retake Buttons) */}
          {shots.length > 0 && !isCapturing && (
            <div className="rounded-3xl p-5 bg-white border border-[#FB6F92]/25 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#2B2D42] flex items-center gap-1.5">
                  <RotateCcw className="size-3.5 text-[#FB6F92]" />
                  <span>GRID LIVE FOTO & RETAKE PER POSE</span>
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Klik foto untuk retake pose tersebut
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {shots.map((shotUrl, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border-2 border-border/60 hover:border-[#FB6F92] transition-all aspect-4/3 bg-muted"
                  >
                    <img
                      src={shotUrl}
                      alt={`Pose ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1">
                      <Button
                        size="sm"
                        onClick={() => retakeSingleSlot(idx)}
                        className="text-[10px] py-1 px-2 h-auto rounded-lg font-bold bg-[#FB6F92] text-white shadow-xs"
                      >
                        Retake #{idx + 1}
                      </Button>
                    </div>
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-black/60 text-white font-mono text-[9px] font-bold">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Studio Controls Card */}
          <Card doubleBezel className="space-y-5">
            {/* 1. Grid Layout Selector (3x1, 4x1, 2x2, 2x3, 6x1) */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-[#2B2D42] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="size-3.5 text-[#FB6F92]" />
                <span>PILIHAN JUMLAH FOTO & GRID STRIP</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(
                  [
                    { id: "3x1", label: "3x1 (3 Pose)", desc: "Korean Strip" },
                    { id: "4x1", label: "4x1 (4 Pose)", desc: "Classic Strip" },
                    { id: "2x2", label: "2x2 (4 Grid)", desc: "Bento Square" },
                    { id: "2x3", label: "2x3 (6 Grid)", desc: "Full Poster" },
                    { id: "6x1", label: "6x1 (6 Pose)", desc: "Long Strip" },
                  ] as { id: GridLayout; label: string; desc: string }[]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isCapturing}
                    onClick={() => {
                      setLayout(item.id);
                      setShots([]);
                    }}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      layout === item.id
                        ? "bg-[#FB6F92] text-white border-[#FB6F92] shadow-sm font-bold"
                        : "bg-[#FFF9FB] text-[#2B2D42] border-[#2B2D42]/10 hover:border-[#FB6F92]/40"
                    }`}
                  >
                    <span className="block text-xs font-mono font-black">{item.label}</span>
                    <span className="block text-[9px] opacity-80">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Filter Presets (Expanded to 8 Filters) */}
            <div className="space-y-2 pt-3 border-t border-[#FB6F92]/15">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-[#2B2D42] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-[#FB6F92]" />
                  <span>FILTER & TONE PRESETS (8 PILIHAN)</span>
                </label>
                <Badge variant="primary" className="font-mono uppercase text-[10px] py-0.5">
                  {filter.replace("-", " ")}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    "beauty-glow",
                    "soft-peach",
                    "warm-sunset",
                    "pastel-dream",
                    "vintage-warm",
                    "bw-classic",
                    "cyber-pop",
                    "normal",
                  ] as FilterKind[]
                ).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold capitalize transition text-center truncate cursor-pointer ${
                      filter === f
                        ? "bg-[#FB6F92] text-white shadow-sm font-bold"
                        : "bg-[#FFF9FB] text-[#2B2D42] border border-[#2B2D42]/10 hover:border-[#FB6F92]/40"
                    }`}
                  >
                    {f.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Frame Themes & Custom Canva Uploader */}
            <div className="space-y-3 pt-3 border-t border-[#FB6F92]/15">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-[#2B2D42] uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="size-3.5 text-[#FB6F92]" />
                  <span>TEMA BINGKAI & CUSTOM CANVA FRAME</span>
                </label>
                {customFrameUrl && (
                  <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 border-emerald-300">
                    CANVA CUSTOM ACTIVE
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(
                  [
                    "blush-pink",
                    "cream-pearl",
                    "midnight-noir",
                    "lavender-haze",
                    "matcha-mint",
                  ] as FrameTheme[]
                ).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setFrameTheme(t);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between border cursor-pointer ${
                      frameTheme === t
                        ? "border-[#FB6F92] bg-[#FFE5EC] text-[#FB6F92] shadow-2xs"
                        : "border-border/60 bg-white text-[#7D7F9A] hover:bg-muted/30"
                    }`}
                  >
                    <span>{FRAME_STYLES[t].label}</span>
                    <span
                      className="size-3 rounded-full border border-black/10"
                      style={{ backgroundColor: FRAME_STYLES[t].bg }}
                    />
                  </button>
                ))}

                {/* Upload Custom Canva Frame Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between border border-dashed cursor-pointer ${
                    frameTheme === "custom"
                      ? "border-[#FB6F92] bg-[#FFE5EC] text-[#FB6F92] shadow-2xs"
                      : "border-[#FB6F92]/40 bg-pink-50/40 text-[#FB6F92] hover:bg-pink-50"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Upload className="size-3" />
                    <span>Upload Canva</span>
                  </span>
                  <span className="text-[10px] font-mono">PNG/SVG</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/svg+xml"
                  onChange={handleCustomFrameUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* 4. Live Photo Toggle & Watermark Customization */}
            <div className="space-y-4 pt-3 border-t border-[#FB6F92]/15">
              <div className="flex items-center justify-between bg-muted/20 p-3 rounded-2xl border border-border/40">
                <div className="space-y-0.5">
                  <span className="text-xs font-mono font-bold text-[#2B2D42] uppercase block">
                    Mode Live Photo (GIF Animasi)
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Aktifkan untuk membuat animasi gerak looping (.gif). Matikan jika hanya ingin foto still cepat.
                  </p>
                </div>
                <Checkbox
                  id="livePhotoToggle"
                  checked={livePhotoEnabled}
                  onCheckedChange={(checked) => setLivePhotoEnabled(checked)}
                />
              </div>

              {/* Watermark Texts & Font Selection */}
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#7D7F9A]">Judul Watermark</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="LOVE IS FUN"
                    maxLength={28}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#7D7F9A]">Sub-Judul / Tempat</label>
                  <Input
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="STUDIO MEMORIES"
                    maxLength={28}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#7D7F9A]">Pilihan Font</label>
                  <div className="grid grid-cols-4 gap-1">
                    {(["sans", "serif", "mono", "cursive"] as FontTheme[]).map((font) => (
                      <button
                        key={font}
                        type="button"
                        onClick={() => setFontTheme(font)}
                        className={`py-2 rounded-lg text-xs font-bold capitalize transition border cursor-pointer ${
                          fontTheme === font
                            ? "bg-[#FB6F92] text-white border-[#FB6F92]"
                            : "bg-white text-muted-foreground border-border/50"
                        }`}
                      >
                        {font.slice(0, 4)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="showDateToggle"
                  checked={showDate}
                  onCheckedChange={(checked) => setShowDate(checked)}
                  label="Tampilkan Tanggal Otomatis di Footer"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <Button
                size="lg"
                onClick={startSession}
                disabled={isCapturing || !!streamError || streamLoading || !cameraActive}
                className="flex-1 rounded-2xl shadow-lg shadow-[#FB6F92]/25 font-bold cursor-pointer"
              >
                <Camera className="size-5" />
                <span>
                  {isCapturing
                    ? `Sedang Mengambil Foto (${shots.length + 1}/${totalShots})...`
                    : `Mulai Sesi (${totalShots} Pose)`}
                </span>
              </Button>

              {shots.length > 0 && !isCapturing && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setShots([]);
                    setPlacedStickers([]);
                  }}
                  className="rounded-2xl cursor-pointer"
                >
                  <RefreshCw className="size-4 mr-1.5" />
                  <span>Ulangi Semua</span>
                </Button>
              )}
            </div>
          </Card>
        </section>

        {/* Right Side: Photo Strip Preview, Sticker Canvas & Downloads */}
        <section className="lg:col-span-5 flex flex-col items-center justify-start p-6 rounded-[2.25rem] bg-white/90 border border-[#FB6F92]/20 shadow-xl shadow-[#FB6F92]/10 space-y-4">
          <div className="w-full flex items-center justify-between pb-3 border-b border-[#FB6F92]/15">
            <div>
              <h2 className="font-display font-extrabold text-sm text-[#2B2D42]">Hasil Strip Studio</h2>
              <p className="font-mono text-[10px] text-[#7D7F9A]">
                {layout} LAYOUT · {livePhotoEnabled ? "PNG & GIF READY" : "PNG STILL ONLY"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={downloadPng}
                disabled={shots.length === 0 || isCapturing}
                className="rounded-xl shadow-xs font-mono font-bold cursor-pointer"
              >
                <Download className="size-3.5" />
                <span>PNG</span>
              </Button>

              {livePhotoEnabled && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={downloadGif}
                  disabled={shots.length === 0 || isCapturing || isGeneratingGif}
                  className="rounded-xl text-[#5A4E7A] bg-[#E8DFF5] hover:bg-[#DDD2ED] border border-[#5A4E7A]/20 font-mono font-bold cursor-pointer"
                >
                  <Film className="size-3.5" />
                  <span>{isGeneratingGif ? `${gifProgress}%` : "GIF"}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Stickers Palette */}
          {shots.length > 0 && (
            <div className="w-full p-3.5 rounded-2xl bg-[#FFF9FB] border border-[#FB6F92]/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-[#2B2D42] uppercase tracking-wider flex items-center gap-1.5">
                  <Smile className="size-3.5 text-[#FB6F92]" />
                  <span>PILIHAN STIKER BEBAS</span>
                </span>
                {placedStickers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPlacedStickers([])}
                    className="text-[10px] font-mono text-red-500 hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Trash2 className="size-3" />
                    <span>HAPUS SEMUA</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {STICKER_PRESETS.map((sticker) => (
                  <button
                    key={sticker.id}
                    type="button"
                    onClick={() => addSticker(sticker.emoji)}
                    className="size-8 rounded-xl bg-white hover:bg-[#FFE5EC] border border-[#FB6F92]/25 flex items-center justify-center text-lg transition active:scale-90 shadow-2xs cursor-pointer"
                    title={`Tambah ${sticker.label}`}
                  >
                    {sticker.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Canvas or Empty State Container */}
          {shots.length === 0 ? (
            <div className="flex-1 w-full min-h-[360px] rounded-2xl border-2 border-dashed border-[#FB6F92]/30 bg-[#FFF9FB] flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="size-14 rounded-full bg-[#FFE5EC] border border-[#FB6F92]/30 text-[#FB6F92] flex items-center justify-center shadow-xs">
                <Camera className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="font-display font-bold text-sm text-[#2B2D42]">Belum ada foto yang diambil</p>
                <p className="font-sans text-xs text-[#7D7F9A] max-w-xs leading-relaxed">
                  Pilih layout grid di sebelah kiri ({layout}), lalu klik tombol <strong>Mulai Sesi</strong>. Masing-masing foto dapat di-retake nanti!
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full">
              {/* Interactive Canvas Container with Drag Overlay */}
              <div
                ref={canvasContainerRef}
                className={`relative w-full select-none ${
                  layout === "2x2" || layout === "2x3" ? "max-w-[340px]" : "max-w-[250px]"
                }`}
              >
                <canvas
                  ref={stripCanvasRef}
                  className="w-full h-auto rounded-2xl shadow-xl border border-[#FB6F92]/25 transition duration-300 block"
                />

                {/* Draggable Sticker Interactive Anchors */}
                {placedStickers.map((sticker) => (
                  <div
                    key={sticker.id}
                    onPointerDown={(e) => handlePointerDown(sticker.id, e)}
                    onPointerMove={(e) => handlePointerMove(sticker.id, e)}
                    onPointerUp={(e) => handlePointerUp(sticker.id, e)}
                    onPointerCancel={(e) => handlePointerUp(sticker.id, e)}
                    style={{
                      left: `${sticker.xPercent}%`,
                      top: `${sticker.yPercent}%`,
                      transform: "translate(-50%, -50%)",
                      touchAction: "none",
                    }}
                    className={`absolute z-20 cursor-grab active:cursor-grabbing p-1 rounded-xl transition-transform ${
                      draggingId === sticker.id
                        ? "scale-125 ring-2 ring-[#FB6F92] bg-white/40 backdrop-blur-xs shadow-lg"
                        : "hover:scale-110 hover:bg-white/40 hover:ring-1 hover:ring-[#FB6F92]/40"
                    }`}
                    title="Drag untuk memindahkan posisi stiker"
                  >
                    <span className="text-3xl leading-none select-none pointer-events-none drop-shadow-sm">
                      {sticker.emoji}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSticker(sticker.id);
                      }}
                      className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs hover:bg-red-600 cursor-pointer"
                      title="Hapus stiker"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <p className="font-mono text-[10px] text-[#7D7F9A] mt-3 text-center">
                DRAG STIKER DI KANVAS · RETAKE FOTO DI SEBELAH KIRI
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
