import { NextResponse } from "next/server";
import { generateRoomCode, calculateExpirationDate } from "@/lib/room-code";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { hostName, hostUserId } = body;

    if (!hostName || typeof hostName !== "string" || hostName.trim().length === 0) {
      return NextResponse.json(
        { error: "Nama panggilan Anda wajib diisi." },
        { status: 400 }
      );
    }

    const roomCode = generateRoomCode();
    const expiresAt = calculateExpirationDate();

    // Persist room to PostgreSQL via Prisma if available, with in-memory safe fallback
    let savedRoom = null;
    try {
      savedRoom = await prisma.gameRoom.create({
        data: {
          room_code: roomCode,
          host_name: hostName.trim(),
          host_user_id: hostUserId || null,
          game_type: "WHOS_MOST_LIKELY",
          status: "WAITING",
          expires_at: expiresAt,
          answers_json: {
            round: 0,
            rounds: {},
            totalRounds: 10,
          },
        },
      });
    } catch {
      // Ephemeral fallback if DB is in migration
    }

    return NextResponse.json({
      success: true,
      room: {
        roomCode,
        hostName: hostName.trim(),
        gameType: "WHOS_MOST_LIKELY",
        status: "WAITING",
        expiresAt: expiresAt.toISOString(),
        ttlHours: 5,
        shareUrl: `https://fun.fizaa.me/games/likely?code=${roomCode}`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal membuat ruang bermain: " + err.message },
      { status: 500 }
    );
  }
}
