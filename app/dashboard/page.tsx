"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Palette,
  Shield,
  Trash2,
  Camera,
  Users,
  Gamepad2,
  RefreshCw,
  Clock,
  Sparkles,
  Layers,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface AdminKPIs {
  totalUsers: number;
  totalPhotos: number;
  totalRooms: number;
  activeRooms: number;
  avgChemistryScore: number;
}

interface GameRoomItem {
  id: string;
  room_code: string;
  host_name: string;
  partner_name?: string | null;
  game_type: string;
  status: string;
  expires_at: string;
  final_score?: number | null;
  created_at: string;
}

interface FrameItem {
  id: string;
  frame_code: string;
  frame_name: string;
  bg_color: string;
  border_color: string;
  text_color: string;
  is_active: boolean;
}

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name?: string; email?: string } | null>(null);

  // Active Tab: "overview" | "rooms" | "frames"
  const [activeTab, setActiveTab] = useState<"overview" | "rooms" | "frames">("overview");

  // Telemetry & Data States
  const [kpis, setKpis] = useState<AdminKPIs>({
    totalUsers: 0,
    totalPhotos: 0,
    totalRooms: 0,
    activeRooms: 0,
    avgChemistryScore: 88,
  });
  const [rooms, setRooms] = useState<GameRoomItem[]>([]);
  const [frames, setFrames] = useState<FrameItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // New Frame Form State
  const [newFrameName, setNewFrameName] = useState("");
  const [newBgColor, setNewBgColor] = useState("#FFE5EC");
  const [newBorderColor, setNewBorderColor] = useState("#FB6F92");
  const [newTextColor, setNewTextColor] = useState("#2B2D42");
  const [frameSubmitting, setFrameSubmitting] = useState(false);

  // 1. Fetch Metrics & Verify Super Admin Session (Zero Key Required for Super Admin)
  const loadAdminMetrics = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/metrics");
      if (res.status === 401 || res.status === 403) {
        setAuthorized(false);
        router.push("/login?error=SuperAdminRequired");
        return;
      }

      const resData = await res.json();
      if (resData.success && resData.data) {
        setAuthorized(true);
        setAdminUser(resData.data.adminUser);
        setKpis(resData.data.kpis);
        setRooms(resData.data.recentRooms || []);
        setFrames(resData.data.frameCatalog || []);
      }
    } catch {
      router.push("/login?error=SessionVerificationFailed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadAdminMetrics();
  }, [loadAdminMetrics]);

  // Handle Add New Frame
  const handleAddFrame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFrameName.trim()) return;

    setFrameSubmitting(true);
    try {
      const res = await fetch("/api/admin/frames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frame_name: newFrameName.trim(),
          bg_color: newBgColor,
          border_color: newBorderColor,
          text_color: newTextColor,
        }),
      });

      const data = await res.json();
      if (data.success && data.frame) {
        setFrames((prev) => [data.frame, ...prev.filter((f) => f.id !== data.frame.id)]);
        setNewFrameName("");
      }
    } catch (err) {
      console.error("Gagal menambahkan frame:", err);
    } finally {
      setFrameSubmitting(false);
    }
  };

  // Handle Delete Frame
  const handleDeleteFrame = async (id: string) => {
    if (!confirm("Hapus template frame ini dari katalog?")) return;
    try {
      const res = await fetch(`/api/admin/frames?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setFrames((prev) => prev.filter((f) => f.id !== id));
      }
    } catch (err) {
      console.error("Gagal menghapus frame:", err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9FB] flex flex-col items-center justify-center space-y-4">
        <div className="size-12 rounded-2xl bg-[#FFE5EC] border border-[#FB6F92]/30 flex items-center justify-center text-[#FB6F92] animate-bounce shadow-xs">
          <Shield className="size-6" />
        </div>
        <p className="font-mono text-xs font-semibold text-[#7D7F9A] uppercase tracking-wider">
          Memverifikasi wewenang Super Admin...
        </p>
      </div>
    );
  }

  // Not Authorized Gate
  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FFF9FB] text-[#2B2D42] flex flex-col justify-between selection:bg-[#FB6F92] selection:text-white">
      {/* Top Header Navigation (Full Desktop) */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[#FB6F92]/20 px-6 lg:px-12 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#7D7F9A] hover:text-[#2B2D42] transition"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Kembali ke Beranda</span>
          </Link>
          <span className="text-[#7D7F9A] hidden sm:inline">/</span>
          <div className="flex items-center gap-2.5">
            <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-display font-extrabold text-base text-[#2B2D42]">
              LoveFun Studio Control
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="primary" className="font-mono text-[11px] hidden md:inline-flex">
            SUPER ADMIN: {adminUser?.email || "fauzanrizqinoor@gmail.com"}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={loadAdminMetrics}
            disabled={refreshing}
            className="rounded-full text-xs font-semibold"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh Data</span>
          </Button>

          <Link href="/api/auth/logout">
            <Button variant="ghost" size="sm" className="rounded-full text-xs text-red-500 hover:text-red-600 hover:bg-red-50">
              <LogOut className="size-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Admin Dashboard Body (Full Desktop) */}
      <main className="w-full px-6 lg:px-12 py-8 flex-1 space-y-8">
        {/* Navigation Tabs (BagUI Pill Design) */}
        <div className="flex items-center justify-between border-b border-[#FB6F92]/20 pb-4 flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-white/80 p-1.5 rounded-2xl border border-[#FB6F92]/15 shadow-2xs">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all select-none ${
                activeTab === "overview"
                  ? "bg-[#FB6F92] text-white shadow-xs"
                  : "text-[#7D7F9A] hover:text-[#2B2D42]"
              }`}
            >
              Overview Telemetry
            </button>
            <button
              onClick={() => setActiveTab("rooms")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all select-none ${
                activeTab === "rooms"
                  ? "bg-[#FB6F92] text-white shadow-xs"
                  : "text-[#7D7F9A] hover:text-[#2B2D42]"
              }`}
            >
              Game Rooms ({rooms.length})
            </button>
            <button
              onClick={() => setActiveTab("frames")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all select-none ${
                activeTab === "frames"
                  ? "bg-[#FB6F92] text-white shadow-xs"
                  : "text-[#7D7F9A] hover:text-[#2B2D42]"
              }`}
            >
              Frame Catalog ({frames.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/booth" target="_blank">
              <Button size="sm" variant="outline" className="rounded-full text-xs gap-1.5">
                <Camera className="size-3.5 text-[#FB6F92]" />
                <span>Test Studio</span>
                <ExternalLink className="size-3 text-muted-foreground" />
              </Button>
            </Link>
            <Link href="/games/sync" target="_blank">
              <Button size="sm" variant="outline" className="rounded-full text-xs gap-1.5">
                <Gamepad2 className="size-3.5 text-[#735D96]" />
                <span>Test Sync Game</span>
                <ExternalLink className="size-3 text-muted-foreground" />
              </Button>
            </Link>
          </div>
        </div>

        {/* TAB 1: OVERVIEW TELEMETRY */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Metrics Grid (BagUI Cards) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {/* Card 1 */}
              <div className="rounded-3xl p-5 bg-white border border-[#FB6F92]/20 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#7D7F9A] uppercase tracking-wider">
                    Total Photos
                  </span>
                  <div className="size-8 rounded-xl bg-[#FFE5EC] flex items-center justify-center text-[#FB6F92]">
                    <Camera className="size-4" />
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-3xl font-black text-[#2B2D42]">
                    {kpis.totalPhotos.toLocaleString()}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Exports & prints generated
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="rounded-3xl p-5 bg-white border border-[#FB6F92]/20 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#7D7F9A] uppercase tracking-wider">
                    Active Rooms
                  </span>
                  <div className="size-8 rounded-xl bg-[#E8DFF5] flex items-center justify-center text-[#735D96]">
                    <Gamepad2 className="size-4" />
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-3xl font-black text-[#2B2D42]">
                    {kpis.activeRooms}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Live 5-hour TTL sessions
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="rounded-3xl p-5 bg-white border border-[#FB6F92]/20 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#7D7F9A] uppercase tracking-wider">
                    Avg Chemistry
                  </span>
                  <div className="size-8 rounded-xl bg-[#FFF0F4] flex items-center justify-center text-[#FB6F92]">
                    <Sparkles className="size-4" />
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-3xl font-black text-[#2B2D42]">
                    {kpis.avgChemistryScore}%
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Couple alignment index
                  </p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="rounded-3xl p-5 bg-white border border-[#FB6F92]/20 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#7D7F9A] uppercase tracking-wider">
                    Registered Users
                  </span>
                  <div className="size-8 rounded-xl bg-[#FFE5EC] flex items-center justify-center text-[#FB6F92]">
                    <Users className="size-4" />
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-3xl font-black text-[#2B2D42]">
                    {kpis.totalUsers}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Authenticated profiles
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Summary Split Panel */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: Active System Health */}
              <div className="rounded-[2rem] p-6 bg-white border border-[#2B2D42]/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="size-4 text-[#FB6F92]" />
                    <h4 className="font-display font-bold text-sm text-[#2B2D42]">
                      Platform Status & Security
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 bg-emerald-50">
                    OPERATIONAL
                  </Badge>
                </div>

                <div className="space-y-3 text-xs text-[#7D7F9A]">
                  <div className="flex justify-between py-1.5 border-b border-border/20">
                    <span>Super Admin RBAC Authority:</span>
                    <span className="font-mono font-bold text-foreground">Verified Session (Bypass Key)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/20">
                    <span>Primary Host Domain:</span>
                    <span className="font-mono text-foreground">fun.fizaa.me (Dahono Cloud)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/20">
                    <span>Database ORM:</span>
                    <span className="font-mono text-foreground">PostgreSQL · Prisma v6.4.1</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Ephemeral Session Storage:</span>
                    <span className="font-mono text-foreground">5-Hour TTL Auto-Expire</span>
                  </div>
                </div>
              </div>

              {/* Right: Quick Frame Stats */}
              <div className="rounded-[2rem] p-6 bg-white border border-[#2B2D42]/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="size-4 text-[#735D96]" />
                    <h4 className="font-display font-bold text-sm text-[#2B2D42]">
                      Katalog Frame Aktif
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {frames.length} Tema
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  {frames.slice(0, 6).map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs"
                      style={{
                        backgroundColor: f.bg_color,
                        borderColor: f.border_color,
                        color: f.text_color,
                      }}
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: f.border_color }}
                      />
                      <span>{f.frame_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE GAME ROOMS INSPECTOR */}
        {activeTab === "rooms" && (
          <div className="rounded-[2rem] p-6 bg-white border border-[#2B2D42]/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <h3 className="font-display font-bold text-lg text-[#2B2D42]">
                  Live Game Room Inspector
                </h3>
                <p className="text-xs text-muted-foreground">
                  Pantau ruangan kuis pasangan yang aktif maupun yang baru saja selesai.
                </p>
              </div>
              <Badge variant="primary" className="font-mono text-xs">
                {rooms.length} ROOMS LOADED
              </Badge>
            </div>

            {rooms.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <Clock className="size-8 text-muted-foreground/40 mx-auto" />
                <p>Belum ada room game yang dibuat hari ini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/40 text-[11px] font-mono text-muted-foreground uppercase">
                      <th className="py-3 px-3">Room Code</th>
                      <th className="py-3 px-3">Tipe Game</th>
                      <th className="py-3 px-3">Host & Pasangan</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Skor</th>
                      <th className="py-3 px-3">Kedaluwarsa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((r) => (
                      <tr key={r.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <td className="py-3 px-3 font-mono font-black text-sm text-[#FB6F92]">
                          {r.room_code}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-foreground">
                            {r.game_type === "WHOS_MOST_LIKELY"
                              ? "Who's Most Likely To"
                              : "Sync or Sink"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-medium text-foreground">{r.host_name}</span>
                          {r.partner_name && (
                            <span className="text-muted-foreground"> & {r.partner_name}</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              r.status === "PLAYING"
                                ? "bg-amber-100 text-amber-700"
                                : r.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold">
                          {r.final_score !== null && r.final_score !== undefined
                            ? `${r.final_score}%`
                            : "-"}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground font-mono">
                          {new Date(r.expires_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FRAME CATALOG MANAGEMENT */}
        {activeTab === "frames" && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Form Tambah Frame Baru */}
            <div className="md:col-span-1 rounded-[2rem] p-6 bg-white border border-[#FB6F92]/20 shadow-sm space-y-4 h-fit">
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <Palette className="size-4 text-[#FB6F92]" />
                <h3 className="font-display font-bold text-sm text-[#2B2D42]">
                  Tambah Frame Baru
                </h3>
              </div>

              <form onSubmit={handleAddFrame} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#7D7F9A]">Nama Frame</label>
                  <Input
                    value={newFrameName}
                    onChange={(e) => setNewFrameName(e.target.value)}
                    placeholder="Contoh: Matcha Mint"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#7D7F9A]">Warna BG</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newBgColor}
                        onChange={(e) => setNewBgColor(e.target.value)}
                        className="size-8 rounded-lg border cursor-pointer"
                      />
                      <span className="font-mono text-xs">{newBgColor}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#7D7F9A]">Warna Border</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newBorderColor}
                        onChange={(e) => setNewBorderColor(e.target.value)}
                        className="size-8 rounded-lg border cursor-pointer"
                      />
                      <span className="font-mono text-xs">{newBorderColor}</span>
                    </div>
                  </div>
                </div>

                {/* Live Preview Sample */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">
                    Live Sample Preview
                  </span>
                  <div
                    className="p-3 rounded-xl border text-center text-xs font-bold"
                    style={{
                      backgroundColor: newBgColor,
                      borderColor: newBorderColor,
                      color: newTextColor,
                    }}
                  >
                    {newFrameName || "Preview Template"}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={frameSubmitting || !newFrameName.trim()}
                  className="w-full rounded-xl font-bold mt-2"
                >
                  <Plus className="size-4" />
                  <span>Simpan ke Database</span>
                </Button>
              </form>
            </div>

            {/* List Frame yang Terdaftar */}
            <div className="md:col-span-2 rounded-[2rem] p-6 bg-white border border-[#2B2D42]/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="font-display font-bold text-sm text-[#2B2D42]">
                  Daftar Template Bingkai Terdaftar
                </h3>
                <span className="text-xs font-mono text-muted-foreground">
                  {frames.length} Frame
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {frames.map((f) => (
                  <div
                    key={f.id}
                    className="p-4 rounded-2xl border shadow-xs flex items-center justify-between transition hover:shadow-md"
                    style={{
                      backgroundColor: f.bg_color,
                      borderColor: f.border_color,
                      color: f.text_color,
                    }}
                  >
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm">{f.frame_name}</h4>
                      <p className="font-mono text-[10px] opacity-80">
                        BG: {f.bg_color} · BD: {f.border_color}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteFrame(f.id)}
                      className="size-8 rounded-lg bg-white/80 hover:bg-white text-red-500 flex items-center justify-center transition shadow-2xs"
                      title="Hapus Frame"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Strip (Full Desktop) */}
      <footer className="w-full px-6 lg:px-12 py-5 border-t border-[#FB6F92]/15 flex items-center justify-between text-xs font-mono text-[#7D7F9A]">
        <span>LoveFun Control Room // Super Admin Verified</span>
        <span>fauzanrizqinoor@gmail.com</span>
      </footer>
    </div>
  );
}
