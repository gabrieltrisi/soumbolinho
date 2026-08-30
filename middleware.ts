import { NextRequest, NextResponse } from "next/server";
import { verificarSessao, COOKIE } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE)?.value;
  const sessao = token ? await verificarSessao(token) : null;

  // rotas de auth sempre liberadas
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // backup via cron: a própria rota valida o CRON_SECRET (o cron não envia cookie)
  if (pathname === "/api/backup/run") return NextResponse.next();

  // /login: se já logado, vai pra home
  if (pathname === "/login") {
    return sessao ? NextResponse.redirect(new URL("/", req.url)) : NextResponse.next();
  }

  // resto exige sessão
  if (!sessao) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|logo.png|manifest.webmanifest|sw.js|offline.html|icon-192.png|icon-512.png|icon-maskable.png).*)",
  ],
};
