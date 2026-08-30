import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Baixa um backup (o mais recente por padrão, ou ?data=YYYY-MM-DD).
// Protegido pelo middleware (exige sessão).
export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get("data");
  const backup = data
    ? await prisma.backup.findUnique({ where: { data } })
    : await prisma.backup.findFirst({ orderBy: { data: "desc" } });

  if (!backup) {
    return NextResponse.json({ error: "Nenhum backup disponível." }, { status: 404 });
  }

  return new NextResponse(backup.conteudo, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="backup-soumbolinho-${backup.data}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
