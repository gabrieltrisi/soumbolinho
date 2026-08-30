import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Brasil é UTC-3 o ano todo.
const SP_OFFSET_MS = 3 * 60 * 60 * 1000;

function inicioDiaSP(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 3, 0, 0));
}
function hojeSP() {
  return new Date(Date.now() - SP_OFFSET_MS).toISOString().slice(0, 10);
}
function partesSP(date: Date) {
  const sp = new Date(date.getTime() - SP_OFFSET_MS);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return {
    data: `${p2(sp.getUTCDate())}/${p2(sp.getUTCMonth() + 1)}/${sp.getUTCFullYear()}`,
    hora: `${p2(sp.getUTCHours())}:${p2(sp.getUTCMinutes())}`,
  };
}
function campo(v: string | number | null) {
  const s = v == null ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Exporta os atendimentos finalizados do período em CSV (Excel-friendly).
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const de = sp.get("de") || hojeSP();
  const ate = sp.get("ate") || de;

  const gte = inicioDiaSP(de);
  const lt = new Date(inicioDiaSP(ate).getTime() + 24 * 60 * 60 * 1000);

  const regs = await prisma.crianca.findMany({
    where: { saida: { gte, lt }, valor: { not: null } },
    orderBy: { saida: "asc" },
    select: {
      nomeResponsavel: true,
      telefoneResponsavel: true,
      nomeCrianca: true,
      idade: true,
      entrada: true,
      saida: true,
      valor: true,
      valorTabela: true,
      motivoAjuste: true,
      formaPagamento: true,
    },
  });

  const cabecalho = [
    "Data",
    "Responsável",
    "Telefone",
    "Criança",
    "Idade",
    "Entrada",
    "Saída",
    "Duração (min)",
    "Valor (R$)",
    "Valor tabela (R$)",
    "Motivo do ajuste",
    "Forma de pagamento",
  ];

  const linhas = regs.map((r) => {
    const dur =
      r.entrada && r.saida ? Math.max(0, Math.floor((+new Date(r.saida) - +new Date(r.entrada)) / 60000)) : "";
    return [
      r.saida ? partesSP(r.saida).data : "",
      r.nomeResponsavel,
      r.telefoneResponsavel,
      r.nomeCrianca,
      r.idade,
      r.entrada ? partesSP(r.entrada).hora : "",
      r.saida ? partesSP(r.saida).hora : "",
      dur,
      r.valor != null ? r.valor.toFixed(2).replace(".", ",") : "",
      r.valorTabela != null ? r.valorTabela.toFixed(2).replace(".", ",") : "",
      r.motivoAjuste ?? "",
      r.formaPagamento ?? "",
    ];
  });

  const total = regs.reduce((s, r) => s + (r.valor ?? 0), 0);
  const rodape = ["", "", "", "", "", "", "", "TOTAL", total.toFixed(2).replace(".", ","), "", "", ""];

  const corpo = [cabecalho, ...linhas, rodape].map((cols) => cols.map(campo).join(";")).join("\r\n");
  const BOM = String.fromCharCode(0xfeff); // BOM para o Excel abrir em UTF-8
  const csv = BOM + corpo;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorios-${de}_a_${ate}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
