import { NextResponse } from "next/server";
import { joinRoom } from "@/lib/room-store";

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

    const session = await joinRoom(roomCode, partnerName.trim());
    if (!session) {
      return NextResponse.json(
        { error: "Ruangan tidak ditemukan atau sudah kedaluwarsa. Periksa kembali kode room Anda." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        roomCode: session.roomCode,
        hostName: session.hostName,
        partnerName: session.partnerName,
        gameType: session.gameType,
        status: session.status,
        message: "Berhasil terhubung ke ruang bermain!",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Gagal bergabung: " + err.message }, { status: 500 });
  }
}
