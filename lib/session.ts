import { SignJWT, jwtVerify } from "jose";

export const COOKIE = "sb_sessao";
export const MAX_AGE = 60 * 60 * 12; // 12 horas

export type Sessao = { sub: string; nome: string; role: string };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET não configurado");
  return new TextEncoder().encode(s);
}

export async function assinarSessao(s: Sessao) {
  return new SignJWT({ nome: s.nome, role: s.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(s.sub)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());
}

export async function verificarSessao(token: string): Promise<Sessao | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      sub: String(payload.sub ?? ""),
      nome: String(payload.nome ?? ""),
      role: String(payload.role ?? "atendente"),
    };
  } catch {
    return null;
  }
}

export const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};
