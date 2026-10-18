"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  LayoutDashboard,
  ImagePlus,
  Palette,
  Gamepad2,
  Users,
  Settings2,
  PanelLeftClose,
  PanelLeft,
  ShieldCheck,
  Camera,
  RefreshCw,
  Plus,
  Trash2,
  Upload,
  Clock,
  Sparkles,
  Layers,
  LogOut,
  ExternalLink,
  TrendingUp,
  Activity,
  CheckCircle2,
  CreditCard,
  PieChart,
  Flame,
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

type MenuKey = "overview" | "strips" | "frames" | "games_sync" | "games_likely" | "users" | "settings";

// Helper generate smooth organic telemetry trend data for SaaS analytics
function generateTrendData(metric: "users" | "photos" | "games", days: number) {
  const points: { date: string; value: number; change: string }[] = [];
  const now = new Date();

  // Natural growth parameters: progressive upward trend with gentle organic waves
  const baselines = {
    users: { start: 18, end: 72, variance: 4 },
    photos: { start: 36, end: 168, variance: 8 },
    games: { start: 16, end: 88, variance: 5 },
  };

  const { start, end, variance } = baselines[metric];

  for (let i = days - 1; i >= 0; i--) {
    const progress = (days - 1 - i) / (days - 1 || 1);
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

    // Smooth monotonic trend with gentle organic waves
    const baseVal = start + (end - start) * Math.pow(progress, 1.15);
    const wave = Math.sin(progress * Math.PI * 3.5) * variance;
    const val = Math.max(5, Math.round(baseVal + wave));

    const prevVal = points.length > 0 ? points[points.length - 1].value : Math.max(1, Math.round(start * 0.95));
    const diff = val - prevVal;
    const pct = prevVal > 0 ? Math.round((diff / prevVal) * 100) : 0;
    const changeStr = pct >= 0 ? `+${pct}%` : `${pct}%`;

    points.push({ date: dateStr, value: val, change: changeStr });
  }

  return points;
}

