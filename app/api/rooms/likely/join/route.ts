import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { roomCode, partnerName } = body;

    if (!roomCode || typeof roomCode !== "string") {
      return NextResponse.json({ error: "Kode room wajib diisi." }, { status: 400 });
    }

    if (!partnerName || typeof partnerName !== "string" || partnerName.trim().length === 0) {
      return NextResponse.json(
        { error: "Nama panggilan Anda wajib diisi untuk bergabung." },
        { status: 400 }
      );
    }

    const normalizedCode = roomCode.trim().toUpperCase();

    // Check in database
    let room = null;
    try {
      room = await prisma.gameRoom.findUnique({
        where: { room_code: normalizedCode },
      });

      if (room) {
        if (new Date() > new Date(room.expires_at)) {
          return NextResponse.json({ error: "Sesi room ini sudah kedaluwarsa." }, { status: 410 });
        }

        // Update partner name & status to PLAYING
        room = await prisma.gameRoom.update({
          where: { room_code: normalizedCode },
          data: {
            partner_name: partnerName.trim(),
            status: "PLAYING",
          },
        });
      }
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      session: {
        roomCode: normalizedCode,
        hostName: room?.host_name || "Pasangan Kamu",
        partnerName: partnerName.trim(),
        status: "PLAYING",
        message: "Berhasil terhubung ke ruang bermain!",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Gagal bergabung: " + err.message }, { status: 500 });
  }
}
