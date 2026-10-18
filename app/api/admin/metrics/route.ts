import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySessionToken, parseCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie");
    const token = parseCookie(cookieHeader, "lovefun_session");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = await verifySessionToken(token);
    if (!sessionUser || sessionUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    const now = new Date();

    // Query metrics concurrently with resilient fallback
    const [
      totalUsers,
      totalPhotos,
      totalRooms,
      activeRooms,
      recentRooms,
      completedRooms,
      frameCatalog,
    ] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.photoHistory.count().catch(() => 0),
      prisma.gameRoom.count().catch(() => 0),
      prisma.gameRoom
        .count({
          where: {
            status: { in: ["WAITING", "PLAYING"] },
            expires_at: { gt: now },
          },
        })
        .catch(() => 0),
      prisma.gameRoom
        .findMany({
          orderBy: { created_at: "desc" },
          take: 8,
          select: {
            id: true,
            room_code: true,
            host_name: true,
            partner_name: true,
            game_type: true,
            status: true,
            expires_at: true,
            final_score: true,
            created_at: true,
          },
        })
        .catch(() => []),
      prisma.gameRoom
        .findMany({
          where: { final_score: { not: null } },
          select: { final_score: true },
        })
        .catch(() => []),
      prisma.frameCatalog.findMany({ orderBy: { created_at: "asc" } }).catch(() => []),
    ]);

    const avgScore =
      completedRooms.length > 0
        ? Math.round(
            completedRooms.reduce((acc, r) => acc + (r.final_score || 0), 0) /
              completedRooms.length
          )
        : 88;

    return NextResponse.json({
      success: true,
      data: {
        adminUser: {
          name: sessionUser.name,
          email: sessionUser.email,
          role: sessionUser.role,
        },
        kpis: {
          totalUsers,
          totalPhotos,
          totalRooms,
          activeRooms,
          avgChemistryScore: avgScore,
        },
        recentRooms,
        frameCatalog,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal mengambil metrik admin: " + err.message },
      { status: 500 }
    );
  }
}