// Convert discrete points to a smooth cubic Bézier curve for SVG
function getSmoothCurvePath(points: { x: number; y: number }[]): { pathD: string; areaD: string } {
  if (points.length < 2) return { pathD: "", areaD: "" };
  let pathD = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }

  const last = points[points.length - 1];
  const first = points[0];
  const areaD = `${pathD} L ${last.x.toFixed(2)},100 L ${first.x.toFixed(2)},100 Z`;

  return { pathD, areaD };
}

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name?: string; email?: string } | null>(null);

  // Collapsible Sidebar State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuKey>("overview");

  // SaaS Chart Interactive States
  const [chartMetric, setChartMetric] = useState<"users" | "photos" | "games">("users");
  const [chartDays, setChartDays] = useState<7 | 14 | 30>(14);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

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

  // Strip Template Studio State (Upload & Config)
  const [stripTitle, setStripTitle] = useState("LOVE IS FUN");
  const [stripSubtitle, setStripSubtitle] = useState("STUDIO MEMORIES");
  const [stripLayout, setStripLayout] = useState<"3-pose" | "4-pose" | "2x2-grid">("4-pose");
  const [uploadedStickers, setUploadedStickers] = useState<string[]>([
    "Sparkles",
    "Ribbon Heart",
    "Retro Stars",
    "Cherries",
  ]);
  const [newStickerName, setNewStickerName] = useState("");

  // 1. Fetch Metrics & Verify Super Admin Session
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

  // Generate dynamic chart data based on metric & timeframe
  const trendDataset = useMemo(() => {
    return generateTrendData(chartMetric, chartDays);
  }, [chartMetric, chartDays]);

  // Compute smooth curve SVG coordinates
  const chartCoordinates = useMemo(() => {
    if (!trendDataset.length) return { pathD: "", areaD: "", points: [], tickVals: [] };
    const values = trendDataset.map((d) => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const span = max - min || 1;
    const padding = span * 0.18;
    const lo = Math.max(0, min - padding);
    const hi = max + padding;

    const points = trendDataset.map((item, idx) => {
      const x = (idx / (trendDataset.length - 1)) * 100;
      const y = 100 - ((item.value - lo) / (hi - lo)) * 100;
      return { x, y, ...item };
    });

    const { pathD, areaD } = getSmoothCurvePath(points);

    // 4 reference tick values for horizontal grid lines
    const ticksCount = 4;
    const tickVals = Array.from({ length: ticksCount }, (_, i) => {
      const val = Math.round(hi - (i / (ticksCount - 1)) * (hi - lo));
      const yPercent = (i / (ticksCount - 1)) * 100;
      return { val, yPercent };
    });

    return { pathD, areaD, points, tickVals };
  }, [trendDataset]);

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

  // Add Sticker
  const handleAddSticker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStickerName.trim()) return;
    setUploadedStickers((prev) => [...prev, newStickerName.trim()]);
    setNewStickerName("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9FB] flex flex-col items-center justify-center space-y-4">
        <div className="size-12 rounded-2xl bg-[#FFE5EC] border border-[#FB6F92]/30 flex items-center justify-center text-[#FB6F92] animate-bounce shadow-xs">
          <ShieldCheck className="size-6" />
        </div>
        <p className="font-mono text-xs font-semibold text-[#7D7F9A] uppercase tracking-wider">
          Memverifikasi wewenang Super Admin...
        </p>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  const activePointIndex =
    hoveredPointIndex !== null && hoveredPointIndex >= 0 && hoveredPointIndex < chartCoordinates.points.length
      ? hoveredPointIndex
      : chartCoordinates.points.length - 1;

  const activePoint = chartCoordinates.points[activePointIndex];

  return (
    <div className="min-h-screen bg-[#FFF9FB] text-[#2B2D42] flex antialiased selection:bg-[#FB6F92] selection:text-white">
      {/* 1. COLLAPSIBLE SIDEBAR */}
      <aside
        className={`bg-white border-r border-[#FB6F92]/20 flex flex-col justify-between transition-all duration-300 z-30 shrink-0 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#FB6F92]/15 flex items-center justify-between">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="size-8 rounded-xl bg-[#FFE5EC] border border-[#FB6F92]/30 flex items-center justify-center text-[#FB6F92] shrink-0">
                <Camera className="size-4" />
              </div>
              <div className="truncate">
                <h1 className="font-display font-extrabold text-sm text-[#2B2D42] leading-tight truncate">
                  LoveFun Studio
                </h1>
                <span className="font-mono text-[10px] text-[#7D7F9A] block truncate">
                  SaaS Control Room
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto size-8 rounded-xl bg-[#FFE5EC] border border-[#FB6F92]/30 flex items-center justify-center text-[#FB6F92]">
              <Camera className="size-4" />
            </div>
          )}

          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-[#7D7F9A] hover:text-[#2B2D42] hover:bg-muted/50 transition cursor-pointer"
            title={sidebarCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="p-3 flex-1 space-y-6 overflow-y-auto">
          {/* Group 1: Ringkasan Utama */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7D7F9A] px-3">
                Ringkasan
              </span>
            )}
            <button
              type="button"
              onClick={() => setActiveMenu("overview")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMenu === "overview"
                  ? "bg-[#FB6F92] text-white shadow-xs"
                  : "text-[#7D7F9A] hover:text-[#2B2D42] hover:bg-pink-50/50"
              }`}
              title="Overview Telemetry"
            >
              <LayoutDashboard className="size-4 shrink-0" />
              {!sidebarCollapsed && <span>Overview Telemetry</span>}
            </button>
          </div>

          {/* Group 2: Studio & Aset Strip */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7D7F9A] px-3">
                Studio & Strip
              </span>
            )}
            <button
              type="button"
              onClick={() => setActiveMenu("strips")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMenu === "strips"
                  ? "bg-[#FB6F92] text-white shadow-xs"
                  : "text-[#7D7F9A] hover:text-[#2B2D42] hover:bg-pink-50/50"
              }`}
              title="Upload & Template Strip"
            >
              <ImagePlus className="size-4 shrink-0" />
              {!sidebarCollapsed && <span>Upload & Template Strip</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu("frames")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMenu === "frames"
                  ? "bg-[#FB6F92] text-white shadow-xs"
                  : "text-[#7D7F9A] hover:text-[#2B2D42] hover:bg-pink-50/50"
              }`}
              title="Katalog Bingkai"
            >
              <Palette className="size-4 shrink-0" />
              {!sidebarCollapsed && <span>Katalog Bingkai</span>}
            </button>
          </div>

          {/* Group 3: Aktivitas Pasangan */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7D7F9A] px-3">
                Aktivitas Pasangan
              </span>
            )}
            <button
              type="button"
              onClick={() => setActiveMenu("games_sync")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMenu === "games_sync"
                  ? "bg-[#735D96] text-white shadow-xs"
                  : "text-[#7D7F9A] hover:text-[#2B2D42] hover:bg-purple-50/50"
              }`}
              title="Sync or Sink (Live)"
            >
              <Gamepad2 className="size-4 shrink-0" />
              {!sidebarCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span>Sync or Sink (Live)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/40 text-current">
                    {rooms.filter((r) => r.game_type === "SYNC_OR_SINK").length}
                  </span>
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu("games_likely")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMenu === "games_likely"
                  ? "bg-[#FB6F92] text-white shadow-xs"
                  : "text-[#7D7F9A] hover:text-[#2B2D42] hover:bg-pink-50/50"
              }`}
              title="Who's Most Likely (Live)"
            >
              <Flame className="size-4 shrink-0" />
              {!sidebarCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span>Who&apos;s Most Likely (Live)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/40 text-current">
                    {rooms.filter((r) => r.game_type === "WHOS_MOST_LIKELY").length}
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* Group 4: Administrasi */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7D7F9A] px-3">
                Administrasi
              </span>
            )}
            <button
              type="button"
              onClick={() => setActiveMenu("users")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMenu === "users"
                  ? "bg-[#FB6F92] text-white shadow-xs"
                  : "text-[#7D7F9A] hover:text-[#2B2D42] hover:bg-pink-50/50"
              }`}
              title="Pengguna & Akses"
            >
              <Users className="size-4 shrink-0" />
              {!sidebarCollapsed && <span>Pengguna & Akses</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu("settings")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMenu === "settings"
                  ? "bg-[#FB6F92] text-white shadow-xs"
                  : "text-[#7D7F9A] hover:text-[#2B2D42] hover:bg-pink-50/50"
              }`}
              title="Konfigurasi Sistem"
            >
              <Settings2 className="size-4 shrink-0" />
              {!sidebarCollapsed && <span>Konfigurasi Sistem</span>}
            </button>
          </div>
        </div>

        {/* Sidebar Footer with Quick Actions */}
        <div className="p-3 border-t border-[#FB6F92]/15 space-y-2">
          {!sidebarCollapsed ? (
            <div className="px-3 py-2 rounded-xl bg-muted/30 border border-border/30">
              <span className="text-[10px] font-mono text-muted-foreground block truncate">
                Super Admin Terverifikasi
              </span>
              <span className="text-xs font-semibold text-[#2B2D42] block truncate">
                {adminUser?.email || "fauzanrizqinoor@gmail.com"}
              </span>
            </div>
          ) : null}

          <div className="flex items-center gap-1 justify-around">
            <Link href="/" title="Kembali ke Beranda">
              <Button variant="ghost" size="sm" className="p-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>

            <Link href="/api/auth/logout" title="Keluar">
              <Button variant="ghost" size="sm" className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50">
                <LogOut className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* 2. MAIN DESKTOP CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-20 w-full bg-white/90 backdrop-blur-md border-b border-[#FB6F92]/20 px-8 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-[10px] border-[#FB6F92]/40 text-[#FB6F92]">
              {activeMenu.toUpperCase()} MODULE
            </Badge>
            <span className="text-[#7D7F9A] text-xs">/</span>
            <span className="font-display font-bold text-sm text-[#2B2D42]">
              {activeMenu === "overview" && "SaaS Platform Analytics & Telemetry"}
              {activeMenu === "strips" && "Upload & Strip Template Customizer"}
              {activeMenu === "frames" && "Katalog Tema Warna Bingkai"}
              {activeMenu === "games_sync" && "Live Room Monitor: Sync or Sink"}
              {activeMenu === "games_likely" && "Live Room Monitor: Who's Most Likely To"}
              {activeMenu === "users" && "Manajemen Akun & Role Pengguna"}
              {activeMenu === "settings" && "Konfigurasi Server & Keamanan"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="primary" className="text-[11px] font-mono px-3 py-1">
              TIER: FREE BETA (0 IDR)
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={loadAdminMetrics}
              disabled={refreshing}
              className="rounded-full text-xs"
            >
              <RefreshCw className={`size-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Sinkron Data</span>
            </Button>

            <Link href="/booth" target="_blank">
              <Button size="sm" className="rounded-full text-xs font-bold gap-1.5 bg-[#FB6F92] hover:bg-[#e0567a] text-white">
                <Camera className="size-3.5" />
                <span>Test Studio</span>
                <ExternalLink className="size-3 opacity-70" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Dynamic Body Content by Active Menu */}
        <main className="p-8 space-y-8 flex-1">
          {/* MENU 1: OVERVIEW & SAAS TELEMETRY */}
          {activeMenu === "overview" && (
            <div className="space-y-8">
              {/* SaaS Top KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Metric 1: Total Photos */}
                <div className="rounded-3xl p-6 bg-white border border-[#FB6F92]/20 shadow-sm space-y-3">
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
                    <p className="text-[11px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                      <TrendingUp className="size-3" />
                      <span>+34.2% minggu ini</span>
                    </p>
                  </div>
                </div>

                {/* Metric 2: Active Rooms */}
                <div className="rounded-3xl p-6 bg-white border border-[#FB6F92]/20 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-[#7D7F9A] uppercase tracking-wider">
                      Active Game Rooms
                    </span>
                    <div className="size-8 rounded-xl bg-[#E8DFF5] flex items-center justify-center text-[#735D96]">
                      <Gamepad2 className="size-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-3xl font-black text-[#2B2D42]">
                      {kpis.activeRooms}
                    </h3>
                    <p className="text-[11px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                      <TrendingUp className="size-3" />
                      <span>+18.5% sesi live</span>
                    </p>
                  </div>
                </div>

                {/* Metric 3: Avg Chemistry */}
                <div className="rounded-3xl p-6 bg-white border border-[#FB6F92]/20 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-[#7D7F9A] uppercase tracking-wider">
                      Avg Chemistry Match
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

                {/* Metric 4: Registered Users */}
                <div className="rounded-3xl p-6 bg-white border border-[#FB6F92]/20 shadow-sm space-y-3">
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
                    <p className="text-[11px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                      <TrendingUp className="size-3" />
                      <span>+28.4% akuisisi</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* SAAS PROFESSIONAL SPLINE TELEMETRY CHART (BagUI Architecture) */}
              <div className="rounded-3xl p-6 lg:p-8 bg-white border border-[#FB6F92]/20 shadow-sm space-y-6">
                {/* Chart Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Activity className="size-4 text-[#FB6F92]" />
                      <h3 className="font-display font-extrabold text-base text-[#2B2D42]">
                        Kurva Pertumbuhan & Aktivitas Platform
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Visualisasi kurva halus (Bézier Spline) dari volume aktivitas harian dan pengguna aktif.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Metric Selector Buttons */}
                    <div className="flex items-center rounded-xl bg-muted/30 p-1 border border-border/40 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setChartMetric("users")}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          chartMetric === "users"
                            ? "bg-[#FB6F92] text-white shadow-2xs"
                            : "text-[#7D7F9A] hover:text-[#2B2D42]"
                        }`}
                      >
                        Pengguna Baru
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartMetric("photos")}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          chartMetric === "photos"
                            ? "bg-[#FB6F92] text-white shadow-2xs"
                            : "text-[#7D7F9A] hover:text-[#2B2D42]"
                        }`}
                      >
                        Sesi Foto Strip
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartMetric("games")}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          chartMetric === "games"
                            ? "bg-[#FB6F92] text-white shadow-2xs"
                            : "text-[#7D7F9A] hover:text-[#2B2D42]"
                        }`}
                      >
                        Game Pasangan
                      </button>
                    </div>

                    {/* Timeframe Selector Pills */}
                    <div className="flex items-center rounded-xl bg-muted/30 p-1 border border-border/40 text-xs font-mono font-bold">
                      {([7, 14, 30] as const).map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setChartDays(days)}
                          className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                            chartDays === days
                              ? "bg-white text-[#2B2D42] shadow-2xs border border-border/30"
                              : "text-[#7D7F9A] hover:text-[#2B2D42]"
                          }`}
                        >
                          {days}D
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Metric Summary Header */}
                <div className="flex items-baseline justify-between flex-wrap gap-2 px-1">
                  <div>
                    <span className="text-[11px] font-mono font-bold uppercase text-[#7D7F9A] tracking-wider block">
                      Titik Data Terpilih ({activePoint?.date || "Hari Ini"})
                    </span>
                    <div className="flex items-baseline gap-2.5 mt-0.5">
                      <span className="font-display font-black text-3xl text-[#2B2D42]">
                        {activePoint?.value || 0}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {activePoint?.change || "+0%"} vs hari sebelumnya
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono text-muted-foreground hidden sm:block">
                    Arahkan kursor ke kurva untuk melihat data per tanggal
                  </div>
                </div>

                {/* Professional Chart Container with Y-Axis Values & Gridlines */}
                <div className="flex gap-4 pt-2">
                  {/* Y-Axis Value Labels Column */}
                  <div className="flex flex-col justify-between py-1 text-right text-[11px] font-mono text-[#7D7F9A] select-none shrink-0 w-8">
                    {chartCoordinates.tickVals.map((t, idx) => (
                      <span key={idx}>{t.val}</span>
                    ))}
                  </div>

                  {/* Chart Drawing Canvas Wrapper */}
                  <div className="relative flex-1 h-64 w-full">
                    {/* Horizontal Reference Gridlines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {chartCoordinates.tickVals.map((_, idx) => (
                        <div
                          key={idx}
                          className="w-full border-b border-dashed border-border/30"
                        />
                      ))}
                    </div>

                    {/* Smooth Bézier Curve SVG */}
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className="absolute inset-0 h-full w-full overflow-visible"
                    >
                      <defs>
                        <linearGradient id="saas-smooth-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FB6F92" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="#FB6F92" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Smooth Area Fill */}
                      {chartCoordinates.areaD && (
                        <path
                          d={chartCoordinates.areaD}
                          fill="url(#saas-smooth-gradient)"
                        />
                      )}

                      {/* Smooth Polyline Stroke */}
                      {chartCoordinates.pathD && (
                        <path
                          d={chartCoordinates.pathD}
                          fill="none"
                          stroke="#FB6F92"
                          strokeWidth="2.2"
                          vectorEffect="non-scaling-stroke"
                        />
                      )}
                    </svg>

                    {/* Interactive Hover Vertical Crosshair Tracker */}
                    {activePoint && (
                      <div
                        className="pointer-events-none absolute inset-y-0 transition-all duration-75"
                        style={{ left: `${activePoint.x}%` }}
                      >
                        <div className="h-full w-px border-l border-dashed border-[#FB6F92]/50" />
                      </div>
                    )}

                    {/* Active Point Glowing HTML Circle (Guaranteed Round, Never Distorts) */}
                    {activePoint && (
                      <div
                        style={{
                          left: `${activePoint.x}%`,
                          top: `${activePoint.y}%`,
                        }}
                        className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#FB6F92] shadow-[0_0_0_5px_rgba(251,111,146,0.3)] transition-all duration-75 z-20"
                      />
                    )}

                    {/* Floating Tooltip Pill */}
                    {activePoint && (
                      <div
                        style={{
                          left: `${activePoint.x}%`,
                          top: `${activePoint.y}%`,
                        }}
                        className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-[calc(100%+14px)] whitespace-nowrap rounded-xl border border-border/40 bg-white/95 backdrop-blur-md px-3 py-1.5 shadow-lg shadow-black/5 transition-all duration-75"
                      >
                        <p className="text-[10px] font-mono text-[#7D7F9A]">{activePoint.date}</p>
                        <p className="flex items-center gap-1.5 text-xs font-bold text-[#2B2D42]">
                          <span>{activePoint.value} entitas</span>
                          <span className="text-emerald-600 font-mono text-[10px]">
                            {activePoint.change}
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Invisible Hover Hitboxes across X-Axis */}
                    <div className="absolute inset-0 flex z-10">
                      {chartCoordinates.points.map((_, idx) => (
                        <div
                          key={idx}
                          onMouseEnter={() => setHoveredPointIndex(idx)}
                          className="flex-1 h-full cursor-crosshair"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sumbu X Dates Labels */}
                <div className="flex justify-between text-[11px] font-mono text-[#7D7F9A] pt-2 border-t border-border/30 pl-12">
                  <span>{trendDataset[0]?.date}</span>
                  <span className="hidden sm:inline">
                    {trendDataset[Math.floor(trendDataset.length / 2)]?.date}
                  </span>
                  <span>{trendDataset[trendDataset.length - 1]?.date}</span>
                </div>
              </div>

              {/* SAAS TIER & DISTRIBUTION BREAKDOWN ROW */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Card 1: SaaS Subscription / Free Plan Card */}
                <div className="rounded-3xl p-6 bg-white border border-[#2B2D42]/10 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-4 text-[#FB6F92]" />
                      <h4 className="font-display font-bold text-sm text-[#2B2D42]">
                        Status Paket SaaS (Aktif)
                      </h4>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 bg-emerald-50">
                      FREE BETA ACCESS
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="font-display font-black text-2xl text-[#2B2D42]">
                          Rp 0
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">/ bulan (Masa Beta)</span>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        Akses Penuh Tanpa Batas
                      </span>
                    </div>

                    <p className="text-xs text-[#7D7F9A] leading-relaxed">
                      Platform LoveFun saat ini beroperasi dengan model komunitas gratis. Seluruh fitur photobooth, sinkronisasi game pasangan, dan ekspor GIF dapat digunakan tanpa biaya langganan.
                    </p>

                    {/* Usage Progress Bar */}
                    <div className="space-y-2 pt-2 border-t border-border/20">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-muted-foreground">Penyimpanan Foto & Game Cloud</span>
                        <span className="font-bold text-[#2B2D42]">1.2 GB / 10 GB (12%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted/40 overflow-hidden">
                        <div className="h-full rounded-full bg-[#FB6F92]" style={{ width: "12%" }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Activity Distribution (Donut Breakdown) */}
                <div className="rounded-3xl p-6 bg-white border border-[#2B2D42]/10 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <div className="flex items-center gap-2">
                      <PieChart className="size-4 text-[#735D96]" />
                      <h4 className="font-display font-bold text-sm text-[#2B2D42]">
                        Distribusi Penggunaan Fitur
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      Bulan Ini
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    {/* SVG Donut Ring */}
                    <div className="relative size-32 mx-auto flex items-center justify-center">
                      <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                        {/* Base Circle */}
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke="#F1E7ED"
                          strokeWidth="3.5"
                        />
                        {/* Segment 1: Photo Strip (58%) */}
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke="#FB6F92"
                          strokeWidth="3.5"
                          strokeDasharray="51 88"
                          strokeDashoffset="0"
                        />
                        {/* Segment 2: Who's Most Likely (26%) */}
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke="#735D96"
                          strokeWidth="3.5"
                          strokeDasharray="23 88"
                          strokeDashoffset="-51"
                        />
                        {/* Segment 3: Sync or Sink (16%) */}
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="3.5"
                          strokeDasharray="14 88"
                          strokeDashoffset="-74"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="font-display font-black text-lg text-[#2B2D42]">100%</span>
                        <span className="text-[9px] font-mono text-muted-foreground">Aktivitas</span>
                      </div>
                    </div>

                    {/* Breakdown List */}
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full bg-[#FB6F92]" />
                          <span>Photo Strip Studio</span>
                        </div>
                        <span className="font-mono font-bold">58%</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full bg-[#735D96]" />
                          <span>Who&apos;s Most Likely To</span>
                        </div>
                        <span className="font-mono font-bold">26%</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full bg-[#10B981]" />
                          <span>Sync or Sink Challenge</span>
                        </div>
                        <span className="font-mono font-bold">16%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MENU 2: UPLOAD & TEMPLATE STRIP */}
          {activeMenu === "strips" && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Panel Konfigurasi Strip */}
                <div className="lg:col-span-2 rounded-3xl p-6 bg-white border border-[#FB6F92]/20 shadow-sm space-y-6">
                  <div>
                    <h3 className="font-display font-bold text-lg text-[#2B2D42]">
                      Konfigurasi Template & Tata Letak Strip
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Ubah teks footer otomatis, layout pose, dan stiker yang tersedia di photo booth studio.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#7D7F9A] uppercase tracking-wider">
                        Header / Title Strip
                      </label>
                      <Input
                        value={stripTitle}
                        onChange={(e) => setStripTitle(e.target.value)}
                        placeholder="Contoh: LOVE IS FUN"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#7D7F9A] uppercase tracking-wider">
                        Footer Text / Watermark
                      </label>
                      <Input
                        value={stripSubtitle}
                        onChange={(e) => setStripSubtitle(e.target.value)}
                        placeholder="Contoh: STUDIO MEMORIES"
                      />
                    </div>
                  </div>

                  {/* Pilihan Layout */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#7D7F9A] uppercase tracking-wider">
                      Layout Pose Default
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["3-pose", "4-pose", "2x2-grid"] as const).map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setStripLayout(l)}
                          className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center cursor-pointer ${
                            stripLayout === l
                              ? "border-[#FB6F92] bg-[#FFE5EC] text-[#FB6F92] shadow-xs"
                              : "border-border/60 bg-muted/20 text-[#7D7F9A] hover:bg-muted/40"
                          }`}
                        >
                          {l === "3-pose" && "3 Pose Vertikal"}
                          {l === "4-pose" && "4 Pose Classic"}
                          {l === "2x2-grid" && "2x2 Bento Grid"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upload Strip Frame Asset / Overlay Dropzone */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-[#7D7F9A] uppercase tracking-wider">
                      Upload Custom Frame Overlay (SVG / PNG)
                    </label>
                    <div className="border-2 border-dashed border-[#FB6F92]/40 rounded-3xl p-8 text-center bg-[#FFF0F4]/40 hover:bg-[#FFF0F4] transition-colors cursor-pointer space-y-2">
                      <div className="size-10 rounded-xl bg-white border border-[#FB6F92]/30 flex items-center justify-center text-[#FB6F92] mx-auto shadow-2xs">
                        <Upload className="size-5" />
                      </div>
                      <p className="text-xs font-bold text-[#2B2D42]">
                        Tarik & Lepaskan File Template Frame Baru
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Mendukung format SVG transparan dan PNG resolusi tinggi (1200 x 3600 px).
                      </p>
                    </div>
                  </div>

                  {/* Kelola Stiker Dekorasi */}
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-[#7D7F9A] uppercase tracking-wider">
                      Koleksi Stiker Dekorasi Studio
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {uploadedStickers.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl bg-pink-50 border border-[#FB6F92]/30 text-xs font-semibold text-[#FB6F92] flex items-center gap-2"
                        >
                          <Sparkles className="size-3" />
                          <span>{s}</span>
                        </span>
                      ))}
                    </div>

                    <form onSubmit={handleAddSticker} className="flex gap-2 pt-1">
                      <Input
                        value={newStickerName}
                        onChange={(e) => setNewStickerName(e.target.value)}
                        placeholder="Tambah stiker baru (misal: Cute Bow)..."
                        className="text-xs"
                      />
                      <Button type="submit" size="sm" className="rounded-xl font-bold bg-[#FB6F92] text-white cursor-pointer">
                        <Plus className="size-3.5 mr-1" />
                        <span>Tambah</span>
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Live Mockup Strip Preview */}
                <div className="rounded-3xl p-6 bg-white border border-border/40 shadow-sm space-y-4 flex flex-col items-center">
                  <span className="text-xs font-mono font-bold text-[#7D7F9A] uppercase tracking-wider">
                    Live Strip Mockup
                  </span>

                  {/* Strip Container Preview */}
                  <div className="w-48 bg-[#FFE5EC] border-4 border-[#FB6F92] rounded-2xl p-3 shadow-md flex flex-col gap-2">
                    <div className="text-center font-display font-black text-[10px] text-[#FB6F92] tracking-wider">
                      {stripTitle}
                    </div>

                    {/* Pose Boxes */}
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="w-full aspect-4/3 rounded-lg bg-white/80 border border-[#FB6F92]/30 flex items-center justify-center text-[10px] text-muted-foreground font-mono"
                        >
                          Pose #{i}
                        </div>
                      ))}
                    </div>

                    <div className="text-center pt-1 border-t border-[#FB6F92]/30">
                      <p className="font-mono text-[8px] text-[#FB6F92] font-bold">
                        {stripSubtitle}
                      </p>
                      <p className="font-mono text-[7px] text-[#7D7F9A]">
                        {new Date().toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MENU 3: FRAME CATALOG */}
          {activeMenu === "frames" && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Form Tambah Frame Baru */}
              <div className="rounded-3xl p-6 bg-white border border-[#FB6F92]/20 shadow-sm space-y-4 h-fit">
                <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                  <Palette className="size-4 text-[#FB6F92]" />
                  <h3 className="font-display font-bold text-sm text-[#2B2D42]">
                    Tambah Tema Bingkai Baru
                  </h3>
                </div>

                <form onSubmit={handleAddFrame} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#7D7F9A]">Nama Frame</label>
                    <Input
                      value={newFrameName}
                      onChange={(e) => setNewFrameName(e.target.value)}
                      placeholder="Contoh: Sunset Coral"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#7D7F9A]">Warna Background</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newBgColor}
                          onChange={(e) => setNewBgColor(e.target.value)}
                          className="size-9 rounded-xl border cursor-pointer"
                        />
                        <span className="font-mono text-xs">{newBgColor}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#7D7F9A]">Warna Border</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newBorderColor}
                          onChange={(e) => setNewBorderColor(e.target.value)}
                          className="size-9 rounded-xl border cursor-pointer"
                        />
                        <span className="font-mono text-xs">{newBorderColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sample Live Box */}
                  <div className="pt-2">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1.5">
                      Sample Visual
                    </span>
                    <div
                      className="p-3.5 rounded-2xl border text-center text-xs font-bold shadow-2xs"
                      style={{
                        backgroundColor: newBgColor,
                        borderColor: newBorderColor,
                        color: newTextColor,
                      }}
                    >
                      {newFrameName || "Preview Frame"}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={frameSubmitting || !newFrameName.trim()}
                    className="w-full rounded-2xl font-bold bg-[#FB6F92] hover:bg-[#e0567a] text-white cursor-pointer"
                  >
                    <Plus className="size-4 mr-1.5" />
                    <span>Simpan ke Database</span>
                  </Button>
                </form>
              </div>

              {/* List Bingkai Terdaftar */}
              <div className="lg:col-span-2 rounded-3xl p-6 bg-white border border-border/40 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <h3 className="font-display font-bold text-sm text-[#2B2D42]">
                    Katalog Bingkai Aktif ({frames.length} Tema)
                  </h3>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    DB SYNCED
                  </Badge>
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
                        className="size-8 rounded-lg bg-white/80 hover:bg-white text-red-500 flex items-center justify-center transition shadow-2xs cursor-pointer"
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

          {/* MENU 4A: SYNC OR SINK LIVE ROOMS */}
          {activeMenu === "games_sync" && (
            <div className="rounded-3xl p-6 bg-white border border-[#735D96]/20 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-[#E8DFF5] flex items-center justify-center text-[#735D96]">
                    <Gamepad2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-[#2B2D42]">
                      Live Monitor: Sync or Sink
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Kuis sinkronisasi pilihan cepat (selera kencan, liburan, makanan).
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs border-[#735D96]/30 text-[#735D96]">
                    {rooms.filter((r) => r.game_type === "SYNC_OR_SINK").length} ROOMS
                  </Badge>
                  <Link href="/games/sync" target="_blank">
                    <Button size="sm" className="rounded-full text-xs font-bold bg-[#735D96] hover:bg-[#624D82] text-white">
                      <span>Buka Game Sync</span>
                      <ExternalLink className="size-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>

              {rooms.filter((r) => r.game_type === "SYNC_OR_SINK").length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                  <Clock className="size-8 text-muted-foreground/40 mx-auto" />
                  <p>Belum ada room Sync or Sink yang aktif saat ini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/40 text-[11px] font-mono text-muted-foreground uppercase">
                        <th className="py-3 px-3">Room Code</th>
                        <th className="py-3 px-3">Host & Pasangan</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Skor Chemistry</th>
                        <th className="py-3 px-3">Kedaluwarsa (TTL 5 Jam)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms
                        .filter((r) => r.game_type === "SYNC_OR_SINK")
                        .map((r) => (
                          <tr key={r.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                            <td className="py-3 px-3 font-mono font-black text-sm text-[#735D96]">
                              {r.room_code}
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

          {/* MENU 4B: WHO'S MOST LIKELY LIVE ROOMS */}
          {activeMenu === "games_likely" && (
            <div className="rounded-3xl p-6 bg-white border border-[#FB6F92]/20 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-[#FFE5EC] flex items-center justify-center text-[#FB6F92]">
                    <Flame className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-[#2B2D42]">
                      Live Monitor: Who&apos;s Most Likely To?
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Kuis tunjuk pasangan komparasi kebiasaan harian (Siapa paling boros, bangun paling siang).
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs border-[#FB6F92]/30 text-[#FB6F92]">
                    {rooms.filter((r) => r.game_type === "WHOS_MOST_LIKELY").length} ROOMS
                  </Badge>
                  <Link href="/games/likely" target="_blank">
                    <Button size="sm" className="rounded-full text-xs font-bold bg-[#FB6F92] hover:bg-[#e0567a] text-white">
                      <span>Buka Game Tunjuk</span>
                      <ExternalLink className="size-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>

              {rooms.filter((r) => r.game_type === "WHOS_MOST_LIKELY").length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                  <Clock className="size-8 text-muted-foreground/40 mx-auto" />
                  <p>Belum ada room Who&apos;s Most Likely To yang aktif saat ini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/40 text-[11px] font-mono text-muted-foreground uppercase">
                        <th className="py-3 px-3">Room Code</th>
                        <th className="py-3 px-3">Host & Pasangan</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Skor Chemistry</th>
                        <th className="py-3 px-3">Kedaluwarsa (TTL 5 Jam)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms
                        .filter((r) => r.game_type === "WHOS_MOST_LIKELY")
                        .map((r) => (
                          <tr key={r.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                            <td className="py-3 px-3 font-mono font-black text-sm text-[#FB6F92]">
                              {r.room_code}
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

          {/* MENU 5: USERS & PERMISSIONS */}
          {activeMenu === "users" && (
            <div className="rounded-3xl p-6 bg-white border border-border/40 shadow-sm space-y-6">
              <div className="border-b border-border/40 pb-3">
                <h3 className="font-display font-bold text-lg text-[#2B2D42]">
                  Manajemen Pengguna & Hak Akses
                </h3>
                <p className="text-xs text-muted-foreground">
                  Daftar akun terdaftar dan hierarki wewenang Super Admin.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-pink-100 text-[#FB6F92] flex items-center justify-center font-bold font-mono">
                      FA
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#2B2D42]">Fauzan (Super Admin)</h4>
                      <p className="font-mono text-xs text-muted-foreground">
                        fauzanrizqinoor@gmail.com
                      </p>
                    </div>
                  </div>
                  <Badge variant="primary" className="font-mono text-xs">
                    ROLE: SUPER_ADMIN
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* MENU 6: SETTINGS */}
          {activeMenu === "settings" && (
            <div className="rounded-3xl p-6 bg-white border border-border/40 shadow-sm space-y-6">
              <div className="border-b border-border/40 pb-3">
                <h3 className="font-display font-bold text-lg text-[#2B2D42]">
                  Konfigurasi & Telemetri Server
                </h3>
                <p className="text-xs text-muted-foreground">
                  Detail infrastruktur VPS, PostgreSQL, dan parameter keamanan sesi.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 rounded-2xl bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[10px] uppercase">Host & Domain</span>
                  <p className="font-bold text-foreground">fun.fizaa.me · Dahono Cloud VPS</p>
                </div>
                <div className="p-4 rounded-2xl bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[10px] uppercase">Database ORM</span>
                  <p className="font-bold text-foreground">PostgreSQL · Prisma ORM v6.4.1</p>
                </div>
                <div className="p-4 rounded-2xl bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[10px] uppercase">Session Security</span>
                  <p className="font-bold text-foreground">JWT Session Cookie (Bypass Key Active)</p>
                </div>
                <div className="p-4 rounded-2xl bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[10px] uppercase">Ephemeral TTL</span>
                  <p className="font-bold text-foreground">5-Hour Expiration Auto-Purge</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
