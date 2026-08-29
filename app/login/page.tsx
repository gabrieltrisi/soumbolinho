"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, senha }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? "Não foi possível entrar.");
      }
      router.replace("/");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setEnviando(false);
    }
  }

  const inputCls =
    "w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-[15px] text-ink placeholder:text-ink-soft/70 transition focus:border-rosa focus:bg-white";
  const labelCls = "mb-1.5 block font-display text-[13px] font-semibold text-ink";

  return (
    <div className="grid min-h-screen place-items-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Image src="/logo.png" alt="Só um bolinho" width={1200} height={389} priority className="h-16 w-auto" />
        </div>

        <div className="rounded-3xl border border-line bg-cream-2/60 p-7 shadow-[0_12px_44px_-24px_rgba(90,69,81,.6)]">
          <h1 className="font-display text-2xl font-bold text-ink">Entrar</h1>
          <p className="mt-1 text-sm text-ink-soft">Acesse com seu usuário e senha.</p>

          <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
            <div>
              <label className={labelCls}>Usuário</label>
              <input className={inputCls} value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="usuário" autoCapitalize="none" autoComplete="username" required />
            </div>
            <div>
              <label className={labelCls}>Senha</label>
              <input className={inputCls} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="sua senha" autoComplete="current-password" required />
            </div>

            {erro && <div className="rounded-2xl bg-rosa/15 px-4 py-2.5 text-sm font-semibold text-rosa-deep">{erro}</div>}

            <button type="submit" disabled={enviando} className="mt-1 rounded-full bg-rosa px-6 py-3.5 font-display text-[16px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(229,115,138,.9)] transition hover:bg-rosa-deep disabled:opacity-60">
              {enviando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[12px] text-ink-soft">Só um Bolinho · Brinquedoteca</p>
      </div>
    </div>
  );
}
