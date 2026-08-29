import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { minutosEntre, calcularValor } from "@/lib/billing";

// Check-out (action "checkout", padrão) ou reabrir (action "reopen").
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body?.action ?? "checkout";

  const crianca = await prisma.crianca.findUnique({ where: { id: Number(id) } });
  if (!crianca) return NextResponse.json({ error: "Check-in não encontrado." }, { status: 404 });

  if (action === "reopen") {
    const upd = await prisma.crianca.update({
      where: { id: crianca.id },
      data: { saida: null, valor: null, formaPagamento: null },
    });
    return NextResponse.json(upd);
  }

  // checkout
  if (crianca.saida) return NextResponse.json(crianca);
  const saida = new Date();
  const minutos = minutosEntre(crianca.entrada, saida);
  const valor = calcularValor(minutos);
  const formaPagamento = body?.formaPagamento ? String(body.formaPagamento) : null;
  const upd = await prisma.crianca.update({ where: { id: crianca.id }, data: { saida, valor, formaPagamento } });
  return NextResponse.json(upd);
}

// Editar os dados do cadastro.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  const nomeCrianca = String(b?.nomeCrianca ?? "").trim();
  const nomeResponsavel = String(b?.nomeResponsavel ?? "").trim();
  const telefoneResponsavel = String(b?.telefoneResponsavel ?? "").trim();
  if (!nomeCrianca || !nomeResponsavel || !telefoneResponsavel) {
    return NextResponse.json(
      { error: "Nome da criança, nome e telefone do responsável são obrigatórios." },
      { status: 400 },
    );
  }

  const upd = await prisma.crianca.update({
    where: { id: Number(id) },
    data: {
      nomeCrianca,
      idade: Number.isFinite(Number(b?.idade)) ? Number(b.idade) : 0,
      endereco: String(b?.endereco ?? "").trim(),
      telefoneResponsavel,
      nomeResponsavel,
      alergias: b?.alergias ? String(b.alergias).trim() : null,
    },
  });
  return NextResponse.json(upd);
}

// Remove um check-in (corrigir engano).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.crianca.delete({ where: { id: Number(id) } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
