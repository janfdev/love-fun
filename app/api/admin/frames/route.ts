import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySessionToken, parseCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function checkSuperAdmin(req: Request) {
  const cookieHeader = req.headers.get("cookie");
  const token = parseCookie(cookieHeader, "lovefun_session");
  if (!token) return null;
  const sessionUser = await verifySessionToken(token);
  if (!sessionUser || sessionUser.role !== "SUPER_ADMIN") return null;
  return sessionUser;
}

export async function GET(req: Request) {
  try {
    const admin = await checkSuperAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    const frames = await prisma.frameCatalog.findMany({
      orderBy: { created_at: "asc" },
    }).catch(() => []);

    return NextResponse.json({ success: true, frames });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await checkSuperAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { frame_name, bg_color, border_color, text_color } = body;

    if (!frame_name || !bg_color || !border_color) {
      return NextResponse.json({ error: "Semua atribut frame wajib diisi" }, { status: 400 });
    }

    const frame_code = frame_name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");

    const created = await prisma.frameCatalog.upsert({
      where: { frame_code },
      create: {
        frame_code,
        frame_name: frame_name.trim(),
        bg_color,
        border_color,
        text_color: text_color || "#2B2D42",
        is_active: true,
      },
      update: {
        frame_name: frame_name.trim(),
        bg_color,
        border_color,
        text_color: text_color || "#2B2D42",
        is_active: true,
      },
    });

    return NextResponse.json({ success: true, frame: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await checkSuperAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID frame wajib disertakan" }, { status: 400 });
    }

    await prisma.frameCatalog.delete({ where: { id } }).catch(() => null);

    return NextResponse.json({ success: true, message: "Frame berhasil dihapus" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
