import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { assinarSessao, cookieOpts, COOKIE } from "@/lib/session";

// Comparação de tempo constante (evita timing attack).
function igual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));

  const U = process.env.APP_USUARIO ?? "";
  const S = process.env.APP_SENHA ?? "";
  const PIN = process.env.APP_PIN ?? "";

  const pin = String(b?.pin ?? "").trim();
  let ok = false;

  if (pin) {
    if (!PIN) return NextResponse.json({ error: "PIN não configurado no servidor." }, { status: 500 });
    ok = igual(pin, PIN);
  } else {
    const usuario = String(b?.usuario ?? "").trim().toLowerCase();
    const senha = String(b?.senha ?? "");
    if (!U || !S) return NextResponse.json({ error: "Login não configurado no servidor." }, { status: 500 });
    ok = igual(usuario, U.toLowerCase()) && igual(senha, S);
  }

  if (!ok) {
    await espera(400); // atrasa tentativas repetidas (freio simples a força bruta)
    return NextResponse.json({ error: pin ? "PIN inválido." : "Usuário ou senha inválidos." }, { status: 401 });
  }

  const nome = U || "admin";
  const token = await assinarSessao({ sub: "1", nome, role: "admin" });
  const res = NextResponse.json({ ok: true, usuario: { nome, role: "admin" } });
  res.cookies.set(COOKIE, token, cookieOpts);
  return res;
}
