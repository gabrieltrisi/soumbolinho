import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { conferirSenha } from "@/lib/senha";
import { assinarSessao, cookieOpts, COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const usuario = String(b?.usuario ?? "").trim().toLowerCase();
  const senha = String(b?.senha ?? "");

  const f = await prisma.funcionario.findUnique({ where: { usuario } });
  if (!f || !(await conferirSenha(senha, f.senhaHash))) {
    return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 });
  }

  const token = await assinarSessao({ sub: String(f.id), nome: f.nome, role: f.role });
  const res = NextResponse.json({ ok: true, usuario: { nome: f.nome, role: f.role } });
  res.cookies.set(COOKIE, token, cookieOpts);
  return res;
}
