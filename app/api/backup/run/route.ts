import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarSessao, COOKIE } from "@/lib/session";

const SP_OFFSET_MS = 3 * 60 * 60 * 1000;
function hojeSP() {
  return new Date(Date.now() - SP_OFFSET_MS).toISOString().slice(0, 10);
}

// Gera um snapshot de todos os dados. Chamado pelo cron da Vercel (Bearer CRON_SECRET)
// ou manualmente por um admin logado. Mantém os últimos 30 dias.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const cronOk = !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
  let sessaoOk = false;
  if (!cronOk) {
    const token = req.cookies.get(COOKIE)?.value;
    sessaoOk = !!(token && (await verificarSessao(token)));
  }
  if (!cronOk && !sessaoOk) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const [criancas, fechamentos] = await Promise.all([
    prisma.crianca.findMany({ orderBy: { id: "asc" } }),
    prisma.fechamentoCaixa.findMany({ orderBy: { data: "asc" } }),
  ]);

  const snapshot = {
    geradoEm: new Date().toISOString(),
    versao: 1,
    contagem: { criancas: criancas.length, fechamentos: fechamentos.length },
    criancas,
    fechamentos,
  };
  const conteudo = JSON.stringify(snapshot);
  const data = hojeSP();

  await prisma.backup.upsert({
    where: { data },
    create: { data, conteudo, tamanho: conteudo.length, destino: "db" },
    update: { conteudo, tamanho: conteudo.length, criadoEm: new Date() },
  });

  // Poda: mantém só os 30 backups mais recentes.
  const antigos = await prisma.backup.findMany({
    orderBy: { data: "desc" },
    skip: 30,
    select: { id: true },
  });
  if (antigos.length) {
    await prisma.backup.deleteMany({ where: { id: { in: antigos.map((b) => b.id) } } });
  }

  return NextResponse.json({
    ok: true,
    data,
    tamanho: conteudo.length,
    contagem: snapshot.contagem,
    via: cronOk ? "cron" : "manual",
  });
}
