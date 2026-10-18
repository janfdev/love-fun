import { NextResponse } from "next/server";
import { submitRoundAnswer } from "@/lib/room-store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { roomCode, role, roundIndex, choice } = body;

    if (!roomCode || !role || roundIndex === undefined || choice === undefined) {
      return NextResponse.json({ error: "Payload jawaban tidak lengkap." }, { status: 400 });
    }

    const { session, isRoundComplete, isMatch } = await submitRoundAnswer(
      roomCode,
      role,
      roundIndex,
      choice
    );

    return NextResponse.json({
      success: true,
      roundIndex,
      isRoundComplete,
      isMatch,
      currentScore: session.finalScore,
      status: session.status,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
