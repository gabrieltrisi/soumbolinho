// Configuração da recepção (preços, capacidade, PIN) — fonte da verdade no banco,
// com fallback pro ambiente. Só deve ser importado por código de servidor (usa Prisma).
import { prisma } from "@/lib/prisma";
import { PRECOS_PADRAO } from "@/lib/billing";

export type Config = {
  valorHora: number;
  valorMinExcedente: number;
  capacidade: number;
  pinHash: string | null;
};

let cache: { v: Config; exp: number } | null = null;

function envNum(s: string | undefined, def: number): number {
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : def;
}

export async function getConfig(): Promise<Config> {
  if (cache && cache.exp > Date.now()) return cache.v;

  let row: { valorHora: number; valorMinExcedente: number; capacidade: number; pinHash: string | null } | null = null;
  try {
    row = await prisma.configuracao.findUnique({ where: { id: 1 } });
  } catch {
    // tabela ainda não existe (código no ar antes da migration) → cai no fallback do ambiente
  }

  const v: Config = {
    valorHora: row?.valorHora ?? envNum(process.env.APP_VALOR_HORA, PRECOS_PADRAO.valorHora),
    valorMinExcedente:
      row?.valorMinExcedente ?? envNum(process.env.APP_VALOR_MIN_EXCEDENTE, PRECOS_PADRAO.valorMinExcedente),
    capacidade: row?.capacidade ?? envNum(process.env.APP_CAPACIDADE, 25),
    pinHash: row?.pinHash ?? null,
  };

  cache = { v, exp: Date.now() + 30_000 };
  return v;
}

export function invalidarConfig() {
  cache = null;
}
