import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashSenha } from "@/lib/senha";
import { assinarSessao, cookieOpts, COOKIE } from "@/lib/session";

// Cria o primeiro acesso (admin) — só funciona se ainda não houver nenhum funcionário.
export async function POST(req: NextRequest) {
  const total = await prisma.funcionario.count();
  if (total > 0) return NextResponse.json({ error: "Acesso já configurado." }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const nome = String(b?.nome ?? "").trim();
  const usuario = String(b?.usuario ?? "").trim().toLowerCase();
  const senha = String(b?.senha ?? "");
  if (!nome || !usuario || senha.length < 4) {
    return NextResponse.json({ error: "Preencha nome, usuário e uma senha (mín. 4 caracteres)." }, { status: 400 });
  }

  const f = await prisma.funcionario.create({
    data: { nome, usuario, senhaHash: await hashSenha(senha), role: "admin" },
  });
  const token = await assinarSessao({ sub: String(f.id), nome: f.nome, role: f.role });
  const res = NextResponse.json({ ok: true, usuario: { nome: f.nome, role: f.role } });
  res.cookies.set(COOKIE, token, cookieOpts);
  return res;
}
