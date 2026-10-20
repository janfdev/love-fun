import Link from "next/link";
import {
  Camera,
  Sparkles,
  Heart,
  ArrowRight,
  Gamepad2,
  Flame,
  Users,
  Lock,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { UserNav } from "@/components/user-nav";
import { FlashbackPhotoStrip } from "@/components/flashback-photo-strip";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FFF9FB] text-[#2B2D42] flex flex-col justify-between selection:bg-[#FB6F92] selection:text-white">
      {/* Top Floating Island Header */}
      <header className="sticky top-4 z-40 max-w-4xl w-full mx-auto px-4 sm:px-6">
        <div className="rounded-full bg-white/85 backdrop-blur-md border border-[#FB6F92]/20 px-6 py-3.5 flex items-center justify-between shadow-sm shadow-[#FB6F92]/5">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-[#FFE5EC] border border-[#FB6F92]/30 flex items-center justify-center text-[#FB6F92]">
              <Heart className="size-5 fill-[#FB6F92]" />
            </div>
            <div>
              <span className="font-display font-black tracking-tight text-lg text-[#2B2D42]">
                LoveFun
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-mono text-[#7D7F9A]">
                LOVE IS FUN // V2.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <UserNav />
            <Link href="/booth">
              <Button size="sm" className="rounded-full shadow-sm font-display font-bold">
                <span>Studio Foto</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 pt-8 pb-16 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-4">
          <Badge variant="primary" className="rounded-full py-1.5 px-4 text-xs font-semibold">
            <Sparkles className="size-3.5 text-[#FB6F92]" />
            <span className="font-mono tracking-wider text-[11px] uppercase">
              LOVE IS FUN · DIGITAL ACTIVITY FOR COUPLES
            </span>
          </Badge>

          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight leading-[1.08] text-[#2B2D42]">
            Ruang Bermain & Mengabadikan{" "}
            <span className="text-[#FB6F92]">Momen Berdua.</span>
          </h1>

          <p className="font-sans text-[#7D7F9A] text-base sm:text-lg leading-relaxed">
            Studio foto strip estetik dan permainan interaktif yang dirancang khusus untuk mempererat kedekatan pasangan. Mainkan langsung secara real-time tanpa perlu unduh aplikasi.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 pt-1 text-xs text-[#7D7F9A] font-mono">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-[#FB6F92]" />
              <span>FREE ACCESS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-[#FB6F92]" />
              <span>ROOM CODE 5 HOURS TTL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-[#FB6F92]" />
              <span>100% PRIVATE & SAFE</span>
            </div>
          </div>
        </div>

        {/* 3 Dedicated Separated Portals */}
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Portal 1: Photobooth Studio with Live Flashback Strip Preview */}
          <div className="rounded-[2.25rem] p-3 bg-white/90 border border-[#FB6F92]/25 shadow-xl shadow-[#FB6F92]/10 backdrop-blur-md flex flex-col justify-between group hover:border-[#FB6F92]/50 transition duration-300">
            <div className="rounded-[1.75rem] p-6 bg-[#FFF0F4] border border-[#FB6F92]/20 space-y-6">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                {/* Left: Studio Information */}
                <div className="space-y-4 max-w-md">
                  <div className="flex items-center justify-between">
                    <div className="size-11 rounded-2xl bg-white border border-[#FB6F92]/30 flex items-center justify-center text-[#FB6F92] shadow-xs">
                      <Camera className="size-5" />
                    </div>
                    <Badge variant="primary" className="font-mono text-[10px] uppercase">
                      4X1 RETRO STRIP · Y2K GRAIN & TONE
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-display font-extrabold text-2xl text-[#2B2D42]">
                      Photo Strip Studio 2.0
                    </h3>
                    <p className="font-sans text-xs sm:text-sm text-[#7D7F9A] leading-relaxed">
                      Studio foto strip bergaya analog Korea & Flashback Y2K. Pilihan tata letak 3x1, 4x1, dan 2x2 dengan filter film simulasi Skia (*Kodak Gold*, *Fuji Chrome*, *Mono Grain*), frame custom Canva, serta stiker dekorasi bebas.
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#FB6F92]">
                      NO LOGIN REQUIRED
                    </span>
                    <Link href="/booth">
                      <Button size="md" className="rounded-full font-display font-bold shadow-md shadow-[#FB6F92]/20">
                        <span>Buka Studio Foto</span>
                        <ArrowRight className="size-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Right: Interactive ByFlashback Retro Strip Component */}
                <div className="w-full lg:w-auto flex justify-center py-2">
                  <FlashbackPhotoStrip />
                </div>
              </div>
            </div>
          </div>

          {/* 2 Separated Couple Games Portals Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Portal 2: Sync or Sink */}
            <div className="rounded-[2.25rem] p-3 bg-white/90 border border-[#5A4E7A]/25 shadow-xl shadow-[#5A4E7A]/10 backdrop-blur-md flex flex-col justify-between group hover:border-[#5A4E7A]/50 transition duration-300">
              <div className="rounded-[1.75rem] p-6 bg-[#F5F0FB] border border-[#5A4E7A]/20 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="size-11 rounded-2xl bg-white border border-[#5A4E7A]/30 flex items-center justify-center text-[#5A4E7A] shadow-xs">
                      <Gamepad2 className="size-5" />
                    </div>
                    <Badge variant="lavender" className="font-mono text-[10px] uppercase">
                      KUIS SELERA & PILIHAN
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-display font-extrabold text-2xl text-[#2B2D42]">
                      Sync or Sink
                    </h3>
                    <p className="font-sans text-xs sm:text-sm text-[#7D7F9A] leading-relaxed">
                      Kuis sinkronisasi pilihan cepat untuk menguji apakah selera kencan, liburan, dan makanan kalian berdua selaras. Terhubung langsung antar 2 ponsel dengan Room Code 5 jam.
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-[#5A4E7A]/15">
                  <span className="font-mono text-xs font-bold text-[#5A4E7A]">
                    2 DEVICES CONNECTED
                  </span>
                  <Link href="/games/sync">
                    <Button
                      size="md"
                      className="rounded-full font-display font-bold bg-[#735D96] hover:bg-[#624D82] text-white shadow-md shadow-[#735D96]/20"
                    >
                      <span>Mainkan Sync</span>
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Portal 3: Who's Most Likely To */}
            <div className="rounded-[2.25rem] p-3 bg-white/90 border border-[#E11D48]/25 shadow-xl shadow-[#E11D48]/10 backdrop-blur-md flex flex-col justify-between group hover:border-[#E11D48]/50 transition duration-300">
              <div className="rounded-[1.75rem] p-6 bg-[#FFF1F2] border border-[#E11D48]/20 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="size-11 rounded-2xl bg-white border border-[#E11D48]/30 flex items-center justify-center text-[#E11D48] shadow-xs">
                      <Flame className="size-5" />
                    </div>
                    <Badge variant="primary" className="font-mono text-[10px] uppercase">
                      KUIS TUNJUK PASANGAN
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-display font-extrabold text-2xl text-[#2B2D42]">
                      Who&apos;s Most Likely To?
                    </h3>
                    <p className="font-sans text-xs sm:text-sm text-[#7D7F9A] leading-relaxed">
                      Tebak siapa di antara kalian berdua yang paling mencerminkan 10 kebiasaan unik. Pilih antara &ldquo;Aku&rdquo; atau &ldquo;Dia&rdquo; secara rahasia dan lihat hasilnya serentak di kedua layar!
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-[#E11D48]/15">
                  <span className="font-mono text-xs font-bold text-[#E11D48]">
                    COUPLE TRIVIA
                  </span>
                  <Link href="/games/likely">
                    <Button
                      size="md"
                      className="rounded-full font-display font-bold bg-[#FB6F92] hover:bg-[#e0567a] text-white shadow-md shadow-[#FB6F92]/20"
                    >
                      <span>Mainkan Tunjuk</span>
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto pt-4">
          <Card doubleBezel className="space-y-2">
            <div className="size-9 rounded-xl bg-[#FFE5EC] flex items-center justify-center text-[#FB6F92]">
              <Layers className="size-5" />
            </div>
            <h4 className="font-display font-bold text-sm text-[#2B2D42]">Katalog Frame Bervariasi</h4>
            <p className="font-sans text-xs text-[#7D7F9A] leading-relaxed">
              Pilihan layout strip 3 pose, 4 pose, dan grid estetik dengan tema warna yang terus bertambah dari dashboard.
            </p>
          </Card>

          <Card doubleBezel className="space-y-2">
            <div className="size-9 rounded-xl bg-[#E8DFF5] flex items-center justify-center text-[#5A4E7A]">
              <Users className="size-5" />
            </div>
            <h4 className="font-display font-bold text-sm text-[#2B2D42]">Room Code 5 Jam</h4>
            <p className="font-sans text-xs text-[#7D7F9A] leading-relaxed">
              Sesi game sinkronisasi aman dan otomatis kedaluwarsa setelah 5 jam untuk menjaga privasi berdua.
            </p>
          </Card>

          <Card doubleBezel className="space-y-2">
            <div className="size-9 rounded-xl bg-[#FFE5EC] flex items-center justify-center text-[#FB6F92]">
              <Sparkles className="size-5" />
            </div>
            <h4 className="font-display font-bold text-sm text-[#2B2D42]">Lencana & Riwayat Foto</h4>
            <p className="font-sans text-xs text-[#7D7F9A] leading-relaxed">
              Login untuk mengoleksi lencana hasil skor chemistry dan menyimpan cetakan foto kenangan ke profil Anda.
            </p>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 border-t border-[#FB6F92]/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#7D7F9A]">
        <div className="flex items-center gap-2">
          <Heart className="size-3.5 fill-[#FB6F92] text-[#FB6F92]" />
          <span className="font-sans">LoveFun · Love is Fun for Couples</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hover:text-[#FB6F92] font-semibold transition flex items-center gap-1">
            <Lock className="size-3" />
            <span>Dashboard</span>
          </Link>
          <span>//</span>
          <span>100% PRIVATE</span>
        </div>
      </footer>
    </div>
  );
}
