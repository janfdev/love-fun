"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Camera, Film, RefreshCw, Heart } from "lucide-react";

interface FlashbackStripProps {
  className?: string;
}

const STRIP_PHOTOS = [
  {
    id: 1,
    time: "02:14 PM",
    filter: "Warm Kodak Gold",
    prompt: "Smile & Peace Pose",
    gradient: "from-[#FFDEE9] to-[#B5FFFC]",
  },
  {
    id: 2,
    time: "02:15 PM",
    filter: "Fuji Chrome 400",
    prompt: "Cheek Heart Pose",
    gradient: "from-[#FAD0C4] to-[#FFD1FF]",
  },
  {
    id: 3,
    time: "02:16 PM",
    filter: "Vintage Film 1998",
    prompt: "Looking at Each Other",
    gradient: "from-[#FF9A9E] to-[#FECFEF]",
  },
  {
    id: 4,
    time: "02:17 PM",
    filter: "Classic B&W Grain",
    prompt: "Final Laugh Moment",
    gradient: "from-[#A18CD1] to-[#FBC2EB]",
  },
];

export function FlashbackPhotoStrip({ className = "" }: FlashbackStripProps) {
  const [activeFilter, setActiveFilter] = useState<"film" | "warm" | "bw">("film");

  const filterStyle = {
    film: "contrast-105 saturate-110",
    warm: "sepia-[0.25] contrast-105 hue-rotate-[-10deg]",
    bw: "grayscale contrast-125 brightness-95",
  }[activeFilter];

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* Interactive Filter Pills (ByFlashback FilmStock Switcher) */}
      <div className="flex items-center gap-2 mb-4 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#FB6F92]/20 shadow-xs">
        <span className="text-[10px] font-mono text-[#7D7F9A] uppercase tracking-wider flex items-center gap-1">
          <Film className="size-3 text-[#FB6F92]" />
          Film Stock:
        </span>
        <button
          type="button"
          onClick={() => setActiveFilter("film")}
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono transition ${
            activeFilter === "film"
              ? "bg-[#FB6F92] text-white font-bold"
              : "text-[#7D7F9A] hover:text-[#2B2D42]"
          }`}
        >
          Color 400
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("warm")}
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono transition ${
            activeFilter === "warm"
              ? "bg-[#FB6F92] text-white font-bold"
              : "text-[#7D7F9A] hover:text-[#2B2D42]"
          }`}
        >
          Kodak Gold
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("bw")}
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono transition ${
            activeFilter === "bw"
              ? "bg-[#FB6F92] text-white font-bold"
              : "text-[#7D7F9A] hover:text-[#2B2D42]"
          }`}
        >
          Mono Grain
        </button>
      </div>

      {/* Floating 3D Washi-Tape Photo Strip */}
      <motion.div
        initial={{ rotate: -2, y: 10 }}
        whileHover={{ rotate: 0, y: -4, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative w-64 sm:w-72 bg-[#FCFAF7] p-3.5 pb-6 rounded-md shadow-2xl shadow-rose-950/15 border border-[#EADBCC] text-[#2B2D42] select-none"
      >
        {/* Semi-transparent Pastel Washi Tape at Top */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#FFE5EC]/85 backdrop-blur-xs border-y border-dashed border-[#FB6F92]/40 shadow-xs rotate-[-1deg] pointer-events-none z-10 flex items-center justify-center">
          <span className="text-[9px] font-mono text-[#FB6F92] uppercase tracking-widest opacity-80">
            LOVEFUN STUDIO
          </span>
        </div>

        {/* Film Header Date Stamp */}
        <div className="flex items-center justify-between px-1 pt-2 pb-2 text-[10px] font-mono text-[#8C827A] border-b border-[#EADBCC]/60 mb-2.5">
          <span className="flex items-center gap-1 font-bold">
            <Heart className="size-2.5 fill-[#FB6F92] text-[#FB6F92]" />
            MEMORIES
          </span>
          <span>NO. 2026-FLASHBACK</span>
        </div>

        {/* 4 Photo Frames with Analog Film Styling */}
        <div className="space-y-2.5">
          {STRIP_PHOTOS.map((photo, i) => (
            <div
              key={photo.id}
              className={`relative aspect-[4/3] rounded-sm overflow-hidden bg-gradient-to-tr ${photo.gradient} shadow-inner border border-black/5 transition duration-300 ${filterStyle}`}
            >
              {/* Retro Film Grain Noise Overlay (SVG simulation) */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(0,0,0,0.8) 15%, transparent 16%), radial-gradient(rgba(255,255,255,0.8) 15%, transparent 16%)",
                  backgroundSize: "4px 4px",
                  backgroundPosition: "0 0, 2px 2px",
                }}
              />

              {/* Photo Frame Mock Content */}
              <div className="absolute inset-0 flex flex-col justify-between p-2 text-white/90">
                <div className="flex justify-between items-center text-[9px] font-mono drop-shadow-xs">
                  <span className="bg-black/30 px-1 rounded">FRAME #{i + 1}</span>
                  <span className="bg-black/30 px-1 rounded">{photo.time}</span>
                </div>

                <div className="text-center drop-shadow-md">
                  <Camera className="size-4 mx-auto mb-0.5 opacity-90" />
                  <span className="text-[10px] font-sans font-medium tracking-tight block">
                    {photo.prompt}
                  </span>
                </div>

                {/* Film Edge Sprocket & Timestamp indicator */}
                <div className="flex justify-between items-center text-[8px] font-mono text-amber-200/90 drop-shadow-xs">
                  <span>EXP. 36</span>
                  <span>ISO 400</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Classic Photobooth Footer Barcode & Typography */}
        <div className="mt-4 pt-3 border-t-2 border-dashed border-[#EADBCC] flex items-end justify-between px-1">
          <div>
            <span className="font-display font-black text-sm text-[#2B2D42] tracking-tighter block leading-none">
              LOVEFUN <span className="text-[#FB6F92]">✕</span> FLASHBACK
            </span>
            <span className="font-mono text-[8px] text-[#A39990] uppercase tracking-wider">
              A little story, forever yours.
            </span>
          </div>

          {/* Aesthetic Barcode */}
          <div className="flex items-end gap-[1.5px] h-5 opacity-60">
            <div className="w-[1px] h-full bg-black" />
            <div className="w-[2px] h-full bg-black" />
            <div className="w-[1px] h-4 bg-black" />
            <div className="w-[3px] h-full bg-black" />
            <div className="w-[1px] h-3 bg-black" />
            <div className="w-[2px] h-full bg-black" />
            <div className="w-[1px] h-full bg-black" />
            <div className="w-[3px] h-full bg-black" />
            <div className="w-[1px] h-4 bg-black" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
