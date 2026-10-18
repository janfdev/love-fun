"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Gamepad2,
  Heart,
  Users,
  Copy,
  Check,
  Sparkles,
  Share2,
  Trophy,
  Camera,
  RefreshCw,
  Radio,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const SYNC_QUESTIONS = [
  { id: 1, text: "Liburan Impian Berdua", optA: "Pantai Tropis & Sunset", optB: "Gunung Sejuk & Glamping" },
  { id: 2, text: "Aktivitas Kencan Favorit", optA: "Nonton Bioskop & Cafe", optB: "Masak Bareng di Rumah" },
  { id: 3, text: "Menu Makanan Saat Bingung", optA: "Mie Instan / Ramen", optB: "Nasi Goreng / Fast Food" },
  { id: 4, text: "Tipe Playlist Musik di Perjalanan", optA: "Lagu Akustik Santai", optB: "Lagu Pop Semangat" },
  { id: 5, text: "Genre Tontonan Kencan", optA: "Romance & Komedi", optB: "Thriller & Horror Seru" },
  { id: 6, text: "Gaya Foto Kenangan", optA: "Pose Lucu & Konyol", optB: "Pose Estetik & Romantis" },
  { id: 7, text: "Waktu Ngobrol Paling Nyaman", optA: "Ngobrol Pagi Hari", optB: "Deep Talk Larut Malam" },
  { id: 8, text: "Keputusan Belanja Barang", optA: "Beli Sekarang Biar Puas", optB: "Masuk Keranjang & Pikir Dulu" },
  { id: 9, text: "Ketika Pasangan Bad Mood", optA: "Beri Pelukan & Camilan", optB: "Ajak Keluar Jalan-Jalan" },
  { id: 10, text: "Kado Paling Berkesan", optA: "Barang yang Lama Diinginkan", optB: "Surat & Kenangan Buatan Sendiri" },
];

