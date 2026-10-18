import { NextResponse } from "next/server";
import { getRoom } from "@/lib/room-store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Kode room wajib disertakan." }, { status: 400 });
    }

    const session = await getRoom(code);
    if (!session) {
      return NextResponse.json(
        { error: "Ruangan tidak ditemukan atau sudah kedaluwarsa." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      room: {
        roomCode: session.roomCode,
        hostName: session.hostName,
        partnerName: session.partnerName,
        gameType: session.gameType,
        status: session.status,
        currentRound: session.currentRound,
        answers: session.answers,
        finalScore: session.finalScore,
        expiresAt: session.expiresAt.toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
