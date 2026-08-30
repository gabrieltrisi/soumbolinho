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

  useEffect(() => {
    if (path === "/login") return;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUsuario(d.usuario))
      .catch(() => {});
  }, [path]);

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUsuario(null);
    router.replace("/login");
    router.refresh();
  }

  if (path === "/login") return null;

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <Link href="/" aria-label="Início">
            <Image src="/logo.png" alt="Só um bolinho" width={1200} height={389} priority className="h-11 w-auto sm:h-14" />
          </Link>
          <nav className="flex items-center gap-1.5">
            {LINKS.map((l) => {
              const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-4 py-2 font-display text-[14px] font-semibold transition ${
                    active ? "bg-rosa text-white shadow-[0_8px_20px_-10px_rgba(229,115,138,.9)]" : "text-ink-soft hover:bg-cream-2 hover:text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
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
      </div>
    </header>
  );
}
