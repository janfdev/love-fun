import { NextResponse } from "next/server";
import { createRoom } from "@/lib/room-store";

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

    const room = await createRoom(hostName.trim(), "WHOS_MOST_LIKELY", hostUserId);

    return NextResponse.json({
      success: true,
      room: {
        roomCode: room.roomCode,
        hostName: room.hostName,
        gameType: room.gameType,
        status: room.status,
        expiresAt: room.expiresAt.toISOString(),
        ttlHours: 5,
        shareUrl: `https://fun.fizaa.me/games/likely?code=${room.roomCode}`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal membuat ruang bermain: " + err.message },
      { status: 500 }
    );
  }
}
