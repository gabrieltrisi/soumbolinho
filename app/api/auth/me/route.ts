import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verificarSessao, COOKIE } from "@/lib/session";

// Estado da sessão: se precisa criar o 1º acesso e quem está logado.
export async function GET() {
  const total = await prisma.funcionario.count();
  const token = (await cookies()).get(COOKIE)?.value;
  const sessao = token ? await verificarSessao(token) : null;
  return NextResponse.json({
    precisaSetup: total === 0,
    usuario: sessao ? { nome: sessao.nome, role: sessao.role } : null,
  });
}
