"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Cadastro" },
  { href: "/brinquedoteca", label: "Brinquedoteca" },
  { href: "/caixa", label: "Caixa" },
];

export default function TopNav() {
  const path = usePathname();
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
        <div className="hidden text-right sm:block">
          <div className="font-display text-[15px] font-semibold text-rosa">Brinquedoteca</div>
          <div className="text-[12px] text-ink-soft">R$ 25,00/hora · R$ 2,00/min excedente</div>
        </div>
      </div>
    </header>
  );
}