export default function SyncGamePage() {
  const [gameState, setGameState] = useState<"lobby" | "playing" | "reveal" | "summary">("lobby");
  const [tab, setTab] = useState<"create" | "join">("create");

  // User input states
  const [hostName, setHostName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [myRole, setMyRole] = useState<"HOST" | "PARTNER">("HOST");

  // Room state
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Gameplay states
  const [currentRound, setCurrentRound] = useState(0);
  const [myChoice, setMyChoice] = useState<"A" | "B" | null>(null);
  const [isMatch, setIsMatch] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  // Auto-detect code from URL parameter
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
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostName: hostName.trim(), gameType: "SYNC_OR_SINK" }),
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
      const res = await fetch("/api/rooms/join", {
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
  const handlePickChoice = async (choice: "A" | "B") => {
    setMyChoice(choice);

    try {
      const res = await fetch("/api/rooms/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: roomCode || "SYNC",
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
    if (currentRound + 1 >= SYNC_QUESTIONS.length) {
      setGameState("summary");
    } else {
      setCurrentRound((prev) => prev + 1);
      setMyChoice(null);
      setIsMatch(null);
      setGameState("playing");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9FB] text-[#2B2D42] flex flex-col justify-between selection:bg-[#735D96] selection:text-white">
      {/* Top Floating Header */}
      <header className="sticky top-3 z-40 max-w-5xl w-full mx-auto px-4 py-2">
        <div className="rounded-full bg-white/85 backdrop-blur-md border border-[#5A4E7A]/20 px-5 py-3 flex items-center justify-between shadow-xs">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#7D7F9A] hover:text-[#5A4E7A] transition"
          >
            <ArrowLeft className="size-4" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="flex items-center gap-1.5 text-xs font-mono font-extrabold text-[#2B2D42]">
            <Heart className="size-4 text-[#FB6F92] fill-[#FB6F92]" />
            <span>SYNC OR SINK</span>
          </div>
        </div>
      </header>

      {/* Main Game Shell Container */}
      <main className="max-w-xl w-full mx-auto px-4 py-8 flex-1 flex flex-col justify-center space-y-6">
        {/* LOBBY STATE */}
        {gameState === "lobby" && (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <Badge variant="lavender" className="rounded-full font-mono text-[11px] uppercase tracking-wider">
                COUPLE CHEMISTRY CHALLENGE
              </Badge>
              <h1 className="font-display text-3xl sm:text-4xl font-black text-[#2B2D42] tracking-tight">
                Sync or Sink
              </h1>
              <p className="font-sans text-xs sm:text-sm text-[#7D7F9A] leading-relaxed">
                Uji seberapa sehati pikiran kalian berdua lewat kuis sinkronisasi pilihan cepat dan pertanyaan reflektif.
              </p>
            </div>

            <div className="rounded-[2.25rem] p-3 bg-white/90 border border-[#5A4E7A]/25 shadow-xl shadow-[#5A4E7A]/10">
              <div className="rounded-[1.75rem] p-6 bg-[#F5F0FB] border border-[#5A4E7A]/20 space-y-5 text-left">
                {!roomCode ? (
                  <>
                    {/* Tab Selection */}
                    <div className="flex rounded-2xl bg-white p-1 border border-[#5A4E7A]/15">
                      <button
                        type="button"
                        onClick={() => setTab("create")}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition select-none cursor-pointer ${
                          tab === "create"
                            ? "bg-[#735D96] text-white shadow-xs"
                            : "text-[#7D7F9A] hover:text-[#2B2D42]"
                        }`}
                      >
                        Buat Ruangan Baru
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab("join")}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition select-none cursor-pointer ${
                          tab === "join"
                            ? "bg-[#735D96] text-white shadow-xs"
                            : "text-[#7D7F9A] hover:text-[#2B2D42]"
                        }`}
                      >
                        Gabung dengan Kode
                      </button>
                    </div>

                    {tab === "create" ? (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-mono font-bold text-[#2B2D42] uppercase tracking-wider">
                            Nama Panggilan Anda
                          </label>
                          <Input
                            type="text"
                            value={hostName}
                            onChange={(e) => setHostName(e.target.value)}
                            placeholder="Contoh: Fauzan"
                            className="bg-white border-[#5A4E7A]/20"
                          />
                        </div>

                        <Button
                          size="lg"
                          onClick={handleCreateRoom}
                          disabled={loading}
                          className="w-full rounded-2xl bg-[#735D96] hover:bg-[#624D82] text-white font-display font-bold shadow-md shadow-[#735D96]/20 cursor-pointer"
                        >
                          <Users className="size-4" />
                          <span>{loading ? "Menyiapkan Room..." : "Buat Room (Aktif 5 Jam)"}</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-mono font-bold text-[#2B2D42] uppercase tracking-wider">
                            Kode Ruangan (Room Code)
                          </label>
                          <Input
                            type="text"
                            value={roomCodeInput}
                            onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                            placeholder="Contoh: LOVE-A9B2"
                            className="font-mono font-bold text-center tracking-widest bg-white border-[#5A4E7A]/20 uppercase"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-mono font-bold text-[#2B2D42] uppercase tracking-wider">
                            Nama Panggilan Anda
                          </label>
                          <Input
                            type="text"
                            value={partnerName}
                            onChange={(e) => setPartnerName(e.target.value)}
                            placeholder="Contoh: Ayu"
                            className="bg-white border-[#5A4E7A]/20"
                          />
                        </div>

                        <Button
                          size="lg"
                          onClick={handleJoinRoom}
                          disabled={loading}
                          className="w-full rounded-2xl bg-[#735D96] hover:bg-[#624D82] text-white font-display font-bold shadow-md shadow-[#735D96]/20 cursor-pointer"
                        >
                          <Gamepad2 className="size-4" />
                          <span>{loading ? "Menghubungkan..." : "Gabung ke Room Pasangan"}</span>
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  /* Waiting Room with Live Polling */
                  <div className="space-y-5 text-center">
                    <div className="size-12 rounded-2xl bg-[#E8DFF5] border border-[#735D96]/30 flex items-center justify-center text-[#735D96] mx-auto shadow-xs">
                      <Sparkles className="size-6" />
                    </div>

                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#7D7F9A] uppercase tracking-wider block">
                        BAGIKAN KODE INI KE PASANGAN ANDA (TTL 5 JAM)
                      </span>
                      <div className="mt-2 py-3 px-6 rounded-2xl bg-white border-2 border-dashed border-[#735D96] font-mono text-3xl font-black text-[#735D96] tracking-widest flex items-center justify-center gap-3">
                        <span>{roomCode}</span>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="size-8 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#735D96] flex items-center justify-center transition cursor-pointer"
                          title="Salin Kode"
                        >
                          {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-[#7D7F9A]">
                        <Radio className="size-3.5 text-[#735D96] animate-pulse" />
                        <span>Menunggu pasangan memasukkan kode... (otomatis terhubung)</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={() => setGameState("playing")}
                      size="lg"
                      className="w-full rounded-2xl font-display font-bold text-sm bg-[#735D96] hover:bg-[#624D82] text-white shadow-md cursor-pointer"
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
              <span className="font-bold text-[#735D96]">SKOR: {score}%</span>
            </div>

            {/* Question Card */}
            <div className="rounded-[2.25rem] p-6 bg-white border border-[#5A4E7A]/25 shadow-xl space-y-6">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#735D96]">
                PERTANYAAN #{currentRound + 1}
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-black text-[#2B2D42] leading-snug">
                {SYNC_QUESTIONS[currentRound].text}
              </h2>

              <p className="text-xs text-[#7D7F9A]">
                {myChoice
                  ? "Pilihan Anda tersimpan! Menunggu jawaban pasangan..."
                  : "Pilih opsi yang paling mencerminkan preferensi kalian berdua!"}
              </p>

              {/* Two Option Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  disabled={myChoice !== null}
                  onClick={() => handlePickChoice("A")}
                  className={`p-6 rounded-2xl border-2 font-display font-bold text-base transition-all active:scale-95 shadow-sm text-center cursor-pointer ${
                    myChoice === "A"
                      ? "border-[#735D96] bg-[#735D96] text-white"
                      : "border-[#5A4E7A]/20 bg-[#F5F0FB] hover:bg-[#E8DFF5] text-[#2B2D42]"
                  }`}
                >
                  <span className="block text-xs font-mono font-bold opacity-70 mb-1">PILIHAN A</span>
                  <span>{SYNC_QUESTIONS[currentRound].optA}</span>
                </button>

                <button
                  type="button"
                  disabled={myChoice !== null}
                  onClick={() => handlePickChoice("B")}
                  className={`p-6 rounded-2xl border-2 font-display font-bold text-base transition-all active:scale-95 shadow-sm text-center cursor-pointer ${
                    myChoice === "B"
                      ? "border-[#FB6F92] bg-[#FB6F92] text-white"
                      : "border-[#FB6F92]/20 bg-[#FFF0F4] hover:bg-[#FFE5EC] text-[#2B2D42]"
                  }`}
                >
                  <span className="block text-xs font-mono font-bold opacity-70 mb-1">PILIHAN B</span>
                  <span>{SYNC_QUESTIONS[currentRound].optB}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REVEAL STATE */}
        {gameState === "reveal" && (
          <div className="space-y-6 text-center">
            <div className="rounded-[2.25rem] p-8 bg-white border border-[#5A4E7A]/25 shadow-xl space-y-6">
              <div
                className={`size-16 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-sm ${
                  isMatch ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                }`}
              >
                {isMatch ? "🎉" : "😅"}
              </div>

              <div className="space-y-1">
                <h3 className="font-display text-2xl font-black text-[#2B2D42]">
                  {isMatch ? "Pilihan Kalian Sama Persis!" : "Beda Selera, Tapi Seru!"}
                </h3>
                <p className="text-xs text-[#7D7F9A]">
                  {isMatch
                    ? "Kalian berdua memilih opsi yang sama! +10 Chemistry Poin"
                    : "Pilihan kalian berbeda di babak ini. Waktunya saling mendengar alasan!"}
                </p>
              </div>

              <Button
                type="button"
                onClick={handleNextRound}
                size="lg"
                className="w-full rounded-2xl font-display font-bold text-sm bg-[#735D96] hover:bg-[#624D82] text-white shadow-md cursor-pointer"
              >
                {currentRound + 1 >= SYNC_QUESTIONS.length ? "Lihat Skor Akhir" : "Lanjut Ronde Berikutnya"}
              </Button>
            </div>
          </div>
        )}

        {/* SUMMARY STATE */}
        {gameState === "summary" && (
          <div className="space-y-6 text-center">
            <div className="rounded-[2.25rem] p-8 bg-white border border-[#5A4E7A]/25 shadow-xl space-y-6">
              <div className="size-16 rounded-3xl bg-[#E8DFF5] border border-[#735D96]/30 flex items-center justify-center text-[#735D96] mx-auto shadow-sm">
                <Trophy className="size-8" />
              </div>

              <div className="space-y-2">
                <Badge variant="lavender" className="font-mono text-xs">
                  HASIL AKHIR KEKOMPAKAN
                </Badge>
                <h2 className="font-display text-4xl font-black text-[#735D96]">
                  {score}% Sehati
                </h2>
                <p className="text-xs sm:text-sm text-[#7D7F9A] max-w-sm mx-auto">
                  {score >= 80
                    ? "Kalian memiliki frekuensi dan selera yang luar biasa selaras!"
                    : score >= 50
                    ? "Perpaduan yang harmonis, saling melengkapi satu sama lain dengan seru."
                    : "Beda selera itu indah! Banyak hal baru yang bisa saling kalian eksplorasi bersama."}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Link href="/booth?badge=sync">
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
      <footer className="max-w-5xl w-full mx-auto px-4 py-6 text-center text-xs font-mono text-[#7D7F9A]">
        LoveFun Studio · Uji Kekompakan & Bounding Pasangan
      </footer>
    </div>
  );
}
