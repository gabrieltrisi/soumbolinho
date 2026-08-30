import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { getConfig, invalidarConfig } from "@/lib/config";
import { hashPin } from "@/lib/pin";
import { verificarSessao, COOKIE } from "@/lib/session";

function igual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
const JANELA_MIN = 15;
const MAX_FALHAS = 8;
function ipDaReq(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "desconhecido";
}

// Configurações da recepção (após login): capacidade + preços vigentes. Nunca expõe pinHash.
export async function GET() {
  const c = await getConfig();
  return NextResponse.json({ capacidade: c.capacidade, valorHora: c.valorHora, valorMinExcedente: c.valorMinExcedente });
}

// Grava ajustes. Exige sessão (middleware) + reautenticação com a SENHA MESTRA (APP_SENHA).
// O PIN não autoriza escrita de config — continua credencial de balcão.
export async function PATCH(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const ip = ipDaReq(req);

  // Freio a força bruta da senha mestra (mesma tabela do login).
  const desde = new Date(Date.now() - JANELA_MIN * 60_000);
  const falhas = await prisma.acessoTentativa
    .count({ where: { ip, sucesso: false, criadoEm: { gte: desde } } })
    .catch(() => 0);
  if (falhas >= MAX_FALHAS) {
    await espera(400);
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }

  const S = process.env.APP_SENHA ?? "";
  const senhaMestra = String(b?.senhaMestra ?? "");
  if (!S || !igual(senhaMestra, S)) {
    await prisma.acessoTentativa.create({ data: { ip, sucesso: false } }).catch(() => {});
    await espera(400);
    return NextResponse.json({ error: "Senha mestra inválida." }, { status: 401 });
  }

  const dados: { valorHora?: number; valorMinExcedente?: number; capacidade?: number; pinHash?: string } = {};

  if (b?.valorHora != null) {
    const v = Number(b.valorHora);
    if (!Number.isFinite(v) || v <= 0) return NextResponse.json({ error: "Valor por hora inválido." }, { status: 400 });
    dados.valorHora = Math.round(v * 100) / 100;
  }
  if (b?.valorMinExcedente != null) {
    const v = Number(b.valorMinExcedente);
    if (!Number.isFinite(v) || v < 0)
      return NextResponse.json({ error: "Valor do minuto excedente inválido." }, { status: 400 });
    dados.valorMinExcedente = Math.round(v * 100) / 100;
  }
  if (b?.capacidade != null) {
    const v = Number(b.capacidade);
    if (!Number.isInteger(v) || v < 1 || v > 500)
      return NextResponse.json({ error: "Capacidade inválida (1 a 500)." }, { status: 400 });
    dados.capacidade = v;
  }
  if (b?.novoPin != null && String(b.novoPin).trim() !== "") {
    const pin = String(b.novoPin).trim();
    if (!/^\d{4,8}$/.test(pin)) return NextResponse.json({ error: "PIN deve ter de 4 a 8 dígitos." }, { status: 400 });
    dados.pinHash = await hashPin(pin);
  }

  const token = req.cookies.get(COOKIE)?.value;
  const sessao = token ? await verificarSessao(token) : null;
  const atualizadoPor = sessao?.nome ?? null;

  // Se ainda não há linha, o create herda a config vigente (env) nos campos omitidos —
  // não deixa o default do schema sobrescrever um preço definido por ambiente.
  const atual = await getConfig();
  const row = await prisma.configuracao.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      valorHora: dados.valorHora ?? atual.valorHora,
      valorMinExcedente: dados.valorMinExcedente ?? atual.valorMinExcedente,
      capacidade: dados.capacidade ?? atual.capacidade,
      pinHash: dados.pinHash ?? atual.pinHash ?? undefined,
      atualizadoPor,
    },
    update: { ...dados, atualizadoPor },
  });
  invalidarConfig();
  await prisma.acessoTentativa.deleteMany({ where: { ip, sucesso: false } }).catch(() => {});

  return NextResponse.json({
    ok: true,
    valorHora: row.valorHora,
    valorMinExcedente: row.valorMinExcedente,
    capacidade: row.capacidade,
    pinDefinido: !!row.pinHash,
  });
}
