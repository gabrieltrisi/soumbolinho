import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verificarSessao, COOKIE } from "@/lib/session";

// Quem está logado (a partir do cookie de sessão).
export async function GET() {
  const token = (await cookies()).get(COOKIE)?.value;
  const sessao = token ? await verificarSessao(token) : null;
  return NextResponse.json({ usuario: sessao ? { nome: sessao.nome, role: sessao.role } : null });
}
