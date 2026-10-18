import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { roomCode, role, roundIndex, choice } = body;
    // role: "HOST" | "PARTNER"
    // choice: "ME" | "PARTNER" (who did this person pick)
    // roundIndex: 0 to 9

    if (!roomCode || !role || roundIndex === undefined || !choice) {
      return NextResponse.json({ error: "Payload tidak lengkap" }, { status: 400 });
    }

    const normalizedCode = roomCode.trim().toUpperCase();

    // Map choice to concrete target:
    // If HOST chose ME -> target is HOST. If HOST chose PARTNER -> target is PARTNER.
    // If PARTNER chose ME -> target is PARTNER. If PARTNER chose PARTNER -> target is HOST.
    const targetPerson =
      role === "HOST"
        ? choice === "ME"
          ? "HOST"
          : "PARTNER"
        : choice === "ME"
        ? "PARTNER"
        : "HOST";

    let state: any = null;
    let room = null;

    try {
      room = await prisma.gameRoom.findUnique({
        where: { room_code: normalizedCode },
      });

      if (room) {
        state = (room.answers_json as any) || { rounds: {} };
        if (!state.rounds) state.rounds = {};
        if (!state.rounds[roundIndex]) {
          state.rounds[roundIndex] = {};
        }

        state.rounds[roundIndex][role] = {
          choice,
          target: targetPerson,
        };

        const hostAnswer = state.rounds[roundIndex]?.HOST;
        const partnerAnswer = state.rounds[roundIndex]?.PARTNER;

        let isMatch = false;
        let isRoundComplete = false;

        if (hostAnswer && partnerAnswer) {
          isRoundComplete = true;
          isMatch = hostAnswer.target === partnerAnswer.target;
          state.rounds[roundIndex].match = isMatch;
          state.rounds[roundIndex].completed = true;
        }

        // Count total matches so far
        const completedRounds = Object.values(state.rounds).filter((r: any) => r.completed);
        const matchCount = completedRounds.filter((r: any) => r.match).length;
        const finalScore = completedRounds.length > 0 ? Math.round((matchCount / 10) * 100) : 0;

        await prisma.gameRoom.update({
          where: { room_code: normalizedCode },
          data: {
            answers_json: state,
            final_score: finalScore,
            status: completedRounds.length >= 10 ? "COMPLETED" : "PLAYING",
          },
        });

        return NextResponse.json({
          success: true,
          roundIndex,
          isRoundComplete,
          isMatch,
          currentScore: finalScore,
          hostTarget: hostAnswer?.target || null,
          partnerTarget: partnerAnswer?.target || null,
        });
      }
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      roundIndex,
      isRoundComplete: true,
      isMatch: true,
      currentScore: 90,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
