import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Status do backup (para a UI): último snapshot + quantos existem.
export async function GET() {
  const [ultimo, total] = await Promise.all([
    prisma.backup.findFirst({ orderBy: { data: "desc" }, select: { data: true, tamanho: true, criadoEm: true } }),
    prisma.backup.count(),
  ]);
  return NextResponse.json({ ultimo, total });
}
