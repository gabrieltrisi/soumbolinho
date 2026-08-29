import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Linha = {
  nomeCrianca: string;
  idade: number;
  alergias: string | null;
  nomeResponsavel: string;
  endereco: string;
  entrada: Date;
};

// Busca cliente recorrente pelo telefone do responsável.
// Retorna o responsável mais recente + a lista de crianças distintas já cadastradas nesse número.
export async function GET(req: NextRequest) {
  const tel = (req.nextUrl.searchParams.get("tel") ?? "").replace(/\D/g, "");
  if (tel.length < 8) return NextResponse.json({ responsavel: null, criancas: [] });

  const rows = await prisma.$queryRaw<Linha[]>`
    SELECT DISTINCT ON (lower("nomeCrianca"))
      "nomeCrianca", "idade", "alergias", "nomeResponsavel", "endereco", "entrada"
    FROM "Crianca"
    WHERE regexp_replace("telefoneResponsavel", '[^0-9]', '', 'g') LIKE ${"%" + tel + "%"}
    ORDER BY lower("nomeCrianca"), "entrada" DESC
  `;

  if (rows.length === 0) return NextResponse.json({ responsavel: null, criancas: [] });

  const maisRecente = [...rows].sort((a, b) => +new Date(b.entrada) - +new Date(a.entrada))[0];
  return NextResponse.json({
    responsavel: { nomeResponsavel: maisRecente.nomeResponsavel, endereco: maisRecente.endereco },
    criancas: rows.map((r) => ({ nomeCrianca: r.nomeCrianca, idade: r.idade, alergias: r.alergias })),
  });
}
