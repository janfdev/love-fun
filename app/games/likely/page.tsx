"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Users,
  Copy,
  Check,
  Sparkles,
  Share2,
  Trophy,
  Camera,
  RefreshCw,
  Flame,
  Radio,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const QUESTIONS = [
  { id: 1, text: "Siapa yang bangunnya paling siang kalau hari libur?" },
  { id: 2, text: "Siapa yang kalau ngambek paling susah dibujuk?" },
  { id: 3, text: "Siapa yang paling boros kalau lihat barang lucu atau diskon?" },
  { id: 4, text: "Siapa yang mandinya paling lama dan bikin nunggu?" },
  { id: 5, text: "Siapa yang paling sering bilang 'terserah' waktu ditanya mau makan apa?" },
  { id: 6, text: "Siapa yang naksir atau kirim chat duluan waktu awal kenal?" },
  { id: 7, text: "Siapa yang paling gampang terharu atau nangis nonton film?" },
  { id: 8, text: "Siapa yang paling sering lupa naruh barang (kunci, dompet, hp)?" },
  { id: 9, text: "Siapa yang paling jago masak atau pesan makanan paling enak?" },
  { id: 10, text: "Siapa yang paling gak bisa tidur kalau belum disapa selamat malam?" },
];

export default function WhosMostLikelyPage() {
  const [gameState, setGameState] = useState<"lobby" | "playing" | "reveal" | "summary">("lobby");
  const [tab, setTab] = useState<"create" | "join">("create");

  // User input states
  const [hostName, setHostName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [myRole, setMyRole] = useState<"HOST" | "PARTNER">("HOST");

  // Room data
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Gameplay states
  const [currentRound, setCurrentRound] = useState(0);
  const [myChoice, setMyChoice] = useState<"ME" | "PARTNER" | null>(null);
  const [partnerAnswered, setPartnerAnswered] = useState(false);
  const [isMatch, setIsMatch] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  // Auto-detect room code from URL query parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      if (code) {
        setRoomCodeInput(code.toUpperCase());
        setTab("join");
      }
    }
  }, []);

  // REAL-TIME POLLING: Auto-start when partner connects to the room
  useEffect(() => {
    if (!roomCode || gameState !== "lobby") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/status?code=${roomCode}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.success && data.room) {
          if (data.room.partnerName && (data.room.status === "PLAYING" || myRole === "HOST")) {
            setPartnerName(data.room.partnerName);
            toast.success(`${data.room.partnerName} telah bergabung! Permainan dimulai.`);
            setGameState("playing");
          }
        }
      } catch {
        // Safe polling catch
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [roomCode, gameState, myRole]);

  // REAL-TIME POLLING FOR ANSWERS (Wait for both to answer current round)
  useEffect(() => {
    if (!roomCode || gameState !== "playing" || !myChoice) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/status?code=${roomCode}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.success && data.room?.answers) {
          const roundData = data.room.answers[currentRound];
          if (roundData && roundData.completed) {
            setIsMatch(roundData.match ?? false);
            setScore(data.room.finalScore ?? score);
            setGameState("reveal");
          }
        }
      } catch {
        // Safe polling catch
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [roomCode, gameState, myChoice, currentRound, score]);

  // Handle Create Room
  const handleCreateRoom = async () => {
    if (!hostName.trim()) {
      toast.error("Silakan masukkan nama panggilan Anda.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/rooms/likely/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostName: hostName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat ruangan.");

      setRoomCode(data.room.roomCode);
      setMyRole("HOST");
      setGameState("lobby");
      toast.success("Ruangan berhasil dibuat! Bagikan kode ke pasangan.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Join Room
  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim() || !partnerName.trim()) {
      toast.error("Silakan lengkapi Kode Room dan nama Anda.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/rooms/likely/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: roomCodeInput.trim(),
          partnerName: partnerName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal bergabung ke ruangan.");

      setRoomCode(roomCodeInput.trim().toUpperCase());
      setMyRole("PARTNER");
      setHostName(data.session.hostName || "Pasangan");
      setGameState("playing");
      toast.success(`Berhasil terhubung dengan ${data.session.hostName}!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Copy code helper
  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    toast.success("Kode ruangan berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Submit Answer
  const handlePickChoice = async (choice: "ME" | "PARTNER") => {
    setMyChoice(choice);

    try {
      const res = await fetch("/api/rooms/likely/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: roomCode || "LIKELY",
          role: myRole,
          roundIndex: currentRound,
          choice,
        }),
      });

      const data = await res.json();
      if (data.isRoundComplete) {
        setIsMatch(data.isMatch);
        if (data.currentScore !== undefined) {
          setScore(data.currentScore);
        }
        setGameState("reveal");
      } else {
        toast("Pilihan tersimpan! Menunggu jawaban pasangan...", { icon: "⏳" });
      }
    } catch {
      setIsMatch(true);
      setGameState("reveal");
    }
  };

  // Next round
  const handleNextRound = () => {
    if (currentRound + 1 >= QUESTIONS.length) {
      setGameState("summary");
    } else {
      setCurrentRound((prev) => prev + 1);
      setMyChoice(null);
      setIsMatch(null);
      setGameState("playing");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9FB] text-[#2B2D42] flex flex-col justify-between selection:bg-[#FB6F92] selection:text-white">
      {/* Header */}
      <header className="sticky top-3 z-40 max-w-5xl w-full mx-auto px-4 py-2">
        <div className="rounded-full bg-white/85 backdrop-blur-md border border-[#FB6F92]/20 px-5 py-3 flex items-center justify-between shadow-xs">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#7D7F9A] hover:text-[#2B2D42] transition"
          >
            <ArrowLeft className="size-4" />
            <span>Kembali</span>
          </Link>

          <div className="flex items-center gap-2">
            <Flame className="size-4 text-[#FB6F92] fill-[#FB6F92]" />
            <span className="font-display font-extrabold text-xs text-[#2B2D42]">
              WHO&apos;S MOST LIKELY TO?
            </span>
          </div>
        </div>
      </header>

      {/* Main Game Shell */}
      <main className="max-w-xl w-full mx-auto px-4 py-8 flex-1 flex flex-col justify-center space-y-6">
        {/* LOBBY STATE */}
        {gameState === "lobby" && (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <Badge variant="primary" className="rounded-full font-mono text-[11px] uppercase tracking-wider">
                TUNJUK PASANGAN · COUPLE GAME
              </Badge>
              <h1 className="font-display text-3xl sm:text-4xl font-black text-[#2B2D42] tracking-tight">
                Who&apos;s Most Likely To?
              </h1>
              <p className="font-sans text-xs sm:text-sm text-[#7D7F9A] leading-relaxed">
                Tebak siapa di antara kalian berdua yang paling mencerminkan 10 pertanyaan seru!
              </p>
            </div>

            <div className="rounded-[2.25rem] p-3 bg-white/90 border border-[#FB6F92]/25 shadow-xl shadow-[#FB6F92]/10">
              <div className="rounded-[1.75rem] p-6 bg-[#FFF0F4] border border-[#FB6F92]/20 space-y-5 text-left">
                {!roomCode ? (
                  <>
                    {/* Tab Selection */}
                    <div className="flex rounded-2xl bg-white p-1 border border-[#FB6F92]/15">
                      <button
                        type="button"
                        onClick={() => setTab("create")}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition select-none cursor-pointer ${
                          tab === "create"
                            ? "bg-[#FB6F92] text-white shadow-xs"
                            : "text-[#7D7F9A] hover:text-[#2B2D42]"
                        }`}
                      >
                        Buka Ruang Baru (Host)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab("join")}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition select-none cursor-pointer ${
                          tab === "join"
                            ? "bg-[#FB6F92] text-white shadow-xs"
                            : "text-[#7D7F9A] hover:text-[#2B2D42]"
                        }`}
                      >
                        Gabung Kode Pasangan
                      </button>
                    </div>

                    {tab === "create" ? (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-mono font-bold text-[#2B2D42] uppercase tracking-wider">
                            Nama Panggilan Kamu
                          </label>
                          <Input
                            type="text"
                            value={hostName}
                            onChange={(e) => setHostName(e.target.value)}
                            placeholder="Misal: Fauzan"
                            className="bg-white font-medium"
                          />
                        </div>

                        <Button
                          type="button"
                          onClick={handleCreateRoom}
                          disabled={loading}
                          size="lg"
                          className="w-full rounded-2xl font-display font-bold text-sm bg-[#FB6F92] hover:bg-[#e0567a] text-white shadow-md cursor-pointer"
                        >
                          {loading ? "Membuat Ruangan..." : "Generate Kode Ruangan (TTL 5 Jam)"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-mono font-bold text-[#2B2D42] uppercase tracking-wider">
                            Kode Ruangan Pasangan
                          </label>
                          <Input
                            type="text"
                            value={roomCodeInput}
                            onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                            placeholder="Contoh: LIKELY"
                            maxLength={8}
                            className="bg-white font-mono uppercase tracking-widest text-center text-lg font-bold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-mono font-bold text-[#2B2D42] uppercase tracking-wider">
                            Nama Panggilan Kamu
                          </label>
                          <Input
                            type="text"
                            value={partnerName}
                            onChange={(e) => setPartnerName(e.target.value)}
                            placeholder="Misal: Fizaa"
                            className="bg-white font-medium"
                          />
                        </div>

                        <Button
                          type="button"
                          onClick={handleJoinRoom}
                          disabled={loading}
                          size="lg"
                          className="w-full rounded-2xl font-display font-bold text-sm bg-[#FB6F92] hover:bg-[#e0567a] text-white shadow-md cursor-pointer"
                        >
                          {loading ? "Menghubungkan..." : "Masuk ke Ruangan"}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  /* Waiting Lobby with Code & Live Polling Indicator */
                  <div className="space-y-5 text-center">
                    <div className="size-12 rounded-2xl bg-[#FFE5EC] border border-[#FB6F92]/30 flex items-center justify-center text-[#FB6F92] mx-auto shadow-xs">
                      <Sparkles className="size-6" />
                    </div>

                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#7D7F9A] uppercase tracking-wider block">
                        KODE RUANGAN ANDA (TTL 5 JAM)
                      </span>
                      <div className="mt-2 py-3 px-6 rounded-2xl bg-white border-2 border-dashed border-[#FB6F92] font-mono text-3xl font-black text-[#FB6F92] tracking-widest flex items-center justify-center gap-3">
                        <span>{roomCode}</span>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="size-8 rounded-lg bg-pink-50 hover:bg-pink-100 text-[#FB6F92] flex items-center justify-center transition cursor-pointer"
                          title="Salin Kode"
                        >
                          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-[#7D7F9A]">
                        <Radio className="size-3.5 text-[#FB6F92] animate-pulse" />
                        <span>Menunggu pasangan memasukkan kode... (otomatis terhubung)</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={() => setGameState("playing")}
                      size="lg"
                      className="w-full rounded-2xl font-display font-bold text-sm bg-[#FB6F92] hover:bg-[#e0567a] text-white shadow-md cursor-pointer"
                    >
                      Mulai Sekarang (Atau Tunggu Pasangan)
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PLAYING STATE */}
        {gameState === "playing" && (
          <div className="space-y-6 text-center">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-2">
              <span>RONDE {currentRound + 1} DARI 10</span>
              <span className="font-bold text-[#FB6F92]">SKOR: {score}%</span>
            </div>

            {/* Question Card */}
            <div className="rounded-[2.25rem] p-6 bg-white border border-[#FB6F92]/25 shadow-xl space-y-6">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#FB6F92]">
                PERTANYAAN #{currentRound + 1}
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-black text-[#2B2D42] leading-snug">
                &ldquo;{QUESTIONS[currentRound].text}&rdquo;
              </h2>

              <p className="text-xs text-[#7D7F9A]">
                {myChoice
                  ? "Pilihan Anda terkunci. Menunggu jawaban pasangan..."
                  : "Pilih secara jujur tanpa mengintip layar pasangan!"}
              </p>

              {/* Two Choice Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  disabled={myChoice !== null}
                  onClick={() => handlePickChoice("ME")}
                  className={`py-6 px-4 rounded-2xl border-2 font-display font-black text-xl transition-all active:scale-95 shadow-sm cursor-pointer ${
                    myChoice === "ME"
                      ? "border-[#FB6F92] bg-[#FB6F92] text-white"
                      : "border-[#FB6F92]/40 bg-[#FFE5EC] hover:bg-[#ffccd8] text-[#FB6F92]"
                  }`}
                >
                  AKU
                </button>
                <button
                  type="button"
                  disabled={myChoice !== null}
                  onClick={() => handlePickChoice("PARTNER")}
                  className={`py-6 px-4 rounded-2xl border-2 font-display font-black text-xl transition-all active:scale-95 shadow-sm cursor-pointer ${
                    myChoice === "PARTNER"
                      ? "border-[#735D96] bg-[#735D96] text-white"
                      : "border-[#735D96]/40 bg-[#E8DFF5] hover:bg-[#d8c8ee] text-[#735D96]"
                  }`}
                >
                  DIA
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REVEAL STATE */}
        {gameState === "reveal" && (
          <div className="space-y-6 text-center">
            <div className="rounded-[2.25rem] p-8 bg-white border border-[#FB6F92]/25 shadow-xl space-y-6">
              <div
                className={`size-16 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-sm ${
                  isMatch ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                }`}
              >
                {isMatch ? "🎉" : "😅"}
              </div>

              <div className="space-y-1">
                <h3 className="font-display text-2xl font-black text-[#2B2D42]">
                  {isMatch ? "Kalian Kompak Sehati!" : "Wah, Jawabannya Beda!"}
                </h3>
                <p className="text-xs text-[#7D7F9A]">
                  {isMatch
                    ? "Kalian berdua menunjuk orang yang sama! +10 Chemistry Poin"
                    : "Kalian berdua punya pandangan berbeda. Waktunya saling jelaskan!"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 text-xs">
                Pilihan kamu:{" "}
                <span className="font-bold text-[#FB6F92]">
                  {myChoice === "ME" ? "Aku Sendiri" : "Pasanganku"}
                </span>
              </div>

              <Button
                type="button"
                onClick={handleNextRound}
                size="lg"
                className="w-full rounded-2xl font-display font-bold text-sm bg-[#FB6F92] hover:bg-[#e0567a] text-white shadow-md cursor-pointer"
              >
                {currentRound + 1 >= QUESTIONS.length ? "Lihat Skor Akhir" : "Lanjut Ronde Berikutnya"}
              </Button>
            </div>
          </div>
        )}

        {/* SUMMARY STATE */}
        {gameState === "summary" && (
          <div className="space-y-6 text-center">
            <div className="rounded-[2.25rem] p-8 bg-white border border-[#FB6F92]/25 shadow-xl space-y-6">
              <div className="size-16 rounded-3xl bg-[#FFE5EC] border border-[#FB6F92]/30 flex items-center justify-center text-[#FB6F92] mx-auto shadow-sm">
                <Trophy className="size-8" />
              </div>

              <div className="space-y-2">
                <Badge variant="primary" className="font-mono text-xs">
                  HASIL AKHIR CHEMISTRY
                </Badge>
                <h2 className="font-display text-4xl font-black text-[#FB6F92]">
                  {score}% Kompak
                </h2>
                <p className="text-xs sm:text-sm text-[#7D7F9A] max-w-sm mx-auto">
                  {score >= 80
                    ? "Pasangan Sehati & Saling Mengerti! Kekompakan kalian sudah di level tertinggi."
                    : score >= 50
                    ? "Hubungan yang Seimbang! Banyak perbedaan seru yang bikin obrolan kalian gak pernah bosen."
                    : "Dua Kepribadian Unik! Kalian saling melengkapi dengan cara yang sangat menarik."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Link href="/booth?badge=likely">
                  <Button
                    size="lg"
                    className="w-full rounded-2xl font-display font-bold text-sm bg-[#FB6F92] hover:bg-[#e0567a] text-white shadow-md gap-2 cursor-pointer"
                  >
                    <Camera className="size-4" />
                    <span>Cetak Skor Ini ke Photo Strip Studio</span>
                  </Button>
                </Link>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setGameState("lobby");
                    setRoomCode(null);
                  }}
                  className="w-full rounded-2xl text-xs font-semibold cursor-pointer"
                >
                  <RefreshCw className="size-3.5 mr-2" />
                  <span>Main Lagi dari Awal</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-xl w-full mx-auto px-4 py-4 text-center text-xs font-mono text-[#7D7F9A]">
        LoveFun · Who&apos;s Most Likely To (Couple Challenge)
      </footer>
    </div>
  );
}
