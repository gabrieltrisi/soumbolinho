import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Brasil é UTC-3 o ano todo (sem horário de verão desde 2019).
const SP_OFFSET_MS = 3 * 60 * 60 * 1000;

function inicioDiaSP(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 3, 0, 0)); // 00:00 em SP = 03:00 UTC
}
function partesSP(date: Date) {
  const sp = new Date(date.getTime() - SP_OFFSET_MS);
  return { dia: sp.toISOString().slice(0, 10), hora: sp.getUTCHours() };
}
function hojeSP() {
  return new Date(Date.now() - SP_OFFSET_MS).toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const de = sp.get("de") || hojeSP();
  const ate = sp.get("ate") || de;

  const gte = inicioDiaSP(de);
  const lt = new Date(inicioDiaSP(ate).getTime() + 24 * 60 * 60 * 1000);

  const regs = await prisma.crianca.findMany({
    where: { saida: { gte, lt }, valor: { not: null } },
    select: { valor: true, saida: true, entrada: true, formaPagamento: true },
  });

  const total = regs.reduce((s, r) => s + (r.valor ?? 0), 0);
  const atendimentos = regs.length;
  const ticket = atendimentos > 0 ? total / atendimentos : 0;

  const porForma: Record<string, number> = { Dinheiro: 0, Pix: 0, "Cartão": 0 };
  const porDia: Record<string, number> = {};
  const porHora = Array.from({ length: 24 }, () => 0);
  let tempoTotalMin = 0;

  for (const r of regs) {
    if (r.formaPagamento && r.formaPagamento in porForma) porForma[r.formaPagamento] += r.valor ?? 0;
    if (r.saida) {
      const { dia } = partesSP(r.saida);
      porDia[dia] = (porDia[dia] ?? 0) + (r.valor ?? 0);
    }
    if (r.entrada) porHora[partesSP(r.entrada).hora] += 1;
    if (r.saida && r.entrada) tempoTotalMin += Math.max(0, Math.floor((new Date(r.saida).getTime() - new Date(r.entrada).getTime()) / 60000));
  }

  const tempoMedioMin = atendimentos > 0 ? Math.round(tempoTotalMin / atendimentos) : 0;

  return NextResponse.json({
    de,
    ate,
    total,
    atendimentos,
    ticket,
    tempoMedioMin,
    porForma,
    porDia,
    porHora,
  });
}
