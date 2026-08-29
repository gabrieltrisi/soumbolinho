import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { assinarSessao, cookieOpts, COOKIE } from "@/lib/session";

// Comparação de tempo constante (evita timing attack na senha).
function igual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const usuario = String(b?.usuario ?? "").trim().toLowerCase();
  const senha = String(b?.senha ?? "");

  const U = (process.env.APP_USUARIO ?? "").toLowerCase();
  const S = process.env.APP_SENHA ?? "";
  if (!U || !S) {
    return NextResponse.json({ error: "Login não configurado no servidor." }, { status: 500 });
  }

  if (!igual(usuario, U) || !igual(senha, S)) {
    return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 });
  }

  const token = await assinarSessao({ sub: "1", nome: process.env.APP_USUARIO ?? U, role: "admin" });
  const res = NextResponse.json({ ok: true, usuario: { nome: process.env.APP_USUARIO ?? U, role: "admin" } });
  res.cookies.set(COOKIE, token, cookieOpts);
  return res;
}
