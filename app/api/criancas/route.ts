import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Lista os check-ins (mais recentes primeiro).
export async function GET() {
  const criancas = await prisma.crianca.findMany({
    orderBy: { entrada: "desc" },
  });
  return NextResponse.json(criancas);
}

// Registra check-in(s). Aceita:
//  - lote: { responsavel: {nomeResponsavel, telefoneResponsavel, endereco}, criancas: [{nomeCrianca, idade, alergias}] }
//  - único (compat): { nomeCrianca, idade, ... }
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));

  if (Array.isArray(b?.criancas)) {
    const r = b.responsavel ?? {};
    const nomeResponsavel = String(r?.nomeResponsavel ?? "").trim();
    const telefoneResponsavel = String(r?.telefoneResponsavel ?? "").trim();
    const endereco = String(r?.endereco ?? "").trim();
    if (!nomeResponsavel || !telefoneResponsavel) {
      return NextResponse.json({ error: "Nome e telefone do responsável são obrigatórios." }, { status: 400 });
    }
    const validas = (
      b.criancas as Array<{ nomeCrianca?: string; idade?: unknown; alergias?: string }>
    ).filter((c) => String(c?.nomeCrianca ?? "").trim());
    if (validas.length === 0) {
      return NextResponse.json({ error: "Informe ao menos uma criança." }, { status: 400 });
    }
    const termoAceito = !!b.termoAceito;
    const criadas = [];
    for (const c of validas) {
      criadas.push(
        await prisma.crianca.create({
          data: {
            nomeCrianca: String(c.nomeCrianca).trim(),
            idade: Number.isFinite(Number(c?.idade)) ? Number(c.idade) : 0,
            endereco,
            telefoneResponsavel,
            nomeResponsavel,
            alergias: c?.alergias ? String(c.alergias).trim() : null,
            termoAceito,
          },
        }),
      );
    }
    return NextResponse.json(criadas, { status: 201 });
  }

  const nomeCrianca = String(b?.nomeCrianca ?? "").trim();
  const nomeResponsavel = String(b?.nomeResponsavel ?? "").trim();
  const telefoneResponsavel = String(b?.telefoneResponsavel ?? "").trim();
  if (!nomeCrianca || !nomeResponsavel || !telefoneResponsavel) {
    return NextResponse.json(
      { error: "Nome da criança, nome e telefone do responsável são obrigatórios." },
      { status: 400 },
    );
  }
  const crianca = await prisma.crianca.create({
    data: {
      nomeCrianca,
      idade: Number.isFinite(Number(b?.idade)) ? Number(b.idade) : 0,
      endereco: String(b?.endereco ?? "").trim(),
      telefoneResponsavel,
      nomeResponsavel,
      alergias: b?.alergias ? String(b.alergias).trim() : null,
    },
  });
  return NextResponse.json(crianca, { status: 201 });
}
