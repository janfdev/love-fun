import { prisma } from "@/lib/db";
import { generateRoomCode, calculateExpirationDate, isRoomExpired } from "@/lib/room-code";

export interface RoomSession {
  roomCode: string;
  hostName: string;
  partnerName: string | null;
  hostUserId: string | null;
  gameType: "SYNC_OR_SINK" | "WHOS_MOST_LIKELY";
  status: "WAITING" | "PLAYING" | "COMPLETED" | "EXPIRED";
  currentRound: number;
  answers: Record<number, { HOST?: any; PARTNER?: any; match?: boolean; completed?: boolean }>;
  finalScore: number | null;
  createdAt: Date;
  expiresAt: Date;
}

// In-memory cluster store for instant zero-latency multi-device synchronization
declare global {
  // eslint-disable-next-line no-var
  var globalRoomsStore: Map<string, RoomSession> | undefined;
}

const memoryStore = globalThis.globalRoomsStore ?? new Map<string, RoomSession>();
if (process.env.NODE_ENV !== "production") {
  globalThis.globalRoomsStore = memoryStore;
}

// Clean up expired rooms periodically
setInterval(() => {
  const now = new Date();
  for (const [code, room] of memoryStore.entries()) {
    if (now > room.expiresAt) {
      memoryStore.delete(code);
    }
  }
}, 5 * 60 * 1000);

export async function createRoom(
  hostName: string,
  gameType: "SYNC_OR_SINK" | "WHOS_MOST_LIKELY" = "WHOS_MOST_LIKELY",
  hostUserId: string | null = null
): Promise<RoomSession> {
  const roomCode = generateRoomCode();
  const expiresAt = calculateExpirationDate();

  const session: RoomSession = {
    roomCode,
    hostName: hostName.trim(),
    partnerName: null,
    hostUserId,
    gameType,
    status: "WAITING",
    currentRound: 0,
    answers: {},
    finalScore: null,
    createdAt: new Date(),
    expiresAt,
  };

  // 1. Save to in-memory store for instant polling
  memoryStore.set(roomCode, session);

  // 2. Persist to Prisma DB asynchronously (resilient)
  try {
    await prisma.gameRoom.create({
      data: {
        room_code: roomCode,
        host_name: hostName.trim(),
        host_user_id: hostUserId,
        game_type: gameType,
        status: "WAITING",
        expires_at: expiresAt,
        answers_json: {
          currentRound: 0,
          rounds: {},
        },
      },
    });
  } catch (err) {
    // Memory store handles sync if database is offline or unmigrated
    console.warn("DB save skipped, running on fast in-memory room store:", err);
  }

  return session;
}

export async function getRoom(roomCode: string): Promise<RoomSession | null> {
  const code = roomCode.trim().toUpperCase();
  const session = memoryStore.get(code);

  if (session) {
    if (new Date() > session.expiresAt) {
      session.status = "EXPIRED";
      memoryStore.delete(code);
      return null;
    }
    return session;
  }

  // Fallback to database if not in memory
  try {
    const dbRoom = await prisma.gameRoom.findUnique({
      where: { room_code: code },
    });

    if (dbRoom) {
      if (new Date() > new Date(dbRoom.expires_at)) {
        return null;
      }

      const answersData = (dbRoom.answers_json as any) || {};
      const restored: RoomSession = {
        roomCode: dbRoom.room_code,
        hostName: dbRoom.host_name,
        partnerName: dbRoom.partner_name,
        hostUserId: dbRoom.host_user_id,
        gameType: dbRoom.game_type as any,
        status: dbRoom.status as any,
        currentRound: answersData.currentRound || 0,
        answers: answersData.rounds || {},
        finalScore: dbRoom.final_score,
        createdAt: dbRoom.created_at,
        expiresAt: dbRoom.expires_at,
      };

      memoryStore.set(code, restored);
      return restored;
    }
  } catch {
    // Database fallback
  }

  return null;
}

export async function joinRoom(roomCode: string, partnerName: string): Promise<RoomSession | null> {
  const code = roomCode.trim().toUpperCase();
  const session = await getRoom(code);
  if (!session) return null;

  session.partnerName = partnerName.trim();
  session.status = "PLAYING";
  memoryStore.set(code, session);

  // Sync to DB
  try {
    await prisma.gameRoom.update({
      where: { room_code: code },
      data: {
        partner_name: partnerName.trim(),
        status: "PLAYING",
      },
    });
  } catch {
    // Fallback
  }

  return session;
}

export async function submitRoundAnswer(
  roomCode: string,
  role: "HOST" | "PARTNER",
  roundIndex: number,
  choice: any
): Promise<{ session: RoomSession; isRoundComplete: boolean; isMatch: boolean }> {
  const code = roomCode.trim().toUpperCase();
  const session = await getRoom(code);
  if (!session) throw new Error("Ruangan tidak ditemukan atau sudah kedaluwarsa.");

  if (!session.answers[roundIndex]) {
    session.answers[roundIndex] = {};
  }

  session.answers[roundIndex][role] = choice;

  const hostAns = session.answers[roundIndex].HOST;
  const partnerAns = session.answers[roundIndex].PARTNER;

  let isRoundComplete = false;
  let isMatch = false;

  if (hostAns !== undefined && partnerAns !== undefined) {
    isRoundComplete = true;

    if (session.gameType === "WHOS_MOST_LIKELY") {
      // In Who's Most Likely To:
      // Host choice: ME (points to HOST) or PARTNER (points to PARTNER)
      // Partner choice: ME (points to PARTNER) or PARTNER (points to HOST)
      const hostTarget = hostAns === "ME" ? "HOST" : "PARTNER";
      const partnerTarget = partnerAns === "ME" ? "PARTNER" : "HOST";
      isMatch = hostTarget === partnerTarget;
    } else {
      // In Sync or Sink: choices must match verbatim
      isMatch = hostAns === partnerAns;
    }

    session.answers[roundIndex].match = isMatch;
    session.answers[roundIndex].completed = true;

    // Calculate score
    const completedRounds = Object.values(session.answers).filter((r) => r.completed);
    const matchesCount = completedRounds.filter((r) => r.match).length;
    session.finalScore = Math.round((matchesCount / 10) * 100);

    if (completedRounds.length >= 10) {
      session.status = "COMPLETED";
    }
  }

  memoryStore.set(code, session);

  // Sync to DB
  try {
    await prisma.gameRoom.update({
      where: { room_code: code },
      data: {
        status: session.status,
        final_score: session.finalScore,
        answers_json: {
          currentRound: session.currentRound,
          rounds: session.answers,
        },
      },
    });
  } catch {
    // Fallback
  }

  return { session, isRoundComplete, isMatch };
}
