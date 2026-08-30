import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarSessao, COOKIE } from "@/lib/session";

const SP_OFFSET_MS = 3 * 60 * 60 * 1000;
function inicioDiaSP(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 3, 0, 0));
}
function hojeSP() {
  return new Date(Date.now() - SP_OFFSET_MS).toISOString().slice(0, 10);
}

async function totaisDoDia(data: string) {
  const gte = inicioDiaSP(data);
  const lt = new Date(gte.getTime() + 24 * 60 * 60 * 1000);
  const regs = await prisma.crianca.findMany({
    where: { saida: { gte, lt }, valor: { not: null } },
    select: { valor: true, formaPagamento: true },
  });
  const totais = { totalSistema: 0, totalDinheiro: 0, totalPix: 0, totalCartao: 0, atendimentos: regs.length };
  for (const r of regs) {
    const v = r.valor ?? 0;
    totais.totalSistema += v;
    if (r.formaPagamento === "Dinheiro") totais.totalDinheiro += v;
    else if (r.formaPagamento === "Pix") totais.totalPix += v;
    else if (r.formaPagamento === "Cartão") totais.totalCartao += v;
  }
  return totais;
}

export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get("data") || hojeSP();
  const [totais, fechamento] = await Promise.all([
    totaisDoDia(data),
    prisma.fechamentoCaixa.findUnique({ where: { data } }),
  ]);
  return NextResponse.json({ data, totais, fechamento });
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const data = String(b?.data || hojeSP());
  const fundoInicial = Number.isFinite(Number(b?.fundoInicial)) ? Number(b.fundoInicial) : 0;
  const dinheiroContado =
    b?.dinheiroContado != null && Number.isFinite(Number(b.dinheiroContado)) ? Number(b.dinheiroContado) : null;
  const observacao = b?.observacao ? String(b.observacao).trim() : null;

  const totais = await totaisDoDia(data);
  const esperado = fundoInicial + totais.totalDinheiro;
  const divergencia = dinheiroContado != null ? Math.round((dinheiroContado - esperado) * 100) / 100 : null;

  const token = req.cookies.get(COOKIE)?.value;
  const sessao = token ? await verificarSessao(token) : null;

  const dados = {
    ...totais,
    fundoInicial,
    dinheiroContado,
    divergencia,
    observacao,
    fechadoPor: sessao?.nome ?? null,
  };

  const fechamento = await prisma.fechamentoCaixa.upsert({
    where: { data },
    create: { data, ...dados },
    update: dados,
  });
  return NextResponse.json({ data, totais, fechamento });
}
