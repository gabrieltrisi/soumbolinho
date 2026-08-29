import { NextResponse } from "next/server";

// Configurações públicas da recepção (lidas do ambiente).
export async function GET() {
  const capacidade = Number(process.env.APP_CAPACIDADE ?? 25);
  return NextResponse.json({ capacidade: Number.isFinite(capacidade) && capacidade > 0 ? capacidade : 25 });
}
