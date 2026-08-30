import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { assinarSessao, cookieOpts, COOKIE } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import { verifyPin } from "@/lib/pin";

// Comparação de tempo constante (evita timing attack).
function igual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Rate limiting por IP.
const JANELA_MIN = 15;
const MAX_FALHAS = 8;

function ipDaReq(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "desconhecido";
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const ip = ipDaReq(req);

  // Bloqueia se houver falhas demais recentes deste IP.
  const desde = new Date(Date.now() - JANELA_MIN * 60_000);
  const falhas = await prisma.acessoTentativa
    .count({ where: { ip, sucesso: false, criadoEm: { gte: desde } } })
    .catch(() => 0);
  if (falhas >= MAX_FALHAS) {
    await espera(400);
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
      { status: 429 },
    );
  }

  const U = process.env.APP_USUARIO ?? "";
  const S = process.env.APP_SENHA ?? "";
  const PIN = process.env.APP_PIN ?? "";

  const pin = String(b?.pin ?? "").trim();
  let ok = false;

  if (pin) {
    const cfg = await getConfig({ fresh: true });
    if (cfg.pinHash) {
      ok = await verifyPin(pin, cfg.pinHash); // PIN do banco tem prioridade
    } else if (PIN) {
      ok = igual(pin, PIN); // fallback do ambiente (recuperação)
    } else {
      return NextResponse.json({ error: "PIN não configurado no servidor." }, { status: 500 });
    }
  } else {
    const usuario = String(b?.usuario ?? "").trim().toLowerCase();
    const senha = String(b?.senha ?? "");
    if (!U || !S) return NextResponse.json({ error: "Login não configurado no servidor." }, { status: 500 });
    ok = igual(usuario, U.toLowerCase()) && igual(senha, S);
  }

  if (!ok) {
    await prisma.acessoTentativa.create({ data: { ip, sucesso: false } }).catch(() => {});
    await espera(400); // atrasa tentativas repetidas
    return NextResponse.json({ error: pin ? "PIN inválido." : "Usuário ou senha inválidos." }, { status: 401 });
  }

  // Sucesso: registra e faz uma poda oportunista dos registros antigos.
  // NÃO zeramos as falhas do IP no sucesso: isso deixaria um login por PIN limpar o
  // contador que também freia o brute-force da senha mestra no PATCH /api/config.
  // A janela deslizante de 15 min já expira as falhas sozinha.
  const umDiaAtras = new Date(Date.now() - 24 * 60 * 60_000);
  await Promise.all([
    prisma.acessoTentativa.create({ data: { ip, sucesso: true } }).catch(() => {}),
    prisma.acessoTentativa.deleteMany({ where: { criadoEm: { lt: umDiaAtras } } }).catch(() => {}),
  ]);

  const nome = U || "admin";
  const token = await assinarSessao({ sub: "1", nome, role: "admin" });
  const res = NextResponse.json({ ok: true, usuario: { nome, role: "admin" } });
  res.cookies.set(COOKIE, token, cookieOpts);
  return res;
}
