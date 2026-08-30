"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Cadastro" },
  { href: "/brinquedoteca", label: "Brinquedoteca" },
  { href: "/caixa", label: "Caixa" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/ajustes", label: "Ajustes" },
];

export default function TopNav() {
  const path = usePathname();
  const router = useRouter();
  const [usuario, setUsuario] = useState<{ nome: string; role: string } | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    if (path === "/login") return;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUsuario(d.usuario))
      .catch(() => {});
  }, [path]);

  // Fecha o menu ao trocar de rota.
  useEffect(() => {
    setMenuAberto(false);
  }, [path]);

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUsuario(null);
    router.replace("/login");
    router.refresh();
  }

  if (path === "/login") return null;

  const linkCls = (active: boolean) =>
    `rounded-full px-4 py-2 font-display text-[14px] font-semibold transition ${
      active ? "bg-rosa text-white shadow-[0_8px_20px_-10px_rgba(229,115,138,.9)]" : "text-ink-soft hover:bg-cream-2 hover:text-ink"
    }`;
  const ehAtivo = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-6 sm:py-4">
        <Link href="/" aria-label="Início" className="flex-none">
          <Image src="/logo.png" alt="Só um bolinho" width={1200} height={389} priority className="h-10 w-auto sm:h-14" />
        </Link>

        {/* Desktop: navegação horizontal */}
        <nav className="hidden items-center gap-1.5 lg:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={ehAtivo(l.href) ? "page" : undefined} className={linkCls(ehAtivo(l.href))}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop: usuário + sair */}
        <div className="hidden items-center gap-3 lg:flex">
          {usuario && (
            <span className="text-sm text-ink-soft">
              Olá, <b className="font-display text-ink">{usuario.nome}</b>
            </span>
          )}
          <button
            onClick={sair}
            className="rounded-full border border-line bg-white/60 px-4 py-1.5 font-display text-[13px] font-semibold text-ink-soft transition hover:border-rosa/50 hover:text-ink"
          >
            Sair
          </button>
        </div>

        {/* Mobile: botão do menu */}
        <button
          type="button"
          onClick={() => setMenuAberto((v) => !v)}
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuAberto}
          className="grid h-11 w-11 flex-none place-items-center rounded-full border border-line bg-white/60 text-ink transition hover:border-rosa/50 lg:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            {menuAberto ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile: dropdown */}
      {menuAberto && (
        <div className="border-t border-line/70 bg-cream px-5 pb-4 pt-2 lg:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={ehAtivo(l.href) ? "page" : undefined}
                className={`rounded-2xl px-4 py-3 font-display text-[15px] font-semibold transition ${
                  ehAtivo(l.href) ? "bg-rosa text-white" : "text-ink-soft hover:bg-cream-2 hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-3">
            {usuario && (
              <span className="text-sm text-ink-soft">
                Olá, <b className="font-display text-ink">{usuario.nome}</b>
              </span>
            )}
            <button
              onClick={sair}
              className="rounded-full border border-line bg-white/70 px-5 py-2 font-display text-[13px] font-semibold text-ink-soft transition hover:border-rosa/50 hover:text-ink"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
